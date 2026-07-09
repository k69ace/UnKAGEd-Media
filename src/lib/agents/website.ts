import type { AgentResult, ScanInput } from "@/lib/types";
import type { SiteSnapshot } from "@/lib/utils/siteSnapshot";
import { runPageSpeed, hasPageSpeedKey } from "@/lib/utils/pagespeed";
import { makeFinding, scoreFromDeductions } from "./helpers";

/**
 * Website Agent — analyzes the restaurant's site for technical health:
 * mobile-friendliness, load speed, HTTPS, structured data, and metadata.
 * Uses Google PageSpeed Insights for real Lighthouse scores when a key is
 * configured; otherwise falls back to a heuristic based on the actual
 * fetch timing and markup we already captured in the snapshot.
 */
export async function runWebsiteAgent(
  input: ScanInput,
  snapshot: SiteSnapshot | null,
): Promise<AgentResult> {
  if (!input.url) {
    return {
      agentId: "website",
      label: "Website Health",
      status: "skipped",
      dataSource: "unavailable",
      score: 0,
      summary: "No website URL was provided, so technical analysis was skipped.",
      findings: [
        makeFinding("warning", "No website on file", "We couldn't check site health without a URL to scan.", { agentId: "website" }),
      ],
    };
  }

  if (!snapshot) {
    return {
      agentId: "website",
      label: "Website Health",
      status: "error",
      dataSource: "unavailable",
      score: 20,
      summary: `We couldn't reach ${input.url}. The site may be down, blocking bots, or the URL may be incorrect.`,
      findings: [
        makeFinding(
          "critical",
          "Website unreachable",
          `A live fetch of ${input.url} failed. Down sites lose 100% of web-driven orders.`,
          { estimatedImpact: "Potentially losing all web-referred orders", agentId: "website" },
        ),
      ],
    };
  }

  const findings = [];
  const deductions: number[] = [];

  const pageSpeed = await runPageSpeed(snapshot.finalUrl);

  // --- HTTPS ---
  if (!snapshot.isHttps) {
    deductions.push(15);
    findings.push(
      makeFinding("critical", "Site is not using HTTPS", "Browsers flag non-HTTPS sites as 'Not Secure', which scares off customers and hurts Google rankings.", {
        estimatedImpact: "Lower search ranking + higher bounce rate",
        fixable: true,
        agentId: "website",
      }),
    );
  }

  // --- Mobile viewport ---
  if (!snapshot.hasViewportMeta) {
    deductions.push(15);
    findings.push(
      makeFinding("critical", "Not optimized for mobile", "No responsive viewport tag was found. Over 60% of restaurant searches happen on mobile.", {
        estimatedImpact: "Poor mobile experience for the majority of visitors",
        fixable: true,
        agentId: "website",
      }),
    );
  }

  // --- Load speed ---
  if (pageSpeed) {
    if (pageSpeed.performance < 50) {
      deductions.push(15);
      findings.push(
        makeFinding("critical", "Slow page load speed", `Google PageSpeed Insights scored mobile performance at ${pageSpeed.performance}/100. Slow sites lose visitors before the page even loads.`, {
          estimatedImpact: "Estimated 20-30% visitor drop-off from slow load",
          fixable: true,
          agentId: "website",
        }),
      );
    } else if (pageSpeed.performance < 80) {
      deductions.push(6);
      findings.push(
        makeFinding("warning", "Page load speed could be faster", `Mobile performance score: ${pageSpeed.performance}/100.`, { fixable: true, agentId: "website" }),
      );
    } else {
      findings.push(makeFinding("good", "Fast page load speed", `Mobile performance score: ${pageSpeed.performance}/100.`, { agentId: "website" }));
    }
  } else if (snapshot.loadTimeMs > 3000) {
    deductions.push(10);
    findings.push(
      makeFinding("warning", "Slow server response", `The homepage took ${(snapshot.loadTimeMs / 1000).toFixed(1)}s to respond.`, { fixable: true, agentId: "website" }),
    );
  } else {
    findings.push(makeFinding("good", "Responsive server", `Homepage responded in ${snapshot.loadTimeMs}ms.`, { agentId: "website" }));
  }

  // --- Title tag ---
  if (!snapshot.title) {
    deductions.push(10);
    findings.push(makeFinding("critical", "Missing page title", "The homepage has no <title> tag, hurting SEO and browser tab branding.", { fixable: true, agentId: "website" }));
  } else if (snapshot.title.length > 60 || snapshot.title.length < 15) {
    deductions.push(4);
    findings.push(
      makeFinding("warning", "Page title isn't optimized", `Title is ${snapshot.title.length} characters ("${snapshot.title}"). Aim for 50-60 characters including your city and cuisine.`, {
        fixable: true,
        agentId: "website",
      }),
    );
  } else {
    findings.push(makeFinding("good", "Page title looks good", `"${snapshot.title}"`, { agentId: "website" }));
  }

  // --- Meta description ---
  if (!snapshot.metaDescription) {
    deductions.push(8);
    findings.push(
      makeFinding("warning", "Missing meta description", "No meta description means Google will auto-generate one, missing a chance to sell your restaurant in search results.", {
        fixable: true,
        agentId: "website",
      }),
    );
  }

  // --- Structured data ---
  const hasRestaurantSchema = snapshot.jsonLdTypes.some((t) =>
    ["restaurant", "foodestablishment", "localbusiness"].includes(t.toLowerCase()),
  );
  if (!hasRestaurantSchema) {
    deductions.push(8);
    findings.push(
      makeFinding("warning", "No Restaurant structured data", "Adding Schema.org Restaurant/LocalBusiness markup helps Google show rich results (hours, menu, ratings) directly in search.", {
        fixable: true,
        agentId: "website",
      }),
    );
  } else {
    findings.push(makeFinding("good", "Structured data present", "Restaurant/LocalBusiness schema markup found.", { agentId: "website" }));
  }

  // --- Ordering / reservation CTA ---
  if (!snapshot.hasOrderCta && !snapshot.hasReservationCta) {
    deductions.push(10);
    findings.push(
      makeFinding("critical", "No clear ordering or reservation call-to-action", "We didn't find obvious 'Order Online' or 'Reservations' language/links on the homepage.", {
        estimatedImpact: "Visitors may leave without converting",
        fixable: true,
        agentId: "website",
      }),
    );
  } else {
    findings.push(makeFinding("good", "Clear conversion path", "Ordering/reservation call-to-action detected on the homepage.", { agentId: "website" }));
  }

  // --- H1 usage ---
  if (snapshot.headings.h1 === 0) {
    deductions.push(4);
    findings.push(makeFinding("warning", "No H1 heading", "Search engines use your H1 to understand the page's main topic.", { fixable: true, agentId: "website" }));
  } else if (snapshot.headings.h1 > 1) {
    deductions.push(2);
    findings.push(makeFinding("info", "Multiple H1 headings", `Found ${snapshot.headings.h1} H1 tags; ideally there's exactly one.`, { agentId: "website" }));
  }

  if (pageSpeed) {
    if (pageSpeed.accessibility < 70) {
      deductions.push(4);
      findings.push(makeFinding("warning", "Accessibility issues detected", `Lighthouse accessibility score: ${pageSpeed.accessibility}/100.`, { fixable: true, agentId: "website" }));
    }
    if (pageSpeed.bestPractices < 70) {
      deductions.push(3);
      findings.push(makeFinding("warning", "Best-practices issues detected", `Lighthouse best-practices score: ${pageSpeed.bestPractices}/100.`, { agentId: "website" }));
    }
  }

  const score = scoreFromDeductions(deductions);

  return {
    agentId: "website",
    label: "Website Health",
    status: "ok",
    dataSource: "live",
    score,
    summary:
      score >= 80
        ? "Your website is in good shape with only minor improvements available."
        : score >= 50
          ? "Your website has several fixable issues holding back conversions and SEO."
          : "Your website has critical issues that are likely costing you customers.",
    findings,
    metrics: {
      loadTimeMs: snapshot.loadTimeMs,
      pageSpeedPerformance: pageSpeed?.performance ?? null,
      pageSpeedUsed: hasPageSpeedKey() && Boolean(pageSpeed),
      wordCount: snapshot.wordCount,
    },
  };
}
