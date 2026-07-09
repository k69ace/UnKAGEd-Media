import type { AgentResult, ScanInput } from "@/lib/types";
import { findRestaurantDetails, hasGooglePlacesKey } from "@/lib/utils/googlePlaces";
import { createSeededRandom } from "@/lib/utils/seededRandom";
import { makeFinding, scoreFromDeductions } from "./helpers";

type GbpProfile = {
  hasWebsite: boolean;
  hasPhone: boolean;
  hasHours: boolean;
  photoCount: number;
  categories: string[];
  isOperational: boolean;
};

function buildDemoProfile(seedKey: string): GbpProfile {
  const rng = createSeededRandom(seedKey);
  return {
    hasWebsite: rng() > 0.2,
    hasPhone: rng() > 0.1,
    hasHours: rng() > 0.25,
    photoCount: Math.floor(rng() * 30),
    categories: rng() > 0.5 ? ["Restaurant", "Italian restaurant"] : ["Restaurant"],
    isOperational: true,
  };
}

/**
 * Google Business Profile Agent — checks profile completeness, which is one
 * of the strongest local-ranking factors Google publicly acknowledges.
 */
export async function runGbpAgent(input: ScanInput): Promise<AgentResult> {
  let profile: GbpProfile;
  let dataSource: "live" | "estimated" = "estimated";

  if (hasGooglePlacesKey()) {
    const details = await findRestaurantDetails(input.restaurantName, input.location);
    if (details) {
      dataSource = "live";
      profile = {
        hasWebsite: Boolean(details.website),
        hasPhone: Boolean(details.formatted_phone_number),
        hasHours: Boolean(details.opening_hours?.weekday_text?.length),
        photoCount: details.photos?.length ?? 0,
        categories: details.types?.filter((t) => !["point_of_interest", "establishment", "food"].includes(t)) ?? [],
        isOperational: details.business_status ? details.business_status === "OPERATIONAL" : true,
      };
    } else {
      profile = buildDemoProfile(`${input.restaurantName}|${input.location ?? ""}`);
    }
  } else {
    profile = buildDemoProfile(`${input.restaurantName}|${input.location ?? ""}`);
  }

  const findings = [];
  const deductions: number[] = [];

  if (!profile.isOperational) {
    deductions.push(40);
    findings.push(
      makeFinding("critical", "Profile not marked as operational", "Your Google Business Profile isn't showing as an active, operating business.", {
        estimatedImpact: "Customers may think you're closed",
        agentId: "gbp",
      }),
    );
  }

  if (!profile.hasWebsite) {
    deductions.push(12);
    findings.push(makeFinding("warning", "No website linked on your profile", "Add your website link so searchers can go straight from Google to your menu/ordering page.", { fixable: true, agentId: "gbp" }));
  }
  if (!profile.hasPhone) {
    deductions.push(12);
    findings.push(makeFinding("warning", "No phone number on profile", "A visible phone number lets customers call to order or ask questions directly from search.", { fixable: true, agentId: "gbp" }));
  }
  if (!profile.hasHours) {
    deductions.push(15);
    findings.push(
      makeFinding("critical", "Business hours missing or incomplete", "Incomplete hours are one of the top reasons customers choose a competitor instead.", {
        estimatedImpact: "Customers can't confirm you're open",
        fixable: true,
        agentId: "gbp",
      }),
    );
  } else {
    findings.push(makeFinding("good", "Hours are set", "Business hours are published on your profile.", { agentId: "gbp" }));
  }

  if (profile.photoCount < 10) {
    deductions.push(10);
    findings.push(
      makeFinding("warning", "Low photo count on profile", `Only ${profile.photoCount} photos on your Business Profile. Profiles with 10+ photos get significantly more requests for directions and clicks to website.`, {
        fixable: true,
        agentId: "gbp",
      }),
    );
  } else {
    findings.push(makeFinding("good", "Good photo coverage", `${profile.photoCount} photos on your profile.`, { agentId: "gbp" }));
  }

  if (profile.categories.length <= 1) {
    deductions.push(6);
    findings.push(
      makeFinding("info", "Generic business category", "Adding a more specific primary/secondary category (e.g. 'Italian restaurant') helps you rank for more specific searches.", {
        fixable: true,
        agentId: "gbp",
      }),
    );
  }

  const score = scoreFromDeductions(deductions);

  return {
    agentId: "gbp",
    label: "Google Business Profile",
    status: "ok",
    dataSource,
    score,
    summary:
      dataSource === "estimated"
        ? "Estimated profile completeness (connect GOOGLE_PLACES_API_KEY for live data)."
        : score >= 80
          ? "Your Business Profile is well optimized."
          : score >= 50
            ? "Your Business Profile has gaps worth fixing."
            : "Your Business Profile is missing critical information.",
    findings,
    metrics: {
      photoCount: profile.photoCount,
      hasWebsite: profile.hasWebsite,
      hasHours: profile.hasHours,
    },
  };
}
