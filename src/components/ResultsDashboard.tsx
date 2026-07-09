import type { AgentId, Finding, ScanResult } from "@/lib/types";
import { ScoreGauge } from "./ScoreGauge";
import { CategoryCard } from "./CategoryCard";
import { IssueList } from "./IssueList";
import { CompetitorTable } from "./CompetitorTable";
import { LeadCaptureCard } from "./LeadCaptureCard";

function DataModeBanner({ dataMode }: { dataMode: ScanResult["dataMode"] }) {
  if (dataMode === "live") return null;
  return (
    <div className="mx-auto max-w-3xl rounded-xl bg-amber-50 px-4 py-3 text-center text-sm text-amber-800 ring-1 ring-amber-200">
      {dataMode === "demo"
        ? "Running in demo mode — connect GOOGLE_PLACES_API_KEY (and optionally GOOGLE_PAGESPEED_API_KEY / ANTHROPIC_API_KEY) for fully live data."
        : "Some sections are using estimated data — connect API keys for fully live results."}
    </div>
  );
}

export function ResultsDashboard({
  result,
  onFixClick,
}: {
  result: ScanResult;
  onFixClick: (agentId: AgentId, finding: Finding) => void;
}) {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <DataModeBanner dataMode={result.dataMode} />

      <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 sm:flex-row sm:justify-center sm:gap-10">
        <ScoreGauge score={result.overallScore} grade={result.grade} />
        <div className="text-left">
          <h1 className="text-2xl font-bold text-slate-900">{result.input.restaurantName}</h1>
          {result.input.location && <p className="text-slate-500">{result.input.location}</p>}
          <p className="mt-2 max-w-sm text-sm text-slate-500">
            Your online health score is based on your website, Google Business Profile, reviews, photos, local SEO, and
            competitors.
          </p>
        </div>
      </div>

      <LeadCaptureCard
        scanId={result.scanId}
        scanInput={result.input}
        overallScore={result.overallScore}
        topIssueTitle={result.topIssues[0]?.title}
      />

      <IssueList issues={result.topIssues} onFixClick={onFixClick} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {result.agents.map((agent) => (
          <CategoryCard key={agent.agentId} agent={agent} onFixClick={onFixClick} />
        ))}
      </div>

      <CompetitorTable competitors={result.competitors} />
    </div>
  );
}
