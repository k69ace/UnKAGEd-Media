import type { AnonymizedEstimateShape, Suggestion } from "./types";

const BEVERAGE_CATEGORIES = ["beverage", "alcohol"];
const HORS_DOEUVRES_PATTERN = /hors\s*d'?oeuvre|passed\s+app/i;

/**
 * Deterministic, always-available checklist. This is not a degraded
 * fallback bolted on after the fact — it's the primary implementation;
 * an AI provider (see ai.ts) can only ever supplement it, and the
 * feature is fully usable with this alone if no AI provider is
 * configured or it's unavailable.
 */
export function generateRuleBasedSuggestions(shape: AnonymizedEstimateShape): Suggestion[] {
  const suggestions: Suggestion[] = [];

  const hasBeverage = shape.categoriesPresent.some((c) => BEVERAGE_CATEGORIES.includes(c));
  const isEvening = shape.eventStartHour !== null && shape.eventStartHour >= 17;
  if (!hasBeverage && isEvening) {
    suggestions.push({
      type: "missing_info",
      message: "No bar package selected for an evening reception — confirm this is intentional.",
      relatedLineItemIds: [],
      source: "rules",
    });
  } else if (!hasBeverage) {
    suggestions.push({
      type: "missing_info",
      message: "No beverage line item present — confirm this is intentional.",
      relatedLineItemIds: [],
      source: "rules",
    });
  }

  if (shape.guestCount !== null && shape.guestCount > 50 && shape.staffingLineCount === 0) {
    suggestions.push({
      type: "missing_info",
      message: "No staffing line item present for a guest count over 50 — confirm this is intentional.",
      relatedLineItemIds: [],
      source: "rules",
    });
  }

  const isPlated = shape.serviceStyleName?.toLowerCase() === "plated";
  const hasHorsDoeuvres = shape.lineItemDescriptions.some((d) => HORS_DOEUVRES_PATTERN.test(d));
  if (isPlated && shape.guestCount !== null && shape.guestCount >= 50 && !hasHorsDoeuvres) {
    suggestions.push({
      type: "upsell",
      message:
        "Similar plated-dinner events of this size typically add a passed hors d'oeuvres package — worth offering?",
      relatedLineItemIds: [],
      source: "rules",
    });
  }

  if (shape.categoriesPresent.length === 0) {
    suggestions.push({
      type: "missing_info",
      message: "No menu items or packages selected yet.",
      relatedLineItemIds: [],
      source: "rules",
    });
  }

  return suggestions;
}
