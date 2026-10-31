import type { Metadata } from "next";
import { Suspense } from "react";
import { AppPage } from "@/components/app/app-page";
import { TemplateBrowser } from "@/components/app/template-browser";
import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { toTemplateCard } from "@/lib/template-card";
import { firstName } from "@/lib/utils";
import { listPublishedTemplates } from "@/server/templates";

export const metadata: Metadata = { title: "Studio" };

// The signed-in home: pick a template to start a new page.
export default async function StudioPage() {
  const [user, templates] = await Promise.all([requireUser(), listPublishedTemplates()]);

  return (
    <AppPage
      title={`Welcome, ${firstName(user.name) || "there"}`}
      description="Choose a template to start a new page. You can edit everything after."
      actions={
        <ButtonLink href="/my-videos" variant="secondary">
          My pages
        </ButtonLink>
      }
    >
      {/* Suspense: the browser reads ?category= from the URL */}
      <Suspense>
        <TemplateBrowser templates={templates.map(toTemplateCard)} />
      </Suspense>
    </AppPage>
  );
}
