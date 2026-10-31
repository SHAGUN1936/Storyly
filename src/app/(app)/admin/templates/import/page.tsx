import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/admin-ui";
import { ImportForm } from "@/components/admin/import-form";
import { aiEnabled } from "@/server/site-import/ai";
import { STARTERS } from "@/server/site-import/starters";

export const metadata: Metadata = { title: "New template" };

export default function NewTemplatePage() {
  return (
    <>
      <AdminHeader
        title="New template"
        description="Start from a design, paste a page, or upload a website. You review the editable parts before publishing."
      />
      <ImportForm
        aiEnabled={aiEnabled()}
        starters={STARTERS.map(({ id, name, category, description }) => ({ id, name, category, description }))}
      />
    </>
  );
}
