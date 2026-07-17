# Make.com Scenario — Import Instructions

## Why this is a static file, not a live scenario

This session's Make.com MCP tools were structurally blocked (every call —
including read-only ones like `apps_recommend` and `users_me` — failed with
"MCP tool call requires approval," across repeated attempts). The Make
integration needs to be authorized outside this session (via `claude mcp` or
the connector settings) before Claude can provision it live. Until then, this
blueprint is the deliverable: a normal Make export/import file.

**This file was hand-authored, not exported from a live Make scenario or
validated against Make's schema validator (also blocked).** The module
identifiers (`gateway:CustomWebHook`, `http:ActionSendData`) and field shapes
are correct as of recent Make versions, but if a module shows a red warning
icon after import, the fix is almost always: open the module, re-select it
from the app/module picker if needed, and the URL/headers/body you see below
will still be there to reference — this is a 1-minute fix per module, not a
rebuild.

## Import steps

1. Make.com -> your team -> Scenarios -> Create a new scenario -> ⋮ menu (top
   right) -> **Import Blueprint** -> upload `unkaged-lead-outreach.blueprint.json`.
2. Module 1 (webhook): click it, create a new webhook (name it something like
   "unKAGEd Lead Outreach Intake"). Copy the generated webhook URL — this is
   what Clay's "Send to Webhook" action (see `docs/clay-setup.md` §4) posts to.
3. Modules 2 and 3 (HTTP calls to GoHighLevel): open each, find the
   `Authorization` header, and replace `REPLACE_WITH_GHL_PRIVATE_INTEGRATION_TOKEN`
   with a real GHL Private Integration token for the `unKAGEd Media Agency`
   location (Settings -> Private Integrations in GHL -> create one with
   Contacts + Opportunities write scopes).
4. Confirm the custom fields referenced in module 2's body exist in GHL first
   — see `docs/ghl-setup.md` §1. If a `customFields[].key` doesn't match an
   existing field, GHL's API will either ignore that entry or 422, depending
   on the field type; test with one row before turning on live volume.
5. Run the scenario once manually with a sample payload (see shape below) and
   confirm: (a) module 2 creates/updates a contact with the tag
   `outreach:queued` or `outreach:needs-review`, (b) module 3 only fires when
   `lead_score >= 60` and creates an opportunity in the Digital Marketing
   Pipeline's "New Lead" stage.
6. Turn the scenario on (it's instant/webhook-triggered, no schedule needed).

## Expected incoming payload (from Clay)

```json
{
  "first_name": "Dana",
  "last_name": "Whitfield",
  "email": "dana@whitfieldortho.com",
  "title": "Owner",
  "company_name": "Whitfield Orthodontics",
  "company_domain": "whitfieldortho.com",
  "linkedin_url": "https://linkedin.com/in/...",
  "industry": "Healthcare - Dental/Ortho",
  "employee_count": 14,
  "lead_score": 74,
  "research_summary": "...",
  "personalization_angle": "...",
  "pain_point_hypothesis": "...",
  "step1_subject": "...",
  "step1_body": "...",
  "step2_subject": "...",
  "step2_body": "...",
  "step3_subject": "...",
  "step3_body": "...",
  "linkedin_note": "..."
}
```

## Why HTTP modules instead of the native GoHighLevel app

Make's app store has a dedicated GoHighLevel/HighLevel connector, which would
normally be the nicer choice (proper OAuth connection, dropdown pickers for
pipeline/stage instead of hardcoded IDs). This blueprint uses the generic
HTTP module instead because building against the native app's exact module
identifiers requires querying Make's live app registry to get them right, and
that lookup was blocked this session too. Swapping modules 2 and 3 for the
native GoHighLevel "Update/Create a Contact" and "Create an Opportunity"
actions is a reasonable follow-up once Make access is restored — same logic,
cleaner UI.

## Send gate

Module 2 always tags a new contact `outreach:review`, never `outreach:queued`
-- this scenario does not decide on its own that a lead is ready to email.
`outreach:queued` (the tag that actually starts the GHL send workflow, see
`docs/ghl-setup.md` §4) only gets applied by a human retagging a contact in
GHL after reviewing the drafts. If/when there's enough track record to trust
auto-queueing high-score leads, that's a deliberate one-line change to this
module's `tags` mapper -- don't make it silently.

## What this scenario deliberately does not do

Multi-day waits (3/4/5 business days between sequence emails) are handled
natively inside GHL's own workflow engine, not in Make — see
`docs/ghl-setup.md` §4-5. Keeping a Make scenario open for days per execution
burns operations for no benefit; GHL's workflow "Wait" step is free and
purpose-built for this. This scenario's only job is: receive the
Clay-enriched lead, write it into GHL, and (if it clears the score bar) open
an opportunity. Tagging the contact `outreach:queued` is what actually starts
the GHL-side sequence.
