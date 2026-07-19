import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/Container";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CtaSection } from "@/components/CtaSection";
import { AppCard } from "@/components/AppCard";
import { JsonLd } from "@/components/JsonLd";
import { labEntries, getLabEntryBySlug } from "@/lib/lab";
import { getAppBySlug } from "@/lib/apps";
import { getCaseStudyBySlug } from "@/lib/caseStudies";
import { site } from "@/lib/site";

export function generateStaticParams() {
  return labEntries.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = getLabEntryBySlug(slug);
  if (!entry) return {};

  return {
    title: entry.title,
    description: entry.dek,
    alternates: { canonical: `/lab/${entry.slug}` },
    openGraph: {
      title: entry.title,
      description: entry.dek,
      url: `${site.url}/lab/${entry.slug}`,
      type: "article",
    },
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default async function LabEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getLabEntryBySlug(slug);
  if (!entry) notFound();

  const relatedApps = entry.relatedAppSlugs
    .map((appSlug) => getAppBySlug(appSlug))
    .filter((app): app is NonNullable<typeof app> => Boolean(app));

  const relatedCaseStudies = (entry.relatedCaseStudySlugs ?? [])
    .map((csSlug) => getCaseStudyBySlug(csSlug))
    .filter((cs): cs is NonNullable<typeof cs> => Boolean(cs));

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: entry.title,
    description: entry.dek,
    datePublished: entry.publishedAt,
    url: `${site.url}/lab/${entry.slug}`,
    author: {
      "@type": "Person",
      name: site.founder,
    },
    publisher: {
      "@type": "Organization",
      name: site.name,
      url: site.url,
    },
  };

  return (
    <>
      <JsonLd data={articleSchema} />

      <section className="border-b border-border">
        <Container className="py-16 sm:py-20">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "The Lab", href: "/lab" },
              { label: entry.title, href: `/lab/${entry.slug}` },
            ]}
          />
          <time
            dateTime={entry.publishedAt}
            className="mt-8 inline-block text-xs font-medium uppercase tracking-widest text-accent-strong"
          >
            {formatDate(entry.publishedAt)}
          </time>
          <h1 className="mt-4 max-w-2xl text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {entry.title}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">{entry.dek}</p>
        </Container>
      </section>

      <section className="border-b border-border bg-background-elevated">
        <Container className="py-16 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            What was built
          </h2>
          <div className="mt-5 max-w-2xl space-y-4 text-base leading-relaxed text-muted-strong">
            {entry.whatWasBuilt.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-b border-border">
        <Container className="py-16 sm:py-20">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:col-span-1">
              Why
            </h2>
            <div className="space-y-4 text-base leading-relaxed text-muted-strong lg:col-span-2">
              {entry.why.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="border-b border-border bg-background-elevated">
        <Container className="py-16 sm:py-20">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:col-span-1">
              How
            </h2>
            <ol className="space-y-4 lg:col-span-2">
              {entry.how.map((step, i) => (
                <li key={i} className="flex gap-4 text-base leading-relaxed text-muted-strong">
                  <span className="mt-0.5 shrink-0 font-mono text-sm text-accent-strong">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </section>

      <section className="border-b border-border">
        <Container className="py-16 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            What broke
          </h2>
          <ul className="mt-8 max-w-2xl space-y-4">
            {entry.whatBroke.map((item, i) => (
              <li key={i} className="flex gap-3 text-base leading-relaxed text-muted-strong">
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="border-b border-border bg-background-elevated">
        <Container className="py-16 sm:py-20">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-background p-6">
              <h3 className="text-base font-semibold text-foreground">What it cost</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{entry.costInHours}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-6">
              <h3 className="text-base font-semibold text-foreground">What it returned</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{entry.whatItReturned}</p>
            </div>
          </div>
        </Container>
      </section>

      <CtaSection heading="Have a similar problem in your own operation?" />

      {(relatedApps.length > 0 || relatedCaseStudies.length > 0) && (
        <section>
          <Container className="py-16 sm:py-20">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Related
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {relatedApps.map((app) => (
                <AppCard key={app.slug} app={app} />
              ))}
              {relatedCaseStudies.map((cs) => (
                <Link
                  key={cs.slug}
                  href={`/case-studies/${cs.slug}`}
                  className="group rounded-2xl border border-border bg-background-elevated p-6 transition-colors hover:border-accent"
                >
                  <span className="text-xs font-medium text-muted">{cs.business}</span>
                  <h3 className="mt-3 text-base font-semibold text-foreground">{cs.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{cs.subtitle}</p>
                  <span className="mt-4 inline-block text-sm font-semibold text-accent-strong group-hover:text-accent">
                    Read the case study &rarr;
                  </span>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
