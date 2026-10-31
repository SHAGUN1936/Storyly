import type { Metadata } from "next";
import { createStat, deleteStat, updateStat } from "@/app/(app)/admin/_actions/website";
import { AdminHeader } from "@/components/admin/admin-ui";
import { StatFields } from "@/components/admin/content-fields";
import { AddItemCard, EditItemCard } from "@/components/admin/content-list";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Numbers" };

export default async function AdminNumbersPage() {
  const stats = await db.siteStat.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });

  return (
    <>
      <AdminHeader
        title="Numbers"
        description="Headline numbers under the home page hero, e.g. pages published. Hidden until you add one; four fit best."
      />
      <AddItemCard title="Add a number" action={createStat}>
        <StatFields />
      </AddItemCard>
      <div className="space-y-4">
        {stats.map((stat) => (
          <EditItemCard
            key={stat.id}
            saveAction={updateStat.bind(null, stat.id)}
            deleteAction={deleteStat.bind(null, stat.id)}
          >
            <StatFields item={stat} />
          </EditItemCard>
        ))}
      </div>
    </>
  );
}
