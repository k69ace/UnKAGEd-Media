"use client";

import { useState, useTransition } from "react";
import { updatePaymentInstallments, type PaymentInstallmentInput } from "@/app/estimator/(app)/estimates/actions";
import { parsePaymentSchedule } from "@/lib/calculations/catering";

const inputClass = "rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/40";

export function PaymentInstallmentsEditor({
  estimateId,
  paymentScheduleJson,
  grandTotal,
  disabled,
}: {
  estimateId: string;
  paymentScheduleJson: unknown;
  grandTotal: number;
  disabled: boolean;
}) {
  const [installments, setInstallments] = useState<PaymentInstallmentInput[]>(() =>
    parsePaymentSchedule(paymentScheduleJson).map((e) => ({ amount: e.amount, dueDate: e.dueDate, paid: e.paid ?? false })),
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const scheduledTotal = installments.reduce((sum, i) => sum + (Number.isFinite(i.amount) ? i.amount : 0), 0);

  function update(index: number, patch: Partial<PaymentInstallmentInput>) {
    setSaved(false);
    setInstallments((prev) => prev.map((inst, i) => (i === index ? { ...inst, ...patch } : inst)));
  }

  function addRow() {
    setSaved(false);
    setInstallments((prev) => [...prev, { amount: 0, dueDate: "", paid: false }]);
  }

  function removeRow(index: number) {
    setSaved(false);
    setInstallments((prev) => prev.filter((_, i) => i !== index));
  }

  function save() {
    startTransition(async () => {
      const result = await updatePaymentInstallments(estimateId, installments);
      setError(result.error ?? null);
      setSaved(!result.error);
    });
  }

  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium">Installment schedule</h3>
      <p className="mt-1 text-xs text-foreground/50">
        Optional — add multiple payments beyond the initial deposit above. Scheduled: ${scheduledTotal.toFixed(2)} of $
        {grandTotal.toFixed(2)} grand total.
      </p>

      {installments.length > 0 && (
        <table className="mt-3 w-full max-w-lg border-collapse text-sm">
          <thead>
            <tr className="border-b border-foreground/10 text-left text-xs uppercase tracking-wide text-foreground/50">
              <th className="py-1 pr-3 font-medium">Amount</th>
              <th className="py-1 pr-3 font-medium">Due date</th>
              <th className="py-1 pr-3 font-medium">Paid</th>
              <th className="py-1" />
            </tr>
          </thead>
          <tbody>
            {installments.map((inst, i) => (
              <tr key={i} className="border-b border-foreground/5">
                <td className="py-1 pr-3">
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={inst.amount}
                    disabled={disabled}
                    onChange={(e) => update(i, { amount: Number(e.target.value) })}
                    className={`${inputClass} w-28`}
                  />
                </td>
                <td className="py-1 pr-3">
                  <input
                    type="date"
                    value={inst.dueDate}
                    disabled={disabled}
                    onChange={(e) => update(i, { dueDate: e.target.value })}
                    className={inputClass}
                  />
                </td>
                <td className="py-1 pr-3 text-center">
                  <input
                    type="checkbox"
                    checked={inst.paid}
                    disabled={disabled}
                    onChange={(e) => update(i, { paid: e.target.checked })}
                  />
                </td>
                <td className="py-1">
                  {!disabled && (
                    <button type="button" onClick={() => removeRow(i)} className="text-xs text-red-500">
                      ✕
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!disabled && (
        <div className="mt-3 flex items-center gap-3 text-sm">
          <button type="button" onClick={addRow} className="rounded-md border border-foreground/15 px-3 py-1.5 text-xs">
            Add installment
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={save}
            className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background disabled:opacity-60"
          >
            {isPending ? "Saving…" : "Save schedule"}
          </button>
          {saved && !error && <span className="text-xs text-foreground/40">Saved</span>}
          {error && (
            <span role="alert" className="text-xs text-red-500">
              {error}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
