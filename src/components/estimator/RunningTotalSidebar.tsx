import type { EstimateSummary } from "@/lib/calculations/estimateSummary";
import { roundPercentForDisplay } from "@/lib/calculations/catering";

function money(value: number | null): string {
  if (value === null) return "—";
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

/**
 * Persistent totals sidebar, visible while building the estimate. Shows
 * customer-facing pricing and internal cost/margin side by side (per the
 * "internal review view" requirement) — this is the internal builder, not
 * the customer proposal, so margin data is expected here. It must never
 * appear on a customer-facing export (see the PDF export module).
 */
export function RunningTotalSidebar({ summary }: { summary: EstimateSummary }) {
  return (
    <aside className="sticky top-6 flex flex-col gap-4 rounded-lg border border-foreground/10 p-4 text-sm">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-foreground/50">Customer-facing total</h2>
        <dl className="mt-2 flex flex-col gap-1.5">
          <Row label="Subtotal" value={money(summary.subtotal)} />
          <Row label="Discount" value={money(summary.subtotal - summary.discountedSubtotal)} />
          <Row label="Tax" value={money(summary.taxTotal)} />
          <Row label="Service charge" value={money(summary.serviceChargeAmount)} />
          <Row label="Gratuity" value={money(summary.gratuityAmount)} />
          <Row label="Grand total" value={money(summary.grandTotal)} strong />
          <Row label="Per person" value={money(summary.perPersonPrice)} />
          {summary.depositRemaining !== null && <Row label="Balance due" value={money(summary.depositRemaining)} />}
        </dl>
      </div>

      <div className="border-t border-foreground/10 pt-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-foreground/50">Internal — cost &amp; margin</h2>
        <dl className="mt-2 flex flex-col gap-1.5">
          <Row label="Internal cost" value={money(summary.internalCostTotal)} />
          <Row label="Contribution margin" value={money(summary.contributionMarginDollar)} />
          <Row
            label="Margin %"
            value={summary.contributionMarginPercent === null ? "—" : `${roundPercentForDisplay(summary.contributionMarginPercent)}%`}
          />
        </dl>
      </div>
    </aside>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 ${strong ? "text-base font-semibold" : ""}`}>
      <dt className="text-foreground/60">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
