import type { EstimateDetail } from "@/lib/data/catering";

// Guest count changes matter for billing disputes -- "guaranteed 150,
// client says they only guaranteed 120" is exactly the kind of thing that
// needs a timestamped, attributed record, not just the current value.
// Every insert/update to catering_estimates writes a row here via a
// database trigger (see supabase/migrations/...005), so this is a
// complete history, not a best-effort log the app remembers to write.
export function GuestCountHistory({ history }: { history: EstimateDetail["catering_estimate_guest_count_history"] }) {
  if (history.length <= 1) return null;

  const sorted = [...history].sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());

  return (
    <details className="border-b border-foreground/10 py-6">
      <summary className="cursor-pointer text-base font-semibold">Guest Count History ({sorted.length} changes)</summary>
      <table className="mt-4 w-full max-w-xl border-collapse text-sm">
        <thead>
          <tr className="border-b border-foreground/10 text-left text-xs uppercase tracking-wide text-foreground/50">
            <th className="py-2 pr-4 font-medium">When</th>
            <th className="py-2 pr-4 font-medium">By</th>
            <th className="py-2 pr-4 font-medium">Estimated</th>
            <th className="py-2 font-medium">Guaranteed</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((entry) => (
            <tr key={entry.id} className="border-b border-foreground/5">
              <td className="py-2 pr-4 text-foreground/70">
                {new Date(entry.changed_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
              </td>
              <td className="py-2 pr-4 text-foreground/70">{entry.profiles?.full_name ?? "—"}</td>
              <td className="py-2 pr-4">{entry.guest_count_estimated ?? "—"}</td>
              <td className="py-2">{entry.guest_count_guaranteed ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
