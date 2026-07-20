"use client";

import { updateEventDetails } from "@/app/estimator/(app)/estimates/actions";
import { AutosaveSection, type SectionState } from "./AutosaveSection";
import type { EstimateDetail } from "@/lib/data/catering";

interface Option {
  id: string;
  name: string;
}

export function EventDetailsSection({
  estimate,
  contacts,
  eventTypes,
  serviceStyles,
  disabled,
}: {
  estimate: EstimateDetail;
  contacts: { id: string; first_name: string; last_name: string }[];
  eventTypes: Option[];
  serviceStyles: Option[];
  disabled: boolean;
}) {
  const action = async (_prev: SectionState, formData: FormData) => updateEventDetails(estimate.id, formData);

  return (
    <AutosaveSection action={action} initialState={{}} title="Event Details" disabled={disabled}>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Contact">
          <select name="contactId" defaultValue={estimate.contact_id ?? ""} className={selectClass}>
            <option value="">Select a contact…</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.first_name} {c.last_name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Event type">
          <select name="eventTypeId" defaultValue={estimate.event_type_id ?? ""} className={selectClass}>
            <option value="">Select…</option>
            {eventTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Service style">
          <select name="serviceStyleId" defaultValue={estimate.service_style_id ?? ""} className={selectClass}>
            <option value="">Select…</option>
            {serviceStyles.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Event date">
          <input type="date" name="eventDate" defaultValue={estimate.event_date ?? ""} className={inputClass} />
        </Field>
        <Field label="Start time">
          <input type="time" name="eventStartTime" defaultValue={estimate.event_start_time ?? ""} className={inputClass} />
        </Field>
        <Field label="End time">
          <input type="time" name="eventEndTime" defaultValue={estimate.event_end_time ?? ""} className={inputClass} />
        </Field>
        <Field label="Venue name">
          <input type="text" name="venueName" defaultValue={estimate.venue_name ?? ""} className={inputClass} />
        </Field>
        <Field label="Venue address">
          <input type="text" name="venueAddress" defaultValue={estimate.venue_address ?? ""} className={inputClass} />
        </Field>
        <Field label="Guest count (estimated)">
          <input
            type="number"
            min={1}
            name="guestCountEstimated"
            defaultValue={estimate.guest_count_estimated ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Guest count (guaranteed)">
          <input
            type="number"
            min={1}
            name="guestCountGuaranteed"
            defaultValue={estimate.guest_count_guaranteed ?? ""}
            className={inputClass}
          />
        </Field>
      </div>
    </AutosaveSection>
  );
}

const inputClass = "rounded-md border border-foreground/15 bg-transparent px-3 py-2 outline-none focus:border-foreground/40";
const selectClass = inputClass;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-foreground/70">{label}</span>
      {children}
    </label>
  );
}
