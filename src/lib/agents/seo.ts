import type { AgentResult, ScanInput } from "@/lib/types";
import type { SiteSnapshot } from "@/lib/utils/siteSnapshot";
import { makeFinding, scoreFromDeductions } from "./helpers";

/**
 * Local SEO Agent — checks whether the site's content actually targets the
 * restaurant's name, location, and conversion keywords, plus basic
 * crawlability signals (robots.txt / sitemap.xml).
 */
export async function runSeoAgent(input: ScanInput, snapshot: SiteSnapshot | null): Promise<AgentResult> {
  if (!input.url || !snapshot) {
    return {
      agentId: "seo",
      label: "Local SEO",
      status: "skipped",
      dataSource: "unavailable",
      score: 0,
      summary: "No website was available to analyze for local SEO signals.",
      findings: [],
    };
  }

  const findings = [];
  const deductions: number[] = [];
  const combinedText = `${snapshot.title} ${snapshot.metaDescription} ${snapshot.bodyText}`.toLowerCase();

  const nameTokens = input.restaurantName
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2);
  const nameMentioned = nameTokens.length === 0 || nameTokens.some((t) => combinedText.includes(t));

  if (!nameMentioned) {
    deductions.push(10);
    findings.push(
      makeFinding("warning", "Restaurant name not found on homepage", "Your restaurant's name should appear clearly in the title, headings, and body copy for brand SEO.", {
        fixable: true,
        agentId: "seo",
      }),
    );
  } else {
    findings.push(makeFinding("good", "Brand name present", "Your restaurant name appears in the page content.", { agentId: "seo" }));
  }

  if (input.location) {
    const locationTokens = input.location
      .toLowerCase()
      .split(/[\s,]+/)
      .filter((t) => t.length > 2);
    const locationMentioned = locationTokens.some((t) => combinedText.includes(t));
    if (!locationMentioned) {
      deductions.push(12);
      findings.push(
        makeFinding("critical", "Location not mentioned on the site", `We couldn't find "${input.location}" anywhere in your page text. Local SEO relies heavily on city/neighborhood keywords.`, {
          estimatedImpact: "Missed ranking opportunity for 'near me' and local searches",
          fixable: true,
          agentId: "seo",
        }),
      );
    } else {
      findings.push(makeFinding("good", "Location keywords present", `"${input.location}" appears on the page, supporting local search relevance.`, { agentId: "seo" }));
    }
  } else {
    findings.push(
      makeFinding("info", "No location provided for a deeper local-SEO check", "Add a city/zip to your scan for location-keyword analysis.", { agentId: "seo" }),
    );
  }

  if (snapshot.wordCount < 150) {
    deductions.push(10);
    findings.push(
      makeFinding("warning", "Thin content", `The homepage has only ~${snapshot.wordCount} words. Search engines favor pages with substantive, unique content.`, {
        fixable: true,
        agentId: "seo",
      }),
    );
  }

  if (snapshot.phoneMatches.length === 0) {
    deductions.push(6);
    findings.push(
      makeFinding("warning", "No phone number found", "A visible phone number builds trust and supports Name-Address-Phone (NAP) consistency with your Google Business Profile.", {
        fixable: true,
        agentId: "seo",
      }),
    );
  }

  const menuKeywords = ["menu", "hours", "directions", "reviews"];
  const missingKeywords = menuKeywords.filter((kw) => !combinedText.includes(kw));
  if (missingKeywords.length > 0) {
    deductions.push(missingKeywords.length * 2);
    findings.push(
      makeFinding("info", "Missing common visitor-intent content", `No mention of: ${missingKeywords.join(", ")}. These are common things customers search/scan for.`, {
        fixable: true,
        agentId: "seo",
      }),
    );
  }

  // Crawlability: robots.txt + sitemap.xml
  try {
    const origin = new URL(snapshot.finalUrl).origin;
    const [robotsRes, sitemapRes] = await Promise.all([
      fetch(`${origin}/robots.txt`, { signal: AbortSignal.timeout(5000) }).catch(() => null),
      fetch(`${origin}/sitemap.xml`, { method: "HEAD", signal: AbortSignal.timeout(5000) }).catch(() => null),
    ]);

    if (!sitemapRes || !sitemapRes.ok) {
      deductions.push(5);
      findings.push(
        makeFinding("info", "No sitemap.xml found", "A sitemap helps search engines discover and index all of your pages.", { fixable: true, agentId: "seo" }),
      );
    }
    if (!robotsRes || !robotsRes.ok) {
      findings.push(makeFinding("info", "No robots.txt found", "Not required, but a robots.txt file gives you control over crawler behavior.", { agentId: "seo" }));
    }
  } catch {
    // origin parsing failed, skip crawlability checks
  }

  const score = scoreFromDeductions(deductions);

  return {
    agentId: "seo",
    label: "Local SEO",
    status: "ok",
    dataSource: "live",
    score,
    summary:
      score >= 80
        ? "Strong local SEO signals across your site."
        : score >= 50
          ? "Your site is missing several local-SEO fundamentals."
          : "Your site is largely invisible to local search — competitors are likely outranking you.",
    findings,
  };
}
