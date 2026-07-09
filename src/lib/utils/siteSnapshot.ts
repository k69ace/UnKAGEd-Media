import * as cheerio from "cheerio";
import { isSafeUrl } from "./urlSafety";

// Fetches and parses a restaurant's website exactly once. The Website, Local
// SEO, and Photo agents all read from this shared snapshot instead of each
// re-fetching the page, since they're triggered in parallel by the
// orchestrator for the same URL.

export type ImageRef = {
  src: string;
  alt: string;
};

export type SiteSnapshot = {
  finalUrl: string;
  isHttps: boolean;
  loadTimeMs: number;
  statusCode: number;
  html: string;
  title: string;
  metaDescription: string;
  hasViewportMeta: boolean;
  ogTags: Record<string, string>;
  jsonLdTypes: string[];
  headings: { h1: number; h2: number };
  images: ImageRef[];
  bodyText: string;
  wordCount: number;
  hasOrderCta: boolean;
  hasReservationCta: boolean;
  phoneMatches: string[];
};

const CTA_ORDER_KEYWORDS = ["order online", "order now", "start your order", "order here", "delivery", "pickup"];
const CTA_RESERVATION_KEYWORDS = ["reservation", "book a table", "book now", "reserve"];

const MAX_REDIRECTS = 5;

/** Follows redirects manually, re-validating each hop against isSafeUrl to prevent SSRF via redirect. */
async function safeFetch(startUrl: string): Promise<Response | null> {
  let currentUrl = startUrl;
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    if (!isSafeUrl(currentUrl)) return null;

    let res: Response;
    try {
      res = await fetch(currentUrl, {
        redirect: "manual",
        signal: AbortSignal.timeout(12000),
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; RestaurantGraderBot/1.0; +https://grader.local)",
        },
      });
    } catch (err) {
      console.error(`Failed to fetch ${currentUrl}`, err);
      return null;
    }

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) return null;
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }

    return res;
  }
  return null;
}

export async function fetchSiteSnapshot(url: string): Promise<SiteSnapshot | null> {
  if (!isSafeUrl(url)) return null;

  const started = performance.now();
  const res = await safeFetch(url);
  const loadTimeMs = Math.round(performance.now() - started);

  if (!res || !res.ok) return null;

  const html = await res.text();
  const $ = cheerio.load(html);

  const title = $("title").first().text().trim();
  const metaDescription = $('meta[name="description"]').attr("content")?.trim() ?? "";
  const hasViewportMeta = $('meta[name="viewport"]').length > 0;

  const ogTags: Record<string, string> = {};
  $('meta[property^="og:"]').each((_, el) => {
    const prop = $(el).attr("property");
    const content = $(el).attr("content");
    if (prop && content) ogTags[prop] = content;
  });

  const jsonLdTypes: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const parsed = JSON.parse($(el).contents().text());
      const entries = Array.isArray(parsed) ? parsed : [parsed];
      for (const entry of entries) {
        const type = entry?.["@type"];
        if (typeof type === "string") jsonLdTypes.push(type);
        else if (Array.isArray(type)) jsonLdTypes.push(...type);
      }
    } catch {
      // ignore malformed JSON-LD blocks
    }
  });

  const images: ImageRef[] = [];
  $("img").each((_, el) => {
    const src = $(el).attr("src") || $(el).attr("data-src");
    if (!src) return;
    let resolved = src;
    try {
      resolved = new URL(src, res.url).toString();
    } catch {
      return;
    }
    images.push({ src: resolved, alt: ($(el).attr("alt") ?? "").trim() });
  });

  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const wordCount = bodyText.length ? bodyText.split(" ").length : 0;
  const lowerText = bodyText.toLowerCase();

  const phoneMatches =
    bodyText.match(/(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/g)?.slice(0, 3) ?? [];

  return {
    finalUrl: res.url,
    isHttps: res.url.startsWith("https://"),
    loadTimeMs,
    statusCode: res.status,
    html,
    title,
    metaDescription,
    hasViewportMeta,
    ogTags,
    jsonLdTypes,
    headings: { h1: $("h1").length, h2: $("h2").length },
    images,
    bodyText,
    wordCount,
    hasOrderCta: CTA_ORDER_KEYWORDS.some((kw) => lowerText.includes(kw)),
    hasReservationCta: CTA_RESERVATION_KEYWORDS.some((kw) => lowerText.includes(kw)),
    phoneMatches,
  };
}
