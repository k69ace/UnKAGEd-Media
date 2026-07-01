import type { AgentId, Finding, Severity } from "@/lib/types";

let idCounter = 0;

export function makeFinding(
  severity: Severity,
  title: string,
  detail: string,
  opts: { agentId: AgentId; estimatedImpact?: string; fixable?: boolean },
): Finding {
  idCounter += 1;
  return {
    id: `${opts.agentId}-${idCounter}-${Date.now().toString(36)}`,
    agentId: opts.agentId,
    severity,
    title,
    detail,
    estimatedImpact: opts.estimatedImpact,
    fixable: opts.fixable ?? false,
  };
}

export function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

/** Combines per-check penalty deductions into a 0-100 score. */
export function scoreFromDeductions(deductions: number[]): number {
  const total = deductions.reduce((sum, d) => sum + d, 0);
  return clamp(100 - total);
}
