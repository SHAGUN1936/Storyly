import type { Metadata } from "next";
import { createTestimonial, deleteTestimonial, updateTestimonial } from "@/app/(app)/admin/_actions/website";
import { AdminHeader } from "@/components/admin/admin-ui";
import { TestimonialFields } from "@/components/admin/content-fields";
import { AddItemCard, EditItemCard } from "@/components/admin/content-list";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Testimonials" };

export default async function AdminTestimonialsPage() {
  const testimonials = await db.testimonial.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });

  return (
    <>
      <AdminHeader
        title="Testimonials"
        description="Real customer quotes for the home page. The section stays hidden until you add one."
      />
      <AddItemCard title="Add a testimonial" action={createTestimonial}>
        <TestimonialFields />
      </AddItemCard>
      <div className="space-y-4">
        {testimonials.map((t) => (
          <EditItemCard
            key={t.id}
            saveAction={updateTestimonial.bind(null, t.id)}
            deleteAction={deleteTestimonial.bind(null, t.id)}
            hidden={!t.published}
          >
            <TestimonialFields item={t} />
          </EditItemCard>
        ))}
      </div>
    </>
  );
}
