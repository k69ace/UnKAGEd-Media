import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CtaSection } from "@/components/CtaSection";
import { caseStudies } from "@/lib/caseStudies";

export const metadata: Metadata = {
  title: "Case Studies",
  description:
    "Real engagements, real numbers where they exist: how AI-powered systems from unKAGEd Media perform inside working restaurant and catering operations.",
  alternates: { canonical: "/case-studies" },
};

export default function CaseStudiesIndexPage() {
  return (
    <>
      <section className="border-b border-border">
        <Container className="py-16 sm:py-20">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Case Studies", href: "/case-studies" }]} />
          <h1 className="mt-8 max-w-2xl text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            What happened when these systems went into a real operation
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
            Two strong case studies beat eight thin ones, so this list grows
            slowly and only with engagements that have verifiable outcomes
            behind them.
          </p>
        </Container>
      </section>

      <section>
        <Container className="py-16 sm:py-20">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {caseStudies.map((cs) => (
              <Link
                key={cs.slug}
                href={`/case-studies/${cs.slug}`}
                className="group flex flex-col justify-between rounded-2xl border border-border bg-background-elevated p-8 transition-colors hover:border-accent"
              >
                <div>
                  <span className="text-xs font-medium text-muted">{cs.business}</span>
                  <h2 className="mt-3 text-xl font-semibold text-foreground">{cs.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{cs.subtitle}</p>
                </div>
                <span className="mt-8 text-sm font-semibold text-accent-strong group-hover:text-accent">
                  Read the case study &rarr;
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <CtaSection
        heading="Want results like this in your own operation?"
        body="Bring the specific problem you're trying to solve — I'll tell you plainly what's realistic."
      />
    </>
  );
}
