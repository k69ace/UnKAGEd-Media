import Link from "next/link";
import type { AppDefinition } from "@/lib/apps";

export function AppCard({ app }: { app: AppDefinition }) {
  return (
    <Link
      href={`/apps/${app.slug}`}
      className="group flex flex-col justify-between rounded-2xl border border-border bg-background-elevated p-6 transition-colors hover:border-accent sm:p-8"
    >
      <div>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
            app.status === "live"
              ? "bg-accent-soft text-accent-strong"
              : "bg-white/5 text-muted-strong"
          }`}
        >
          {app.status === "live" ? "Live" : "Prototype, in daily use"}
        </span>
        <h3 className="mt-4 text-lg font-semibold text-foreground sm:text-xl">{app.name}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{app.tagline}</p>
      </div>
      <span className="mt-6 text-sm font-semibold text-accent-strong group-hover:text-accent sm:mt-8">
        Read more &rarr;
      </span>
    </Link>
  );
}
