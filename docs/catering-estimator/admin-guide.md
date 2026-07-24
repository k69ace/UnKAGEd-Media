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

A person who signs up with no invite link defaults to `sales_manager` in
a brand-new organization of their own.

**Inviting a teammate into your organization**: `/estimator/settings` →
**Invite a teammate**. Pick a role, optionally an email (leave it blank
for an open link anyone can use; set it to restrict the link to that one
address — a sign-up attempt with a different email is rejected), and
click "Create invite link" to get a shareable URL
(`/estimator/login?invite=<token>`). Whoever opens it sees "You've been
invited to join {your org} as {role}" and signs up directly into your
organization with that role — no separate organization gets created, and
nothing needs a direct database edit. Links expire after 7 days; the
pending-invites list below the form lets you revoke one before it's used.
An expired, revoked, or already-used link falls back to the normal
sign-in/sign-up page with a clear message, rather than silently failing.

If you're stuck on an old sign-up that already created its own separate
organization (from before this flow existed, or from someone signing up
without an invite link by mistake), you can still merge it into yours by
hand — update the `profiles` table directly (SQL Editor or Table Editor
in the Supabase dashboard):

```sql
update profiles set organization_id = '<your-org-id>' where email = 'newperson@example.com';
-- then delete the empty organization their sign-up created, if you want:
delete from organizations where id = '<their-old-org-id>';
```

`/estimator/settings` → **Team** lists everyone already in your
organization (whether they joined by invite or signed up on their own)
with a role dropdown per person and an active/deactivated toggle — use it
to promote/demote teammates or deactivate someone who's left (deactivating
actually revokes access immediately; it isn't cosmetic — see the module
README's note on migration 007). You can't deactivate your own account or
remove the organization's last admin from that page; both are blocked
with a clear error.

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

**Chef review**: turn on "Require chef feasibility review before sending"
and a **Feasibility Review** section appears on every estimate (below
Suggestions, above Review & Send) until a chef, catering admin, or
manager/owner clicks "Mark reviewed" there. While required and
unreviewed, **Send is blocked** with a message pointing back to that
section — sales_manager can build the estimate but can't push it past
that gate alone. The review resets on a new version (editing an
approved+ estimate clones a fresh draft, per the version-on-edit rule
above), so a materially changed estimate always gets a fresh look before
it goes out again. This does not gate Approve — only Send.

## Event Types, Service Styles &amp; Staffing Roles

`/estimator/settings` also manages these — each has a name and an active
toggle (Staffing Roles additionally has a default rate/hr and a default
guest-per-staff ratio, which pre-fill the Staffing section when building
an estimate but don't lock anything in). New organizations start with
seeded defaults (Event types: Wedding, Corporate, Private Party, Drop-off.
Service styles: Plated, Buffet, Family-Style, Stations, Drop-off. Staffing
roles: Server, Bartender, Captain, Chef) that you can add to or deactivate
from here. There's no rename/delete from this page yet — deactivate and
add a replacement instead, the same pattern as Tax Rules.

## Package Templates

`/estimator/settings` → **Package Templates** manages these too: create a
template (name, description, base per-person price), then expand it to
add or remove its line items (category, description, quantity/unit,
price, cost, taxable + tax rule — the same fields a line item has on a
real estimate). None ship seeded by default; `supabase/seed.sql` creates
one realistic example to start from. Applying a template to an estimate
**copies** its line items onto that estimate — editing the template
afterward never retroactively changes an estimate that already used it.

**Importing a catalog from CSV**: same section, "Import a template from
CSV" — pick a template name and a file with columns `Category,
Description, Quantity, Unit, Unit Price, Unit Cost, Taxable, Tax Rule`
(the expandable panel shows a copy-pasteable example). Category accepts
either the display name ("Menu item") or the raw key ("menu_item"); Tax
Rule must exactly match an existing active tax rule's name in your
organization, or be left blank for untaxed. The whole file is validated
before anything is created — one bad row rejects the entire import and
lists every row's error, not just the first, so you never end up with a
half-imported catalog to clean up.

Adding/editing rows via the dashboard (for anything not yet covered by a
Settings page) takes effect immediately in the estimate builder — no
deploy or cache clear needed.
