import type { AgentResult, ScanInput, ScanResult } from "@/lib/types";
import { fetchSiteSnapshot } from "@/lib/utils/siteSnapshot";
import { runWebsiteAgent } from "@/lib/agents/website";
import { runSeoAgent } from "@/lib/agents/seo";
import { runPhotoAgent } from "@/lib/agents/photos";
import { runReviewsAgent } from "@/lib/agents/reviews";
import { runGbpAgent } from "@/lib/agents/gbp";
import { runCompetitorAgent } from "@/lib/agents/competitors";
import { computeDataMode, computeOverallScore, collectTopIssues, gradeFromScore } from "@/lib/scoring";

function normalizeUrl(rawUrl?: string): string | undefined {
  if (!rawUrl) return undefined;
  const trimmed = rawUrl.trim();
  if (!trimmed) return undefined;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/**
 * Orchestrator — the "supervisor" agent. It fans the scan input out to six
 * specialized agents (running them concurrently) and aggregates their
 * results into a single scored report. The website snapshot is fetched
 * once up-front and shared with the Website/SEO/Photo agents to avoid
 * redundant network calls.
 */
export async function runScan(rawInput: ScanInput): Promise<ScanResult> {
  const input: ScanInput = { ...rawInput, url: normalizeUrl(rawInput.url) };

  const snapshot = input.url ? await fetchSiteSnapshot(input.url) : null;

  const results = await Promise.allSettled([
    runWebsiteAgent(input, snapshot),
    runSeoAgent(input, snapshot),
    runPhotoAgent(input, snapshot),
    runReviewsAgent(input),
    runGbpAgent(input),
    runCompetitorAgent(input),
  ]);

  const agents: AgentResult[] = results.map((result, index) => {
    if (result.status === "fulfilled") return result.value;

    const agentIds = ["website", "seo", "photos", "reviews", "gbp", "competitors"] as const;
    const labels = ["Website Health", "Local SEO", "Photo Quality", "Reviews & Reputation", "Google Business Profile", "Competitive Landscape"];
    return {
      agentId: agentIds[index],
      label: labels[index],
      status: "error",
      dataSource: "unavailable",
      score: 0,
      summary: "This agent failed to complete.",
      findings: [],
      error: result.reason instanceof Error ? result.reason.message : String(result.reason),
    };
  });

  const overallScore = computeOverallScore(agents);
  const competitorAgent = agents.find((a) => a.agentId === "competitors");

  return {
    scanId: crypto.randomUUID(),
    input,
    generatedAt: new Date().toISOString(),
    overallScore,
    grade: gradeFromScore(overallScore),
    agents,
    topIssues: collectTopIssues(agents),
    competitors: competitorAgent?.competitors ?? [],
    dataMode: computeDataMode(agents),
  };
}
