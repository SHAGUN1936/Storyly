import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { StorylyLogo } from "@/components/brand/logo";
import { SiteFrame } from "@/components/site-frame";
import { isJsonObject } from "@/lib/structure";
import { applySlotValues, isSiteStructure } from "@/lib/site-template";
import { getSharedPage } from "@/server/pages";

type Props = { params: Promise<{ slug: string }> };

const load = cache(async (slug: string) => getSharedPage(slug));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await load((await params).slug);
  if (!page) return { title: "Page not found" };
  const name = page.template?.name ?? "A Storyly page";
  return {
    title: page.recipientName ? `${name} · For ${page.recipientName}` : name,
    robots: { index: false }, // shared pages are private by link
  };
}

// The public share link (/watch/<slug>). The page fills the whole screen.
export default async function WatchPage({ params }: Props) {
  const page = await load((await params).slug);
  if (!page) notFound();

  const snapshot = page.customizations.structureSnapshot;
  const values = isJsonObject(page.customizations.slots) ? page.customizations.slots : {};

  if (isSiteStructure(snapshot)) {
    return (
      <main className="fixed inset-0">
        <SiteFrame html={applySlotValues(snapshot, values)} title={page.template?.name ?? "Shared page"} />
      </main>
    );
  }

  if (page.videoUrl) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black">
        <video src={page.videoUrl} controls autoPlay playsInline className="max-h-screen w-full" />
      </main>
    );
  }

  // Pages made with the visual builder render again once the editor moves over (phase 3)
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 px-6 text-center">
      <StorylyLogo />
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">This page will be back shortly</h1>
        <p className="mt-2 max-w-sm text-zinc-600">
          We are upgrading how pages are shown. Please open this link again soon.
        </p>
      </div>
      <Link href="/" className="text-sm font-medium text-zinc-900 underline underline-offset-4">
        Make your own page
      </Link>
    </main>
  );
}
