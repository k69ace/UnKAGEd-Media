# Clay Table Setup — unKAGEd Media Lead Outreach

Clay is the sourcing + enrichment + personalization layer. It is not
API-accessible from this session (no Clay MCP connector), so this is a build
guide for setting the table up by hand in the Clay UI. Budget ~30-45 minutes
for first-time setup.

## 1. Create the table

New table -> "Import" -> pick your source list (Apollo search, LinkedIn Sales
Nav list export, CSV of target accounts, etc.) Target: owner/founder or
marketing-decision-maker titles at SMBs matching unKAGEd's ICP (see the system
prompt for the ICP description).

## 2. Columns, in build order

| # | Column | Type / Source | Notes |
|---|--------|---------------|-------|
| 1 | Company Name | Import | |
| 2 | Company Domain | Import / Clearbit Reveal | Required for everything downstream |
| 3 | First Name / Last Name / Title | Import or Apollo "Find People" | Filter title to Owner/Founder/CEO/CMO/Marketing Director |
| 4 | Work Email | Clay "Find Email" (waterfall: Apollo -> Findymail -> Hunter) | Enable built-in verification, drop rows with status = risky/invalid |
| 5 | LinkedIn URL (person) | Clay "Find LinkedIn Profile" | |
| 6 | LinkedIn URL (company) | Clay "Find Company LinkedIn" | |
| 7 | Employee Count / Industry | Clay "Enrich Company" (Clearbit or LinkedIn) | Used for lead scoring context, not shown to prospect |
| 8 | Website Homepage Text | Clay "Scrape Website" (or Firecrawl integration) | Truncate to ~2000 chars in a formula column before passing to Claude |
| 9 | LinkedIn About Text | Clay "Enrich LinkedIn Profile" | |
| 10 | LinkedIn Recent Posts | Clay "Enrich LinkedIn Profile" (posts) | Take top 2, snippet only |
| 11 | Ad Activity Signal | Clay "Meta Ad Library" / "Google Ads Transparency" enrichment (optional) | Feeds the "notes" field -- e.g. "no active Meta ads found" |
| 12 | Claude Research Bundle | Formula column | Assembles columns 1-11 into the JSON shape documented in `prompts/claude-outreach-system-prompt.md` |
| 13 | Claude Output | **HTTP API column** -> Anthropic Messages API | See §3 below. Output type: JSON |
| 14 | lead_score, research_summary, personalization_angle, pain_point_hypothesis, step1_subject, step1_body, step2_subject, step2_body, step3_subject, step3_body, linkedin_note | Formula columns | Each pulls one key out of column 13's JSON |
| 15 | Route | Formula: `lead_score >= 60 ? "send" : "manual_review"` | |
| 16 | Send to Make | Clay "Send to Webhook" action, condition = Route = "send" | See §4 |

## 3. Wiring the Claude column (column 13)

Clay's HTTP API column (or the native Anthropic integration if enabled on
your Clay plan) should call:

```
POST https://api.anthropic.com/v1/messages
Headers:
  x-api-key: {{ANTHROPIC_API_KEY}}   (Clay secret, not a table column)
  anthropic-version: 2023-06-01
  content-type: application/json
Body:
{
  "model": "claude-sonnet-5",
  "max_tokens": 1600,
  "temperature": 0.6,
  "system": "<paste the full system prompt from prompts/claude-outreach-system-prompt.md>",
  "messages": [
    { "role": "user", "content": "{{Claude Research Bundle}}" }
  ]
}
```

Store `ANTHROPIC_API_KEY` in Clay's secrets manager, not in a table cell.
Parse the response's `content[0].text` as JSON (add a Clay "Parse JSON"
formula step if the HTTP column doesn't auto-parse).

Add a validation formula column: `is_valid_output = Claude Output != null AND
step1_body != "" AND lead_score != null`. Rows failing this get routed to
manual review regardless of score.

## 4. Sending qualified leads to Make

Action column, type "Send to Webhook":
- URL: the Make.com custom webhook URL from `make/unkaged-lead-outreach.blueprint.json`
  (grab it from the scenario's webhook module after import -- see that file's
  header comment for the exact payload shape it expects).
- Trigger condition: `Route = "send"`
- Payload: send every column listed in step 14 above, plus company name/domain,
  contact name/email/title, linkedin_url, and industry/employee_count for
  context.
- Rate-limit: batch sends to respect both Clay's and Make's plan limits (Clay
  has a built-in "throttle" option on webhook actions -- use it, don't fire
  hundreds of rows at once into a single Make scenario run).

## 5. Ongoing hygiene

- Re-run email verification weekly on unsent rows (emails go stale).
- Suppress rows whose domain/email already exists as a GHL contact with tag
  `outreach:replied` or `outreach:disqualified` (add a Clay dedupe check
  against a GHL export, or maintain a suppression list column manually until
  a two-way sync is worth building).
- Cap sends per sending domain/mailbox per day per your email deliverability
  plan (typically 30-50/mailbox/day for cold outbound) -- enforce this in
  Clay's send throttle, not downstream.
