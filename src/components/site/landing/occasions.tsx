// Occasions people use Storyly for, each with a sample design, linking into the Marketplace.

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Parallax, Reveal } from "@/components/ui/motion";
import { Section, SectionHeader } from "@/components/ui/section";
import { stagger } from "@/lib/utils";
import { OCCASIONS } from "./data";
import { MiniPage } from "./mini-pages";

export function Occasions() {
  return (
    <Section id="templates">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeader eyebrow="Templates" title="Made for every occasion" />
        <Reveal>
          <Link
            href="/marketplace"
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-zinc-900"
          >
            View all templates
            <ArrowUpRight
              size={16}
              className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden
            />
          </Link>
        </Reveal>
      </div>
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {OCCASIONS.map(({ name, text, href, design }, i) => (
          <Reveal key={name} delay={stagger(i % 3, 0.1)}>
            <Link href={href} className="group block">
              <div className="flex aspect-[5/4] items-center justify-center overflow-hidden rounded-3xl bg-zinc-100 transition-colors duration-300 group-hover:bg-zinc-200/70">
                <Parallax speed={0.06 + (i % 3) * 0.04} className="w-[46%]">
                  <MiniPage
                    design={design}
                    className="rounded-xl shadow-xl shadow-zinc-900/20 transition-transform duration-500 ease-out group-hover:-translate-y-1.5 group-hover:-rotate-2"
                  />
                </Parallax>
              </div>
              <div className="mt-5 flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-zinc-900">{name}</p>
                  <p className="mt-0.5 text-sm text-zinc-500">{text}</p>
                </div>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition-colors group-hover:border-zinc-900 group-hover:bg-zinc-900 group-hover:text-white">
                  <ArrowUpRight size={16} aria-hidden />
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
