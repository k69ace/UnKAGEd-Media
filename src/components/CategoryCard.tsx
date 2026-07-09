import type { AgentResult, Finding } from "@/lib/types";

function scoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
}

function severityStyles(severity: Finding["severity"]): { dot: string; label: string } {
  switch (severity) {
    case "critical":
      return { dot: "bg-red-500", label: "text-red-700" };
    case "warning":
      return { dot: "bg-amber-500", label: "text-amber-700" };
    case "good":
      return { dot: "bg-green-500", label: "text-green-700" };
    default:
      return { dot: "bg-slate-400", label: "text-slate-600" };
  }
}

function DataSourceBadge({ dataSource }: { dataSource: AgentResult["dataSource"] }) {
  if (dataSource === "live") {
    return <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-green-200">Live data</span>;
  }
  if (dataSource === "estimated") {
    return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">Estimated</span>;
  }
  return null;
}

export function CategoryCard({
  agent,
  onFixClick,
}: {
  agent: AgentResult;
  onFixClick: (agentId: AgentResult["agentId"], finding: Finding) => void;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-900">{agent.label}</h3>
        <span className={`text-xl font-bold ${scoreColor(agent.score)}`}>{agent.status === "ok" ? agent.score : "—"}</span>
      </div>
      <div className="mb-3 flex items-center gap-2">
        <DataSourceBadge dataSource={agent.dataSource} />
      </div>
      <p className="mb-3 text-sm text-slate-600">{agent.summary}</p>
      {agent.findings.length > 0 && (
        <ul className="space-y-2">
          {agent.findings.map((finding) => {
            const styles = severityStyles(finding.severity);
            return (
              <li key={finding.id} className="flex items-start gap-2 text-sm">
                <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${styles.dot}`} />
                <div className="flex-1">
                  <p className={`font-medium ${styles.label}`}>{finding.title}</p>
                  <p className="text-slate-500">{finding.detail}</p>
                  {finding.estimatedImpact && <p className="mt-0.5 text-xs italic text-slate-400">{finding.estimatedImpact}</p>}
                  {finding.fixable && (
                    <button
                      onClick={() => onFixClick(agent.agentId, finding)}
                      className="mt-1.5 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                    >
                      Fix it with AI →
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
