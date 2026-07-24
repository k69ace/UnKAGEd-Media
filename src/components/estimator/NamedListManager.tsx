"use client";

import { useActionState, useTransition } from "react";
import type { SettingsActionState } from "@/app/estimator/(app)/settings/actions";

interface NamedItem {
  id: string;
  name: string;
  is_active: boolean;
}

const inputClass = "rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/40";

// Shared list-with-active-toggle pattern for event types and service
// styles — both are just { name, is_active } org-scoped lookup lists, so
// one component covers both rather than duplicating TaxRulesManager's
// shape twice more.
export function NamedListManager({
  items,
  itemLabel,
  createAction,
  toggleAction,
}: {
  items: NamedItem[];
  itemLabel: string;
  createAction: (prevState: SettingsActionState, formData: FormData) => Promise<SettingsActionState>;
  toggleAction: (id: string, isActive: boolean) => Promise<{ error?: string }>;
}) {
  const [state, formAction, pending] = useActionState<SettingsActionState, FormData>(createAction, {});
  const [isToggling, startTransition] = useTransition();

  return (
    <div>
      <table className="w-full max-w-sm border-collapse text-sm">
        <thead>
          <tr className="border-b border-foreground/10 text-left text-xs uppercase tracking-wide text-foreground/50">
            <th className="py-2 font-medium">Name</th>
            <th className="py-2 font-medium">Active</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-foreground/5">
              <td className="py-2">{item.name}</td>
              <td className="py-2">
                <input
                  type="checkbox"
                  checked={item.is_active}
                  disabled={isToggling}
                  onChange={(e) => {
                    const nextValue = e.target.checked;
                    startTransition(async () => {
                      await toggleAction(item.id, nextValue);
                    });
                  }}
                />
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={2} className="py-3 text-foreground/50">
                None yet — add one below.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <form action={formAction} className="mt-4 flex flex-wrap items-end gap-2 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-foreground/60">{itemLabel} name</span>
          <input name="name" required className={`${inputClass} w-48`} />
        </label>
        <button type="submit" disabled={pending} className="rounded-md bg-foreground px-4 py-2 font-medium text-background disabled:opacity-60">
          {pending ? "Adding…" : `Add ${itemLabel.toLowerCase()}`}
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
