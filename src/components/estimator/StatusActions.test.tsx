// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { StatusActions } from "./StatusActions";

const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

const mockChangeEstimateStatus = vi.fn();
vi.mock("@/app/estimator/(app)/estimates/actions", () => ({
  changeEstimateStatus: (...args: unknown[]) => mockChangeEstimateStatus(...args),
}));

describe("StatusActions", () => {
  it("shows the empty state instead of buttons for a terminal status (won)", () => {
    render(<StatusActions estimateId="est-1" status="won" />);
    expect(screen.getByText("No further status changes from here.")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows the empty state for cancelled too", () => {
    render(<StatusActions estimateId="est-1" status="cancelled" />);
    expect(screen.getByText("No further status changes from here.")).toBeInTheDocument();
  });

  it("offers Send to customer from draft", () => {
    render(<StatusActions estimateId="est-1" status="draft" />);
    expect(screen.getByRole("button", { name: "Send to customer" })).toBeInTheDocument();
  });

  it("offers Approve and Lost from sent", () => {
    render(<StatusActions estimateId="est-1" status="sent" />);
    expect(screen.getByRole("button", { name: "Mark Approved" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mark Lost" })).toBeInTheDocument();
  });

  it("surfaces a server-side validation error instead of silently failing", async () => {
    mockChangeEstimateStatus.mockResolvedValueOnce({ error: "Guest count must be greater than 0 before sending." });
    render(<StatusActions estimateId="est-1" status="draft" />);
    fireEvent.click(screen.getByRole("button", { name: "Send to customer" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Guest count must be greater than 0 before sending.");
  });
});
