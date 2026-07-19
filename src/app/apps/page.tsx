import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CtaSection } from "@/components/CtaSection";
import { apps } from "@/lib/apps";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Apps",
  description:
    "AI-powered apps built for restaurant, bar, and catering operations — catering estimating, BEO building, and labor cost planning, built and tested inside a working hospitality business.",
  alternates: { canonical: "/apps" },
};

export default function AppsIndexPage() {
  return (
    <>
      <section className="border-b border-border">
        <Container className="py-16 sm:py-20">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Apps", href: "/apps" }]} />
          <h1 className="mt-8 max-w-2xl text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Apps built inside real hospitality operations
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
            Every app here solves a problem {site.founder} has run into
            directly — quoting a catering event, building a BEO, or
            scheduling a shift against a real labor target. Hospitality
            first; more apps are added as they&rsquo;re built and proven.
          </p>
        </Container>
      </section>

      <section>
        <Container className="py-16 sm:py-20">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {apps.map((app) => (
              <Link
                key={app.slug}
                href={`/apps/${app.slug}`}
                className="group flex flex-col justify-between rounded-2xl border border-border bg-background-elevated p-8 transition-colors hover:border-accent"
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
                  <h2 className="mt-4 text-xl font-semibold text-foreground">{app.name}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{app.tagline}</p>
                </div>
                <span className="mt-8 text-sm font-semibold text-accent-strong group-hover:text-accent">
                  Read more &rarr;
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <CtaSection
        heading="Don't see the exact tool you need?"
        body="Most of these started as a one-off fix for a specific operation. If you've got a specific problem, that's exactly the conversation to have."
      />
    </>
  );
}
