# Catering Estimator — Module README

A database-backed, authenticated catering quote-builder module living
inside the unKAGEd Media marketing site (`src/app/estimator`), built
against a dedicated Supabase project. See `AUDIT_CATERING.md` for the
Part 0 repository audit this module started from, and
`CATERING_ESTIMATOR_COMPLETION_REPORT.md` for what shipped, what didn't,
and the roadmap.

For the sales-staff and admin guides, see:

- [`docs/catering-estimator/user-guide.md`](./docs/catering-estimator/user-guide.md)
- [`docs/catering-estimator/admin-guide.md`](./docs/catering-estimator/admin-guide.md)

## Stack

- Next.js 16 App Router, Server Actions, Route Handlers — no separate API
  server.
- Supabase (Postgres + Auth + Row Level Security) — project
  `unkaged-catering-estimator` (ref `qakdcghsdqlivaptasva`).
- `@react-pdf/renderer` for PDF export (customer proposal, internal sheet).
- Vitest for unit/integration tests.

## Local setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in the Supabase project's
   URL/anon key (Project Settings → API in the Supabase dashboard). The
   service-role key is optional — nothing in this module currently
   requires it (see "Why no service-role usage" below).
3. Apply the schema: every file in `supabase/migrations/`, in filename
   order, via the Supabase SQL Editor or `supabase db push` if you have the
   CLI linked to the project. They're idempotent-in-order but not
   individually re-runnable (each `create table`/`create type` will error
   if run twice against a database that already has it).
4. `npm run dev`, then sign up at `/estimator/login` → "Create
   organization". Signing up creates your organization, your profile (role
   defaults to `sales_manager` — see the admin guide for changing that),
   and seeds default tax rules/event types/service styles/staffing roles
   for that organization automatically (a Postgres trigger, not app code).
5. Optional: run `supabase/seed.sql` in the SQL Editor afterward for one
   fully realistic demo estimate (see the file's header comment).

Supabase's email-confirmation requirement is on by default for a new
project. Either confirm via the email Supabase sends, or turn "Confirm
email" off in Authentication → Sign In / Providers → Email for local
development.

## Architecture

```
src/app/estimator/
  login/                    Auth (Server Actions: signIn, signUp, signOut)
  (app)/                    Authenticated shell (nav, requireProfile() gate)
    pipeline/                 Pipeline board + KPIs + CSV export
    estimates/new/             Start an estimate (existing/new customer)
    estimates/[id]/             The builder: all sections + PDF/CSV routes
    estimates/[id]/diff/[otherId]/  Version comparison (added/removed/changed)
    settings/                  Tax rules, service charge/gratuity, approval

src/lib/
  supabase/                 Client/server Supabase clients, hand-written DB types
  auth/profile.ts           requireProfile(), assertRole(), role constants
  data/catering.ts          All read queries (server-only)
  data/invites.ts           Pre-auth invite lookup/validation — the one place
                             this module uses the service-role client, and why
  invites/inviteRules.ts    Pure invite-validity rules (expiry/revocation/email match)
  calculations/catering.ts  Pure calculation engine — no I/O, fully unit-tested
  calculations/mappers.ts   DB row -> calculation-engine input shape
  calculations/estimateSummary.ts  Wires a DB estimate through the engine
  diff/estimateDiff.ts      Pure version-diff matching (line items/staffing by
                             category+description/role, not id — cloned rows
                             get new ids every version)
  suggestions/              Rules-based (+ optional AI) upsell/missing-info engine
  export/csv.ts             Injection-safe CSV builder
  import/                   CSV parsing + package-template import validation
  pdf/                      Customer + internal PDF documents
  integrations/catering/    Adapter contracts for future CRM/invoicing/lead-capture
                             integrations — no providers wired up (see file header)
```

**Why hand-written Supabase types instead of generated ones**
(`src/lib/supabase/types.ts`): `mcp__Supabase__generate_typescript_types`
was unavailable for the entire build (a stuck tool-permission gate in the
build environment — see git history / the completion report for the blow-
by-blow). The hand-written types were verified against the live schema via
a manual `pg_tables`/`pg_policies` query run through the Supabase SQL
Editor (also in git history), and are kept in sync with
`supabase/migrations/*.sql` by hand. **Regenerate this file from the live
schema and replace it wholesale** the next time
`generate_typescript_types` is reachable, rather than continuing to
hand-edit it — the file's own header comment says the same thing.

**Why almost no service-role usage**: every write goes through the
authenticated user's own Supabase session and is authorized by Row Level
Security policies (see `supabase/migrations/*`) plus an application-layer
`assertRole()` check in each Server Action. The audit log
(`audit_log` table) is written only by `SECURITY DEFINER` Postgres trigger
functions, not by application code with elevated privileges. The one
deliberate exception is `src/lib/data/invites.ts`: validating an invite
token on the sign-up page happens before any session exists, so there's
no authenticated request to scope RLS to — invites RLS intentionally
grants no anonymous select, and `createServiceRoleClient()`
(`src/lib/supabase/server.ts`) is used for exactly that one read/validate
path, nowhere else. Treat any other proposed use of it as suspect until
it clears the same bar: no session available, not just "RLS is
inconvenient here."

## Calculation model

All pricing math lives in `src/lib/calculations/catering.ts` — pure
functions, no database or React imports, 29 dedicated unit tests plus
further coverage via `estimateSummary.test.ts`. Read the file's own header
comment for the exact calculation order and the documented assumptions
(tax computed on undiscounted line-item totals per category; contribution
margin excludes tax/service charge/gratuity). Money is rounded round-half-up
to 2 decimals via `roundCurrency`; percentages are fractions (0.0825, not
8.25) everywhere except the display layer.

## Testing

```bash
npm test          # run once
npm run test:watch
```

135 tests across: the calculation engine, the DB-row mapping layer, CSV
injection-safety (export and import), PDF generation (real PDF bytes, real
assertion that internal cost/margin never appears in the customer
proposal's bytes), role-gating (`assertRole` and every role constant
list), the suggestions rules engine, the audit-log summary formatter, the
version-diff matching logic, invite-validity rules (expiry/revocation/
email-matching), and component-level empty/failure-state and drag-and-
drop rendering (React Testing Library + jsdom — `SuggestionsPanel`,
`GuestCountHistory`, `LineItemsSection`, `StatusActions`, `PipelineBoard`;
server actions imported by client components are mocked via `vi.mock`
rather than exercised for real, since they need a live Supabase session).
See Known
Limitations in the completion report for what test coverage *doesn't*
exist yet (integration/workflow tests, end-to-end/browser-level
permission enforcement, responsive UI tests) — those need a real browser
against a real signed-in session, which this build environment's network
policy blocks (see the completion report).

## Deployment notes

- Needs a Node.js server runtime (Vercel, a Node host, or a container) —
  **not** static export/output. The marketing pages remain static; the
  estimator's Server Actions, Route Handlers (`/proposal`, `/internal-sheet`,
  `/internal-csv`, `/pipeline/export`), and `src/proxy.ts` all require a
  server.
- Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (and
  `SUPABASE_SERVICE_ROLE_KEY` if/when something needs it) in the hosting
  platform's environment variables — see `.env.example`.
- `src/proxy.ts` (Next.js 16's renamed `middleware.ts`) is scoped to
  `/estimator/:path*` only; it doesn't touch the marketing site.
