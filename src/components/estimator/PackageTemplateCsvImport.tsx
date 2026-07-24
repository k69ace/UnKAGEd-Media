"use client";

import { useActionState } from "react";
import { importPackageTemplateCsv, type ImportPackageTemplateState } from "@/app/estimator/(app)/settings/actions";

const inputClass = "rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/40";

const EXAMPLE_CSV = `Category,Description,Quantity,Unit,Unit Price,Unit Cost,Taxable,Tax Rule
Menu item,Herb Roasted Chicken,1,per person,45.00,17.00,Yes,Food
Alcohol,Hosted Beer & Wine Bar,1,per person,22.00,9.00,Yes,Alcohol
Delivery,Delivery & load-in,1,flat,350.00,120.00,No,`;

export function PackageTemplateCsvImport() {
  const [state, formAction, pending] = useActionState<ImportPackageTemplateState, FormData>(importPackageTemplateCsv, {});

  return (
    <details className="rounded-lg border border-foreground/10 p-4">
      <summary className="cursor-pointer text-sm font-medium">Import a template from CSV</summary>

      <p className="mt-3 text-xs text-foreground/60">
        Columns, in order: <code>Category, Description, Quantity, Unit, Unit Price, Unit Cost, Taxable, Tax Rule</code>.
        Category can be the display name (&quot;Menu item&quot;) or the raw key (&quot;menu_item&quot;). Taxable is
        Yes/No. Tax Rule must exactly match an active tax rule&apos;s name in this organization, or be left blank
        for untaxed. The whole file is validated before anything is imported — one bad row rejects the whole file
        with every error listed, not a partial import.
      </p>

      <pre className="mt-2 overflow-x-auto rounded bg-foreground/5 p-2 text-xs">{EXAMPLE_CSV}</pre>

      <form action={formAction} className="mt-3 flex flex-wrap items-end gap-2 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-foreground/60">New template name</span>
          <input name="templateName" required className={`${inputClass} w-48`} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-foreground/60">CSV file</span>
          <input name="file" type="file" accept=".csv,text/csv" required className="text-xs" />
        </label>
        <button type="submit" disabled={pending} className="rounded-md bg-foreground px-4 py-2 font-medium text-background disabled:opacity-60">
          {pending ? "Importing…" : "Import"}
        </button>
      </form>

      {state.success && (
        <p role="status" className="mt-2 text-sm text-green-600">
          Imported successfully — the new template appears in the list above.
        </p>
      )}
      {state.error && (
        <p role="alert" className="mt-2 text-sm text-red-500">
          {state.error}
        </p>
      )}
      {state.errors && state.errors.length > 0 && (
        <div role="alert" className="mt-2 text-sm text-red-500">
          <p>Nothing was imported — fix these and try again:</p>
          <ul className="mt-1 list-disc pl-5">
            {state.errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}
    </details>
  );
}
