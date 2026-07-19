import Link from "next/link";
import { Container } from "@/components/Container";
import { LogoMark, Logotype } from "@/components/Logo";
import { footerNav, site } from "@/lib/site";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <Container className="flex flex-col gap-8 py-12 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm">
          <Link href="/" className="flex items-center gap-2 text-base font-semibold text-foreground">
            <LogoMark size={10} />
            <Logotype />
          </Link>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            AI-powered business systems for restaurants, bars, and catering
            operations — built by someone who has run the shift each one
            solves for.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-8 gap-y-2">
          {footerNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </Container>

      <Container className="flex flex-col gap-2 border-t border-border py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          &copy; {year} {site.name}. All rights reserved.
        </p>
        <p>Built and operated by {site.founder}.</p>
      </Container>
    </footer>
  );
}
