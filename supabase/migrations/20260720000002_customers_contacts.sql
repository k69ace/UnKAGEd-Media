-- Shared Customer/Contact model. One customer can have multiple contacts
-- (e.g. a company with several event planners); an estimate references
-- both the customer and the specific contact it was built for.

create table customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  company_name text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id) on delete set null
);
create index customers_organization_id_idx on customers(organization_id);

create table contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index contacts_customer_id_idx on contacts(customer_id);
create index contacts_organization_id_idx on contacts(organization_id);

alter table customers enable row level security;
alter table contacts enable row level security;

create policy customers_select on customers
  for select using (organization_id = current_organization_id());
create policy customers_write on customers
  for all using (organization_id = current_organization_id() and current_app_role() <> 'reporting_readonly')
  with check (organization_id = current_organization_id() and current_app_role() <> 'reporting_readonly');

create policy contacts_select on contacts
  for select using (organization_id = current_organization_id());
create policy contacts_write on contacts
  for all using (organization_id = current_organization_id() and current_app_role() <> 'reporting_readonly')
  with check (organization_id = current_organization_id() and current_app_role() <> 'reporting_readonly');
