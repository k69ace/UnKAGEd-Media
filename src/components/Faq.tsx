import { JsonLd } from "@/components/JsonLd";
import type { AppFaq } from "@/lib/apps";

export function Faq({ items }: { items: AppFaq[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <div>
      <JsonLd data={schema} />
      <div className="divide-y divide-border rounded-2xl border border-border">
        {items.map((item) => (
          <details key={item.question} className="group p-6">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-medium text-foreground marker:content-none">
              {item.question}
              <span className="shrink-0 text-muted transition-transform group-open:rotate-45">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted">{item.answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
