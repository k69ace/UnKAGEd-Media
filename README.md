# UnKAGEd-Media — Autonomous Lead Outreach

Outbound lead-generation system for unKAGEd Media Agency: Clay sources and
enriches leads, Claude researches each prospect and drafts a personalized
3-email sequence, Make.com writes qualified leads into GoHighLevel, and GHL's
native workflows send the sequence and stop it the moment someone replies.

Start here: **[`docs/architecture.md`](docs/architecture.md)** for the full
system diagram and design rationale.

## Build order

1. [`docs/clay-setup.md`](docs/clay-setup.md) — Clay table: source list,
   enrichment columns, the Claude API call, score-based routing.
2. [`prompts/claude-outreach-system-prompt.md`](prompts/claude-outreach-system-prompt.md) —
   the system prompt Clay sends to Claude per lead.
3. [`docs/ghl-setup.md`](docs/ghl-setup.md) — custom fields, tags, pipeline
   mapping, the two GHL workflows (send sequence / detect reply), email
   template content.
4. [`make/`](make/) — the webhook-triggered Make.com scenario that connects
   Clay to GHL. Import instructions and payload shape in
   [`make/README.md`](make/README.md).

## Status

Docs and the Make blueprint are complete and importable. Live provisioning
via the Make.com MCP connector was attempted but blocked this session (needs
re-authorization — see `make/README.md`); GHL custom-field and workflow
creation has no public API and is a manual (documented) step regardless.

**First live pilot ran 2026-07-10** against 9 real Orlando restaurants (see
[`docs/pilots/2026-07-10-orlando-restaurants.md`](docs/pilots/2026-07-10-orlando-restaurants.md)):
sourced and researched by live web search (no Clay), drafted by hand against
the system prompt's voice rules, and pushed into GHL as real contacts —
tagged `outreach:review`, so nothing sends until Kirk reviews and retags.
Ties in with [PR #1](https://github.com/k69ace/UnKAGEd-Media/pull/1)
(Restaurant Grader): once that's deployed, its `/api/scan` endpoint should
replace hand-research as the enrichment source for this vertical — see
"Known gaps" in `docs/architecture.md`.
