import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth/profile";
import { getEstimate, getVersionHistory, listContactsForCustomer, listOrgConfig } from "@/lib/data/catering";
import { computeEstimateSummary } from "@/lib/calculations/estimateSummary";
import { CATEGORY_LABELS, MENU_PACKAGE_CATEGORIES, BEVERAGE_CATEGORIES, RENTALS_LOGISTICS_CATEGORIES, STATUS_LABELS } from "@/lib/constants/catering";
import { RunningTotalSidebar } from "@/components/estimator/RunningTotalSidebar";
import { EventDetailsSection } from "@/components/estimator/EventDetailsSection";
import { GuestCountHistory } from "@/components/estimator/GuestCountHistory";
import { LineItemsSection } from "@/components/estimator/LineItemsSection";
import { PackageTemplatePicker } from "@/components/estimator/PackageTemplatePicker";
import { StaffingSection } from "@/components/estimator/StaffingSection";
import { FeesDiscountSection } from "@/components/estimator/FeesDiscountSection";
import { PaymentScheduleSection } from "@/components/estimator/PaymentScheduleSection";
import { NotesSection } from "@/components/estimator/NotesSection";
import { StatusActions } from "@/components/estimator/StatusActions";
import { NewVersionBanner } from "@/components/estimator/NewVersionBanner";
import { SuggestionsPanel } from "@/components/estimator/SuggestionsPanel";
import { generateSuggestions, type AnonymizedEstimateShape } from "@/lib/suggestions";

export default async function EstimateBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile();

  const estimate = await getEstimate(id).catch(() => null);
  if (!estimate || estimate.organization_id !== profile.organizationId) notFound();

  const [config, contacts, versions] = await Promise.all([
    listOrgConfig(profile.organizationId),
    listContactsForCustomer(estimate.customer_id),
    getVersionHistory(estimate.id),
  ]);

  const summary = computeEstimateSummary(estimate, estimate.catering_estimate_line_items, estimate.catering_estimate_staffing, config.taxRules, config.settings);
  const isEditable = estimate.status === "draft" || estimate.status === "sent";

  const anonymizedShape: AnonymizedEstimateShape = {
    eventTypeName: config.eventTypes.find((t) => t.id === estimate.event_type_id)?.name ?? null,
    serviceStyleName: config.serviceStyles.find((s) => s.id === estimate.service_style_id)?.name ?? null,
    guestCount: estimate.guest_count_guaranteed ?? estimate.guest_count_estimated,
    eventStartHour: estimate.event_start_time ? Number(estimate.event_start_time.split(":")[0]) : null,
    categoriesPresent: [...new Set(estimate.catering_estimate_line_items.map((li) => li.category))],
    lineItemDescriptions: estimate.catering_estimate_line_items.map((li) => li.description),
    staffingLineCount: estimate.catering_estimate_staffing.length,
  };
  const suggestions = await generateSuggestions(anonymizedShape);

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link href="/estimator/pipeline" className="text-sm text-foreground/50 hover:underline">
            ← Pipeline
          </Link>
          <h1 className="text-xl font-semibold">
            {estimate.customers?.name ?? "Estimate"}
            {estimate.customers?.company_name ? ` — ${estimate.customers.company_name}` : ""}
          </h1>
          <div className="mt-1 flex gap-3 text-xs">
            <a href={`/estimator/estimates/${estimate.id}/proposal`} target="_blank" rel="noreferrer" className="underline underline-offset-2">
              Customer proposal (PDF)
            </a>
            <a href={`/estimator/estimates/${estimate.id}/internal-sheet`} target="_blank" rel="noreferrer" className="underline underline-offset-2">
              Internal sheet (PDF)
            </a>
            <a href={`/estimator/estimates/${estimate.id}/internal-csv`} className="underline underline-offset-2">
              Internal detail (CSV)
            </a>
          </div>
        </div>
        {versions.length > 1 && (
          <div className="text-xs text-foreground/50">
            Version history:{" "}
            {versions.map((v, i) => (
              <span key={v.id}>
                {i > 0 && " → "}
                {v.isCurrent ? (
                  <strong>v{v.version}</strong>
                ) : (
                  <Link href={`/estimator/estimates/${v.id}`} className="underline">
                    v{v.version} ({STATUS_LABELS[v.status]})
                  </Link>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {!isEditable && <NewVersionBanner estimateId={estimate.id} status={estimate.status} />}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <EventDetailsSection
            estimate={estimate}
            contacts={contacts}
            eventTypes={config.eventTypes}
            serviceStyles={config.serviceStyles}
            disabled={!isEditable}
          />

          <GuestCountHistory history={estimate.catering_estimate_guest_count_history} />

          {isEditable && <PackageTemplatePicker estimateId={estimate.id} templates={config.packageTemplates} />}
          <LineItemsSection
            estimateId={estimate.id}
            title="Menu / Packages"
            categories={MENU_PACKAGE_CATEGORIES}
            lineItems={estimate.catering_estimate_line_items}
            taxRules={config.taxRules}
            disabled={!isEditable}
          />
          <LineItemsSection
            estimateId={estimate.id}
            title="Beverages & Alcohol"
            categories={BEVERAGE_CATEGORIES}
            lineItems={estimate.catering_estimate_line_items}
            taxRules={config.taxRules}
            disabled={!isEditable}
          />
          <LineItemsSection
            estimateId={estimate.id}
            title="Rentals & Logistics"
            description={`Includes ${RENTALS_LOGISTICS_CATEGORIES.map((c) => CATEGORY_LABELS[c]).join(", ")}.`}
            categories={RENTALS_LOGISTICS_CATEGORIES}
            lineItems={estimate.catering_estimate_line_items}
            taxRules={config.taxRules}
            disabled={!isEditable}
          />

          <StaffingSection
            estimateId={estimate.id}
            staffing={estimate.catering_estimate_staffing}
            staffingRoles={config.staffingRoles}
            guestCountEstimated={estimate.guest_count_estimated}
            disabled={!isEditable}
          />

          <FeesDiscountSection estimate={estimate} disabled={!isEditable} />
          <PaymentScheduleSection estimate={estimate} grandTotal={summary.grandTotal} disabled={!isEditable} />
          <NotesSection estimate={estimate} disabled={!isEditable} />

          <SuggestionsPanel suggestions={suggestions} />

          <StatusActions estimateId={estimate.id} status={estimate.status} />
        </div>

        <div>
          <RunningTotalSidebar summary={summary} />
        </div>
      </div>
    </div>
  );
}
