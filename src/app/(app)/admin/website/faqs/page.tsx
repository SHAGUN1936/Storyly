import type { Metadata } from "next";
import { createFaq, deleteFaq, importDefaultFaqs, updateFaq } from "@/app/(app)/admin/_actions/website";
import { AdminHeader, StartingContentNotice } from "@/components/admin/admin-ui";
import { FaqFields } from "@/components/admin/content-fields";
import { AddItemCard, EditItemCard } from "@/components/admin/content-list";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "FAQs" };

export default async function AdminFaqsPage() {
  const faqs = await db.faq.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });

  return (
    <>
      <AdminHeader title="FAQs" description="The questions and answers in the FAQ section of the home page." />
      {faqs.length === 0 && <StartingContentNotice what="questions" importAction={importDefaultFaqs} />}
      <AddItemCard title="Add a question" action={createFaq}>
        <FaqFields />
      </AddItemCard>
      <div className="space-y-4">
        {faqs.map((faq) => (
          <EditItemCard
            key={faq.id}
            saveAction={updateFaq.bind(null, faq.id)}
            deleteAction={deleteFaq.bind(null, faq.id)}
            hidden={!faq.published}
          >
            <FaqFields item={faq} />
          </EditItemCard>
        ))}
      </div>
    </>
  );
}
