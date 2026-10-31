// What customers say (anchor: #stories). Edited in Admin → Website.

import { UserRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/ui/motion";
import { stagger } from "@/lib/utils";
import { Section, SectionHeader } from "@/components/ui/section";
import { getTestimonials } from "@/lib/site-content";

export async function Testimonials() {
  const testimonials = await getTestimonials();
  if (!testimonials.length) return null;
  return (
    <Section id="stories">
      <SectionHeader eyebrow="Customers" title="Trusted for the moments that matter" align="center" />
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {testimonials.map((t, i) => (
          <Reveal key={t.name} delay={stagger(i, 0.1)}>
            <Card className="flex h-full flex-col">
              <blockquote className="flex-1 leading-7 text-zinc-700">&ldquo;{t.quote}&rdquo;</blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-zinc-100 pt-5">
                <span
                  className="flex size-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-600"
                  aria-hidden
                >
                  <UserRound size={18} />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-zinc-900">{t.name}</span>
                  <span className="block text-sm text-zinc-500">{t.role}</span>
                </span>
              </figcaption>
            </Card>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
