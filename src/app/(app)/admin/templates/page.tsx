import { LayoutTemplate, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { removeTemplate, setPublished } from "@/app/(app)/admin/_actions/templates";
import { AdminHeader } from "@/components/admin/admin-ui";
import { EmptyState } from "@/components/app/empty-state";
import { SubmitButton } from "@/components/ui/action-form";
import { ButtonLink } from "@/components/ui/button";
import { isSiteStructure } from "@/lib/site-template";
import { listAllTemplates } from "@/server/templates";

export const metadata: Metadata = { title: "Templates" };

export default async function AdminTemplatesPage() {
  const templates = await listAllTemplates();

  return (
    <>
      <AdminHeader
        title="Templates"
        description="Official templates shown to users. Create one from a starter design, pasted HTML or an uploaded website."
        actions={
          <ButtonLink href="/admin/templates/import" icon={<Plus size={16} />}>
            New template
          </ButtonLink>
        }
      />

      {templates.length === 0 ? (
        <EmptyState
          icon={<LayoutTemplate />}
          title="No templates yet"
          text="Create your first template from a starter design, pasted HTML or an uploaded website."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Template</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {templates.map((t) => {
                const imported = isSiteStructure(t.structure);
                return (
                  <tr key={t.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900">{t.name}</p>
                      <p className="text-xs text-zinc-500">{t.category}</p>
                    </td>
                    <td className="hidden px-4 py-3 text-zinc-600 sm:table-cell">
                      {imported ? "Imported page" : "Old visual builder (needs the new editor)"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          t.published
                            ? "rounded-full bg-zinc-900 px-2.5 py-0.5 text-xs font-medium text-white"
                            : "rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-600"
                        }
                      >
                        {t.published ? "Live" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {imported && (
                          <Link
                            href={`/editor/${t.id}`}
                            className="inline-flex h-9 items-center rounded-lg border border-zinc-200 px-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                          >
                            Edit
                          </Link>
                        )}
                        <form className="flex gap-2">
                          <SubmitButton
                            variant={t.published ? "secondary" : "primary"}
                            formAction={setPublished.bind(null, t.id, !t.published)}
                          >
                            {t.published ? "Unpublish" : "Publish"}
                          </SubmitButton>
                          <SubmitButton
                            variant="ghost"
                            formAction={removeTemplate.bind(null, t.id)}
                            confirm={`Delete "${t.name}"? Pages already made from it keep working.`}
                          >
                            Delete
                          </SubmitButton>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
