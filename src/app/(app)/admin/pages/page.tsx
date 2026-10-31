import { FileText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { deleteAnyPage } from "@/app/(app)/admin/_actions/people";
import { AdminHeader } from "@/components/admin/admin-ui";
import { EmptyState } from "@/components/app/empty-state";
import { SubmitButton } from "@/components/ui/action-form";
import { db } from "@/lib/db";
import { isJsonObject } from "@/lib/structure";

export const metadata: Metadata = { title: "Pages" };

const STATUS_LABEL = {
  draft: "Draft",
  pending: "Waiting",
  processing: "Processing",
  completed: "Published",
  failed: "Failed",
};

export default async function AdminPagesPage() {
  const pages = await db.page.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  // Owners are loaded separately: some pages belong to accounts that were deleted
  const owners = await db.user.findMany({
    where: { id: { in: [...new Set(pages.map((p) => p.userId))] } },
    select: { id: true, name: true, email: true },
  });
  const ownerBy = new Map(owners.map((u) => [u.id, u]));

  return (
    <>
      <AdminHeader
        title="Pages"
        description="Every page users have made (newest 200). Remove anything that shouldn't be online."
      />
      {pages.length === 0 ? (
        <EmptyState icon={<FileText />} title="No pages yet" text="Pages appear here as users create them." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-xs">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Page</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {pages.map((p) => {
                const meta = isJsonObject(p.customizations) ? p.customizations : {};
                const owner = ownerBy.get(p.userId);
                return (
                  <tr key={p.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900">{String(meta.templateName || "Untitled page")}</p>
                      {p.recipientName && <p className="text-xs text-zinc-500">For {p.recipientName}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-zinc-900">{owner?.name ?? "Deleted account"}</p>
                      {owner && <p className="text-xs text-zinc-500">{owner.email}</p>}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{STATUS_LABEL[p.status]}</td>
                    <td className="px-4 py-3 text-zinc-600">
                      {p.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {p.status === "completed" && p.shareSlug && (
                          <Link
                            href={`/watch/${p.shareSlug}`}
                            target="_blank"
                            className="inline-flex h-9 items-center rounded-lg border border-zinc-200 px-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                          >
                            View
                          </Link>
                        )}
                        <form>
                          <SubmitButton
                            variant="ghost"
                            formAction={deleteAnyPage.bind(null, p.id)}
                            confirm="Delete this page? Its share link will stop working."
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
