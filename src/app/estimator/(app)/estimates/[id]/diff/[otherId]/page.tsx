import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth/profile";
import { getEstimate, listOrgConfig } from "@/lib/data/catering";
import { computeEstimateSummary } from "@/lib/calculations/estimateSummary";
import { diffEstimateFields, diffLineItems, diffStaffing, type DiffStatus } from "@/lib/diff/estimateDiff";
import { CATEGORY_LABELS, STATUS_LABELS } from "@/lib/constants/catering";

function money(value: number | null): string {
  if (value === null) return "—";
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function displayValue(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "number") return v.toLocaleString("en-US");
  return String(v);
}

const STATUS_STYLES: Record<DiffStatus, string> = {
  added: "bg-emerald-500/10 text-emerald-600",
  removed: "bg-red-500/10 text-red-500",
  changed: "bg-amber-500/10 text-amber-600",
  unchanged: "text-foreground/50",
};

export default async function EstimateDiffPage({ params }: { params: Promise<{ id: string; otherId: string }> }) {
  const { id, otherId } = await params;
  const profile = await requireProfile();

  const [estimateA, estimateB] = await Promise.all([getEstimate(id).catch(() => null), getEstimate(otherId).catch(() => null)]);
  if (!estimateA || !estimateB) notFound();
  if (estimateA.organization_id !== profile.organizationId || estimateB.organization_id !== profile.organizationId) notFound();

  const [before, after] = estimateA.version <= estimateB.version ? [estimateA, estimateB] : [estimateB, estimateA];

  const config = await listOrgConfig(profile.organizationId);
  const staffingRoleName = (id: string) => config.staffingRoles.find((r) => r.id === id)?.name ?? "Unknown role";

  const summaryBefore = computeEstimateSummary(
    before,
    before.catering_estimate_line_items,
    before.catering_estimate_staffing,
    config.taxRules,
    config.settings,
  );
  const summaryAfter = computeEstimateSummary(
    after,
    after.catering_estimate_line_items,
    after.catering_estimate_staffing,
    config.taxRules,
    config.settings,
  );

  const fieldRows = diffEstimateFields(before, after);
  const lineItemRows = diffLineItems(before.catering_estimate_line_items, after.catering_estimate_line_items);
  const staffingRows = diffStaffing(before.catering_estimate_staffing, after.catering_estimate_staffing);
  const grandTotalDelta = summaryAfter.grandTotal - summaryBefore.grandTotal;

  return (
    <div>
      <Link href={`/estimator/estimates/${after.id}`} className="text-sm text-foreground/50 hover:underline">
        ← Back to estimate
      </Link>
      <h1 className="mt-1 text-xl font-semibold">
        Comparing v{before.version} ({STATUS_LABELS[before.status]}) → v{after.version} ({STATUS_LABELS[after.status]})
      </h1>

      <section className="mt-6 rounded-lg border border-foreground/10 p-4 text-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-foreground/60">Grand total</span>
          <span className="text-base font-semibold">
            {money(summaryBefore.grandTotal)} → {money(summaryAfter.grandTotal)}{" "}
            <span className={grandTotalDelta === 0 ? "text-foreground/50" : grandTotalDelta > 0 ? "text-emerald-600" : "text-red-500"}>
              ({grandTotalDelta >= 0 ? "+" : ""}
              {money(grandTotalDelta)})
            </span>
          </span>
        </div>
      </section>

      <section className="mt-6 border-b border-foreground/10 py-6">
        <h2 className="text-base font-semibold">Event details &amp; terms</h2>
        {fieldRows.length === 0 ? (
          <p className="mt-2 text-sm text-foreground/50">No changes.</p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <tbody>
              {fieldRows.map((row) => (
                <tr key={row.field} className="border-b border-foreground/5">
                  <td className="py-1.5 pr-4 text-foreground/60">{row.label}</td>
                  <td className="py-1.5 pr-4">{displayValue(row.before)}</td>
                  <td className="py-1.5">→ {displayValue(row.after)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="border-b border-foreground/10 py-6">
        <h2 className="text-base font-semibold">Line items</h2>
        {lineItemRows.length === 0 ? (
          <p className="mt-2 text-sm text-foreground/50">No line items on either version.</p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-foreground/50">
                <th className="pb-1 pr-4">Item</th>
                <th className="pb-1 pr-4">Qty</th>
                <th className="pb-1 pr-4">Unit price</th>
                <th className="pb-1">Status</th>
              </tr>
            </thead>
            <tbody>
              {lineItemRows.map((row) => (
                <tr key={`${row.key}-${row.status}-${row.quantityBefore}-${row.quantityAfter}`} className="border-b border-foreground/5">
                  <td className="py-1.5 pr-4">
                    <span className="text-foreground/50">{CATEGORY_LABELS[row.category]}</span> {row.description}
                  </td>
                  <td className="py-1.5 pr-4">
                    {row.quantityBefore ?? "—"} {row.status === "changed" && `→ ${row.quantityAfter}`}
                  </td>
                  <td className="py-1.5 pr-4">
                    {money(row.unitPriceBefore)} {row.status === "changed" && `→ ${money(row.unitPriceAfter)}`}
                  </td>
                  <td className="py-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[row.status]}`}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="py-6">
        <h2 className="text-base font-semibold">Staffing</h2>
        {staffingRows.length === 0 ? (
          <p className="mt-2 text-sm text-foreground/50">No staffing on either version.</p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-foreground/50">
                <th className="pb-1 pr-4">Role</th>
                <th className="pb-1 pr-4">Qty</th>
                <th className="pb-1 pr-4">Hours</th>
                <th className="pb-1 pr-4">Rate</th>
                <th className="pb-1">Status</th>
              </tr>
            </thead>
            <tbody>
              {staffingRows.map((row) => (
                <tr key={`${row.key}-${row.status}-${row.quantityBefore}-${row.quantityAfter}`} className="border-b border-foreground/5">
                  <td className="py-1.5 pr-4">{staffingRoleName(row.staffingRoleId)}</td>
                  <td className="py-1.5 pr-4">
                    {row.quantityBefore ?? "—"} {row.status === "changed" && `→ ${row.quantityAfter}`}
                  </td>
                  <td className="py-1.5 pr-4">
                    {row.hoursBefore ?? "—"} {row.status === "changed" && `→ ${row.hoursAfter}`}
                  </td>
                  <td className="py-1.5 pr-4">
                    {money(row.rateBefore)} {row.status === "changed" && `→ ${money(row.rateAfter)}`}
                  </td>
                  <td className="py-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[row.status]}`}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
