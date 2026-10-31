import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TemplateEditor } from "@/components/editor/template-editor";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { isSiteStructure } from "@/lib/site-template";
import { toId } from "@/lib/utils";

export const metadata: Metadata = { title: "Template editor" };

// Full-screen template editor (no site or admin chrome). Admins only.
export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const id = toId((await params).id);
  const template = id ? await db.template.findUnique({ where: { id } }) : null;
  if (!template || !isSiteStructure(template.structure)) notFound();

  return (
    <TemplateEditor
      template={{
        id: template.id,
        name: template.name,
        category: template.category,
        description: template.description ?? "",
        thumbnailUrl: template.thumbnailUrl ?? "",
        published: template.published,
        document: template.structure.document,
      }}
    />
  );
}
