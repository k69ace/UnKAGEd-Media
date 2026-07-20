import {
  calculateGrandTotal,
  contributionMarginDollar,
  contributionMarginPercent,
  depositRemaining,
  internalCostTotal,
  perPersonPrice,
  type GrandTotalResult,
} from "./catering";
import {
  gratuityConfigFromSettings,
  serviceChargeConfigFromSettings,
  toCalcLineItem,
  toCalcStaffing,
  toCalcTaxRule,
} from "./mappers";
import type { Database } from "@/lib/supabase/types";

type EstimateRow = Database["public"]["Tables"]["catering_estimates"]["Row"];
type LineItemRow = Database["public"]["Tables"]["catering_estimate_line_items"]["Row"];
type StaffingRow = Database["public"]["Tables"]["catering_estimate_staffing"]["Row"];
type OrgSettingsRow = Database["public"]["Tables"]["organization_settings"]["Row"];
type TaxRuleRow = Database["public"]["Tables"]["tax_rules"]["Row"];

export interface EstimateSummary extends GrandTotalResult {
  internalCostTotal: number;
  contributionMarginDollar: number;
  contributionMarginPercent: number | null;
  perPersonPrice: number | null;
  depositRemaining: number | null;
}

export function computeEstimateSummary(
  estimate: Pick<EstimateRow, "discount_amount" | "guest_count_estimated" | "guest_count_guaranteed" | "deposit_amount">,
  lineItems: LineItemRow[],
  staffing: StaffingRow[],
  taxRules: Pick<TaxRuleRow, "id" | "rate">[],
  settings: OrgSettingsRow,
): EstimateSummary {
  const calcLineItems = lineItems.map(toCalcLineItem);
  const calcStaffing = staffing.map(toCalcStaffing);
  const calcTaxRules = taxRules.map(toCalcTaxRule);

  const grandTotalResult = calculateGrandTotal({
    lineItems: calcLineItems,
    taxRules: calcTaxRules,
    discountAmount: estimate.discount_amount,
    serviceCharge: serviceChargeConfigFromSettings(settings),
    gratuity: gratuityConfigFromSettings(settings),
  });

  const costTotal = internalCostTotal(calcLineItems, calcStaffing);
  const marginDollar = contributionMarginDollar(grandTotalResult.discountedSubtotal, costTotal);
  const marginPercent = contributionMarginPercent(marginDollar, grandTotalResult.discountedSubtotal);
  const perPerson = perPersonPrice(grandTotalResult.grandTotal, estimate.guest_count_estimated, estimate.guest_count_guaranteed);
  const deposit = estimate.deposit_amount != null ? depositRemaining(grandTotalResult.grandTotal, estimate.deposit_amount) : null;

  return {
    ...grandTotalResult,
    internalCostTotal: costTotal,
    contributionMarginDollar: marginDollar,
    contributionMarginPercent: marginPercent,
    perPersonPrice: perPerson,
    depositRemaining: deposit,
  };
}
