import { parseCsv } from "./csv";
import { CATEGORY_LABELS } from "@/lib/constants/catering";
import type { Database } from "@/lib/supabase/types";

type LineItemCategory = Database["public"]["Enums"]["line_item_category"];

export interface ImportedLineItem {
  category: LineItemCategory;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  unitCost: number | null;
  isTaxable: boolean;
  taxRuleId: string | null;
}

export interface ImportResult {
  items: ImportedLineItem[];
  errors: string[];
}

const EXPECTED_HEADERS = ["Category", "Description", "Quantity", "Unit", "Unit Price", "Unit Cost", "Taxable", "Tax Rule"];

const CATEGORY_BY_LABEL = new Map<string, LineItemCategory>(
  (Object.entries(CATEGORY_LABELS) as [LineItemCategory, string][]).map(([key, label]) => [label.toLowerCase(), key]),
);
const CATEGORY_KEYS = new Set(Object.keys(CATEGORY_LABELS));

function resolveCategory(raw: string): LineItemCategory | null {
  const trimmed = raw.trim();
  if (CATEGORY_KEYS.has(trimmed as LineItemCategory)) return trimmed as LineItemCategory;
  return CATEGORY_BY_LABEL.get(trimmed.toLowerCase()) ?? null;
}

function parseBoolean(raw: string): boolean {
  const normalized = raw.trim().toLowerCase();
  return normalized === "yes" || normalized === "true" || normalized === "1";
}

/**
 * Validates the whole file before importing anything -- a partially
 * imported catalog (some rows in, some silently skipped) is worse than
 * no import at all, so any row error rejects the entire file and returns
 * every error found, not just the first.
 */
export function parsePackageTemplateCsv(csvText: string, availableTaxRules: { id: string; name: string }[]): ImportResult {
  const taxRuleIdByName = new Map(availableTaxRules.map((t) => [t.name.trim().toLowerCase(), t.id]));
  const rows = parseCsv(csvText);
  const errors: string[] = [];

  if (rows.length === 0) {
    return { items: [], errors: ["The file is empty."] };
  }

  const header = rows[0].map((h) => h.trim());
  const hasExpectedHeader = EXPECTED_HEADERS.every((h, i) => header[i]?.toLowerCase() === h.toLowerCase());
  if (!hasExpectedHeader) {
    return {
      items: [],
      errors: [`Header row must be exactly: ${EXPECTED_HEADERS.join(", ")}. Got: ${header.join(", ") || "(empty)"}`],
    };
  }

  const dataRows = rows.slice(1);
  if (dataRows.length === 0) {
    return { items: [], errors: ["No data rows found below the header."] };
  }

  const items: ImportedLineItem[] = [];

  dataRows.forEach((row, index) => {
    const lineNumber = index + 2; // +1 for header, +1 for 1-indexing
    const [categoryRaw, description, quantityRaw, unit, unitPriceRaw, unitCostRaw, taxableRaw, taxRuleRaw] = row;

    const category = resolveCategory(categoryRaw ?? "");
    if (!category) {
      errors.push(`Row ${lineNumber}: "${categoryRaw}" is not a valid category.`);
      return;
    }

    if (!description?.trim()) {
      errors.push(`Row ${lineNumber}: description is required.`);
      return;
    }

    const quantity = Number(quantityRaw);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      errors.push(`Row ${lineNumber}: quantity must be a positive number, got "${quantityRaw}".`);
      return;
    }

    const unitPrice = Number(unitPriceRaw);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      errors.push(`Row ${lineNumber}: unit price must be a non-negative number, got "${unitPriceRaw}".`);
      return;
    }

    let unitCost: number | null = null;
    if (unitCostRaw?.trim()) {
      unitCost = Number(unitCostRaw);
      if (!Number.isFinite(unitCost) || unitCost < 0) {
        errors.push(`Row ${lineNumber}: unit cost must be a non-negative number, got "${unitCostRaw}".`);
        return;
      }
    }

    let taxRuleId: string | null = null;
    if (taxRuleRaw?.trim()) {
      const resolved = taxRuleIdByName.get(taxRuleRaw.trim().toLowerCase());
      if (!resolved) {
        errors.push(`Row ${lineNumber}: "${taxRuleRaw}" does not match any tax rule in this organization.`);
        return;
      }
      taxRuleId = resolved;
    }

    items.push({
      category,
      description: description.trim(),
      quantity,
      unit: unit?.trim() || "each",
      unitPrice,
      unitCost,
      isTaxable: parseBoolean(taxableRaw ?? ""),
      taxRuleId,
    });
  });

  return { items, errors };
}
