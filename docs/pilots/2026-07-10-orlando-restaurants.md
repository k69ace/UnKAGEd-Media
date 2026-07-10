# Pilot — Orlando Restaurants — 2026-07-10

First live run of the outbound engine, scoped to unKAGEd's restaurant vertical
(see `docs/architecture.md` for why restaurants get their own research method
instead of the generic Clay path). Full drafts and a readable layout are in
the review artifact shared in chat the same day; this file is the durable
record in git.

## Method (this run only — see caveats below)

Clay and the Restaurant Grader app (PR #1) were not used for this batch —
Clay has no MCP connector in this environment, and the Grader app isn't
deployed yet. Instead, research was done directly: web search for
ownership/news/review signals per restaurant, personalized copy drafted
by hand against `prompts/claude-outreach-system-prompt.md`'s voice rules,
and contacts pushed live into GHL via the GHL MCP connector (which works in
this environment; Make.com's connector does not — see `make/README.md`).

**This session's `WebFetch` tool returned HTTP 403 on every URL tried,
including `example.com`, confirming it's a proxy-level block and not a
per-site issue.** That means none of the research below includes actual
technical audit findings (page speed, mobile viewport, structured data,
etc.) — those claims were never generated because they couldn't be verified.
Every personalization angle below is instead grounded in ownership/news/review
signals visible in web search results, with sources. Do not backfill fake
technical findings into these drafts later without actually running the
Grader's scan (or equivalent) against each site first.

## Selection

Target market: Orlando, FL (independent restaurants, not chains or
large hospitality-group properties). Two sourcing passes the same day, 9
candidates total across Mills 50, Ivanhoe Village, Downtown, Baldwin Park,
and the Milk District; all confirmed as real, independently or
small-group-owned businesses with a publicly listed contact email (business
inquiry addresses — catering/party/info desks, not scraped personal emails).

## Results

| Restaurant | Score | Angle | GHL contact ID | Email used |
|---|---|---|---|---|
| White Wolf Cafe | 78 | New ownership at a 30+ yr institution | `ZMXosVWz2074CV15LzfU` | info@whitewolfcafe.com |
| Swine & Sons | 70 | Expanding Orlando → Las Vegas | `695FP3XaXeFE7FnwocYO` | info@swineandsons.com |
| TaKo Cheena | 65 | Solo chef-owner running 2 concepts | `fZaVLyYmghKw95r0Utzl` | takocheena@gmail.com |
| Se7en Bites | 63 | Chef-owner running 2 restaurants + catering | `hN3OBoxxYBf9gJFZoEcM` | trina@se7enbites.com |
| La Bella Luna | 62 | 3-year "Best Pizza" streak, unlevered | `wyoTMR6KYLNz42n0jvtD` | labellalunaflorida@gmail.com |
| Santiago's Bodega | 60 | Packed brunch, no weekday-conversion system | `aRwHhSpAzvOyVw5DnTo8` | party@santiagosbodega.com |
| Reyes Mezcaleria | 58 | One of several concepts under a small group | `JLgVaH9URCm1lRgssltR` | info@reyesmex.com |
| Pig Floyd's Urban Barbakoa | 55 | Consolidating out of a second location | `ufS7g0jQBnhQHKS1dPTF` | catering@pigfloyds.com |
| Zaru | 50 | Fresh Michelin Bib Gourmand press wave | `7L6xevqA0t01WWFn16Ej` | info@zarufl.com |

Full research summaries, pain-point hypotheses, and all 27 drafted emails
(3 per restaurant) were shared as a review artifact in the same conversation
this file was committed from — ask Kirk for the link if it's not already at
hand, or regenerate from the contact records below once custom fields exist.

### Considered and excluded (batch 2 sourcing pass)

Logged so a future pass doesn't re-spend time on these: **Junior's Diner**
and **The Rusty Spoon** — confirmed closed per Yelp. **Colibri Mexican
Cuisine** — confirmed closed per Yelp. **Papi's Burritos, Otto's High Dive,
DOMU, Infusion Tea, Kappo Tsan** — real, open businesses, but no publicly
verifiable contact email surfaced after 1-2 targeted searches each (some
have contact forms only, some only social DM); not pushed rather than guess
an address. Kappo Tsan is also under the same ownership (Jimmy/Johnny Tung)
as Zaru, already in this batch, and had only just opened — low priority
either way.

## What's actually live right now

- All 9 exist as real GHL contacts (ids above), in the `unKAGEd Media Agency`
  location, tagged `source:pilot-live-research`, `outreach:review`,
  `vertical:restaurant`.
- **Custom field data did not attach.** The upsert call for White Wolf Cafe
  was sent with the full `customFields` payload (research summary, angle,
  all 3 drafts) and GHL's API returned `"customFields": []` — the 14 fields
  documented in `docs/ghl-setup.md` §1 don't exist in this account yet, so
  GHL silently drops unknown keys rather than creating them. The remaining 8
  contacts were pushed with core fields only (no point sending data that gets
  dropped). Once the fields exist, re-running the same upsert calls
  (idempotent on email) will backfill this content onto these same records.
- **No opportunities were created.** The GHL MCP connector available this
  session exposes `opportunities_get/search/update` but no create action.
  Either create these 9 manually in the Digital Marketing Pipeline's "New
  Lead" stage, or wait until the Make.com connector is reauthorized and use
  the blueprint in `make/`.
- **Nothing will send.** `outreach:review` is not the trigger tag for the
  cold-sequence workflow (`docs/ghl-setup.md` §4 triggers on
  `outreach:queued`) — these 9 sit inert until a human retags them.

## Follow-ups this pilot surfaced

1. Add `outreach:review` as a formally documented holding tag in
   `docs/ghl-setup.md` (done — see §2 there) so future batches use the same
   gate instead of drifting to ad hoc tag names.
2. Decide whether to wait for the Restaurant Grader (PR #1) to deploy and
   swap this hand-research method for calling its real `/api/scan` endpoint
   — would add verified technical findings (page speed, GBP completeness,
   structured data) on top of the ownership/news signals used here.
3. Two of nine contacts (Santiago's Bodega, Pig Floyd's) only have a
   department inbox (party/catering) rather than a general or ownership
   email — flagged in both the artifact and the table above as
   lower-confidence sends. Worth a manual pass to find a better address
   before these two actually queue.
