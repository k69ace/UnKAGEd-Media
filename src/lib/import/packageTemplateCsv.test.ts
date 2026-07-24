import { describe, expect, it } from "vitest";
import { parsePackageTemplateCsv } from "./packageTemplateCsv";

const HEADER = "Category,Description,Quantity,Unit,Unit Price,Unit Cost,Taxable,Tax Rule";
const foodTax = { id: "tax-food-id", name: "Food" };
const alcoholTax = { id: "tax-alcohol-id", name: "Alcohol" };

describe("parsePackageTemplateCsv", () => {
  it("imports a well-formed catalog, resolving category labels and tax rule names to internal values", () => {
    const csv = [
      HEADER,
      "Menu item,Herb Roasted Chicken,1,per person,45.00,17.00,Yes,Food",
      "Alcohol,Hosted Bar,1,per person,22.00,9.00,Yes,Alcohol",
      "Delivery,Delivery fee,1,flat,350.00,,No,",
    ].join("\n");

    const result = parsePackageTemplateCsv(csv, [foodTax, alcoholTax]);

    expect(result.errors).toEqual([]);
    expect(result.items).toEqual([
      { category: "menu_item", description: "Herb Roasted Chicken", quantity: 1, unit: "per person", unitPrice: 45, unitCost: 17, isTaxable: true, taxRuleId: foodTax.id },
      { category: "alcohol", description: "Hosted Bar", quantity: 1, unit: "per person", unitPrice: 22, unitCost: 9, isTaxable: true, taxRuleId: alcoholTax.id },
      { category: "delivery", description: "Delivery fee", quantity: 1, unit: "flat", unitPrice: 350, unitCost: null, isTaxable: false, taxRuleId: null },
    ]);
  });

  it("also accepts the raw category enum key, not just the display label", () => {
    const csv = [HEADER, "menu_item,Chicken,1,each,10,,No,"].join("\n");
    const result = parsePackageTemplateCsv(csv, []);
    expect(result.errors).toEqual([]);
    expect(result.items[0].category).toBe("menu_item");
  });

  it("rejects the whole file (no partial import) when any row has an unrecognized category", () => {
    const csv = [HEADER, "Not A Real Category,Something,1,each,10,,No,"].join("\n");
    const result = parsePackageTemplateCsv(csv, []);
    expect(result.items).toEqual([]);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatch(/not a valid category/i);
  });

  it("rejects a tax rule name that doesn't match any tax rule in the organization", () => {
    const csv = [HEADER, "Menu item,Chicken,1,each,10,,Yes,Nonexistent Tax"].join("\n");
    const result = parsePackageTemplateCsv(csv, [foodTax]);
    expect(result.items).toEqual([]);
    expect(result.errors[0]).toMatch(/does not match any tax rule/i);
  });

  it("rejects non-numeric or non-positive quantity and negative prices", () => {
    const csv = [
      HEADER,
      "Menu item,Chicken,not-a-number,each,10,,No,",
      "Menu item,Fish,1,each,-5,,No,",
    ].join("\n");
    const result = parsePackageTemplateCsv(csv, []);
    expect(result.items).toEqual([]);
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0]).toMatch(/quantity must be a positive number/i);
    expect(result.errors[1]).toMatch(/unit price must be a non-negative number/i);
  });

  it("collects every row's error, not just the first", () => {
    const csv = [
      HEADER,
      "Bogus,Chicken,1,each,10,,No,",
      "Menu item,,1,each,10,,No,",
      "Menu item,Fish,-1,each,10,,No,",
    ].join("\n");
    const result = parsePackageTemplateCsv(csv, []);
    expect(result.errors).toHaveLength(3);
  });

  it("rejects a file with the wrong header shape instead of guessing column order", () => {
    const result = parsePackageTemplateCsv("Name,Price\nChicken,10\n", []);
    expect(result.items).toEqual([]);
    expect(result.errors[0]).toMatch(/Header row must be exactly/);
  });

  it("rejects an empty file and a header-only file distinctly", () => {
    expect(parsePackageTemplateCsv("", []).errors[0]).toMatch(/empty/i);
    expect(parsePackageTemplateCsv(HEADER + "\n", []).errors[0]).toMatch(/No data rows/i);
  });

  it("defaults unit to 'each' and taxable to false when left blank, without erroring", () => {
    const csv = [HEADER, "Menu item,Chicken,1,,10,,,"].join("\n");
    const result = parsePackageTemplateCsv(csv, []);
    expect(result.errors).toEqual([]);
    expect(result.items[0]).toMatchObject({ unit: "each", isTaxable: false });
  });
});
