# Restaurant Grader

A free, AI-powered diagnostic tool for restaurant owners — inspired by
[Grader by Owner.com](https://grader.owner.com). Enter a restaurant's name
(and optionally its website + city), and a set of specialized agents scan
its website, Google Business Profile, reviews, photos, local SEO, and
nearby competitors, then roll everything up into a single health score
with prioritized, one-click AI-generated fixes.

No sign-up or credit card required.

## How it works

The orchestrator (`src/lib/orchestrator.ts`) fans a scan request out to six
specialized agents that run concurrently, then aggregates their scores and
findings into one report:

| Agent | File | What it does |
|---|---|---|
| Website Health | `src/lib/agents/website.ts` | Live-fetches the homepage; checks HTTPS, mobile viewport, title/meta tags, structured data, ordering/reservation CTAs, and (with a key) real Google PageSpeed Insights scores. |
| Local SEO | `src/lib/agents/seo.ts` | Checks whether the site's copy targets the restaurant's name/location/cuisine, content depth, NAP signals, and crawlability (`robots.txt`/`sitemap.xml`). |
| Photo Quality | `src/lib/agents/photos.ts` | Downloads a sample of homepage images and checks resolution, file size, and alt-text coverage. |
| Reviews & Reputation | `src/lib/agents/reviews.ts` | Pulls live Google reviews/rating (with a key) and summarizes sentiment via Claude, or a lexicon fallback. |
| Google Business Profile | `src/lib/agents/gbp.ts` | Checks GBP completeness — website, phone, hours, photo count, categories. |
| Competitive Landscape | `src/lib/agents/competitors.ts` | Benchmarks rating/review count against nearby competitors via Google Places Text Search. |

The Website, Local SEO, and Photo agents always do **real, live analysis**
of whatever URL you provide — no API key required. Reviews, Google Business
Profile, and Competitors require a Google Places API key for live data; if
none is set they fall back to clearly-labeled, deterministic "estimated"
sample data (seeded by restaurant name, so it's consistent on repeat scans)
so the product is still fully demoable out of the box.

Clicking **"Fix it with AI"** on any fixable issue calls `src/lib/agents/fix.ts`,
which generates a concrete before/after remediation — using Claude when
`ANTHROPIC_API_KEY` is set, or a curated template library otherwise.

Right under the score, `src/components/LeadCaptureCard.tsx` offers to email
the visitor their full report and a free fix-it call — this is the lead-gen
funnel: `POST /api/lead` validates the submission and forwards it to
`LEAD_WEBHOOK_URL` (Zapier/Make.com/GoHighLevel/Slack/anything that accepts a
JSON webhook) if configured, and always logs it server-side either way. The
"Book a call" CTA that appears after submission links to
`NEXT_PUBLIC_BOOKING_URL` (a scheduling link), falling back to a `mailto:`
using `NEXT_PUBLIC_CONTACT_EMAIL` if no booking link is set.

## Setup

```bash
npm install
cp .env.example .env.local   # optional — see below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables (all optional)

See `.env.example`. The app is fully functional with **zero** keys set
(demo mode). Add any of these to unlock live data for that section:

- `GOOGLE_PLACES_API_KEY` — enables live Reviews, Google Business Profile,
  and Competitor data via the Google Places API.
- `GOOGLE_PAGESPEED_API_KEY` — enables real Lighthouse performance/SEO/
  accessibility scores in the Website agent (free, no billing account
  required). Falls back to `GOOGLE_PLACES_API_KEY` if that's set.
- `ANTHROPIC_API_KEY` — enables Claude-generated review sentiment summaries
  and restaurant-specific AI copy in the Fix It flow.
- `LEAD_WEBHOOK_URL` — forwards captured leads (email/name/phone + scan
  context) to your CRM/automation of choice as a JSON POST.
- `NEXT_PUBLIC_BOOKING_URL` / `NEXT_PUBLIC_CONTACT_EMAIL` — power the "Book a
  call" CTA shown after someone submits the lead form.

## Security notes

Because this tool fetches arbitrary user-supplied URLs (and images found on
those pages) from the server, `src/lib/utils/urlSafety.ts` blocks requests
to loopback/private/link-local addresses (including cloud metadata
endpoints) and redirects are manually re-validated hop-by-hop to prevent
SSRF. This is a hostname-literal check, not full DNS-rebinding protection.

## Tech stack

Next.js (App Router) + TypeScript + Tailwind CSS. Route handlers under
`src/app/api/` expose `POST /api/scan`, `POST /api/fix`, and `POST /api/lead`;
the app is otherwise a single-page client experience
(`src/components/GraderApp.tsx`).

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run lint` — ESLint
