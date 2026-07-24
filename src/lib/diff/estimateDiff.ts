import type { Database } from "@/lib/supabase/types";

type LineItemCategory = Database["public"]["Enums"]["line_item_category"];
type LineItemRow = Database["public"]["Tables"]["catering_estimate_line_items"]["Row"];
type StaffingRow = Database["public"]["Tables"]["catering_estimate_staffing"]["Row"];
type EstimateRow = Database["public"]["Tables"]["catering_estimates"]["Row"];

export type DiffStatus = "added" | "removed" | "changed" | "unchanged";

export interface LineItemDiffRow {
  key: string;
  category: LineItemCategory;
  description: string;
  status: DiffStatus;
  quantityBefore: number | null;
  quantityAfter: number | null;
  unitPriceBefore: number | null;
  unitPriceAfter: number | null;
}

type DiffableLineItem = Pick<LineItemRow, "category" | "description" | "quantity" | "unit_price">;

/**
 * Line items are cloned into brand-new rows (new ids) on every version, so
 * matching before/after by id is impossible -- matches by category +
 * description instead. Duplicate (category, description) pairs within one
 * version are matched in encounter order rather than collapsed, so e.g.
 * two identical "Chair rental" lines with different quantities each get
 * their own before/after pairing instead of being merged.
 */
export function diffLineItems(before: DiffableLineItem[], after: DiffableLineItem[]): LineItemDiffRow[] {
  const key = (li: DiffableLineItem) => `${li.category}::${li.description}`;

  const beforeByKey = new Map<string, DiffableLineItem[]>();
  for (const li of before) {
    const k = key(li);
    const bucket = beforeByKey.get(k) ?? [];
    bucket.push(li);
    beforeByKey.set(k, bucket);
  }

  const rows: LineItemDiffRow[] = [];
  const consumed = new Set<DiffableLineItem>();

  for (const a of after) {
    const k = key(a);
    const candidates = beforeByKey.get(k) ?? [];
    const match = candidates.find((c) => !consumed.has(c));
    if (match) {
      consumed.add(match);
      const changed = match.quantity !== a.quantity || match.unit_price !== a.unit_price;
      rows.push({
        key: k,
        category: a.category,
        description: a.description,
        status: changed ? "changed" : "unchanged",
        quantityBefore: match.quantity,
        quantityAfter: a.quantity,
        unitPriceBefore: match.unit_price,
        unitPriceAfter: a.unit_price,
      });
    } else {
      rows.push({
        key: k,
        category: a.category,
        description: a.description,
        status: "added",
        quantityBefore: null,
        quantityAfter: a.quantity,
        unitPriceBefore: null,
        unitPriceAfter: a.unit_price,
      });
    }
  }

  for (const b of before) {
    if (!consumed.has(b)) {
      rows.push({
        key: key(b),
        category: b.category,
        description: b.description,
        status: "removed",
        quantityBefore: b.quantity,
        quantityAfter: null,
        unitPriceBefore: b.unit_price,
        unitPriceAfter: null,
      });
    }
  }

  return rows;
}

export interface StaffingDiffRow {
  key: string;
  staffingRoleId: string;
  status: DiffStatus;
  quantityBefore: number | null;
  quantityAfter: number | null;
  hoursBefore: number | null;
  hoursAfter: number | null;
  rateBefore: number | null;
  rateAfter: number | null;
}

type DiffableStaffing = Pick<StaffingRow, "staffing_role_id" | "quantity" | "hours" | "rate_per_hour">;

/** Same id-can't-be-trusted-across-versions problem as line items; matched by role instead. */
export function diffStaffing(before: DiffableStaffing[], after: DiffableStaffing[]): StaffingDiffRow[] {
  const beforeByRole = new Map<string, DiffableStaffing[]>();
  for (const s of before) {
    const bucket = beforeByRole.get(s.staffing_role_id) ?? [];
    bucket.push(s);
    beforeByRole.set(s.staffing_role_id, bucket);
  }

  const rows: StaffingDiffRow[] = [];
  const consumed = new Set<DiffableStaffing>();

  for (const a of after) {
    const candidates = beforeByRole.get(a.staffing_role_id) ?? [];
    const match = candidates.find((c) => !consumed.has(c));
    if (match) {
      consumed.add(match);
      const changed = match.quantity !== a.quantity || match.hours !== a.hours || match.rate_per_hour !== a.rate_per_hour;
      rows.push({
        key: a.staffing_role_id,
        staffingRoleId: a.staffing_role_id,
        status: changed ? "changed" : "unchanged",
        quantityBefore: match.quantity,
        quantityAfter: a.quantity,
        hoursBefore: match.hours,
        hoursAfter: a.hours,
        rateBefore: match.rate_per_hour,
        rateAfter: a.rate_per_hour,
      });
    } else {
      rows.push({
        key: a.staffing_role_id,
        staffingRoleId: a.staffing_role_id,
        status: "added",
        quantityBefore: null,
        quantityAfter: a.quantity,
        hoursBefore: null,
        hoursAfter: a.hours,
        rateBefore: null,
        rateAfter: a.rate_per_hour,
      });
    }
  }

  for (const b of before) {
    if (!consumed.has(b)) {
      rows.push({
        key: b.staffing_role_id,
        staffingRoleId: b.staffing_role_id,
        status: "removed",
        quantityBefore: b.quantity,
        quantityAfter: null,
        hoursBefore: b.hours,
        hoursAfter: null,
        rateBefore: b.rate_per_hour,
        rateAfter: null,
      });
    }
  }

  return rows;
}

export interface FieldDiffRow {
  field: string;
  label: string;
  before: unknown;
  after: unknown;
}

type DiffableEstimateFields = Pick<
  EstimateRow,
  | "guest_count_estimated"
  | "guest_count_guaranteed"
  | "discount_amount"
  | "discount_reason"
  | "deposit_amount"
  | "minimum_spend_required"
  | "venue_name"
  | "event_date"
>;

const FIELD_LABELS: Record<keyof DiffableEstimateFields, string> = {
  guest_count_estimated: "Guest count (estimated)",
  guest_count_guaranteed: "Guest count (guaranteed)",
  discount_amount: "Discount amount",
  discount_reason: "Discount reason",
  deposit_amount: "Deposit amount",
  minimum_spend_required: "Minimum spend required",
  venue_name: "Venue",
  event_date: "Event date",
};

/** Only scalar fields most likely to matter to a "what changed" review -- not every column on the table. */
export function diffEstimateFields(before: DiffableEstimateFields, after: DiffableEstimateFields): FieldDiffRow[] {
  const rows: FieldDiffRow[] = [];
  for (const field of Object.keys(FIELD_LABELS) as (keyof DiffableEstimateFields)[]) {
    if (before[field] !== after[field]) {
      rows.push({ field, label: FIELD_LABELS[field], before: before[field], after: after[field] });
    }
  }
  return rows;
}
