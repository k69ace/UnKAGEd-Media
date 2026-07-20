import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Schedule a strategy session with Kirk Ahlquist to talk through what an AI-powered system could look like in your restaurant, bar, or catering operation.",
  alternates: { canonical: "/contact" },
};

const contactPageSchema = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Contact unKAGEd Media",
  url: `${site.url}/contact`,
  about: {
    "@type": "Organization",
    name: site.name,
    email: site.email,
    telephone: "+1-620-490-4944",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Orlando",
      addressRegion: "FL",
      addressCountry: "US",
    },
  },
};

export default function ContactPage() {
  return (
    <>
      <JsonLd data={contactPageSchema} />
      <section>
        <Container className="py-16 sm:py-20">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Contact", href: "/contact" }]} />

          <h1 className="mt-8 max-w-2xl text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Let&rsquo;s talk about what&rsquo;s actually slowing your operation down.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
            One conversation, directly with me — no sales team, no deck. Bring
            the specific problem (slow quotes, BEO errors, labor cost you
            can&rsquo;t pin down) and I&rsquo;ll tell you plainly whether an
            app or a consulting engagement is the right fix, or whether it
            isn&rsquo;t.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="flex flex-col justify-between rounded-2xl border border-accent/40 bg-accent-soft p-8 lg:col-span-2">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Schedule a strategy session
                </h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-strong">
                  Pick a time that works for you. We&rsquo;ll talk through your
                  operation and where an AI-powered system fits — or doesn&rsquo;t.
                </p>
              </div>
              <Link
                href={site.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex w-fit items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-dim"
              >
                Book a time on my calendar
              </Link>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-border bg-background-elevated p-8">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Prefer to reach out directly?
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Email or call and I&rsquo;ll get back to you personally.
                </p>
              </div>
              <div className="mt-8 space-y-3">
                <a
                  href={`mailto:${site.email}`}
                  className="block text-sm font-semibold text-accent-strong hover:text-accent"
                >
                  {site.email}
                </a>
                <a
                  href="tel:+16204904944"
                  className="block text-sm font-semibold text-accent-strong hover:text-accent"
                >
                  (620) 490-4944
                </a>
                <p className="text-sm text-muted">Orlando, FL</p>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
