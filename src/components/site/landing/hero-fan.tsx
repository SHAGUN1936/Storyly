"use client";

// The hero's fan of page designs: the cards start as one stack, spread out on load,
// and drift up slightly as the page scrolls.

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import { MiniPage, type MiniDesign } from "./mini-pages";

/** Left to right: design, sideways shift (% of a card), tilt, and whether phones show it. */
const FAN: Array<{ design: MiniDesign; x: number; rotate: number; phone: boolean }> = [
  { design: "anniversary", x: -128, rotate: -14, phone: false },
  { design: "birthday", x: -66, rotate: -7, phone: true },
  { design: "wedding", x: 0, rotate: 0, phone: true },
  { design: "invite", x: 66, rotate: 7, phone: true },
  { design: "thanks", x: 128, rotate: 14, phone: false },
];

export function HeroFan() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const lift = useTransform(scrollYProgress, [0.4, 1], [0, reduce ? 0 : -60]);

  return (
    <div ref={ref} className="relative mx-auto mt-12 h-[260px] max-w-6xl sm:mt-14 sm:h-[340px] lg:h-[380px]">
      <motion.div style={{ y: lift }} className="absolute inset-0">
        {FAN.map(({ design, x, rotate, phone }, i) => (
          <motion.div
            key={design}
            className={cn(
              "absolute -bottom-16 left-1/2 w-[40%] origin-bottom sm:w-[25%] lg:w-[22%]",
              !phone && "hidden sm:block",
              x === 0 ? "z-20" : Math.abs(x) < 100 ? "z-10" : "z-0",
            )}
            initial={reduce ? false : { x: "-50%", rotate: 0, y: 120, opacity: 0 }}
            animate={{ x: `${x - 50}%`, rotate, y: 0, opacity: 1 }}
            transition={{
              opacity: { duration: 0.5, delay: 0.25 },
              y: { duration: 0.9, delay: 0.25, ease: [0.2, 0.7, 0.2, 1] },
              x: { duration: 1.1, delay: 0.75 + Math.abs(i - 2) * 0.05, ease: [0.2, 0.8, 0.2, 1] },
              rotate: { duration: 1.1, delay: 0.75 + Math.abs(i - 2) * 0.05, ease: [0.2, 0.8, 0.2, 1] },
            }}
            whileHover={{ y: -16, transition: { duration: 0.3 } }}
          >
            <MiniPage
              design={design}
              className={cn(
                "rounded-2xl shadow-2xl ring-1 shadow-black/60 ring-white/10 transition-[filter] duration-300",
                x !== 0 && "brightness-[.85] hover:brightness-100",
              )}
            />
          </motion.div>
        ))}
      </motion.div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-24 bg-gradient-to-t from-zinc-950 to-transparent"
      />
    </div>
  );
}
