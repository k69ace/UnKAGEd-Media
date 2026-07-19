import { site } from "@/lib/site";

export type AppStatus = "live" | "prototype";
export type AppCategory = "hospitality" | "range";
export type AppMockupVariant = "estimator" | "beo" | "labor" | "generic";

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

// Only apps with a fully built page belong here. Phase 2 adds the remaining
// apps (AI Receptionist, Google Business Profile Analyzer, Roof Replacement
// Calculator, HVAC Prospecting Tool, Marketing ROI Calculator) once their
// pages are built — no placeholder entries.
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
];

export function getAppBySlug(slug: string): AppDefinition | undefined {
  return apps.find((app) => app.slug === slug);
}
