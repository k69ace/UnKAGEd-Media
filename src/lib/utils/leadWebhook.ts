import type { LeadRequest } from "@/lib/types";

// Forwards captured leads to whatever automation the agency already runs —
// Zapier, Make.com, GoHighLevel, Slack, a custom endpoint — via a single
// generic webhook URL. No vendor-specific integration to maintain.

export function hasLeadWebhook(): boolean {
  return Boolean(process.env.LEAD_WEBHOOK_URL);
}

export async function sendLeadWebhook(lead: LeadRequest): Promise<boolean> {
  const url = process.env.LEAD_WEBHOOK_URL;
  if (!url) {
    console.log("Lead captured (no LEAD_WEBHOOK_URL configured):", JSON.stringify(lead));
    return false;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...lead, source: "restaurant-grader", capturedAt: new Date().toISOString() }),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch (err) {
    console.error("Lead webhook delivery failed", err);
    return false;
  }
}
