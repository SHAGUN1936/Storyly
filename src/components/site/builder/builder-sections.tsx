// The four tab bodies of /builder (Overview, How it works, Pricing, FAQ).
// The page header and tabs are rendered by the route.

import { ArrowRight, Check, ChevronDown, Heart, Send } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card, IconBadge } from "@/components/ui/card";
import { Reveal } from "@/components/ui/motion";
import { cn, stagger } from "@/lib/utils";
import { BUILDER_FAQ, BUILDER_PLANS, BUILDER_STEPS, type BuilderTab } from "./builder-data";

/** Fixed locale so the server and browser print the same number. */
const fmt = (n: number) => n.toLocaleString("en-IN");

export function BuilderTabBody({ tab }: { tab: BuilderTab }) {
  return (
    <>
      {tab === "" && <Overview />}
      {tab === "how-it-works" && <HowItWorks />}
      {tab === "pricing" && <Pricing />}
      {tab === "faq" && <Faq />}
    </>
  );
}

function Overview() {
  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex flex-col">
          <p className="text-sm font-medium text-zinc-500">For sellers</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-zinc-900">Two ways to earn</h2>
          <p className="mt-3 leading-7 text-zinc-600">You are paid for two actions our community takes:</p>
          <ul className="mt-6 space-y-5">
            <li className="flex items-start gap-4">
              <IconBadge className="shrink-0">
                <Heart aria-hidden />
              </IconBadge>
              <p className="text-sm leading-6 text-zinc-600">
                <strong className="font-semibold text-zinc-900">Likes.</strong> Every user who saves your template to
                their feed earns you a small fixed payout.
              </p>
            </li>
            <li className="flex items-start gap-4">
              <IconBadge className="shrink-0">
                <Send aria-hidden />
              </IconBadge>
              <p className="text-sm leading-6 text-zinc-600">
                <strong className="font-semibold text-zinc-900">Uses.</strong> Every time someone publishes a page with
                your template, you earn a larger payout scaled by your plan tier.
              </p>
            </li>
          </ul>
          <div className="mt-auto pt-8">
            <ButtonLink
              href="/builder/pricing"
              scroll={false}
              iconRight={<ArrowRight className="size-4" aria-hidden />}
            >
              See plans
            </ButtonLink>
          </div>
        </Card>

        <Card className="flex flex-col">
          <p className="text-sm font-medium text-zinc-500">Why a subscription</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-zinc-900">What the subscription pays for</h2>
          <p className="mt-3 leading-7 text-zinc-600">
            The subscription funds the seller dashboard, guaranteed review times, payout infrastructure and a higher
            creator share on every use.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "Real-time earnings dashboard",
              "Monthly payouts to UPI, bank or PayPal",
              "Featured-creator placements",
              "Direct access to the curation team",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-zinc-700">
                <Check className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-8">
            <ButtonLink
              href="/builder/how-it-works"
              scroll={false}
              variant="secondary"
              iconRight={<ArrowRight className="size-4" aria-hidden />}
            >
              How it works
            </ButtonLink>
          </div>
        </Card>
      </div>
    </>
  );
}

function HowItWorks() {
  return (
    <>
      <ol className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {BUILDER_STEPS.map((s, i) => (
          <li key={s.step}>
            <Reveal delay={stagger(i, 0.12)} className="h-full border-t border-zinc-200 pt-8">
              <p className="font-display text-6xl font-semibold text-zinc-200 tabular-nums">
                {String(Number(s.step)).padStart(2, "0")}
              </p>
              <h2 className="mt-6 text-lg font-semibold text-zinc-900">{s.title}</h2>
              <p className="mt-2 leading-7 text-zinc-600">{s.body}</p>
            </Reveal>
          </li>
        ))}
      </ol>

      <div className="prose mt-16 max-w-3xl prose-zinc prose-headings:font-semibold prose-headings:tracking-tight">
        <h2>What counts as a &quot;use&quot;?</h2>
        <p>
          A &quot;use&quot; is when a Storyly user chooses your template and publishes a page from it (the page goes
          live with a share link). Previews, edits and discarded drafts do not count.
        </p>
        <h2>What if my template is saved but never used?</h2>
        <p>
          You still earn the &quot;like&quot; payout when it is saved. The &quot;use&quot; payout applies only on
          publish.
        </p>
        <h2>Can I update an existing template?</h2>
        <p>Yes. Updates go through a faster review queue, and existing buyers receive the new version automatically.</p>
      </div>
    </>
  );
}

function Pricing() {
  return (
    <>
      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
        {BUILDER_PLANS.map((p, i) => (
          <Reveal key={p.id} delay={stagger(i, 0.1)} className="h-full">
            <Card
              className={cn(
                "relative flex h-full flex-col",
                p.highlight && "border-zinc-900 bg-zinc-950 text-white shadow-2xl shadow-zinc-900/30",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className={cn("font-semibold", p.highlight ? "text-white" : "text-zinc-900")}>{p.name}</h2>
                {p.highlight && (
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-zinc-900">
                    Best value
                  </span>
                )}
              </div>
              <p className={cn("mt-2 text-sm leading-6", p.highlight ? "text-zinc-400" : "text-zinc-600")}>{p.blurb}</p>
              <p className="mt-6 flex items-baseline gap-1.5">
                <span
                  className={cn("font-display text-5xl font-semibold", p.highlight ? "text-white" : "text-zinc-900")}
                >
                  ₹{fmt(p.price)}
                </span>
                <span className="text-sm text-zinc-500">{p.period}</span>
              </p>
              <ButtonLink href="/signup" variant={p.highlight ? "inverted" : "primary"} className="mt-6 w-full">
                {p.cta}
              </ButtonLink>
              <ul className={cn("mt-8 space-y-3 border-t pt-6", p.highlight ? "border-white/10" : "border-zinc-100")}>
                {p.features.map((f) => (
                  <li
                    key={f}
                    className={cn("flex items-start gap-3 text-sm", p.highlight ? "text-zinc-300" : "text-zinc-700")}
                  >
                    <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>
        ))}
      </div>
      <p className="mt-8 text-center text-sm text-zinc-500">GST is added at checkout for Indian customers.</p>
    </>
  );
}

function Faq() {
  return (
    <div className="max-w-3xl divide-y divide-zinc-200 border-y border-zinc-200">
      {BUILDER_FAQ.map((f) => (
        <details key={f.q} className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-zinc-900 [&::-webkit-details-marker]:hidden">
            <h2 className="text-base">{f.q}</h2>
            <ChevronDown
              className="size-5 shrink-0 text-zinc-400 transition-transform group-open:rotate-180"
              aria-hidden
            />
          </summary>
          <p className="mt-3 pr-9 text-sm leading-7 text-zinc-600">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
