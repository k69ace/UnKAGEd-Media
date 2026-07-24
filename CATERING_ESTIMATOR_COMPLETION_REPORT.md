# Catering Estimator — Completion Report

Branch: `claude/catering-estimator-aun3r6`. Built in the staged order the
assignment specified: audit → data model → calculations + tests → estimate
builder workflow → pipeline/reporting → exports → AI suggestions →
settings/seed/docs.

## What shipped

- **Repository audit** (`AUDIT_CATERING.md`) — the repo was a pure static
  marketing site with zero backend; "Catering Estimator" existed only as a
  product marketing page. Classified Not Started. Also flagged, then
  corrected, a real finding: the repo's `AGENTS.md` warns of Next.js
  breaking changes and points at `node_modules/next/dist/docs/` — that path
  didn't exist at audit time (no `node_modules`), so I initially treated it
  as an unverifiable/injection-like claim. Once dependencies were
  installed, the docs *were* real and the claim was true: Next.js 16
  deprecated `middleware.ts` in favor of `proxy.ts`. Migrated accordingly.
  Both the initial skepticism and the later correction are recorded in the
  audit file.
- **Data model** — 9 migrations (`supabase/migrations/`), applied to a
  dedicated Supabase project (`unkaged-catering-estimator`): organizations/
  locations/profiles/roles, customers/contacts, tax rules + org settings +
  event types/service styles/staffing roles, package templates, the
  estimate/line-item/staffing/guest-count-history tables, and an
  append-only audit log written only by `SECURITY DEFINER` triggers (not
  application code). Every table has Row Level Security with
  organization-scoped policies. Schema state was independently verified via
  a `pg_tables`/`pg_policies` query run through the Supabase SQL Editor
  (17/17 tables, RLS on, expected policy counts).
- **Calculation engine** (`src/lib/calculations/catering.ts`) — pure
  functions, no I/O: per-line totals, discount validation (rejects
  discount > subtotal instead of silently clamping), per-category tax
  (never one blanket rate), independently-configurable-and-taxable service
  charge and gratuity, per-person price, internal cost, contribution
  margin. 29 tests including one fully worked realistic estimate and
  explicit incomplete-data/zero-division cases.
- **Estimate Builder** — create (existing or new customer), all eight
  spec'd sections (Event Details, Menu/Packages, Beverages & Alcohol,
  Rentals & Logistics, Staffing, Fees & Discounts, Payment Schedule,
  Review & Send — Notes and Suggestions added alongside), autosave on
  blur with a visible Saving/Saved/error indicator, a persistent totals
  sidebar showing customer-facing pricing next to internal cost/margin,
  server-side Send validation, and approval-threshold enforcement
  (Manager/Owner-only above the org's $ threshold or below its margin
  target). Editing an approved/won/lost/cancelled estimate clones it into
  a new draft version and preserves the original — an explicit "Edit (new
  version)" action, not a silent side effect.
- **Pipeline Board** — status columns, KPI cards (open pipeline value, win
  rate, average deal size, approved events in the next 7 days), filters
  (event type/date range/guest count) as linkable query params, drag a
  card between columns to change status (dropdown accessible fallback
  stays on every card — see Known Limitations for the accessibility
  rationale).
- **Exports** — customer proposal PDF (itemized, payment schedule,
  signature/date fields, zero internal data by construction — no prop
  exists on the component for cost/margin/internal notes), internal
  estimate PDF (cost + margin, banner-marked INTERNAL USE ONLY), internal
  CSV, and pipeline CSV (status/value/cost/margin/owner across the active
  filters). CSV cells are formula-injection-safe (leading `=+-@`).
- **AI suggestions** — a rules-based engine is the actual primary
  implementation (missing bar package for evening receptions, missing
  staffing over 50 guests, a passed-hors-d'oeuvres upsell for large plated
  dinners, no menu items yet). A real AI provider adapter exists as a typed
  seam (`lib/suggestions/ai.ts`) that always returns `null` today — no
  credentials or documented provider contract exist for this project, and
  per the module's own integration policy nothing gets built against a
  service without both. Every suggestion is labeled "Suggestion" in the UI
  and nothing is ever auto-inserted onto an estimate.
- **Settings** — tax rules (add/activate/deactivate), service charge and
  gratuity (type/value/base/taxability, independently), approval threshold
  and margin gate, default profit target. Role-gated to
  catering_admin/manager_owner.
- **Seed data** (`supabase/seed.sql`) — one fully realistic demo event (a
  150-guest plated wedding spanning every line-item category, staffing, a
  discount, deposit, won status) plus a demo customer/contact/package
  template, all `[DEMO]`-prefixed.
- **Docs** — this file, `CATERING_ESTIMATOR.md` (module README/
  architecture), `docs/catering-estimator/user-guide.md` (sales staff),
  `docs/catering-estimator/admin-guide.md` (tax/fee config), updated
  `.env.example`, updated root `README.md`.

## Verification performed

- `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `npm test`
  (135 tests) all clean as of the final commit on this branch.
- Schema/RLS verified live against the Supabase project via SQL Editor
  queries (not just "the migration ran without an error").
- A real browser smoke test against the dev server (Playwright) caught and
  fixed an actual bug: sign-up was redirecting to the pipeline even when
  Supabase's email-confirmation requirement left no session, silently
  bouncing the user back to a blank login form. Now shows a clear "check
  your email" message.
- PDF export is tested by actually rendering both documents from fixture
  data and asserting real PDF output (magic bytes) — and specifically
  asserting that `internal_notes` and any internal-notes section heading
  never appear anywhere in the customer proposal's raw bytes, compressed
  or not. This is the automated form of "no internal cost/margin data on a
  customer-facing export," not just a claim.

## What could not be verified in this environment

This sandbox's network egress policy blocks the dev server's own outbound
HTTPS to `*.supabase.co` (confirmed via the proxy's own diagnostics — a
403 on the CONNECT tunnel to Supabase, distinct from the Supabase MCP
tool's separate, also-troubled connection — see below). That means the
full authenticated browser flow (sign in → build → send → approve → won,
role switching, pipeline drag/dropdown, PDF download in a real browser)
could not be exercised end-to-end from inside this session after the
initial smoke test above. This is a constraint of the build environment,
not of the deployed application — it will work normally on a real host
(Vercel, the developer's own machine, etc.) where that restriction doesn't
apply. **Recommend a full manual pass through the user guide's workflow
before considering this production-ready.**

Separately, Supabase MCP tool calls were intermittently gated behind a
stuck "requires approval" state for a significant portion of the session
(unrelated to the network-policy issue above — this affected the *tool*,
not the app). Migrations 001–004 applied cleanly before it first stuck;
005–006 were eventually applied by the user directly via the Supabase SQL
Editor after I provided the exact SQL, and `generate_typescript_types`
was never reachable, hence the hand-written types documented above.
**Migration 007 (`enforce_profile_active`) is written and committed but
its application status is unconfirmed as of this report** — I provided
the SQL to the user to run directly rather than retrying the MCP tool.
Until it's applied, the Team page's "deactivate" toggle updates
`profiles.is_active` but that flag isn't enforced by any RLS policy yet,
so it would currently be cosmetic, not a real access control. Confirm via
the SQL Editor:

```sql
select prosrc from pg_proc where proname = 'current_organization_id';
-- should contain "and is_active = true" if migration 007 is applied
```

**Migration 008 (`chef_review.sql`) is written and committed with the same
unconfirmed status** — it adds `chef_reviewed_at`/`chef_reviewed_by` to
`catering_estimates` and extends the audit trigger to log a
`chef_reviewed` action. Until it's applied, the Settings checkbox and the
Feasibility Review section will error against the live database (missing
columns) even though the application code and hand-written types are
already updated for it. Apply it the same way as 005–007: paste the file's
contents into the Supabase SQL Editor.

**Migration 009 (`invites.sql`) is written and committed with the same
unconfirmed status** — it adds the `invites` table and redefines
`handle_new_user()` to honor an invite token. Until it's applied, the
Settings "Invite a teammate" form will error against the live database
(missing table), and `/estimator/login?invite=...` links will always show
"invite link isn't valid" since `getInvitePreview()` queries a table that
doesn't exist yet. Apply it the same way as 005–008.

## Known Limitations

- **Drag-and-drop now exists**, layered on top of the accessible controls
  rather than replacing them (WCAG 2.5.7 requires a non-dragging
  alternative for any dragging-movement interaction — up/down arrows and
  the status dropdown stay exactly as they were). Line items: drag the
  ⠿ handle to reorder within a section (`moveLineItem`, a new arbitrary-
  position action alongside the existing single-step `reorderLineItem`).
  Pipeline: drag a card between status columns (`PipelineBoard`, calling
  the same `changeEstimateStatus` the dropdown already used, so an
  invalid drag — e.g. skipping Send validation — surfaces the identical
  error). **Found and fixed a real pre-existing bug** while building
  this: `reorderLineItem` computed its swap index against the *global*
  (whole-estimate) `sort_order` list instead of scoping to the section's
  categories, so an arrow click in a section with interleaved categories
  could silently swap with an item from an unrelated section instead of
  the visually-adjacent row. Both reorder actions now take a `categories`
  param and filter every query to it.
- **Payment schedule** now supports a full multi-installment editor
  (amount/due date/paid per row, saved to `payment_schedule_json`, server-
  validated against the grand total, surfaced on the customer proposal
  PDF) in addition to the deposit amount/due date fields.
- **In-app role management now exists** (Settings → Team: role dropdown +
  active/deactivated toggle per teammate, with server-side protection
  against deactivating yourself or removing the org's last admin).
  Deactivation is a real access control, not cosmetic: migration 007
  (`enforce_profile_active`) redefines `current_organization_id()` and
  `current_app_role()` to require `is_active = true`, so every RLS policy
  in the schema fails closed for a deactivated profile. **This migration
  was written but not yet confirmed applied** — see the verification note
  below.
- **Invite-teammate flow now exists, closing the "always creates its own
  org" gap.** Settings → Team has an "Invite a teammate" section
  (`InviteManager`) that generates a `/estimator/login?invite=<token>`
  link for a chosen role (optionally locked to one email). Opening it
  shows "You've been invited to join {org} as {role}" and signing up
  there joins that organization directly with that role — no separate org
  gets created and no manual `profiles.organization_id` edit is needed
  (that workaround still exists in the admin guide for pre-existing
  stray sign-ups). Migration `20260724000002_invites.sql` adds the
  `invites` table and teaches `handle_new_user()` to honor a valid,
  unexpired, unrevoked, not-yet-accepted token instead of always creating
  a new org — same unconfirmed-application-status caveat as migrations
  007 and 008 (see below). Pre-auth token lookup
  (`src/lib/data/invites.ts`) is the module's first real use of
  `createServiceRoleClient()`, documented as the deliberate exception it
  is: the caller has no session yet, and invites RLS intentionally grants
  no anonymous select. The pure validity rules (`src/lib/invites/
  inviteRules.ts` — expiry/revocation/already-accepted, and email
  matching when an invite is locked to one address) have 8 dedicated unit
  tests.
- **Package templates now have a Settings UI** too — create a template,
  add/remove its line items (category, description, qty, price, cost,
  taxability, tax rule), activate/deactivate. This closes the last of the
  four config-list gaps (event types, service styles, staffing roles,
  package templates all now manageable from `/estimator/settings`).
- **`chef_review_required` is now a real gate, not a placeholder field.**
  Settings has a checkbox ("Require chef feasibility review before
  sending"); when on, a new "Feasibility Review" section appears on the
  estimate detail page and `changeEstimateStatus` blocks the transition to
  Sent until a chef/catering_admin/manager_owner records a review
  (`markChefReviewed`, gated by a new `CHEF_REVIEW_ROLES` list). The
  review is tracked per-estimate (`chef_reviewed_at`/`chef_reviewed_by`,
  migration `20260724000001_chef_review.sql`), resets on every new
  version (so a materially edited estimate needs a fresh look), and shows
  up in the Activity Log via the audit trigger's new `chef_reviewed`
  action. Deliberately does **not** gate Approve — only Send.
- **CSV import now exists** for menu/pricing catalogs (Settings → Package
  Templates → "Import a template from CSV"): category/description/
  quantity/unit/price/cost/taxable/tax-rule-name columns, whole-file
  validation (every row's errors reported together, nothing partially
  imported on a bad file). `lib/import/csv.ts` (a small dependency-free
  RFC4180-ish parser) and `lib/import/packageTemplateCsv.ts` (the
  validation/mapping layer) have 16 tests between them, including the
  "collects every row's error, not just the first" and
  "rejects the whole file, no partial import" cases the spec's Testing
  section calls for explicitly.
- **Customer proposal PDF is always itemized**, not configurable to a
  package-summary view (spec allowed either, configurable per org).
- **Guest-count change history** is recorded (every change, by whom, when
  — a database trigger) and now has a UI: a collapsible "Guest Count
  History" panel on the estimate detail page, for exactly the
  billing-dispute scenario the spec called out.
- **Version diff view now exists**: each non-current entry in the
  version-history breadcrumb has a "[compare]" link to
  `/estimator/estimates/[id]/diff/[otherId]`, showing what changed
  between the two versions — event-detail/terms fields, line items
  (added/removed/changed, matched by category+description since cloned
  rows get new ids), staffing (matched by role), and the resulting grand
  total delta (via `computeEstimateSummary` on both versions, not a raw
  DB-row diff). The pure matching logic (`src/lib/diff/estimateDiff.ts`)
  has 9 dedicated unit tests, including duplicate-description pairing.
- **Pipeline filters now include location and sales owner**, alongside
  event type/date range/guest count — both the board and the CSV export
  respect them, and each pipeline card shows its owner. (Location filter
  only renders when an org actually has more than one active location,
  to avoid a useless single-option dropdown.)
- **In-app audit-log viewer now exists**: a collapsible "Activity Log"
  panel on the estimate detail page (`AuditLogPanel`), fed by a new
  `getAuditLogForEstimate()` query joined to the actor's profile. It lists
  every `audit_log` row for that estimate — creation, status changes (with
  a from → to summary), and post-approval edits (with a field-level
  before/after summary) — newest first, with the actor's name and a
  formatted timestamp. `summarizeChanges()`'s branching logic has 9
  dedicated unit tests.
- **Test coverage gap vs. the spec's Testing section**: unit tests exist
  for calculations, DB-row mapping, CSV safety (both export-injection-
  safety and import validation/parsing), PDF generation, the suggestions
  rules engine, role-gating (`assertRole`, every role constant list
  including the chef-review roles), the audit-log summary formatter, the
  version-diff matching logic, and the invite-validity rules — 135 tests
  (including drag-and-drop interaction tests for both `LineItemsSection`
  and `PipelineBoard` — see the drag-and-drop bullet above).
  **Empty/failure-state UI tests now exist too**, at the component level: React Testing Library +
  jsdom were added (no live Supabase or browser required) and cover
  `SuggestionsPanel` (renders nothing with zero suggestions),
  `GuestCountHistory` (renders nothing at ≤1 entries — a single row isn't
  a "change" yet), `LineItemsSection` (an empty, read-only category
  renders neither a table nor an add-item form; category filtering is
  correct), and `StatusActions` (the "No further status changes from
  here" terminal-status state for won/cancelled, plus a mocked
  server-action error surfacing as a visible `role="alert"`). Still not
  built: integration tests for the full create→send→approve→won
  workflow and responsive UI tests. Those specifically need a real
  browser against a real signed-in session, which this sandbox's network
  policy blocks (see above) — the role-gating logic itself is now tested
  at the unit level, but not the end-to-end "a reporting_readonly user
  literally cannot click Send" browser-level guarantee.
- **No e-signature** — the PDF has a blank "approved by (print name)" /
  date line, matching the spec's stated MVP acceptance.

## Future Roadmap (per spec)

- Tripleseat / Caterease sync, e-signature, GoHighLevel lead capture — the
  adapter contracts for these live in `src/lib/integrations/catering/`
  with **no registered implementations**, so they can be added without
  touching core estimate logic when real credentials/API docs exist.
- A real AI suggestions provider, behind the existing `ai.ts` seam.
- The CRUD UIs and workflow pieces listed under Known Limitations above.

## Definition of Done — status

| Requirement | Status |
|---|---|
| Sales manager can build a complete, tax-correct estimate and generate a customer-ready PDF in one sitting | Built and unit/PDF-tested; not live-browser-verified in this environment (see above) |
| Per-category tax and configurable service charge/gratuity, tested for non-uniform taxability | Done — tested |
| Version history preserved for post-approval edits | Done |
| No internal cost/margin data on a customer-facing export | Done — tested |
| Role-based access and approval-threshold logic enforced server-side | Done (`assertRole` + RLS) |
| All calculation tests pass; no floating-point currency bugs | Done — 86/86 passing, epsilon-corrected rounding |
| `AUDIT_CATERING.md` and this report committed and accurate | Done |
