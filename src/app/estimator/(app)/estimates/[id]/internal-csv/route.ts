import { loadEstimateForExport } from "@/lib/pdf/loadEstimateForExport";
import { toCsv } from "@/lib/export/csv";
import { CATEGORY_LABELS } from "@/lib/constants/catering";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { estimate } = await loadEstimateForExport(id);

  const headers = ["Category", "Description", "Quantity", "Unit", "Unit Price", "Unit Cost", "Line Total", "Line Cost", "Taxable"];
  const rows = [...estimate.catering_estimate_line_items]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item) => [
      CATEGORY_LABELS[item.category],
      item.description,
      item.quantity,
      item.unit,
      item.unit_price.toFixed(2),
      item.unit_cost != null ? item.unit_cost.toFixed(2) : "",
      (item.quantity * item.unit_price).toFixed(2),
      item.unit_cost != null ? (item.quantity * item.unit_cost).toFixed(2) : "",
      item.is_taxable ? "Yes" : "No",
    ]);

  const staffingHeaders = ["Role", "Quantity", "Hours", "Rate/hr", "Labor Cost"];
  const staffingRows = estimate.catering_estimate_staffing.map((s) => [
    s.staffing_roles?.name ?? "",
    s.quantity,
    s.hours,
    s.rate_per_hour.toFixed(2),
    (s.quantity * s.hours * s.rate_per_hour).toFixed(2),
  ]);

  const csv =
    toCsv(headers, rows) + "\r\n" + toCsv(staffingHeaders, staffingRows);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="internal-estimate-${id}.csv"`,
    },
  });
}
