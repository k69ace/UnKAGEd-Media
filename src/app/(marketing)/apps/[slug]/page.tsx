import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/Container";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CtaSection } from "@/components/CtaSection";
import { AppMockup } from "@/components/AppMockup";
import { AppCard } from "@/components/AppCard";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { apps, getAppBySlug } from "@/lib/apps";
import { getCaseStudyBySlug } from "@/lib/caseStudies";
import { getLabEntriesForApp } from "@/lib/lab";
import { site } from "@/lib/site";

export function generateStaticParams() {
  return apps.map((app) => ({ slug: app.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const app = getAppBySlug(slug);
  if (!app) return {};

  return {
    title: app.name,
    description: app.summary,
    alternates: { canonical: `/apps/${app.slug}` },
    openGraph: {
      title: app.name,
      description: app.summary,
      url: `${site.url}/apps/${app.slug}`,
    },
  };
}

export default async function AppPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const app = getAppBySlug(slug);
  if (!app) notFound();

  const others = apps.filter((a) => a.slug !== app.slug);
  const otherApps = [
    ...others.filter((a) => a.category === app.category),
    ...others.filter((a) => a.category !== app.category),
  ].slice(0, 2);

  const relatedCaseStudies = (app.relatedCaseStudySlugs ?? [])
    .map((csSlug) => getCaseStudyBySlug(csSlug))
    .filter((cs): cs is NonNullable<typeof cs> => Boolean(cs));

  const relatedLabEntries = getLabEntriesForApp(app.slug);

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: app.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: app.summary,
    url: `${site.url}/apps/${app.slug}`,
    creator: {
      "@type": "Person",
      name: site.founder,
      url: `${site.url}/about`,
    },
    publisher: {
      "@type": "Organization",
      name: site.name,
      url: site.url,
    },
  };

  return (
    <>
      <JsonLd data={softwareSchema} />

      <section className="border-b border-border">
        <Container className="py-16 sm:py-20">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Apps", href: "/apps" },
              { label: app.name, href: `/apps/${app.slug}` },
            ]}
          />

          <div className="mt-8">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                app.status === "live"
                  ? "bg-accent-soft text-accent-strong"
                  : "bg-white/5 text-muted-strong"
              }`}
            >
              {app.status === "live" ? "Live" : "Prototype, in daily use"}
            </span>
            <h1 className="mt-4 max-w-2xl text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
              {app.name}
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
              {app.tagline}
            </p>
            {app.statusNote && (
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-accent-strong">
                {app.statusNote}
              </p>
            )}
          </div>
        </Container>
      </section>

      {/* The problem, in operator language */}
      <section className="border-b border-border bg-background-elevated">
        <Container className="py-16 sm:py-20">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:col-span-1">
              {app.problem.heading}
            </h2>
            <div className="space-y-4 text-base leading-relaxed text-muted-strong lg:col-span-2">
              {app.problem.body.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* What it does + screenshot */}
      <section className="border-b border-border">
        <Container className="py-16 sm:py-20">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                What it does
              </h2>
              <div className="mt-5 space-y-4 text-base leading-relaxed text-muted-strong">
                {app.whatItDoes.map((sentence, i) => (
                  <p key={i}>{sentence}</p>
                ))}
              </div>
            </div>
            <AppMockup variant={app.mockup} label={app.name} />
          </div>
        </Container>
      </section>

      {/* Outcomes */}
      <section className="border-b border-border bg-background-elevated">
        <Container className="py-16 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            What changes when you use it
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {app.outcomes.map((outcome) => (
              <div key={outcome.label} className="rounded-2xl border border-border bg-background p-6">
                <h3 className="text-base font-semibold text-foreground">{outcome.label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{outcome.detail}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* How it works */}
      <section className="border-b border-border">
        <Container className="py-16 sm:py-20">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:col-span-1">
              How it works
            </h2>
            <ul className="space-y-4 lg:col-span-2">
              {app.howItWorks.map((line, i) => (
                <li key={i} className="flex gap-3 text-base leading-relaxed text-muted-strong">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="border-b border-border bg-background-elevated">
        <Container className="py-16 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Frequently asked questions
          </h2>
          <div className="mt-10 max-w-3xl">
            <Faq items={app.faqs} />
          </div>
        </Container>
      </section>

      <CtaSection
        heading={`See ${app.name} on your own numbers`}
        ctaLabel={app.cta.label}
        ctaHref={app.cta.href}
      />

      {(relatedCaseStudies.length > 0 || relatedLabEntries.length > 0) && (
        <section className="border-b border-border">
          <Container className="py-16 sm:py-20">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              From the Lab and case studies
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {relatedCaseStudies.map((cs) => (
                <Link
                  key={cs.slug}
                  href={`/case-studies/${cs.slug}`}
                  className="group rounded-2xl border border-border bg-background-elevated p-6 transition-colors hover:border-accent"
                >
                  <span className="text-xs font-medium text-muted">Case study &middot; {cs.business}</span>
                  <h3 className="mt-3 text-base font-semibold text-foreground">{cs.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{cs.subtitle}</p>
                  <span className="mt-4 inline-block text-sm font-semibold text-accent-strong group-hover:text-accent">
                    Read the case study &rarr;
                  </span>
                </Link>
              ))}
              {relatedLabEntries.map((entry) => (
                <Link
                  key={entry.slug}
                  href={`/lab/${entry.slug}`}
                  className="group rounded-2xl border border-border bg-background-elevated p-6 transition-colors hover:border-accent"
                >
                  <span className="text-xs font-medium text-muted">From the Lab</span>
                  <h3 className="mt-3 text-base font-semibold text-foreground">{entry.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{entry.dek}</p>
                  <span className="mt-4 inline-block text-sm font-semibold text-accent-strong group-hover:text-accent">
                    Read the entry &rarr;
                  </span>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {otherApps.length > 0 && (
        <section>
          <Container className="py-16 sm:py-20">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              More apps
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {otherApps.map((other) => (
                <AppCard key={other.slug} app={other} />
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
