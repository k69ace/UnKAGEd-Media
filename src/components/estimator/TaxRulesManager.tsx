"use client";

import { useActionState, useTransition } from "react";
import { createTaxRule, toggleTaxRuleActive, type SettingsActionState } from "@/app/estimator/(app)/settings/actions";
import { roundPercentForDisplay } from "@/lib/calculations/catering";

interface TaxRule {
  id: string;
  name: string;
  rate: number;
  is_active: boolean;
}

const inputClass = "rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/40";

export function TaxRulesManager({ taxRules }: { taxRules: TaxRule[] }) {
  const [state, formAction, pending] = useActionState<SettingsActionState, FormData>(createTaxRule, {});
  const [isToggling, startTransition] = useTransition();

  return (
    <div>
      <table className="w-full max-w-lg border-collapse text-sm">
        <thead>
          <tr className="border-b border-foreground/10 text-left text-xs uppercase tracking-wide text-foreground/50">
            <th className="py-2 font-medium">Name</th>
            <th className="py-2 font-medium">Rate</th>
            <th className="py-2 font-medium">Active</th>
          </tr>
        </thead>
        <tbody>
          {taxRules.map((rule) => (
            <tr key={rule.id} className="border-b border-foreground/5">
              <td className="py-2">{rule.name}</td>
              <td className="py-2">{roundPercentForDisplay(rule.rate)}%</td>
              <td className="py-2">
                <input
                  type="checkbox"
                  checked={rule.is_active}
                  disabled={isToggling}
                  onChange={(e) => {
                    const nextValue = e.target.checked;
                    startTransition(async () => {
                      await toggleTaxRuleActive(rule.id, nextValue);
                    });
                  }}
                />
              </td>
            </tr>
          ))}
          {taxRules.length === 0 && (
            <tr>
              <td colSpan={3} className="py-3 text-foreground/50">
                No tax rules yet — add one below.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <form action={formAction} className="mt-4 flex flex-wrap items-end gap-2 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-foreground/60">Name</span>
          <input name="name" required placeholder="e.g. Food, Alcohol, Rental" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-foreground/60">Rate (%)</span>
          <input name="ratePercent" type="number" step="0.01" min={0} max={100} required className={`${inputClass} w-28`} />
        </label>
        <button type="submit" disabled={pending} className="rounded-md bg-foreground px-4 py-2 font-medium text-background disabled:opacity-60">
          {pending ? "Adding…" : "Add tax rule"}
        </button>
        {state.error && (
          <span role="alert" className="text-red-500">
            {state.error}
          </span>
        )}
      </form>
    </div>
  );
}
