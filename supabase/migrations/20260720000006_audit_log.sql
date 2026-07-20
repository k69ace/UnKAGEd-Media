-- Append-only audit log. No shared platform audit log existed in this repo
-- (confirmed in AUDIT_CATERING.md), so this is net-new. Rows are written
-- only by SECURITY DEFINER trigger functions, never by direct client
-- insert/update/delete — this makes the log tamper-resistant against a
-- compromised or buggy client, not just a convention the app happens to
-- follow.

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  actor_id uuid references profiles(id) on delete set null,
  changes jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_organization_id_idx on audit_log(organization_id);
create index audit_log_entity_idx on audit_log(entity_type, entity_id);

alter table audit_log enable row level security;

create policy audit_log_select on audit_log
  for select using (organization_id = current_organization_id());
-- Deliberately no insert/update/delete policy for regular roles: RLS
-- default-denies all writes from the client, and the SECURITY DEFINER
-- trigger functions below bypass RLS entirely to write rows.

create function log_estimate_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into audit_log (organization_id, entity_type, entity_id, action, actor_id, changes)
    values (
      new.organization_id,
      'catering_estimate',
      new.id,
      case when tg_op = 'INSERT' then 'created' else 'status_changed' end,
      new.updated_by,
      jsonb_build_object(
        'from_status', case when tg_op = 'INSERT' then null else old.status end,
        'to_status', new.status
      )
    );
  end if;

  -- Post-approval edit: any change to an already-approved estimate's
  -- pricing-relevant fields gets its own audit entry distinct from a
  -- plain status change, since the spec requires this to be traceable
  -- and to trigger the version-on-edit workflow at the application layer.
  if tg_op = 'UPDATE' and old.status in ('approved', 'won')
     and (
       new.discount_amount is distinct from old.discount_amount
       or new.guest_count_guaranteed is distinct from old.guest_count_guaranteed
       or new.deposit_amount is distinct from old.deposit_amount
     ) then
    insert into audit_log (organization_id, entity_type, entity_id, action, actor_id, changes)
    values (
      new.organization_id,
      'catering_estimate',
      new.id,
      'post_approval_edit',
      new.updated_by,
      jsonb_build_object(
        'discount_amount', jsonb_build_object('from', old.discount_amount, 'to', new.discount_amount),
        'guest_count_guaranteed', jsonb_build_object('from', old.guest_count_guaranteed, 'to', new.guest_count_guaranteed),
        'deposit_amount', jsonb_build_object('from', old.deposit_amount, 'to', new.deposit_amount)
      )
    );
  end if;

  return new;
end;
$$;

create trigger on_estimate_audit
  after insert or update on catering_estimates
  for each row execute function log_estimate_status_change();
