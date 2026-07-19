import type { AppMockupVariant } from "@/lib/apps";

function Chrome({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border-strong bg-background-elevated shadow-2xl shadow-black/40">
      <div className="flex items-center gap-2 border-b border-border bg-background-elevated-2 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="ml-2 text-xs text-muted">{label}</span>
      </div>
      <div className="p-6 sm:p-8">{children}</div>
    </div>
  );
}

function Bar({ w, tone = "border" }: { w: string; tone?: "border" | "accent" }) {
  return (
    <div
      className={`h-2.5 rounded-full ${tone === "accent" ? "bg-accent/70" : "bg-white/10"}`}
      style={{ width: w }}
    />
  );
}

function EstimatorMockup() {
  const lines = [
    ["Plated dinner — 120 guests", "$4,320"],
    ["Bar service, 4hr", "$960"],
    ["Staffing (6 FOH / 3 BOH)", "$1,140"],
    ["Rentals & linens", "$540"],
  ];
  return (
    <Chrome label="Catering Estimator — new estimate">
      <div className="space-y-4">
        {lines.map(([desc, amt]) => (
          <div key={desc} className="flex items-center justify-between border-b border-border pb-3 text-sm">
            <span className="text-muted-strong">{desc}</span>
            <span className="font-mono text-foreground">{amt}</span>
          </div>
        ))}
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm font-semibold text-foreground">Estimated total</span>
          <span className="font-mono text-lg font-semibold text-foreground">$6,960</span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-accent-soft px-4 py-3">
          <span className="text-xs font-medium text-accent-strong">Target margin: 32%</span>
          <span className="text-xs font-semibold text-accent-strong">On target</span>
        </div>
      </div>
    </Chrome>
  );
}

function BeoMockup() {
  return (
    <Chrome label="BEO Builder — Saturday, private dining room">
      <div className="grid grid-cols-2 gap-4 text-sm">
        {[
          ["Guest count", "85"],
          ["Room", "Private Dining B"],
          ["Service start", "6:00 PM"],
          ["Service style", "Plated, 3-course"],
        ].map(([label, val]) => (
          <div key={label} className="rounded-lg border border-border bg-background-elevated-2 px-4 py-3">
            <div className="text-xs text-muted">{label}</div>
            <div className="mt-1 font-medium text-foreground">{val}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        <Bar w="100%" />
        <Bar w="88%" />
        <Bar w="64%" />
      </div>
      <div className="mt-4 flex items-center justify-between rounded-lg bg-accent-soft px-4 py-3">
        <span className="text-xs font-medium text-accent-strong">Rev. 3 · synced to kitchen &amp; service</span>
        <span className="h-2 w-2 rounded-full bg-accent-strong" />
      </div>
    </Chrome>
  );
}

function LaborMockup() {
  const dayparts = [
    { label: "Lunch", hours: 42, w: "55%" },
    { label: "Mid-day", hours: 18, w: "28%" },
    { label: "Dinner", hours: 76, w: "100%" },
    { label: "Late night", hours: 24, w: "36%" },
  ];
  return (
    <Chrome label="Labor Efficiency Calculator — this week">
      <div className="space-y-4">
        {dayparts.map((d) => (
          <div key={d.label} className="flex items-center gap-4">
            <span className="w-20 shrink-0 text-xs text-muted">{d.label}</span>
            <div className="h-2.5 w-full rounded-full bg-white/10">
              <div className="h-2.5 rounded-full bg-accent/70" style={{ width: d.w }} />
            </div>
            <span className="w-16 shrink-0 text-right font-mono text-xs text-foreground">{d.hours} hrs</span>
          </div>
        ))}
        <div className="flex items-center justify-between rounded-lg bg-accent-soft px-4 py-3">
          <span className="text-xs font-medium text-accent-strong">Target labor: 29% of forecasted sales</span>
          <span className="text-xs font-semibold text-accent-strong">160 hrs</span>
        </div>
      </div>
    </Chrome>
  );
}

function GenericMockup({ label }: { label: string }) {
  return (
    <Chrome label={label}>
      <div className="space-y-3">
        <Bar w="90%" />
        <Bar w="70%" />
        <Bar w="50%" />
        <div className="mt-4 rounded-lg bg-accent-soft px-4 py-3">
          <Bar w="40%" tone="accent" />
        </div>
      </div>
    </Chrome>
  );
}

export function AppMockup({ variant, label }: { variant: AppMockupVariant; label: string }) {
  switch (variant) {
    case "estimator":
      return <EstimatorMockup />;
    case "beo":
      return <BeoMockup />;
    case "labor":
      return <LaborMockup />;
    default:
      return <GenericMockup label={label} />;
  }
}
