// Page layout building blocks. Headers rise into view (see ./motion).
//   <Section>                          vertical rhythm + centred container
//     <SectionHeader eyebrow="Features" title="…" description="…" />
//   </Section>
//   <Section tone="dark">               near-black band (pair with <SectionHeader tone="dark">)

import { cn } from "@/lib/utils";
import { Reveal, RevealWords } from "./motion";

export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

export function Section({
  id,
  muted = false,
  tone = "light",
  className,
  children,
}: {
  id?: string;
  /** Light grey band, to separate sections */
  muted?: boolean;
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-20 py-20 sm:py-28",
        muted && "border-y border-zinc-200 bg-zinc-50",
        tone === "dark" && "bg-zinc-950 text-white",
        className,
      )}
    >
      <Container>{children}</Container>
    </section>
  );
}

type Tone = "light" | "dark";

/** Small accent label above a heading. */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-sm font-semibold tracking-wide text-zinc-500 uppercase", className)}>{children}</p>;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "light",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  tone?: Tone;
  className?: string;
}) {
  const dark = tone === "dark";
  return (
    <Reveal className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2
        className={cn(
          "mt-3 font-display text-3xl font-semibold sm:text-5xl sm:leading-[1.1]",
          dark ? "text-white" : "text-zinc-900",
        )}
      >
        {title}
      </h2>
      {description && (
        <p className={cn("mt-5 text-lg leading-8", dark ? "text-zinc-400" : "text-zinc-600")}>{description}</p>
      )}
    </Reveal>
  );
}

/**
 * Dark title block at the top of an inner page (About, Marketplace…), matching the home page hero.
 * It carries data-dark-hero, so the site header stays dark while it is under it.
 * Buttons passed as children sit on black: use variant="inverted" or the outlined white style.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Extra content under the text, e.g. buttons */
  children?: React.ReactNode;
}) {
  return (
    <div data-dark-hero className="relative isolate overflow-hidden bg-zinc-950 text-white">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(55%_70%_at_20%_0%,rgba(255,255,255,.13),transparent)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.05)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_top_left,black_15%,transparent_60%)] bg-[size:56px_56px]"
      />
      <Container className="py-20 sm:py-28">
        <div className="max-w-3xl">
          {eyebrow && (
            <Reveal onLoad>
              <Eyebrow className="text-zinc-400">{eyebrow}</Eyebrow>
            </Reveal>
          )}
          <h1 className="mt-4 font-display text-4xl leading-[1.05] font-semibold sm:text-6xl">
            {typeof title === "string" ? <RevealWords text={title} delay={0.05} /> : title}
          </h1>
          {description && (
            <Reveal onLoad delay={0.2}>
              <p className="mt-6 text-lg leading-8 text-zinc-400">{description}</p>
            </Reveal>
          )}
          {children && (
            <Reveal onLoad delay={0.3} className="mt-9">
              {children}
            </Reveal>
          )}
        </div>
      </Container>
    </div>
  );
}
