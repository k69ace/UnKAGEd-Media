// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SuggestionsPanel } from "./SuggestionsPanel";
import type { Suggestion } from "@/lib/suggestions";

function suggestion(message: string): Suggestion {
  return { type: "missing_info", message, relatedLineItemIds: [], source: "rules" };
}

describe("SuggestionsPanel", () => {
  it("renders nothing when there are no suggestions", () => {
    const { container } = render(<SuggestionsPanel suggestions={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders each suggestion labeled 'Suggestion', never as a fact", () => {
    render(
      <SuggestionsPanel
        suggestions={[
          suggestion("Consider adding a bar package for this evening reception."),
          suggestion("No staffing added yet for 80 guests."),
        ]}
      />,
    );
    expect(screen.getByText("Suggestions")).toBeInTheDocument();
    expect(screen.getAllByText("Suggestion")).toHaveLength(2);
    expect(screen.getByText("Consider adding a bar package for this evening reception.")).toBeInTheDocument();
    expect(screen.getByText("No staffing added yet for 80 guests.")).toBeInTheDocument();
  });
});
