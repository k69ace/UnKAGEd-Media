import Anthropic from "@anthropic-ai/sdk";

// Optional AI layer used for review-sentiment summarization and the
// "Fix It" copy generator. Everything that uses this degrades to a
// deterministic template/lexicon fallback when ANTHROPIC_API_KEY isn't set,
// so the app is fully functional without it.

let client: Anthropic | null = null;

export function hasAnthropicKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function getClient(): Anthropic | null {
  if (!hasAnthropicKey()) return null;
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";

/** Sends a single-turn prompt and returns the text response, or null on failure/no key. */
export async function generateText(
  prompt: string,
  options?: { system?: string; maxTokens?: number },
): Promise<string | null> {
  const anthropic = getClient();
  if (!anthropic) return null;

  try {
    const message = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: options?.maxTokens ?? 1024,
      system: options?.system,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    return textBlock && textBlock.type === "text" ? textBlock.text.trim() : null;
  } catch (err) {
    console.error("Anthropic request failed", err);
    return null;
  }
}

/** Same as generateText but parses the response as JSON, returning null on any failure. */
export async function generateJSON<T>(
  prompt: string,
  options?: { system?: string; maxTokens?: number },
): Promise<T | null> {
  const text = await generateText(prompt, options);
  if (!text) return null;
  try {
    const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    return JSON.parse(match ? match[0] : text) as T;
  } catch (err) {
    console.error("Failed to parse Anthropic JSON response", err);
    return null;
  }
}
