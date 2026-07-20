import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type EstimateStatus = Database["public"]["Enums"]["estimate_status"];
type EstimateRow = Database["public"]["Tables"]["catering_estimates"]["Row"];
type LineItemRow = Database["public"]["Tables"]["catering_estimate_line_items"]["Row"];
type StaffingRow = Database["public"]["Tables"]["catering_estimate_staffing"]["Row"];
type GuestCountHistoryRow = Database["public"]["Tables"]["catering_estimate_guest_count_history"]["Row"];
type PackageTemplateRow = Database["public"]["Tables"]["catering_package_templates"]["Row"];
type PackageTemplateLineItemRow = Database["public"]["Tables"]["catering_package_template_line_items"]["Row"];

// See the note in estimates/actions.ts: hand-written types carry no
// Relationships metadata, so nested `table(*)` embeds need an explicit
// cast rather than relying on postgrest-js's join inference.
export type EstimateDetail = EstimateRow & {
  customers: { id: string; name: string; company_name: string | null } | null;
  contacts: { id: string; first_name: string; last_name: string; email: string | null; phone: string | null } | null;
  catering_estimate_line_items: LineItemRow[];
  catering_estimate_staffing: (StaffingRow & { staffing_roles: { name: string } | null })[];
  catering_estimate_guest_count_history: GuestCountHistoryRow[];
};

export type PackageTemplateWithLineItems = PackageTemplateRow & {
  catering_package_template_line_items: PackageTemplateLineItemRow[];
};

export type PipelineEstimateRow = Pick<
  EstimateRow,
  "id" | "status" | "event_date" | "guest_count_estimated" | "guest_count_guaranteed" | "discount_amount" | "created_at" | "version" | "previous_version_id"
> & {
  customers: { name: string; company_name: string | null } | null;
  event_types: { name: string } | null;
  catering_estimate_line_items: Pick<LineItemRow, "id" | "category" | "quantity" | "unit_price" | "unit_cost" | "is_taxable" | "tax_rule_id">[];
};

export type ExportEstimateRow = Pick<
  EstimateRow,
  "id" | "status" | "event_date" | "guest_count_estimated" | "guest_count_guaranteed" | "discount_amount" | "created_at"
> & {
  customers: { name: string; company_name: string | null } | null;
  created_by_profile: { full_name: string } | null;
  catering_estimate_line_items: Pick<LineItemRow, "id" | "category" | "quantity" | "unit_price" | "unit_cost" | "is_taxable" | "tax_rule_id">[];
  catering_estimate_staffing: Pick<StaffingRow, "quantity" | "hours" | "rate_per_hour">[];
};

export async function listCustomers(organizationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id, name, company_name")
    .eq("organization_id", organizationId)
    .order("name");
  if (error) throw error;
  return data;
}

export async function listContactsForCustomer(customerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("id, first_name, last_name, email, phone, is_primary")
    .eq("customer_id", customerId)
    .order("is_primary", { ascending: false });
  if (error) throw error;
  return data;
}

export async function listOrgConfig(organizationId: string) {
  const supabase = await createClient();
  const [taxRules, eventTypes, serviceStyles, staffingRoles, settings, packageTemplates] = await Promise.all([
    supabase.from("tax_rules").select("id, name, rate").eq("organization_id", organizationId).eq("is_active", true).order("name"),
    supabase.from("event_types").select("id, name").eq("organization_id", organizationId).eq("is_active", true).order("sort_order"),
    supabase.from("service_styles").select("id, name").eq("organization_id", organizationId).eq("is_active", true).order("sort_order"),
    supabase.from("staffing_roles").select("id, name, default_rate_per_hour, default_ratio_guests_per_staff").eq("organization_id", organizationId).eq("is_active", true).order("name"),
    supabase.from("organization_settings").select("*").eq("organization_id", organizationId).single(),
    supabase
      .from("catering_package_templates")
      .select("id, name, description, base_per_person_price, catering_package_template_line_items(*)")
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .order("name"),
  ]);

  if (taxRules.error) throw taxRules.error;
  if (eventTypes.error) throw eventTypes.error;
  if (serviceStyles.error) throw serviceStyles.error;
  if (staffingRoles.error) throw staffingRoles.error;
  if (settings.error) throw settings.error;
  if (packageTemplates.error) throw packageTemplates.error;

  return {
    taxRules: taxRules.data,
    eventTypes: eventTypes.data,
    serviceStyles: serviceStyles.data,
    staffingRoles: staffingRoles.data,
    settings: settings.data,
    packageTemplates: packageTemplates.data as unknown as PackageTemplateWithLineItems[],
  };
}

export async function getEstimate(estimateId: string): Promise<EstimateDetail> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("catering_estimates")
    .select(
      `*,
      customers(id, name, company_name),
      contacts(id, first_name, last_name, email, phone),
      catering_estimate_line_items(*),
      catering_estimate_staffing(*, staffing_roles(name)),
      catering_estimate_guest_count_history(*)`,
    )
    .eq("id", estimateId)
    .single();
  if (error) throw error;
  return data as unknown as EstimateDetail;
}

export interface VersionHistoryEntry {
  id: string;
  version: number;
  status: EstimateStatus;
  isCurrent: boolean;
}

// Walks the previous_version_id chain backward from the given estimate to
// build a full version history. Bounded to 25 hops so a data anomaly
// (e.g. an accidental cycle) can't turn this into an unbounded loop.
export async function getVersionHistory(estimateId: string): Promise<VersionHistoryEntry[]> {
  const supabase = await createClient();
  const history: VersionHistoryEntry[] = [];
  let currentId: string | null = estimateId;
  let hops = 0;

  while (currentId && hops < 25) {
    const result = await supabase
      .from("catering_estimates")
      .select("id, version, status, previous_version_id")
      .eq("id", currentId)
      .single();
    const row = result.data as Pick<EstimateRow, "id" | "version" | "status" | "previous_version_id"> | null;
    if (result.error || !row) break;
    history.push({ id: row.id, version: row.version, status: row.status, isCurrent: row.id === estimateId });
    currentId = row.previous_version_id;
    hops += 1;
  }

  return history.reverse();
}

export interface PipelineFilters {
  status?: EstimateStatus[];
  eventTypeId?: string;
  dateFrom?: string;
  dateTo?: string;
  guestCountMin?: number;
  guestCountMax?: number;
}

export async function listEstimatesForPipeline(organizationId: string, filters: PipelineFilters = {}): Promise<PipelineEstimateRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("catering_estimates")
    .select(
      `id, status, event_date, guest_count_estimated, guest_count_guaranteed, discount_amount, created_at, version, previous_version_id,
      customers(name, company_name),
      event_types(name),
      catering_estimate_line_items(id, category, quantity, unit_price, unit_cost, is_taxable, tax_rule_id)`,
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (filters.status?.length) query = query.in("status", filters.status);
  if (filters.eventTypeId) query = query.eq("event_type_id", filters.eventTypeId);
  if (filters.dateFrom) query = query.gte("event_date", filters.dateFrom);
  if (filters.dateTo) query = query.lte("event_date", filters.dateTo);
  if (filters.guestCountMin != null) query = query.gte("guest_count_estimated", filters.guestCountMin);
  if (filters.guestCountMax != null) query = query.lte("guest_count_estimated", filters.guestCountMax);

  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as PipelineEstimateRow[];
}

export async function listEstimatesForExport(organizationId: string, filters: PipelineFilters = {}): Promise<ExportEstimateRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("catering_estimates")
    .select(
      `id, status, event_date, guest_count_estimated, guest_count_guaranteed, discount_amount, created_at,
      customers(name, company_name),
      created_by_profile:profiles!created_by(full_name),
      catering_estimate_line_items(id, category, quantity, unit_price, unit_cost, is_taxable, tax_rule_id),
      catering_estimate_staffing(quantity, hours, rate_per_hour)`,
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (filters.status?.length) query = query.in("status", filters.status);
  if (filters.eventTypeId) query = query.eq("event_type_id", filters.eventTypeId);
  if (filters.dateFrom) query = query.gte("event_date", filters.dateFrom);
  if (filters.dateTo) query = query.lte("event_date", filters.dateTo);

  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as ExportEstimateRow[];
}
