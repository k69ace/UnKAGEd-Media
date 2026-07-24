// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PipelineBoard, type PipelineCard } from "./PipelineBoard";
import { changeEstimateStatus } from "@/app/estimator/(app)/estimates/actions";

const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock("@/app/estimator/(app)/estimates/actions", () => ({
  changeEstimateStatus: vi.fn(),
}));

function card(overrides: Partial<PipelineCard> = {}): PipelineCard {
  return {
    id: "est-1",
    status: "draft",
    customers: { name: "Jane Smith" },
    event_types: { name: "Wedding" },
    event_date: "2026-08-01",
    grandTotal: 5000,
    guest_count_guaranteed: null,
    guest_count_estimated: 100,
    version: 1,
    created_by_profile: null,
    ...overrides,
  };
}

function fakeDataTransfer(id: string) {
  const store = new Map<string, string>();
  store.set("text/plain", id);
  return {
    setData: (type: string, value: string) => store.set(type, value),
    getData: (type: string) => store.get(type) ?? "",
  };
}

describe("PipelineBoard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("dropping a card onto a different status column calls changeEstimateStatus with that column's status", async () => {
    vi.mocked(changeEstimateStatus).mockResolvedValueOnce({});
    render(
      <PipelineBoard
        columns={[
          { status: "draft", items: [card({ id: "est-1", status: "draft" })] },
          { status: "sent", items: [] },
        ]}
      />,
    );
    const sentColumnHeading = screen.getByText(/Sent \(0\)/);
    const sentColumn = sentColumnHeading.parentElement!;
    fireEvent.drop(sentColumn, { dataTransfer: fakeDataTransfer("est-1") });
    expect(changeEstimateStatus).toHaveBeenCalledWith("est-1", "sent");
  });

  it("surfaces a server-side validation error from a drag instead of failing silently", async () => {
    vi.mocked(changeEstimateStatus).mockResolvedValueOnce({ error: "Guest count must be greater than 0 before sending." });
    render(
      <PipelineBoard
        columns={[
          { status: "draft", items: [card({ id: "est-1", status: "draft" })] },
          { status: "sent", items: [] },
        ]}
      />,
    );
    const sentColumn = screen.getByText(/Sent \(0\)/).parentElement!;
    fireEvent.drop(sentColumn, { dataTransfer: fakeDataTransfer("est-1") });
    expect(await screen.findByRole("alert")).toHaveTextContent("Guest count must be greater than 0 before sending.");
  });

  it("still renders the accessible dropdown fallback on every card", () => {
    render(<PipelineBoard columns={[{ status: "draft", items: [card()] }]} />);
    expect(screen.getByRole("combobox", { name: "Change status" })).toBeInTheDocument();
  });

  it("a drop with no dragged id (not from a card) is a no-op", () => {
    render(<PipelineBoard columns={[{ status: "draft", items: [] }, { status: "sent", items: [] }]} />);
    const sentColumn = screen.getByText(/Sent \(0\)/).parentElement!;
    fireEvent.drop(sentColumn, { dataTransfer: fakeDataTransfer("") });
    expect(changeEstimateStatus).not.toHaveBeenCalled();
  });
});
