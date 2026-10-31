// What you get, as a bento grid of tiles with small visuals (anchor: #features).

import { Check, Link2, Monitor, Music, Play, Smartphone } from "lucide-react";
import QRCode from "qrcode";
import { Parallax, Reveal, Spotlight } from "@/components/ui/motion";
import { Section, SectionHeader } from "@/components/ui/section";
import { siteUrl } from "@/config/site";
import { cn, stagger } from "@/lib/utils";
import { MiniPage } from "./mini-pages";

/** Heights of the bars in the music waveform. */
const WAVE = [30, 55, 40, 75, 50, 90, 65, 45, 80, 55, 35, 70, 95, 60, 40, 72, 50, 30, 62, 44, 80, 52, 36, 58];

function Tile({
  title,
  text,
  dark = false,
  className,
  visual,
  index,
}: {
  title: string;
  text: string;
  dark?: boolean;
  className?: string;
  visual: React.ReactNode;
  index: number;
}) {
  return (
    <Reveal delay={stagger(index % 3, 0.1)} className={cn("min-w-0", className)}>
      <Spotlight
        tone={dark ? "dark" : "light"}
        className={cn(
          "flex h-full flex-col overflow-hidden rounded-3xl border transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-24px_rgba(0,0,0,.25)]",
          dark ? "border-zinc-800 bg-zinc-950 text-white" : "border-zinc-200 bg-white",
        )}
      >
        <div className="relative flex min-h-48 flex-1 items-center justify-center overflow-hidden">{visual}</div>
        <div className="p-7 pt-0">
          <h3 className={cn("text-lg font-semibold", dark ? "text-white" : "text-zinc-900")}>{title}</h3>
          <p className={cn("mt-2 leading-7", dark ? "text-zinc-400" : "text-zinc-600")}>{text}</p>
        </div>
      </Spotlight>
    </Reveal>
  );
}

export async function Features() {
  const qrSvg = await QRCode.toString(siteUrl(), {
    type: "svg",
    margin: 0,
    color: { dark: "#18181b", light: "#ffffff" },
  });

  return (
    <Section id="features" muted>
      <SectionHeader
        eyebrow="Features"
        title="Everything a special page needs"
        description="Simple enough for anyone, flexible enough to make every page unique."
      />

      <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <Tile
          index={0}
          dark
          className="lg:col-span-2"
          title="Designer-made templates"
          text="Start from layouts made for weddings, birthdays, invitations and events, then make them yours."
          visual={
            <div className="flex translate-y-10 items-end gap-4 pt-8">
              {(["birthday", "wedding", "couple"] as const).map((design, i) => (
                <Parallax key={design} speed={i === 1 ? 0.25 : 0.1}>
                  <MiniPage
                    design={design}
                    className={cn(
                      "w-28 rounded-xl ring-1 ring-white/10 sm:w-36",
                      i === 1 ? "w-32 sm:w-44" : "opacity-70",
                    )}
                  />
                </Parallax>
              ))}
            </div>
          }
        />
        <Tile
          index={1}
          title="Edit everything in place"
          text="Click any text or photo on the page to change it."
          visual={
            <div className="relative">
              <p className="font-serif text-4xl text-zinc-900">Our big day</p>
              <span className="absolute -inset-x-3 -inset-y-2 rounded-sm outline-2 outline-zinc-900" />
              <span className="absolute -top-2 -right-1 h-12 w-0.5 translate-x-3 bg-zinc-900" />
            </div>
          }
        />
        <Tile
          index={2}
          title="Music and motion"
          text="Add a soundtrack and smooth animations so the page feels alive."
          visual={
            <div className="flex w-full items-center gap-4 px-8">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white">
                <Play size={16} className="ml-0.5 fill-current" aria-hidden />
              </span>
              <div className="flex h-14 flex-1 items-center gap-[3px]">
                {WAVE.map((h, i) => (
                  <span
                    key={i}
                    className={cn(
                      "flex-1 origin-center animate-wave rounded-full",
                      i < 10 ? "bg-zinc-900" : "bg-zinc-300",
                    )}
                    style={{ height: `${h}%`, animationDelay: `${(i % 6) * -0.2}s` }}
                  />
                ))}
              </div>
              <Music size={18} className="shrink-0 text-zinc-400" aria-hidden />
            </div>
          }
        />
        <Tile
          index={3}
          title="Phone and desktop"
          text="See exactly how guests will see it, and adjust each screen on its own."
          visual={
            <div className="flex items-end gap-3 text-zinc-300">
              <Monitor size={120} strokeWidth={0.8} aria-hidden />
              <Smartphone size={64} strokeWidth={1} className="text-zinc-900" aria-hidden />
            </div>
          }
        />
        <Tile
          index={4}
          title="One link and a QR code"
          text="Publish in a click. Share the short link anywhere, or print the QR code on cards."
          visual={
            <div className="flex items-center gap-5">
              <div
                className="size-24 rounded-xl border border-zinc-200 bg-white p-2.5 shadow-sm [&_svg]:size-full"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
              <div className="space-y-2">
                <span className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white py-1.5 pr-3 pl-2 text-sm text-zinc-700 shadow-xs">
                  <Link2 size={14} aria-hidden /> storyly.app/our-day
                </span>
                <span className="flex w-fit items-center gap-1.5 rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white">
                  <Check size={12} aria-hidden /> Link copied
                </span>
              </div>
            </div>
          }
        />
      </div>
    </Section>
  );
}
