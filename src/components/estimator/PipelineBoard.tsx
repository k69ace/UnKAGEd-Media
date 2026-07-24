"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { changeEstimateStatus } from "@/app/estimator/(app)/estimates/actions";
import { PipelineStatusSelect } from "@/components/estimator/PipelineStatusSelect";
import { STATUS_LABELS } from "@/lib/constants/catering";
import type { Database } from "@/lib/supabase/types";

type EstimateStatus = Database["public"]["Enums"]["estimate_status"];

export interface PipelineCard {
  id: string;
  status: EstimateStatus;
  customers: { name: string } | null;
  event_types: { name: string } | null;
  event_date: string | null;
  grandTotal: number;
  guest_count_guaranteed: number | null;
  guest_count_estimated: number | null;
  version: number;
  created_by_profile: { full_name: string } | null;
}

function money(value: number): string {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

// Drag-and-drop is layered on top of the PipelineStatusSelect dropdown on
// every card, which stays as the accessible fallback (WCAG 2.5.7 requires
// a non-dragging alternative for any dragging-movement interaction) --
// removing it was never on the table, only adding to it. Both paths call
// the exact same changeEstimateStatus, so a drag to an invalid column
// (e.g. skipping required Send validation) surfaces the identical error
// the dropdown already would.
export function PipelineBoard({ columns }: { columns: { status: EstimateStatus; items: PipelineCard[] }[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<EstimateStatus | null>(null);
  const router = useRouter();

  function handleDrop(newStatus: EstimateStatus, estimateId: string) {
    startTransition(async () => {
      const result = await changeEstimateStatus(estimateId, newStatus);
      if (result.error) {
        setError(result.error);
      } else {
        setError(null);
        router.refresh();
      }
    });
  }

  return (
    <div>
      {error && (
        <p role="alert" className="mb-3 text-sm text-red-500">
          {error}
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 overflow-x-auto sm:grid-cols-3 lg:grid-cols-5">
        {columns.map((col) => (
          <div
            key={col.status}
            className={`min-w-[220px] rounded-lg ${dragOverStatus === col.status ? "bg-foreground/[0.04]" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStatus(col.status);
            }}
            onDragLeave={() => setDragOverStatus((s) => (s === col.status ? null : s))}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverStatus(null);
              const estimateId = e.dataTransfer.getData("text/plain");
              if (!estimateId) return;
              handleDrop(col.status, estimateId);
            }}
          >
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/50">
              {STATUS_LABELS[col.status]} ({col.items.length})
            </h2>
            <div className="flex flex-col gap-2">
              {col.items.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", item.id)}
                  className="cursor-grab rounded-lg border border-foreground/10 p-3 text-sm active:cursor-grabbing"
                  aria-disabled={isPending}
                >
                  <Link href={`/estimator/estimates/${item.id}`} className="font-medium hover:underline">
                    {item.customers?.name ?? "—"}
                  </Link>
                  <p className="text-xs text-foreground/50">{item.event_types?.name ?? "No event type"}</p>
                  <p className="text-xs text-foreground/50">{item.event_date ?? "No date set"}</p>
                  <p className="mt-1 font-semibold">{money(item.grandTotal)}</p>
                  <p className="text-xs text-foreground/50">
                    {item.guest_count_guaranteed ?? item.guest_count_estimated ?? "—"} guests · v{item.version}
                  </p>
                  {item.created_by_profile && <p className="text-xs text-foreground/40">{item.created_by_profile.full_name}</p>}
                  <div className="mt-2">
                    <PipelineStatusSelect estimateId={item.id} status={item.status} />
                  </div>
                </div>
              ))}
              {col.items.length === 0 && <p className="text-xs text-foreground/30">Nothing here.</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
