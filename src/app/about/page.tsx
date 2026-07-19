import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { CtaSection } from "@/components/CtaSection";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Kirk Ahlquist",
  description:
    "Kirk Ahlquist has spent 30 years in restaurant management, catering, and banquet operations, and now builds AI-powered systems for the hospitality businesses he's run.",
  alternates: { canonical: "/about" },
};

const credentials = [
  {
    title: "CFMP",
    detail: "Certified Food and Beverage Executive credential through the National Restaurant Association.",
  },
  {
    title: "Culinary Institute of America",
    detail: "Trained at the CIA, grounding the operational side of the work in real culinary and kitchen practice.",
  },
  {
    title: "30+ years in hospitality",
    detail:
      "Restaurant management, corporate dining, catering, banquets, and bartending, across independent operators and larger operations.",
  },
];

const timeline = [
  {
    range: "Operations",
    body: "Three decades on the floor and in the back office: restaurant management, corporate dining, catering and banquet operations, and bartending. The kind of experience that means every operational problem on this site has been lived, not researched.",
  },
  {
    range: "Marketing & systems",
    body: "A parallel track in digital marketing, CRM implementation, and automation — building the systems that connect a hospitality business's marketing to what actually happens on the floor.",
  },
  {
    range: "AI development",
    body: "Applying that operational and systems background to AI development, building tools that solve the specific, unglamorous problems that eat time and margin in a restaurant or catering operation.",
  },
  {
    range: "Today",
    body: "Working inside a restaurant operation while building the software for it — which means every app under unKAGEd Media is developed, tested, and used against a real shift before it's offered to anyone else.",
  },
];

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: site.founder,
  jobTitle: "Founder",
  worksFor: {
    "@type": "Organization",
    name: site.name,
    url: site.url,
  },
  alumniOf: {
    "@type": "EducationalOrganization",
    name: "The Culinary Institute of America",
  },
  hasCredential: {
    "@type": "EducationalOccupationalCredential",
    name: "CFMP, National Restaurant Association",
  },
  url: `${site.url}/about`,
  sameAs: [site.social.linkedin],
};

export default function AboutPage() {
  return (
    <>
      <JsonLd data={personSchema} />
      <section className="border-b border-border">
        <Container className="py-16 sm:py-20">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "About Kirk", href: "/about" }]} />

          <div className="mt-8 flex flex-col gap-10 sm:flex-row sm:items-center">
            <div
              className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl border border-border-strong text-3xl font-semibold text-accent-strong"
              style={{
                background:
                  "radial-gradient(120% 120% at 20% 20%, rgba(59,130,246,0.25) 0%, rgba(11,15,25,1) 70%)",
              }}
              aria-hidden
            >
              KA
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Kirk Ahlquist
              </h1>
              <p className="mt-2 text-lg text-muted">
                Founder, {site.name}. Restaurant operator turned AI systems builder.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-b border-border">
        <Container className="py-16 sm:py-20">
          <div className="max-w-3xl space-y-6 text-base leading-relaxed text-muted-strong">
            <p>
              I&rsquo;ve spent 30 years in restaurant management, corporate
              dining, catering, banquets, and bartending — the operational
              side of hospitality, not the consulting-slide version of it.
              Somewhere along the way I picked up CRM implementation,
              marketing automation, and eventually AI development, because
              every operation I worked in had the same gap: good people
              running shifts on tools that hadn&rsquo;t caught up to the job.
            </p>
            <p>
              I currently work inside a restaurant operation while building
              software for it. That&rsquo;s not a marketing line — it&rsquo;s
              the actual working arrangement, and it&rsquo;s why the apps
              under unKAGEd Media get built the way they do: against a real
              BEO, a real labor schedule, a real catering inquiry that has to
              be quoted before the caller hangs up. If a tool doesn&rsquo;t
              hold up on a busy Friday, it doesn&rsquo;t go on this site.
            </p>
            <p>
              unKAGEd Media exists because I kept building small pieces of
              software to fix problems in my own operation, and other
              operators kept asking for the same thing. It&rsquo;s one person
              — not an agency, not a team of account managers — writing the
              copy, building the funnels, and shipping the software.
            </p>
          </div>
        </Container>
      </section>

      <section className="border-b border-border bg-background-elevated">
        <Container className="py-16 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Credentials
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {credentials.map((item) => (
              <div key={item.title} className="rounded-2xl border border-border bg-background p-6">
                <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.detail}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-b border-border">
        <Container className="py-16 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            How I got here
          </h2>
          <div className="mt-10 space-y-10 border-l border-border pl-8">
            {timeline.map((item) => (
              <div key={item.range} className="relative">
                <span
                  className="absolute -left-[calc(2rem+1px)] top-1.5 h-2.5 w-2.5 rounded-full bg-accent"
                  aria-hidden
                />
                <h3 className="text-sm font-semibold uppercase tracking-widest text-accent-strong">
                  {item.range}
                </h3>
                <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-strong">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <CtaSection
        heading="Want to talk through a specific problem in your operation?"
        body="I take these calls myself — no sales team in between."
      />
    </>
  );
}
