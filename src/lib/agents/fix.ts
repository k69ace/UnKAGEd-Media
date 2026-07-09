import type { FixRequest, FixResult } from "@/lib/types";
import { generateJSON, hasAnthropicKey } from "@/lib/utils/anthropic";

type FixShape = { before: string; after: string; explanation: string };

const TEMPLATES: { match: RegExp; build: (req: FixRequest) => FixShape }[] = [
  {
    match: /not optimized for mobile/i,
    build: () => ({
      before: "<!-- no viewport tag -->",
      after: '<meta name="viewport" content="width=device-width, initial-scale=1" />',
      explanation: "Add this tag inside <head> so mobile browsers render your layout at the correct scale instead of a zoomed-out desktop view.",
    }),
  },
  {
    match: /missing page title|title isn.?t optimized/i,
    build: (req) => ({
      before: "Untitled Page",
      after: `${req.scanInput.restaurantName} | ${req.scanInput.location ? `Restaurant in ${req.scanInput.location}` : "Restaurant & Online Ordering"}`,
      explanation: "A clear, keyword-rich title (under 60 characters) improves click-through from search results and reinforces your brand.",
    }),
  },
  {
    match: /missing meta description/i,
    build: (req) => ({
      before: "(none)",
      after: `Enjoy fresh, made-to-order meals at ${req.scanInput.restaurantName}${req.scanInput.location ? ` in ${req.scanInput.location}` : ""}. Order online for pickup or delivery, or book a table today.`,
      explanation: "A compelling 120-158 character meta description acts as ad copy in Google search results.",
    }),
  },
  {
    match: /no restaurant structured data/i,
    build: (req) => ({
      before: "(none)",
      after: JSON.stringify(
        {
          "@context": "https://schema.org",
          "@type": "Restaurant",
          name: req.scanInput.restaurantName,
          address: req.scanInput.location ?? "",
        },
        null,
        2,
      ),
      explanation: "Adding Restaurant schema markup helps Google display rich results like hours, menu links, and ratings directly in search.",
    }),
  },
  {
    match: /no clear ordering or reservation/i,
    build: () => ({
      before: "(no call-to-action)",
      after: "Order Online →",
      explanation: "A prominent, high-contrast 'Order Online' or 'Reserve a Table' button above the fold turns visitors into customers.",
    }),
  },
  {
    match: /no h1 heading/i,
    build: (req) => ({
      before: "(no H1 tag)",
      after: `<h1>${req.scanInput.restaurantName}${req.scanInput.location ? ` — ${req.scanInput.location}` : ""}</h1>`,
      explanation: "One clear H1 tells both visitors and search engines what the page is about.",
    }),
  },
  {
    match: /restaurant name not found|location not mentioned|thin content/i,
    build: (req) => ({
      before: "(generic or missing homepage copy)",
      after: `Welcome to ${req.scanInput.restaurantName}${req.scanInput.location ? `, proudly serving ${req.scanInput.location}` : ""}. From scratch-made dishes to a warm, welcoming atmosphere, we're your neighborhood spot for a great meal any day of the week.`,
      explanation: "Homepage copy that names your restaurant and location supports both local SEO and first impressions.",
    }),
  },
  {
    match: /photos missing alt text/i,
    build: (req) => ({
      before: 'alt=""',
      after: `alt="${req.scanInput.restaurantName} signature dish plated on a wooden table"`,
      explanation: "Descriptive alt text (dish name + setting) improves accessibility and gives Google Images another way to surface your photos.",
    }),
  },
  {
    match: /not enough reviews|reviews may be getting stale/i,
    build: (req) => ({
      before: "(no review request process)",
      after: `Hi {{customer_name}}, thanks for dining with us at ${req.scanInput.restaurantName}! If you enjoyed your visit, a quick review would mean the world to us: {{review_link}}`,
      explanation: "Sending this via SMS/email receipt after each visit is one of the highest-ROI ways to grow review volume.",
    }),
  },
  {
    match: /recurring complaints/i,
    build: () => ({
      before: "(no public response)",
      after: "Thank you for the honest feedback — we're sorry we missed the mark on [specific issue]. We've shared this with the team and would love the chance to make it right on your next visit.",
      explanation: "Responding to negative reviews publicly (without being defensive) shows future customers you take feedback seriously.",
    }),
  },
  {
    match: /no website linked/i,
    build: (req) => ({
      before: "(no website field)",
      after: req.scanInput.url ?? "https://your-restaurant-site.com",
      explanation: "Add your website URL in Google Business Profile → Info so searchers can reach your ordering page in one tap.",
    }),
  },
  {
    match: /business hours missing/i,
    build: () => ({
      before: "(hours not set)",
      after: "Mon-Sun: 11:00 AM - 9:00 PM (edit to match your actual hours, including holidays)",
      explanation: "Set accurate hours in Google Business Profile → Info; this is one of the top factors in local ranking and customer trust.",
    }),
  },
  {
    match: /generic business category/i,
    build: () => ({
      before: "Restaurant",
      after: "Restaurant + a specific secondary category (e.g. 'Italian restaurant', 'Sushi restaurant', 'Vegan restaurant')",
      explanation: "Specific categories help you rank for cuisine-specific searches, not just generic 'restaurant near me'.",
    }),
  },
];

function templateFix(req: FixRequest): FixShape {
  const matched = TEMPLATES.find((t) => t.match.test(req.finding.title));
  if (matched) return matched.build(req);

  return {
    before: req.finding.detail,
    after: `Recommended fix: ${req.finding.title}. Consider consulting current best practices for restaurant websites/local SEO to address this.`,
    explanation: "General recommendation based on the flagged issue.",
  };
}

async function aiFix(req: FixRequest): Promise<FixShape | null> {
  const prompt = `You are an expert restaurant marketing consultant. A diagnostic tool flagged this issue for a restaurant:

Restaurant: ${req.scanInput.restaurantName}${req.scanInput.location ? ` (${req.scanInput.location})` : ""}
Category: ${req.agentId}
Issue: ${req.finding.title}
Detail: ${req.finding.detail}

Generate a concrete, ready-to-use fix. Return strict JSON with keys:
"before" (a short representation of the current problematic state, or "(none)"/"(missing)" if nothing exists),
"after" (the concrete replacement copy, code snippet, or template the owner can use immediately),
"explanation" (1-2 sentences on why this fix helps, written for a busy restaurant owner, not a marketer).

Keep "after" realistic and specific to this restaurant. Do not include markdown formatting.`;

  return generateJSON<FixShape>(prompt, { maxTokens: 500 });
}

/**
 * Fix Agent — generates a concrete before/after remediation for a single
 * flagged finding. Uses Claude when ANTHROPIC_API_KEY is configured for
 * restaurant-specific copy; otherwise falls back to a curated template
 * library keyed off the finding type.
 */
export async function runFixAgent(req: FixRequest): Promise<FixResult> {
  const ai = hasAnthropicKey() ? await aiFix(req) : null;
  const fix = ai ?? templateFix(req);

  return {
    findingId: req.finding.id,
    title: req.finding.title,
    before: fix.before,
    after: fix.after,
    explanation: fix.explanation,
    generatedBy: ai ? "ai" : "template",
  };
}
