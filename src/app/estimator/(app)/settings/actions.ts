"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertRole, requireProfile, ADMIN_ROLES } from "@/lib/auth/profile";

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
    })
    .eq("organization_id", profile.organizationId);
  if (error) return { error: error.message };

  revalidatePath("/estimator/settings");
  return {};
}
