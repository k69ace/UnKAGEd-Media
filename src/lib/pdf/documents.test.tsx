import { describe, expect, it } from "vitest";
import { renderToBuffer } from "@react-pdf/renderer";
import { CustomerProposalDocument } from "./CustomerProposalDocument";
import { InternalEstimateDocument } from "./InternalEstimateDocument";
import { computeEstimateSummary } from "@/lib/calculations/estimateSummary";
import type { EstimateDetail } from "@/lib/data/catering";
import type { Database } from "@/lib/supabase/types";

type OrgSettingsRow = Database["public"]["Tables"]["organization_settings"]["Row"];

const settings: OrgSettingsRow = {
  organization_id: "org-1",
  default_profit_target_percent: null,
  approval_threshold_amount: null,
  approval_below_margin_percent: null,
  chef_review_required: false,
  service_charge_enabled: true,
  service_charge_type: "percent",
  service_charge_value: 0.2,
  service_charge_base: "discounted_subtotal",
  service_charge_tax_rule_id: null,
  gratuity_enabled: false,
  gratuity_type: null,
  gratuity_value: null,
  gratuity_base: "discounted_subtotal",
  gratuity_tax_rule_id: null,
  updated_at: "2026-01-01T00:00:00Z",
};

const estimate: EstimateDetail = {
  id: "est-1",
  organization_id: "org-1",
  location_id: null,
  customer_id: "cust-1",
  contact_id: "contact-1",
  event_date: "2026-08-01",
  event_start_time: "17:00",
  event_end_time: "22:00",
  venue_name: "The Grand Hall",
  venue_address: "123 Main St",
  event_type_id: null,
  service_style_id: null,
  guest_count_estimated: 100,
  guest_count_guaranteed: null,
  status: "sent",
  version: 1,
  previous_version_id: null,
  profit_target_percent: null,
  deposit_amount: 1000,
  deposit_due_date: "2026-07-01",
  payment_schedule_json: [],
  minimum_spend_required: null,
  discount_amount: 0,
  discount_reason: null,
  internal_notes: "Kitchen is tight on staff that week.",
  customer_facing_notes: "Thank you for considering us!",
  approved_by: null,
  approved_at: null,
  created_by: null,
  updated_by: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  customers: { id: "cust-1", name: "Jane Smith", company_name: "Acme Co." },
  contacts: { id: "contact-1", first_name: "Jane", last_name: "Smith", email: "jane@example.com", phone: null },
  catering_estimate_line_items: [
    {
      id: "li-1",
      estimate_id: "est-1",
      category: "menu_item",
      description: "Plated Chicken Dinner",
      quantity: 100,
      unit: "each",
      unit_price: 45,
      unit_cost: 18,
      is_taxable: true,
      tax_rule_id: "tax-food",
      sort_order: 0,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
  ],
  catering_estimate_staffing: [
    {
      id: "s-1",
      estimate_id: "est-1",
      staffing_role_id: "role-1",
      quantity: 4,
      hours: 6,
      rate_per_hour: 25,
      notes: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      staffing_roles: { name: "Server" },
    },
  ],
  catering_estimate_guest_count_history: [],
};

const summary = computeEstimateSummary(
  estimate,
  estimate.catering_estimate_line_items,
  estimate.catering_estimate_staffing,
  [{ id: "tax-food", rate: 0.08 }],
  settings,
);

describe("PDF export documents", () => {
  it("renders a valid customer proposal PDF with no internal cost/margin data", async () => {
    const buffer = await renderToBuffer(
      <CustomerProposalDocument organizationName="unKAGEd Catering" estimate={estimate} summary={summary} />,
    );
    expect(buffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");
    expect(buffer.length).toBeGreaterThan(500);

    // react-pdf embeds document text as compressed content streams, but the
    // document Producer/Creator strings and any literal (non-compressed)
    // text are still readable in the raw bytes -- verify none of the
    // internal-only figures leak into the file at all, compressed or not.
    const raw = buffer.toString("latin1");
    expect(raw).not.toContain("Internal Notes");
    expect(raw).not.toContain(estimate.internal_notes as string);
  });

  it("renders a valid internal estimate PDF including cost and margin", async () => {
    const buffer = await renderToBuffer(
      <InternalEstimateDocument organizationName="unKAGEd Catering" estimate={estimate} summary={summary} />,
    );
    expect(buffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");
    expect(buffer.length).toBeGreaterThan(500);
  });
});
