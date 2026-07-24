"use client";

import { useActionState, useState, useTransition } from "react";
import { createInvite, revokeInvite, type CreateInviteResult } from "@/app/estimator/(app)/settings/actions";
import type { AppRole } from "@/lib/supabase/types";

interface PendingInvite {
  id: string;
  email: string | null;
  role: AppRole;
  token: string;
  expires_at: string;
  created_at: string;
}

const ROLE_OPTIONS: { value: AppRole; label: string }[] = [
  { value: "sales_manager", label: "Sales Manager" },
  { value: "chef", label: "Chef" },
  { value: "catering_admin", label: "Catering Admin" },
  { value: "manager_owner", label: "Manager/Owner" },
  { value: "reporting_readonly", label: "Reporting (read-only)" },
];

const initialState: CreateInviteResult = {};

export function InviteManager({ invites }: { invites: PendingInvite[] }) {
  const [state, formAction, pending] = useActionState(createInvite, initialState);
  const [isRevoking, startTransition] = useTransition();
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-wrap items-end gap-2 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-foreground/60">Email (optional)</span>
          <input
            name="email"
            type="email"
            placeholder="teammate@example.com"
            className="rounded-md border border-foreground/15 bg-transparent px-3 py-2 outline-none focus:border-foreground/40"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-foreground/60">Role</span>
          <select
            name="role"
            defaultValue="sales_manager"
            className="rounded-md border border-foreground/15 bg-transparent px-3 py-2 outline-none focus:border-foreground/40"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create invite link"}
        </button>
      </form>

      {state.error && (
        <p role="alert" className="text-sm text-red-500">
          {state.error}
        </p>
      )}

      {state.link && (
        <div className="flex items-center gap-2 rounded-md border border-foreground/10 bg-foreground/[0.03] px-3 py-2 text-sm">
          <code className="flex-1 overflow-x-auto whitespace-nowrap">{state.link}</code>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(state.link!);
              setCopied(true);
            }}
            className="shrink-0 rounded border border-foreground/15 px-2 py-1 text-xs"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}

      {invites.length > 0 && (
        <table className="w-full max-w-2xl border-collapse text-sm">
          <thead>
            <tr className="border-b border-foreground/10 text-left text-xs uppercase tracking-wide text-foreground/50">
              <th className="py-2 pr-4 font-medium">Email</th>
              <th className="py-2 pr-4 font-medium">Role</th>
              <th className="py-2 pr-4 font-medium">Expires</th>
              <th className="py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {invites.map((invite) => (
              <tr key={invite.id} className="border-b border-foreground/5">
                <td className="py-2 pr-4">{invite.email ?? <span className="text-foreground/50">Open link</span>}</td>
                <td className="py-2 pr-4">{ROLE_OPTIONS.find((r) => r.value === invite.role)?.label ?? invite.role}</td>
                <td className="py-2 pr-4 text-foreground/60">{new Date(invite.expires_at).toLocaleDateString("en-US")}</td>
                <td className="py-2">
                  <button
                    type="button"
                    disabled={isRevoking}
                    onClick={() =>
                      startTransition(async () => {
                        const result = await revokeInvite(invite.id);
                        setRevokeError(result.error ?? null);
                      })
                    }
                    className="text-xs text-red-500 underline underline-offset-2 disabled:opacity-60"
                  >
                    Revoke
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {revokeError && (
        <p role="alert" className="text-sm text-red-500">
          {revokeError}
        </p>
      )}
    </div>
  );
}
