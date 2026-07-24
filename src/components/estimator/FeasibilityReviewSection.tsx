"use client";

import { useState, useTransition } from "react";
import { markChefReviewed } from "@/app/estimator/(app)/estimates/actions";

export function FeasibilityReviewSection({
  estimateId,
  chefReviewedAt,
  canReview,
  disabled,
}: {
  estimateId: string;
  chefReviewedAt: string | null;
  canReview: boolean;
  disabled: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <section className="border-b border-foreground/10 py-6">
      <h2 className="text-base font-semibold">Feasibility Review</h2>
      <p className="mt-1 text-sm text-foreground/60">
        Your organization requires a chef to confirm this estimate is feasible before it&apos;s sent to the customer.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {chefReviewedAt ? (
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-600">
            Reviewed {new Date(chefReviewedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
          </span>
        ) : (
          <span className="rounded-full bg-amber-500/10 px-3 py-1 text-sm font-medium text-amber-600">
            Not yet reviewed
          </span>
        )}

        {!chefReviewedAt && canReview && !disabled && (
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const result = await markChefReviewed(estimateId);
                setError(result.error ?? null);
              })
            }
            className="rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background disabled:opacity-60"
          >
            {isPending ? "Saving…" : "Mark reviewed"}
          </button>
        )}
      </div>

      {!chefReviewedAt && !canReview && (
        <p className="mt-2 text-xs text-foreground/50">Only a chef, catering admin, or manager/owner can mark this reviewed.</p>
      )}

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-500">
          {error}
        </p>
      )}
    </section>
  );
}
