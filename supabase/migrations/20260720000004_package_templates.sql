-- Reusable package definitions to speed up estimate creation. A template
-- carries a set of default line items that get copied onto an estimate
-- when the sales manager applies it (copied, not referenced, so later
-- edits to the template never retroactively change a sent/approved
-- estimate).

create table catering_package_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text,
  base_per_person_price numeric(12,2),
  service_style_id uuid references service_styles(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id) on delete set null
);
create index catering_package_templates_organization_id_idx on catering_package_templates(organization_id);

create table catering_package_template_line_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references catering_package_templates(id) on delete cascade,
  category line_item_category not null,
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit text not null default 'each',
  unit_price numeric(12,2) not null default 0,
  unit_cost numeric(12,2),
  is_taxable boolean not null default true,
  tax_rule_id uuid references tax_rules(id) on delete set null,
  sort_order int not null default 0
);
create index catering_package_template_line_items_template_id_idx
  on catering_package_template_line_items(template_id);

alter table catering_package_templates enable row level security;
alter table catering_package_template_line_items enable row level security;

create policy catering_package_templates_select on catering_package_templates
  for select using (organization_id = current_organization_id());
create policy catering_package_templates_admin_write on catering_package_templates
  for all using (organization_id = current_organization_id() and is_org_admin_or_owner())
  with check (organization_id = current_organization_id() and is_org_admin_or_owner());

create policy catering_package_template_line_items_select on catering_package_template_line_items
  for select using (
    exists (
      select 1 from catering_package_templates t
      where t.id = template_id and t.organization_id = current_organization_id()
    )
  );
create policy catering_package_template_line_items_admin_write on catering_package_template_line_items
  for all using (
    is_org_admin_or_owner() and exists (
      select 1 from catering_package_templates t
      where t.id = template_id and t.organization_id = current_organization_id()
    )
  )
  with check (
    is_org_admin_or_owner() and exists (
      select 1 from catering_package_templates t
      where t.id = template_id and t.organization_id = current_organization_id()
    )
  );
