// The template editor, drawn as a mockup (anchor: #editor), with three short points under it.

import { Layers, MonitorSmartphone, MousePointer2, Plus, Settings2, Sparkles, Type } from "lucide-react";
import { Reveal, TiltIn } from "@/components/ui/motion";
import { Section, SectionHeader } from "@/components/ui/section";
import { stagger } from "@/lib/utils";
import { MiniPage } from "./mini-pages";

const POINTS = [
  {
    icon: Type,
    title: "Click anything to change it",
    text: "Type straight onto the page, swap photos and pick fonts. No forms, no code.",
  },
  {
    icon: MonitorSmartphone,
    title: "Perfect on every screen",
    text: "Switch between phone and desktop and fine-tune each one separately.",
  },
  {
    icon: Sparkles,
    title: "Motion that feels premium",
    text: "Add entrance and scroll animations, countdowns, maps and galleries in a click.",
  },
];

/** A grey bar standing in for text in the mockup. */
const Bar = ({ w, dark = false }: { w: string; dark?: boolean }) => (
  <span className={`block h-1.5 rounded-full ${dark ? "bg-zinc-400" : "bg-zinc-200"}`} style={{ width: w }} />
);

function EditorMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_40px_100px_-30px_rgba(0,0,0,.35)]">
      {/* Top bar */}
      <div className="flex h-11 items-center gap-3 border-b border-zinc-200 px-4">
        <span className="size-5 rounded-md bg-zinc-900" />
        <Bar w="90px" dark />
        <div className="mx-auto hidden gap-1 rounded-md bg-zinc-100 p-1 sm:flex">
          {["Desktop", "Tablet", "Phone"].map((d, i) => (
            <span
              key={d}
              className={`rounded px-2.5 py-0.5 text-[10px] font-medium ${i === 0 ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-500"}`}
            >
              {d}
            </span>
          ))}
        </div>
        <span className="ml-auto rounded-md bg-zinc-900 px-3 py-1 text-[10px] font-semibold text-white sm:ml-0">
          Publish
        </span>
      </div>

      <div className="flex h-[300px] sm:h-[440px]">
        {/* Rail + layers */}
        <div className="hidden w-12 shrink-0 flex-col items-center gap-3 border-r border-zinc-200 py-4 text-zinc-500 md:flex">
          <span className="rounded-md bg-zinc-900 p-1.5 text-white">
            <Layers size={14} />
          </span>
          <Plus size={14} />
          <Settings2 size={14} />
        </div>
        <div className="hidden w-48 shrink-0 space-y-3 border-r border-zinc-200 p-4 lg:block">
          {["70%", "55%", "80%", "45%", "65%", "50%", "72%"].map((w, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${i === 2 ? "bg-zinc-900" : ""}`}
              style={{ paddingLeft: 8 + (i % 3) * 10 }}
            >
              <span className={`size-2.5 rounded-sm ${i === 2 ? "bg-white/70" : "bg-zinc-300"}`} />
              <span
                className={`block h-1.5 rounded-full ${i === 2 ? "bg-white/70" : "bg-zinc-200"}`}
                style={{ width: w }}
              />
            </div>
          ))}
        </div>

        {/* Canvas with a selected heading */}
        <div className="relative flex min-w-0 flex-1 items-center justify-center bg-zinc-100 p-6">
          <div className="relative w-[210px] shadow-xl sm:w-[260px]">
            <MiniPage design="wedding" />
            <div className="pointer-events-none absolute top-[37%] left-[10%] h-[17%] w-[80%] animate-demo-select outline-2 outline-zinc-900">
              <span className="absolute -top-7 left-0 flex items-center gap-1 rounded-md bg-zinc-900 px-2 py-1 text-[9px] font-medium whitespace-nowrap text-white">
                Heading
                <span className="ml-1 size-1.5 rounded-full bg-white/50" />
                <span className="size-1.5 rounded-full bg-white/50" />
                <span className="size-1.5 rounded-full bg-white/50" />
              </span>
            </div>
            <MousePointer2
              size={20}
              className="pointer-events-none absolute top-[48%] left-[72%] animate-demo-cursor fill-white text-zinc-900 drop-shadow"
              aria-hidden
            />
          </div>
        </div>

        {/* Inspector */}
        <div className="hidden w-56 shrink-0 space-y-5 border-l border-zinc-200 p-4 md:block">
          <div className="space-y-2">
            <span className="block text-[9px] font-semibold tracking-wider text-zinc-400 uppercase">Text</span>
            <div className="h-7 rounded-md border border-zinc-200 px-2 pt-2.5">
              <Bar w="60%" dark />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="h-7 rounded-md border border-zinc-200" />
              <div className="h-7 rounded-md border border-zinc-200" />
            </div>
            <div className="flex items-center gap-2">
              <span className="size-7 rounded-md bg-zinc-900" />
              <div className="h-7 flex-1 rounded-md border border-zinc-200" />
            </div>
          </div>
          <div className="space-y-2">
            <span className="block text-[9px] font-semibold tracking-wider text-zinc-400 uppercase">Animation</span>
            <div className="h-7 rounded-md border border-zinc-200 px-2 pt-2.5">
              <Bar w="45%" dark />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className="h-1 flex-1 rounded-full bg-zinc-200">
                <span className="block h-1 w-1/5 animate-demo-slider rounded-full bg-zinc-900" />
              </span>
              <Bar w="20px" />
            </div>
          </div>
          <div className="space-y-2">
            <span className="block text-[9px] font-semibold tracking-wider text-zinc-400 uppercase">For users</span>
            <div className="flex items-center justify-between">
              <Bar w="60%" />
              <span className="flex h-4 w-7 items-center justify-end rounded-full bg-zinc-900 px-0.5">
                <span className="size-3 rounded-full bg-white" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EditorShowcase() {
  return (
    <Section id="editor" className="overflow-hidden">
      <SectionHeader
        eyebrow="The editor"
        title="Design it like a pro. No design skills needed."
        description="Every template opens in a real visual editor, the kind you'd expect from a design app, made simple for personal pages."
        align="center"
      />
      <TiltIn className="mt-14 sm:mt-16">
        <EditorMockup />
      </TiltIn>
      <div className="mt-16 grid gap-10 md:grid-cols-3">
        {POINTS.map(({ icon: Icon, title, text }, i) => (
          <Reveal key={title} delay={stagger(i, 0.1)}>
            <Icon size={22} strokeWidth={1.6} className="text-zinc-900" aria-hidden />
            <h3 className="mt-4 text-lg font-semibold text-zinc-900">{title}</h3>
            <p className="mt-2 leading-7 text-zinc-600">{text}</p>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
