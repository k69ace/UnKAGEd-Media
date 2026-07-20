"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changeEstimateStatus } from "@/app/estimator/(app)/estimates/actions";
import { PIPELINE_STATUSES, STATUS_LABELS } from "@/lib/constants/catering";
import type { Database } from "@/lib/supabase/types";

type EstimateStatus = Database["public"]["Enums"]["estimate_status"];

// Dropdown status control — the accessible fallback for the pipeline
// board's status changes (no drag-and-drop implemented; see Known
// Limitations). Works from a keyboard and a screen reader identically to
// every other select on the page.
export function PipelineStatusSelect({ estimateId, status }: { estimateId: string; status: EstimateStatus }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div>
      <select
        aria-label="Change status"
        value={status}
        disabled={isPending}
        onChange={(e) => {
          const newStatus = e.target.value as EstimateStatus;
          startTransition(async () => {
            const result = await changeEstimateStatus(estimateId, newStatus);
            if (result.error) {
              setError(result.error);
            } else {
              setError(null);
              router.refresh();
            }
          });
        }}
        className="rounded border border-foreground/15 bg-transparent px-2 py-1 text-xs"
      >
        {[...PIPELINE_STATUSES, "cancelled" as const].map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
