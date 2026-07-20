import { describe, expect, it } from "vitest";
import { computeEstimateSummary } from "./estimateSummary";
import type { Database } from "@/lib/supabase/types";

type LineItemRow = Database["public"]["Tables"]["catering_estimate_line_items"]["Row"];
type StaffingRow = Database["public"]["Tables"]["catering_estimate_staffing"]["Row"];
type OrgSettingsRow = Database["public"]["Tables"]["organization_settings"]["Row"];

function lineItem(overrides: Partial<LineItemRow>): LineItemRow {
  return {
    id: "li-1",
    estimate_id: "est-1",
    category: "menu_item",
    description: "Entree",
    quantity: 1,
    unit: "each",
    unit_price: 0,
    unit_cost: null,
    is_taxable: false,
    tax_rule_id: null,
    sort_order: 0,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function staffing(overrides: Partial<StaffingRow>): StaffingRow {
  return {
    id: "s-1",
    estimate_id: "est-1",
    staffing_role_id: "role-1",
    quantity: 1,
    hours: 0,
    rate_per_hour: 0,
    notes: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function settings(overrides: Partial<OrgSettingsRow>): OrgSettingsRow {
  return {
    organization_id: "org-1",
    default_profit_target_percent: null,
    approval_threshold_amount: null,
    approval_below_margin_percent: null,
    chef_review_required: false,
    service_charge_enabled: false,
    service_charge_type: null,
    service_charge_value: null,
    service_charge_base: "discounted_subtotal",
    service_charge_tax_rule_id: null,
    gratuity_enabled: false,
    gratuity_type: null,
    gratuity_value: null,
    gratuity_base: "discounted_subtotal",
    gratuity_tax_rule_id: null,
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeEstimateSummary", () => {
  it("maps DB rows through the calculation engine end to end", () => {
    const foodTax = { id: "tax-food", name: "Food", rate: 0.08 };
    const items = [
      lineItem({ id: "food", quantity: 100, unit_price: 40, unit_cost: 15, is_taxable: true, tax_rule_id: foodTax.id }),
    ];
    const staffLines = [staffing({ hours: 4, rate_per_hour: 25, quantity: 2 })];

    const summary = computeEstimateSummary(
      { discount_amount: 0, guest_count_estimated: 100, guest_count_guaranteed: null, deposit_amount: 500 },
      items,
      staffLines,
      [foodTax],
      settings({ service_charge_enabled: true, service_charge_type: "percent", service_charge_value: 0.2, service_charge_base: "discounted_subtotal" }),
    );

    // subtotal = 4000, tax = 320, service charge = 4000*0.2 = 800, grand = 5120
    expect(summary.subtotal).toBe(4000);
    expect(summary.taxTotal).toBe(320);
    expect(summary.serviceChargeAmount).toBe(800);
    expect(summary.grandTotal).toBe(5120);
    expect(summary.perPersonPrice).toBe(51.2);
    // cost = 100*15 + 2*4*25 = 1500 + 200 = 1700; margin = 4000 - 1700 = 2300
    expect(summary.internalCostTotal).toBe(1700);
    expect(summary.contributionMarginDollar).toBe(2300);
    expect(summary.depositRemaining).toBe(5120 - 500);
  });

  it("returns null per-person price and deposit-remaining when data is incomplete", () => {
    const summary = computeEstimateSummary(
      { discount_amount: 0, guest_count_estimated: null, guest_count_guaranteed: null, deposit_amount: null },
      [],
      [],
      [],
      settings({}),
    );

    expect(summary.grandTotal).toBe(0);
    expect(summary.perPersonPrice).toBeNull();
    expect(summary.depositRemaining).toBeNull();
    expect(summary.contributionMarginPercent).toBeNull();
  });
});
