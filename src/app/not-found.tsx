import { ArrowLeft } from "lucide-react";
import { PublicShell } from "@/components/site/public-shell";
import { ButtonLink } from "@/components/ui/button";
import { Reveal, RevealWords } from "@/components/ui/motion";
import { Container } from "@/components/ui/section";

export default function NotFound() {
  return (
    <PublicShell>
      <div data-dark-hero className="relative isolate overflow-hidden bg-zinc-950 text-white">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(55%_60%_at_50%_0%,rgba(255,255,255,.13),transparent)]"
        />
        <p
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 -translate-y-1/2 text-center font-display text-[38vw] leading-none font-semibold tracking-tighter text-white/[0.04] select-none sm:text-[28vw]"
        >
          404
        </p>
        <Container className="flex min-h-[70vh] flex-col items-center justify-center py-28 text-center">
          <p className="text-sm font-semibold tracking-wide text-zinc-500 uppercase">Error 404</p>
          <h1 className="mt-4 font-display text-4xl font-semibold sm:text-6xl">
            <RevealWords text="This page" /> <RevealWords text="wandered off." delay={0.2} className="text-zinc-500" />
          </h1>
          <Reveal onLoad delay={0.3}>
            <p className="mt-6 max-w-md text-lg text-zinc-400">
              The link may be out of date, or the page has been removed.
            </p>
            <ButtonLink href="/" variant="inverted" size="lg" className="mt-10" icon={<ArrowLeft size={18} />}>
              Back to home
            </ButtonLink>
          </Reveal>
        </Container>
      </div>
    </PublicShell>
  );
}
