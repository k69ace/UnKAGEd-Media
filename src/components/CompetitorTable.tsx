import type { CompetitorSnapshot } from "@/lib/types";

function standingBadge(standing: CompetitorSnapshot["standing"]) {
  switch (standing) {
    case "ahead":
      return <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-green-200">You&apos;re ahead</span>;
    case "behind":
      return <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-200">Outranking you</span>;
    default:
      return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">Even</span>;
  }
}

export function CompetitorTable({ competitors }: { competitors: CompetitorSnapshot[] }) {
  if (competitors.length === 0) return null;

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Nearby competitors</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
              <th className="py-2 pr-4">Restaurant</th>
              <th className="py-2 pr-4">Rating</th>
              <th className="py-2 pr-4">Reviews</th>
              <th className="py-2 pr-4">Standing</th>
            </tr>
          </thead>
          <tbody>
            {competitors.map((c) => (
              <tr key={c.name} className="border-b border-slate-50 last:border-0">
                <td className="py-2.5 pr-4 font-medium text-slate-900">{c.name}</td>
                <td className="py-2.5 pr-4 text-slate-600">{c.rating.toFixed(1)} ★</td>
                <td className="py-2.5 pr-4 text-slate-600">{c.reviewCount.toLocaleString()}</td>
                <td className="py-2.5 pr-4">{standingBadge(c.standing)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
