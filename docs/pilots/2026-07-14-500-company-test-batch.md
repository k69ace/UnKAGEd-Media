# 500-company test batch — 2026-07-14

## Source

Kirk supplied a second Prospeo export (`prospeo_company_export_20260714_013459.csv`,
2,352 restaurant companies nationwide) — a **company-level** export with zero
person/contact data (no names, emails, phones, or LinkedIn person URLs). Per
Kirk's direction, this was scoped as a 500-company test (first 500 rows) before
committing to the full 2,352.

## Method — different from the prior two batches

The person-export batches (Orlando pilot, national 182) started from a named
contact and only needed email/phone enrichment. This export required identifying
**who to contact in the first place** for every one of the 500 companies, then
finding their email/phone, then drafting outreach — a heavier research load per
lead. Ran 20 parallel agents (25 companies each), each doing all three steps
in one pass: owner/manager name search → email/phone research → 3-step outreach
draft, using the company's Prospeo-supplied AI description as a starting point
for personalization and grounding every claim in what was actually found via
WebSearch (no fabricated names, emails, or phone numbers — same rule as prior
batches).

One agent (batch 10) split its own 25-company assignment into 5 sub-agents of 5
each rather than working sequentially — an unplanned but harmless self-delegation
that still produced complete, correctly-scoped output once merged.

## Results

- **500 companies processed, 447 GHL-ready.**
- Owner/manager name found for 400 (80%).
- Real email found for 300 (60%) — the rest are phone-only, which is workable
  since 373 of the original 500 already had an unused `Company HQ Phone` in the
  source export, and research filled in most of the remainder (only 5 companies
  ended up with no contact method at all).
- Phone available for 443 (99%).

## Data-quality findings (same pattern as the 182-contact batch, different flavor)

**32 companies flagged, not included in the ready set:**

- **~20 confirmed closed, sold, or rebranded** since the export data was
  compiled — the single largest flag category. Several closed within the last
  few months (The Barn Door Restaurant, San Antonio, closed May 2026 after 73
  years; Fireside Supper Club and others). A few rebranded under new ownership
  at the same address (Stable DC → Steak Frites DC; Skidders → Sunset Kitchen
  and Drinks).
- **Mismatched company records** — several rows' `company_website` or
  `raw_address` pointed to a different, unrelated business than the
  `ai_description` actually described (e.g. Adobo Grill's domain resolves to an
  unrelated Chicago Mexican restaurant; Jeffs Restaurant's Texas address
  belongs to an entirely different California restaurant with a similar
  domain). Agents used the real, correctly-identified business where they could
  confirm it, and flagged the discrepancy in the record rather than silently
  guessing.
- **2 non-US restaurants slipped into a supposedly US-only export** — Barnacle
  (Liverpool, UK) and Eastern Revive (Cheshire, UK). Both excluded from the
  ready set (Barnacle was originally scored as ready by its research agent and
  had to be manually recaught and reclassified during the merge pass — worth
  a closing spot-check like this on any future batch too).

**15 duplicates with the existing 182-contact national batch** (already
enriched, already in GHL) — cross-referenced by company website/name and
excluded here rather than double-imported: Sotto Sopra, Avenue Kitchen, The
Vandal, Rudy's Redeye Grill, Exchange Street Bistro, Fireside Restaurant &
Lounge, Blue River Bistro, Vin Rouge, Bar Harbor Supper Club, Fiorino
Ristorante & Bar, Aqua Grill, Soul Cafe, Meat Market Restaurants, Red Onion
Restaurant, Augies. **Worth checking the remaining ~1,850 companies in the full
2,352-row export for the same overlap before running the rest** — Prospeo
appears to be resurfacing some of the same businesses across exports.

**5 companies with no contact method found at all** (no email, no phone,
research came up empty) — kept in the full file with a `NO - no contact
method` flag rather than dropped, in case they can be enriched later.

## Output

Two CSVs (not committed — contain drafted outreach copy and contact PII):

- `unkaged_500company_batch_full.csv` — all 500 rows with the `GHL_Ready`
  column (`YES` / `NO - flagged` / `NO - duplicate of existing batch` / `NO -
  no contact method`).
- `unkaged_500company_ghl_import_ready.csv` — the 447 `YES` rows, same 12-field
  structure as the prior batches, ready to map into GHL's importer.

Both delivered directly to Kirk.

## Before running the remaining ~1,850 companies

This was explicitly a test batch. Worth deciding, based on this batch's
results, whether to:
1. Run the rest at the same depth (expect similar ~90% ready rate after
   flags/dupes, ~60% email hit rate).
2. Check the full 2,352 against the existing 182 + this 500 for more overlap
   before spending research effort on likely-duplicates.
3. Confirm whether `outreach:queue`/`outreach:queued` should be applied on
   import or these should land at `outreach:review` like prior batches pending
   a manual pass — not yet decided as of this batch.
