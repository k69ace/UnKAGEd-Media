// Shared suggestion contract. AI must never compute or alter a price, tax,
// or total — a suggestion is always a plain, structured recommendation
// the sales manager reviews and accepts or dismisses; nothing here writes
// to an estimate on its own.
export interface Suggestion {
  type: "missing_info" | "upsell";
  message: string;
  relatedLineItemIds: string[];
  /** Where the suggestion came from — surfaced in the UI so a rules-based
   *  result during an AI outage doesn't get mistaken for an AI opinion. */
  source: "rules" | "ai";
}

// The only data ever available to build a suggestion, by AI or rules —
// deliberately excludes customer/contact PII (names, emails, phone,
// venue address). If an AI provider is ever wired in (see
// lib/suggestions/ai.ts), this is the complete payload it may receive.
export interface AnonymizedEstimateShape {
  eventTypeName: string | null;
  serviceStyleName: string | null;
  guestCount: number | null;
  eventStartHour: number | null;
  categoriesPresent: string[];
  lineItemDescriptions: string[];
  staffingLineCount: number;
}
