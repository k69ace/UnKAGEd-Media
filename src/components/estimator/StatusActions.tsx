"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changeEstimateStatus } from "@/app/estimator/(app)/estimates/actions";
import { STATUS_LABELS } from "@/lib/constants/catering";
import type { Database } from "@/lib/supabase/types";

type EstimateStatus = Database["public"]["Enums"]["estimate_status"];

const TRANSITIONS: Record<EstimateStatus, { to: EstimateStatus; label: string; tone: "primary" | "danger" }[]> = {
  draft: [{ to: "sent", label: "Send to customer", tone: "primary" }],
  sent: [
    { to: "approved", label: "Mark Approved", tone: "primary" },
    { to: "lost", label: "Mark Lost", tone: "danger" },
  ],
  approved: [
    { to: "won", label: "Mark Won", tone: "primary" },
    { to: "lost", label: "Mark Lost", tone: "danger" },
  ],
  won: [],
  lost: [{ to: "draft", label: "Reopen as Draft", tone: "primary" }],
  cancelled: [],
};

export function StatusActions({ estimateId, status }: { estimateId: string; status: EstimateStatus }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const transitions = TRANSITIONS[status];

  return (
    <section className="border-b border-foreground/10 py-6">
      <h2 className="text-base font-semibold">Review &amp; Send</h2>
      <p className="mt-1 text-sm text-foreground/60">
        Current status: <span className="font-medium text-foreground">{STATUS_LABELS[status]}</span>
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {transitions.map((t) => (
          <button
            key={t.to}
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const result = await changeEstimateStatus(estimateId, t.to);
                if (result.error) {
                  setError(result.error);
                } else {
                  setError(null);
                  router.refresh();
                }
              })
            }
            className={
              t.tone === "primary"
                ? "rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
                : "rounded-md border border-red-500/40 px-4 py-2 text-sm font-medium text-red-500 disabled:opacity-60"
            }
          >
            {isPending ? "Working…" : t.label}
          </button>
        ))}
        {transitions.length === 0 && <p className="text-sm text-foreground/50">No further status changes from here.</p>}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-500">
          {error}
        </p>
      )}
    </section>
  );
}
