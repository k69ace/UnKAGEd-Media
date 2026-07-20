"use client";

import { useState, useTransition } from "react";
import { applyPackageTemplate } from "@/app/estimator/(app)/estimates/actions";
import type { PackageTemplateWithLineItems } from "@/lib/data/catering";

export function PackageTemplatePicker({
  estimateId,
  templates,
}: {
  estimateId: string;
  templates: PackageTemplateWithLineItems[];
}) {
  const [selected, setSelected] = useState(templates[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (templates.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap items-end gap-2 rounded-lg border border-foreground/10 bg-foreground/[0.03] p-3 text-sm">
      <label className="flex flex-col gap-1">
        <span className="text-xs text-foreground/60">Apply a package template</span>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="rounded-md border border-foreground/15 bg-transparent px-3 py-2"
        >
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
              {t.base_per_person_price ? ` — $${t.base_per_person_price}/person` : ""}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        disabled={isPending || !selected}
        onClick={() =>
          startTransition(async () => {
            const result = await applyPackageTemplate(estimateId, selected);
            setError(result.error ?? null);
          })
        }
        className="rounded-md bg-foreground px-3 py-2 font-medium text-background disabled:opacity-60"
      >
        {isPending ? "Applying…" : "Apply template"}
      </button>
      {error && (
        <span role="alert" className="text-red-500">
          {error}
        </span>
      )}
    </div>
  );
}
