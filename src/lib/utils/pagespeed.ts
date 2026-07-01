// Wrapper around Google's PageSpeed Insights API (free with an API key,
// no billing account required). Falls back to `null` when no key is set or
// the request fails/times out, so the Website agent can fall back to a
// heuristic timing measurement instead.

export type PageSpeedScores = {
  performance: number; // 0-100
  seo: number;
  accessibility: number;
  bestPractices: number;
  largestContentfulPaintMs?: number;
};

export function hasPageSpeedKey(): boolean {
  return Boolean(process.env.GOOGLE_PAGESPEED_API_KEY || process.env.GOOGLE_PLACES_API_KEY);
}

export async function runPageSpeed(url: string): Promise<PageSpeedScores | null> {
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;

  const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  endpoint.searchParams.set("url", url);
  endpoint.searchParams.set("strategy", "mobile");
  endpoint.searchParams.set("category", "PERFORMANCE");
  endpoint.searchParams.append("category", "SEO");
  endpoint.searchParams.append("category", "ACCESSIBILITY");
  endpoint.searchParams.append("category", "BEST_PRACTICES");
  endpoint.searchParams.set("key", apiKey);

  try {
    const res = await fetch(endpoint.toString(), { signal: AbortSignal.timeout(20000) });
    if (!res.ok) return null;
    const data = await res.json();
    const categories = data?.lighthouseResult?.categories;
    if (!categories) return null;

    const lcp = data?.lighthouseResult?.audits?.["largest-contentful-paint"]?.numericValue;

    return {
      performance: Math.round((categories.performance?.score ?? 0) * 100),
      seo: Math.round((categories.seo?.score ?? 0) * 100),
      accessibility: Math.round((categories.accessibility?.score ?? 0) * 100),
      bestPractices: Math.round((categories["best-practices"]?.score ?? 0) * 100),
      largestContentfulPaintMs: typeof lcp === "number" ? Math.round(lcp) : undefined,
    };
  } catch (err) {
    console.error("PageSpeed Insights request failed", err);
    return null;
  }
}
