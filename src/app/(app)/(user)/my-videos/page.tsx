import type { Metadata } from "next";
import { Suspense } from "react";
import { AppPage } from "@/components/app/app-page";
import { MyPagesView, type MyPageItem } from "@/components/app/my-pages-view";
import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { isJsonObject } from "@/lib/structure";
import { listMyPages } from "@/server/pages";

export const metadata: Metadata = { title: "My pages" };

// The URL keeps its old name (/my-videos) so existing bookmarks still work.
export default async function MyPagesPage() {
  const user = await requireUser();
  const pages = await listMyPages(user.id);

  const items: MyPageItem[] = pages.map((p) => {
    const meta = isJsonObject(p.customizations) ? p.customizations : {};
    return {
      id: p.id,
      status: p.status,
      title: p.template?.name || String(meta.templateName || "") || "Untitled page",
      category: p.template?.category || String(meta.templateCategory || ""),
      recipientName: p.recipientName ?? "",
      thumbnailUrl: p.thumbnailUrl || p.template?.thumbnailUrl || String(meta.templateThumb || ""),
      shareSlug: p.shareSlug ?? "",
      createdAt: p.createdAt.toISOString(),
    };
  });

  return (
    <AppPage
      title="My pages"
      description="Everything you have made. Published pages can be shared with a link or QR code."
      actions={
        <ButtonLink href="/studio" variant="inverted">
          New page
        </ButtonLink>
      }
    >
      <Suspense>
        <MyPagesView items={items} />
      </Suspense>
    </AppPage>
  );
}
