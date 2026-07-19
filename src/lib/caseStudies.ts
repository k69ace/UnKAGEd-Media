export interface CaseStudyResult {
  label: string;
  detail: string;
}

export interface CaseStudyDefinition {
  slug: string;
  title: string;
  subtitle: string;
  business: string;
  publishedAt: string;
  summary: string;
  challenge: {
    heading: string;
    body: string[];
  };
  whatWasBuilt: string[];
  implementation: string[];
  results: CaseStudyResult[];
  resultsNote?: string;
  lessonsLearned: string[];
  relatedAppSlugs: string[];
}

// Case studies only get published with a real, verifiable engagement behind
// them — no thin entries. This one covers Kirk's own operation, where the
// Catering Estimator was built and is used daily; results are reported
// qualitatively until a full season of numbers is closed out and confirmed.
export const caseStudies: CaseStudyDefinition[] = [
  {
    slug: "catering-estimator-rollout",
    title: "Replacing a one-person spreadsheet with the Catering Estimator",
    subtitle: "How a working catering operation moved off ad hoc pricing without slowing down a single event.",
    business: "An independent full-service restaurant and catering operation",
    publishedAt: "2026-05-18",
    summary:
      "Inside the same restaurant and catering operation Kirk Ahlquist works in, catering pricing moved from a single person's spreadsheet to the Catering Estimator — built and refined against real events, not a demo menu.",
    challenge: {
      heading: "One spreadsheet, one person who fully understood it",
      body: [
        "Like a lot of independent catering operations, pricing lived in a spreadsheet that had been built up over years — formulas layered on formulas, menu items added as they came up, margin logic that made sense to whoever built it and nobody else. It worked, in the sense that quotes got out the door. But it depended entirely on one person being available, careful, and not rushed.",
        "During a busy stretch, that's exactly when it broke down. A rushed quote meant food cost and labor got estimated by feel instead of calculated, and there was no way to check a quote's math against a consistent standard — the spreadsheet's logic and the person's judgment were the same thing.",
      ],
    },
    whatWasBuilt: [
      "The Catering Estimator, built directly against this operation's actual catering menu, current plate costs, and the margin targets already in use — not a generic template retrofitted afterward.",
      "The goal from the start was narrow: take the same inputs a quote already needed (guest count, menu, service style) and calculate the same numbers the spreadsheet was trying to get right, consistently, regardless of who was building the quote or how busy the day was.",
    ],
    implementation: [
      "Started by mapping the existing spreadsheet's actual logic — not the version anyone could explain from memory, but what the formulas were really doing, edge cases included.",
      "Built a first version and ran it side by side with the spreadsheet on real incoming quotes, comparing outputs before trusting it to replace anything.",
      "The gaps showed up in the messy real-world cases: custom menu combinations, off-menu requests, last-minute bookings with unusual service styles — these took longer to model correctly than the core pricing logic did.",
      "Rolled out in pieces rather than a single cutover, since the operation couldn't pause taking quotes to switch tools all at once.",
    ],
    results: [
      {
        label: "One pricing standard, not one person's judgment",
        detail:
          "Every quote now runs through the same calculation regardless of who's building it or how busy the shift is — the spreadsheet's single-point-of-failure problem is gone.",
      },
      {
        label: "Quotes go out during the call",
        detail:
          "What used to require pulling up the spreadsheet and working through it carefully can now be built and sent live, during the same conversation the inquiry came in on.",
      },
      {
        label: "Edge cases are now handled explicitly",
        detail:
          "Custom menu combinations and off-menu requests that used to depend on one person's judgment call now go through the same explicit logic as a standard order.",
      },
    ],
    resultsNote:
      "These results are reported qualitatively and honestly rather than with invented statistics. A full season of margin data is still being tracked to confirm the numbers side of this story — this page will be updated with hard figures once that's closed out.",
    lessonsLearned: [
      "The core pricing math was the easy part. Modeling the messy real-world exceptions — custom combinations, rush requests, off-menu asks — took longer than expected and mattered more to getting buy-in.",
      "Trust had to be earned with side-by-side comparisons against the old spreadsheet, not just an explanation of why the new tool was more consistent. People trust what they can verify.",
      "Building this inside a live operation meant shipping in usable pieces rather than one big launch — there was never a week where quoting could just stop while the tool caught up.",
    ],
    relatedAppSlugs: ["catering-estimator"],
  },
];

export function getCaseStudyBySlug(slug: string): CaseStudyDefinition | undefined {
  return caseStudies.find((cs) => cs.slug === slug);
}
