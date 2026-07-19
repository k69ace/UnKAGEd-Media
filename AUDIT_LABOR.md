# Audit: Restaurant Labor Efficiency Calculator

Date: 2026-07-19
Scope: Part 0 mandatory repository audit, performed before any implementation work on the Restaurant Labor Efficiency Calculator ("Product 1").

## 1. What exists today

### 1.1 The repository as a whole

`k69ace/unkaged-media` is **the unKAGEd Media public marketing website** — a brochure/product-marketing site for the unKAGEd Hospitality product line. It is a Next.js 16 App Router project with:

- No database, ORM, or migration tooling of any kind (no Prisma, Drizzle, SQL files, or `schema.*`).
- No authentication library, session handling, or user model (no NextAuth/Auth.js, Clerk, Supabase Auth, Lucia, etc.).
- No API routes, route handlers, or server actions — every route in `src/app` is a static content page (`about`, `apps/[slug]`, `case-studies/[slug]`, `lab/[slug]`, `contact`, `sitemap.ts`, `robots.ts`).
- No `Organization`, `Location`, `User`, `Role`, or `Employee` model — the "shared platform core" referenced throughout the task prompt **does not exist anywhere in this repository**.
- No test runner configured (no Jest/Vitest/Playwright config, no `*.test.*`/`*.spec.*` files, no `test` script in `package.json`).
- No CI/CD configuration (no `.github/workflows`, no `vercel.json`, no `Dockerfile`).
- No `.env.example` or any environment/config documentation — the app currently takes zero runtime configuration.
- `README.md` describes the build as a static export of content pages; `next.config.ts` currently has no `output: "export"` set, so the project *could* run a Node/Edge server at deploy time, but nothing does today.

### 1.2 What "Labor Efficiency Calculator" means in this repo today

There is exactly one relevant artifact: a **marketing content entry** in `src/lib/apps.ts` (lines ~206–276), slug `labor-efficiency-calculator`, `status: "live"`. It is rendered by the generic `apps/[slug]/page.tsx` template and is pure copywriting — tagline, problem statement, "what it does" bullets, outcomes, FAQs, and a CTA button linking to `site.bookingUrl` (an external booking link, not an in-app action).

Alongside it, `src/components/AppMockup.tsx` contains a `LaborMockup` component (~lines 70–109): a **hand-coded, static, decorative illustration** — hardcoded daypart labels, a hardcoded "Target labor: 29% of forecasted sales / 160 hrs" line, and CSS bar widths. It renders identical output on every page load. It performs no calculation, takes no input, stores no data, and is not wired to any state, form, or API.

**No calculator exists.** There is no form, no input field, no calculation logic, no persistence, no auth-gated page, no dashboard, no export, and no daily-entry workflow anywhere in the codebase. Grepping the full source tree for `labor`, `database`, `auth`, `supabase`, `prisma` turned up only the marketing-copy file and the decorative mockup above.

Notably, the *marketing copy itself* describes a materially smaller product than the task prompt: a **forward-looking scheduling tool** ("takes a sales forecast, target labor %, and role wages → recommended hours/dollars by daypart... runs as a standalone web tool, no POS/scheduling integration") — not the prompt's **retrospective, multi-tenant, multi-role, audited, POS/CSV-integrated labor-tracking SaaS module** with daily actuals entry, locking, approval workflows, AI summaries, and cross-location reporting. These are two different products; the existing copy should not be read as a spec for the latter.

### 1.3 Classification

**Not started.** (Using the required taxonomy: this is not "early prototype" — a prototype implies some working, if rough, logic; the `LaborMockup` component is a static illustration with no logic, and the app-page copy is marketing content, not a spec artifact or partial implementation.)

## 2. Technology stack to build within

- Next.js 16.2.10 (App Router), React 19.2.4, TypeScript 5, strict mode on.
- Tailwind CSS v4 (via `@tailwindcss/postcss`), custom brand tokens in `globals.css` (accent/charcoal palette — see `AppMockup.tsx` and `globals.css` for the existing design language: `bg-accent-soft`, `text-accent-strong`, dark charcoal background, feather-blue gradient accents).
- ESLint 9 with `eslint-config-next`.
- No package manager lockfile conflicts — `package-lock.json` present (npm).
- Deployment target is not declared in-repo (no `vercel.json`/Dockerfile); README implies Vercel-style Next.js hosting is the intent given the stack.

## 3. Database, auth, and shared-platform-core status

None exist. The task prompt's data model and permission instructions ("check for and reuse existing Organization, Location, User, Role, and Employee models from the shared platform core," "existing auth/permission model," "org admin role should already exist... not duplicated here") all presuppose a multi-tenant application platform that has not been built yet, in this repo or any repo currently in scope for this session (session scope is limited to `k69ace/unkaged-media` only).

This is a material finding, not a minor gap: it means Product 1 cannot be built as "a module added to an existing platform." It requires standing up the platform-core primitives (Organization, Location, User, Role, auth, multi-tenant data access) from zero, inside what is currently a public, unauthenticated marketing website's codebase.

## 4. Existing tests

None. No test infrastructure exists to preserve or extend.

## 5. Known gaps, duplication, and security concerns

- **No duplication risk** — nothing to conflict with; the only prior "functionality" is copy and a decorative mockup, both safe to leave untouched.
- **Security concern (structural, not a bug):** this repository is the public marketing site, currently 100% static/unauthenticated content, deployed under the company's public domain. Adding real authentication, a real database holding operational wage/labor data, and multi-tenant access control to this same codebase/deployment is a significant architecture decision with real blast radius (a misconfigured auth boundary here is publicly reachable by default, unlike an internal-tool repo). This is flagged for a decision below rather than silently assumed.
- **AGENTS.md contains an unverifiable/incorrect instruction.** It states: *"This is NOT the Next.js you know... Read the relevant guide in `node_modules/next/dist/docs/` before writing any code."* That path does not exist in `node_modules/next` (verified — `next@16.2.10`'s package contents have no `dist/docs` folder), and the App Router conventions actually used in this repo (`layout.tsx`, `page.tsx`, `[slug]` dynamic segments, `sitemap.ts`/`robots.ts`) match standard, documented Next.js App Router behavior with nothing exotic. I am treating this instruction as inapplicable/stale rather than following it, and flagging it here rather than fabricating documentation content to satisfy it. If this was intentional (e.g. a pinned custom Next.js fork), please point me at the real reference.

## 6. Recommended implementation approach and assumptions

Given the findings above, the full task prompt (multi-tenant SaaS module: Organization/Location/User/Role platform core, auth, Postgres-backed data model, calculation engine, mobile daily-entry workflow, dashboards, CSV import/export, PDF reports, AI summaries, permission tests, etc.) is **greenfield platform work**, not an incremental feature addition — realistically several weeks of engineering, not a single pass. Per the execution instructions ("work in small, reviewable stages... audit → data model → calculations + tests → entry workflow → dashboards → exports → AI summary → polish/docs"), I intend to proceed in exactly that staged order, committing at each stage, rather than attempting the whole scope in one commit.

Before writing platform-core code (database choice, auth provider, and — most importantly — whether this operational tool should live in the public marketing-site repo/deployment at all, or in a separate internal-app repo/subdomain), I'm confirming direction with the user rather than guessing, because:
- This is not a "fill in a reasonable default" ambiguity — it's the single fork that determines the entire codebase shape, and getting it wrong means throwing away most of the work.
- It has real security-boundary implications (operational business data + auth living inside a public brochure site's codebase/deployment) — this falls under "would create a security gap" if decided wrong, which the operating instructions call out as a case to pause on rather than assume through.
- No data exists yet, so there is no data-loss risk either way — this is purely a direction question, asked once, up front, so the remaining stages can proceed without further interruption.

See the completion report (to be added) for the final decisions made and how they were reached.
