"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { assertRole, requireProfile, ADMIN_ROLES, APPROVER_ROLES, ESTIMATE_WRITE_ROLES } from "@/lib/auth/profile";
import { computeEstimateSummary } from "@/lib/calculations/estimateSummary";
import type { Database } from "@/lib/supabase/types";

type LineItemCategory = Database["public"]["Enums"]["line_item_category"];
type EstimateStatus = Database["public"]["Enums"]["estimate_status"];
type EstimateRow = Database["public"]["Tables"]["catering_estimates"]["Row"];
type LineItemRow = Database["public"]["Tables"]["catering_estimate_line_items"]["Row"];
type StaffingRow = Database["public"]["Tables"]["catering_estimate_staffing"]["Row"];

// The hand-written Database types (see src/lib/supabase/types.ts) carry no
// foreign-key Relationships metadata, so postgrest-js can't infer nested
// `table(*)` embeds and resolves them to `never`. Cast explicitly here
// instead of threading `any` through every caller; replace with real
// inference once mcp__Supabase__generate_typescript_types is available.
type EstimateWithChildren = EstimateRow & {
  catering_estimate_line_items: LineItemRow[];
  catering_estimate_staffing: StaffingRow[];
};

async function loadEstimateForMutation(estimateId: string): Promise<EstimateWithChildren> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("catering_estimates")
    .select("*, catering_estimate_line_items(*), catering_estimate_staffing(*)")
    .eq("id", estimateId)
    .single();
  if (error) throw error;
  return data as unknown as EstimateWithChildren;
}

/**
 * Estimates in draft/sent are edited in place. Once approved (or beyond),
 * any further edit must land on a new version instead of mutating
 * history — this clones the estimate + line items + staffing into a new
 * draft row and returns its id. Callers that mutate estimate content call
 * this first and operate on (and redirect to) the returned id.
 */
async function ensureEditableVersion(estimateId: string): Promise<string> {
  const supabase = await createClient();
  const profile = await requireProfile();
  const estimate = await loadEstimateForMutation(estimateId);

  if (estimate.status === "draft" || estimate.status === "sent") {
    return estimateId;
  }

  const { data: newEstimate, error: insertError } = await supabase
    .from("catering_estimates")
    .insert({
      organization_id: estimate.organization_id,
      location_id: estimate.location_id,
      customer_id: estimate.customer_id,
      contact_id: estimate.contact_id,
      event_date: estimate.event_date,
      event_start_time: estimate.event_start_time,
      event_end_time: estimate.event_end_time,
      venue_name: estimate.venue_name,
      venue_address: estimate.venue_address,
      event_type_id: estimate.event_type_id,
      service_style_id: estimate.service_style_id,
      guest_count_estimated: estimate.guest_count_estimated,
      guest_count_guaranteed: estimate.guest_count_guaranteed,
      status: "draft",
      version: estimate.version + 1,
      previous_version_id: estimate.id,
      profit_target_percent: estimate.profit_target_percent,
      deposit_amount: estimate.deposit_amount,
      deposit_due_date: estimate.deposit_due_date,
      payment_schedule_json: estimate.payment_schedule_json,
      minimum_spend_required: estimate.minimum_spend_required,
      discount_amount: estimate.discount_amount,
      discount_reason: estimate.discount_reason,
      internal_notes: estimate.internal_notes,
      customer_facing_notes: estimate.customer_facing_notes,
      created_by: profile.id,
      updated_by: profile.id,
    })
    .select("id")
    .single();
  if (insertError) throw insertError;

  const lineItems = estimate.catering_estimate_line_items ?? [];
  if (lineItems.length > 0) {
    const { error } = await supabase.from("catering_estimate_line_items").insert(
      lineItems.map((li) => ({
        estimate_id: newEstimate.id,
        category: li.category,
        description: li.description,
        quantity: li.quantity,
        unit: li.unit,
        unit_price: li.unit_price,
        unit_cost: li.unit_cost,
        is_taxable: li.is_taxable,
        tax_rule_id: li.tax_rule_id,
        sort_order: li.sort_order,
      })),
    );
    if (error) throw error;
  }

  const staffing = estimate.catering_estimate_staffing ?? [];
  if (staffing.length > 0) {
    const { error } = await supabase.from("catering_estimate_staffing").insert(
      staffing.map((s) => ({
        estimate_id: newEstimate.id,
        staffing_role_id: s.staffing_role_id,
        quantity: s.quantity,
        hours: s.hours,
        rate_per_hour: s.rate_per_hour,
        notes: s.notes,
      })),
    );
    if (error) throw error;
  }

  return newEstimate.id;
}

function revalidateEstimate(estimateId: string) {
  revalidatePath(`/estimator/estimates/${estimateId}`);
  revalidatePath("/estimator/pipeline");
}

export async function createEstimate(formData: FormData): Promise<void> {
  const profile = await requireProfile();
  assertRole(profile, ESTIMATE_WRITE_ROLES);

  const customerId = String(formData.get("customerId") ?? "");
  if (!customerId) throw new Error("A customer is required to start an estimate.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("catering_estimates")
    .insert({
      organization_id: profile.organizationId,
      location_id: profile.locationId,
      customer_id: customerId,
      status: "draft",
      created_by: profile.id,
      updated_by: profile.id,
    })
    .select("id")
    .single();
  if (error) throw error;

  revalidatePath("/estimator/pipeline");
  redirect(`/estimator/estimates/${data.id}`);
}

export async function createCustomer(formData: FormData): Promise<{ id: string } | { error: string }> {
  const profile = await requireProfile();
  assertRole(profile, ESTIMATE_WRITE_ROLES);

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Customer name is required." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .insert({
      organization_id: profile.organizationId,
      name,
      company_name: String(formData.get("companyName") ?? "") || null,
      created_by: profile.id,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  const contactFirstName = String(formData.get("contactFirstName") ?? "").trim();
  const contactLastName = String(formData.get("contactLastName") ?? "").trim();
  if (contactFirstName || contactLastName) {
    await supabase.from("contacts").insert({
      organization_id: profile.organizationId,
      customer_id: data.id,
      first_name: contactFirstName || "—",
      last_name: contactLastName || "—",
      email: String(formData.get("contactEmail") ?? "") || null,
      phone: String(formData.get("contactPhone") ?? "") || null,
      is_primary: true,
    });
  }

  return { id: data.id };
}

export async function createCustomerAndEstimate(formData: FormData): Promise<void> {
  const profile = await requireProfile();
  assertRole(profile, ESTIMATE_WRITE_ROLES);

  const result = await createCustomer(formData);
  if ("error" in result) throw new Error(result.error);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("catering_estimates")
    .insert({
      organization_id: profile.organizationId,
      location_id: profile.locationId,
      customer_id: result.id,
      status: "draft",
      created_by: profile.id,
      updated_by: profile.id,
    })
    .select("id")
    .single();
  if (error) throw error;

  revalidatePath("/estimator/pipeline");
  redirect(`/estimator/estimates/${data.id}`);
}

export async function updateEventDetails(estimateId: string, formData: FormData): Promise<{ error?: string }> {
  try {
    const profile = await requireProfile();
    assertRole(profile, ESTIMATE_WRITE_ROLES);
    const targetId = await ensureEditableVersion(estimateId);

    const supabase = await createClient();
    const guestCountEstimated = formData.get("guestCountEstimated");
    const guestCountGuaranteed = formData.get("guestCountGuaranteed");

    const { error } = await supabase
      .from("catering_estimates")
      .update({
        contact_id: String(formData.get("contactId") ?? "") || null,
        event_date: String(formData.get("eventDate") ?? "") || null,
        event_start_time: String(formData.get("eventStartTime") ?? "") || null,
        event_end_time: String(formData.get("eventEndTime") ?? "") || null,
        venue_name: String(formData.get("venueName") ?? "") || null,
        venue_address: String(formData.get("venueAddress") ?? "") || null,
        event_type_id: String(formData.get("eventTypeId") ?? "") || null,
        service_style_id: String(formData.get("serviceStyleId") ?? "") || null,
        guest_count_estimated: guestCountEstimated ? Number(guestCountEstimated) : null,
        guest_count_guaranteed: guestCountGuaranteed ? Number(guestCountGuaranteed) : null,
        updated_by: profile.id,
      })
      .eq("id", targetId);
    if (error) throw error;

    revalidateEstimate(targetId);
    if (targetId !== estimateId) redirect(`/estimator/estimates/${targetId}`);
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to save event details." };
  }
}

export async function updateFeesAndDiscount(estimateId: string, formData: FormData): Promise<{ error?: string }> {
  try {
    const profile = await requireProfile();
    assertRole(profile, ESTIMATE_WRITE_ROLES);
    const targetId = await ensureEditableVersion(estimateId);

    const supabase = await createClient();
    const discountAmount = Number(formData.get("discountAmount") ?? 0) || 0;

    const { data: currentRaw, error: fetchError } = await supabase
      .from("catering_estimates")
      .select("*, catering_estimate_line_items(unit_price, quantity)")
      .eq("id", targetId)
      .single();
    if (fetchError) throw fetchError;
    const current = currentRaw as unknown as EstimateRow & {
      catering_estimate_line_items: Pick<LineItemRow, "unit_price" | "quantity">[];
    };

    const subtotal = (current.catering_estimate_line_items ?? []).reduce(
      (sum, li) => sum + li.unit_price * li.quantity,
      0,
    );
    if (discountAmount > subtotal) {
      return { error: `Discount ($${discountAmount.toFixed(2)}) cannot exceed the subtotal ($${subtotal.toFixed(2)}).` };
    }

    const { error } = await supabase
      .from("catering_estimates")
      .update({
        discount_amount: discountAmount,
        discount_reason: String(formData.get("discountReason") ?? "") || null,
        minimum_spend_required: formData.get("minimumSpendRequired") ? Number(formData.get("minimumSpendRequired")) : null,
        profit_target_percent: formData.get("profitTargetPercent") ? Number(formData.get("profitTargetPercent")) / 100 : null,
        updated_by: profile.id,
      })
      .eq("id", targetId);
    if (error) throw error;

    revalidateEstimate(targetId);
    if (targetId !== estimateId) redirect(`/estimator/estimates/${targetId}`);
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to save fees and discount." };
  }
}

export async function updatePaymentSchedule(estimateId: string, formData: FormData): Promise<{ error?: string }> {
  try {
    const profile = await requireProfile();
    assertRole(profile, ESTIMATE_WRITE_ROLES);
    const targetId = await ensureEditableVersion(estimateId);

    const supabase = await createClient();
    const { error } = await supabase
      .from("catering_estimates")
      .update({
        deposit_amount: formData.get("depositAmount") ? Number(formData.get("depositAmount")) : null,
        deposit_due_date: String(formData.get("depositDueDate") ?? "") || null,
        updated_by: profile.id,
      })
      .eq("id", targetId);
    if (error) throw error;

    revalidateEstimate(targetId);
    if (targetId !== estimateId) redirect(`/estimator/estimates/${targetId}`);
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to save payment schedule." };
  }
}

export async function updateNotes(estimateId: string, formData: FormData): Promise<{ error?: string }> {
  try {
    const profile = await requireProfile();
    assertRole(profile, ESTIMATE_WRITE_ROLES);
    const targetId = await ensureEditableVersion(estimateId);

    const supabase = await createClient();
    const { error } = await supabase
      .from("catering_estimates")
      .update({
        internal_notes: String(formData.get("internalNotes") ?? "") || null,
        customer_facing_notes: String(formData.get("customerFacingNotes") ?? "") || null,
        updated_by: profile.id,
      })
      .eq("id", targetId);
    if (error) throw error;

    revalidateEstimate(targetId);
    if (targetId !== estimateId) redirect(`/estimator/estimates/${targetId}`);
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to save notes." };
  }
}

export interface LineItemInput {
  category: LineItemCategory;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  unitCost: number | null;
  isTaxable: boolean;
  taxRuleId: string | null;
}

export async function addLineItem(estimateId: string, input: LineItemInput): Promise<{ error?: string }> {
  try {
    const profile = await requireProfile();
    assertRole(profile, ESTIMATE_WRITE_ROLES);
    const targetId = await ensureEditableVersion(estimateId);

    const supabase = await createClient();
    const { count } = await supabase
      .from("catering_estimate_line_items")
      .select("id", { count: "exact", head: true })
      .eq("estimate_id", targetId);

    const { error } = await supabase.from("catering_estimate_line_items").insert({
      estimate_id: targetId,
      category: input.category,
      description: input.description,
      quantity: input.quantity,
      unit: input.unit,
      unit_price: input.unitPrice,
      unit_cost: input.unitCost,
      is_taxable: input.isTaxable,
      tax_rule_id: input.taxRuleId,
      sort_order: count ?? 0,
    });
    if (error) throw error;

    revalidateEstimate(targetId);
    if (targetId !== estimateId) redirect(`/estimator/estimates/${targetId}`);
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to add line item." };
  }
}

export async function updateLineItem(
  estimateId: string,
  lineItemId: string,
  input: Partial<LineItemInput>,
): Promise<{ error?: string }> {
  try {
    const profile = await requireProfile();
    assertRole(profile, ESTIMATE_WRITE_ROLES);
    const targetId = await ensureEditableVersion(estimateId);

    const supabase = await createClient();
    // If a new version was created, the line item id belongs to the OLD
    // estimate's rows, not the freshly cloned ones — this update can only
    // proceed in place when we're still editing the original row set.
    if (targetId !== estimateId) {
      redirect(`/estimator/estimates/${targetId}`);
    }

    const { error } = await supabase
      .from("catering_estimate_line_items")
      .update({
        ...(input.category !== undefined && { category: input.category }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.quantity !== undefined && { quantity: input.quantity }),
        ...(input.unit !== undefined && { unit: input.unit }),
        ...(input.unitPrice !== undefined && { unit_price: input.unitPrice }),
        ...(input.unitCost !== undefined && { unit_cost: input.unitCost }),
        ...(input.isTaxable !== undefined && { is_taxable: input.isTaxable }),
        ...(input.taxRuleId !== undefined && { tax_rule_id: input.taxRuleId }),
      })
      .eq("id", lineItemId)
      .eq("estimate_id", targetId);
    if (error) throw error;

    revalidateEstimate(targetId);
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update line item." };
  }
}

export async function deleteLineItem(estimateId: string, lineItemId: string): Promise<{ error?: string }> {
  try {
    const profile = await requireProfile();
    assertRole(profile, ESTIMATE_WRITE_ROLES);
    const targetId = await ensureEditableVersion(estimateId);
    if (targetId !== estimateId) redirect(`/estimator/estimates/${targetId}`);

    const supabase = await createClient();
    const { error } = await supabase.from("catering_estimate_line_items").delete().eq("id", lineItemId).eq("estimate_id", targetId);
    if (error) throw error;

    revalidateEstimate(targetId);
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to remove line item." };
  }
}

export async function reorderLineItem(
  estimateId: string,
  lineItemId: string,
  direction: "up" | "down",
): Promise<{ error?: string }> {
  try {
    const profile = await requireProfile();
    assertRole(profile, ESTIMATE_WRITE_ROLES);
    const supabase = await createClient();

    const { data: items, error } = await supabase
      .from("catering_estimate_line_items")
      .select("id, sort_order")
      .eq("estimate_id", estimateId)
      .order("sort_order");
    if (error) throw error;

    const index = items.findIndex((i) => i.id === lineItemId);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || swapIndex < 0 || swapIndex >= items.length) return {};

    const a = items[index];
    const b = items[swapIndex];
    await Promise.all([
      supabase.from("catering_estimate_line_items").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("catering_estimate_line_items").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);

    revalidateEstimate(estimateId);
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to reorder." };
  }
}

export async function applyPackageTemplate(estimateId: string, templateId: string): Promise<{ error?: string }> {
  try {
    const profile = await requireProfile();
    assertRole(profile, ESTIMATE_WRITE_ROLES);
    const targetId = await ensureEditableVersion(estimateId);

    const supabase = await createClient();
    const { data: template, error: templateError } = await supabase
      .from("catering_package_template_line_items")
      .select("*")
      .eq("template_id", templateId)
      .order("sort_order");
    if (templateError) throw templateError;

    const { count } = await supabase
      .from("catering_estimate_line_items")
      .select("id", { count: "exact", head: true })
      .eq("estimate_id", targetId);
    const startingSort = count ?? 0;

    const { error } = await supabase.from("catering_estimate_line_items").insert(
      template.map((li, i) => ({
        estimate_id: targetId,
        category: li.category,
        description: li.description,
        quantity: li.quantity,
        unit: li.unit,
        unit_price: li.unit_price,
        unit_cost: li.unit_cost,
        is_taxable: li.is_taxable,
        tax_rule_id: li.tax_rule_id,
        sort_order: startingSort + i,
      })),
    );
    if (error) throw error;

    revalidateEstimate(targetId);
    if (targetId !== estimateId) redirect(`/estimator/estimates/${targetId}`);
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to apply package." };
  }
}

export interface StaffingInput {
  staffingRoleId: string;
  quantity: number;
  hours: number;
  ratePerHour: number;
  notes: string | null;
}

export async function addStaffing(estimateId: string, input: StaffingInput): Promise<{ error?: string }> {
  try {
    const profile = await requireProfile();
    assertRole(profile, ESTIMATE_WRITE_ROLES);
    const targetId = await ensureEditableVersion(estimateId);

    const supabase = await createClient();
    const { error } = await supabase.from("catering_estimate_staffing").insert({
      estimate_id: targetId,
      staffing_role_id: input.staffingRoleId,
      quantity: input.quantity,
      hours: input.hours,
      rate_per_hour: input.ratePerHour,
      notes: input.notes,
    });
    if (error) throw error;

    revalidateEstimate(targetId);
    if (targetId !== estimateId) redirect(`/estimator/estimates/${targetId}`);
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to add staffing." };
  }
}

/**
 * Explicit entry point for editing an approved/won/lost/cancelled
 * estimate: clones it into a new draft version and navigates there. The
 * builder UI hides inline edit controls once a status is out of
 * draft/sent — this is the only way back into an editable state, so the
 * version boundary is a deliberate action rather than an incidental side
 * effect of touching a field.
 */
export async function createNewVersionForEditing(estimateId: string): Promise<void> {
  const profile = await requireProfile();
  assertRole(profile, ESTIMATE_WRITE_ROLES);
  const targetId = await ensureEditableVersion(estimateId);
  revalidatePath("/estimator/pipeline");
  redirect(`/estimator/estimates/${targetId}`);
}

export async function deleteStaffing(estimateId: string, staffingId: string): Promise<{ error?: string }> {
  try {
    const profile = await requireProfile();
    assertRole(profile, ESTIMATE_WRITE_ROLES);
    const targetId = await ensureEditableVersion(estimateId);
    if (targetId !== estimateId) redirect(`/estimator/estimates/${targetId}`);

    const supabase = await createClient();
    const { error } = await supabase.from("catering_estimate_staffing").delete().eq("id", staffingId).eq("estimate_id", targetId);
    if (error) throw error;

    revalidateEstimate(targetId);
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to remove staffing." };
  }
}

export async function changeEstimateStatus(estimateId: string, newStatus: EstimateStatus): Promise<{ error?: string }> {
  try {
    const profile = await requireProfile();
    const supabase = await createClient();
    const estimate = await loadEstimateForMutation(estimateId);

    if (newStatus === "sent") {
      assertRole(profile, ESTIMATE_WRITE_ROLES);
      if (!estimate.guest_count_estimated || estimate.guest_count_estimated <= 0) {
        return { error: "Guest count must be greater than 0 before sending." };
      }
      const lineItems = estimate.catering_estimate_line_items ?? [];
      if (lineItems.length === 0) {
        return { error: "Add at least one menu item or package before sending." };
      }
      if (!estimate.contact_id) {
        return { error: "Select a contact before sending." };
      }
      const { data: contact } = await supabase
        .from("contacts")
        .select("email, phone")
        .eq("id", estimate.contact_id)
        .single();
      if (!contact?.email && !contact?.phone) {
        return { error: "The selected contact needs an email or phone number before sending." };
      }
    }

    if (newStatus === "approved") {
      const { data: settings } = await supabase
        .from("organization_settings")
        .select("*")
        .eq("organization_id", estimate.organization_id)
        .single();
      const { data: taxRules } = await supabase.from("tax_rules").select("*").eq("organization_id", estimate.organization_id);

      const summary = computeEstimateSummary(
        estimate,
        estimate.catering_estimate_line_items ?? [],
        estimate.catering_estimate_staffing ?? [],
        taxRules ?? [],
        settings!,
      );

      const overThreshold = settings?.approval_threshold_amount != null && summary.grandTotal > settings.approval_threshold_amount;
      const underMarginTarget =
        settings?.approval_below_margin_percent != null &&
        summary.contributionMarginPercent != null &&
        summary.contributionMarginPercent < settings.approval_below_margin_percent;

      if (overThreshold || underMarginTarget) {
        assertRole(profile, APPROVER_ROLES);
      } else {
        assertRole(profile, [...ESTIMATE_WRITE_ROLES]);
      }

      await supabase
        .from("catering_estimates")
        .update({ status: newStatus, approved_by: profile.id, approved_at: new Date().toISOString(), updated_by: profile.id })
        .eq("id", estimateId);
      revalidateEstimate(estimateId);
      return {};
    }

    if (newStatus === "won" || newStatus === "lost" || newStatus === "cancelled") {
      assertRole(profile, ESTIMATE_WRITE_ROLES);
    } else if (newStatus === "draft") {
      assertRole(profile, ADMIN_ROLES);
    }

    const { error } = await supabase
      .from("catering_estimates")
      .update({ status: newStatus, updated_by: profile.id })
      .eq("id", estimateId);
    if (error) throw error;

    revalidateEstimate(estimateId);
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to change status." };
  }
}
