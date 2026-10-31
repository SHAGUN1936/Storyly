// Server-side login helpers: passwords, cookies and "who is logged in".

import "server-only";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";
import { SESSION_COOKIE, SESSION_DAYS, signSession, verifySession } from "./session";

export function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export function checkPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function startSession(userId: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, await signSession(userId), {
    httpOnly: true, // not readable from browser JavaScript
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function endSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** The fields of a user that are safe to send to the browser. */
export const publicUserFields = { id: true, email: true, name: true, avatar: true, role: true } as const;

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/**
 * The logged-in user, or null. Cached, so calling it many times in one request hits the database once.
 * If the database is unreachable the visitor is treated as logged out instead of the page crashing.
 */
export const getCurrentUser = cache(async () => {
  // Reading cookies must stay outside the try: it is also how Next.js learns the page is per-visitor
  const store = await cookies();
  const userId = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!userId) return null;
  try {
    return await db.user.findUnique({ where: { id: userId }, select: publicUserFields });
  } catch (err) {
    console.error("[auth] could not load the current user", err);
    return null;
  }
});

/** Use at the top of signed-in pages and actions. Sends visitors to the login page. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Use at the top of admin pages. Non-admins go back to their studio. */
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/studio");
  return user;
}

/** Builders and admins can publish their own templates. */
export function canBuild(user: { role: string } | null | undefined) {
  return user?.role === "builder" || user?.role === "admin";
}
