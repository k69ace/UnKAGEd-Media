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
large hospitality-group properties). Three sourcing passes the same day, 28
candidates total across Mills 50, Ivanhoe Village, Downtown, Baldwin Park,
Milk District, Winter Park, Winter Garden, Dr. Phillips, SoDo, Colonialtown,
Hourglass District, and Oviedo; all confirmed as real, independently or
small-group-owned businesses with a publicly listed contact email (business
inquiry addresses — catering/party/info/owner desks, not scraped personal
emails).

## Results

| Restaurant | Score | Angle | GHL contact ID | Email used |
|---|---|---|---|---|
| Kaya | 72 | Michelin Green Star + James Beard press wave | `JyizQ57H2M4LEj8BEg4K` | info@kayaorlando.com |
| White Wolf Cafe | 78 | New ownership at a 30+ yr institution | `ZMXosVWz2074CV15LzfU` | info@whitewolfcafe.com |
| Swine & Sons | 70 | Expanding Orlando → Las Vegas | `695FP3XaXeFE7FnwocYO` | info@swineandsons.com |
| Chayote Barrio Kitchen | 68 | Celebrity chef's mainland US debut | `vr7ppgTvTsEMDOcNSnE7` | reservations@chayotebarriokitchen.com |
| Relax Grill | 66 | Lakefront Lake Eola foot traffic, unconverted | `cCnmcQpmryKUJbSYnqFj` | relaxgrill@gmail.com |
| TaKo Cheena | 65 | Solo chef-owner running 2 concepts | `fZaVLyYmghKw95r0Utzl` | takocheena@gmail.com |
| Crocante Restaurant | 64 | Press-anointed signature dish, unlevered | `uRMFqu4wWDsaB4XhtdYP` | support@crocantekitchen.com |
| Chatham's Place | 63 | Chef's own garden as an unused content story | `yDhPtXUGAfdAtNM4CylC` | info@chathamsplace.com |
| La Bella Luna | 62 | 3-year "Best Pizza" streak, unlevered | `wyoTMR6KYLNz42n0jvtD` | labellalunaflorida@gmail.com |
| Papa Llama | 62 | Michelin-recognized but press calls it "lowkey" | `mGjttSrfsjiw4t5H47Re` | hola@papallamaorl.com |
| Kadence | 61 | Reservation-only; off-peak seating gap | `3wSTqIUkIhsVJgP0OYCe` | info@kadenceorlando.com |
| Santiago's Bodega | 60 | Packed brunch, no weekday-conversion system | `aRwHhSpAzvOyVw5DnTo8` | party@santiagosbodega.com |
| TALAY | 60 | Newer concept in a crowded downtown strip | `OMVNiW18zsQ6KD8ALrnm` | talaythaiorlando@gmail.com |
| Beezer Eats | 59 | Food-truck-origin brand voice, unsystematized | `Acg6wV2V8ypPgU2FfuYf` | forrest@beezereats.com |
| Reyes Mezcaleria | 58 | One of several concepts under a small group | `JLgVaH9URCm1lRgssltR` | info@reyesmex.com |
| Infusion Tea | 58 | Niche vegetarian audience, no direct list yet | `A0438h4DqYTa3jdPqBDF` | brad@infusiontea.us |
| Se7en Bites | 58 | Bakery + catering, two unconnected audiences | `hN3OBoxxYBf9gJFZoEcM` | trina@se7enbites.com |
| Delaney's Tavern | 57 | Owned by 2 full-time physicians, no bandwidth | `aOdYMGeFi1fG5POkUdk4` | info@eatdt.com |
| JJ's Fresh from Scratch | 56 | Has a marketing inbox, no system behind it | `HaoQxNFADmTiJPjt4lwA` | jjsmarketing@jjsfresh.com |
| Pig Floyd's Urban Barbakoa | 55 | Consolidating out of a second location | `ufS7g0jQBnhQHKS1dPTF` | catering@pigfloyds.com |
| Bosphorous Turkish Cuisine | 55 | 20+ yr legacy brand running on word of mouth | `lZ2OdkCFfbF7u1ktS4Oc` | info@bosphorousrestaurant.com |
| The Attic Door | 54 | 3 venues in 1 (wine/music/tea), unconnected audiences | `Ensi7ItIVbg4fTniYwbb` | wintergardenattic@gmail.com |
| Claddagh Cottage Irish Pub | 53 | Recently relocated, awareness reset needed | `vxOYHLMTzKmtbNV7oOMF` | vicki@claddaghcottagepub.com |
| TORI TORI | 52 | 1 of 7 concepts under one chef-owner group | `kA88m2NaNXSdDB4McmoE` | toritoripub@gmail.com |
| Black Bean Deli | 51 | Legacy institution vs. newer marketed competitors | `jT7KavsZIwIvHiG5zpHB` | catering@blackbeandeli.com |
| Zaru | 50 | Fresh Michelin Bib Gourmand press wave | `7L6xevqA0t01WWFn16Ej` | info@zarufl.com |
| Bulla Gastrobar (Winter Park) | 50 | 1 location inside a multi-city group | `Jbv1vBomGB0mNHFA0Rq1` | info@bullagastrobar.com |
| Omega Deli | 48 | Lunch-dependent, dead evenings/weekends | `1hVSqseaXTmL7lQ8iylT` | constantino@omegadelirestaurant.com |

Full research summaries, pain-point hypotheses, and all 84 drafted emails
(3 per restaurant) were shared as a review artifact in the same conversation
this file was committed from — ask Kirk for the link if it's not already at
hand, or regenerate from the contact records below once custom fields exist.

**Correction (same day, before this file's second commit):** the original
Se7en Bites draft referenced her second concept SETTE in Ivanhoe Village.
SETTE has since closed (confirmed via Yelp) — the angle and all 3 drafts for
Se7en Bites were rewritten around the bakery/catering split instead. Score
dropped 63 → 58 to reflect the weaker angle. Flagged in the artifact with a
visible "corrected" marker on that ticket.

### Considered and excluded (all three sourcing passes)

Logged so a future pass doesn't re-spend time on these.

**Confirmed closed (Yelp or press):** Junior's Diner, The Rusty Spoon, Colibri
Mexican Cuisine, Soco Thornton Park, Le Ky Patisserie, Leguminati, La Femme
du Fromage, Steak on Fire, SETTE.

**Real and open, but no publicly verifiable contact email found** (only a
phone number, a contact form, or a Cloudflare-obfuscated address this
session's tools can't decode): Papi's Burritos, Otto's High Dive, DOMU,
Kappo Tsan (also same ownership as Zaru, already in this batch), Cecil's
Texas Style BBQ, Johnny's Fillin' Station, Rockpit Brewing, The Strand,
Umi Japanese, Black Rooster Taqueria, Theo's Kitchen, Uncommon Catering,
Sixty South, Foxtail Coffee, Chuan Lu Garden, BoVine Steakhouse, Boca,
Prato (owned by a hospitality group, not independent, regardless), Mia's
Italian Kitchen (part of Alex Restaurant Partners group, not independent),
Canvas Restaurant & Market (Tavistock Restaurant Collection, not
independent), Nona Blue, Tabla Indian Restaurant (franchise brand),
Antonio's (recently sold to a hospitality group), Chef's Table at the
Edgewater (recently sold, no email found), Positano, Yao's, Stefano's,
Market to Table, Mangoni, Cedar's, Flame Kabob, Pammie's Sammies (original
Dr. Phillips location also closed), The Wine Room, Kabooki Sushi.

## What's actually live right now

- All 28 exist as real GHL contacts (ids above), in the `unKAGEd Media
  Agency` location, tagged `source:pilot-live-research`, `outreach:review`,
  `vertical:restaurant`.
- **Custom field data did not attach.** The upsert call for White Wolf Cafe
  was sent with the full `customFields` payload (research summary, angle,
  all 3 drafts) and GHL's API returned `"customFields": []` — the 14 fields
  documented in `docs/ghl-setup.md` §1 don't exist in this account yet, so
  GHL silently drops unknown keys rather than creating them. The remaining 27
  contacts were pushed with core fields only (no point sending data that gets
  dropped). Once the fields exist, re-running the same upsert calls
  (idempotent on email) will backfill this content onto these same records.
- **No opportunities were created.** The GHL MCP connector available this
  session exposes `opportunities_get/search/update` but no create action.
  Either create these 28 manually in the Digital Marketing Pipeline's "New
  Lead" stage, or wait until the Make.com connector is reauthorized and use
  the blueprint in `make/`.
- **Nothing will send.** `outreach:review` is not the trigger tag for the
  cold-sequence workflow (`docs/ghl-setup.md` §4 triggers on
  `outreach:queued`) — these 28 sit inert until a human retags them.

## Custom field backfill attempted 2026-07-13 — blocked by a connector bug

Kirk created the 14 custom fields per `docs/ghl-setup.md` §1 (confirmed live via
`locations_get-custom-fields` — all 14 exist with the exact keys these drafts
reference). Attempted to re-run the upsert on White Wolf Cafe
(`ZMXosVWz2074CV15LzfU`) to backfill the research/drafts now that the fields
exist.

**Every write attempt reports success but the data never lands.** Tried, in
order: `contacts_upsert-contact` with key-based custom fields
(`{"key": "contact.lead_score", "field_value": "78"}`) — 201, `customFields: []`
on read-back. `contacts_update-contact` with the same payload — 200, still
empty. ID-based reference instead of key
(`{"id": "XEiKknfwCIqjEh7lQsdl", "field_value": "78"}`) — 200, still empty.
`value` instead of `field_value` as the payload key — 200, still empty.
Confirmed via a direct `contacts_get-contact` read after each attempt, not
just trusting the upsert response. All four are documented, valid GHL API v2
shapes — this isn't a payload-format mistake, it's the MCP connector's
`contacts_upsert-contact`/`contacts_update-contact` tools silently failing to
forward `customFields` writes to GHL's actual API.

Did not repeat this against the other 27 contacts — the failure is
consistent and not something retrying fixes. Two real paths forward:

1. **Retry in a future session** in case this is a transient connector issue
   that gets fixed upstream (Anthropic/GHL connector update) — worth a
   one-contact test before committing to a full 28-contact re-run.
2. **Use the Make.com scenario instead** (`make/`) once that connector is
   reauthorized. It writes to GHL via direct HTTP calls with a Private
   Integration Token (`docs/architecture.md`), bypassing this specific MCP
   tool entirely — this was already the documented approach for scale, this
   just confirms it's now the *only* proven path for custom-field data, not
   just the preferred one.

Core fields (name, email, company, website, tags, source) are unaffected —
those write and read back correctly on all 28 contacts, confirmed above.

**Re-confirmed 2026-07-13, several hours later:** same test contact, same
`contact.lead_score` field, `contacts_update-contact` with a fresh call —
200 success, `customFields: []` on read-back again. Not transient. Not
retrying further from this session; this needs either a connector fix or
the Make.com HTTP path.

**GHL-side build for the send pipeline is otherwise complete as of
2026-07-13**: both workflows ("Outbound: Cold Sequence" and "Outbound:
Reply Detected") and all 3 email templates are built per `docs/ghl-setup.md`
§4-6. The pipeline is fully wired and will fire correctly the moment a
contact is tagged `outreach:queued` — but since the templates are 100%
merge-field driven and the custom fields still won't populate, queuing any
contact right now would send a blank email. Do not tag anything
`outreach:queued` until this is resolved.

## Follow-ups this pilot surfaced

1. Add `outreach:review` as a formally documented holding tag in
   `docs/ghl-setup.md` (done — see §2 there) so future batches use the same
   gate instead of drifting to ad hoc tag names.
2. Decide whether to wait for the Restaurant Grader (PR #1) to deploy and
   swap this hand-research method for calling its real `/api/scan` endpoint
   — would add verified technical findings (page speed, GBP completeness,
   structured data) on top of the ownership/news signals used here.
3. Several contacts (Santiago's Bodega, Pig Floyd's, Black Bean Deli) only
   have a department inbox (party/catering) rather than a general or
   ownership email — flagged in the artifact as lower-confidence sends.
   Worth a manual pass to find better addresses before these queue.
4. Requested batch size was 30; landed at 28. Roughly 60 additional
   candidates were checked across this and prior passes — about half had no
   publicly discoverable general contact email. Diminishing returns set in
   hard by the end (multiple 5-search rounds yielding 0-1 verified emails);
   closing the last 2 would mean either guessing an email (against this
   project's own rule) or a genuinely fresh sourcing angle (e.g. a paid
   email-finder API) rather than more manual web search.
