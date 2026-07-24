"use client";

import { useActionState, useState, useTransition } from "react";
import {
  createPackageTemplate,
  togglePackageTemplateActive,
  addTemplateLineItem,
  deleteTemplateLineItem,
  type SettingsActionState,
  type TemplateLineItemInput,
} from "@/app/estimator/(app)/settings/actions";
import { CATEGORY_LABELS } from "@/lib/constants/catering";
import type { PackageTemplateWithLineItems } from "@/lib/data/catering";
import type { Database } from "@/lib/supabase/types";

type LineItemCategory = Database["public"]["Enums"]["line_item_category"];
type TaxRuleOption = { id: string; name: string };

const inputClass = "rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/40";
const ALL_CATEGORIES: LineItemCategory[] = Object.keys(CATEGORY_LABELS) as LineItemCategory[];

export function PackageTemplateManager({
  templates,
  taxRules,
}: {
  templates: PackageTemplateWithLineItems[];
  taxRules: TaxRuleOption[];
}) {
  const [state, formAction, pending] = useActionState<SettingsActionState, FormData>(createPackageTemplate, {});
  const [isToggling, startTransition] = useTransition();

  return (
    <div>
      <div className="flex flex-col gap-4">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            taxRules={taxRules}
            onToggleActive={(isActive) =>
              startTransition(async () => {
                await togglePackageTemplateActive(template.id, isActive);
              })
            }
            togglingDisabled={isToggling}
          />
        ))}
        {templates.length === 0 && <p className="text-sm text-foreground/50">No package templates yet — add one below.</p>}
      </div>

      <form action={formAction} className="mt-4 flex flex-wrap items-end gap-2 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-foreground/60">Template name</span>
          <input name="name" required className={`${inputClass} w-48`} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-foreground/60">Description</span>
          <input name="description" className={`${inputClass} w-56`} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-foreground/60">Base per-person price ($)</span>
          <input name="basePerPersonPrice" type="number" step="0.01" min={0} className={`${inputClass} w-32`} />
        </label>
        <button type="submit" disabled={pending} className="rounded-md bg-foreground px-4 py-2 font-medium text-background disabled:opacity-60">
          {pending ? "Adding…" : "Add template"}
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

function TemplateCard({
  template,
  taxRules,
  onToggleActive,
  togglingDisabled,
}: {
  template: PackageTemplateWithLineItems;
  taxRules: TaxRuleOption[];
  onToggleActive: (isActive: boolean) => void;
  togglingDisabled: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const items = [...template.catering_package_template_line_items].sort((a, b) => a.sort_order - b.sort_order);

  function handleAdd(formData: FormData) {
    const input: TemplateLineItemInput = {
      category: String(formData.get("category")) as LineItemCategory,
      description: String(formData.get("description") ?? "").trim(),
      quantity: Number(formData.get("quantity") ?? 1),
      unit: String(formData.get("unit") ?? "each"),
      unitPrice: Number(formData.get("unitPrice") ?? 0),
      unitCost: formData.get("unitCost") ? Number(formData.get("unitCost")) : null,
      isTaxable: formData.get("isTaxable") === "on",
      taxRuleId: String(formData.get("taxRuleId") ?? "") || null,
    };
    if (!input.description) {
      setError("Description is required.");
      return;
    }
    startTransition(async () => {
      const result = await addTemplateLineItem(template.id, input);
      setError(result.error ?? null);
    });
  }

  return (
    <details className="rounded-lg border border-foreground/10 p-4" open={items.length === 0}>
      <summary className="flex cursor-pointer items-center justify-between text-sm font-medium">
        <span>
          {template.name}
          {template.base_per_person_price != null && (
            <span className="ml-2 text-xs font-normal text-foreground/50">${template.base_per_person_price}/person</span>
          )}
        </span>
        <label className="flex items-center gap-1 text-xs font-normal" onClick={(e) => e.stopPropagation()}>
          Active
          <input
            type="checkbox"
            checked={template.is_active}
            disabled={togglingDisabled}
            onChange={(e) => onToggleActive(e.target.checked)}
          />
        </label>
      </summary>

      {items.length > 0 && (
        <table className="mt-3 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-foreground/10 text-left text-xs uppercase tracking-wide text-foreground/50">
              <th className="py-1 pr-2 font-medium">Category</th>
              <th className="py-1 pr-2 font-medium">Description</th>
              <th className="py-1 pr-2 font-medium">Qty</th>
              <th className="py-1 pr-2 font-medium">Price</th>
              <th className="py-1" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-foreground/5">
                <td className="py-1 pr-2 text-foreground/70">{CATEGORY_LABELS[item.category]}</td>
                <td className="py-1 pr-2">{item.description}</td>
                <td className="py-1 pr-2">
                  {item.quantity} {item.unit}
                </td>
                <td className="py-1 pr-2">${item.unit_price.toFixed(2)}</td>
                <td className="py-1">
                  <button
                    type="button"
                    onClick={() => startTransition(async () => { await deleteTemplateLineItem(template.id, item.id); })}
                    className="text-xs text-red-500"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <form action={handleAdd} className="mt-3 flex flex-wrap items-end gap-2 text-xs">
        <select name="category" defaultValue="menu_item" className={inputClass}>
          {ALL_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        <input name="description" placeholder="Description" required className={`${inputClass} w-40`} />
        <input name="quantity" type="number" step="0.01" defaultValue={1} placeholder="Qty" className={`${inputClass} w-16`} />
        <input name="unit" defaultValue="each" placeholder="Unit" className={`${inputClass} w-20`} />
        <input name="unitPrice" type="number" step="0.01" defaultValue={0} placeholder="Price" className={`${inputClass} w-20`} />
        <input name="unitCost" type="number" step="0.01" placeholder="Cost" className={`${inputClass} w-20`} />
        <label className="flex items-center gap-1">
          <input name="isTaxable" type="checkbox" defaultChecked /> Taxable
        </label>
        <select name="taxRuleId" className={inputClass}>
          <option value="">No tax</option>
          {taxRules.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <button type="submit" disabled={isPending} className="rounded-md bg-foreground px-3 py-1.5 font-medium text-background disabled:opacity-60">
          {isPending ? "Adding…" : "Add line item"}
        </button>
      </form>
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-500">
          {error}
        </p>
      )}
    </details>
  );
}
