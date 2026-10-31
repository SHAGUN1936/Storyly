"use client";

// Small animation helpers built on the `motion` library (same feel as the Event site).
// They can wrap server-rendered content: <Reveal><h2>…</h2></Reveal>

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useEffect, useRef } from "react";

const ease = [0.2, 0.7, 0.2, 1] as const;

/**
 * Fades and slides its content up the first time it scrolls into view,
 * so a page builds up as you scroll instead of appearing all at once.
 *   <Reveal delay={stagger(i)}>…</Reveal>   items of a grid (stagger from @/lib/utils)
 *   <Reveal onLoad>…</Reveal>                  content already on screen (the hero)
 */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  onLoad = false,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  /** How far (px) it rises from. */
  y?: number;
  /** Animate straight away instead of waiting to be scrolled into view. */
  onLoad?: boolean;
  className?: string;
}) {
  const shown = { opacity: 1, y: 0 };
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      animate={onLoad ? shown : undefined}
      whileInView={onLoad ? undefined : shown}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

/**
 * A headline whose words come in one by one, rising out of a soft blur.
 *   <h1><RevealWords text="Pages people" /> <RevealWords text="remember." delay={0.3} className="text-zinc-500" /></h1>
 */
export function RevealWords({
  text,
  delay = 0,
  step = 0.07,
  className,
}: {
  text: string;
  delay?: number;
  /** Seconds between words. */
  step?: number;
  className?: string;
}) {
  return (
    <span className={className}>
      {text.split(" ").map((word, i, words) => (
        <span key={i}>
          <motion.span
            className="inline-block"
            initial={{ opacity: 0, y: "0.35em", filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, delay: delay + i * step, ease }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 && " "}
        </span>
      ))}
    </span>
  );
}

/** Counts up from 0 to `to` when it becomes visible: <Counter to={12480} suffix="+" /> */
export function Counter({ to, prefix = "", suffix = "" }: { to: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration: 1.6,
      ease: "easeOut",
      onUpdate: (value) => {
        if (ref.current) ref.current.textContent = prefix + Math.round(value).toLocaleString("en-IN") + suffix;
      },
    });
    return () => controls.stop();
  }, [inView, to, prefix, suffix]);

  return (
    <span ref={ref}>
      {prefix}0{suffix}
    </span>
  );
}

/**
 * Moves its content at a different speed from the page while it scrolls past (parallax).
 *   <Parallax speed={0.2}>…</Parallax>     drifts 20% of its travel: positive = slower, negative = faster
 */
export function Parallax({
  children,
  speed = 0.15,
  className,
}: {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : [`${speed * 100}%`, `${-speed * 100}%`]);
  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

/** Content at the top of the page that sinks slowly and fades as the page scrolls (hero text). */
export function ScrollFade({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, reduce ? 0 : 140]);
  const opacity = useTransform(scrollY, [0, 450], [1, reduce ? 1 : 0]);
  return (
    <motion.div style={{ y, opacity }} className={className}>
      {children}
    </motion.div>
  );
}

/** Starts tilted back and smaller, and straightens up as it scrolls into the middle of the screen. */
export function TiltIn({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : 22, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [reduce ? 1 : 0.9, 1]);
  return (
    <div ref={ref} className={className} style={{ perspective: 1400 }}>
      <motion.div style={{ rotateX, scale, transformOrigin: "50% 100%" }}>{children}</motion.div>
    </div>
  );
}

/**
 * Cards that pile up while scrolling: each one sticks near the top, the next slides over it,
 * and the ones underneath shrink a little.
 *   <StackingCards items={…} renderCard={(item, i, progress) => …} />
 * `progress` (0 → 1 while that card comes into place) can drive effects inside the card.
 */
export function StackingCards<T>({
  items,
  renderCard,
  className,
}: {
  items: T[];
  renderCard: (item: T, index: number, progress: MotionValue<number>) => React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  return (
    <div ref={ref} className={className}>
      {items.map((item, i) => (
        <StackingCard key={i} index={i} total={items.length} progress={scrollYProgress}>
          {(inner) => renderCard(item, i, inner)}
        </StackingCard>
      ))}
    </div>
  );
}

function StackingCard({
  index,
  total,
  progress,
  children,
}: {
  index: number;
  total: number;
  progress: MotionValue<number>;
  children: (inner: MotionValue<number>) => React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress: inner } = useScroll({ target: ref, offset: ["start end", "start start"] });
  const scale = useTransform(progress, [index / total, 1], [1, reduce ? 1 : 1 - (total - 1 - index) * 0.05]);
  return (
    <div ref={ref} className="sticky top-0 flex h-svh items-center justify-center">
      <motion.div style={{ scale, top: `calc(${index * 26}px - 2vh)` }} className="relative w-full origin-top">
        {children(inner)}
      </motion.div>
    </div>
  );
}

/**
 * A soft light that follows the mouse across a card.
 *   <Spotlight className="rounded-3xl …">…</Spotlight>
 * tone="dark" for black cards (a white glow), "light" for white cards (a grey glow).
 */
export function Spotlight({
  children,
  className,
  tone = "light",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "light" | "dark";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const glow = tone === "dark" ? "rgba(255,255,255,.12)" : "rgba(24,24,27,.07)";
  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const r = ref.current!.getBoundingClientRect();
        ref.current!.style.setProperty("--spot-x", `${e.clientX - r.left}px`);
        ref.current!.style.setProperty("--spot-y", `${e.clientY - r.top}px`);
      }}
      className={`group/spot relative ${className ?? ""}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
        style={{ background: `radial-gradient(420px circle at var(--spot-x) var(--spot-y), ${glow}, transparent 60%)` }}
      />
      {children}
    </div>
  );
}

/** Leans gently towards the mouse in 3D, and settles back when it leaves. <Tilt>…</Tilt> */
export function Tilt({
  children,
  className,
  max = 7,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const spring = { stiffness: 220, damping: 20 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [max, -max]), spring);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-max, max]), spring);

  return (
    <div className={className} style={{ perspective: 900 }}>
      <motion.div
        ref={ref}
        style={reduce ? undefined : { rotateX, rotateY, transformStyle: "preserve-3d" }}
        onMouseMove={(e) => {
          const r = ref.current!.getBoundingClientRect();
          x.set((e.clientX - r.left) / r.width - 0.5);
          y.set((e.clientY - r.top) / r.height - 0.5);
        }}
        onMouseLeave={() => {
          x.set(0);
          y.set(0);
        }}
        className="h-full"
      >
        {children}
      </motion.div>
    </div>
  );
}
