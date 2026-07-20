-- The core estimate model: CateringEstimate, its line items, staffing
-- lines, and a guest-count history table (guaranteed count changes are
-- auditable for billing disputes per spec).

create type estimate_status as enum (
  'draft', 'sent', 'approved', 'won', 'lost', 'cancelled'
);

create table catering_estimates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  location_id uuid references locations(id) on delete set null,
  customer_id uuid not null references customers(id) on delete restrict,
  contact_id uuid references contacts(id) on delete set null,

  event_date date,
  event_start_time time,
  event_end_time time,
  venue_name text,
  venue_address text,
  event_type_id uuid references event_types(id) on delete set null,
  service_style_id uuid references service_styles(id) on delete set null,

  guest_count_estimated int check (guest_count_estimated is null or guest_count_estimated > 0),
  guest_count_guaranteed int check (guest_count_guaranteed is null or guest_count_guaranteed > 0),

  status estimate_status not null default 'draft',
  version int not null default 1,
  previous_version_id uuid references catering_estimates(id) on delete set null,

  profit_target_percent numeric(7,4),
  deposit_amount numeric(12,2),
  deposit_due_date date,
  payment_schedule_json jsonb not null default '[]'::jsonb,
  minimum_spend_required numeric(12,2),
  discount_amount numeric(12,2) not null default 0 check (discount_amount >= 0),
  discount_reason text,

  internal_notes text,
  customer_facing_notes text,

  approved_by uuid references profiles(id) on delete set null,
  approved_at timestamptz,

  created_by uuid references profiles(id) on delete set null,
  updated_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index catering_estimates_organization_id_idx on catering_estimates(organization_id);
create index catering_estimates_customer_id_idx on catering_estimates(customer_id);
create index catering_estimates_status_idx on catering_estimates(organization_id, status);
create index catering_estimates_previous_version_id_idx on catering_estimates(previous_version_id);

create table catering_estimate_line_items (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references catering_estimates(id) on delete cascade,
  category line_item_category not null,
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit text not null default 'each',
  unit_price numeric(12,2) not null default 0,
  unit_cost numeric(12,2),
  is_taxable boolean not null default true,
  tax_rule_id uuid references tax_rules(id) on delete set null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index catering_estimate_line_items_estimate_id_idx on catering_estimate_line_items(estimate_id);

create table catering_estimate_staffing (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references catering_estimates(id) on delete cascade,
  staffing_role_id uuid not null references staffing_roles(id) on delete restrict,
  quantity numeric(6,2) not null default 1,
  hours numeric(6,2) not null default 0,
  rate_per_hour numeric(10,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index catering_estimate_staffing_estimate_id_idx on catering_estimate_staffing(estimate_id);

-- Guaranteed/estimated guest count history — every change to either count
-- is recorded with who/when, independent of the general audit log, since
-- this is the field most likely to matter in a billing dispute.
create table catering_estimate_guest_count_history (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references catering_estimates(id) on delete cascade,
  guest_count_estimated int,
  guest_count_guaranteed int,
  changed_by uuid references profiles(id) on delete set null,
  changed_at timestamptz not null default now()
);
create index catering_estimate_guest_count_history_estimate_id_idx
  on catering_estimate_guest_count_history(estimate_id);

alter table catering_estimates enable row level security;
alter table catering_estimate_line_items enable row level security;
alter table catering_estimate_staffing enable row level security;
alter table catering_estimate_guest_count_history enable row level security;

-- Read: everyone in the org (reporting_readonly included).
create policy catering_estimates_select on catering_estimates
  for select using (organization_id = current_organization_id());

-- Insert/update: sales_manager, catering_admin, manager_owner, chef can all
-- touch an estimate (chef flags feasibility concerns via internal_notes);
-- reporting_readonly cannot write. Approval fields (status -> approved,
-- approved_by/approved_at) are additionally enforced in the application
-- layer against the org's approval-threshold settings — RLS here is the
-- coarse role gate, not the fine-grained approval-threshold check.
create policy catering_estimates_write on catering_estimates
  for insert with check (
    organization_id = current_organization_id()
    and current_app_role() <> 'reporting_readonly'
  );
create policy catering_estimates_update on catering_estimates
  for update using (
    organization_id = current_organization_id()
    and current_app_role() <> 'reporting_readonly'
  )
  with check (
    organization_id = current_organization_id()
    and current_app_role() <> 'reporting_readonly'
  );
create policy catering_estimates_delete on catering_estimates
  for delete using (
    organization_id = current_organization_id()
    and is_org_admin_or_owner()
  );

create policy catering_estimate_line_items_select on catering_estimate_line_items
  for select using (
    exists (select 1 from catering_estimates e
      where e.id = estimate_id and e.organization_id = current_organization_id())
  );
create policy catering_estimate_line_items_write on catering_estimate_line_items
  for all using (
    current_app_role() <> 'reporting_readonly'
    and exists (select 1 from catering_estimates e
      where e.id = estimate_id and e.organization_id = current_organization_id())
  )
  with check (
    current_app_role() <> 'reporting_readonly'
    and exists (select 1 from catering_estimates e
      where e.id = estimate_id and e.organization_id = current_organization_id())
  );

create policy catering_estimate_staffing_select on catering_estimate_staffing
  for select using (
    exists (select 1 from catering_estimates e
      where e.id = estimate_id and e.organization_id = current_organization_id())
  );
create policy catering_estimate_staffing_write on catering_estimate_staffing
  for all using (
    current_app_role() <> 'reporting_readonly'
    and exists (select 1 from catering_estimates e
      where e.id = estimate_id and e.organization_id = current_organization_id())
  )
  with check (
    current_app_role() <> 'reporting_readonly'
    and exists (select 1 from catering_estimates e
      where e.id = estimate_id and e.organization_id = current_organization_id())
  );

create policy catering_estimate_guest_count_history_select on catering_estimate_guest_count_history
  for select using (
    exists (select 1 from catering_estimates e
      where e.id = estimate_id and e.organization_id = current_organization_id())
  );
create policy catering_estimate_guest_count_history_insert on catering_estimate_guest_count_history
  for insert with check (
    current_app_role() <> 'reporting_readonly'
    and exists (select 1 from catering_estimates e
      where e.id = estimate_id and e.organization_id = current_organization_id())
  );

-- Record guest-count history automatically whenever either count changes.
create function record_guest_count_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT'
     or new.guest_count_estimated is distinct from old.guest_count_estimated
     or new.guest_count_guaranteed is distinct from old.guest_count_guaranteed then
    insert into catering_estimate_guest_count_history
      (estimate_id, guest_count_estimated, guest_count_guaranteed, changed_by)
    values (new.id, new.guest_count_estimated, new.guest_count_guaranteed, new.updated_by);
  end if;
  return new;
end;
$$;

create trigger on_estimate_guest_count_change
  after insert or update on catering_estimates
  for each row execute function record_guest_count_change();

create function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger catering_estimates_set_updated_at
  before update on catering_estimates
  for each row execute function set_updated_at();
create trigger catering_estimate_line_items_set_updated_at
  before update on catering_estimate_line_items
  for each row execute function set_updated_at();
create trigger catering_estimate_staffing_set_updated_at
  before update on catering_estimate_staffing
  for each row execute function set_updated_at();
