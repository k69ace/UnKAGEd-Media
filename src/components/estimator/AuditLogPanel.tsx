import type { AuditLogEntry } from "@/lib/data/catering";

const ACTION_LABELS: Record<string, string> = {
  created: "Estimate created",
  status_changed: "Status changed",
  post_approval_edit: "Edited after approval",
};

export function summarizeChanges(action: string, changes: unknown): string | null {
  if (!changes || typeof changes !== "object") return null;
  const c = changes as Record<string, unknown>;

  if (action === "status_changed" && "to_status" in c) {
    const from = c.from_status ? String(c.from_status) : "(new)";
    return `${from} → ${String(c.to_status)}`;
  }

  if (action === "post_approval_edit") {
    const parts: string[] = [];
    for (const [field, value] of Object.entries(c)) {
      if (value && typeof value === "object" && "from" in value && "to" in value) {
        const v = value as { from: unknown; to: unknown };
        if (v.from !== v.to) parts.push(`${field}: ${String(v.from ?? "—")} → ${String(v.to ?? "—")}`);
      }
    }
    return parts.length > 0 ? parts.join("; ") : null;
  }

  return null;
}

// audit_log is populated by database triggers, not application code, so
// this panel can never silently be out of sync with what actually
// happened -- every status change and every post-approval edit is here
// whether or not the UI path that caused it remembered to log anything.
export function AuditLogPanel({ entries }: { entries: AuditLogEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <details className="border-b border-foreground/10 py-6">
      <summary className="cursor-pointer text-base font-semibold">Activity Log ({entries.length})</summary>
      <ul className="mt-4 flex flex-col gap-2 text-sm">
        {entries.map((entry) => {
          const summary = summarizeChanges(entry.action, entry.changes);
          return (
            <li key={entry.id} className="flex flex-wrap items-baseline gap-x-2 border-b border-foreground/5 pb-2">
              <span className="font-medium">{ACTION_LABELS[entry.action] ?? entry.action}</span>
              {summary && <span className="text-foreground/70">{summary}</span>}
              <span className="text-xs text-foreground/50">
                {entry.actor_name ?? "System"} ·{" "}
                {new Date(entry.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
              </span>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
