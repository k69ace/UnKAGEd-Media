-- Demo seed data for the Catering Estimator.
--
-- Run this AFTER at least one real user has signed up through
-- /estimator/login (sign-up creates the organization + a profile, and
-- seeds default tax rules/event types/service styles/staffing roles via
-- the on_organization_created trigger in migration 003). This script
-- only adds demo customer/contact/package-template/estimate data on top
-- of an existing organization — it does not create an organization or a
-- user itself, since that requires a real Supabase Auth signup.
--
-- Targets the first organization found (`order by created_at limit 1`).
-- If you have more than one organization in the project, replace that
-- subquery with an explicit `select id from organizations where name = '...'`.
--
-- Every row this script creates is prefixed "[DEMO]" so it's obvious in
-- the UI and safe to bulk-delete later with:
--   delete from customers where name like '[DEMO]%';
-- (cascades to contacts and any estimates created for that customer).

do $$
declare
  v_org_id uuid;
  v_profile_id uuid;
  v_location_id uuid;
  v_customer_id uuid;
  v_contact_id uuid;
  v_event_type_id uuid;
  v_service_style_id uuid;
  v_food_tax_id uuid;
  v_alcohol_tax_id uuid;
  v_server_role_id uuid;
  v_bartender_role_id uuid;
  v_captain_role_id uuid;
  v_estimate_id uuid;
  v_template_id uuid;
begin
  select id into v_org_id from organizations order by created_at limit 1;
  if v_org_id is null then
    raise exception 'No organization found. Sign up a user at /estimator/login first, then re-run this seed.';
  end if;

  select id into v_profile_id from profiles where organization_id = v_org_id order by created_at limit 1;
  select id into v_location_id from locations where organization_id = v_org_id order by created_at limit 1;
  select id into v_event_type_id from event_types where organization_id = v_org_id and name = 'Wedding';
  select id into v_service_style_id from service_styles where organization_id = v_org_id and name = 'Plated';
  select id into v_server_role_id from staffing_roles where organization_id = v_org_id and name = 'Server';
  select id into v_bartender_role_id from staffing_roles where organization_id = v_org_id and name = 'Bartender';
  select id into v_captain_role_id from staffing_roles where organization_id = v_org_id and name = 'Captain';

  -- Org-specific tax rules don't exist yet (only seeded defaults are the
  -- lookup lists) -- create demo ones if this org has none configured.
  select id into v_food_tax_id from tax_rules where organization_id = v_org_id and name = 'Food' limit 1;
  if v_food_tax_id is null then
    insert into tax_rules (organization_id, name, rate, applies_by_default_to_category)
    values (v_org_id, 'Food', 0.0825, 'menu_item') returning id into v_food_tax_id;
  end if;

  select id into v_alcohol_tax_id from tax_rules where organization_id = v_org_id and name = 'Alcohol' limit 1;
  if v_alcohol_tax_id is null then
    insert into tax_rules (organization_id, name, rate, applies_by_default_to_category)
    values (v_org_id, 'Alcohol', 0.11, 'alcohol') returning id into v_alcohol_tax_id;
  end if;

  -- Give the demo org a realistic service charge / gratuity configuration
  -- if it's still sitting at the all-disabled defaults.
  update organization_settings
  set
    service_charge_enabled = true,
    service_charge_type = 'percent',
    service_charge_value = 0.20,
    service_charge_base = 'discounted_subtotal',
    service_charge_tax_rule_id = v_food_tax_id,
    gratuity_enabled = true,
    gratuity_type = 'percent',
    gratuity_value = 0.18,
    gratuity_base = 'discounted_subtotal_plus_service_charge',
    gratuity_tax_rule_id = null,
    approval_threshold_amount = coalesce(approval_threshold_amount, 10000),
    approval_below_margin_percent = coalesce(approval_below_margin_percent, 0.30)
  where organization_id = v_org_id
    and service_charge_enabled = false and gratuity_enabled = false;

  -- Demo customer + contact
  insert into customers (organization_id, name, company_name, notes, created_by)
  values (v_org_id, '[DEMO] Priya & Sam Patel', null, 'Referred by a past client. Wants a full plated dinner wedding.', v_profile_id)
  returning id into v_customer_id;

  insert into contacts (organization_id, customer_id, first_name, last_name, email, phone, is_primary)
  values (v_org_id, v_customer_id, 'Priya', 'Patel', 'priya.demo@example.com', '555-0100', true)
  returning id into v_contact_id;

  -- Demo package template
  insert into catering_package_templates (organization_id, name, description, base_per_person_price, service_style_id, created_by)
  values (v_org_id, '[DEMO] Classic Plated Wedding Package', 'Three-course plated dinner with passed hors d''oeuvres.', 95.00, v_service_style_id, v_profile_id)
  returning id into v_template_id;

  insert into catering_package_template_line_items (template_id, category, description, quantity, unit, unit_price, unit_cost, is_taxable, tax_rule_id, sort_order)
  values
    (v_template_id, 'package', 'Passed hors d''oeuvres (4 pieces/guest)', 1, 'per person', 18.00, 6.50, true, v_food_tax_id, 0),
    (v_template_id, 'menu_item', 'Plated Entree — Herb Roasted Chicken', 1, 'per person', 45.00, 17.00, true, v_food_tax_id, 1),
    (v_template_id, 'menu_item', 'Plated Dessert — Seasonal Tart', 1, 'per person', 12.00, 4.00, true, v_food_tax_id, 2);

  -- Demo estimate: 150-guest wedding, won, fully priced, demonstrating
  -- every calculation path (multi-category tax, service charge, gratuity,
  -- discount, deposit, staffing cost, margin).
  insert into catering_estimates (
    organization_id, location_id, customer_id, contact_id,
    event_date, event_start_time, event_end_time, venue_name, venue_address,
    event_type_id, service_style_id,
    guest_count_estimated, guest_count_guaranteed,
    status, profit_target_percent,
    deposit_amount, deposit_due_date,
    discount_amount, discount_reason,
    internal_notes, customer_facing_notes,
    created_by, updated_by, approved_by, approved_at
  ) values (
    v_org_id, v_location_id, v_customer_id, v_contact_id,
    (current_date + interval '90 days')::date, '17:00', '23:00', 'The Wildflower Barn', '4200 County Road 12',
    v_event_type_id, v_service_style_id,
    150, 150,
    'won', 0.30,
    3000.00, (current_date + interval '14 days')::date,
    500.00, 'Repeat-referral discount',
    'Bride has a tree-nut allergy — confirm kitchen protocol with chef.', 'Thank you for choosing us for your big day!',
    v_profile_id, v_profile_id, v_profile_id, now()
  )
  returning id into v_estimate_id;

  insert into catering_estimate_line_items (estimate_id, category, description, quantity, unit, unit_price, unit_cost, is_taxable, tax_rule_id, sort_order)
  values
    (v_estimate_id, 'package', 'Passed hors d''oeuvres (4 pieces/guest)', 150, 'per person', 18.00, 6.50, true, v_food_tax_id, 0),
    (v_estimate_id, 'menu_item', 'Plated Entree — Herb Roasted Chicken', 150, 'per person', 45.00, 17.00, true, v_food_tax_id, 1),
    (v_estimate_id, 'menu_item', 'Plated Dessert — Seasonal Tart', 150, 'per person', 12.00, 4.00, true, v_food_tax_id, 2),
    (v_estimate_id, 'beverage', 'Iced Tea & Lemonade Station', 150, 'per person', 4.00, 1.25, true, v_food_tax_id, 3),
    (v_estimate_id, 'alcohol', 'Hosted Beer & Wine Bar (4 hours)', 150, 'per person', 22.00, 9.00, true, v_alcohol_tax_id, 4),
    (v_estimate_id, 'rental', 'Farmhouse Tables & Chiavari Chairs', 150, 'guest', 8.00, 3.50, true, v_food_tax_id, 5),
    (v_estimate_id, 'linen', 'Linens & Napkins', 19, 'table', 22.00, 9.00, true, v_food_tax_id, 6),
    (v_estimate_id, 'delivery', 'Delivery & Load-in', 1, 'flat', 350.00, 120.00, false, null, 7),
    (v_estimate_id, 'admin_fee', 'Event Coordination Fee', 1, 'flat', 400.00, null, false, null, 8);

  insert into catering_estimate_staffing (estimate_id, staffing_role_id, quantity, hours, rate_per_hour, notes)
  values
    (v_estimate_id, v_server_role_id, 10, 6, 25.00, 'Includes 1hr setup/breakdown buffer'),
    (v_estimate_id, v_bartender_role_id, 3, 5, 30.00, null),
    (v_estimate_id, v_captain_role_id, 1, 7, 35.00, 'On-site lead');

  raise notice 'Seeded demo estimate % for organization %', v_estimate_id, v_org_id;
end $$;
