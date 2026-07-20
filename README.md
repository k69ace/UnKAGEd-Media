# unKAGEd Media

Site rebuild for [unkaged.media](https://unkaged.media) — AI-powered business
systems for restaurants, bars, and catering operations. Built with Next.js
(App Router), TypeScript, and Tailwind CSS v4.

The repo has two halves sharing one Next.js app:

- **Marketing site** (`src/app/(marketing)`) — static pages: home, About,
  Apps, Case Studies, The Lab, Contact.
- **Catering Estimator** (`src/app/estimator`) — a database-backed,
  authenticated application (Supabase). See
  [`CATERING_ESTIMATOR.md`](./CATERING_ESTIMATOR.md) for its own setup,
  architecture, and docs — start there if you're working on the estimator,
  not here.

Because of the estimator, the build is no longer a pure static export — it's
a hybrid app with server-rendered/dynamic routes (Server Actions, PDF/CSV
route handlers, auth). The marketing pages themselves are still fully static.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the marketing site,
or [http://localhost:3000/estimator/login](http://localhost:3000/estimator/login)
for the Catering Estimator (requires Supabase env vars — see
`CATERING_ESTIMATOR.md`).

## Structure

- `src/app/(marketing)` — marketing routes, all static. `apps/[slug]` is the
  reusable app product-page template, populated from `src/lib/apps.ts`.
- `src/app/estimator` — the Catering Estimator app (auth, estimate builder,
  pipeline, settings, exports). See `CATERING_ESTIMATOR.md`.
- `src/components` — shared marketing UI: header/footer, CTA section, FAQ
  accordion, JSON-LD schema helper, illustrative app mockups.
- `src/components/estimator` — Catering Estimator UI components.
- `src/lib/site.ts` — site-wide constants (nav, contact info, booking link).
- `src/lib/apps.ts` — data for each shipped app. Add an app here and its
  page is generated automatically; no app is listed until its content is
  complete.
- `src/lib/calculations`, `src/lib/data`, `src/lib/suggestions`,
  `src/lib/export`, `src/lib/pdf` — Catering Estimator business logic,
  kept separate from marketing code.
- `supabase/migrations` — Catering Estimator database schema.

## Build order

This site ships in phases (see project brief). Phase 1: information
architecture, homepage, About Kirk, Contact, the app template, and three
complete app pages. Later phases add the remaining apps, case studies, and
The Lab. The Catering Estimator (see `CATERING_ESTIMATOR.md`) shipped as its
own staged build on top of that foundation.

## Scripts

- `npm run dev` — local dev server
- `npm run build` — production build (marketing pages are static; the
  estimator's routes are server-rendered)
- `npm run lint` — ESLint
- `npm test` — run the Catering Estimator's Vitest suite
- `npm run test:watch` — same, in watch mode
