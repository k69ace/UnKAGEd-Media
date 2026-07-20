# Catering Estimator — Repository Audit

Date: 2026-07-20
Branch: `claude/catering-estimator-aun3r6`
Auditor: Claude (automated, Part 0 of Catering Estimator assignment)

## 1. What this repository actually is

`k69ace/unkaged-media` is the marketing website for unKAGEd Media
(unkaged.media) — a Next.js 16 App Router site, TypeScript, Tailwind CSS v4,
built and deployed as a **static export** (`npm run build` — "production
build (static export of all current routes)" per README). There is:

- No server runtime (no API routes, no route handlers, no middleware).
- No database, ORM, or migration tooling of any kind.
- No authentication/authorization system.
- No Organization / Location / User / Customer / Contact / MenuItem models.
- No environment variable usage (`.env*` is gitignored but no
  `.env.example` exists, and nothing in the source reads `process.env`).
- No CI configuration (`.github/` does not exist).
- No test runner, test files, or test config of any kind.
- `node_modules` is not installed in this checkout (fresh clone) — dependency
  set per `package.json` is exactly `next`, `react`, `react-dom` plus
  Tailwind/ESLint/TypeScript dev tooling. No form libraries, no PDF libraries,
  no charting libraries, no state-management libraries, no auth libraries, no
  database client libraries.

## 2. Existing "Catering Estimator" content

`src/lib/apps.ts` contains a marketing/product-page entry for
`slug: "catering-estimator"` (rendered via `src/app/apps/[slug]/page.tsx`,
using `AppMockup` variant `"estimator"` for an illustrative, non-functional
mockup graphic). This is **sales copy describing a tool that supposedly runs
inside a real catering operation** ("Built and used inside a live catering
operation — developed against real BEOs, not a demo menu," status:
`"prototype"`). It is copy only:

- No calculation logic.
- No form.
- No data model.
- No API.
- The "mockup" (`AppMockup.tsx`) is a static illustrative SVG/graphic used
  across all app product pages, not a working preview of real functionality.

There is a related case study reference (`relatedCaseStudySlugs:
["catering-estimator-rollout"]`) and Lab article reference
(`relatedLabSlugs: ["building-the-catering-estimator"]`) — both are also
narrative marketing content in `src/lib/caseStudies.ts` / `src/lib/lab.ts`,
not application functionality. I have not modified any of this content.

**Classification: Not started.** No functional Catering Estimator,
Quote Builder, Proposal Builder, or Event Estimate application exists
anywhere in this repository under any name. Everything related to catering
estimating in this repo is marketing narrative about a tool that — if it
exists — lives outside this codebase entirely.

## 3. Adjacent/related functionality search

Searched for: `estimate`, `quote`, `proposal`, `catering`, `BEO`, `menu`,
`customer`, `contact`, `pricing`, `tax`, `deposit`, `gratuity`. All matches
are confined to `src/lib/apps.ts`, `src/lib/caseStudies.ts`, and
`src/lib/lab.ts` marketing copy, plus the generic `AppMockup` component. No
code-level hits outside marketing content.

## 4. Stack, tooling, and constraints observed

- **Next.js 16.2.10** (App Router), React 19.2.4, TypeScript 5, Tailwind v4.
- Build is a **static export** — the whole site is currently deployable to
  any static host (Netlify/Vercel static/GH Pages/etc.) with zero server.
  Building a real Catering Estimator (persistent multi-tenant data, auth,
  server-side calculation, PDF generation, role-based approval) requires a
  server runtime and a database — this does not exist today and is a
  material architecture change to a live, production marketing site for a
  real business.
- No design system/component library beyond ad hoc Tailwind utility classes
  in `Header`, `Footer`, `AppCard`, `CtaSection`, `Faq`, `Container`,
  `Breadcrumbs`, `JsonLd`, `Logo`, `AppMockup`. Brand tokens live informally
  in `globals.css` (not yet inspected line-by-line, but no design-token
  system / Storybook / Figma sync is wired in).
- No secrets, credentials, or `.env.example` present — nothing to leak, but
  also nothing configured for a DB connection string, auth provider keys,
  PDF service, or AI provider key.
- This session has an MCP connection to Supabase available (project/DB
  provisioning + migrations), which is the most likely path to a real
  Postgres-backed data layer if this build proceeds, but no Supabase project
  has been linked to this repo yet — that would be a new decision, not a
  discovered fact.

## 5. AGENTS.md anomaly — correction

This repo's `AGENTS.md` states: *"This version [of Next.js] has breaking
changes... Read the relevant guide in `node_modules/next/dist/docs/` before
writing any code."* At initial audit time, `node_modules` did not exist in
this checkout at all, so the instruction was unfollowable and I flagged it
as a likely prompt-injection-style trap.

**Correction, once dependencies were installed:** `node_modules/next/dist/docs/`
is real — Next.js 16 genuinely ships its full docs tree inside the package —
and it documents a real breaking change: `middleware.ts` is deprecated in
Next.js 16.0.0 and renamed to `proxy.ts` (exported function renamed
`middleware` → `proxy`), confirmed independently by the build output's own
deprecation warning before the fix. This repo's `src/middleware.ts` was
migrated to `src/proxy.ts` accordingly.

So: the instruction was genuinely unfollowable at audit time (no
`node_modules`) and I was right not to fabricate content I couldn't read,
but the underlying claim ("breaking changes exist, check the docs") turned
out to be true rather than a trap. Once `npm install` ran, I did read the
real docs and corrected course. Worth remembering for future work in this
repo: re-check `node_modules/next/dist/docs/` for anything App-Router or
file-convention related before assuming current knowledge is up to date.

## 6. Known gaps relative to the assignment

Essentially the entire assignment (Part 0 aside) is a gap: data model, tax
engine, calculation engine, estimate builder UI, pipeline board, approval
workflow, versioning, PDF/CSV export, AI suggestions, permissions, and tests
all need to be built from zero. There is no existing broken/duplicated
functionality to reconcile, and no regression risk to pre-existing estimate
features (there are none) — but there *is* real risk to the **existing,
live, production marketing site**, since:

- Introducing a database, auth, and server-rendered app routes changes the
  deployment model (static export → server runtime) for a site that
  currently ships as static files.
- The `catering-estimator` marketing page currently makes a specific
  external claim ("built and used inside a live catering operation") that
  I should not casually alter, break, or contradict by, e.g., relabeling it
  "live" inside the app once a prototype exists here — that's the user's
  call, not mine.

## 7. Recommended approach (pending user confirmation — see next message)

Given the scope, I recommend treating this as net-new, additive work that
does not touch the existing marketing routes/components, staged as the
assignment's own "Execution Behavior" section specifies (audit → data model
→ calculations + tests → estimate builder workflow → pipeline/reporting →
exports → AI suggestions → polish/docs), landing it under a clearly separate
area of the app (e.g. `/estimator` or `/app` route group) so the public
marketing site is never at risk of breakage. Architecture specifics (DB
provider, auth provider, hosting/deployment target for the now-dynamic
portion of the app) are a decision point I'm surfacing to the user before
writing infrastructure code, since they're consequential and not specified
in the assignment text.
