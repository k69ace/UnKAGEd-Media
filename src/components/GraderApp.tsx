"use client";

import { useState } from "react";
import type { AgentId, Finding, ScanInput, ScanResult } from "@/lib/types";
import { ScanForm } from "./ScanForm";
import { AgentProgress } from "./AgentProgress";
import { ResultsDashboard } from "./ResultsDashboard";
import { FixPanel } from "./FixPanel";

type ViewState =
  | { status: "idle" }
  | { status: "scanning" }
  | { status: "done"; result: ScanResult }
  | { status: "error"; message: string };

export function GraderApp() {
  const [view, setView] = useState<ViewState>({ status: "idle" });
  const [fixTarget, setFixTarget] = useState<{ agentId: AgentId; finding: Finding } | null>(null);

  async function handleScan(input: ScanInput) {
    setView({ status: "scanning" });
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "The scan failed. Please try again.");
      }
      const result = (await res.json()) as ScanResult;
      setView({ status: "done", result });
    } catch (err) {
      setView({ status: "error", message: err instanceof Error ? err.message : "Something went wrong." });
    }
  }

  return (
    <main className="flex-1 bg-slate-50 px-4 py-12">
      {view.status !== "done" && (
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Restaurant Grader</h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-500">
            AI-powered diagnostic for your restaurant&apos;s website, Google Business Profile, reviews, and photos —
            with actionable, one-click AI fixes.
          </p>
        </div>
      )}

      {view.status === "idle" && <ScanForm onSubmit={handleScan} disabled={false} />}
      {view.status === "scanning" && <AgentProgress />}
      {view.status === "error" && (
        <div className="mx-auto max-w-xl space-y-4">
          <p className="rounded-xl bg-red-50 p-4 text-center text-sm text-red-700 ring-1 ring-red-200">{view.message}</p>
          <ScanForm onSubmit={handleScan} disabled={false} />
        </div>
      )}
      {view.status === "done" && (
        <div className="space-y-8">
          <ResultsDashboard result={view.result} onFixClick={(agentId, finding) => setFixTarget({ agentId, finding })} />
          <div className="text-center">
            <button
              onClick={() => setView({ status: "idle" })}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Scan another restaurant
            </button>
          </div>
        </div>
      )}

      {fixTarget && view.status === "done" && (
        <FixPanel
          agentId={fixTarget.agentId}
          finding={fixTarget.finding}
          scanInput={view.result.input}
          onClose={() => setFixTarget(null)}
        />
      )}
    </main>
  );
}
