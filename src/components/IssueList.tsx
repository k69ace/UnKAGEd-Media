import type { AgentId, Finding } from "@/lib/types";

export function IssueList({
  issues,
  onFixClick,
}: {
  issues: Finding[];
  onFixClick: (agentId: AgentId, finding: Finding) => void;
}) {
  if (issues.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
        <p className="font-medium text-green-700">No major issues found. Great work!</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Top issues to fix</h2>
      <ol className="space-y-4">
        {issues.map((issue, index) => (
          <li key={issue.id} className="flex items-start gap-3 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                issue.severity === "critical" ? "bg-red-500" : "bg-amber-500"
              }`}
            >
              {index + 1}
            </span>
            <div className="flex-1">
              <p className="font-medium text-slate-900">{issue.title}</p>
              <p className="text-sm text-slate-500">{issue.detail}</p>
              {issue.estimatedImpact && <p className="mt-0.5 text-xs italic text-slate-400">{issue.estimatedImpact}</p>}
              {issue.fixable && (
                <button
                  onClick={() => onFixClick(issue.agentId, issue)}
                  className="mt-2 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
                >
                  Fix it with AI →
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
