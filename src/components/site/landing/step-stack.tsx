"use client";

// "How it works" as stacking cards: each step sticks near the top while the next one slides over it.
// Every card explains its step on the left and shows it on the right; the visual rises into place.

import { Check, Link2, MousePointer2, Music, Play, Sparkles, Timer } from "lucide-react";
import { motion, useTransform, type MotionValue } from "motion/react";
import { StackingCards } from "@/components/ui/motion";
import { cn } from "@/lib/utils";
import { STEPS } from "./data";
import { MiniPage } from "./mini-pages";

type Step = (typeof STEPS)[number];

/** Card colours, step by step. */
const TONES = [
  "bg-white text-zinc-900",
  "bg-zinc-800 text-white",
  "bg-zinc-100 text-zinc-900",
  "bg-zinc-900 text-white ring-1 ring-white/10",
];

function ChooseVisual() {
  return (
    <div className="relative flex h-full items-center justify-center">
      <MiniPage design="birthday" className="absolute w-[34%] -translate-x-[70%] -rotate-8 rounded-xl shadow-xl" />
      <MiniPage design="couple" className="absolute w-[34%] translate-x-[70%] rotate-8 rounded-xl shadow-xl" />
      <MiniPage design="wedding" className="relative z-10 w-[40%] rounded-xl shadow-2xl ring-2 ring-zinc-900" />
    </div>
  );
}

function EditVisual() {
  return (
    <div className="relative flex h-full items-center justify-center">
      <div className="relative w-[46%]">
        <MiniPage design="wedding" className="rounded-xl shadow-2xl" />
        <span className="absolute top-[34%] left-[6%] h-[12%] w-[88%] outline-2 outline-white" />
        <span className="absolute top-[33%] left-[6%] -translate-y-full rounded-md bg-white px-2 py-1 text-[10px] font-semibold text-zinc-900">
          Heading
        </span>
        <MousePointer2 size={22} className="absolute top-[42%] left-[84%] fill-white text-zinc-900" aria-hidden />
      </div>
      <div className="absolute right-[4%] bottom-[10%] w-44 space-y-2 rounded-xl bg-white p-3 text-[11px] text-zinc-600 shadow-2xl">
        <p className="flex justify-between">
          Font <span className="font-serif text-zinc-900">Playfair</span>
        </p>
        <p className="flex justify-between">
          Size <span className="text-zinc-900">48px</span>
        </p>
        <p className="flex items-center justify-between">
          Colour <span className="size-3.5 rounded bg-zinc-900" />
        </p>
      </div>
    </div>
  );
}

function TouchesVisual() {
  return (
    <div className="flex h-full items-center justify-center gap-6">
      <div className="space-y-2.5">
        {[
          { icon: Sparkles, label: "Slide up · on scroll" },
          { icon: Music, label: "Soundtrack" },
          { icon: Timer, label: "Countdown · 12 days" },
        ].map(({ icon: Icon, label }, i) => (
          <div
            key={label}
            className={cn(
              "flex items-center gap-2.5 rounded-xl bg-white px-3.5 py-2.5 text-xs font-medium text-zinc-900 shadow-lg",
              i === 1 && "translate-x-5",
            )}
          >
            <Icon size={14} aria-hidden /> {label}
          </div>
        ))}
        <div className="flex items-center gap-2 pt-2 pl-1">
          <span className="flex size-7 items-center justify-center rounded-full bg-zinc-900 text-white">
            <Play size={11} className="ml-0.5 fill-current" aria-hidden />
          </span>
          <span className="flex h-6 items-center gap-[3px]">
            {[40, 80, 55, 100, 65, 85, 45, 70, 50].map((h, i) => (
              <span
                key={i}
                className="w-1 animate-wave rounded-full bg-zinc-900"
                style={{ height: `${h}%`, animationDelay: `${i * -0.15}s` }}
              />
            ))}
          </span>
        </div>
      </div>
      <div className="w-[30%] rounded-[1.6rem] bg-zinc-950 p-1.5 shadow-2xl">
        <MiniPage design="anniversary" className="aspect-[9/17] rounded-[1.2rem]" />
      </div>
    </div>
  );
}

function ShareVisual({ qrSvg }: { qrSvg: string }) {
  return (
    <div className="flex h-full items-center justify-center gap-6">
      <div className="w-60 space-y-2">
        <div className="rounded-2xl rounded-bl-sm bg-zinc-700 p-3 text-sm text-white">
          You&apos;re invited! Open our page 💌
          <div className="mt-2 overflow-hidden rounded-xl bg-white text-zinc-900">
            <MiniPage design="wedding" className="aspect-[16/9]" />
            <p className="flex items-center gap-1.5 px-3 py-2 text-xs text-zinc-500">
              <Link2 size={12} aria-hidden /> storyly.app/our-day
            </p>
          </div>
        </div>
        <p className="flex w-fit items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-zinc-900">
          <Check size={12} aria-hidden /> Delivered
        </p>
      </div>
      <div
        className="hidden size-32 rounded-2xl bg-white p-3 shadow-2xl sm:block [&_svg]:size-full"
        dangerouslySetInnerHTML={{ __html: qrSvg }}
      />
    </div>
  );
}

function StepCard({
  step,
  index,
  progress,
  qrSvg,
}: {
  step: Step;
  index: number;
  progress: MotionValue<number>;
  qrSvg: string;
}) {
  // The visual rises and settles as its card arrives.
  const y = useTransform(progress, [0, 1], [90, 0]);
  const scale = useTransform(progress, [0, 1], [0.9, 1]);
  const dark = index % 2 === 1;

  return (
    <article
      className={cn(
        "mx-auto grid min-h-[560px] max-w-6xl overflow-hidden rounded-[2rem] shadow-[0_-20px_60px_-20px_rgba(0,0,0,.5)] lg:h-[560px] lg:grid-cols-[1fr_1.15fr]",
        TONES[index],
      )}
    >
      <div className="flex flex-col p-8 sm:p-12">
        <p className={cn("text-sm font-semibold tabular-nums", dark ? "text-zinc-400" : "text-zinc-500")}>
          Step {String(index + 1).padStart(2, "0")}{" "}
          <span className="opacity-50">/ {String(STEPS.length).padStart(2, "0")}</span>
        </p>
        <h3 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">{step.title}</h3>
        <p className={cn("mt-4 text-base leading-7 sm:text-lg sm:leading-8", dark ? "text-zinc-300" : "text-zinc-600")}>
          {step.text}
        </p>
        <ul className="mt-auto space-y-2.5 pt-8">
          {step.points.map((point) => (
            <li key={point} className="flex items-center gap-3 text-sm font-medium">
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full",
                  dark ? "bg-white text-zinc-900" : "bg-zinc-900 text-white",
                )}
              >
                <Check size={11} strokeWidth={3} aria-hidden />
              </span>
              {point}
            </li>
          ))}
        </ul>
      </div>
      <div className={cn("relative min-h-72 overflow-hidden lg:min-h-0", dark ? "bg-white/5" : "bg-zinc-900/[.04]")}>
        <motion.div style={{ y, scale }} className="absolute inset-0">
          {index === 0 && <ChooseVisual />}
          {index === 1 && <EditVisual />}
          {index === 2 && <TouchesVisual />}
          {index === 3 && <ShareVisual qrSvg={qrSvg} />}
        </motion.div>
      </div>
    </article>
  );
}

export function StepStack({ qrSvg }: { qrSvg: string }) {
  return (
    <StackingCards
      items={STEPS}
      className="mt-6"
      renderCard={(step, i, progress) => <StepCard step={step} index={i} progress={progress} qrSvg={qrSvg} />}
    />
  );
}
