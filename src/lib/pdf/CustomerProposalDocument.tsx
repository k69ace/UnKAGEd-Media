import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { CATEGORY_LABELS } from "@/lib/constants/catering";
import { parsePaymentSchedule } from "@/lib/calculations/catering";
import type { EstimateDetail } from "@/lib/data/catering";
import type { EstimateSummary } from "@/lib/calculations/estimateSummary";

// Customer-facing proposal. This component must NEVER receive or render
// unit_cost, contribution margin, or internal_notes — there is no prop
// for them, by design, so a future edit can't accidentally leak internal
// numbers onto a document a customer sees. See InternalEstimateDocument
// for the internal-only equivalent.

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a" },
  header: { marginBottom: 20, borderBottom: "2 solid #1a1a1a", paddingBottom: 12 },
  orgName: { fontSize: 18, fontWeight: 700 },
  title: { fontSize: 14, marginTop: 4, color: "#444444" },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  metaBlock: { flexDirection: "column", gap: 2 },
  metaLabel: { fontSize: 8, color: "#666666", textTransform: "uppercase" },
  metaValue: { fontSize: 10 },
  sectionTitle: { fontSize: 11, fontWeight: 700, marginTop: 16, marginBottom: 6 },
  table: { display: "flex", flexDirection: "column", borderTop: "1 solid #cccccc" },
  tableRow: { flexDirection: "row", borderBottom: "1 solid #eeeeee", paddingVertical: 4 },
  tableHeaderRow: { flexDirection: "row", borderBottom: "1 solid #1a1a1a", paddingVertical: 4 },
  colDescription: { flex: 4 },
  colQty: { flex: 1, textAlign: "right" },
  colPrice: { flex: 1.5, textAlign: "right" },
  colTotal: { flex: 1.5, textAlign: "right" },
  headerText: { fontSize: 8, fontWeight: 700, textTransform: "uppercase", color: "#666666" },
  totalsBlock: { marginTop: 16, alignSelf: "flex-end", width: 240 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  totalsLabel: { color: "#444444" },
  grandTotalRow: { flexDirection: "row", justifyContent: "space-between", borderTop: "1 solid #1a1a1a", marginTop: 4, paddingTop: 4 },
  grandTotalLabel: { fontWeight: 700 },
  notes: { marginTop: 16, fontSize: 9, color: "#444444" },
  signature: { marginTop: 36, flexDirection: "row", gap: 40 },
  signatureLine: { borderTop: "1 solid #1a1a1a", marginTop: 24, paddingTop: 4, width: 200, fontSize: 8, color: "#666666" },
});

function money(value: number): string {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function CustomerProposalDocument({
  organizationName,
  estimate,
  summary,
}: {
  organizationName: string;
  estimate: EstimateDetail;
  summary: EstimateSummary;
}) {
  const items = [...estimate.catering_estimate_line_items].sort((a, b) => a.sort_order - b.sort_order);
  const installments = parsePaymentSchedule(estimate.payment_schedule_json);

  return (
    <Document title={`Catering Proposal — ${estimate.customers?.name ?? "Customer"}`}>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.orgName}>{organizationName}</Text>
          <Text style={styles.title}>Catering Proposal</Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>Prepared for</Text>
            <Text style={styles.metaValue}>{estimate.customers?.name ?? "—"}</Text>
            {estimate.customers?.company_name && <Text style={styles.metaValue}>{estimate.customers.company_name}</Text>}
            {estimate.contacts && (
              <Text style={styles.metaValue}>
                {estimate.contacts.first_name} {estimate.contacts.last_name}
              </Text>
            )}
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>Event date</Text>
            <Text style={styles.metaValue}>{estimate.event_date ?? "TBD"}</Text>
            <Text style={styles.metaLabel}>Venue</Text>
            <Text style={styles.metaValue}>{estimate.venue_name ?? "TBD"}</Text>
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>Guest count</Text>
            <Text style={styles.metaValue}>{estimate.guest_count_guaranteed ?? estimate.guest_count_estimated ?? "TBD"}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Itemized Estimate</Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.colDescription, styles.headerText]}>Description</Text>
            <Text style={[styles.colQty, styles.headerText]}>Qty</Text>
            <Text style={[styles.colPrice, styles.headerText]}>Price</Text>
            <Text style={[styles.colTotal, styles.headerText]}>Total</Text>
          </View>
          {items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.colDescription}>
                {CATEGORY_LABELS[item.category]}: {item.description}
              </Text>
              <Text style={styles.colQty}>
                {item.quantity} {item.unit}
              </Text>
              <Text style={styles.colPrice}>{money(item.unit_price)}</Text>
              <Text style={styles.colTotal}>{money(item.quantity * item.unit_price)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text>{money(summary.subtotal)}</Text>
          </View>
          {summary.subtotal !== summary.discountedSubtotal && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Discount</Text>
              <Text>-{money(summary.subtotal - summary.discountedSubtotal)}</Text>
            </View>
          )}
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Tax</Text>
            <Text>{money(summary.taxTotal)}</Text>
          </View>
          {summary.serviceChargeAmount > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Service charge</Text>
              <Text>{money(summary.serviceChargeAmount)}</Text>
            </View>
          )}
          {summary.gratuityAmount > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Gratuity</Text>
              <Text>{money(summary.gratuityAmount)}</Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalLabel}>{money(summary.grandTotal)}</Text>
          </View>
          {summary.perPersonPrice !== null && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Per person</Text>
              <Text>{money(summary.perPersonPrice)}</Text>
            </View>
          )}
        </View>

        {(estimate.deposit_amount || estimate.deposit_due_date || installments.length > 0) && (
          <View>
            <Text style={styles.sectionTitle}>Payment Schedule</Text>
            {estimate.deposit_amount != null && (
              <Text>
                Deposit due{estimate.deposit_due_date ? ` ${estimate.deposit_due_date}` : ""}: {money(estimate.deposit_amount)}
              </Text>
            )}
            {installments.map((installment, i) => (
              <Text key={i}>
                Installment due {installment.dueDate || "TBD"}: {money(installment.amount)}
                {installment.paid ? " (paid)" : ""}
              </Text>
            ))}
            {summary.depositRemaining !== null && <Text>Balance due: {money(summary.depositRemaining)}</Text>}
          </View>
        )}

        {estimate.customer_facing_notes && (
          <View style={styles.notes}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text>{estimate.customer_facing_notes}</Text>
          </View>
        )}

        <View style={styles.signature}>
          <View>
            <Text style={styles.signatureLine}>Approved by (print name)</Text>
          </View>
          <View>
            <Text style={styles.signatureLine}>Date</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
