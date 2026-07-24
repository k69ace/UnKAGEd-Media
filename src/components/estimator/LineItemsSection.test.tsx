// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LineItemsSection } from "./LineItemsSection";
import { moveLineItem, reorderLineItem } from "@/app/estimator/(app)/estimates/actions";
import type { Database } from "@/lib/supabase/types";

type LineItemRow = Database["public"]["Tables"]["catering_estimate_line_items"]["Row"];

vi.mock("@/app/estimator/(app)/estimates/actions", () => ({
  addLineItem: vi.fn(),
  updateLineItem: vi.fn(),
  deleteLineItem: vi.fn(),
  reorderLineItem: vi.fn(),
  moveLineItem: vi.fn(),
}));

function fakeDataTransfer(id: string) {
  const store = new Map<string, string>();
  store.set("text/plain", id);
  return {
    setData: (type: string, value: string) => store.set(type, value),
    getData: (type: string) => store.get(type) ?? "",
  };
}

function lineItem(overrides: Partial<LineItemRow> = {}): LineItemRow {
  return {
    id: "li-1",
    estimate_id: "est-1",
    category: "menu_item",
    description: "Chicken breast",
    quantity: 100,
    unit: "each",
    unit_price: 12,
    unit_cost: 5,
    is_taxable: true,
    tax_rule_id: null,
    sort_order: 0,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("LineItemsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders neither a table nor an add-item form for an empty, read-only category", () => {
    render(
      <LineItemsSection
        estimateId="est-1"
        title="Rentals & Logistics"
        categories={["rental"]}
        lineItems={[]}
        taxRules={[]}
        disabled={true}
      />,
    );
    expect(screen.getByText("Rentals & Logistics")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /add/i })).not.toBeInTheDocument();
  });

  it("renders the add-item form (but no table) for an empty, editable category", () => {
    render(
      <LineItemsSection
        estimateId="est-1"
        title="Rentals & Logistics"
        categories={["rental"]}
        lineItems={[]}
        taxRules={[]}
        disabled={false}
      />,
    );
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add/i })).toBeInTheDocument();
  });

  it("only shows line items belonging to the section's categories", () => {
    render(
      <LineItemsSection
        estimateId="est-1"
        title="Menu / Packages"
        categories={["menu_item", "package"]}
        lineItems={[
          lineItem({ id: "li-1", category: "menu_item", description: "Chicken breast" }),
          lineItem({ id: "li-2", category: "beverage", description: "House wine" }),
        ]}
        taxRules={[]}
        disabled={true}
      />,
    );
    expect(screen.getByDisplayValue("Chicken breast")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("House wine")).not.toBeInTheDocument();
  });

  it("passes the section's categories to reorderLineItem, not just the item id and direction", () => {
    render(
      <LineItemsSection
        estimateId="est-1"
        title="Menu / Packages"
        categories={["menu_item", "package"]}
        lineItems={[
          lineItem({ id: "li-1", category: "menu_item", description: "A", sort_order: 0 }),
          lineItem({ id: "li-2", category: "menu_item", description: "B", sort_order: 1 }),
        ]}
        taxRules={[]}
        disabled={false}
      />,
    );
    const downButtons = screen.getAllByRole("button", { name: "Move down" });
    fireEvent.click(downButtons[0]);
    expect(reorderLineItem).toHaveBeenCalledWith("est-1", "li-1", "down", ["menu_item", "package"]);
  });

  it("dropping one row onto another calls moveLineItem with the section's categories and drop target index", () => {
    render(
      <LineItemsSection
        estimateId="est-1"
        title="Menu / Packages"
        categories={["menu_item", "package"]}
        lineItems={[
          lineItem({ id: "li-1", category: "menu_item", description: "A", sort_order: 0 }),
          lineItem({ id: "li-2", category: "menu_item", description: "B", sort_order: 1 }),
        ]}
        taxRules={[]}
        disabled={false}
      />,
    );
    const rows = screen.getAllByRole("row");
    const secondDataRow = rows[2]; // header row, then two data rows
    fireEvent.drop(secondDataRow, { dataTransfer: fakeDataTransfer("li-1") });
    expect(moveLineItem).toHaveBeenCalledWith("est-1", "li-1", ["menu_item", "package"], 1);
  });

  it("dropping a row onto itself is a no-op", () => {
    render(
      <LineItemsSection
        estimateId="est-1"
        title="Menu / Packages"
        categories={["menu_item"]}
        lineItems={[lineItem({ id: "li-1", category: "menu_item", description: "A", sort_order: 0 })]}
        taxRules={[]}
        disabled={false}
      />,
    );
    const rows = screen.getAllByRole("row");
    fireEvent.drop(rows[1], { dataTransfer: fakeDataTransfer("li-1") });
    expect(moveLineItem).not.toHaveBeenCalled();
  });

  it("disabled sections don't render a drag handle and ignore drop events", () => {
    render(
      <LineItemsSection
        estimateId="est-1"
        title="Menu / Packages"
        categories={["menu_item"]}
        lineItems={[
          lineItem({ id: "li-1", category: "menu_item", description: "A", sort_order: 0 }),
          lineItem({ id: "li-2", category: "menu_item", description: "B", sort_order: 1 }),
        ]}
        taxRules={[]}
        disabled={true}
      />,
    );
    expect(screen.queryByTitle("Drag to reorder")).not.toBeInTheDocument();
    const rows = screen.getAllByRole("row");
    fireEvent.drop(rows[2], { dataTransfer: fakeDataTransfer("li-1") });
    expect(moveLineItem).not.toHaveBeenCalled();
  });
});
