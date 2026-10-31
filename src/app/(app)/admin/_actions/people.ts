"use server";

// Admin → Users and Admin → Pages: change roles, remove accounts, remove any page.
// An admin can't change or delete their own account here, so the panel can't be locked out.

import { z } from "zod";
import { failure, refreshPages, success, type ActionState } from "@/lib/action";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { toId } from "@/lib/utils";

const roleSchema = z.enum(["user", "builder", "admin"]);

export async function changeRole(userId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  if (userId === admin.id) return failure("You can't change your own role.");
  const role = roleSchema.safeParse(formData.get("role"));
  if (!role.success || !toId(userId)) return failure("Pick a valid role.");
  await db.user.update({ where: { id: userId }, data: { role: role.data } });
  refreshPages();
  return success("Role updated");
}

/** Deletes an account together with its pages and community templates. */
export async function deleteUser(userId: string) {
  const admin = await requireAdmin();
  if (userId === admin.id || !toId(userId)) return;
  await db.page.deleteMany({ where: { userId } });
  await db.builderTemplate.deleteMany({ where: { builderId: userId } });
  await db.template.updateMany({ where: { createdById: userId }, data: { createdById: null } });
  await db.user.delete({ where: { id: userId } });
  refreshPages();
}

/** Removes any user's page. Its share link stops working. */
export async function deleteAnyPage(pageId: string) {
  await requireAdmin();
  if (!toId(pageId)) return;
  await db.page.delete({ where: { id: pageId } });
  refreshPages();
}
