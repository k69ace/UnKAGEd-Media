# National restaurant-owner prospecting batch — 2026-07-14

## Source

Kirk supplied a Prospeo person-export CSV (`prospeo_person_export_20260713_210538.csv`,
182 restaurant owner/manager contacts, nationwide — not limited to Orlando). Unlike
the [2026-07-10 Orlando pilot](2026-07-10-orlando-restaurants.md), which was
hand-sourced end-to-end, this batch started from an existing paid data source and
the task was enrichment + outreach drafting on top of it, for import into the same
GHL "Outbound Prospecting" infrastructure (12 custom fields, `outreach:review`
holding tag, Digital Marketing Pipeline — see `docs/ghl-setup.md`).

## What was missing

Of 182 contacts: 39 already had a Prospeo-verified email + mobile. The rest needed
work:

- 136 missing a verified email
- 58 missing a verified mobile — but 42 of those already had an unused
  `Company HQ Phone` in the same export that nobody had mapped to the outreach
  field, cutting the real phone-research gap to **16**.

So real research was needed for **137 of 182** contacts (some missing only email,
some only phone, most missing email only).

## Enrichment method

8 parallel research agents each took ~17 contacts and searched (WebSearch only —
WebFetch is confirmed non-functional in this environment) for a real, published
email and/or phone via the restaurant's own site, press coverage, LinkedIn, and
local news — the same no-fabrication rule as the Orlando pilot: never construct a
`firstname@domain.com` guess, only report what was actually found on a real page,
with a source.

**Results: 70 of 136 missing emails found (51%), all 16 missing phones resolved
(100%, mostly via business landlines).**

## A material finding: the source data has real accuracy problems

Because the research agents verified each contact against public sources rather
than trusting the export at face value, they surfaced **46 of 182 records (25%)**
with a genuine data-quality problem serious enough to withhold from outreach:

- **Wrong person/company pairing** — the largest category by far. The `company_website`
  or address on file frequently belongs to a *different* restaurant that happens to
  share a name (multiple "Mill Creek Tavern," "Johnny D's," "Zola," "Tide Tables,"
  "Metropolitan Grill" collisions found), or press names a different actual owner
  than the contact record.
- **LinkedIn business-page scraping artifacts** — several "full names" are literally
  the restaurant's own name ("Tequila Ntacos," "Les Bubbles," "The Grape Leaf Diner,"
  "The Samsara Restaurant and Cocktail"), meaning Prospeo scraped the business's own
  LinkedIn page as if it were a person.
- **Restaurant closed or ownership changed** — at least 7 records point to a
  restaurant that has since closed permanently or changed hands (Waterhouse
  Restaurant, Eden Hill, Gale Street Inn, Zola New World Bistro in State College,
  Avenue Kitchen, MezzaNotte, White Horse Inn/Diss).
- **One likely-deceased contact** — a 2023 obituary matches the name/location/
  restaurant for one record (Cary Hart, Aw Shucks / Ponte Vedra Beach). Excluded
  pending verification.

None of these 46 were force-fit into outreach copy. Each has an explanation in the
CSV's `Personalization Angle` column (prefixed `SKIPPED:`) instead of drafted
emails, and a deliberately low `Lead Score` (0 for deceased/permanently-closed,
15–25 for unverified mismatches) so they sort to the bottom / can be filtered out
before import.

**Recommendation: do not import these 46 as-is.** They need a human pass to
either correct the contact/company pairing or be dropped.

## Personalization + outreach drafts

For the 136 remaining, ready contacts: wrote `lead_research_summary`,
`personalization_angle`, `pain_point_hypothesis`, `lead_score`, and a 3-step
outreach sequence (subject + body × 3) per contact, in the same voice established
in the Orlando pilot (Kirk, unKAGEd Media, direct/warm, `kirk@unkagedmedia.com`
sign-off, soft CTA). Every email references something specific and sourced from
that contact's research — no generic filler.

International leads (non-US/Canada — Poland, Netherlands, Australia, UK, Belgium,
Israel, etc., roughly a dozen records) got a shorter, distancing-aware sequence
("given the distance, wanted to check if remote support is something you'd even
consider") rather than a fully localized pitch, and a capped `lead_score`
(18–30) reflecting lower fit for a locally-delivered US service.

## Output

Two CSVs generated (not committed to this repo — contain full drafted outreach
copy and real contact PII):

- `unkaged_prospecting_batch_full.csv` — all 182 rows, includes the `GHL_Ready`
  column (`YES` / `NO - flagged`) so nothing is silently dropped from the record.
- `unkaged_prospecting_ghl_import_ready.csv` — only the 136 `YES` rows, ready to
  map into GHL's contact importer against the same 12 custom fields used for the
  Orlando pilot.

Both delivered directly to Kirk.

## Process note vs. the Orlando pilot

This batch used parallel background research/drafting agents (8 for research, 6
for copywriting) rather than one sequential pass, given the 137-contact research
volume — a scale difference from the Orlando pilot's 28 hand-researched leads.
Each agent worked off a pre-split batch file and wrote structured JSON to the
scratchpad rather than returning full text inline, then everything was merged
programmatically. Same sourcing discipline (WebSearch only, no fabricated
emails/phones) was enforced via the agent instructions and spot-checked in the
merge.
