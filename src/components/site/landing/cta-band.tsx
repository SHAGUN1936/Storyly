// Closing call to action: a full-width dark band that runs into the dark footer (anchor: #get-started).

import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/motion";
import { Container } from "@/components/ui/section";

export function CtaBand({ cta }: { cta: { href: string; label: string } }) {
  return (
    <section id="get-started" className="relative isolate overflow-hidden bg-zinc-950 py-24 text-center sm:py-32">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(50%_60%_at_50%_100%,rgba(255,255,255,.12),transparent)]"
      />
      <Container>
        <Reveal>
          <h2 className="mx-auto max-w-3xl font-display text-4xl leading-[1.05] font-semibold text-white sm:text-6xl">
            Your story deserves <span className="text-zinc-500">more than a PDF.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mx-auto mt-6 max-w-xl text-lg text-zinc-400">
            Start free and publish your first page today. Upgrade only if you need more.
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <ButtonLink href={cta.href} size="lg" variant="inverted" iconRight={<ArrowRight size={18} />}>
              {cta.label}
            </ButtonLink>
            <ButtonLink
              href="/marketplace"
              size="lg"
              variant="ghost"
              className="border border-white/20 text-white hover:bg-white/10 hover:text-white"
            >
              Browse templates
            </ButtonLink>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
