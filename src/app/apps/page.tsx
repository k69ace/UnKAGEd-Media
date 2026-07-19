import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CtaSection } from "@/components/CtaSection";
import { AppCard } from "@/components/AppCard";
import { apps } from "@/lib/apps";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Apps",
  description:
    "AI-powered apps built for restaurant, bar, and catering operations — catering estimating, BEO building, labor cost planning, marketing ROI, voice AI, and more, built and tested inside a working hospitality business.",
  alternates: { canonical: "/apps" },
};

export default function AppsIndexPage() {
  const hospitalityApps = apps.filter((app) => app.category === "hospitality");
  const rangeApps = apps.filter((app) => app.category === "range");

  return (
    <>
      <section className="border-b border-border">
        <Container className="py-16 sm:py-20">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Apps", href: "/apps" }]} />
          <h1 className="mt-8 max-w-2xl text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Apps built inside real hospitality operations
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
            Every app here solves a problem {site.founder}
            {" "}
            has run into directly — quoting a catering event, building a BEO, or
            scheduling a shift against a real labor target. Hospitality
            first; more apps are added as they&rsquo;re built and proven.
          </p>
        </Container>
      </section>

      <section>
        <Container className="py-16 sm:py-20">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {hospitalityApps.map((app) => (
              <AppCard key={app.slug} app={app} />
            ))}
          </div>
        </Container>
      </section>

      {rangeApps.length > 0 && (
        <section className="border-t border-border bg-background-elevated">
          <Container className="py-16 sm:py-20">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Also built: proof of range
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
              Hospitality is the focus, but the same approach — a real
              operational problem, an instant answer, a system built to be
              used — applies outside restaurants too. These are built for
              home-services operators.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              {rangeApps.map((app) => (
                <AppCard key={app.slug} app={app} />
              ))}
            </div>
          </Container>
        </section>
      )}

      <CtaSection
        heading="Don't see the exact tool you need?"
        body="Most of these started as a one-off fix for a specific operation. If you've got a specific problem, that's exactly the conversation to have."
      />
    </>
  );
}
