// Common questions, as an accordion (anchor: #faq). Edited in Admin → Website → FAQs.

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/ui/motion";
import { Section, SectionHeader } from "@/components/ui/section";
import { getFaqs } from "@/lib/site-content";
import { stagger } from "@/lib/utils";

export async function Faq() {
  const faqs = await getFaqs();

  return (
    <Section id="faq" muted>
      <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
        <div>
          <SectionHeader eyebrow="FAQ" title="Questions, answered" />
          <p className="mt-4 text-zinc-600">
            Can&apos;t find what you&apos;re looking for? Visit the{" "}
            <Link href="/help" className="font-medium text-zinc-900 underline underline-offset-4">
              Help center
            </Link>
            .
          </p>
        </div>
        <div className="divide-y divide-zinc-200 border-y border-zinc-200">
          {faqs.map((faq, i) => (
            <Reveal key={faq.question} delay={stagger(i, 0.05)}>
              <details className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-medium text-zinc-900">
                  {faq.question}
                  <ChevronDown
                    size={18}
                    className="shrink-0 text-zinc-500 transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <p className="mt-3 pr-10 leading-7 text-zinc-600">{faq.answer}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
