import type { Metadata } from "next";
import { changeRole, deleteUser } from "@/app/(app)/admin/_actions/people";
import { AdminHeader } from "@/components/admin/admin-ui";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { Select } from "@/components/ui/form-controls";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Users" };

export default async function AdminUsersPage() {
  const admin = await requireAdmin();
  const [users, pageCounts] = await Promise.all([
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, role: true, createdAt: true, googleId: true },
    }),
    db.page.groupBy({ by: ["userId"], _count: { _all: true } }),
  ]);
  const pagesBy = new Map(pageCounts.map((c) => [c.userId, c._count._all]));

  return (
    <>
      <AdminHeader title="Users" description={`${users.length} accounts. Change roles or remove accounts.`} />
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-xs">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500 uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Pages</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {users.map((u) => {
              const isMe = u.id === admin.id;
              return (
                <tr key={u.id} className="align-middle">
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-900">
                      {u.name} {isMe && <span className="text-xs font-normal text-zinc-500">(you)</span>}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {u.email}
                      {u.googleId ? " · Google" : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {u.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{pagesBy.get(u.id) ?? 0}</td>
                  <td className="px-4 py-3">
                    {isMe ? (
                      <span className="text-zinc-600 capitalize">{u.role}</span>
                    ) : (
                      <ActionForm action={changeRole.bind(null, u.id)} className="flex items-center gap-2">
                        <Select name="role" defaultValue={u.role} className="h-9 w-28" aria-label={`Role of ${u.name}`}>
                          <option value="user">User</option>
                          <option value="builder">Builder</option>
                          <option value="admin">Admin</option>
                        </Select>
                        <SubmitButton variant="secondary">Save</SubmitButton>
                      </ActionForm>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!isMe && (
                      <form>
                        <SubmitButton
                          variant="ghost"
                          formAction={deleteUser.bind(null, u.id)}
                          confirm={`Delete ${u.email}? Their pages and share links are removed too. This can't be undone.`}
                        >
                          Delete
                        </SubmitButton>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
