// Dark opening section: headline, the two main actions, and a fan of finished page designs (see ./hero-fan).

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Reveal, RevealWords, ScrollFade } from "@/components/ui/motion";
import { Container } from "@/components/ui/section";
import { HeroFan } from "./hero-fan";

export function Hero({ cta }: { cta: { href: string; label: string } }) {
  return (
    <section data-dark-hero className="relative isolate overflow-hidden bg-zinc-950 text-white">
      {/* Soft light from the top and a faint grid, for depth */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(60%_55%_at_50%_0%,rgba(255,255,255,.14),transparent)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.05)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_65%)] bg-[size:56px_56px]"
      />

      <ScrollFade>
        <Container className="pt-14 text-center sm:pt-20">
          <Reveal onLoad>
            <Link
              href="/#editor"
              className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/5 py-1 pr-3 pl-1 text-xs text-zinc-300 transition-colors hover:border-white/30 sm:text-sm"
            >
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-zinc-950">New</span>
              A full visual editor for every template
              <ArrowRight size={14} aria-hidden />
            </Link>
          </Reveal>
          <h1 className="mx-auto mt-8 max-w-5xl font-display text-5xl leading-[1.02] font-semibold text-balance sm:text-7xl lg:text-[88px]">
            <RevealWords text="Pages people" delay={0.05} />{" "}
            <RevealWords text="remember." delay={0.25} className="text-zinc-500" />
          </h1>
          <Reveal onLoad delay={0.16}>
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-zinc-400">
              Invitations, wedding websites and celebration pages. Pick a design, make it yours with your photos, words
              and music, and share it with one link or QR code.
            </p>
          </Reveal>
          <Reveal onLoad delay={0.24}>
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
            <p className="mt-5 text-sm text-zinc-500">Free plan available · No credit card required</p>
          </Reveal>
        </Container>
      </ScrollFade>

      {/* Fan of designs, cut off by the bottom edge */}
      <HeroFan />
    </section>
  );
}
