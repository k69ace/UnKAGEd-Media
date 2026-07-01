import { NextResponse } from "next/server";
import { runScan } from "@/lib/orchestrator";
import type { ScanInput } from "@/lib/types";

const MAX_NAME_LENGTH = 120;
const MAX_URL_LENGTH = 500;
const MAX_LOCATION_LENGTH = 120;

function parseInput(body: unknown): ScanInput | { error: string } {
  if (typeof body !== "object" || body === null) return { error: "Invalid request body." };
  const { restaurantName, url, location } = body as Record<string, unknown>;

  if (typeof restaurantName !== "string" || restaurantName.trim().length === 0) {
    return { error: "restaurantName is required." };
  }
  if (restaurantName.length > MAX_NAME_LENGTH) {
    return { error: `restaurantName must be ${MAX_NAME_LENGTH} characters or fewer.` };
  }
  if (url !== undefined && (typeof url !== "string" || url.length > MAX_URL_LENGTH)) {
    return { error: `url must be a string of ${MAX_URL_LENGTH} characters or fewer.` };
  }
  if (location !== undefined && (typeof location !== "string" || location.length > MAX_LOCATION_LENGTH)) {
    return { error: `location must be a string of ${MAX_LOCATION_LENGTH} characters or fewer.` };
  }

  return {
    restaurantName: restaurantName.trim(),
    url: typeof url === "string" && url.trim() ? url.trim() : undefined,
    location: typeof location === "string" && location.trim() ? location.trim() : undefined,
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = parseInput(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const result = await runScan(parsed);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Scan failed", err);
    return NextResponse.json({ error: "The scan failed unexpectedly. Please try again." }, { status: 500 });
  }
}
