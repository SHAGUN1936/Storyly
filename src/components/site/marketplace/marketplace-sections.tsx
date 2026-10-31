// The sections of /marketplace, top to bottom: template grid, how buying works, seller CTA.
// The page header and tabs are rendered by the route.

import { ArrowRight, LayoutTemplate } from "lucide-react";
import { EmptyState } from "@/components/app/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { Parallax, Reveal } from "@/components/ui/motion";
import { MiniPage } from "@/components/site/landing/mini-pages";
import { stagger } from "@/lib/utils";
import { Eyebrow, Section, SectionHeader } from "@/components/ui/section";
import { MarketplaceCard } from "./marketplace-card";
import { TAB_CATEGORIES, type MarketplaceCategory } from "./templates";
import { getCurrentUser } from "@/lib/auth";
import { toTemplateCard } from "@/lib/template-card";
import { listPublishedTemplates } from "@/server/templates";

/** Published templates for one tab (or all of them when `category` is null). */
export async function TemplateGrid({ category }: { category: MarketplaceCategory | null }) {
  const [templates, user] = await Promise.all([listPublishedTemplates(), getCurrentUser()]);
  const visible = category ? templates.filter((t) => TAB_CATEGORIES[category].includes(t.category)) : templates;

  if (!visible.length) {
    return (
      <EmptyState
        icon={<LayoutTemplate />}
        title="No templates here yet"
        text="New templates are added regularly. Check another category or come back soon."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
      {visible.map((t, i) => (
        <Reveal key={`${t.sourceType}-${t.id}`} delay={stagger(i % 4)} className="h-full">
          <MarketplaceCard template={toTemplateCard(t)} signedIn={Boolean(user)} />
        </Reveal>
      ))}
    </div>
  );
}

const STEPS = [
  { step: "1", title: "Choose a template", body: "Browse by category and open any card to preview it." },
  {
    step: "2",
    title: "Pay once",
    body: "UPI, cards, NetBanking or wallets. Each template is priced individually, with no subscription.",
  },
  {
    step: "3",
    title: "Added to your library",
    body: "The template appears in your “My templates” library permanently.",
  },
  {
    step: "4",
    title: "Use it any time",
    body: "Create new pages from your purchased templates whenever you need them.",
  },
];

export function HowBuyingWorks() {
  return (
    <Section tone="dark">
      <SectionHeader
        tone="dark"
        eyebrow="How it works"
        title="From purchase to published page"
        description="Every template is a one-time purchase that stays on your account."
      />
      <ol className="mt-16 grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {STEPS.map((s, i) => (
          <li key={s.step}>
            <Reveal delay={stagger(i, 0.12)} className="border-t border-white/15 pt-8">
              <p className="font-display text-6xl font-semibold text-zinc-700 tabular-nums">0{s.step}</p>
              <h3 className="mt-6 text-lg font-semibold text-white">{s.title}</h3>
              <p className="mt-2 leading-7 text-zinc-400">{s.body}</p>
            </Reveal>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/** Cross-link to the Builder Program for designers. */
export function SellerCta() {
  return (
    <Section>
      <Reveal>
        <div className="grid items-center overflow-hidden rounded-[2rem] bg-zinc-100 lg:grid-cols-[1.2fr_1fr]">
          <div className="p-8 sm:p-12">
            <Eyebrow>Builder Program</Eyebrow>
            <h2 className="mt-3 font-display text-3xl font-semibold text-zinc-900 sm:text-4xl">
              Are you a designer? Sell your templates here.
            </h2>
            <p className="mt-4 leading-7 text-zinc-600">
              Submit your own templates to the Marketplace. Subscribe to the Builder Program (monthly or yearly) and
              earn commission each time someone likes or uses your work.
            </p>
            <ButtonLink href="/builder" className="mt-8" iconRight={<ArrowRight className="size-4" aria-hidden />}>
              Become a builder
            </ButtonLink>
          </div>
          <div className="relative hidden h-full min-h-80 items-end justify-center gap-4 overflow-hidden pt-12 lg:flex">
            {(["invite", "wedding", "birthday"] as const).map((design, i) => (
              <Parallax key={design} speed={i === 1 ? 0.18 : 0.08} className={i === 1 ? "w-44" : "w-32"}>
                <MiniPage design={design} className="translate-y-8 rounded-xl shadow-xl shadow-zinc-900/20" />
              </Parallax>
            ))}
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
