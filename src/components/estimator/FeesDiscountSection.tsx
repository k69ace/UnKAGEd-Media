"use client";

import { updateFeesAndDiscount } from "@/app/estimator/(app)/estimates/actions";
import { AutosaveSection, type SectionState } from "./AutosaveSection";
import type { EstimateDetail } from "@/lib/data/catering";

const inputClass = "rounded-md border border-foreground/15 bg-transparent px-3 py-2 outline-none focus:border-foreground/40";

export function FeesDiscountSection({ estimate, disabled }: { estimate: EstimateDetail; disabled: boolean }) {
  const action = async (_prev: SectionState, formData: FormData) => updateFeesAndDiscount(estimate.id, formData);

  return (
    <AutosaveSection
      action={action}
      initialState={{}}
      title="Fees &amp; Discounts"
      description="Service charge and gratuity are configured org-wide in Settings; the discount and profit target here are specific to this estimate."
      disabled={disabled}
    >
      <div className="grid grid-cols-2 gap-4 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-foreground/70">Discount amount ($)</span>
          <input name="discountAmount" type="number" step="0.01" min={0} defaultValue={estimate.discount_amount} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-foreground/70">Discount reason</span>
          <input name="discountReason" defaultValue={estimate.discount_reason ?? ""} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-foreground/70">Minimum spend required ($)</span>
          <input
            name="minimumSpendRequired"
            type="number"
            step="0.01"
            min={0}
            defaultValue={estimate.minimum_spend_required ?? ""}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-foreground/70">Profit target (%)</span>
          <input
            name="profitTargetPercent"
            type="number"
            step="0.1"
            min={0}
            max={100}
            defaultValue={estimate.profit_target_percent != null ? estimate.profit_target_percent * 100 : ""}
            className={inputClass}
          />
        </label>
      </div>
    </AutosaveSection>
  );
}
