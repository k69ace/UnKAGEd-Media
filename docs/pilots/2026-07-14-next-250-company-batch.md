# Next 250 companies from the full 2,352-row export — 2026-07-14

## Scope

Per Kirk's direction after reviewing the 500-company test batch: run 250 more
companies from the full Prospeo company export (2,352 rows total), same
depth/method as the 500-batch, but first check the **full 2,352** for overlap
with everything already processed (the 182-contact person-export batch and the
first 500 companies) rather than just the first 500.

## Dedup pass across the full 2,352

Cross-referenced every row in the full export against the already-processed
182 + 500 by company website domain and name:

- **60 rows in the 500–2351 range were already covered** by the earlier two
  batches (Prospeo appears to resurface some of the same restaurants across
  different exports/pulls).
- **2 internal duplicates** within the export itself.
- Selected the next **250 clean, non-duplicate** companies from what remained
  (original export rows 500–761, skipping the ones removed above).

## Method

Same as the 500-company batch: 10 parallel agents, 25 companies each, each
identifying an owner/manager name, researching email/phone, and drafting the
3-step outreach sequence in one pass. Agents were also instructed not to
further self-delegate (one agent in the prior batch had split its own
assignment into sub-agents; harmless but unplanned).

## A note on how this batch actually finished

All 10 agents hit the account's **monthly API spend limit** partway through
and were terminated by the platform before they could report back normally.
The good news: every one of them had already written its output file in full
(250/250 companies present, no gaps, no duplicates) — the work itself wasn't
lost, only the agents' own end-of-run summaries were cut off. **This limit
needs to be raised at claude.ai/settings/usage before running another batch
this size** — the same interruption will happen again at this scale otherwise.

## Results

- **250 companies processed, 212 GHL-ready.**
- 18 flagged (closed businesses, e.g. Cape Dutch in Atlanta — confirmed closed
  Jan 2020; non-US records slipping into the export again, e.g. Paco's
  Restaurant, which is actually in Perth, Scotland despite a Playa Del Rey, CA
  address in the source data).
- 20 with no contact method found at all (higher than the 500-batch's 1% rate
  — likely related to the spend-limit interruption cutting some research short
  before agents could exhaust their search budget; worth a lighter re-pass on
  just these 20 if useful).
- Lead scores ranged 15–60 among the ready set, no duplicate emails.

## Output

Two CSVs (not committed — contain drafted outreach copy and contact PII),
same 12-field structure plus the `Tags` column (`source:prospeo-company-export,
vertical:restaurant,outreach:review`) already baked in:

- `unkaged_next250_batch_full.csv` — all 250 rows with `GHL_Ready` flag.
- `unkaged_next250_ghl_import_ready.csv` — the 212 `YES` rows.

Both delivered directly to Kirk.

## Running total across all three prospecting batches so far

- 182-contact person export: 136 ready.
- First 500 companies: 447 ready.
- Next 250 companies: 212 ready.
- **795 contacts ready for GHL import so far**, all held at `outreach:review`
  pending Kirk's manual approval to move any to `outreach:queued`.
- ~1,600 companies remain unprocessed in the full 2,352-row export.
