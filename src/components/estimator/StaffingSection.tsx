"use client";

import { useState, useTransition } from "react";
import { addStaffing, deleteStaffing, type StaffingInput } from "@/app/estimator/(app)/estimates/actions";
import type { Database } from "@/lib/supabase/types";

type StaffingRow = Database["public"]["Tables"]["catering_estimate_staffing"]["Row"] & {
  staffing_roles: { name: string } | null;
};
type StaffingRoleOption = { id: string; name: string; default_rate_per_hour: number | null };

const inputClass = "w-full rounded border border-foreground/15 bg-transparent px-2 py-1 text-sm outline-none focus:border-foreground/40";

export function StaffingSection({
  estimateId,
  staffing,
  staffingRoles,
  guestCountEstimated,
  disabled,
}: {
  estimateId: string;
  staffing: StaffingRow[];
  staffingRoles: StaffingRoleOption[];
  guestCountEstimated: number | null;
  disabled: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    const roleId = String(formData.get("staffingRoleId") ?? "");
    if (!roleId) {
      setError("Choose a role.");
      return;
    }
    const input: StaffingInput = {
      staffingRoleId: roleId,
      quantity: Number(formData.get("quantity") ?? 1),
      hours: Number(formData.get("hours") ?? 0),
      ratePerHour: Number(formData.get("ratePerHour") ?? 0),
      notes: String(formData.get("notes") ?? "") || null,
    };
    startTransition(async () => {
      const result = await addStaffing(estimateId, input);
      setError(result.error ?? null);
    });
  }

  const suggestedRole = staffingRoles.find((r) => r.name === "Server");

  return (
    <section className="border-b border-foreground/10 py-6">
      <h2 className="text-base font-semibold">Staffing</h2>
      {guestCountEstimated !== null && guestCountEstimated > 50 && staffing.length === 0 && (
        <p className="mt-1 text-sm text-amber-600" role="status">
          No staffing line item yet for an estimate over 50 guests — confirm this is intentional.
        </p>
      )}

      {staffing.length > 0 && (
        <table className="mt-4 w-full max-w-2xl border-collapse text-sm">
          <thead>
            <tr className="border-b border-foreground/10 text-left text-xs uppercase tracking-wide text-foreground/50">
              <th className="py-2 pr-2 font-medium">Role</th>
              <th className="py-2 pr-2 font-medium">Qty</th>
              <th className="py-2 pr-2 font-medium">Hours</th>
              <th className="py-2 pr-2 font-medium">Rate/hr</th>
              <th className="py-2 pr-2 font-medium">Notes</th>
              <th className="py-2 font-medium">Total</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {staffing.map((s) => (
              <tr key={s.id} className="border-b border-foreground/5">
                <td className="py-2 pr-2">{s.staffing_roles?.name ?? "—"}</td>
                <td className="py-2 pr-2">{s.quantity}</td>
                <td className="py-2 pr-2">{s.hours}</td>
                <td className="py-2 pr-2">${s.rate_per_hour.toFixed(2)}</td>
                <td className="py-2 pr-2 text-foreground/60">{s.notes ?? "—"}</td>
                <td className="py-2 tabular-nums">${(s.quantity * s.hours * s.rate_per_hour).toFixed(2)}</td>
                <td className="py-2">
                  {!disabled && (
                    <button
                      type="button"
                      aria-label="Remove staffing line"
                      onClick={() => startTransition(async () => { await deleteStaffing(estimateId, s.id); })}
                      className="text-xs text-red-500"
                    >
                      ✕
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!disabled && (
        <form action={handleSubmit} className="mt-4 flex flex-wrap items-end gap-2 text-sm">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-foreground/60">Role</span>
            <select name="staffingRoleId" defaultValue={suggestedRole?.id ?? ""} className={inputClass}>
              <option value="">Select…</option>
              {staffingRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-foreground/60">Qty</span>
            <input name="quantity" type="number" step="1" min={1} defaultValue={1} className={`${inputClass} w-16`} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-foreground/60">Hours</span>
            <input name="hours" type="number" step="0.25" defaultValue={4} className={`${inputClass} w-20`} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-foreground/60">Rate/hr</span>
            <input
              name="ratePerHour"
              type="number"
              step="0.01"
              defaultValue={suggestedRole?.default_rate_per_hour ?? 0}
              className={`${inputClass} w-24`}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-foreground/60">Notes</span>
            <input name="notes" className={`${inputClass} w-40`} />
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
      )}
    </section>
  );
}
