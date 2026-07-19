# unKAGEd Media

Site rebuild for [unkaged.media](https://unkaged.media) — AI-powered business
systems for restaurants, bars, and catering operations. Built with Next.js
(App Router), TypeScript, and Tailwind CSS v4.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Structure

- `src/app` — routes (App Router). `apps/[slug]` is the reusable app
  product-page template, populated from `src/lib/apps.ts`.
- `src/components` — shared UI: header/footer, CTA section, FAQ accordion,
  JSON-LD schema helper, illustrative app mockups.
- `src/lib/site.ts` — site-wide constants (nav, contact info, booking link).
- `src/lib/apps.ts` — data for each shipped app. Add an app here and its
  page is generated automatically; no app is listed until its content is
  complete.

## Build order

This site ships in phases (see project brief). Phase 1: information
architecture, homepage, About Kirk, Contact, the app template, and three
complete app pages. Later phases add the remaining apps, case studies, and
The Lab.

## Scripts

- `npm run dev` — local dev server
- `npm run build` — production build (static export of all current routes)
- `npm run lint` — ESLint
