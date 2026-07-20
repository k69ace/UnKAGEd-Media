// Integration-adapter layer for the Catering Estimator. Nothing in this
// module is wired to a real external service today — no Tripleseat,
// Caterease, GoHighLevel, or QuickBooks credentials exist for this
// project, and per the module's own policy, an integration doesn't get
// implemented (even partially, even mocked) without real credentials and
// documentation in hand. This file exists so that when one of those
// arrives, it plugs in here without touching core estimate logic
// (lib/calculations, lib/data, the estimates Server Actions) at all.
//
// The shape below is a *contract*, not an implementation: each adapter
// method a future integration would need, typed against the estimator's
// own domain types, with no assumptions baked in about any specific
// provider's API. Compare with lib/suggestions/ai.ts, which follows the
// same pattern for the AI-suggestions seam.

import type { EstimateDetail } from "@/lib/data/catering";

export interface CateringCrmAdapter {
  /** Push a won estimate into an external event/CRM system as a booked event. */
  pushBookedEvent(estimate: EstimateDetail): Promise<{ externalId: string } | { error: string }>;
}

export interface CateringInvoicingAdapter {
  /** Create a draft invoice in an external accounting system from a won estimate. */
  createDraftInvoice(estimate: EstimateDetail): Promise<{ externalId: string } | { error: string }>;
}

export interface CateringLeadCaptureAdapter {
  /** Notify an external CRM/lead system that a new draft estimate was started. */
  notifyLeadCreated(estimate: EstimateDetail): Promise<{ error?: string }>;
}

// No adapters are registered. Calling code should treat every
// integration as absent and continue working with manual entry only —
// see the module README's Future Roadmap for what each of these is
// intended to become.
export const registeredAdapters: {
  crm: CateringCrmAdapter | null;
  invoicing: CateringInvoicingAdapter | null;
  leadCapture: CateringLeadCaptureAdapter | null;
} = {
  crm: null,
  invoicing: null,
  leadCapture: null,
};
