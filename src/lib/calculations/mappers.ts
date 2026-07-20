import type { ChargeConfig, LineItem, StaffingLine, TaxRule } from "./catering";
import type { Database } from "@/lib/supabase/types";

type LineItemRow = Database["public"]["Tables"]["catering_estimate_line_items"]["Row"];
type StaffingRow = Database["public"]["Tables"]["catering_estimate_staffing"]["Row"];
type OrgSettingsRow = Database["public"]["Tables"]["organization_settings"]["Row"];
type TaxRuleRow = Database["public"]["Tables"]["tax_rules"]["Row"];

export function toCalcLineItem(
  row: Pick<LineItemRow, "id" | "category" | "quantity" | "unit_price" | "unit_cost" | "is_taxable" | "tax_rule_id">,
): LineItem {
  return {
    id: row.id,
    category: row.category,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    unitCost: row.unit_cost,
    isTaxable: row.is_taxable,
    taxRuleId: row.tax_rule_id,
  };
}

export function toCalcStaffing(row: StaffingRow): StaffingLine {
  return { quantity: row.quantity, hours: row.hours, ratePerHour: row.rate_per_hour };
}

export function toCalcTaxRule(row: Pick<TaxRuleRow, "id" | "rate">): TaxRule {
  return { id: row.id, rate: row.rate };
}

export function serviceChargeConfigFromSettings(settings: OrgSettingsRow): ChargeConfig {
  return {
    enabled: settings.service_charge_enabled,
    type: settings.service_charge_type ?? "percent",
    value: settings.service_charge_value ?? 0,
    base: settings.service_charge_base,
    taxRuleId: settings.service_charge_tax_rule_id,
  };
}

export function gratuityConfigFromSettings(settings: OrgSettingsRow): ChargeConfig {
  return {
    enabled: settings.gratuity_enabled,
    type: settings.gratuity_type ?? "percent",
    value: settings.gratuity_value ?? 0,
    base: settings.gratuity_base,
    taxRuleId: settings.gratuity_tax_rule_id,
  };
}
