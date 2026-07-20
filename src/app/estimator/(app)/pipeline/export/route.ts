import { requireProfile } from "@/lib/auth/profile";
import { listEstimatesForExport, listOrgConfig, type PipelineFilters } from "@/lib/data/catering";
import { calculateGrandTotal, contributionMarginDollar, contributionMarginPercent, internalCostTotal, roundPercentForDisplay } from "@/lib/calculations/catering";
import { toCalcLineItem, toCalcStaffing, toCalcTaxRule, serviceChargeConfigFromSettings, gratuityConfigFromSettings } from "@/lib/calculations/mappers";
import { STATUS_LABELS } from "@/lib/constants/catering";
import { toCsv } from "@/lib/export/csv";

export async function GET(request: Request) {
  const profile = await requireProfile();
  const url = new URL(request.url);

  const filters: PipelineFilters = {
    eventTypeId: url.searchParams.get("eventTypeId") || undefined,
    dateFrom: url.searchParams.get("dateFrom") || undefined,
    dateTo: url.searchParams.get("dateTo") || undefined,
    guestCountMin: url.searchParams.get("guestCountMin") ? Number(url.searchParams.get("guestCountMin")) : undefined,
    guestCountMax: url.searchParams.get("guestCountMax") ? Number(url.searchParams.get("guestCountMax")) : undefined,
  };

  const [estimates, config] = await Promise.all([
    listEstimatesForExport(profile.organizationId, filters),
    listOrgConfig(profile.organizationId),
  ]);

  const calcTaxRules = config.taxRules.map(toCalcTaxRule);
  const serviceCharge = serviceChargeConfigFromSettings(config.settings);
  const gratuity = gratuityConfigFromSettings(config.settings);

  const headers = ["Customer", "Status", "Event date", "Guest count", "Value", "Internal cost", "Margin $", "Margin %", "Owner", "Created at"];
  const rows = estimates.map((e) => {
    const calcLineItems = e.catering_estimate_line_items.map(toCalcLineItem);
    const calcStaffing = e.catering_estimate_staffing.map(toCalcStaffing);
    const result = calculateGrandTotal({
      lineItems: calcLineItems,
      taxRules: calcTaxRules,
      discountAmount: e.discount_amount,
      serviceCharge,
      gratuity,
    });
    const cost = internalCostTotal(calcLineItems, calcStaffing);
    const marginDollar = contributionMarginDollar(result.discountedSubtotal, cost);
    const marginPercent = contributionMarginPercent(marginDollar, result.discountedSubtotal);

    return [
      e.customers?.name ?? "",
      STATUS_LABELS[e.status],
      e.event_date ?? "",
      e.guest_count_guaranteed ?? e.guest_count_estimated ?? "",
      result.grandTotal.toFixed(2),
      cost.toFixed(2),
      marginDollar.toFixed(2),
      marginPercent === null ? "" : `${roundPercentForDisplay(marginPercent)}%`,
      e.created_by_profile?.full_name ?? "",
      e.created_at,
    ];
  });

  const csv = toCsv(headers, rows);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pipeline-export.csv"`,
    },
  });
}
