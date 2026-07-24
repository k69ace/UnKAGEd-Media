// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { GuestCountHistory } from "./GuestCountHistory";
import type { EstimateDetail } from "@/lib/data/catering";

type HistoryEntry = EstimateDetail["catering_estimate_guest_count_history"][number];

function entry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: "hist-1",
    estimate_id: "est-1",
    guest_count_estimated: 100,
    guest_count_guaranteed: null,
    changed_by: "user-1",
    changed_at: "2026-01-01T00:00:00Z",
    profiles: { full_name: "Jane Sales" },
    ...overrides,
  };
}

describe("GuestCountHistory", () => {
  it("renders nothing when there is no history (a brand-new estimate)", () => {
    const { container } = render(<GuestCountHistory history={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for a single history row -- one entry isn't a 'change' yet", () => {
    const { container } = render(<GuestCountHistory history={[entry()]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a table, newest first, once there are two or more changes", () => {
    render(
      <GuestCountHistory
        history={[
          entry({ id: "hist-1", changed_at: "2026-01-01T00:00:00Z", guest_count_estimated: 100 }),
          entry({ id: "hist-2", changed_at: "2026-02-01T00:00:00Z", guest_count_estimated: 120 }),
        ]}
      />,
    );
    expect(screen.getByText("Guest Count History (2 changes)")).toBeInTheDocument();
    const rows = screen.getAllByRole("row");
    // header row + 2 data rows, newest (120) first
    expect(rows).toHaveLength(3);
    expect(rows[1]).toHaveTextContent("120");
    expect(rows[2]).toHaveTextContent("100");
  });

  it("falls back to an em dash when the actor's profile is missing", () => {
    render(<GuestCountHistory history={[entry({ id: "a" }), entry({ id: "b", profiles: null, changed_by: null })]} />);
    const rows = screen.getAllByRole("row");
    expect(rows[2]).toHaveTextContent("—");
  });
});
