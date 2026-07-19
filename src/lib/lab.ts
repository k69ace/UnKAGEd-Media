export interface LabEntry {
  slug: string;
  title: string;
  dek: string;
  publishedAt: string;
  relatedAppSlugs: string[];
  relatedCaseStudySlugs?: string[];
  whatWasBuilt: string[];
  why: string[];
  how: string[];
  whatBroke: string[];
  costInHours: string;
  whatItReturned: string;
}

// The Lab is a build log, not a blog — every entry documents real work.
// Cost and return are reported directionally and qualitatively rather than
// with invented hour counts or dollar figures, until real numbers are
// confirmed and can replace them.
export const labEntries: LabEntry[] = [
  {
    slug: "building-the-catering-estimator",
    title: "Building a Catering Estimator inside a working catering operation",
    dek: "The Catering Estimator exists to solve one problem: turning a catering inquiry into a priced, margin-checked quote without pulling up a spreadsheet only one person fully understands. Here's what it took to build it against a real catering operation, what broke along the way, and what it replaced.",
    publishedAt: "2026-05-04",
    relatedAppSlugs: ["catering-estimator"],
    relatedCaseStudySlugs: ["catering-estimator-rollout"],
    whatWasBuilt: [
      "A web tool that takes guest count, menu selections, and service style and returns a priced catering estimate — food cost, labor, and margin calculated the same way every time, output as something that can be sent to a client directly.",
    ],
    why: [
      "The operation already had a way to price catering: a spreadsheet, built up over years, that worked as long as the right person had time to sit down with it. During a rush, that assumption broke — quotes got rushed, margin got estimated by feel, and there was no way to check a fast quote against a consistent standard.",
      "The goal wasn't to build catering software in the abstract. It was to fix that specific failure mode: pricing logic that depended entirely on one person's availability and care.",
    ],
    how: [
      "Started by mapping what the existing spreadsheet actually did — not the version anyone could explain from memory, but the real formulas, including the undocumented adjustments made for specific event types over the years.",
      "Built a first version scoped to the common case: a standard plated or buffet event with a typical guest count. Ran it side by side with the spreadsheet on real incoming quotes before trusting either the math or the workflow.",
      "Expanded from there into the cases that weren't common but still happened often enough to matter — hybrid service styles, custom menu combinations, last-minute bookings — since a pricing tool that only works for the easy cases doesn't actually replace the spreadsheet.",
    ],
    whatBroke: [
      "The first version assumed every event had one service style. It didn't survive contact with the first client who wanted a staffed bar alongside a drop-off buffet — that required rethinking how labor cost got calculated, not just adding a field.",
      "Custom menu combinations broke the pricing logic more than once early on, because the spreadsheet's undocumented adjustments for those cases hadn't been fully captured in the first mapping pass.",
      "A margin target that worked well for full-service plated dinners didn't hold up for drop-off orders — the labor assumptions baked into one didn't transfer to the other, which meant margin targets needed to be configurable per event type rather than a single number.",
    ],
    costInHours:
      "This wasn't a weekend build. It came together in evenings and slower shifts over several weeks, and most of that time went into the edge cases, not the core pricing math — modeling a standard plated dinner took a fraction of the time it took to correctly handle a hybrid service style or a custom menu request.",
    whatItReturned:
      "The direct return is covered in detail in the related case study: one consistent pricing standard instead of one person's spreadsheet, and quotes that can go out during the same call they came in on. The fuller numbers on margin impact are still being tracked across a full event season.",
  },
  {
    slug: "replacing-paper-beos-with-an-ai-assisted-beo-builder",
    title: "Replacing paper BEOs with an AI-assisted BEO Builder",
    dek: "A banquet event order only works if kitchen, service, and sales are reading the same version of it. Paper BEOs and hand-corrected printouts make that hard to guarantee. Here's what it took to build a structured, AI-assisted replacement, and where it fell short at first.",
    publishedAt: "2026-06-01",
    relatedAppSlugs: ["beo-builder"],
    whatWasBuilt: [
      "A structured banquet event order tool: event details — room, timing, headcount, menu, service notes, allergies — go in once, and the system generates a formatted BEO with a visible revision history, plus AI assistance that fills in standard setups and recurring client details instead of requiring them to be retyped every time.",
    ],
    why: [
      "The operation was already running on paper BEOs, corrected by hand and reprinted when details changed. That works until the week gets busy — sales updates a headcount, kitchen is still working off a version from two revisions ago, and the gap surfaces mid-service, which is the worst possible time to discover it.",
      "The fix wasn't to add more communication on top of paper. It was to make there be exactly one current version that everyone reads from.",
    ],
    how: [
      "Started from the operation's actual BEO format — the fields that were already in use — rather than a generic banquet event order template, so the switch didn't require relearning what a BEO looks like.",
      "Built the structured version first, without AI assistance, to get the core problem solved: one document, one current version, visible revision history. That alone was worth shipping on its own.",
      "Added AI-assisted fill for standard setups and recurring client notes only after the structured version was already working and in use — as an efficiency layer on top of a solved problem, not the foundation of it.",
    ],
    whatBroke: [
      "Early revisions didn't have clear version numbers, which meant a printed copy from an hour ago and one from five minutes ago looked identical at a glance. That defeated the entire purpose and had to be fixed before the tool was trustworthy.",
      "The first AI-suggested setup language was too generic — it read like a template, not like how this specific operation actually described its own setups. It needed to be tuned on the operation's real house standards before staff trusted it enough to use without heavy editing.",
      "Giving kitchen and service full edit access early on recreated the same version-confusion problem the tool was supposed to solve. Access ended up scoped by role — edit access with sales/events, read access with the ability to flag corrections for kitchen and service.",
    ],
    costInHours:
      "The structured, non-AI version came together faster than expected, since it was mostly about disciplined data modeling of a format that already existed. The AI-assisted fill took longer to get right than the core tool did, because \"generic but correct\" wasn't good enough — it had to sound like this operation's own standards, not a template.",
    whatItReturned:
      "Qualitatively: kitchen, service, and sales now work from one current version instead of reconciling paper copies mid-shift, and standard event details don't get retyped fresh every time. A full before/after comparison on error rates hasn't been formally tracked yet.",
  },
  {
    slug: "what-a-voice-ai-receptionist-actually-handles",
    title: "What a Voice AI receptionist actually handles in a restaurant",
    dek: "\"AI answers your phones\" undersells what actually has to be true for that to work in a restaurant: it has to know what it doesn't know, and hand off cleanly when it hits that line. Here's what the AI Receptionist handles on its own, what it hands off, and what broke before it got there.",
    publishedAt: "2026-07-06",
    relatedAppSlugs: ["ai-receptionist"],
    whatWasBuilt: [
      "A voice AI that answers a restaurant's existing phone line when staff can't get to it, handles reservations and common questions against configured hours and availability, and escalates anything outside that scope to a human — logging a transcript and summary of every call either way.",
    ],
    why: [
      "A restaurant that doesn't answer the phone during a rush is losing business it never sees as a complaint — the caller just doesn't call back, and calls the next place instead. Voicemail doesn't solve that; most callers won't leave one.",
      "The bar for a phone AI in this context isn't \"can it talk\" — it's \"does it know when to stop talking and hand off.\" A confidently wrong answer about availability is worse than no answer at all.",
    ],
    how: [
      "Started narrow: reservation requests within configured availability, and a fixed set of the most common questions — hours, location, whether they take walk-ins. Anything outside that scope escalated by default rather than attempting a best guess.",
      "Expanded the handled scope gradually, only after seeing which questions actually came in repeatedly across real call volume, instead of guessing upfront what callers would ask.",
      "Every call — handled or escalated — gets logged with a transcript and summary, so the team can see what's actually coming through the line and adjust the script based on real calls, not assumptions.",
    ],
    whatBroke: [
      "The first version tried to handle large party requests directly and gave inconsistent answers about availability, because large parties involve constraints — room setup, staffing — that a simple availability check doesn't capture. Those now escalate to a human by default.",
      "Background noise during a genuine rush occasionally interfered with intent recognition early on, which is a particularly bad time for that to happen since it's exactly when the tool needs to work.",
      "Callers regularly asked about things that weren't in the original script — tonight's specials, a specific dietary accommodation — and the first response to those gaps was to escalate, which was correct, but it also showed which questions needed to move from \"escalate\" to \"handle\" as they kept recurring.",
    ],
    costInHours:
      "Getting basic call handling working was the fast part. Getting the escalation boundary right — knowing what not to attempt — took longer and required watching real call transcripts over time rather than something that could be fully solved before launch.",
    whatItReturned:
      "Qualitatively: calls that would have gone to voicemail during a rush get answered, and front-of-house isn't pulled off the floor for routine calls during the busiest part of a shift. A hard count of previously-missed calls now being captured hasn't been formally measured yet.",
  },
];

export function getLabEntryBySlug(slug: string): LabEntry | undefined {
  return labEntries.find((entry) => entry.slug === slug);
}

export function getLabEntriesForApp(appSlug: string): LabEntry[] {
  return labEntries.filter((entry) => entry.relatedAppSlugs.includes(appSlug));
}

export function getLabEntriesForCaseStudy(caseStudySlug: string): LabEntry[] {
  return labEntries.filter((entry) => entry.relatedCaseStudySlugs?.includes(caseStudySlug));
}
