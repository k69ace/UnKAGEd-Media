# Catering Estimator — User Guide (Sales Staff)

For Catering Sales Managers / Event Coordinators building and sending
estimates. If you manage tax rules, fee configuration, or approval
thresholds, see the [admin guide](./admin-guide.md) instead.

## Signing in

Go to `/estimator/login`. If your organization already has an account,
use **Sign in**. If you're the first person from your business, use
**Create organization** — this creates your organization and signs you in
as its first user (role: Sales Manager). Ask your Catering Admin or
Manager/Owner to promote your role or invite teammates from the Supabase
dashboard for now — there's no in-app invite flow yet (see Known
Limitations in the completion report).

Supabase may require you to confirm your email address before you can sign
in the first time — check your inbox for a confirmation link.

## Building an estimate

1. From **Pipeline**, click **New Estimate**.
2. Pick an existing customer, or fill in the "New customer" form (name,
   optional company, and a contact's name/email/phone) to create one and
   start the estimate in one step.
3. You land on the estimate builder. Work through the sections in any
   order — every section **autosaves when you click or tab out of it**
   (look for "Saving…" then "Saved" under each section; a red message
   means something didn't save and needs fixing).

### Sections

- **Event Details** — contact, event type, service style, date/time,
  venue, and both guest counts. "Estimated" is your working number;
  "Guaranteed" is the number you lock in once the client confirms — the
  system remembers every change to either one, with who changed it and
  when, in case a guest-count dispute ever comes up later.
- **Menu/Packages, Beverages & Alcohol, Rentals & Logistics** — add line
  items directly, or click **Apply template** (top of Menu/Packages) to
  drop in a whole package's line items at once, then adjust quantities/
  prices as needed. Every line item has its own taxable flag and tax rule
  — don't assume "taxable" defaults the way you expect; check it.
  Reorder rows with the ↑/↓ arrows next to each line (no drag-and-drop
  yet).
- **Staffing** — add roles, hours, and rate. You'll get an on-page note if
  you have more than 50 guests and no staffing line yet.
- **Fees & Discounts** — a dollar discount (can't exceed the subtotal —
  you'll get a clear error if you try) plus an optional minimum spend and
  a per-estimate profit target. Service charge and gratuity themselves are
  configured org-wide by your admin, not per estimate.
- **Payment Schedule** — deposit amount and due date, plus an optional
  installment schedule below it (**Add installment** for as many rows as
  you need — amount, due date, and a "paid" checkbox — then **Save
  schedule**). Installments can't total more than the grand total; you'll
  get a clear error if they do. Anything you add here shows up on the
  customer proposal PDF.
- **Notes** — customer-facing notes appear on the PDF proposal; internal
  notes never do.
- **Suggestions** — plain-language nudges (e.g. "no bar package for an
  evening reception — confirm this is intentional") and upsell ideas.
  These are always labeled **Suggestion** and never change your estimate
  by themselves — if one's worth acting on, add the line item yourself.

The **totals sidebar** on the right is live the whole time you're
building: customer-facing subtotal/tax/service charge/gratuity/grand
total/per-person price, and — below that — internal cost and margin, for
your own review before you send anything.

### Sending

At the bottom, **Review & Send** shows your current status and the valid
next steps. To send, you need: a guest count greater than 0, at least one
menu item or package line, and a contact with an email or phone number on
file — the system blocks Send with a specific message if one's missing,
rather than silently failing.

### After approval

Once an estimate is **Approved** (or **Won**/**Lost**), it becomes
read-only in the builder — you'll see a banner explaining why, with an
**Edit (new version)** button. Clicking it clones everything into a new
draft version and takes you there; the approved version stays exactly as
it was, in the version-history breadcrumb at the top of the page, so
there's never any ambiguity about what the customer actually saw and
signed off on. Each older version in that breadcrumb has a **[compare]**
link showing exactly what changed against the version you're viewing —
line items added/removed/changed, staffing changes, and the grand total
before and after.

### Activity log

Below the guest-count history, an **Activity Log** panel (collapsed by
default — click to expand) lists every status change and every
post-approval edit made to the estimate: what changed, who did it, and
when. It's read-only and populated automatically — useful for answering
"wait, who moved this to Approved?" without asking around.

## Exporting

From the top of any estimate:

- **Customer proposal (PDF)** — itemized, professional layout, deposit/
  payment info, and a signature/date line. Never contains cost or margin
  data — that's enforced in code, not just by habit.
- **Internal sheet (PDF)** — the same estimate with cost and margin detail,
  clearly banner-marked "INTERNAL USE ONLY." Don't send this to a
  customer.
- **Internal detail (CSV)** — line items and staffing with cost, for
  spreadsheet review.

From **Pipeline**, **Export CSV** downloads every estimate matching your
current filters (status/date/guest count) with status, value, internal
cost, margin, owner, and created date.

## Pipeline

Status columns (Draft → Sent → Approved → Won/Lost), KPI cards (open
pipeline value, win rate, average deal size, approved events in the next
7 days), and filters by event type/location/sales owner/date range/guest
count. Change an estimate's status directly from its card using the
dropdown — that's the same status logic as the Review & Send buttons on
the estimate itself, so
the same validation rules apply (e.g. you still can't mark something
Approved past the org's threshold unless you have the right role).
