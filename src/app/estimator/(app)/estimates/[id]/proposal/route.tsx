import { renderToBuffer } from "@react-pdf/renderer";
import { loadEstimateForExport } from "@/lib/pdf/loadEstimateForExport";
import { CustomerProposalDocument } from "@/lib/pdf/CustomerProposalDocument";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { estimate, summary, organizationName } = await loadEstimateForExport(id);

  const buffer = await renderToBuffer(
    <CustomerProposalDocument organizationName={organizationName} estimate={estimate} summary={summary} />,
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="proposal-${estimate.customers?.name ?? id}.pdf"`,
    },
  });
}
