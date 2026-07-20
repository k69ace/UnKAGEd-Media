"use client";

import { useTransition } from "react";
import { createNewVersionForEditing } from "@/app/estimator/(app)/estimates/actions";
import { STATUS_LABELS } from "@/lib/constants/catering";
import type { Database } from "@/lib/supabase/types";

type EstimateStatus = Database["public"]["Enums"]["estimate_status"];

export function NewVersionBanner({ estimateId, status }: { estimateId: string; status: EstimateStatus }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="mb-6 flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
      <p>
        This estimate is <strong>{STATUS_LABELS[status]}</strong> and is read-only. Editing it will create a new
        version and preserve this one in history.
      </p>
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => createNewVersionForEditing(estimateId))}
        className="shrink-0 rounded-md bg-foreground px-3 py-1.5 font-medium text-background disabled:opacity-60"
      >
        {isPending ? "Creating…" : "Edit (new version)"}
      </button>
    </div>
  );
}
