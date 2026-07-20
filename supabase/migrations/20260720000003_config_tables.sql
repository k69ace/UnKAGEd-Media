-- Organization-level configuration: tax rules (per-category, never a
-- single blanket rate), event types, service styles, staffing roles, and
-- the org-wide settings that drive approval thresholds and default
-- service-charge/gratuity behavior. All configurable per org/jurisdiction
-- per the module spec — nothing here is hardcoded globally.

create type line_item_category as enum (
  'menu_item', 'package', 'beverage', 'alcohol', 'rental', 'linen',
  'delivery', 'setup', 'pickup', 'travel', 'staffing', 'admin_fee',
  'service_charge', 'other'
);

create table tax_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  rate numeric(7,4) not null check (rate >= 0 and rate <= 1),
  applies_by_default_to_category line_item_category,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tax_rules_organization_id_idx on tax_rules(organization_id);

create table event_types (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  unique (organization_id, name)
);

create table service_styles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  unique (organization_id, name)
);

create table staffing_roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  default_rate_per_hour numeric(10,2),
  default_ratio_guests_per_staff numeric(6,2),
  is_active boolean not null default true,
  unique (organization_id, name)
);

-- One settings row per organization. Service charge / gratuity are
-- deliberately separate configs (never merged) — each has its own base
-- and its own taxability, driven by the tax_rules table via
-- service_charge_tax_rule_id / gratuity_tax_rule_id (nullable = not taxed).
create table organization_settings (
  organization_id uuid primary key references organizations(id) on delete cascade,
  default_profit_target_percent numeric(7,4),
  approval_threshold_amount numeric(12,2),
  approval_below_margin_percent numeric(7,4),
  chef_review_required boolean not null default false,
  service_charge_enabled boolean not null default false,
  service_charge_type text check (service_charge_type in ('flat', 'percent')),
  service_charge_value numeric(12,4),
  service_charge_base text not null default 'discounted_subtotal'
    check (service_charge_base in ('discounted_subtotal', 'discounted_subtotal_excluding_alcohol')),
  service_charge_tax_rule_id uuid references tax_rules(id) on delete set null,
  gratuity_enabled boolean not null default false,
  gratuity_type text check (gratuity_type in ('flat', 'percent')),
  gratuity_value numeric(12,4),
  gratuity_base text not null default 'discounted_subtotal'
    check (gratuity_base in ('discounted_subtotal', 'discounted_subtotal_excluding_alcohol', 'discounted_subtotal_plus_service_charge')),
  gratuity_tax_rule_id uuid references tax_rules(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table tax_rules enable row level security;
alter table event_types enable row level security;
alter table service_styles enable row level security;
alter table staffing_roles enable row level security;
alter table organization_settings enable row level security;

create policy tax_rules_select on tax_rules
  for select using (organization_id = current_organization_id());
create policy tax_rules_admin_write on tax_rules
  for all using (organization_id = current_organization_id() and is_org_admin_or_owner())
  with check (organization_id = current_organization_id() and is_org_admin_or_owner());

create policy event_types_select on event_types
  for select using (organization_id = current_organization_id());
create policy event_types_admin_write on event_types
  for all using (organization_id = current_organization_id() and is_org_admin_or_owner())
  with check (organization_id = current_organization_id() and is_org_admin_or_owner());

create policy service_styles_select on service_styles
  for select using (organization_id = current_organization_id());
create policy service_styles_admin_write on service_styles
  for all using (organization_id = current_organization_id() and is_org_admin_or_owner())
  with check (organization_id = current_organization_id() and is_org_admin_or_owner());

create policy staffing_roles_select on staffing_roles
  for select using (organization_id = current_organization_id());
create policy staffing_roles_admin_write on staffing_roles
  for all using (organization_id = current_organization_id() and is_org_admin_or_owner())
  with check (organization_id = current_organization_id() and is_org_admin_or_owner());

create policy organization_settings_select on organization_settings
  for select using (organization_id = current_organization_id());
create policy organization_settings_admin_write on organization_settings
  for all using (organization_id = current_organization_id() and is_org_admin_or_owner())
  with check (organization_id = current_organization_id() and is_org_admin_or_owner());

-- Seed sane defaults for a brand-new organization so the estimator is
-- usable immediately without an admin visiting Settings first.
create function seed_organization_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into organization_settings (organization_id) values (new.id);

  insert into event_types (organization_id, name, sort_order) values
    (new.id, 'Wedding', 1),
    (new.id, 'Corporate', 2),
    (new.id, 'Private Party', 3),
    (new.id, 'Drop-off', 4);

  insert into service_styles (organization_id, name, sort_order) values
    (new.id, 'Plated', 1),
    (new.id, 'Buffet', 2),
    (new.id, 'Family-Style', 3),
    (new.id, 'Stations', 4),
    (new.id, 'Drop-off', 5);

  insert into staffing_roles (organization_id, name, default_rate_per_hour, default_ratio_guests_per_staff) values
    (new.id, 'Server', 25.00, 15),
    (new.id, 'Bartender', 30.00, 50),
    (new.id, 'Captain', 35.00, 100),
    (new.id, 'Chef', 40.00, null);

  return new;
end;
$$;

create trigger on_organization_created
  after insert on organizations
  for each row execute function seed_organization_defaults();
