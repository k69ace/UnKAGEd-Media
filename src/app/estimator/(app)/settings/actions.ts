"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertRole, requireProfile, ADMIN_ROLES } from "@/lib/auth/profile";
import { parsePackageTemplateCsv } from "@/lib/import/packageTemplateCsv";
import type { AppRole, Database } from "@/lib/supabase/types";

type LineItemCategory = Database["public"]["Enums"]["line_item_category"];

const VALID_ROLES: AppRole[] = ["catering_admin", "manager_owner", "sales_manager", "chef", "reporting_readonly"];

type ChargeType = "flat" | "percent";
type ServiceChargeBase = "discounted_subtotal" | "discounted_subtotal_excluding_alcohol";
type GratuityBase = "discounted_subtotal" | "discounted_subtotal_excluding_alcohol" | "discounted_subtotal_plus_service_charge";

export interface SettingsActionState {
  error?: string;
}

function parseChargeType(value: FormDataEntryValue | null): ChargeType {
  return value === "flat" ? "flat" : "percent";
}

function parseServiceChargeBase(value: FormDataEntryValue | null): ServiceChargeBase {
  return value === "discounted_subtotal_excluding_alcohol" ? "discounted_subtotal_excluding_alcohol" : "discounted_subtotal";
}

function parseGratuityBase(value: FormDataEntryValue | null): GratuityBase {
  if (value === "discounted_subtotal_excluding_alcohol" || value === "discounted_subtotal_plus_service_charge") return value;
  return "discounted_subtotal";
}

export async function createTaxRule(_prev: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  const profile = await requireProfile();
  assertRole(profile, ADMIN_ROLES);

  const name = String(formData.get("name") ?? "").trim();
  const ratePercent = Number(formData.get("ratePercent") ?? 0);
  if (!name) return { error: "Name is required." };
  if (!Number.isFinite(ratePercent) || ratePercent < 0 || ratePercent > 100) {
    return { error: "Rate must be between 0 and 100." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tax_rules").insert({
    organization_id: profile.organizationId,
    name,
    rate: ratePercent / 100,
  });
  if (error) return { error: error.message };

  revalidatePath("/estimator/settings");
  return {};
}

export async function toggleTaxRuleActive(taxRuleId: string, isActive: boolean): Promise<{ error?: string }> {
  const profile = await requireProfile();
  assertRole(profile, ADMIN_ROLES);

  const supabase = await createClient();
  const { error } = await supabase
    .from("tax_rules")
    .update({ is_active: isActive })
    .eq("id", taxRuleId)
    .eq("organization_id", profile.organizationId);
  if (error) return { error: error.message };

  revalidatePath("/estimator/settings");
  return {};
}

export async function createEventType(_prev: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  const profile = await requireProfile();
  assertRole(profile, ADMIN_ROLES);

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("event_types").insert({ organization_id: profile.organizationId, name });
  if (error) return { error: error.message };

  revalidatePath("/estimator/settings");
  return {};
}

export async function toggleEventTypeActive(id: string, isActive: boolean): Promise<{ error?: string }> {
  const profile = await requireProfile();
  assertRole(profile, ADMIN_ROLES);

  const supabase = await createClient();
  const { error } = await supabase
    .from("event_types")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("organization_id", profile.organizationId);
  if (error) return { error: error.message };

  revalidatePath("/estimator/settings");
  return {};
}

export async function createServiceStyle(_prev: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  const profile = await requireProfile();
  assertRole(profile, ADMIN_ROLES);

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("service_styles").insert({ organization_id: profile.organizationId, name });
  if (error) return { error: error.message };

  revalidatePath("/estimator/settings");
  return {};
}

export async function toggleServiceStyleActive(id: string, isActive: boolean): Promise<{ error?: string }> {
  const profile = await requireProfile();
  assertRole(profile, ADMIN_ROLES);

  const supabase = await createClient();
  const { error } = await supabase
    .from("service_styles")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("organization_id", profile.organizationId);
  if (error) return { error: error.message };

  revalidatePath("/estimator/settings");
  return {};
}

export async function createStaffingRole(_prev: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  const profile = await requireProfile();
  assertRole(profile, ADMIN_ROLES);

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };
  const rate = formData.get("defaultRatePerHour") ? Number(formData.get("defaultRatePerHour")) : null;
  const ratio = formData.get("defaultRatioGuestsPerStaff") ? Number(formData.get("defaultRatioGuestsPerStaff")) : null;

  const supabase = await createClient();
  const { error } = await supabase.from("staffing_roles").insert({
    organization_id: profile.organizationId,
    name,
    default_rate_per_hour: rate,
    default_ratio_guests_per_staff: ratio,
  });
  if (error) return { error: error.message };

  revalidatePath("/estimator/settings");
  return {};
}

export async function toggleStaffingRoleActive(id: string, isActive: boolean): Promise<{ error?: string }> {
  const profile = await requireProfile();
  assertRole(profile, ADMIN_ROLES);

  const supabase = await createClient();
  const { error } = await supabase
    .from("staffing_roles")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("organization_id", profile.organizationId);
  if (error) return { error: error.message };

  revalidatePath("/estimator/settings");
  return {};
}

export async function updateChargeSettings(_prev: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  const profile = await requireProfile();
  assertRole(profile, ADMIN_ROLES);

  const supabase = await createClient();
  const { error } = await supabase
    .from("organization_settings")
    .update({
      service_charge_enabled: formData.get("serviceChargeEnabled") === "on",
      service_charge_type: parseChargeType(formData.get("serviceChargeType")),
      service_charge_value:
        formData.get("serviceChargeType") === "percent"
          ? Number(formData.get("serviceChargeValue") ?? 0) / 100
          : Number(formData.get("serviceChargeValue") ?? 0),
      service_charge_base: parseServiceChargeBase(formData.get("serviceChargeBase")),
      service_charge_tax_rule_id: String(formData.get("serviceChargeTaxRuleId") ?? "") || null,
      gratuity_enabled: formData.get("gratuityEnabled") === "on",
      gratuity_type: parseChargeType(formData.get("gratuityType")),
      gratuity_value:
        formData.get("gratuityType") === "percent"
          ? Number(formData.get("gratuityValue") ?? 0) / 100
          : Number(formData.get("gratuityValue") ?? 0),
      gratuity_base: parseGratuityBase(formData.get("gratuityBase")),
      gratuity_tax_rule_id: String(formData.get("gratuityTaxRuleId") ?? "") || null,
      approval_threshold_amount: formData.get("approvalThresholdAmount") ? Number(formData.get("approvalThresholdAmount")) : null,
      approval_below_margin_percent: formData.get("approvalBelowMarginPercent")
        ? Number(formData.get("approvalBelowMarginPercent")) / 100
        : null,
      default_profit_target_percent: formData.get("defaultProfitTargetPercent")
        ? Number(formData.get("defaultProfitTargetPercent")) / 100
        : null,
      chef_review_required: formData.get("chefReviewRequired") === "on",
    })
    .eq("organization_id", profile.organizationId);
  if (error) return { error: error.message };

  revalidatePath("/estimator/settings");
  return {};
}

async function countActiveAdmins(organizationId: string, excludingProfileId?: string): Promise<number> {
  const supabase = await createClient();
  let query = supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .in("role", ADMIN_ROLES);
  if (excludingProfileId) query = query.neq("id", excludingProfileId);
  const { count } = await query;
  return count ?? 0;
}

export async function updateMemberRole(memberId: string, newRole: string): Promise<{ error?: string }> {
  const profile = await requireProfile();
  assertRole(profile, ADMIN_ROLES);

  if (!VALID_ROLES.includes(newRole as AppRole)) return { error: "Not a valid role." };
  const role = newRole as AppRole;

  const supabase = await createClient();
  const { data: member } = await supabase
    .from("profiles")
    .select("id, role, organization_id")
    .eq("id", memberId)
    .eq("organization_id", profile.organizationId)
    .single();
  if (!member) return { error: "Team member not found." };

  const wasAdmin = ADMIN_ROLES.includes(member.role);
  const willBeAdmin = ADMIN_ROLES.includes(role);
  if (wasAdmin && !willBeAdmin) {
    const remaining = await countActiveAdmins(profile.organizationId, memberId);
    if (remaining === 0) {
      return { error: "Can't remove the last admin — promote someone else first." };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", memberId)
    .eq("organization_id", profile.organizationId);
  if (error) return { error: error.message };

  revalidatePath("/estimator/settings");
  return {};
}

export async function toggleMemberActive(memberId: string, isActive: boolean): Promise<{ error?: string }> {
  const profile = await requireProfile();
  assertRole(profile, ADMIN_ROLES);

  if (memberId === profile.id && !isActive) {
    return { error: "You can't deactivate your own account." };
  }

  const supabase = await createClient();
  const { data: member } = await supabase
    .from("profiles")
    .select("id, role, is_active")
    .eq("id", memberId)
    .eq("organization_id", profile.organizationId)
    .single();
  if (!member) return { error: "Team member not found." };

  if (!isActive && member.is_active && ADMIN_ROLES.includes(member.role)) {
    const remaining = await countActiveAdmins(profile.organizationId, memberId);
    if (remaining === 0) {
      return { error: "Can't deactivate the last admin — promote someone else first." };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", memberId)
    .eq("organization_id", profile.organizationId);
  if (error) return { error: error.message };

  revalidatePath("/estimator/settings");
  return {};
}

export interface CreateInviteResult {
  error?: string;
  link?: string;
}

export async function createInvite(_prev: CreateInviteResult, formData: FormData): Promise<CreateInviteResult> {
  const profile = await requireProfile();
  assertRole(profile, ADMIN_ROLES);

  const email = String(formData.get("email") ?? "").trim() || null;
  const role = String(formData.get("role") ?? "sales_manager");
  if (!VALID_ROLES.includes(role as AppRole)) return { error: "Not a valid role." };

  const token = randomUUID().replace(/-/g, "") + randomUUID().replace(/-/g, "");

  const supabase = await createClient();
  const { error } = await supabase.from("invites").insert({
    organization_id: profile.organizationId,
    email,
    role: role as AppRole,
    token,
    created_by: profile.id,
  });
  if (error) return { error: error.message };

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const origin = host ? `${proto}://${host}` : "";

  revalidatePath("/estimator/settings");
  return { link: `${origin}/estimator/login?invite=${token}` };
}

export async function revokeInvite(inviteId: string): Promise<{ error?: string }> {
  const profile = await requireProfile();
  assertRole(profile, ADMIN_ROLES);

  const supabase = await createClient();
  const { error } = await supabase
    .from("invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", inviteId)
    .eq("organization_id", profile.organizationId);
  if (error) return { error: error.message };

  revalidatePath("/estimator/settings");
  return {};
}

export async function createPackageTemplate(_prev: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  const profile = await requireProfile();
  assertRole(profile, ADMIN_ROLES);

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("catering_package_templates").insert({
    organization_id: profile.organizationId,
    name,
    description: String(formData.get("description") ?? "") || null,
    base_per_person_price: formData.get("basePerPersonPrice") ? Number(formData.get("basePerPersonPrice")) : null,
    created_by: profile.id,
  });
  if (error) return { error: error.message };

  revalidatePath("/estimator/settings");
  return {};
}

export async function togglePackageTemplateActive(id: string, isActive: boolean): Promise<{ error?: string }> {
  const profile = await requireProfile();
  assertRole(profile, ADMIN_ROLES);

  const supabase = await createClient();
  const { error } = await supabase
    .from("catering_package_templates")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("organization_id", profile.organizationId);
  if (error) return { error: error.message };

  revalidatePath("/estimator/settings");
  return {};
}

export interface TemplateLineItemInput {
  category: LineItemCategory;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  unitCost: number | null;
  isTaxable: boolean;
  taxRuleId: string | null;
}

async function assertTemplateOwnedByOrg(templateId: string, organizationId: string): Promise<void> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("catering_package_templates")
    .select("id")
    .eq("id", templateId)
    .eq("organization_id", organizationId)
    .single();
  if (!data) throw new Error("Template not found.");
}

export async function addTemplateLineItem(templateId: string, input: TemplateLineItemInput): Promise<{ error?: string }> {
  try {
    const profile = await requireProfile();
    assertRole(profile, ADMIN_ROLES);
    await assertTemplateOwnedByOrg(templateId, profile.organizationId);

    const supabase = await createClient();
    const { count } = await supabase
      .from("catering_package_template_line_items")
      .select("id", { count: "exact", head: true })
      .eq("template_id", templateId);

    const { error } = await supabase.from("catering_package_template_line_items").insert({
      template_id: templateId,
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

    revalidatePath("/estimator/settings");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to add line item." };
  }
}

export async function deleteTemplateLineItem(templateId: string, lineItemId: string): Promise<{ error?: string }> {
  try {
    const profile = await requireProfile();
    assertRole(profile, ADMIN_ROLES);
    await assertTemplateOwnedByOrg(templateId, profile.organizationId);

    const supabase = await createClient();
    const { error } = await supabase
      .from("catering_package_template_line_items")
      .delete()
      .eq("id", lineItemId)
      .eq("template_id", templateId);
    if (error) throw error;

    revalidatePath("/estimator/settings");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to remove line item." };
  }
}

export interface ImportPackageTemplateState {
  error?: string;
  errors?: string[];
  success?: boolean;
}

export async function importPackageTemplateCsv(
  _prev: ImportPackageTemplateState,
  formData: FormData,
): Promise<ImportPackageTemplateState> {
  const profile = await requireProfile();
  assertRole(profile, ADMIN_ROLES);

  const templateName = String(formData.get("templateName") ?? "").trim();
  if (!templateName) return { error: "Template name is required." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a CSV file to import." };
  }
  const csvText = await file.text();

  const supabase = await createClient();
  const { data: taxRules } = await supabase
    .from("tax_rules")
    .select("id, name")
    .eq("organization_id", profile.organizationId)
    .eq("is_active", true);

  const { items, errors } = parsePackageTemplateCsv(csvText, taxRules ?? []);
  if (errors.length > 0) return { errors };
  if (items.length === 0) return { error: "No valid rows found in the file." };

  const { data: template, error: templateError } = await supabase
    .from("catering_package_templates")
    .insert({ organization_id: profile.organizationId, name: templateName, created_by: profile.id })
    .select("id")
    .single();
  if (templateError) return { error: templateError.message };

  const { error: itemsError } = await supabase.from("catering_package_template_line_items").insert(
    items.map((item, i) => ({
      template_id: template.id,
      category: item.category,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unitPrice,
      unit_cost: item.unitCost,
      is_taxable: item.isTaxable,
      tax_rule_id: item.taxRuleId,
      sort_order: i,
    })),
  );
  if (itemsError) return { error: itemsError.message };

  revalidatePath("/estimator/settings");
  return { success: true };
}
