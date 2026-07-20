import { describe, expect, it } from "vitest";
import { generateRuleBasedSuggestions } from "./rules";
import type { AnonymizedEstimateShape } from "./types";

function shape(overrides: Partial<AnonymizedEstimateShape>): AnonymizedEstimateShape {
  return {
    eventTypeName: "Wedding",
    serviceStyleName: "Plated",
    guestCount: 100,
    eventStartHour: 18,
    categoriesPresent: ["menu_item", "beverage"],
    lineItemDescriptions: ["Plated Chicken Dinner", "Passed hors d'oeuvres"],
    staffingLineCount: 4,
    ...overrides,
  };
}

describe("generateRuleBasedSuggestions", () => {
  it("flags a missing bar package for an evening reception specifically", () => {
    const result = generateRuleBasedSuggestions(shape({ categoriesPresent: ["menu_item"], eventStartHour: 19 }));
    expect(result.some((s) => s.message.includes("evening reception"))).toBe(true);
  });

  it("uses the generic beverage message when there's no event start time to judge evening-ness", () => {
    const result = generateRuleBasedSuggestions(shape({ categoriesPresent: ["menu_item"], eventStartHour: null }));
    expect(result.some((s) => s.message === "No beverage line item present — confirm this is intentional.")).toBe(true);
  });

  it("does not flag beverages when an alcohol or beverage line item is present", () => {
    const result = generateRuleBasedSuggestions(shape({ categoriesPresent: ["menu_item", "alcohol"] }));
    expect(result.some((s) => s.message.toLowerCase().includes("beverage") || s.message.toLowerCase().includes("bar"))).toBe(false);
  });

  it("flags no staffing line for guest counts over 50", () => {
    const result = generateRuleBasedSuggestions(shape({ guestCount: 75, staffingLineCount: 0 }));
    expect(result.some((s) => s.message.includes("staffing"))).toBe(true);
  });

  it("does not flag staffing for guest counts at or under 50", () => {
    const result = generateRuleBasedSuggestions(shape({ guestCount: 50, staffingLineCount: 0 }));
    expect(result.some((s) => s.message.includes("staffing"))).toBe(false);
  });

  it("suggests a passed hors d'oeuvres upsell for a large plated dinner without one", () => {
    const result = generateRuleBasedSuggestions(
      shape({ serviceStyleName: "Plated", guestCount: 60, lineItemDescriptions: ["Plated Chicken Dinner"] }),
    );
    expect(result.some((s) => s.type === "upsell" && s.message.includes("hors d'oeuvres"))).toBe(true);
  });

  it("does not repeat the hors d'oeuvres upsell when one is already on the estimate", () => {
    const result = generateRuleBasedSuggestions(
      shape({ serviceStyleName: "Plated", guestCount: 60, lineItemDescriptions: ["Plated Chicken Dinner", "Passed Hors d'oeuvres"] }),
    );
    expect(result.some((s) => s.type === "upsell")).toBe(false);
  });

  it("does not suggest the plated upsell for a small event or a non-plated service style", () => {
    expect(
      generateRuleBasedSuggestions(shape({ serviceStyleName: "Plated", guestCount: 20, lineItemDescriptions: [] })).some(
        (s) => s.type === "upsell",
      ),
    ).toBe(false);
    expect(
      generateRuleBasedSuggestions(shape({ serviceStyleName: "Buffet", guestCount: 100, lineItemDescriptions: [] })).some(
        (s) => s.type === "upsell",
      ),
    ).toBe(false);
  });

  it("flags no menu items or packages selected yet", () => {
    const result = generateRuleBasedSuggestions(shape({ categoriesPresent: [], lineItemDescriptions: [] }));
    expect(result.some((s) => s.message === "No menu items or packages selected yet.")).toBe(true);
  });

  it("every suggestion is labeled with its rules source", () => {
    const result = generateRuleBasedSuggestions(shape({ categoriesPresent: [] }));
    expect(result.every((s) => s.source === "rules")).toBe(true);
  });
});
