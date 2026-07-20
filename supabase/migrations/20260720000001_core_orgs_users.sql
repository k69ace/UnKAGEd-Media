-- Core multi-tenant model: organizations, locations, profiles (extends
-- auth.users), and the app_role enum used throughout the module.

create type app_role as enum (
  'catering_admin',      -- manages packages, pricing, tax rules, staffing ratios
  'manager_owner',       -- approves estimates above threshold, reviews margin
  'sales_manager',       -- builds estimates, sends proposals, tracks pipeline
  'chef',                -- optional feasibility review step
  'reporting_readonly'   -- views pipeline/history only
);

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  address text,
  timezone text not null default 'America/Chicago',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index locations_organization_id_idx on locations(organization_id);

-- One row per auth.users user. Created automatically by the trigger below.
-- location_id is nullable: org-wide roles (admin, owner) may not be scoped
-- to a single location; sales/chef roles are typically location-scoped.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  location_id uuid references locations(id) on delete set null,
  role app_role not null,
  full_name text not null,
  email text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_organization_id_idx on profiles(organization_id);
create index profiles_location_id_idx on profiles(location_id);

-- Helper used by RLS policies across every catering table: the caller's
-- own organization_id, read from their profile row. SECURITY DEFINER so it
-- can read profiles regardless of the caller's own profile RLS policy,
-- STABLE so Postgres can cache it once per statement.
create function current_organization_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select organization_id from profiles where id = auth.uid();
$$;

create function current_app_role()
returns app_role
language sql
security definer
stable
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

create function is_org_admin_or_owner()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select current_app_role() in ('catering_admin', 'manager_owner');
$$;

alter table organizations enable row level security;
alter table locations enable row level security;
alter table profiles enable row level security;

create policy organizations_select on organizations
  for select using (id = current_organization_id());
create policy organizations_update on organizations
  for update using (id = current_organization_id() and is_org_admin_or_owner());

create policy locations_select on locations
  for select using (organization_id = current_organization_id());
create policy locations_write on locations
  for all using (organization_id = current_organization_id() and is_org_admin_or_owner())
  with check (organization_id = current_organization_id() and is_org_admin_or_owner());

create policy profiles_select on profiles
  for select using (organization_id = current_organization_id());
create policy profiles_update_self on profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());
create policy profiles_admin_write on profiles
  for all using (organization_id = current_organization_id() and is_org_admin_or_owner())
  with check (organization_id = current_organization_id() and is_org_admin_or_owner());

-- Auto-provision a profile row when a new auth user is created. New users
-- default to sales_manager in a brand-new organization named after their
-- email until an admin reassigns them — MVP-simple, documented in
-- Known Limitations (no invite-to-existing-org flow yet).
create function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
begin
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
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
