import { describe, expect, it } from "vitest";
import { diffEstimateFields, diffLineItems, diffStaffing } from "./estimateDiff";

describe("diffLineItems", () => {
  it("marks a matching category+description pair unchanged when quantity and price are the same", () => {
    const before = [{ category: "menu_item" as const, description: "Chicken breast", quantity: 100, unit_price: 12 }];
    const after = [{ category: "menu_item" as const, description: "Chicken breast", quantity: 100, unit_price: 12 }];
    const rows = diffLineItems(before, after);
    expect(rows).toEqual([
      {
        key: "menu_item::Chicken breast",
        category: "menu_item",
        description: "Chicken breast",
        status: "unchanged",
        quantityBefore: 100,
        quantityAfter: 100,
        unitPriceBefore: 12,
        unitPriceAfter: 12,
      },
    ]);
  });

  it("marks a matching pair changed when quantity or price differ", () => {
    const before = [{ category: "menu_item" as const, description: "Chicken breast", quantity: 100, unit_price: 12 }];
    const after = [{ category: "menu_item" as const, description: "Chicken breast", quantity: 120, unit_price: 12 }];
    const rows = diffLineItems(before, after);
    expect(rows[0].status).toBe("changed");
    expect(rows[0].quantityBefore).toBe(100);
    expect(rows[0].quantityAfter).toBe(120);
  });

  it("marks a line item present only in after as added", () => {
    const rows = diffLineItems([], [{ category: "beverage" as const, description: "Sparkling water", quantity: 50, unit_price: 3 }]);
    expect(rows).toEqual([
      {
        key: "beverage::Sparkling water",
        category: "beverage",
        description: "Sparkling water",
        status: "added",
        quantityBefore: null,
        quantityAfter: 50,
        unitPriceBefore: null,
        unitPriceAfter: 3,
      },
    ]);
  });

  it("marks a line item present only in before as removed", () => {
    const rows = diffLineItems([{ category: "beverage" as const, description: "Sparkling water", quantity: 50, unit_price: 3 }], []);
    expect(rows).toEqual([
      {
        key: "beverage::Sparkling water",
        category: "beverage",
        description: "Sparkling water",
        status: "removed",
        quantityBefore: 50,
        quantityAfter: null,
        unitPriceBefore: 3,
        unitPriceAfter: null,
      },
    ]);
  });

  it("pairs duplicate category+description rows in encounter order instead of merging them", () => {
    const before = [
      { category: "rental" as const, description: "Chair", quantity: 100, unit_price: 2 },
      { category: "rental" as const, description: "Chair", quantity: 50, unit_price: 2 },
    ];
    const after = [
      { category: "rental" as const, description: "Chair", quantity: 100, unit_price: 2 },
      { category: "rental" as const, description: "Chair", quantity: 75, unit_price: 2 },
    ];
    const rows = diffLineItems(before, after);
    expect(rows).toHaveLength(2);
    expect(rows.filter((r) => r.status === "unchanged")).toHaveLength(1);
    expect(rows.filter((r) => r.status === "changed")).toHaveLength(1);
    const changed = rows.find((r) => r.status === "changed")!;
    expect(changed.quantityBefore).toBe(50);
    expect(changed.quantityAfter).toBe(75);
  });
});

describe("diffStaffing", () => {
  it("matches by staffing_role_id and flags changed hours/rate/quantity", () => {
    const before = [{ staffing_role_id: "role-server", quantity: 4, hours: 5, rate_per_hour: 25 }];
    const after = [{ staffing_role_id: "role-server", quantity: 5, hours: 5, rate_per_hour: 25 }];
    const rows = diffStaffing(before, after);
    expect(rows[0].status).toBe("changed");
    expect(rows[0].quantityBefore).toBe(4);
    expect(rows[0].quantityAfter).toBe(5);
  });

  it("marks a role present only in after as added and only in before as removed", () => {
    const before = [{ staffing_role_id: "role-server", quantity: 4, hours: 5, rate_per_hour: 25 }];
    const after = [{ staffing_role_id: "role-bartender", quantity: 2, hours: 5, rate_per_hour: 30 }];
    const rows = diffStaffing(before, after);
    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.staffingRoleId === "role-bartender")?.status).toBe("added");
    expect(rows.find((r) => r.staffingRoleId === "role-server")?.status).toBe("removed");
  });
});

describe("diffEstimateFields", () => {
  const base = {
    guest_count_estimated: 100,
    guest_count_guaranteed: null,
    discount_amount: 0,
    discount_reason: null,
    deposit_amount: 500,
    minimum_spend_required: null,
    venue_name: "The Grand Hall",
    event_date: "2026-08-01",
  };

  it("returns an empty array when nothing changed", () => {
    expect(diffEstimateFields(base, { ...base })).toEqual([]);
  });

  it("returns only the fields that actually changed", () => {
    const after = { ...base, guest_count_guaranteed: 120, deposit_amount: 750 };
    const rows = diffEstimateFields(base, after);
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.field).sort()).toEqual(["deposit_amount", "guest_count_guaranteed"]);
    expect(rows.find((r) => r.field === "guest_count_guaranteed")).toEqual({
      field: "guest_count_guaranteed",
      label: "Guest count (guaranteed)",
      before: null,
      after: 120,
    });
  });
});
