"use client";

import { useState, useTransition } from "react";
import {
  addLineItem,
  deleteLineItem,
  moveLineItem,
  reorderLineItem,
  updateLineItem,
  type LineItemInput,
} from "@/app/estimator/(app)/estimates/actions";
import { CATEGORY_LABELS } from "@/lib/constants/catering";
import type { Database } from "@/lib/supabase/types";

type LineItemCategory = Database["public"]["Enums"]["line_item_category"];
type LineItemRow = Database["public"]["Tables"]["catering_estimate_line_items"]["Row"];
type TaxRuleOption = { id: string; name: string; rate: number };

const inputClass = "w-full rounded border border-foreground/15 bg-transparent px-2 py-1 text-sm outline-none focus:border-foreground/40";

export function LineItemsSection({
  estimateId,
  title,
  description,
  categories,
  lineItems,
  taxRules,
  disabled,
}: {
  estimateId: string;
  title: string;
  description?: string;
  categories: LineItemCategory[];
  lineItems: LineItemRow[];
  taxRules: TaxRuleOption[];
  disabled: boolean;
}) {
  const items = lineItems.filter((li) => categories.includes(li.category)).sort((a, b) => a.sort_order - b.sort_order);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  return (
    <section className="border-b border-foreground/10 py-6">
      <h2 className="text-base font-semibold">{title}</h2>
      {description && <p className="mt-1 text-sm text-foreground/60">{description}</p>}

      {items.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-foreground/10 text-left text-xs uppercase tracking-wide text-foreground/50">
                <th className="py-2 pr-2 font-medium" />
                <th className="py-2 pr-2 font-medium">Category</th>
                <th className="py-2 pr-2 font-medium">Description</th>
                <th className="py-2 pr-2 font-medium">Qty</th>
                <th className="py-2 pr-2 font-medium">Unit</th>
                <th className="py-2 pr-2 font-medium">Price</th>
                <th className="py-2 pr-2 font-medium">Cost</th>
                <th className="py-2 pr-2 font-medium">Taxable</th>
                <th className="py-2 pr-2 font-medium">Tax rule</th>
                <th className="py-2 font-medium">Total</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <LineItemRowEditor
                  key={item.id}
                  estimateId={estimateId}
                  item={item}
                  categories={categories}
                  taxRules={taxRules}
                  disabled={disabled}
                  canMoveUp={i > 0}
                  canMoveDown={i < items.length - 1}
                  targetIndex={i}
                  isDragOver={dragOverId === item.id}
                  onDragOverRow={(id) => setDragOverId(id)}
                  onDragEndRow={() => setDragOverId(null)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!disabled && <AddLineItemForm estimateId={estimateId} categories={categories} taxRules={taxRules} />}
    </section>
  );
}

function LineItemRowEditor({
  estimateId,
  item,
  categories,
  taxRules,
  disabled,
  canMoveUp,
  canMoveDown,
  targetIndex,
  isDragOver,
  onDragOverRow,
  onDragEndRow,
}: {
  estimateId: string;
  item: LineItemRow;
  categories: LineItemCategory[];
  taxRules: TaxRuleOption[];
  disabled: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  targetIndex: number;
  isDragOver: boolean;
  onDragOverRow: (id: string) => void;
  onDragEndRow: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [savedError, setSavedError] = useState<string | null>(null);

  function save(patch: Partial<LineItemInput>) {
    startTransition(async () => {
      const result = await updateLineItem(estimateId, item.id, patch);
      setSavedError(result.error ?? null);
    });
  }

  return (
    <tr
      className={`border-b border-foreground/5 align-top ${isDragOver ? "bg-foreground/[0.06]" : ""}`}
      onDragOver={(e) => {
        if (disabled) return;
        e.preventDefault();
        onDragOverRow(item.id);
      }}
      onDragLeave={() => onDragEndRow()}
      onDrop={(e) => {
        if (disabled) return;
        e.preventDefault();
        onDragEndRow();
        const draggedId = e.dataTransfer.getData("text/plain");
        if (!draggedId || draggedId === item.id) return;
        startTransition(async () => {
          await moveLineItem(estimateId, draggedId, categories, targetIndex);
        });
      }}
    >
      <td className="py-2 pr-2 text-foreground/30">
        {!disabled && (
          <span
            draggable
            onDragStart={(e) => e.dataTransfer.setData("text/plain", item.id)}
            onDragEnd={() => onDragEndRow()}
            aria-hidden="true"
            title="Drag to reorder"
            className="inline-block cursor-grab select-none px-1 active:cursor-grabbing"
          >
            ⠿
          </span>
        )}
      </td>
      <td className="py-2 pr-2 text-foreground/70">{CATEGORY_LABELS[item.category]}</td>
      <td className="py-2 pr-2">
        <input
          defaultValue={item.description}
          disabled={disabled}
          onBlur={(e) => e.target.value !== item.description && save({ description: e.target.value })}
          className={inputClass}
        />
      </td>
      <td className="py-2 pr-2">
        <input
          type="number"
          step="0.01"
          defaultValue={item.quantity}
          disabled={disabled}
          onBlur={(e) => save({ quantity: Number(e.target.value) })}
          className={`${inputClass} w-20`}
        />
      </td>
      <td className="py-2 pr-2">
        <input
          defaultValue={item.unit}
          disabled={disabled}
          onBlur={(e) => e.target.value !== item.unit && save({ unit: e.target.value })}
          className={`${inputClass} w-20`}
        />
      </td>
      <td className="py-2 pr-2">
        <input
          type="number"
          step="0.01"
          defaultValue={item.unit_price}
          disabled={disabled}
          onBlur={(e) => save({ unitPrice: Number(e.target.value) })}
          className={`${inputClass} w-24`}
        />
      </td>
      <td className="py-2 pr-2">
        <input
          type="number"
          step="0.01"
          defaultValue={item.unit_cost ?? ""}
          disabled={disabled}
          onBlur={(e) => save({ unitCost: e.target.value ? Number(e.target.value) : null })}
          className={`${inputClass} w-24`}
        />
      </td>
      <td className="py-2 pr-2 text-center">
        <input
          type="checkbox"
          defaultChecked={item.is_taxable}
          disabled={disabled}
          onChange={(e) => save({ isTaxable: e.target.checked })}
        />
      </td>
      <td className="py-2 pr-2">
        <select
          defaultValue={item.tax_rule_id ?? ""}
          disabled={disabled}
          onChange={(e) => save({ taxRuleId: e.target.value || null })}
          className={inputClass}
        >
          <option value="">None</option>
          {taxRules.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </td>
      <td className="py-2 tabular-nums">{(item.quantity * item.unit_price).toLocaleString("en-US", { style: "currency", currency: "USD" })}</td>
      <td className="py-2 pl-2">
        {!disabled && (
          <div className="flex items-center gap-1 text-xs">
            <button
              type="button"
              aria-label="Move up"
              disabled={!canMoveUp}
              onClick={() => startTransition(async () => { await reorderLineItem(estimateId, item.id, "up", categories); })}
              className="disabled:opacity-30"
            >
              ↑
            </button>
            <button
              type="button"
              aria-label="Move down"
              disabled={!canMoveDown}
              onClick={() => startTransition(async () => { await reorderLineItem(estimateId, item.id, "down", categories); })}
              className="disabled:opacity-30"
            >
              ↓
            </button>
            <button
              type="button"
              aria-label="Remove line item"
              onClick={() => startTransition(async () => { await deleteLineItem(estimateId, item.id); })}
              className="text-red-500"
            >
              ✕
            </button>
          </div>
        )}
        {isPending && <span className="block text-foreground/40">Saving…</span>}
        {savedError && (
          <span role="alert" className="block text-red-500">
            {savedError}
          </span>
        )}
      </td>
    </tr>
  );
}

function AddLineItemForm({
  estimateId,
  categories,
  taxRules,
}: {
  estimateId: string;
  categories: LineItemCategory[];
  taxRules: TaxRuleOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    const input: LineItemInput = {
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
      const result = await addLineItem(estimateId, input);
      setError(result.error ?? null);
    });
  }

  return (
    <form action={handleSubmit} className="mt-4 flex flex-wrap items-end gap-2 text-sm">
      <label className="flex flex-col gap-1">
        <span className="text-xs text-foreground/60">Category</span>
        <select name="category" defaultValue={categories[0]} className={inputClass}>
          {categories.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-foreground/60">Description</span>
        <input name="description" required className={`${inputClass} w-48`} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-foreground/60">Qty</span>
        <input name="quantity" type="number" step="0.01" defaultValue={1} className={`${inputClass} w-16`} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-foreground/60">Unit</span>
        <input name="unit" defaultValue="each" className={`${inputClass} w-20`} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-foreground/60">Price</span>
        <input name="unitPrice" type="number" step="0.01" defaultValue={0} className={`${inputClass} w-24`} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-foreground/60">Cost</span>
        <input name="unitCost" type="number" step="0.01" className={`${inputClass} w-24`} />
      </label>
      <label className="flex items-center gap-1 pb-2">
        <input name="isTaxable" type="checkbox" defaultChecked />
        <span className="text-xs text-foreground/60">Taxable</span>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-foreground/60">Tax rule</span>
        <select name="taxRuleId" className={inputClass}>
          <option value="">None</option>
          {taxRules.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" disabled={isPending} className="rounded-md bg-foreground px-3 py-1.5 font-medium text-background disabled:opacity-60">
        {isPending ? "Adding…" : "Add"}
      </button>
      {error && (
        <span role="alert" className="text-red-500">
          {error}
        </span>
      )}
    </form>
  );
}
