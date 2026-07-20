# Catering Estimator — Admin Guide (Tax Rules & Fee Configuration)

For Catering Administrators and Manager/Owner roles. Covers what's
configurable from `/estimator/settings` today, and what still requires
direct database access — being upfront about the gap is more useful than
pretending it doesn't exist.

## Roles

Five roles exist (`profiles.role` in the database):

| Role | Can do |
|---|---|
| `sales_manager` | Build/edit/send estimates, manage customers/contacts |
| `chef` | Same as sales_manager, plus intended for feasibility review (internal notes) |
| `catering_admin` | Everything sales_manager can, plus Settings, approve estimates below the approval gate |
| `manager_owner` | Everything catering_admin can, plus required to approve estimates that cross the $ threshold or fall below the margin target |
| `reporting_readonly` | View pipeline and estimate history only — cannot create, edit, or change status |

New sign-ups default to `sales_manager` in a brand-new organization.
**There's no in-app role-change or invite-teammate UI yet** — to change
someone's role or move a second sign-up into an existing organization
instead of their own new one, update the `profiles` table directly (SQL
Editor or Table Editor in the Supabase dashboard):

```sql
update profiles set role = 'manager_owner' where email = 'owner@example.com';
-- to merge a stray second organization into the first, also update
-- profiles.organization_id for that user and delete the empty
-- organization it created on sign-up.
```

## Tax Rules

`/estimator/settings` → **Tax Rules**. Add a rule with a name and a rate
(entered as a percentage, e.g. `8.25` for 8.25% — stored internally as a
fraction). Existing rules can be deactivated (unchecking "Active") but not
deleted from this page — a deactivated rule stops showing up as an option
on new/edited line items but historical estimates that already reference
it keep their number.

**This is the core of the whole tax model**: every line item picks its own
tax rule independently. There is no org-wide blanket tax rate anywhere in
the system — food, alcohol, rentals, and anything else can each have a
different rate, and untaxed categories (e.g. delivery, admin fees) simply
have no tax rule assigned. If your jurisdiction taxes something
unexpectedly (or doesn't), fix it at the tax-rule/line-item level, not by
looking for a single global setting — there isn't one, by design.

## Service Charge & Gratuity

`/estimator/settings` → **Service Charge, Gratuity & Approval**. These are
two independent settings, not one "auto-gratuity" toggle:

- **Type**: flat dollar amount, or a percentage.
- **Base**: what the percentage applies to — the discounted subtotal, or
  the discounted subtotal excluding alcohol line items. Gratuity has a
  third option: discounted subtotal *plus the service charge* (gratuity is
  always computed after service charge, so this is available; the reverse
  isn't).
- **Taxed as**: pick a tax rule if the service charge or gratuity itself is
  taxable in your jurisdiction, or leave it "Not taxed." These are set
  independently — one can be taxed while the other isn't.

Changes here apply to every estimate going forward (draft/sent estimates
recalculate live; approved+ estimates are locked and keep whatever the
config was when they were priced, consistent with the version-on-edit
rule).

## Approval & Margin Targets

Same settings page, third section:

- **Approval required above ($)** — estimates with a grand total over this
  amount can only be moved to Approved by a Manager/Owner, not a Sales
  Manager or Catering Admin acting alone. Leave blank to disable this gate.
- **Approval required below margin (%)** — same gate, triggered instead
  when the contribution margin percent falls below this number.
- **Default profit target (%)** — pre-fills the per-estimate profit target
  field in Fees & Discounts; doesn't block anything by itself.

If neither threshold is met, any estimate-write role can move an estimate
to Approved themselves — the gate is opt-in per organization, not
mandatory.

**Chef review**: `organization_settings.chef_review_required` exists in the
database but isn't enforced anywhere in the app yet (no gating on
Approved/Send). Treat it as a documented placeholder, not a working
feature — see Known Limitations in the completion report.

## Not yet manageable from Settings

These have sensible seeded defaults per organization (created
automatically when the organization is created) but no admin UI yet.
Manage them via the Supabase Table Editor:

- **Event types** (`event_types` table) — seeded: Wedding, Corporate,
  Private Party, Drop-off.
- **Service styles** (`service_styles` table) — seeded: Plated, Buffet,
  Family-Style, Stations, Drop-off.
- **Staffing roles & default rates/ratios** (`staffing_roles` table) —
  seeded: Server, Bartender, Captain, Chef.
- **Package templates** (`catering_package_templates` +
  `catering_package_template_line_items`) — none seeded by default; add
  via SQL, or as a starting point, adapt the demo package template created
  by `supabase/seed.sql`.

Adding/editing rows in these tables via the dashboard takes effect
immediately in the estimate builder's dropdowns — no deploy or cache
clear needed.
