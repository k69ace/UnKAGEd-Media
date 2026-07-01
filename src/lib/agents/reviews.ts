import type { AgentResult, ScanInput } from "@/lib/types";
import { findRestaurantDetails, hasGooglePlacesKey, type PlaceReview } from "@/lib/utils/googlePlaces";
import { generateJSON, hasAnthropicKey } from "@/lib/utils/anthropic";
import { createSeededRandom } from "@/lib/utils/seededRandom";
import { demoTargetProfile } from "@/lib/utils/demoRestaurant";
import { makeFinding, scoreFromDeductions } from "./helpers";

const POSITIVE_WORDS = [
  "great",
  "amazing",
  "delicious",
  "excellent",
  "friendly",
  "love",
  "best",
  "fantastic",
  "awesome",
  "perfect",
  "wonderful",
  "fresh",
  "clean",
  "fast",
];
const NEGATIVE_WORDS = [
  "slow",
  "rude",
  "cold",
  "bad",
  "worst",
  "dirty",
  "overpriced",
  "bland",
  "disappointing",
  "terrible",
  "awful",
  "wait",
  "mistake",
  "never",
];

function lexiconSentiment(text: string): number {
  const lower = text.toLowerCase();
  let score = 0;
  for (const w of POSITIVE_WORDS) if (lower.includes(w)) score += 1;
  for (const w of NEGATIVE_WORDS) if (lower.includes(w)) score -= 1;
  return score;
}

type SentimentSummary = {
  positiveThemes: string[];
  negativeThemes: string[];
  overallTone: "positive" | "mixed" | "negative";
};

async function summarizeSentiment(reviews: { text: string; rating: number }[]): Promise<SentimentSummary> {
  if (reviews.length === 0) {
    return { positiveThemes: [], negativeThemes: [], overallTone: "mixed" };
  }

  if (hasAnthropicKey()) {
    const prompt = `Analyze these restaurant customer reviews. Return strict JSON with keys:
"positiveThemes" (array of up to 3 short phrases, e.g. "friendly staff"),
"negativeThemes" (array of up to 3 short phrases, e.g. "slow service"),
"overallTone" ("positive", "mixed", or "negative").

Reviews:
${reviews.map((r, i) => `${i + 1}. (${r.rating}/5) ${r.text}`).join("\n")}`;

    const result = await generateJSON<SentimentSummary>(prompt, { maxTokens: 400 });
    if (result) return result;
  }

  // Lexicon fallback
  const scored = reviews.map((r) => lexiconSentiment(r.text));
  const avg = scored.reduce((a, b) => a + b, 0) / scored.length;
  return {
    positiveThemes: avg > 0 ? ["positive overall tone"] : [],
    negativeThemes: avg < 0 ? ["negative overall tone"] : [],
    overallTone: avg > 0.5 ? "positive" : avg < -0.5 ? "negative" : "mixed",
  };
}

const DEMO_POSITIVE_REVIEWS = [
  "Food was amazing and the staff was so friendly! Will definitely be back.",
  "Best meal we've had in the area. Fresh ingredients and fast service.",
  "Loved the atmosphere and the portions were perfect.",
];
const DEMO_MIXED_REVIEWS = [
  "Food was good but we had to wait almost 40 minutes for a table.",
  "Decent food, a bit overpriced for what you get.",
  "Service was slow but the staff apologized and comped a dessert.",
];
const DEMO_NEGATIVE_REVIEWS = [
  "Order was wrong twice and the food came out cold.",
  "Waited forever and the staff seemed overwhelmed.",
  "Wouldn't go back, food was bland and overpriced.",
];

function buildDemoReviews(seedKey: string): { rating: number; reviewCount: number; reviews: { text: string; rating: number }[] } {
  const { rating, reviewCount } = demoTargetProfile(seedKey);
  const textRng = createSeededRandom(`${seedKey}|texts`);

  const pool = rating >= 4.3 ? DEMO_POSITIVE_REVIEWS : rating >= 3.8 ? DEMO_MIXED_REVIEWS : DEMO_NEGATIVE_REVIEWS;
  const reviews = [0, 1, 2].map((i) => ({
    text: pool[i % pool.length],
    rating: Math.max(1, Math.min(5, Math.round(rating + Math.floor(textRng() * 3) - 1))),
  }));

  return { rating, reviewCount, reviews };
}

/**
 * Reviews Agent — pulls live Google reviews when GOOGLE_PLACES_API_KEY is
 * configured and summarizes sentiment (via Claude when available, otherwise
 * a lightweight lexicon scorer). Falls back to seeded demo data so the
 * report is still meaningful without API keys.
 */
export async function runReviewsAgent(input: ScanInput): Promise<AgentResult> {
  const findings = [];
  const deductions: number[] = [];

  let rating: number;
  let reviewCount: number;
  let reviewTexts: { text: string; rating: number }[];
  let dataSource: "live" | "estimated" = "estimated";
  let staleReview = false;

  if (hasGooglePlacesKey()) {
    const details = await findRestaurantDetails(input.restaurantName, input.location);
    if (details && typeof details.rating === "number") {
      dataSource = "live";
      rating = details.rating;
      reviewCount = details.user_ratings_total ?? 0;
      const liveReviews: PlaceReview[] = details.reviews ?? [];
      reviewTexts = liveReviews.map((r) => ({ text: r.text, rating: r.rating }));
      staleReview = liveReviews.every((r) => /year/.test(r.relative_time_description ?? ""));
    } else {
      const demo = buildDemoReviews(`${input.restaurantName}|${input.location ?? ""}`);
      rating = demo.rating;
      reviewCount = demo.reviewCount;
      reviewTexts = demo.reviews;
    }
  } else {
    const demo = buildDemoReviews(`${input.restaurantName}|${input.location ?? ""}`);
    rating = demo.rating;
    reviewCount = demo.reviewCount;
    reviewTexts = demo.reviews;
  }

  const sentiment = await summarizeSentiment(reviewTexts);

  if (rating < 3.5) {
    deductions.push(35);
    findings.push(
      makeFinding("critical", "Low average rating", `Your average rating is ${rating.toFixed(1)}/5. This is likely turning away potential customers before they even visit.`, {
        estimatedImpact: "Ratings under 3.5 stars can cut conversion from search by more than half",
        agentId: "reviews",
      }),
    );
  } else if (rating < 4.2) {
    deductions.push(15);
    findings.push(
      makeFinding("warning", "Rating has room to improve", `Average rating is ${rating.toFixed(1)}/5. Most customers filter for 4.2+ when choosing where to eat.`, { agentId: "reviews" }),
    );
  } else {
    findings.push(makeFinding("good", "Strong average rating", `Average rating is ${rating.toFixed(1)}/5.`, { agentId: "reviews" }));
  }

  if (reviewCount < 25) {
    deductions.push(15);
    findings.push(
      makeFinding("warning", "Not enough reviews", `Only ${reviewCount} reviews found. A steady stream of new reviews builds trust and improves local ranking.`, {
        fixable: true,
        agentId: "reviews",
      }),
    );
  } else {
    findings.push(makeFinding("good", "Healthy review volume", `${reviewCount} reviews found.`, { agentId: "reviews" }));
  }

  if (sentiment.negativeThemes.length > 0) {
    deductions.push(10);
    findings.push(
      makeFinding("warning", "Recurring complaints in reviews", `Common negative themes: ${sentiment.negativeThemes.join(", ")}.`, {
        fixable: true,
        agentId: "reviews",
      }),
    );
  }
  if (sentiment.positiveThemes.length > 0) {
    findings.push(makeFinding("good", "Customers love this", sentiment.positiveThemes.join(", "), { agentId: "reviews" }));
  }

  if (staleReview) {
    deductions.push(6);
    findings.push(
      makeFinding("info", "Reviews may be getting stale", "Recent reviews are sparse — actively asking happy customers to leave a review keeps your profile fresh.", {
        fixable: true,
        agentId: "reviews",
      }),
    );
  }

  const score = scoreFromDeductions(deductions);

  return {
    agentId: "reviews",
    label: "Reviews & Reputation",
    status: "ok",
    dataSource,
    score,
    summary:
      dataSource === "estimated"
        ? `Estimated reputation snapshot (connect GOOGLE_PLACES_API_KEY for live review data). Rating ~${rating.toFixed(1)}/5 across ~${reviewCount} reviews.`
        : score >= 80
          ? "Your online reputation is strong."
          : score >= 50
            ? "Your reputation has fixable gaps."
            : "Your reputation needs urgent attention.",
    findings,
    metrics: { rating, reviewCount },
  };
}
