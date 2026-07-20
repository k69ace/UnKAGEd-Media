import type { Suggestion } from "@/lib/suggestions";

// AI suggestions are always clearly labeled as suggestions, never
// presented as fact, and never auto-applied — accepting one means the
// sales manager manually adds the line item themselves. Nothing here
// writes to the estimate.
export function SuggestionsPanel({ suggestions }: { suggestions: Suggestion[] }) {
  if (suggestions.length === 0) return null;

  return (
    <section className="border-b border-foreground/10 py-6">
      <h2 className="text-base font-semibold">Suggestions</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {suggestions.map((s, i) => (
          <li
            key={i}
            className="flex items-start gap-2 rounded-lg border border-foreground/10 bg-foreground/[0.03] px-3 py-2 text-sm"
          >
            <span className="mt-0.5 shrink-0 rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground/60">
              Suggestion
            </span>
            <span>{s.message}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
