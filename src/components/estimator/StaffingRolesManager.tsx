"use client";

import { useActionState, useTransition } from "react";
import { createStaffingRole, toggleStaffingRoleActive, type SettingsActionState } from "@/app/estimator/(app)/settings/actions";

interface StaffingRoleItem {
  id: string;
  name: string;
  default_rate_per_hour: number | null;
  default_ratio_guests_per_staff: number | null;
  is_active: boolean;
}

const inputClass = "rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/40";

export function StaffingRolesManager({ roles }: { roles: StaffingRoleItem[] }) {
  const [state, formAction, pending] = useActionState<SettingsActionState, FormData>(createStaffingRole, {});
  const [isToggling, startTransition] = useTransition();

  return (
    <div>
      <table className="w-full max-w-xl border-collapse text-sm">
        <thead>
          <tr className="border-b border-foreground/10 text-left text-xs uppercase tracking-wide text-foreground/50">
            <th className="py-2 pr-4 font-medium">Name</th>
            <th className="py-2 pr-4 font-medium">Default rate/hr</th>
            <th className="py-2 pr-4 font-medium">Guests per staff</th>
            <th className="py-2 font-medium">Active</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <tr key={role.id} className="border-b border-foreground/5">
              <td className="py-2 pr-4">{role.name}</td>
              <td className="py-2 pr-4">{role.default_rate_per_hour != null ? `$${role.default_rate_per_hour.toFixed(2)}` : "—"}</td>
              <td className="py-2 pr-4">{role.default_ratio_guests_per_staff ?? "—"}</td>
              <td className="py-2">
                <input
                  type="checkbox"
                  checked={role.is_active}
                  disabled={isToggling}
                  onChange={(e) => {
                    const nextValue = e.target.checked;
                    startTransition(async () => {
                      await toggleStaffingRoleActive(role.id, nextValue);
                    });
                  }}
                />
              </td>
            </tr>
          ))}
          {roles.length === 0 && (
            <tr>
              <td colSpan={4} className="py-3 text-foreground/50">
                None yet — add one below.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <form action={formAction} className="mt-4 flex flex-wrap items-end gap-2 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-foreground/60">Role name</span>
          <input name="name" required placeholder="e.g. Server, Bartender" className={`${inputClass} w-40`} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-foreground/60">Default rate/hr ($)</span>
          <input name="defaultRatePerHour" type="number" step="0.01" min={0} className={`${inputClass} w-28`} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-foreground/60">Guests per staff</span>
          <input name="defaultRatioGuestsPerStaff" type="number" step="1" min={0} className={`${inputClass} w-28`} />
        </label>
        <button type="submit" disabled={pending} className="rounded-md bg-foreground px-4 py-2 font-medium text-background disabled:opacity-60">
          {pending ? "Adding…" : "Add role"}
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
