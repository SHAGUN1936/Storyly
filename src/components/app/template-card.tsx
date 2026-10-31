"use client";

// A template in a grid: thumbnail (or preview video, or a sample design for its category),
// name, category and a like button. Leans towards the mouse on hover.

import { ArrowUpRight, Heart } from "lucide-react";
import Link from "next/link";
import { CATEGORY_DESIGNS, MiniPage } from "@/components/site/landing/mini-pages";
import { Tilt } from "@/components/ui/motion";
import { useLikedTemplates } from "@/hooks/use-liked-templates";
import { templateHref, type TemplateCardData } from "@/lib/template-card";
import { cn } from "@/lib/utils";

export function TemplateCard({ template }: { template: TemplateCardData }) {
  const { isLiked, toggle } = useLikedTemplates();
  const liked = isLiked(template.id);

  return (
    <Tilt className="group relative">
      <Link href={templateHref(template)} className="block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-zinc-100 shadow-sm transition-shadow duration-300 group-hover:shadow-2xl group-hover:shadow-zinc-900/20">
          {template.thumbnailUrl ? (
            // Cloudinary already serves sized thumbnails
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
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <MiniPage
                design={CATEGORY_DESIGNS[template.category] ?? "invite"}
                className="w-[66%] rounded-xl shadow-xl shadow-zinc-900/20"
              />
            </div>
          )}
          <span className="absolute right-3 bottom-3 left-3 flex translate-y-2 items-center justify-center gap-1.5 rounded-full bg-zinc-900 py-2 text-xs font-semibold text-white opacity-0 shadow-lg transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            Use template <ArrowUpRight size={13} aria-hidden />
          </span>
        </div>
        <div className="mt-3 px-1">
          <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">{template.category}</p>
          <p className="mt-0.5 truncate font-semibold text-zinc-900">{template.name}</p>
        </div>
      </Link>
      <button
        type="button"
        onClick={() => toggle(template)}
        aria-pressed={liked}
        aria-label={liked ? `Unlike ${template.name}` : `Like ${template.name}`}
        className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow-sm backdrop-blur transition hover:scale-110 hover:text-zinc-900 active:scale-95"
      >
        <Heart size={16} className={cn("transition", liked && "scale-110 fill-zinc-900 text-zinc-900")} aria-hidden />
      </button>
    </Tilt>
  );
}
