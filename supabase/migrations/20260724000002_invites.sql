-- Closes the "no invite-to-existing-org flow" gap noted since migration
-- 001: previously a new sign-up always created its own organization, and
-- moving a stray sign-up into an existing org required a direct SQL edit
-- (documented in the admin guide). This adds a real invite flow: an org
-- admin generates a token tied to their org + a role, and a new sign-up
-- that presents a valid token joins that org with that role instead of
-- creating a new one.

create table invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  email text,
  role app_role not null default 'sales_manager',
  token text not null,
  created_by uuid references profiles(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index invites_organization_id_idx on invites(organization_id);
create unique index invites_token_idx on invites(token);

alter table invites enable row level security;

-- Org admins manage invites for their own org through the normal
-- authenticated session. There is deliberately no policy granting
-- anonymous/pre-auth select: validating a token during sign-up (before any
-- session exists) is exactly the "genuinely needs to bypass RLS" case the
-- service-role client exists for (see src/lib/supabase/server.ts /
-- CATERING_ESTIMATOR.md's "why no service-role usage" section, now with
-- its first real use). Revoke sets revoked_at rather than deleting, same
-- pattern as tax rules/event types/etc.
create policy invites_select on invites
  for select using (organization_id = current_organization_id() and is_org_admin_or_owner());
create policy invites_insert on invites
  for insert with check (organization_id = current_organization_id() and is_org_admin_or_owner());
create policy invites_update on invites
  for update using (organization_id = current_organization_id() and is_org_admin_or_owner())
  with check (organization_id = current_organization_id() and is_org_admin_or_owner());

-- Teach the auto-provision trigger to honor an invite token instead of
-- always creating a new org. The token travels through
-- auth.signUp()'s user_metadata (raw_user_meta_data), set by the
-- application only after it has already validated the invite itself via
-- the service-role client -- this trigger re-checks validity anyway
-- (expiry/revocation/already-accepted can change between page load and
-- submit) and falls back to the original create-a-new-org behavior if the
-- token doesn't resolve to a still-valid invite, so a signup can never be
-- left without a profile row.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  invite_token text;
  matched_invite invites%rowtype;
begin
  invite_token := new.raw_user_meta_data->>'invite_token';

  if invite_token is not null then
    select * into matched_invite from invites
      where token = invite_token
        and accepted_at is null
        and revoked_at is null
        and expires_at > now()
      limit 1;
  end if;

  if matched_invite.id is not null then
    insert into profiles (id, organization_id, role, full_name, email)
    values (
      new.id,
      matched_invite.organization_id,
      matched_invite.role,
      coalesce(new.raw_user_meta_data->>'full_name', new.email),
      new.email
    );
    update invites set accepted_at = now() where id = matched_invite.id;
  else
    insert into organizations (name) values (coalesce(new.raw_user_meta_data->>'organization_name', new.email))
      returning id into new_org_id;

    insert into profiles (id, organization_id, role, full_name, email)
    values (
      new.id,
      new_org_id,
      'sales_manager',
      coalesce(new.raw_user_meta_data->>'full_name', new.email),
      new.email
    );
  end if;
  return new;
end;
$$;
