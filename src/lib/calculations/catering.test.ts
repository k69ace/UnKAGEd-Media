import { describe, expect, it } from "vitest";
import {
  calculateGrandTotal,
  computeCharge,
  computeChargeTax,
  contributionMarginDollar,
  contributionMarginPercent,
  DiscountExceedsSubtotalError,
  depositRemaining,
  discountedSubtotal,
  internalCostTotal,
  lineItemTaxTotal,
  lineItemTotal,
  parsePaymentSchedule,
  paymentScheduleBalance,
  perPersonPrice,
  roundCurrency,
  roundPercentForDisplay,
  subtotal,
  taxableBaseByRule,
  type ChargeConfig,
  type LineItem,
  type StaffingLine,
  type TaxRule,
} from "./catering";

const foodTax: TaxRule = { id: "tax-food", rate: 0.08 };
const alcoholTax: TaxRule = { id: "tax-alcohol", rate: 0.12 };
const rentalTax: TaxRule = { id: "tax-rental", rate: 0.06 };

function item(overrides: Partial<LineItem>): LineItem {
  return {
    id: "li-1",
    category: "menu_item",
    quantity: 1,
    unitPrice: 0,
    unitCost: null,
    isTaxable: false,
    taxRuleId: null,
    ...overrides,
  };
}

describe("roundCurrency", () => {
  it("rounds half up to 2 decimals", () => {
    expect(roundCurrency(10.005)).toBe(10.01);
    expect(roundCurrency(10.004)).toBe(10);
    expect(roundCurrency(1.005)).toBe(1.01);
  });
});

describe("roundPercentForDisplay", () => {
  it("rounds a fraction to 1 decimal percent", () => {
    expect(roundPercentForDisplay(0.0825)).toBe(8.3);
    expect(roundPercentForDisplay(0.2)).toBe(20);
  });
});

describe("lineItemTotal", () => {
  it("multiplies quantity by unit price", () => {
    expect(lineItemTotal({ quantity: 150, unitPrice: 42.5 })).toBe(6375);
  });
});

describe("subtotal", () => {
  it("sums line item totals", () => {
    const items = [
      item({ quantity: 100, unitPrice: 45 }), // 4500
      item({ quantity: 100, unitPrice: 12 }), // 1200
      item({ quantity: 1, unitPrice: 300 }), // 300
    ];
    expect(subtotal(items)).toBe(6000);
  });

  it("returns 0 for no line items", () => {
    expect(subtotal([])).toBe(0);
  });
});

describe("discountedSubtotal", () => {
  it("subtracts the discount", () => {
    expect(discountedSubtotal(6000, 500)).toBe(5500);
  });

  it("allows a discount equal to the full subtotal, landing at 0", () => {
    expect(discountedSubtotal(6000, 6000)).toBe(0);
  });

  it("rejects a discount greater than the subtotal instead of silently clamping", () => {
    expect(() => discountedSubtotal(6000, 6000.01)).toThrow(DiscountExceedsSubtotalError);
  });
});

describe("taxableBaseByRule / lineItemTaxTotal — non-uniform per-category taxability", () => {
  // A realistic mixed estimate: food is taxable at the food rate, alcohol
  // at a different (higher) rate, rentals at a third rate, and staffing
  // labor is not taxable at all. A single blanket rate would get every
  // one of these numbers wrong.
  const items: LineItem[] = [
    item({ id: "food", category: "menu_item", quantity: 100, unitPrice: 45, isTaxable: true, taxRuleId: foodTax.id }), // 4500 @ 8%
    item({ id: "bar", category: "alcohol", quantity: 100, unitPrice: 18, isTaxable: true, taxRuleId: alcoholTax.id }), // 1800 @ 12%
    item({ id: "linens", category: "rental", quantity: 10, unitPrice: 15, isTaxable: true, taxRuleId: rentalTax.id }), // 150 @ 6%
    item({ id: "labor", category: "staffing", quantity: 8, unitPrice: 30, isTaxable: false, taxRuleId: null }), // not taxed at all
  ];
  const rules = [foodTax, alcoholTax, rentalTax];

  it("groups taxable base by tax rule, excluding non-taxable lines", () => {
    const base = taxableBaseByRule(items);
    expect(base.get(foodTax.id)).toBe(4500);
    expect(base.get(alcoholTax.id)).toBe(1800);
    expect(base.get(rentalTax.id)).toBe(150);
    expect(base.has("staffing")).toBe(false);
  });

  it("taxes each category at its own rate rather than one blanket rate", () => {
    // 4500*0.08 + 1800*0.12 + 150*0.06 = 360 + 216 + 9 = 585
    expect(lineItemTaxTotal(items, rules)).toBe(585);
  });

  it("returns 0 when there are no taxable line items", () => {
    expect(lineItemTaxTotal([item({ isTaxable: false })], rules)).toBe(0);
  });
});

describe("computeCharge — service charge and gratuity, configurable base and taxability", () => {
  const items: LineItem[] = [
    item({ category: "menu_item", quantity: 100, unitPrice: 45 }), // 4500
    item({ category: "alcohol", quantity: 100, unitPrice: 18 }), // 1800
  ];
  const discountedSubtotalAmount = 6300; // 4500 + 1800, no discount

  it("computes a flat service charge regardless of base", () => {
    const config: ChargeConfig = { enabled: true, type: "flat", value: 250, base: "discounted_subtotal", taxRuleId: null };
    expect(computeCharge(config, discountedSubtotalAmount, items)).toBe(250);
  });

  it("computes a percent service charge against the full discounted subtotal", () => {
    const config: ChargeConfig = { enabled: true, type: "percent", value: 0.2, base: "discounted_subtotal", taxRuleId: null };
    expect(computeCharge(config, discountedSubtotalAmount, items)).toBe(1260);
  });

  it("computes a percent charge against the subtotal excluding alcohol, per org config", () => {
    const config: ChargeConfig = {
      enabled: true,
      type: "percent",
      value: 0.2,
      base: "discounted_subtotal_excluding_alcohol",
      taxRuleId: null,
    };
    // (6300 - 1800) * 0.2 = 900
    expect(computeCharge(config, discountedSubtotalAmount, items)).toBe(900);
  });

  it("computes gratuity on a base that includes the already-computed service charge", () => {
    const serviceChargeAmount = 1260;
    const gratuityConfig: ChargeConfig = {
      enabled: true,
      type: "percent",
      value: 0.18,
      base: "discounted_subtotal_plus_service_charge",
      taxRuleId: null,
    };
    // (6300 + 1260) * 0.18 = 1360.8
    expect(computeCharge(gratuityConfig, discountedSubtotalAmount, items, serviceChargeAmount)).toBe(1360.8);
  });

  it("returns 0 when disabled", () => {
    const config: ChargeConfig = { enabled: false, type: "percent", value: 0.2, base: "discounted_subtotal", taxRuleId: null };
    expect(computeCharge(config, discountedSubtotalAmount, items)).toBe(0);
  });

  it("taxes the service charge and gratuity independently — one taxable, one not, never merged", () => {
    const taxedServiceCharge: ChargeConfig = {
      enabled: true,
      type: "percent",
      value: 0.2,
      base: "discounted_subtotal",
      taxRuleId: foodTax.id,
    };
    const untaxedGratuity: ChargeConfig = {
      enabled: true,
      type: "percent",
      value: 0.18,
      base: "discounted_subtotal",
      taxRuleId: null,
    };
    const serviceChargeAmount = computeCharge(taxedServiceCharge, discountedSubtotalAmount, items);
    const gratuityAmount = computeCharge(untaxedGratuity, discountedSubtotalAmount, items);

    expect(computeChargeTax(serviceChargeAmount, taxedServiceCharge, [foodTax])).toBe(
      roundCurrency(serviceChargeAmount * foodTax.rate),
    );
    expect(computeChargeTax(gratuityAmount, untaxedGratuity, [foodTax])).toBe(0);
  });
});

describe("calculateGrandTotal — full realistic estimate, fully specified", () => {
  // 100-guest plated dinner: food taxed at 8%, alcohol taxed at 12%,
  // a 20% taxable service charge, an 18% untaxed gratuity computed on
  // (discounted subtotal + service charge), and a $200 discount.
  const items: LineItem[] = [
    item({ id: "entree", category: "menu_item", quantity: 100, unitPrice: 45, isTaxable: true, taxRuleId: foodTax.id }), // 4500
    item({ id: "bar", category: "alcohol", quantity: 100, unitPrice: 18, isTaxable: true, taxRuleId: alcoholTax.id }), // 1800
    item({ id: "labor", category: "staffing", quantity: 8, unitPrice: 30, isTaxable: false }), // 240, not taxed
  ];
  const serviceCharge: ChargeConfig = {
    enabled: true,
    type: "percent",
    value: 0.2,
    base: "discounted_subtotal",
    taxRuleId: foodTax.id,
  };
  const gratuity: ChargeConfig = {
    enabled: true,
    type: "percent",
    value: 0.18,
    base: "discounted_subtotal_plus_service_charge",
    taxRuleId: null,
  };

  it("matches the fully worked example", () => {
    const result = calculateGrandTotal({
      lineItems: items,
      taxRules: [foodTax, alcoholTax],
      discountAmount: 200,
      serviceCharge,
      gratuity,
    });

    // subtotal = 4500 + 1800 + 240 = 6540
    expect(result.subtotal).toBe(6540);
    // discounted subtotal = 6540 - 200 = 6340
    expect(result.discountedSubtotal).toBe(6340);
    // line item tax = 4500*0.08 + 1800*0.12 = 360 + 216 = 576 (labor untaxed)
    expect(result.lineItemTaxTotal).toBe(576);
    // service charge = 6340 * 0.2 = 1268
    expect(result.serviceChargeAmount).toBe(1268);
    // service charge tax = 1268 * 0.08 = 101.44
    expect(result.serviceChargeTax).toBe(101.44);
    // gratuity = (6340 + 1268) * 0.18 = 1369.44
    expect(result.gratuityAmount).toBe(1369.44);
    // gratuity untaxed
    expect(result.gratuityTax).toBe(0);
    // tax total = 576 + 101.44 + 0 = 677.44
    expect(result.taxTotal).toBe(677.44);
    // grand total = 6340 + 677.44 + 1268 + 1369.44 = 9654.88
    expect(result.grandTotal).toBe(9654.88);
  });
});

describe("perPersonPrice", () => {
  it("divides grand total by guaranteed count when set", () => {
    expect(perPersonPrice(9654.88, 90, 100)).toBe(96.55);
  });

  it("falls back to estimated count when no guaranteed count yet", () => {
    expect(perPersonPrice(9654.88, 100, null)).toBe(96.55);
  });

  it("returns null instead of dividing by zero when no guest count exists yet", () => {
    expect(perPersonPrice(9654.88, null, null)).toBeNull();
    expect(perPersonPrice(9654.88, 0, null)).toBeNull();
  });
});

describe("internalCostTotal", () => {
  it("sums line item cost and staffing labor cost", () => {
    const items: LineItem[] = [
      item({ quantity: 100, unitCost: 18 }), // 1800
      item({ quantity: 100, unitCost: 6 }), // 600
    ];
    const staffing: StaffingLine[] = [
      { quantity: 4, hours: 6, ratePerHour: 25 }, // 600
      { quantity: 1, hours: 6, ratePerHour: 35 }, // 210
    ];
    expect(internalCostTotal(items, staffing)).toBe(3210);
  });

  it("treats a null unitCost as 0 rather than throwing", () => {
    const items: LineItem[] = [item({ quantity: 10, unitCost: null })];
    expect(internalCostTotal(items, [])).toBe(0);
  });
});

describe("contribution margin", () => {
  it("computes margin dollars pre-tax/service-charge/gratuity", () => {
    expect(contributionMarginDollar(6340, 2400)).toBe(3940);
  });

  it("computes margin percent from margin dollars over discounted subtotal", () => {
    expect(contributionMarginPercent(3940, 6340)).toBeCloseTo(0.6215, 4);
  });

  it("returns null instead of dividing by zero when discounted subtotal is 0", () => {
    expect(contributionMarginPercent(0, 0)).toBeNull();
  });
});

describe("deposit and payment schedule", () => {
  it("computes remaining balance after the initial deposit", () => {
    expect(depositRemaining(9654.88, 2000)).toBe(7654.88);
  });

  it("computes remaining balance against a running payment schedule", () => {
    const schedule = [
      { amount: 2000, dueDate: "2026-08-01", paid: true },
      { amount: 3000, dueDate: "2026-09-01", paid: true },
      { amount: 4654.88, dueDate: "2026-10-01", paid: false },
    ];
    expect(paymentScheduleBalance(9654.88, schedule)).toBe(4654.88);
  });

  it("ignores unpaid entries when computing the current balance", () => {
    expect(paymentScheduleBalance(1000, [{ amount: 1000, dueDate: "2026-08-01", paid: false }])).toBe(1000);
  });
});

describe("parsePaymentSchedule", () => {
  it("parses a well-formed array from the JSONB column", () => {
    const result = parsePaymentSchedule([
      { amount: 500, dueDate: "2026-08-01", paid: true },
      { amount: 250.5, dueDate: "2026-09-01" },
    ]);
    expect(result).toEqual([
      { amount: 500, dueDate: "2026-08-01", paid: true },
      { amount: 250.5, dueDate: "2026-09-01", paid: false },
    ]);
  });

  it("returns an empty array for null, undefined, or non-array JSON", () => {
    expect(parsePaymentSchedule(null)).toEqual([]);
    expect(parsePaymentSchedule(undefined)).toEqual([]);
    expect(parsePaymentSchedule({ amount: 1 })).toEqual([]);
    expect(parsePaymentSchedule("not an array")).toEqual([]);
  });

  it("drops non-object entries and defaults malformed fields instead of throwing", () => {
    const result = parsePaymentSchedule([null, "garbage", 42, { amount: "500", paid: "yes" }]);
    expect(result).toEqual([{ amount: 0, dueDate: "", paid: false }]);
  });
});
