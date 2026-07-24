"use client";

import { useState, useTransition } from "react";
import { updateMemberRole, toggleMemberActive } from "@/app/estimator/(app)/settings/actions";
import type { AppRole } from "@/lib/supabase/types";

interface Member {
  id: string;
  full_name: string;
  email: string;
  role: AppRole;
  is_active: boolean;
}

const ROLE_OPTIONS: { value: AppRole; label: string }[] = [
  { value: "sales_manager", label: "Sales Manager" },
  { value: "chef", label: "Chef" },
  { value: "catering_admin", label: "Catering Admin" },
  { value: "manager_owner", label: "Manager/Owner" },
  { value: "reporting_readonly", label: "Reporting (read-only)" },
];

// This section manages whoever's already in the org: change role, or
// deactivate someone who's left. A deactivated profile actually loses
// access (enforced in Postgres via current_organization_id() /
// current_app_role(), not just hidden in this UI) once
// supabase/migrations/...007_enforce_profile_active.sql is applied. New
// teammates land here either by accepting an invite link (see
// InviteManager, right above this section) or by signing up on their own,
// which still creates a brand-new organization.
export function TeamManager({ members, currentProfileId }: { members: Member[]; currentProfileId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <table className="w-full max-w-2xl border-collapse text-sm">
        <thead>
          <tr className="border-b border-foreground/10 text-left text-xs uppercase tracking-wide text-foreground/50">
            <th className="py-2 pr-4 font-medium">Name</th>
            <th className="py-2 pr-4 font-medium">Email</th>
            <th className="py-2 pr-4 font-medium">Role</th>
            <th className="py-2 font-medium">Active</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id} className="border-b border-foreground/5">
              <td className="py-2 pr-4">
                {member.full_name}
                {member.id === currentProfileId && <span className="ml-1 text-xs text-foreground/40">(you)</span>}
              </td>
              <td className="py-2 pr-4 text-foreground/60">{member.email}</td>
              <td className="py-2 pr-4">
                <select
                  defaultValue={member.role}
                  disabled={isPending}
                  onChange={(e) => {
                    const newRole = e.target.value;
                    startTransition(async () => {
                      const result = await updateMemberRole(member.id, newRole);
                      setError(result.error ?? null);
                    });
                  }}
                  className="rounded border border-foreground/15 bg-transparent px-2 py-1 text-xs"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </td>
              <td className="py-2">
                <input
                  type="checkbox"
                  checked={member.is_active}
                  disabled={isPending || member.id === currentProfileId}
                  onChange={(e) => {
                    const nextValue = e.target.checked;
                    startTransition(async () => {
                      const result = await toggleMemberActive(member.id, nextValue);
                      setError(result.error ?? null);
                    });
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
