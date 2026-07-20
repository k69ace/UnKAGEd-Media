import type { Database } from "@/lib/supabase/types";

type LineItemCategory = Database["public"]["Enums"]["line_item_category"];
type EstimateStatus = Database["public"]["Enums"]["estimate_status"];

export const CATEGORY_LABELS: Record<LineItemCategory, string> = {
  menu_item: "Menu item",
  package: "Package",
  beverage: "Beverage",
  alcohol: "Alcohol",
  rental: "Rental",
  linen: "Linen",
  delivery: "Delivery",
  setup: "Setup",
  pickup: "Pickup",
  travel: "Travel",
  staffing: "Staffing",
  admin_fee: "Admin fee",
  service_charge: "Service charge",
  other: "Other",
};

export const STATUS_LABELS: Record<EstimateStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  approved: "Approved",
  won: "Won",
  lost: "Lost",
  cancelled: "Cancelled",
};

export const PIPELINE_STATUSES: EstimateStatus[] = ["draft", "sent", "approved", "won", "lost"];

export const MENU_PACKAGE_CATEGORIES: LineItemCategory[] = ["menu_item", "package"];
export const BEVERAGE_CATEGORIES: LineItemCategory[] = ["beverage", "alcohol"];
export const RENTALS_LOGISTICS_CATEGORIES: LineItemCategory[] = [
  "rental",
  "linen",
  "delivery",
  "setup",
  "pickup",
  "travel",
  "admin_fee",
  "other",
];
