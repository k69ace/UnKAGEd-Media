import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { CtaSection } from "@/components/CtaSection";
import { AppCard } from "@/components/AppCard";
import { apps } from "@/lib/apps";
import { site } from "@/lib/site";

const featuredApps = apps.filter((app) => app.category === "hospitality").slice(0, 3);

export const metadata: Metadata = {
  title: `${site.name} | AI Business Systems for Restaurants & Hospitality`,
  description: site.description,
  alternates: { canonical: "/" },
};

const proofPoints = [
  "30+ years in restaurant, catering, and banquet operations",
  "CFMP-certified through the National Restaurant Association",
  "Trained at the Culinary Institute of America",
  "Currently running a restaurant shift while building the software for it",
];

const approach = [
  {
    step: "01",
    title: "I work the operation, not just the account",
    body: "Every app on this site was scoped against a real shift — a real BEO, a real labor schedule, a real quote that had to go out today. I'm not translating requirements from a call; I'm the one who felt the problem first.",
  },
  {
    step: "02",
    title: "I build it, test it, and use it",
    body: "Software gets tested where it has to work: inside a live operation, under real volume, with real margin on the line. If it doesn't hold up on a Friday night, it doesn't ship.",
  },
  {
    step: "03",
    title: "You get something you can run tomorrow",
    body: "No retainer-only relationship, no dashboard nobody opens. Each engagement ends with a system your team actually uses on shift.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, rgba(30,144,243,0.2) 0%, rgba(45,47,53,0) 70%)",
          }}
          aria-hidden
        />
        <Container className="py-24 sm:py-32">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent-strong">
            AI systems for restaurants, bars &amp; catering
          </p>
          <h1 className="mt-5 max-w-3xl text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-6xl">
            I build AI-powered systems that help restaurants and hospitality
            operators make more money, save time, and run smoother shifts.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            I&rsquo;m Kirk Ahlquist. Thirty years in restaurant management,
            catering, banquets, and bar operations, now spent building the
            software I wish I&rsquo;d had on the line — tested inside a working
            restaurant, not a demo environment.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href={site.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-dim"
            >
              Schedule a strategy session
            </Link>
            <Link
              href="/apps"
              className="inline-flex items-center justify-center rounded-full border border-border-strong px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-accent hover:text-accent-strong"
            >
              See the apps
            </Link>
          </div>
        </Container>
      </section>

      <section className="border-b border-border bg-background-elevated">
        <Container className="py-10">
          <ul className="grid grid-cols-1 gap-x-8 gap-y-4 text-sm text-muted-strong sm:grid-cols-2 lg:grid-cols-4">
            {proofPoints.map((point) => (
              <li key={point} className="flex items-start gap-2.5">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                {point}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="border-b border-border">
        <Container className="py-20 sm:py-24">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Apps built for the floor, not the boardroom
              </h2>
              <p className="mt-2 max-w-xl text-base text-muted">
                Every app is a real tool solving a real operational problem —
                priced and scoped for independent operators, not enterprise
                chains.
              </p>
            </div>
            <Link
              href="/apps"
              className="text-sm font-semibold text-accent-strong hover:text-accent"
            >
              View all apps &rarr;
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {featuredApps.map((app) => (
              <AppCard key={app.slug} app={app} />
            ))}
          </div>
        </Container>
      </section>

      <section className="border-b border-border bg-background-elevated">
        <Container className="py-20 sm:py-24">
          <h2 className="max-w-2xl text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Not an agency. One operator who builds software.
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-3">
            {approach.map((item) => (
              <div key={item.step}>
                <span className="font-mono text-sm text-accent-strong">{item.step}</span>
                <h3 className="mt-3 text-lg font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <CtaSection />
    </>
  );
}
