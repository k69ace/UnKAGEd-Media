// Centralized, pure, unit-tested calculation engine for the Catering
// Estimator. Nothing here reads the database or touches I/O — every
// function takes plain data in and returns plain data out, so the same
// logic drives the estimate builder UI, the PDF/CSV exports, and tests.
//
// Currency rounding: round-half-up to 2 decimals via `roundCurrency`.
// Percentages are stored and computed as fractions (0.0825 = 8.25%, not
// 8.25) everywhere in this module, matching the `rate` column convention
// in `tax_rules` and `organization_settings`. Only the presentation layer
// converts to a "22.5%"-style string, rounding to 1 decimal for display
// while the fraction itself keeps full precision.
//
// Calculation order (documented per spec, since service charge/gratuity
// bases can depend on each other by org configuration):
//   1. line item totals -> subtotal
//   2. discounted subtotal = subtotal - discountAmount
//      (rejected, not silently clamped, if discountAmount > subtotal)
//   3. tax on line items: computed per tax category against each
//      category's own rate, using each line item's *own* (undiscounted)
//      total — the spec defines "Taxable Base" as a sum of line item
//      totals, not discounted line item totals, so a discount does not
//      proportionally reduce the taxable base in this implementation.
//   4. service charge: computed from its configured base (discounted
//      subtotal, or discounted subtotal excluding alcohol line items)
//   5. gratuity: computed after service charge, since one configuration
//      option is "discounted subtotal + service charge" as its base
//   6. tax on service charge / gratuity themselves, each independently
//      configurable and possibly untaxed — never assumed either way
//   7. grand total = discounted subtotal + line-item tax total
//      + service-charge tax + gratuity tax + service charge + gratuity
//
// Contribution margin is computed pre-tax and pre-service-charge/gratuity
// (discounted subtotal minus internal cost), on the assumption that tax,
// service charge, and gratuity are not restaurant revenue/cost in the
// margin sense for most operators. This is a documented assumption, not
// a universal accounting rule — organizations that treat service charge
// as revenue should adjust at the reporting layer, not in this module.

export type LineItemCategory =
  | "menu_item"
  | "package"
  | "beverage"
  | "alcohol"
  | "rental"
  | "linen"
  | "delivery"
  | "setup"
  | "pickup"
  | "travel"
  | "staffing"
  | "admin_fee"
  | "service_charge"
  | "other";

export interface LineItem {
  id: string;
  category: LineItemCategory;
  quantity: number;
  unitPrice: number;
  unitCost: number | null;
  isTaxable: boolean;
  taxRuleId: string | null;
}

export interface TaxRule {
  id: string;
  /** Fraction, e.g. 0.0825 for 8.25%. */
  rate: number;
}

export type ChargeBase =
  | "discounted_subtotal"
  | "discounted_subtotal_excluding_alcohol"
  | "discounted_subtotal_plus_service_charge";

export interface ChargeConfig {
  enabled: boolean;
  type: "flat" | "percent";
  /** Flat dollar amount, or a fraction (0.20 = 20%) when type is "percent". */
  value: number;
  base: ChargeBase;
  taxRuleId: string | null;
}

export interface StaffingLine {
  quantity: number;
  hours: number;
  ratePerHour: number;
}

export class DiscountExceedsSubtotalError extends Error {
  constructor(discountAmount: number, subtotal: number) {
    super(
      `Discount amount ${discountAmount} exceeds subtotal ${subtotal}. Reduce the discount or add line items before it can be applied.`,
    );
    this.name = "DiscountExceedsSubtotalError";
  }
}

/** Round-half-up to 2 decimals, correcting for binary floating-point drift. */
export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Round a fraction to 1 decimal *percent* for display only (0.0825 -> 8.3). */
export function roundPercentForDisplay(fraction: number): number {
  return Math.round((fraction * 100 + Number.EPSILON) * 10) / 10;
}

export function lineItemTotal(item: Pick<LineItem, "quantity" | "unitPrice">): number {
  return roundCurrency(item.quantity * item.unitPrice);
}

export function subtotal(lineItems: LineItem[]): number {
  return roundCurrency(lineItems.reduce((sum, item) => sum + lineItemTotal(item), 0));
}

export function discountedSubtotal(subtotalAmount: number, discountAmount: number): number {
  if (discountAmount > subtotalAmount) {
    throw new DiscountExceedsSubtotalError(discountAmount, subtotalAmount);
  }
  return roundCurrency(Math.max(0, subtotalAmount - discountAmount));
}

/** Taxable base per tax rule, from taxable line items' own (undiscounted) totals. */
export function taxableBaseByRule(lineItems: LineItem[]): Map<string, number> {
  const byRule = new Map<string, number>();
  for (const item of lineItems) {
    if (!item.isTaxable || !item.taxRuleId) continue;
    const current = byRule.get(item.taxRuleId) ?? 0;
    byRule.set(item.taxRuleId, current + lineItemTotal(item));
  }
  for (const [ruleId, amount] of byRule) {
    byRule.set(ruleId, roundCurrency(amount));
  }
  return byRule;
}

/** Sum of (taxable base for each category) x (that category's own rate). Never one blanket rate. */
export function lineItemTaxTotal(lineItems: LineItem[], taxRules: TaxRule[]): number {
  const base = taxableBaseByRule(lineItems);
  const rateById = new Map(taxRules.map((r) => [r.id, r.rate]));
  let total = 0;
  for (const [ruleId, amount] of base) {
    const rate = rateById.get(ruleId) ?? 0;
    total += amount * rate;
  }
  return roundCurrency(total);
}

function alcoholTotal(lineItems: LineItem[]): number {
  return roundCurrency(
    lineItems.filter((i) => i.category === "alcohol").reduce((sum, i) => sum + lineItemTotal(i), 0),
  );
}

function resolveChargeBase(
  base: ChargeBase,
  discountedSubtotalAmount: number,
  lineItems: LineItem[],
  serviceChargeAmount: number,
): number {
  switch (base) {
    case "discounted_subtotal":
      return discountedSubtotalAmount;
    case "discounted_subtotal_excluding_alcohol":
      return roundCurrency(discountedSubtotalAmount - alcoholTotal(lineItems));
    case "discounted_subtotal_plus_service_charge":
      return roundCurrency(discountedSubtotalAmount + serviceChargeAmount);
  }
}

export function computeCharge(
  config: ChargeConfig,
  discountedSubtotalAmount: number,
  lineItems: LineItem[],
  serviceChargeAmount = 0,
): number {
  if (!config.enabled) return 0;
  const base = resolveChargeBase(config.base, discountedSubtotalAmount, lineItems, serviceChargeAmount);
  const amount = config.type === "flat" ? config.value : base * config.value;
  return roundCurrency(Math.max(0, amount));
}

export function computeChargeTax(chargeAmount: number, config: ChargeConfig, taxRules: TaxRule[]): number {
  if (!config.enabled || !config.taxRuleId) return 0;
  const rule = taxRules.find((r) => r.id === config.taxRuleId);
  if (!rule) return 0;
  return roundCurrency(chargeAmount * rule.rate);
}

export interface GrandTotalInput {
  lineItems: LineItem[];
  taxRules: TaxRule[];
  discountAmount: number;
  serviceCharge: ChargeConfig;
  gratuity: ChargeConfig;
}

export interface GrandTotalResult {
  subtotal: number;
  discountedSubtotal: number;
  lineItemTaxTotal: number;
  serviceChargeAmount: number;
  serviceChargeTax: number;
  gratuityAmount: number;
  gratuityTax: number;
  taxTotal: number;
  grandTotal: number;
}

export function calculateGrandTotal(input: GrandTotalInput): GrandTotalResult {
  const subtotalAmount = subtotal(input.lineItems);
  const discountedSubtotalAmount = discountedSubtotal(subtotalAmount, input.discountAmount);
  const itemTax = lineItemTaxTotal(input.lineItems, input.taxRules);

  const serviceChargeAmount = computeCharge(input.serviceCharge, discountedSubtotalAmount, input.lineItems);
  const serviceChargeTax = computeChargeTax(serviceChargeAmount, input.serviceCharge, input.taxRules);

  const gratuityAmount = computeCharge(
    input.gratuity,
    discountedSubtotalAmount,
    input.lineItems,
    serviceChargeAmount,
  );
  const gratuityTax = computeChargeTax(gratuityAmount, input.gratuity, input.taxRules);

  const taxTotal = roundCurrency(itemTax + serviceChargeTax + gratuityTax);
  const grandTotal = roundCurrency(
    discountedSubtotalAmount + taxTotal + serviceChargeAmount + gratuityAmount,
  );

  return {
    subtotal: subtotalAmount,
    discountedSubtotal: discountedSubtotalAmount,
    lineItemTaxTotal: itemTax,
    serviceChargeAmount,
    serviceChargeTax,
    gratuityAmount,
    gratuityTax,
    taxTotal,
    grandTotal,
  };
}

/** Guaranteed count takes priority once set; returns null (not a divide-by-zero) when no usable count exists. */
export function perPersonPrice(grandTotal: number, guestCountEstimated: number | null, guestCountGuaranteed: number | null): number | null {
  const count = guestCountGuaranteed ?? guestCountEstimated;
  if (!count || count <= 0) return null;
  return roundCurrency(grandTotal / count);
}

export function internalCostTotal(lineItems: LineItem[], staffing: StaffingLine[]): number {
  const lineItemCost = lineItems.reduce((sum, item) => sum + (item.unitCost ?? 0) * item.quantity, 0);
  const staffingCost = staffing.reduce((sum, s) => sum + s.hours * s.ratePerHour * s.quantity, 0);
  return roundCurrency(lineItemCost + staffingCost);
}

export function contributionMarginDollar(discountedSubtotalAmount: number, internalCostTotalAmount: number): number {
  return roundCurrency(discountedSubtotalAmount - internalCostTotalAmount);
}

/** Null (not a divide-by-zero) when the discounted subtotal is 0. */
export function contributionMarginPercent(marginDollar: number, discountedSubtotalAmount: number): number | null {
  if (discountedSubtotalAmount === 0) return null;
  return marginDollar / discountedSubtotalAmount;
}

export interface PaymentScheduleEntry {
  amount: number;
  dueDate: string;
  paid?: boolean;
}

export function depositRemaining(grandTotal: number, depositAmount: number): number {
  return roundCurrency(grandTotal - depositAmount);
}

export function paymentScheduleBalance(grandTotal: number, schedule: PaymentScheduleEntry[]): number {
  const paid = schedule.filter((e) => e.paid).reduce((sum, e) => sum + e.amount, 0);
  return roundCurrency(grandTotal - paid);
}

/** Safely parses the `payment_schedule_json` column (stored as `unknown` — see
 *  src/lib/supabase/types.ts) into typed entries, dropping anything malformed
 *  rather than throwing. Shared by the estimate builder UI and PDF export so
 *  both interpret the same JSON the same way. */
export function parsePaymentSchedule(raw: unknown): PaymentScheduleEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null)
    .map((entry) => ({
      amount: typeof entry.amount === "number" ? entry.amount : 0,
      dueDate: typeof entry.dueDate === "string" ? entry.dueDate : "",
      paid: entry.paid === true,
    }));
}
