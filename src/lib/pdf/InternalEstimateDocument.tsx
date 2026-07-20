import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { CATEGORY_LABELS, STATUS_LABELS } from "@/lib/constants/catering";
import { roundPercentForDisplay } from "@/lib/calculations/catering";
import type { EstimateDetail } from "@/lib/data/catering";
import type { EstimateSummary } from "@/lib/calculations/estimateSummary";

// Internal-only: manager/owner review copy. Includes unit cost, internal
// cost total, and contribution margin — never send this file to a
// customer. See CustomerProposalDocument for the customer-safe version.

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: "Helvetica", color: "#1a1a1a" },
  banner: { backgroundColor: "#1a1a1a", color: "#ffffff", padding: 6, marginBottom: 16, fontSize: 9, fontWeight: 700, textAlign: "center" },
  header: { marginBottom: 16 },
  title: { fontSize: 14, fontWeight: 700 },
  subtitle: { fontSize: 10, color: "#444444", marginTop: 2 },
  sectionTitle: { fontSize: 10, fontWeight: 700, marginTop: 14, marginBottom: 6 },
  table: { display: "flex", flexDirection: "column", borderTop: "1 solid #cccccc" },
  tableRow: { flexDirection: "row", borderBottom: "1 solid #eeeeee", paddingVertical: 3 },
  tableHeaderRow: { flexDirection: "row", borderBottom: "1 solid #1a1a1a", paddingVertical: 3 },
  colDescription: { flex: 3 },
  colNum: { flex: 1, textAlign: "right" },
  headerText: { fontSize: 7, fontWeight: 700, textTransform: "uppercase", color: "#666666" },
  totalsBlock: { marginTop: 14, alignSelf: "flex-end", width: 260 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  marginRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2, backgroundColor: "#f5f5f5" },
  grandTotalRow: { flexDirection: "row", justifyContent: "space-between", borderTop: "1 solid #1a1a1a", marginTop: 4, paddingTop: 4, fontWeight: 700 },
});

function money(value: number): string {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function InternalEstimateDocument({
  organizationName,
  estimate,
  summary,
}: {
  organizationName: string;
  estimate: EstimateDetail;
  summary: EstimateSummary;
}) {
  const items = [...estimate.catering_estimate_line_items].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <Document title={`Internal Estimate Sheet — ${estimate.customers?.name ?? "Customer"}`}>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.banner}>INTERNAL USE ONLY — DO NOT SEND TO CUSTOMER</Text>

        <View style={styles.header}>
          <Text style={styles.title}>{organizationName} — Internal Estimate Sheet</Text>
          <Text style={styles.subtitle}>
            {estimate.customers?.name ?? "—"} · {STATUS_LABELS[estimate.status]} · v{estimate.version} · {estimate.event_date ?? "no date set"}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Line Items</Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.colDescription, styles.headerText]}>Description</Text>
            <Text style={[styles.colNum, styles.headerText]}>Qty</Text>
            <Text style={[styles.colNum, styles.headerText]}>Price</Text>
            <Text style={[styles.colNum, styles.headerText]}>Cost</Text>
            <Text style={[styles.colNum, styles.headerText]}>Revenue</Text>
          </View>
          {items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.colDescription}>
                {CATEGORY_LABELS[item.category]}: {item.description}
              </Text>
              <Text style={styles.colNum}>{item.quantity}</Text>
              <Text style={styles.colNum}>{money(item.unit_price)}</Text>
              <Text style={styles.colNum}>{item.unit_cost != null ? money(item.unit_cost) : "—"}</Text>
              <Text style={styles.colNum}>{money(item.quantity * item.unit_price)}</Text>
            </View>
          ))}
        </View>

        {estimate.catering_estimate_staffing.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Staffing</Text>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.colDescription, styles.headerText]}>Role</Text>
                <Text style={[styles.colNum, styles.headerText]}>Qty</Text>
                <Text style={[styles.colNum, styles.headerText]}>Hours</Text>
                <Text style={[styles.colNum, styles.headerText]}>Rate</Text>
                <Text style={[styles.colNum, styles.headerText]}>Labor Cost</Text>
              </View>
              {estimate.catering_estimate_staffing.map((s) => (
                <View key={s.id} style={styles.tableRow}>
                  <Text style={styles.colDescription}>{s.staffing_roles?.name ?? "—"}</Text>
                  <Text style={styles.colNum}>{s.quantity}</Text>
                  <Text style={styles.colNum}>{s.hours}</Text>
                  <Text style={styles.colNum}>{money(s.rate_per_hour)}</Text>
                  <Text style={styles.colNum}>{money(s.quantity * s.hours * s.rate_per_hour)}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text>Subtotal</Text>
            <Text>{money(summary.subtotal)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>Discount</Text>
            <Text>-{money(summary.subtotal - summary.discountedSubtotal)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>Discounted subtotal</Text>
            <Text>{money(summary.discountedSubtotal)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>Tax</Text>
            <Text>{money(summary.taxTotal)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>Service charge</Text>
            <Text>{money(summary.serviceChargeAmount)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>Gratuity</Text>
            <Text>{money(summary.gratuityAmount)}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text>Grand Total</Text>
            <Text>{money(summary.grandTotal)}</Text>
          </View>

          <View style={styles.marginRow}>
            <Text>Internal cost total</Text>
            <Text>{money(summary.internalCostTotal)}</Text>
          </View>
          <View style={styles.marginRow}>
            <Text>Contribution margin $</Text>
            <Text>{money(summary.contributionMarginDollar)}</Text>
          </View>
          <View style={styles.marginRow}>
            <Text>Contribution margin %</Text>
            <Text>{summary.contributionMarginPercent === null ? "—" : `${roundPercentForDisplay(summary.contributionMarginPercent)}%`}</Text>
          </View>
        </View>

        {estimate.internal_notes && (
          <View>
            <Text style={styles.sectionTitle}>Internal Notes</Text>
            <Text>{estimate.internal_notes}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
