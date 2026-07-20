import "server-only";
import { generateAiSuggestions } from "./ai";
import { generateRuleBasedSuggestions } from "./rules";
import type { AnonymizedEstimateShape, Suggestion } from "./types";

export type { Suggestion, AnonymizedEstimateShape };

/**
 * Always runs the rules engine (the primary, always-on implementation);
 * additionally asks the AI adapter for supplementary suggestions, which
 * today always returns null (see ai.ts) and so is a no-op. If a real AI
 * provider is added later, its output is merged in and de-duplicated by
 * message rather than replacing the rules-based results — the rules
 * engine keeps running even when AI is configured and available, so a
 * provider outage degrades to "no extra suggestions," not "no
 * suggestions at all."
 */
export async function generateSuggestions(shape: AnonymizedEstimateShape): Promise<Suggestion[]> {
  const ruleSuggestions = generateRuleBasedSuggestions(shape);

  let aiSuggestions: Suggestion[] = [];
  try {
    aiSuggestions = (await generateAiSuggestions(shape)) ?? [];
  } catch {
    aiSuggestions = [];
  }

  const seen = new Set(ruleSuggestions.map((s) => s.message));
  const merged = [...ruleSuggestions];
  for (const s of aiSuggestions) {
    if (!seen.has(s.message)) {
      merged.push(s);
      seen.add(s.message);
    }
  }
  return merged;
}
