import Link from "next/link";
import { requireProfile } from "@/lib/auth/profile";
import { listAllLocations, listEstimatesForPipeline, listOrgConfig, listOrgMembers, type PipelineFilters } from "@/lib/data/catering";
import { calculateGrandTotal } from "@/lib/calculations/catering";
import { toCalcLineItem, toCalcTaxRule, serviceChargeConfigFromSettings, gratuityConfigFromSettings } from "@/lib/calculations/mappers";
import { PIPELINE_STATUSES } from "@/lib/constants/catering";
import { PipelineFiltersBar } from "@/components/estimator/PipelineFiltersBar";
import { PipelineBoard } from "@/components/estimator/PipelineBoard";

function money(value: number): string {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const profile = await requireProfile();

  const filters: PipelineFilters = {
    eventTypeId: params.eventTypeId || undefined,
    dateFrom: params.dateFrom || undefined,
    dateTo: params.dateTo || undefined,
    guestCountMin: params.guestCountMin ? Number(params.guestCountMin) : undefined,
    guestCountMax: params.guestCountMax ? Number(params.guestCountMax) : undefined,
    locationId: params.locationId || undefined,
    ownerId: params.ownerId || undefined,
  };

  const [estimates, config, locations, members] = await Promise.all([
    listEstimatesForPipeline(profile.organizationId, filters),
    listOrgConfig(profile.organizationId),
    listAllLocations(profile.organizationId),
    listOrgMembers(profile.organizationId),
  ]);

  const calcTaxRules = config.taxRules.map(toCalcTaxRule);
  const serviceCharge = serviceChargeConfigFromSettings(config.settings);
  const gratuity = gratuityConfigFromSettings(config.settings);

  const withTotals = estimates.map((e) => {
    const calcLineItems = e.catering_estimate_line_items.map(toCalcLineItem);
    const result = calculateGrandTotal({
      lineItems: calcLineItems,
      taxRules: calcTaxRules,
      discountAmount: e.discount_amount,
      serviceCharge,
      gratuity,
    });
    return { ...e, grandTotal: result.grandTotal, discountedSubtotal: result.discountedSubtotal };
  });

  const openPipelineValue = withTotals
    .filter((e) => e.status === "draft" || e.status === "sent" || e.status === "approved")
    .reduce((sum, e) => sum + e.grandTotal, 0);

  const won = withTotals.filter((e) => e.status === "won");
  const lost = withTotals.filter((e) => e.status === "lost");
  const winRate = won.length + lost.length > 0 ? won.length / (won.length + lost.length) : null;
  const avgDealSize = won.length > 0 ? won.reduce((sum, e) => sum + e.grandTotal, 0) / won.length : null;

  const now = new Date();
  const oneWeekOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingApproved = withTotals.filter(
    (e) => e.status === "approved" && e.event_date && new Date(e.event_date) >= now && new Date(e.event_date) <= oneWeekOut,
  ).length;

  const columns = PIPELINE_STATUSES.map((status) => ({
    status,
    items: withTotals.filter((e) => e.status === status),
  }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Pipeline</h1>
        <div className="flex items-center gap-3">
          <a
            href={`/estimator/pipeline/export?${new URLSearchParams(
              Object.fromEntries(Object.entries(params).filter(([, v]) => v)) as Record<string, string>,
            ).toString()}`}
            className="text-sm text-foreground/60 underline underline-offset-2"
          >
            Export CSV
          </a>
          <Link href="/estimator/estimates/new" className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background">
            New Estimate
          </Link>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="Open pipeline value" value={money(openPipelineValue)} />
        <KpiCard label="Win rate" value={winRate === null ? "—" : `${Math.round(winRate * 100)}%`} />
        <KpiCard label="Avg. deal size" value={avgDealSize === null ? "—" : money(avgDealSize)} />
        <KpiCard label="Approved events this week" value={String(upcomingApproved)} />
      </div>

      <div className="mb-6">
        <PipelineFiltersBar
          eventTypes={config.eventTypes}
          locations={locations}
          owners={members.map((m) => ({ id: m.id, full_name: m.full_name }))}
          defaults={{
            eventTypeId: params.eventTypeId,
            dateFrom: params.dateFrom,
            dateTo: params.dateTo,
            guestCountMin: params.guestCountMin,
            guestCountMax: params.guestCountMax,
            locationId: params.locationId,
            ownerId: params.ownerId,
          }}
        />
      </div>

      {withTotals.length === 0 ? (
        <p className="rounded-lg border border-dashed border-foreground/15 p-8 text-center text-sm text-foreground/60">
          No estimates yet.{" "}
          <Link href="/estimator/estimates/new" className="underline">
            Start your first estimate
          </Link>
          .
        </p>
      ) : (
        <PipelineBoard columns={columns} />
      )}
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-foreground/10 p-4">
      <p className="text-xs text-foreground/50">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
