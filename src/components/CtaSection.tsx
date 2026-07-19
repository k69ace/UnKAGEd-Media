import Link from "next/link";
import { Container } from "@/components/Container";
import { site } from "@/lib/site";

export function CtaSection({
  heading = "Talk through what this would look like at your operation",
  body = "One conversation, no deck, no pressure. If it's not a fit, I'll tell you.",
  ctaLabel = "Schedule a strategy session",
  ctaHref = site.bookingUrl,
}: {
  heading?: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  const external = ctaHref.startsWith("http");

  return (
    <section className="border-t border-border bg-background-elevated">
      <Container className="flex flex-col items-start gap-6 py-16 sm:flex-row sm:items-center sm:justify-between sm:py-20">
        <div className="max-w-xl">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {heading}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted">{body}</p>
        </div>
        <Link
          href={ctaHref}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-dim"
        >
          {ctaLabel}
        </Link>
      </Container>
    </section>
  );
}
