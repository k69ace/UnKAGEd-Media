"use client";

import { updateNotes } from "@/app/estimator/(app)/estimates/actions";
import { AutosaveSection, type SectionState } from "./AutosaveSection";
import type { EstimateDetail } from "@/lib/data/catering";

const textareaClass = "rounded-md border border-foreground/15 bg-transparent px-3 py-2 outline-none focus:border-foreground/40";

export function NotesSection({ estimate, disabled }: { estimate: EstimateDetail; disabled: boolean }) {
  const action = async (_prev: SectionState, formData: FormData) => updateNotes(estimate.id, formData);

  return (
    <AutosaveSection action={action} initialState={{}} title="Notes" disabled={disabled}>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-foreground/70">Customer-facing notes</span>
          <textarea name="customerFacingNotes" rows={4} defaultValue={estimate.customer_facing_notes ?? ""} className={textareaClass} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-foreground/70">Internal notes</span>
          <textarea name="internalNotes" rows={4} defaultValue={estimate.internal_notes ?? ""} className={textareaClass} />
          <span className="text-xs text-foreground/50">Never shown on the customer proposal.</span>
        </label>
      </div>
    </AutosaveSection>
  );
}
