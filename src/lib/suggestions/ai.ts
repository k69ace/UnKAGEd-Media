import "server-only";
import type { AnonymizedEstimateShape, Suggestion } from "./types";

/**
 * AI upsell/missing-info suggestions — adapter seam only.
 *
 * No AI provider is wired up here: there's no credential, endpoint, or
 * provider contract to implement against yet, and per the module's
 * integration policy, nothing gets built against a service without real
 * credentials and documentation in hand. `generateAiSuggestions` always
 * returns null today, which the orchestrator (index.ts) treats exactly
 * like "AI temporarily unavailable" — it falls back to the rules-based
 * engine, which is the actual primary implementation, not a degraded
 * substitute.
 *
 * When a real provider is added: read its key from
 * process.env.AI_SUGGESTIONS_API_KEY (already documented as optional in
 * .env.example), send only `toAiPayload()`'s output — never raw contact
 * PII, never estimate.customers/contacts — log the request with the
 * anonymized payload only, and keep this function's return type/shape
 * identical so the orchestrator and UI don't need to change.
 */
export async function generateAiSuggestions(shape: AnonymizedEstimateShape): Promise<Suggestion[] | null> {
  if (!process.env.AI_SUGGESTIONS_API_KEY) {
    return null;
  }
  // No provider integration exists yet even when a key is present --
  // fabricating a call here would violate the "no integration without
  // real credentials and documentation" policy. Falling back to null
  // (and therefore to the rules engine) until a real provider is wired up.
  void shape;
  return null;
}

/** Strips even the anonymized shape down to what an external call should
 *  ever receive: no free-text line item descriptions (they're customer
 *  menu language and could incidentally contain names), just counts. */
export function toAiPayload(shape: AnonymizedEstimateShape) {
  return {
    eventTypeName: shape.eventTypeName,
    serviceStyleName: shape.serviceStyleName,
    guestCount: shape.guestCount,
    eventStartHour: shape.eventStartHour,
    categoriesPresent: shape.categoriesPresent,
    lineItemCount: shape.lineItemDescriptions.length,
    staffingLineCount: shape.staffingLineCount,
  };
}
