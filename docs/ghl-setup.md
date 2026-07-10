# GoHighLevel Manual Setup — unKAGEd Media Lead Outreach

Location: **unKAGEd Media Agency** (`sBaaCPRBew9XTxCNEY9t`, `app.unkaged.media`).

GHL has no public API for creating custom fields, tags, or workflows, so this
half of the build has to happen by hand in the UI (~20-30 minutes). Everything
that *can* be done via API (contact upsert, tagging, moving opportunities) is
handled by the Make.com scenario in `make/unkaged-lead-outreach.blueprint.json`
and does not need manual setup.

## 1. Custom fields to create

Settings -> Custom Fields -> Contact -> Add Field. Use these exact field keys
(GHL derives the key from the name, so name them exactly as shown -- verify
the resulting key matches the `contact.<key>` column before saving, since the
Make blueprint references these keys directly).

| Field name | Type | Resulting key |
|---|---|---|
| Lead Source Channel | Single line | `contact.lead_source_channel` |
| Company Website | Single line | `contact.company_website_outbound` |
| LinkedIn URL | Single line | `contact.linkedin_url` |
| Lead Research Summary | Multi-line | `contact.lead_research_summary` |
| Personalization Angle | Single line | `contact.personalization_angle` |
| Pain Point Hypothesis | Multi-line | `contact.pain_point_hypothesis` |
| Lead Score | Number | `contact.lead_score` |
| Outreach Step1 Subject | Single line | `contact.outreach_step1_subject` |
| Outreach Step1 Body | Multi-line | `contact.outreach_step1_body` |
| Outreach Step2 Subject | Single line | `contact.outreach_step2_subject` |
| Outreach Step2 Body | Multi-line | `contact.outreach_step2_body` |
| Outreach Step3 Subject | Single line | `contact.outreach_step3_subject` |
| Outreach Step3 Body | Multi-line | `contact.outreach_step3_body` |
| LinkedIn Connection Note | Multi-line | `contact.linkedin_connection_note` |

> Note: `company_website_outbound` is deliberately not the existing "Please
> provide the URL of your website" field -- that one belongs to an inbound
> form flow and mixing the two risks cross-contaminating inbound/outbound
> data on shared contacts.

If a resulting key differs from the table above (GHL sometimes appends a
number when a similar key exists), update the key used in the Make blueprint's
GHL upsert-contact module to match.

## 2. Tags to create

Tags auto-create on first use, so you don't need to pre-create them, but for
clarity the sequence uses:

- `source:clay` -- applied on ingest
- `outreach:queued` -- triggers the sequence workflow (§4)
- `outreach:step1-sent`, `outreach:step2-sent`, `outreach:step3-sent`
- `outreach:replied` -- stops the sequence
- `outreach:sequence-complete` -- finished all 3 steps, no reply
- `outreach:disqualified` -- manual tag for "not a fit," suppresses future sends
- `outreach:needs-review` -- low lead_score rows Make routes here instead of queuing

## 3. Pipeline mapping

Reuse the existing **Digital Marketing Pipeline** (`eG2OVYUlRXmmN9ULneCj`) --
its stages already match an outbound funnel:

| Stage | ID | When |
|---|---|---|
| New Lead | `813e8c4e-dc17-4711-aed9-ee70a553ffe1` | Opportunity created on ingest |
| Contacted | `f9ae0188-ebf3-46ed-a0e5-98ff6bad764d` | After step 1 email sends |
| Qualified | `87f4edd5-e26e-4aaf-9b6e-63b8edf63da0` | On reply (workflow §5 moves it here) |
| Proposal Sent / Negotiation / Closed | (existing) | Manual, once a human takes over |

Do not create a new pipeline -- keeping outbound in this existing pipeline
means Kirk sees inbound and outbound leads in one funnel view.

## 4. Workflow — "Outbound: Cold Sequence"

Automation -> Workflows -> Create Workflow -> Start from scratch.

**Trigger:** Tag Added -> `outreach:queued`

**Steps:**
1. **Send Email** — Template "Outreach Step 1" (content below, §6). To:
   contact email. From: kirk@unkagedmedia.com.
2. **Add Tag** `outreach:step1-sent` / **Remove Tag** `outreach:queued`
3. **Wait** 3 business days (use GHL's "business days" wait option, not
   calendar days)
4. **If/Else:** Contact has tag `outreach:replied`?
   - **Yes branch:** End workflow (the reply workflow in §5 handles it)
   - **No branch:** continue
5. **Send Email** — Template "Outreach Step 2"
6. **Add Tag** `outreach:step2-sent`
7. **Wait** 4 business days
8. **If/Else:** Contact has tag `outreach:replied`?
   - **Yes branch:** End workflow
   - **No branch:** continue
9. **Send Email** — Template "Outreach Step 3"
10. **Add Tag** `outreach:step3-sent`
11. **Wait** 5 business days
12. **If/Else:** Contact has tag `outreach:replied`?
    - **Yes branch:** End workflow
    - **No branch:** **Add Tag** `outreach:sequence-complete`, **Update
      Opportunity Stage** -> stays at Contacted (a human can re-engage or
      disqualify manually)

**Workflow settings:** allow re-entry = off (a contact should only run this
sequence once unless manually re-queued); if-else "wait" timeout = end of
branch.

## 5. Workflow — "Outbound: Reply Detected"

A second, simple workflow that ends the sequence the moment a prospect
replies.

**Trigger:** Customer Replied (native GHL trigger, channel = Email) AND
contact has any tag starting with `outreach:` (use the trigger filter to
require at least one of `outreach:queued`, `outreach:step1-sent`,
`outreach:step2-sent`, `outreach:step3-sent`)

**Steps:**
1. **Add Tag** `outreach:replied`
2. **Remove Tags** `outreach:queued`, `outreach:step1-sent`,
   `outreach:step2-sent`, `outreach:step3-sent`
3. **Update Opportunity Stage** -> Digital Marketing Pipeline -> Qualified
4. **Internal Notification** (SMS or email to Kirk) — "Reply from
   {{contact.first_name}} {{contact.last_name}} at {{contact.company_name}} —
   check conversation."

## 6. Email template content

Create these as 3 separate templates (Marketing -> Emails -> Templates ->
create). Since GHL's template API has no content parameter usable from this
session, paste the following manually. Each template body is intentionally
just merge fields — Claude writes the actual copy per-lead (see the system
prompt); the template's only job is subject + body merge + a plain-text
signature.

**Template: "Outreach Step 1"**
- Subject: `{{contact.outreach_step1_subject}}`
- Body (plain text, not the drag-builder — cold outbound should look like a
  real email, not a designed one):
```
{{contact.outreach_step1_body}}

Kirk
unKAGEd Media
https://growth.unkaged.media
```

**Template: "Outreach Step 2"**
- Subject: `{{contact.outreach_step2_subject}}`
- Body:
```
{{contact.outreach_step2_body}}

Kirk
unKAGEd Media
https://growth.unkaged.media
```

**Template: "Outreach Step 3"**
- Subject: `{{contact.outreach_step3_subject}}`
- Body:
```
{{contact.outreach_step3_body}}

Kirk
unKAGEd Media
https://growth.unkaged.media
```

Use plain-text templates (toggle "Plain Text" if available) — HTML-designed
templates with logos/buttons read as marketing blasts and hurt reply rate on
cold outbound.

## 7. LinkedIn step (manual, outside GHL)

`contact.linkedin_connection_note` is generated for whoever is running
LinkedIn outreach (Kirk or a VA) to paste as the connection-request note. This
is not automated — GHL/Make have no LinkedIn integration in this stack.
Recommended cadence: send the LinkedIn connection request the same day as
Step 1 email.

## 8. Sending domain / deliverability

Before turning this on for volume: confirm SPF/DKIM/DMARC are set for the
sending domain in GHL's email settings, and warm up any new sending mailbox
gradually. Cold sequences from an unwarmed domain will land in spam
regardless of copy quality.
