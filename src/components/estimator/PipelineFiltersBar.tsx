"use client";

export function PipelineFiltersBar({
  eventTypes,
  locations,
  owners,
  defaults,
}: {
  eventTypes: { id: string; name: string }[];
  locations: { id: string; name: string }[];
  owners: { id: string; full_name: string }[];
  defaults: {
    eventTypeId?: string;
    dateFrom?: string;
    dateTo?: string;
    guestCountMin?: string;
    guestCountMax?: string;
    locationId?: string;
    ownerId?: string;
  };
}) {
  const inputClass = "rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/40";

  return (
    <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg border border-foreground/10 p-3 text-sm">
      <label className="flex flex-col gap-1">
        <span className="text-xs text-foreground/60">Event type</span>
        <select name="eventTypeId" defaultValue={defaults.eventTypeId ?? ""} className={inputClass}>
          <option value="">All</option>
          {eventTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      {locations.length > 1 && (
        <label className="flex flex-col gap-1">
          <span className="text-xs text-foreground/60">Location</span>
          <select name="locationId" defaultValue={defaults.locationId ?? ""} className={inputClass}>
            <option value="">All</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="flex flex-col gap-1">
        <span className="text-xs text-foreground/60">Sales owner</span>
        <select name="ownerId" defaultValue={defaults.ownerId ?? ""} className={inputClass}>
          <option value="">All</option>
          {owners.map((o) => (
            <option key={o.id} value={o.id}>
              {o.full_name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-foreground/60">Event date from</span>
        <input type="date" name="dateFrom" defaultValue={defaults.dateFrom ?? ""} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-foreground/60">Event date to</span>
        <input type="date" name="dateTo" defaultValue={defaults.dateTo ?? ""} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-foreground/60">Guests min</span>
        <input type="number" min={0} name="guestCountMin" defaultValue={defaults.guestCountMin ?? ""} className={`${inputClass} w-24`} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-foreground/60">Guests max</span>
        <input type="number" min={0} name="guestCountMax" defaultValue={defaults.guestCountMax ?? ""} className={`${inputClass} w-24`} />
      </label>
      <button type="submit" className="rounded-md bg-foreground px-4 py-2 font-medium text-background">
        Apply filters
      </button>
      <a href="/estimator/pipeline" className="text-foreground/50 underline underline-offset-2">
        Clear
      </a>
    </form>
  );
}
