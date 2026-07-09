import type { AgentResult, Finding, ScanResult } from "@/lib/types";

const SEVERITY_WEIGHT: Record<Finding["severity"], number> = {
  critical: 3,
  warning: 2,
  info: 1,
  good: 0,
};

const AGENT_WEIGHTS: Record<AgentResult["agentId"], number> = {
  website: 0.25,
  seo: 0.15,
  photos: 0.15,
  reviews: 0.2,
  gbp: 0.15,
  competitors: 0.1,
};

export function computeOverallScore(agents: AgentResult[]): number {
  const scored = agents.filter((a) => a.status === "ok");
  if (scored.length === 0) return 0;

  const totalWeight = scored.reduce((sum, a) => sum + AGENT_WEIGHTS[a.agentId], 0);
  if (totalWeight === 0) return 0;

  const weightedSum = scored.reduce((sum, a) => sum + a.score * AGENT_WEIGHTS[a.agentId], 0);
  return Math.round(weightedSum / totalWeight);
}

export function gradeFromScore(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 65) return "C";
  if (score >= 50) return "D";
  return "F";
}

export function collectTopIssues(agents: AgentResult[], limit = 6): Finding[] {
  const all = agents.flatMap((a) => a.findings.filter((f) => f.severity === "critical" || f.severity === "warning"));
  return all
    .sort((a, b) => SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity])
    .slice(0, limit);
}

export function computeDataMode(agents: AgentResult[]): ScanResult["dataMode"] {
  const relevant = agents.filter((a) => a.status === "ok");
  if (relevant.length === 0) return "demo";
  const liveCount = relevant.filter((a) => a.dataSource === "live").length;
  if (liveCount === relevant.length) return "live";
  if (liveCount === 0) return "demo";
  return "mixed";
}
