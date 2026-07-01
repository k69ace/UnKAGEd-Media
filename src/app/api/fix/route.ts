import { NextResponse } from "next/server";
import { runFixAgent } from "@/lib/agents/fix";
import type { AgentId, Finding, FixRequest, ScanInput, Severity } from "@/lib/types";

const VALID_AGENT_IDS: AgentId[] = ["website", "seo", "photos", "reviews", "gbp", "competitors"];
const VALID_SEVERITIES: Severity[] = ["critical", "warning", "good", "info"];

function parseFinding(input: unknown, agentId: AgentId): Finding | null {
  if (typeof input !== "object" || input === null) return null;
  const { id, severity, title, detail, estimatedImpact, fixable } = input as Record<string, unknown>;

  if (typeof id !== "string" || typeof title !== "string" || typeof detail !== "string") return null;
  if (typeof severity !== "string" || !VALID_SEVERITIES.includes(severity as Severity)) return null;
  if (title.length > 300 || detail.length > 2000) return null;

  return {
    id,
    agentId,
    severity: severity as Severity,
    title,
    detail,
    estimatedImpact: typeof estimatedImpact === "string" ? estimatedImpact : undefined,
    fixable: typeof fixable === "boolean" ? fixable : undefined,
  };
}

function parseScanInput(input: unknown): ScanInput | null {
  if (typeof input !== "object" || input === null) return null;
  const { restaurantName, url, location } = input as Record<string, unknown>;
  if (typeof restaurantName !== "string" || restaurantName.trim().length === 0 || restaurantName.length > 120) return null;

  return {
    restaurantName: restaurantName.trim(),
    url: typeof url === "string" && url.length <= 500 ? url : undefined,
    location: typeof location === "string" && location.length <= 120 ? location : undefined,
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { agentId, finding, scanInput } = body as Record<string, unknown>;

  if (typeof agentId !== "string" || !VALID_AGENT_IDS.includes(agentId as AgentId)) {
    return NextResponse.json({ error: "Invalid or missing agentId." }, { status: 400 });
  }

  const parsedFinding = parseFinding(finding, agentId as AgentId);
  if (!parsedFinding) {
    return NextResponse.json({ error: "Invalid or missing finding." }, { status: 400 });
  }

  const parsedScanInput = parseScanInput(scanInput);
  if (!parsedScanInput) {
    return NextResponse.json({ error: "Invalid or missing scanInput." }, { status: 400 });
  }

  const fixRequest: FixRequest = {
    agentId: agentId as AgentId,
    finding: parsedFinding,
    scanInput: parsedScanInput,
  };

  try {
    const result = await runFixAgent(fixRequest);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Fix generation failed", err);
    return NextResponse.json({ error: "Fix generation failed. Please try again." }, { status: 500 });
  }
}
