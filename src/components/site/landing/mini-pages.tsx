// Small finished-page designs, drawn in HTML so they stay sharp at any size.
// Each is a @container, so its type scales with the card: <MiniPage design="wedding" className="w-64" />

import { Cake, Flower2, Wine } from "lucide-react";
import { cn } from "@/lib/utils";

export type MiniDesign = "wedding" | "birthday" | "anniversary" | "invite" | "thanks" | "couple";

/** A dark, softly lit panel holding a white line illustration (where a photo would go). */
function Scene({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden text-white",
        "bg-[radial-gradient(110%_80%_at_30%_15%,#71717a,#27272a_55%,#09090b)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Four-point sparkle. */
const Sparkle = ({ x, y, size }: { x: number; y: number; size: number }) => (
  <path
    d={`M${x} ${y - size}Q${x} ${y} ${x + size} ${y}Q${x} ${y} ${x} ${y + size}Q${x} ${y} ${x - size} ${y}Q${x} ${y} ${x} ${y - size}Z`}
    fill="currentColor"
    stroke="none"
  />
);

/** Two linked wedding rings. */
const Rings = () => (
  <svg viewBox="0 0 100 80" className="w-[62%]" fill="none" stroke="currentColor" strokeWidth="2.4">
    <circle cx="40" cy="46" r="20" opacity=".9" />
    <circle cx="60" cy="42" r="20" />
    <path d="M56 18l4-6 4 6-4 4z" fill="currentColor" />
    <Sparkle x={84} y={16} size={5} />
    <Sparkle x={16} y={20} size={3} />
    <Sparkle x={88} y={64} size={3} />
  </svg>
);

/** A ring with a diamond, and light around it. */
const Diamond = () => (
  <svg viewBox="0 0 100 100" className="w-[58%]" fill="none" stroke="currentColor" strokeWidth="2.2">
    <g opacity=".25" strokeWidth="1.2">
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => (
        <line
          key={a}
          x1="50"
          y1="34"
          x2={50 + 46 * Math.cos((a * Math.PI) / 180)}
          y2={34 + 46 * Math.sin((a * Math.PI) / 180)}
        />
      ))}
    </g>
    <path d="M38 30l6-8h12l6 8-12 14z" fill="#09090b" />
    <path d="M38 30h24M44 22l6 8 6-8M50 44V30" strokeWidth="1.4" />
    <circle cx="50" cy="64" r="20" />
    <Sparkle x={80} y={18} size={5} />
    <Sparkle x={20} y={70} size={3} />
  </svg>
);

const DESIGNS: Record<MiniDesign, React.ReactNode> = {
  wedding: (
    <div className="flex h-full flex-col items-center justify-center bg-[#f7f6f3] px-[8cqw] text-center text-zinc-900">
      <p className="text-[3.2cqw] tracking-[0.35em] text-zinc-500 uppercase">Save the date</p>
      <p className="mt-[5cqw] font-serif text-[12cqw] leading-[1.05]">Our Wedding</p>
      <div className="mx-auto mt-[5cqw] h-px w-[14cqw] bg-zinc-400" />
      <p className="mt-[5cqw] font-serif text-[4.4cqw] text-zinc-700">Saturday, 12 December</p>
      <p className="mt-[1.5cqw] text-[3.4cqw] text-zinc-500">The Palace Gardens</p>
      <span className="mt-[7cqw] rounded-full bg-zinc-900 px-[6cqw] py-[2.2cqw] text-[3.2cqw] font-semibold tracking-widest text-white uppercase">
        RSVP
      </span>
    </div>
  ),
  birthday: (
    <div className="relative flex h-full flex-col justify-between overflow-hidden bg-zinc-950 p-[8cqw] text-white">
      <p className="text-[3.4cqw] tracking-[0.3em] text-zinc-400 uppercase">You&apos;re invited</p>
      <p
        className="absolute top-[16cqw] -right-[6cqw] text-[62cqw] leading-none font-black text-transparent"
        style={{ WebkitTextStroke: "0.5cqw rgba(255,255,255,.35)" }}
      >
        30
      </p>
      <div>
        <p className="text-[11cqw] leading-[1] font-semibold tracking-tight">Let&apos;s celebrate</p>
        <p className="mt-[3cqw] text-[3.8cqw] text-zinc-400">Sat · 8 PM · The Rooftop</p>
      </div>
    </div>
  ),
  anniversary: (
    <div className="flex h-full flex-col bg-white text-zinc-900">
      <Scene className="h-[62%]">
        <Rings />
      </Scene>
      <div className="flex flex-1 flex-col justify-center px-[8cqw]">
        <p className="text-[3.2cqw] tracking-[0.3em] text-zinc-500 uppercase">Ten years</p>
        <p className="mt-[2cqw] font-serif text-[9cqw] leading-[1.05] italic">and counting</p>
      </div>
    </div>
  ),
  invite: (
    <div className="flex h-full flex-col bg-white p-[8cqw] text-zinc-900">
      <div className="flex items-center justify-between text-[3.2cqw] text-zinc-500">
        <span className="font-semibold text-zinc-900">Launch night</span>
        <span>01 / 03</span>
      </div>
      <p className="mt-auto text-[13cqw] leading-[0.95] font-bold tracking-tight">
        Join us
        <br />
        <span className="text-zinc-400">this Friday.</span>
      </p>
      <div className="mt-[6cqw] grid grid-cols-3 gap-[2cqw] border-t border-zinc-200 pt-[4cqw] text-[3cqw]">
        {["Date", "Time", "Place"].map((label, i) => (
          <div key={label}>
            <p className="text-zinc-400">{label}</p>
            <p className="font-semibold">{["14 Mar", "7 PM", "Studio 9"][i]}</p>
          </div>
        ))}
      </div>
    </div>
  ),
  thanks: (
    <div className="flex h-full flex-col items-center justify-center bg-zinc-100 px-[8cqw] text-center text-zinc-900">
      <div className="grid w-full grid-cols-3 gap-[2cqw]">
        {[Flower2, Cake, Wine].map((Icon, i) => (
          <Scene key={i} className="aspect-square rounded-[2cqw]">
            <Icon className="size-[55%]" strokeWidth={1.4} />
          </Scene>
        ))}
      </div>
      <p className="mt-[8cqw] font-serif text-[13cqw] leading-none italic">Thank you</p>
      <p className="mt-[4cqw] text-[3.6cqw] text-zinc-500">for making the day unforgettable</p>
    </div>
  ),
  couple: (
    <div className="relative h-full text-white">
      <Scene className="absolute inset-0 items-start pt-[14cqw]">
        <Diamond />
      </Scene>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-[8cqw]">
        <p className="text-[3.2cqw] tracking-[0.3em] text-white/70 uppercase">Will you</p>
        <p className="mt-[1cqw] font-serif text-[12cqw] leading-none">marry me?</p>
      </div>
    </div>
  ),
};

export function MiniPage({ design, className }: { design: MiniDesign; className?: string }) {
  return (
    <div aria-hidden className={cn("@container aspect-[3/4] overflow-hidden select-none", className)}>
      {DESIGNS[design]}
    </div>
  );
}

/** Sample design shown for a template category when a template has no thumbnail. */
export const CATEGORY_DESIGNS: Record<string, MiniDesign> = {
  Wedding: "wedding",
  Birthday: "birthday",
  Love: "couple",
  Couple: "couple",
  Memories: "anniversary",
  Friendship: "thanks",
  Greeting: "thanks",
  Event: "invite",
  Invitation: "invite",
};
