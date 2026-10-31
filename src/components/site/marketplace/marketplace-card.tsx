// One published template in the Marketplace grid.
// Visitors are sent to sign up when they choose a template; signed-in users go to its page.
// Templates without a thumbnail show a sample design for their category.

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { CATEGORY_DESIGNS, MiniPage } from "@/components/site/landing/mini-pages";
import { Tilt } from "@/components/ui/motion";
import { templateHref, type TemplateCardData } from "@/lib/template-card";

export function MarketplaceCard({ template, signedIn }: { template: TemplateCardData; signedIn: boolean }) {
  const href = signedIn ? templateHref(template) : "/signup";

  return (
    <Tilt className="h-full">
      <Link href={href} className="group flex h-full flex-col">
        <div className="relative aspect-4/5 overflow-hidden rounded-3xl bg-zinc-100">
          {template.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={template.thumbnailUrl}
              alt=""
              loading="lazy"
              className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : template.previewVideoUrl ? (
            <video
              src={template.previewVideoUrl}
              muted
              playsInline
              preload="metadata"
              className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <MiniPage
                design={CATEGORY_DESIGNS[template.category] ?? "invite"}
                className="w-[62%] rounded-xl shadow-xl shadow-zinc-900/20 transition-transform duration-500 ease-out group-hover:-translate-y-1.5 group-hover:-rotate-2"
              />
            </div>
          )}
          <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-zinc-700 backdrop-blur">
            {template.category}
          </span>
          <span className="absolute right-3 bottom-3 flex translate-y-2 items-center gap-1.5 rounded-full bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white opacity-0 shadow-lg transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            Use template <ArrowUpRight size={13} aria-hidden />
          </span>
        </div>
        <div className="mt-4 px-1">
          <h3 className="font-semibold text-zinc-900">
            {template.name}
            <span className="sr-only">: use template</span>
          </h3>
          {template.description && <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{template.description}</p>}
        </div>
      </Link>
    </Tilt>
  );
}
