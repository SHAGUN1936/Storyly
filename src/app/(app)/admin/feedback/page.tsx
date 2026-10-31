import { MessageSquare, Star } from "lucide-react";
import type { Metadata } from "next";
import { deleteFeedback } from "@/app/(app)/admin/_actions/website";
import { AdminHeader } from "@/components/admin/admin-ui";
import { EmptyState } from "@/components/app/empty-state";
import { SubmitButton } from "@/components/ui/action-form";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Feedback" };

const KIND_LABEL: Record<string, string> = {
  story: "Story",
  bug: "Bug report",
  feature: "Feature request",
  general: "Feedback",
};

export default async function AdminFeedbackPage() {
  const items = await db.feedback.findMany({ orderBy: { createdAt: "desc" }, take: 200 });

  return (
    <>
      <AdminHeader title="Feedback" description="Stories, bug reports and ideas sent from the website. Newest first." />
      {items.length === 0 ? (
        <EmptyState
          icon={<MessageSquare />}
          title="Nothing yet"
          text="Messages sent from the “Share your story” form will appear here."
        />
      ) : (
        <div className="space-y-4">
          {items.map((f) => (
            <Card key={f.id} padding="sm">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                <span className="rounded-full border border-zinc-200 px-2 py-0.5 font-medium text-zinc-700">
                  {KIND_LABEL[f.kind] ?? f.kind}
                </span>
                <span>{f.createdAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                {f.rating > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Star size={12} className="fill-zinc-900 text-zinc-900" aria-hidden /> {f.rating}/5
                  </span>
                )}
                {f.context && <span>{f.context}</span>}
              </div>
              {f.title && <p className="mt-3 font-semibold text-zinc-900">{f.title}</p>}
              <p className="mt-2 text-sm leading-6 whitespace-pre-line text-zinc-700">{f.message}</p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-3">
                <p className="text-sm text-zinc-600">
                  {f.name || "Anonymous"}
                  {f.email && (
                    <>
                      {" · "}
                      <a href={`mailto:${f.email}`} className="font-medium text-zinc-900 hover:underline">
                        {f.email}
                      </a>
                    </>
                  )}
                </p>
                <form>
                  <SubmitButton
                    variant="ghost"
                    formAction={deleteFeedback.bind(null, f.id)}
                    confirm="Delete this message?"
                  >
                    Delete
                  </SubmitButton>
                </form>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
