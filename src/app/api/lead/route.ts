import { NextResponse } from "next/server";
import { sendLeadWebhook } from "@/lib/utils/leadWebhook";
import type { LeadRequest, ScanInput } from "@/lib/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_SHORT = 120;
const MAX_PHONE = 30;

function parseScanInput(input: unknown): ScanInput | null {
  if (typeof input !== "object" || input === null) return null;
  const { restaurantName, url, location } = input as Record<string, unknown>;
  if (typeof restaurantName !== "string" || restaurantName.trim().length === 0 || restaurantName.length > MAX_SHORT) {
    return null;
  }
  return {
    restaurantName: restaurantName.trim(),
    url: typeof url === "string" && url.length <= 500 ? url : undefined,
    location: typeof location === "string" && location.length <= MAX_SHORT ? location : undefined,
  };
}

function parseBody(body: unknown): LeadRequest | { error: string } {
  if (typeof body !== "object" || body === null) return { error: "Invalid request body." };
  const { scanId, scanInput, overallScore, topIssueTitle, name, email, phone } = body as Record<string, unknown>;

  if (typeof scanId !== "string" || scanId.length > MAX_SHORT) return { error: "Invalid scanId." };
  if (typeof overallScore !== "number" || Number.isNaN(overallScore)) return { error: "Invalid overallScore." };

  const parsedScanInput = parseScanInput(scanInput);
  if (!parsedScanInput) return { error: "Invalid or missing scanInput." };

  if (typeof email !== "string" || !EMAIL_RE.test(email) || email.length > MAX_SHORT) {
    return { error: "A valid email is required." };
  }
  if (name !== undefined && (typeof name !== "string" || name.length > MAX_SHORT)) {
    return { error: "Invalid name." };
  }
  if (phone !== undefined && (typeof phone !== "string" || phone.length > MAX_PHONE)) {
    return { error: "Invalid phone number." };
  }
  if (topIssueTitle !== undefined && (typeof topIssueTitle !== "string" || topIssueTitle.length > 300)) {
    return { error: "Invalid topIssueTitle." };
  }

  return {
    scanId,
    scanInput: parsedScanInput,
    overallScore,
    topIssueTitle: typeof topIssueTitle === "string" ? topIssueTitle : undefined,
    name: typeof name === "string" ? name.trim() : undefined,
    email: email.trim(),
    phone: typeof phone === "string" ? phone.trim() : undefined,
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = parseBody(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  await sendLeadWebhook(parsed);
  // Always report success to the visitor once the lead is validated and logged —
  // webhook delivery issues are an ops concern, not something to surface to them.
  return NextResponse.json({ received: true });
}
