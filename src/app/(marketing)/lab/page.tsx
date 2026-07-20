import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CtaSection } from "@/components/CtaSection";
import { labEntries } from "@/lib/lab";

export const metadata: Metadata = {
  title: "The Lab",
  description:
    "A public build log from unKAGEd Media: what was built, why, how, what broke, what it cost, and what it returned — real work inside real hospitality operations, not a blog.",
  alternates: { canonical: "/lab" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function LabIndexPage() {
  const sorted = [...labEntries].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  return (
    <>
      <section className="border-b border-border">
        <Container className="py-16 sm:py-20">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "The Lab", href: "/lab" }]} />
          <h1 className="mt-8 max-w-2xl text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            A build log, not a blog
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
            Every entry documents real work: what was built, why, how, what
            broke along the way, what it cost, and what it returned. Listed
            newest first, but each one is written to stand on its own.
          </p>
        </Container>
      </section>

      <section>
        <Container className="py-16 sm:py-20">
          <div className="space-y-6">
            {sorted.map((entry) => (
              <Link
                key={entry.slug}
                href={`/lab/${entry.slug}`}
                className="group block rounded-2xl border border-border bg-background-elevated p-8 transition-colors hover:border-accent"
              >
                <time
                  dateTime={entry.publishedAt}
                  className="text-xs font-medium uppercase tracking-widest text-muted"
                >
                  {formatDate(entry.publishedAt)}
                </time>
                <h2 className="mt-3 text-xl font-semibold text-foreground">{entry.title}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{entry.dek}</p>
                <span className="mt-4 inline-block text-sm font-semibold text-accent-strong group-hover:text-accent">
                  Read the entry &rarr;
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <CtaSection
        heading="Working on something similar in your own operation?"
        body="If a build log like this is useful to you, the conversation about your specific problem probably is too."
      />
    </>
  );
}
