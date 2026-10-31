// Page frame inside the signed-in app: a dark title band (matching the website) with optional actions,
// then the content.
// Actions sit on black: use variant="inverted" or "secondary" buttons.

import { Reveal, RevealWords } from "@/components/ui/motion";
import { Container } from "@/components/ui/section";

export function AppPage({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="relative isolate overflow-hidden bg-zinc-950 text-white">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(50%_80%_at_15%_0%,rgba(255,255,255,.12),transparent)]"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.05)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_top_left,black_15%,transparent_60%)] bg-[size:56px_56px]"
        />
        <Container className="flex flex-wrap items-end justify-between gap-6 py-12 sm:py-14">
          <div className="min-w-0">
            <h1 className="font-display text-3xl leading-tight font-semibold sm:text-5xl">
              <RevealWords text={title} />
            </h1>
            {description && (
              <Reveal onLoad delay={0.15}>
                <p className="mt-3 max-w-2xl text-zinc-400">{description}</p>
              </Reveal>
            )}
          </div>
          {actions && (
            <Reveal onLoad delay={0.2} className="flex flex-wrap items-center gap-2">
              {actions}
            </Reveal>
          )}
        </Container>
      </div>
      <Container className="py-10 sm:py-12">
        <Reveal onLoad delay={0.1}>
          {children}
        </Reveal>
      </Container>
    </>
  );
}
