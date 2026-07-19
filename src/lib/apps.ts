import { site } from "@/lib/site";

export type AppStatus = "live" | "prototype";
export type AppCategory = "hospitality" | "range";
export type AppMockupVariant =
  | "estimator"
  | "beo"
  | "labor"
  | "roi"
  | "voice"
  | "gbp"
  | "roofing"
  | "hvac"
  | "generic";

export interface AppFaq {
  question: string;
  answer: string;
}

export interface AppOutcome {
  label: string;
  detail: string;
}

export interface AppDefinition {
  slug: string;
  name: string;
  tagline: string;
  status: AppStatus;
  statusNote?: string;
  category: AppCategory;
  summary: string;
  problem: {
    heading: string;
    body: string[];
  };
  whatItDoes: string[];
  outcomes: AppOutcome[];
  howItWorks: string[];
  faqs: AppFaq[];
  cta: {
    label: string;
    href: string;
  };
  mockup: AppMockupVariant;
  // Populated once The Lab (Phase 3) and Case Studies (Phase 2) ship content.
  relatedLabSlugs?: string[];
  relatedCaseStudySlugs?: string[];
}

// Only apps with a fully built page belong here — no placeholder entries.
// Hospitality apps lead; home-services apps ("range") exist to show range,
// not top-level positioning. See apps/page.tsx and page.tsx (home) for how
// category is used to keep hospitality first.
export const apps: AppDefinition[] = [
  {
    slug: "catering-estimator",
    name: "Catering Estimator",
    tagline: "Priced, margin-checked catering quotes in minutes, not a spreadsheet session.",
    status: "prototype",
    statusNote:
      "Built and used inside a live catering operation — developed against real BEOs, not a demo menu.",
    category: "hospitality",
    summary:
      "The Catering Estimator turns event details into a priced, margin-checked catering quote in minutes. Built inside a working catering operation, not a spreadsheet template.",
    problem: {
      heading: "Catering quotes are built under pressure, and margin is the first thing that slips",
      body: [
        "A catering inquiry comes in and someone has to turn guest count, menu, and service style into a number the client can say yes to — usually the same day, sometimes the same call. The tool for that job is often a spreadsheet one person built years ago, with formulas nobody else fully trusts.",
        "When the estimate is rushed, food cost and labor get estimated by feel instead of calculated. Margin holds on the events where the person building the quote happens to be careful, and it doesn't on the events where they're slammed. Over a season, that inconsistency shows up directly in catering P&L.",
      ],
    },
    whatItDoes: [
      "The Catering Estimator takes guest count, menu selections, and service style and returns a priced estimate with food cost, labor, and margin calculated the same way every time.",
      "It's built for the person taking the call, not a back-office analyst — inputs map to how a catering sales conversation actually happens.",
      "The output is a client-ready estimate, not just an internal number.",
    ],
    outcomes: [
      {
        label: "One set of pricing logic",
        detail:
          "Every estimate — regardless of who builds it — runs through the same food cost and margin rules, instead of whatever the individual salesperson's spreadsheet happens to do.",
      },
      {
        label: "Quotes turned around on the call",
        detail:
          "Built to be usable live, during the inquiry, instead of \"let me get back to you with a number.\"",
      },
      {
        label: "No single point of failure",
        detail:
          "The pricing logic isn't locked inside one person's spreadsheet that only they know how to edit or troubleshoot.",
      },
    ],
    howItWorks: [
      "Structured inputs for guest count, menu selections, service style, and event logistics.",
      "Food cost is calculated per selection against current plate costs; labor is calculated against guest count and service style.",
      "Margin targets are configurable per event type rather than hard-coded.",
      "Output renders as a client-facing estimate that can be sent directly, plus the underlying cost breakdown for internal review.",
    ],
    faqs: [
      {
        question: "Does this replace my catering or event management software?",
        answer:
          "No. It replaces the spreadsheet or back-of-napkin math that happens before an estimate goes into your event system. Most operations still log the confirmed event in their existing software once it's booked.",
      },
      {
        question: "Do I need to load my entire menu before I can use it?",
        answer:
          "You need your catering menu items and current plate costs entered once. After that, building an estimate is selecting from that menu, not re-entering pricing every time.",
      },
      {
        question: "Can I adjust margin targets for different event types?",
        answer:
          "Yes. A drop-off order and a full-service plated dinner don't carry the same labor load, so margin targets are configurable rather than a single fixed markup.",
      },
      {
        question: "Who is this built for?",
        answer:
          "Catering managers, sales staff, and owner-operators who quote events directly — anyone who currently has to do this math manually under time pressure.",
      },
    ],
    cta: {
      label: "Request a demo",
      href: site.bookingUrl,
    },
    mockup: "estimator",
    relatedCaseStudySlugs: ["catering-estimator-rollout"],
    relatedLabSlugs: ["building-the-catering-estimator"],
  },
  {
    slug: "beo-builder",
    name: "BEO Builder",
    tagline: "AI-assisted banquet event orders that kitchen and service actually read from the same page.",
    status: "prototype",
    statusNote:
      "Developed on real event flow inside a working restaurant and catering operation, replacing paper BEOs that were already in use.",
    category: "hospitality",
    summary:
      "BEO Builder replaces paper and hand-corrected banquet event orders with a structured, AI-assisted document that stays in sync across sales, kitchen, and service.",
    problem: {
      heading: "The BEO on the wall and the BEO in the kitchen's head aren't always the same document",
      body: [
        "A banquet event order carries every detail that has to go right for an event: room setup, timing, menu, allergies, headcount changes. On paper, or in a document that gets edited by hand and reprinted, those details drift. Sales updates a headcount, kitchen is still working off the version from two revisions ago, and the gap only shows up mid-service.",
        "The fix operations reach for is usually more communication — a call, a huddle, a sticky note on the printout. That works until the week gets busy, which is exactly when a BEO error costs the most.",
      ],
    },
    whatItDoes: [
      "BEO Builder turns event details into a structured, standardized banquet event order that sales, kitchen, and service all read from the same source.",
      "Updates to guest count, menu, timing, or setup are reflected everywhere the BEO is used, not just on the copy someone happened to reprint.",
      "AI assistance fills in repeated details — standard setups, standing menu notes, recurring client preferences — so building a BEO doesn't mean retyping the same information every time.",
    ],
    outcomes: [
      {
        label: "One current version",
        detail:
          "Removes the paper-trail problem where kitchen, service, and sales are working from different revisions of the same event.",
      },
      {
        label: "Less retyping, fewer transcription errors",
        detail:
          "Standard setups and recurring client details are filled in instead of hand-typed fresh on every event.",
      },
      {
        label: "Built on real BEOs",
        detail:
          "Developed against the actual banquet event order format and event flow of a working operation, not a generic template.",
      },
    ],
    howItWorks: [
      "Event details are entered once through structured fields: room, timing, headcount, menu, service notes, allergies.",
      "The system generates a formatted BEO from those fields, with a visible revision history when details change.",
      "AI assistance suggests standard setup and menu language based on the event type and prior events, which the user confirms or edits.",
      "The current version is the version — no separate copies to reconcile across departments.",
    ],
    faqs: [
      {
        question: "What is a BEO, for anyone outside catering?",
        answer:
          "A banquet event order is the master document for a catered or private event — room setup, timing, menu, staffing notes, and any special requirements. It's what kitchen and service actually work from during the event.",
      },
      {
        question: "Why does a BEO need AI at all?",
        answer:
          "It doesn't need AI to exist — operations have run on paper BEOs for decades. The AI assistance is there to reduce the retyping of repeated details (standard setups, recurring client notes) so building a BEO is faster and less error-prone, not to replace the judgment of the person writing it.",
      },
      {
        question: "Does this replace our event management or catering software?",
        answer:
          "It can run alongside it. Some operations use BEO Builder as the working document during planning and service, and log the finalized event in their existing system.",
      },
      {
        question: "Can kitchen and service staff edit the BEO directly, or only sales?",
        answer:
          "Access can be scoped by role. In practice, most operations keep event-detail edits with sales/events and give kitchen and service read access with the ability to flag corrections.",
      },
    ],
    cta: {
      label: "Request a demo",
      href: site.bookingUrl,
    },
    mockup: "beo",
    relatedLabSlugs: ["replacing-paper-beos-with-an-ai-assisted-beo-builder"],
  },
  {
    slug: "labor-efficiency-calculator",
    name: "Restaurant Labor Efficiency Calculator",
    tagline: "Turn a sales forecast and target labor percentage into an actual shift-by-shift labor plan.",
    status: "live",
    category: "hospitality",
    summary:
      "The Labor Efficiency Calculator converts a sales forecast and target labor percentage into recommended labor hours and dollars by daypart, replacing gut-feel scheduling.",
    problem: {
      heading: "Labor is the number that makes or breaks the margin, and it's usually scheduled by feel",
      body: [
        "Labor cost as a percentage of sales is one of the most watched numbers in a restaurant's P&L, and one of the least precisely managed on the floor. Schedules get built off last week's schedule, adjusted by whoever's making them, without a clear line from a sales forecast to how many labor hours that forecast can actually support.",
        "The result is either overstaffing that quietly erodes margin, or understaffing that shows up as slow service and burned-out staff — and by the time either one is visible in the P&L, the schedule that caused it already ran.",
      ],
    },
    whatItDoes: [
      "The Labor Efficiency Calculator takes a sales forecast, a target labor percentage, and your role mix and average wages, and returns recommended labor hours and dollars by daypart.",
      "It gives whoever builds the schedule a number to schedule to, before the shift runs, instead of finding out the labor percentage after the fact.",
      "It's built for the person making next week's schedule, not for a monthly financial review.",
    ],
    outcomes: [
      {
        label: "A target before the schedule is built",
        detail:
          "Labor hours are calculated from the forecast up front, instead of a schedule getting built first and the labor percentage getting checked afterward.",
      },
      {
        label: "Consistent across whoever schedules",
        detail:
          "The same forecast and target labor percentage produce the same recommended hours, regardless of which manager is building the week's schedule.",
      },
      {
        label: "Daypart-level, not just weekly",
        detail:
          "Recommendations break out by daypart, since a flat weekly labor target hides overstaffing in slow dayparts and understaffing in peak ones.",
      },
    ],
    howItWorks: [
      "Inputs: forecasted sales by daypart, target labor percentage, and average wage by role.",
      "The calculator converts the target labor percentage into a labor dollar budget per daypart, then converts that budget into recommended hours per role using the entered wage data.",
      "Outputs are presented as recommended hours and dollars per daypart, which can be compared against an existing draft schedule.",
      "Runs as a standalone web tool — no POS or scheduling software integration required to get a recommendation.",
    ],
    faqs: [
      {
        question: "What counts as labor cost in the calculation?",
        answer:
          "Hourly wages by role, weighted against your forecasted sales. It's a scheduling and forecasting tool, not a full payroll cost tool — it doesn't currently factor in payroll taxes or benefits load.",
      },
      {
        question: "Does it integrate with my POS or scheduling software?",
        answer:
          "Not directly today. It's a standalone calculator — you bring the sales forecast and wage data, and it returns the recommended labor plan, which you then apply in whatever scheduling tool you use.",
      },
      {
        question: "How do I know what target labor percentage to use?",
        answer:
          "That's a decision specific to your concept, service style, and market — this tool doesn't set the target for you. If you're not sure what target makes sense for your operation, that's a fair question to bring to a strategy session.",
      },
      {
        question: "Can I use this for a multi-unit operation?",
        answer:
          "Yes, run it per location. Labor mix and sales patterns typically differ enough by unit that a single blended calculation isn't useful for scheduling decisions.",
      },
    ],
    cta: {
      label: "Request a demo",
      href: site.bookingUrl,
    },
    mockup: "labor",
  },
  {
    slug: "marketing-roi-calculator",
    name: "Marketing ROI Calculator",
    tagline: "See which marketing channels actually pay for themselves, by channel, not by gut feel.",
    status: "prototype",
    statusNote: "Built to answer a specific question in a live operation: which marketing spend is actually working.",
    category: "hospitality",
    summary:
      "The Marketing ROI Calculator ties marketing spend by channel to attributed covers and revenue, so budget decisions are based on channel performance instead of habit.",
    problem: {
      heading: "Marketing budgets get renewed by habit, not by performance",
      body: [
        "Most restaurants spend money across several marketing channels at once — social ads, a Google Business Profile, third-party delivery promotion, maybe a local paper or radio spot out of habit. Few operators can say with confidence which of those channels is actually bringing in covers versus which one just feels like it's working because it's visible.",
        "Without a clear line from spend to result, budget tends to get renewed the way it was set last year, not reallocated toward what's producing. That's money that could be moved to a channel that's actually converting.",
      ],
    },
    whatItDoes: [
      "The Marketing ROI Calculator takes spend by channel and the covers or revenue you can attribute to each one, and returns a ranked ROI comparison across channels.",
      "It's built to use whatever attribution you already have — promo codes, booking source, a landing page, or a simple \"how did you hear about us\" tally — not a full marketing analytics platform.",
      "The output is a plain comparison: which channels are paying for themselves, and by how much.",
    ],
    outcomes: [
      {
        label: "One comparable number per channel",
        detail: "Spend and attributed return are converted into the same ROI figure across every channel, so they're actually comparable to each other.",
      },
      {
        label: "A concrete budget conversation",
        detail: "Turns \"I think the ads are working\" into a specific number you can act on when deciding where next month's marketing dollars go.",
      },
      {
        label: "No new tracking stack required",
        detail: "Works with the attribution data most independent operators already have, instead of requiring a full marketing analytics platform to get started.",
      },
    ],
    howItWorks: [
      "Inputs: spend per channel, and attributed covers or revenue per channel from whatever source you're already tracking (promo codes, booking source, staff-logged referral).",
      "Each channel's ROI is calculated as attributed return against spend for that channel.",
      "Channels are ranked side by side so underperforming and overperforming spend is visible at a glance.",
      "Runs as a standalone tool — no ad platform or CRM integration required to get a first read.",
    ],
    faqs: [
      {
        question: "What if I don't have clean attribution data?",
        answer: "Start with whatever you have — even a rough \"how did you hear about us\" tally at the register gets you a directionally useful first read. The calculator is built to work with imperfect data, not to require a full attribution stack.",
      },
      {
        question: "Does this replace Google Ads or Meta's own reporting?",
        answer: "No. Those tools report what happened inside their own platform. This calculator is for comparing across platforms and channels on one consistent basis, including channels that don't have their own dashboard.",
      },
      {
        question: "Can I use this for one-time promotions, not just ongoing channels?",
        answer: "Yes — a single promotion or event sponsorship can be run through the same spend-versus-attributed-return calculation as an ongoing channel.",
      },
      {
        question: "Who should be using this?",
        answer: "Owner-operators and marketing managers who control a marketing budget directly and want to see what's earning its spot in it.",
      },
    ],
    cta: {
      label: "Request a demo",
      href: site.bookingUrl,
    },
    mockup: "roi",
  },
  {
    slug: "ai-receptionist",
    name: "AI Receptionist / Voice AI",
    tagline: "Answers the calls that would otherwise go to voicemail during the rush.",
    status: "prototype",
    statusNote: "Built and tested against real call volume inside a working restaurant operation.",
    category: "hospitality",
    summary:
      "The AI Receptionist answers restaurant phone calls when staff can't get to them, handling reservations and basic questions and logging a summary of every call.",
    problem: {
      heading: "A restaurant that doesn't answer the phone is losing business it never sees",
      body: [
        "Restaurants run on the phone as much as the door: reservations, to-go orders, basic questions about hours or a private event. During a rush, the phone is the first thing that gets ignored — there's no one to step off the line to answer it, and a caller who hits voicemail usually doesn't call back. They call the next place.",
        "That's revenue that never shows up as a complaint or a bad review — it just quietly doesn't happen, and it's hardest to see precisely because it's missing calls, not bad ones.",
      ],
    },
    whatItDoes: [
      "The AI Receptionist answers incoming calls when your team can't, handling reservations, hours, and common questions using scripts built around how your operation actually runs.",
      "Anything it can't confidently handle gets escalated or routed to a human instead of guessed at.",
      "Every call gets logged with a summary, so nothing depends on someone remembering to write it down mid-rush.",
    ],
    outcomes: [
      {
        label: "Calls get answered instead of voicemailed",
        detail: "Calls that would otherwise hit voicemail during a rush get picked up and handled, instead of going to a caller who won't call back.",
      },
      {
        label: "Front-of-house stays on the floor",
        detail: "Staff aren't pulled off service to answer routine calls during the busiest part of the shift.",
      },
      {
        label: "A record of every call",
        detail: "Call summaries are logged automatically, instead of relying on whoever answered to relay the details correctly.",
      },
    ],
    howItWorks: [
      "Connects to your existing restaurant phone line — callers don't dial a different number.",
      "Handles calls using scripts configured around your hours, reservation process, and commonly asked questions.",
      "Escalates unclear requests, complaints, or anything outside its script to a human, rather than improvising.",
      "Logs a transcript and summary of every call for the team to review.",
    ],
    faqs: [
      {
        question: "Does this replace my host or hostess?",
        answer: "No. It's built to catch the calls your team can't get to, particularly during a rush — not to replace the judgment and hospitality a host brings to a call it can handle.",
      },
      {
        question: "What happens on a call it can't handle?",
        answer: "It escalates: routes to a human if someone's available, or takes a message and flags it for a callback rather than guessing at an answer.",
      },
      {
        question: "Do I need a new phone number?",
        answer: "No, it connects to your existing line. Callers dial the number they already have.",
      },
      {
        question: "Can it take reservations directly?",
        answer: "Yes, for straightforward reservation requests within your configured availability. More complex requests — large parties, private events — get routed to a human.",
      },
    ],
    cta: {
      label: "Request a demo",
      href: site.bookingUrl,
    },
    mockup: "voice",
    relatedLabSlugs: ["what-a-voice-ai-receptionist-actually-handles"],
  },
  {
    slug: "google-business-profile-analyzer",
    name: "Google Business Profile Analyzer",
    tagline: "A prioritized punch list for the Google listing most restaurants never audit.",
    status: "prototype",
    category: "hospitality",
    summary:
      "The Google Business Profile Analyzer audits a restaurant's GBP listing against the factors that affect local search visibility and conversion, and returns a prioritized list of fixes.",
    problem: {
      heading: "The Google listing is one of the biggest drivers of walk-ins, and almost nobody audits it",
      body: [
        "For most restaurants, a Google Business Profile is the first thing a nearby customer sees — before the website, before social. Stale hours, thin categories, missing photos, and unanswered reviews all quietly hurt local visibility and conversion, but auditing all of that by hand is tedious enough that most operators never do it beyond the initial setup.",
        "\"We should work on our Google listing\" is a common intention that rarely turns into a specific to-do list, because nobody's translated it into what's actually wrong with the listing.",
      ],
    },
    whatItDoes: [
      "The Google Business Profile Analyzer checks a listing against the factors that actually affect local search visibility and conversion — completeness, categories, photo freshness, review response rate, and posting activity.",
      "It returns a prioritized list of specific fixes, ranked by what's likely to move the needle first.",
      "It's built to turn a vague intention into a concrete punch list, not to replace ongoing profile management.",
    ],
    outcomes: [
      {
        label: "A specific punch list, not a vague intention",
        detail: "\"We should work on our Google listing\" becomes a ranked list of exactly what's incomplete or out of date.",
      },
      {
        label: "Surfaces what's easy to fix and easy to ignore",
        detail: "Stale hours, missing attributes, and unanswered reviews are the kind of gaps that sit unnoticed for months without a prompt to go check.",
      },
      {
        label: "One place to see the whole picture",
        detail: "Replaces manually checking categories, photos, hours, and reviews separately with a single scored view.",
      },
    ],
    howItWorks: [
      "Pulls the public data for a given Google Business Profile listing.",
      "Checks it against known local-search visibility and conversion factors: profile completeness, category accuracy, photo recency, review response rate, and posting activity.",
      "Scores the listing and generates a prioritized list of recommended fixes.",
      "Runs as a one-time or periodic audit — it doesn't require handing over your Google account credentials to generate a report.",
    ],
    faqs: [
      {
        question: "Does this fix my profile automatically?",
        answer: "No, it audits and prioritizes. The fixes — updating hours, adding photos, responding to reviews — are still applied by you or your team directly in your Google Business Profile.",
      },
      {
        question: "Do I need to give it access to my Google account?",
        answer: "No. It works from your listing's public data, so there's no account access required to generate a report.",
      },
      {
        question: "How often should I run it?",
        answer: "Quarterly is a reasonable cadence for most independent operators, or after any significant change — new hours, a menu change, a location update.",
      },
      {
        question: "Does it work for a multi-location operation?",
        answer: "Yes, each location's listing is analyzed and scored separately, since visibility factors and review patterns typically differ by location.",
      },
    ],
    cta: {
      label: "Request a demo",
      href: site.bookingUrl,
    },
    mockup: "gbp",
  },
  {
    slug: "roof-replacement-calculator",
    name: "Roof Replacement Calculator",
    tagline: "An instant ballpark estimate that captures a roofing lead before they leave the site.",
    status: "prototype",
    category: "range",
    summary:
      "The Roof Replacement Calculator gives homeowners an instant ballpark estimate range for a roof replacement based on size, pitch, and material — built to capture a lead before they navigate away.",
    problem: {
      heading: "A homeowner who can't get a ballpark number leaves the site without becoming a lead",
      body: [
        "Roof replacement is a high-consideration purchase — homeowners want some sense of cost before they'll commit to scheduling an in-home estimate. If the only option on a roofing company's site is \"contact us for a quote,\" a lot of that traffic leaves without converting, because the friction of booking an appointment for a completely unknown number is too high.",
        "This is the same underlying problem as a catering estimate: someone needs a credible number fast, before they're willing to take the next step.",
      ],
    },
    whatItDoes: [
      "The Roof Replacement Calculator takes roof size, pitch, and material choice and returns an instant ballpark estimate range.",
      "It's designed to sit on a roofing company's website as a lead-capture step, not as a final quote.",
      "The homeowner gets a credible number in minutes; the roofing company gets a warmer lead for the in-home estimate.",
    ],
    outcomes: [
      {
        label: "Captures the lead before they leave",
        detail: "Gives site visitors a reason to stay and provide contact information instead of bouncing at a \"call for pricing\" wall.",
      },
      {
        label: "A warmer handoff to the sales estimate",
        detail: "Leads arrive at the in-home estimate already knowing a ballpark range, which shortens the conversation.",
      },
      {
        label: "Built on the same logic as a real estimate",
        detail: "Material and labor cost ranges are calculated from actual inputs, not a flat average that ignores roof size or material.",
      },
    ],
    howItWorks: [
      "Inputs: approximate square footage (manual entry or address-based estimate), roof pitch, and material selection.",
      "Material and labor cost ranges are calculated against those inputs to produce a ballpark estimate range.",
      "The estimate is presented alongside a lead-capture step for scheduling the in-home inspection.",
      "Embeds directly on an existing company website.",
    ],
    faqs: [
      {
        question: "Is this a binding quote?",
        answer: "No — it's a ballpark range meant to qualify interest and capture a lead. A binding quote still requires an in-home inspection.",
      },
      {
        question: "How accurate is the square footage estimate?",
        answer: "Reasonably accurate for a ballpark, especially with manual entry from an existing measurement. It's precise enough to set expectations, not precise enough to skip the in-home inspection.",
      },
      {
        question: "Does this replace the in-home inspection?",
        answer: "No. It's the step before it — getting a homeowner comfortable enough with a rough number to book the inspection that produces the real quote.",
      },
      {
        question: "Can this be embedded on our existing website?",
        answer: "Yes, that's the intended use — a lead-capture tool embedded on a roofing company's site rather than a standalone destination.",
      },
    ],
    cta: {
      label: "Request a demo",
      href: site.bookingUrl,
    },
    mockup: "roofing",
  },
  {
    slug: "hvac-prospecting-tool",
    name: "HVAC Prospecting Tool",
    tagline: "Prioritizes which homes are actually worth an HVAC company's outbound effort.",
    status: "prototype",
    category: "range",
    summary:
      "The HVAC Prospecting Tool scores and ranks prospects using signals that correlate with likely HVAC replacement need, so outbound effort goes to the leads worth calling first.",
    problem: {
      heading: "Outbound effort is wasted when every prospect gets treated the same",
      body: [
        "HVAC companies generating their own leads — through ads, door-knocking, or outbound calling — usually work a list with no real prioritization: every address gets the same effort, regardless of how likely that home actually is to need a system replacement soon. That flattens the return on the time spent prospecting.",
        "Signals like system age, home age, and service history are usually available somewhere, but rarely pulled together into something a sales or outbound team can actually use to decide who to call first.",
      ],
    },
    whatItDoes: [
      "The HVAC Prospecting Tool scores prospects against signals that correlate with likely replacement need — home age, known system age, and service history where available.",
      "It returns a ranked list, so outbound calling or door-knocking effort goes to the highest-likelihood prospects first.",
      "It's built to sit in front of whatever outbound process a company already runs, not to replace it.",
    ],
    outcomes: [
      {
        label: "Outbound effort goes to the best prospects first",
        detail: "A ranked list replaces working a flat address list in whatever order it happens to be in.",
      },
      {
        label: "Uses signals already available",
        detail: "Pulls together home age, system age, and service history instead of requiring a new data source to get started.",
      },
      {
        label: "Fits an existing outbound process",
        detail: "Feeds a prioritized list into whatever calling, door-knocking, or CRM workflow a company already uses.",
      },
    ],
    howItWorks: [
      "Inputs: a service area or list of addresses, plus available signals such as home age, known system age, and service history.",
      "Prospects are scored against those signals for likely replacement need.",
      "Output is a ranked list ordered by score, for outbound calling or door-knocking prioritization.",
      "Feeds into an existing CRM or outbound workflow rather than replacing it.",
    ],
    faqs: [
      {
        question: "Where does the underlying data come from?",
        answer: "A combination of public property data and whatever service history a company already has on file. It works with partial data — more signal improves ranking, but a full data set isn't required to get a useful first pass.",
      },
      {
        question: "Does this replace our CRM?",
        answer: "No. It's a prioritization layer that feeds a ranked list into whatever CRM or outbound process is already in use.",
      },
      {
        question: "Can it be used for maintenance outreach, not just replacement leads?",
        answer: "Yes — the same scoring approach can be tuned toward maintenance-due signals rather than replacement-likelihood signals, depending on the campaign.",
      },
      {
        question: "Does this only work for HVAC?",
        answer: "The scoring logic is built around HVAC-specific signals like system age, but the same approach applies to other home-services trades with similar replacement-cycle dynamics.",
      },
    ],
    cta: {
      label: "Request a demo",
      href: site.bookingUrl,
    },
    mockup: "hvac",
  },
];

export function getAppBySlug(slug: string): AppDefinition | undefined {
  return apps.find((app) => app.slug === slug);
}
