import type { AgentResult, CompetitorSnapshot, ScanInput } from "@/lib/types";
import { findRestaurantDetails, hasGooglePlacesKey, textSearchRestaurants } from "@/lib/utils/googlePlaces";
import { createSeededRandom, range } from "@/lib/utils/seededRandom";
import { demoTargetProfile } from "@/lib/utils/demoRestaurant";
import { makeFinding, scoreFromDeductions } from "./helpers";

const DEMO_COMPETITOR_NAMES = [
  "The Local Table",
  "Harvest & Co.",
  "Blue Oak Kitchen",
  "Main Street Bistro",
  "Corner House Grill",
];

function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function standingFor(target: number, competitor: number): CompetitorSnapshot["standing"] {
  if (competitor - target > 0.15) return "behind";
  if (target - competitor > 0.15) return "ahead";
  return "even";
}

function buildDemoCompetitors(seedKey: string, targetRating: number): CompetitorSnapshot[] {
  const rng = createSeededRandom(`${seedKey}|competitors`);
  return DEMO_COMPETITOR_NAMES.slice(0, 4).map((name) => {
    const rating = Math.round((3.5 + rng() * 1.3) * 10) / 10;
    const reviewCount = range(rng, 30, 900);
    return {
      name,
      rating,
      reviewCount,
      priceLevel: range(rng, 1, 3),
      standing: standingFor(targetRating, rating),
    };
  });
}

/**
 * Competitor Agent — benchmarks the restaurant against nearby competitors
 * using Google Places Text Search (which returns rating/review count
 * directly, no extra Details calls needed).
 */
export async function runCompetitorAgent(input: ScanInput): Promise<AgentResult> {
  const seedKey = `${input.restaurantName}|${input.location ?? ""}`;
  let competitors: CompetitorSnapshot[];
  let targetRating: number;
  let dataSource: "live" | "estimated" = "estimated";

  if (hasGooglePlacesKey() && input.location) {
    const [targetDetails, searchResults] = await Promise.all([
      findRestaurantDetails(input.restaurantName, input.location),
      textSearchRestaurants(`restaurants in ${input.location}`),
    ]);

    if (targetDetails && typeof targetDetails.rating === "number" && searchResults.length > 0) {
      dataSource = "live";
      targetRating = targetDetails.rating;
      const targetKey = normalize(targetDetails.name);

      competitors = searchResults
        .filter((r) => normalize(r.name) !== targetKey && typeof r.rating === "number")
        .slice(0, 5)
        .map((r) => ({
          name: r.name,
          rating: r.rating ?? 0,
          reviewCount: r.user_ratings_total ?? 0,
          priceLevel: r.price_level,
          standing: standingFor(targetRating, r.rating ?? 0),
        }));
    } else {
      targetRating = demoTargetProfile(seedKey).rating;
      competitors = buildDemoCompetitors(seedKey, targetRating);
    }
  } else {
    targetRating = demoTargetProfile(seedKey).rating;
    competitors = buildDemoCompetitors(seedKey, targetRating);
  }

  const findings = [];
  const deductions: number[] = [];

  const ahead = competitors.filter((c) => c.standing === "behind").length; // competitor "behind" target = target ahead of them
  const behindCount = competitors.filter((c) => c.standing === "ahead").length; // target behind these competitors

  if (competitors.length === 0) {
    findings.push(makeFinding("info", "No competitor data available", "We couldn't find nearby competitors to benchmark against.", { agentId: "competitors" }));
  } else if (behindCount >= Math.ceil(competitors.length / 2)) {
    deductions.push(25);
    findings.push(
      makeFinding("critical", "Trailing most local competitors", `You're rated lower than ${behindCount} of ${competitors.length} nearby competitors we compared.`, {
        estimatedImpact: "Losing 'best restaurant near me' searches to competitors",
        agentId: "competitors",
      }),
    );
  } else {
    findings.push(makeFinding("good", "Competitive standing", `You're on par with or ahead of ${ahead} of ${competitors.length} nearby competitors we compared.`, { agentId: "competitors" }));
  }

  const topCompetitor = [...competitors].sort((a, b) => b.rating - a.rating)[0];
  if (topCompetitor && topCompetitor.rating - targetRating > 0.3) {
    findings.push(
      makeFinding("warning", `${topCompetitor.name} is outperforming you`, `They're rated ${topCompetitor.rating.toFixed(1)}/5 across ${topCompetitor.reviewCount} reviews vs. your ${targetRating.toFixed(1)}/5.`, {
        agentId: "competitors",
      }),
    );
  }

  const score = scoreFromDeductions(deductions);

  return {
    agentId: "competitors",
    label: "Competitive Landscape",
    status: "ok",
    dataSource,
    score,
    summary:
      dataSource === "estimated"
        ? "Estimated competitive benchmark (connect GOOGLE_PLACES_API_KEY + provide a location for live data)."
        : score >= 80
          ? "You're well-positioned against local competitors."
          : "Local competitors are outperforming you in key areas.",
    findings,
    competitors,
  };
}
