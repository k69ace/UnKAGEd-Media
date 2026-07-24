// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LineItemsSection } from "./LineItemsSection";
import type { Database } from "@/lib/supabase/types";

type LineItemRow = Database["public"]["Tables"]["catering_estimate_line_items"]["Row"];

vi.mock("@/app/estimator/(app)/estimates/actions", () => ({
  addLineItem: vi.fn(),
  updateLineItem: vi.fn(),
  deleteLineItem: vi.fn(),
  reorderLineItem: vi.fn(),
}));

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
});
