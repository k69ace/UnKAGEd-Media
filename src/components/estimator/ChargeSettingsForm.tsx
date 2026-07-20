"use client";

import { useActionState } from "react";
import { updateChargeSettings, type SettingsActionState } from "@/app/estimator/(app)/settings/actions";
import type { Database } from "@/lib/supabase/types";

type OrgSettingsRow = Database["public"]["Tables"]["organization_settings"]["Row"];
type TaxRuleOption = { id: string; name: string };

const inputClass = "rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/40";

export function ChargeSettingsForm({ settings, taxRules }: { settings: OrgSettingsRow; taxRules: TaxRuleOption[] }) {
  const [state, formAction, pending] = useActionState<SettingsActionState, FormData>(updateChargeSettings, {});

  return (
    <form action={formAction} className="flex flex-col gap-6 text-sm">
      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium">Service charge</legend>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="serviceChargeEnabled" defaultChecked={settings.service_charge_enabled} />
          Enabled
        </label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Type">
            <select name="serviceChargeType" defaultValue={settings.service_charge_type ?? "percent"} className={inputClass}>
              <option value="percent">Percent</option>
              <option value="flat">Flat $</option>
            </select>
          </Field>
          <Field label="Value (% or $)">
            <input
              name="serviceChargeValue"
              type="number"
              step="0.01"
              defaultValue={
                settings.service_charge_type === "flat" ? (settings.service_charge_value ?? 0) : (settings.service_charge_value ?? 0) * 100
              }
              className={inputClass}
            />
          </Field>
          <Field label="Base">
            <select name="serviceChargeBase" defaultValue={settings.service_charge_base} className={inputClass}>
              <option value="discounted_subtotal">Discounted subtotal</option>
              <option value="discounted_subtotal_excluding_alcohol">Discounted subtotal excl. alcohol</option>
            </select>
          </Field>
          <Field label="Taxed as">
            <select name="serviceChargeTaxRuleId" defaultValue={settings.service_charge_tax_rule_id ?? ""} className={inputClass}>
              <option value="">Not taxed</option>
              {taxRules.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium">Gratuity</legend>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="gratuityEnabled" defaultChecked={settings.gratuity_enabled} />
          Enabled
        </label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Type">
            <select name="gratuityType" defaultValue={settings.gratuity_type ?? "percent"} className={inputClass}>
              <option value="percent">Percent</option>
              <option value="flat">Flat $</option>
            </select>
          </Field>
          <Field label="Value (% or $)">
            <input
              name="gratuityValue"
              type="number"
              step="0.01"
              defaultValue={settings.gratuity_type === "flat" ? (settings.gratuity_value ?? 0) : (settings.gratuity_value ?? 0) * 100}
              className={inputClass}
            />
          </Field>
          <Field label="Base">
            <select name="gratuityBase" defaultValue={settings.gratuity_base} className={inputClass}>
              <option value="discounted_subtotal">Discounted subtotal</option>
              <option value="discounted_subtotal_excluding_alcohol">Discounted subtotal excl. alcohol</option>
              <option value="discounted_subtotal_plus_service_charge">Discounted subtotal + service charge</option>
            </select>
          </Field>
          <Field label="Taxed as">
            <select name="gratuityTaxRuleId" defaultValue={settings.gratuity_tax_rule_id ?? ""} className={inputClass}>
              <option value="">Not taxed</option>
              {taxRules.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium">Approval &amp; margin targets</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Approval required above ($)">
            <input
              name="approvalThresholdAmount"
              type="number"
              step="0.01"
              defaultValue={settings.approval_threshold_amount ?? ""}
              className={inputClass}
            />
          </Field>
          <Field label="Approval required below margin (%)">
            <input
              name="approvalBelowMarginPercent"
              type="number"
              step="0.1"
              defaultValue={settings.approval_below_margin_percent != null ? settings.approval_below_margin_percent * 100 : ""}
              className={inputClass}
            />
          </Field>
          <Field label="Default profit target (%)">
            <input
              name="defaultProfitTargetPercent"
              type="number"
              step="0.1"
              defaultValue={settings.default_profit_target_percent != null ? settings.default_profit_target_percent * 100 : ""}
              className={inputClass}
            />
          </Field>
        </div>
      </fieldset>

      <button type="submit" disabled={pending} className="self-start rounded-md bg-foreground px-4 py-2 font-medium text-background disabled:opacity-60">
        {pending ? "Saving…" : "Save settings"}
      </button>
      {state.error && (
        <span role="alert" className="text-red-500">
          {state.error}
        </span>
      )}
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-foreground/60">{label}</span>
      {children}
    </label>
  );
}
