import { ArrowLeft, ImageOff, PenLine } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppPage } from "@/components/app/app-page";
import { SitePageForm } from "@/components/app/site-page-form";
import { Card, IconBadge } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { HttpError } from "@/lib/http";
import { isSiteStructure } from "@/lib/site-template";
import { toId } from "@/lib/utils";
import { getTemplate } from "@/server/templates";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ src?: string }> };

async function load({ params, searchParams }: Props) {
  const id = toId((await params).id);
  if (!id) notFound();
  const source = (await searchParams).src === "BuilderTemplate" ? "BuilderTemplate" : "Template";
  try {
    return await getTemplate(id, source, await getCurrentUser());
  } catch (err) {
    if (err instanceof HttpError) notFound();
    throw err;
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  return { title: (await load(props)).name };
}

// A template's page. Imported ("site") templates are personalised right here with a live preview;
// visual-builder templates wait for the editor, which moves over in phase 3.
export default async function TemplatePage(props: Props) {
  const template = await load(props);

  return (
    <AppPage
      title={template.name}
      description={template.description || undefined}
      actions={
        <Link
          href="/studio"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-white"
        >
          <ArrowLeft size={16} aria-hidden /> All templates
        </Link>
      }
    >
      {isSiteStructure(template.structure) ? (
        <SitePageForm templateId={template.id} templateName={template.name} structure={template.structure} />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100">
            {template.previewVideoUrl ? (
              <video src={template.previewVideoUrl} controls playsInline className="aspect-video w-full bg-black" />
            ) : template.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={template.thumbnailUrl} alt="" className="w-full object-cover" />
            ) : (
              <div className="flex aspect-video items-center justify-center text-zinc-400">
                <ImageOff size={32} aria-hidden />
              </div>
            )}
          </div>
          <div className="space-y-6">
            <Card>
              <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">{template.category}</p>
              <p className="mt-1 font-semibold text-zinc-900">{template.name}</p>
              {template.description && <p className="mt-2 text-sm leading-6 text-zinc-600">{template.description}</p>}
            </Card>
            <Card className="bg-zinc-50">
              <IconBadge>
                <PenLine aria-hidden />
              </IconBadge>
              <p className="mt-4 font-semibold text-zinc-900">Customising is almost here</p>
              <p className="mt-1 text-sm leading-6 text-zinc-600">
                The editor is being moved to the new app. You will be able to personalise this template with your own
                photos, words and music very soon.
              </p>
            </Card>
          </div>
        </div>
      )}
    </AppPage>
  );
}
