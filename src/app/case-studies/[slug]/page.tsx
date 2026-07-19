import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/Container";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CtaSection } from "@/components/CtaSection";
import { AppCard } from "@/components/AppCard";
import { JsonLd } from "@/components/JsonLd";
import { caseStudies, getCaseStudyBySlug } from "@/lib/caseStudies";
import { getAppBySlug } from "@/lib/apps";
import { getLabEntriesForCaseStudy } from "@/lib/lab";
import { site } from "@/lib/site";

export function generateStaticParams() {
  return caseStudies.map((cs) => ({ slug: cs.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const caseStudy = getCaseStudyBySlug(slug);
  if (!caseStudy) return {};

  return {
    title: caseStudy.title,
    description: caseStudy.summary,
    alternates: { canonical: `/case-studies/${caseStudy.slug}` },
    openGraph: {
      title: caseStudy.title,
      description: caseStudy.summary,
      url: `${site.url}/case-studies/${caseStudy.slug}`,
      type: "article",
    },
  };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const caseStudy = getCaseStudyBySlug(slug);
  if (!caseStudy) notFound();

  const relatedApps = caseStudy.relatedAppSlugs
    .map((appSlug) => getAppBySlug(appSlug))
    .filter((app): app is NonNullable<typeof app> => Boolean(app));

  const relatedLabEntries = getLabEntriesForCaseStudy(caseStudy.slug);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: caseStudy.title,
    description: caseStudy.summary,
    datePublished: caseStudy.publishedAt,
    url: `${site.url}/case-studies/${caseStudy.slug}`,
    author: {
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
      <JsonLd data={articleSchema} />

      <section className="border-b border-border">
        <Container className="py-16 sm:py-20">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Case Studies", href: "/case-studies" },
              { label: caseStudy.title, href: `/case-studies/${caseStudy.slug}` },
            ]}
          />
          <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-xs font-medium uppercase tracking-widest text-accent-strong">
              {caseStudy.business}
            </span>
            <span className="text-xs text-muted" aria-hidden>
              &middot;
            </span>
            <time dateTime={caseStudy.publishedAt} className="text-xs text-muted">
              {new Date(caseStudy.publishedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                timeZone: "UTC",
              })}
            </time>
          </div>
          <h1 className="mt-4 max-w-2xl text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {caseStudy.title}
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
            {caseStudy.subtitle}
          </p>
        </Container>
      </section>

      <section className="border-b border-border bg-background-elevated">
        <Container className="py-16 sm:py-20">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:col-span-1">
              {caseStudy.challenge.heading}
            </h2>
            <div className="space-y-4 text-base leading-relaxed text-muted-strong lg:col-span-2">
              {caseStudy.challenge.body.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="border-b border-border">
        <Container className="py-16 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            What was built
          </h2>
          <div className="mt-5 max-w-2xl space-y-4 text-base leading-relaxed text-muted-strong">
            {caseStudy.whatWasBuilt.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-b border-border bg-background-elevated">
        <Container className="py-16 sm:py-20">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:col-span-1">
              Implementation
            </h2>
            <ol className="space-y-4 lg:col-span-2">
              {caseStudy.implementation.map((step, i) => (
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
            Results
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {caseStudy.results.map((result) => (
              <div key={result.label} className="rounded-2xl border border-border bg-background-elevated p-6">
                <h3 className="text-base font-semibold text-foreground">{result.label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{result.detail}</p>
              </div>
            ))}
          </div>
          {caseStudy.resultsNote && (
            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted">
              {caseStudy.resultsNote}
            </p>
          )}
        </Container>
      </section>

      <section className="border-b border-border bg-background-elevated">
        <Container className="py-16 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Lessons learned
          </h2>
          <ul className="mt-8 max-w-2xl space-y-4">
            {caseStudy.lessonsLearned.map((lesson, i) => (
              <li key={i} className="flex gap-3 text-base leading-relaxed text-muted-strong">
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                {lesson}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <CtaSection heading="Want to talk through your own version of this?" />

      {(relatedApps.length > 0 || relatedLabEntries.length > 0) && (
        <section>
          <Container className="py-16 sm:py-20">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              The app and build log behind this case study
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {relatedApps.map((app) => (
                <AppCard key={app.slug} app={app} />
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
    </>
  );
}
