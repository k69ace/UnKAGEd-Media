"use client";

import { updatePaymentSchedule } from "@/app/estimator/(app)/estimates/actions";
import { AutosaveSection, type SectionState } from "./AutosaveSection";
import type { EstimateDetail } from "@/lib/data/catering";

const inputClass = "rounded-md border border-foreground/15 bg-transparent px-3 py-2 outline-none focus:border-foreground/40";

export function PaymentScheduleSection({ estimate, disabled }: { estimate: EstimateDetail; disabled: boolean }) {
  const action = async (_prev: SectionState, formData: FormData) => updatePaymentSchedule(estimate.id, formData);

  return (
    <AutosaveSection action={action} initialState={{}} title="Payment Schedule" disabled={disabled}>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-foreground/70">Deposit amount ($)</span>
          <input name="depositAmount" type="number" step="0.01" min={0} defaultValue={estimate.deposit_amount ?? ""} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-foreground/70">Deposit due date</span>
          <input name="depositDueDate" type="date" defaultValue={estimate.deposit_due_date ?? ""} className={inputClass} />
        </label>
      </div>
      <p className="text-xs text-foreground/50">
        A detailed multi-installment schedule is on the roadmap — see Known Limitations. Deposit due + remaining balance is tracked today.
      </p>
    </AutosaveSection>
  );
}
