"use server";

import { OAuth2Client } from "google-auth-library";
import { redirect } from "next/navigation";
import { failure, parseForm } from "@/lib/action";
import { checkPassword, endSession, hashPassword, startSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { toFriendlyError } from "@/lib/http";
import { firstName } from "@/lib/utils";
import { loginSchema, signupSchema } from "@/lib/validators";

/** What the login/signup forms get back. On success the page shows `message` and goes to `redirectTo`. */
export type AuthState = { ok: true; message: string; redirectTo: string } | { ok: false; message: string } | null;

/** Admins land on the admin panel, everyone else in their studio. */
const homeFor = (role: string) => (role === "admin" ? "/admin" : "/studio");

/** Runs an auth step and turns unexpected errors (e.g. database down) into a friendly message. */
async function safely(step: () => Promise<AuthState>): Promise<AuthState> {
  try {
    return await step();
  } catch (err) {
    console.error("[auth]", err);
    return { ok: false, message: toFriendlyError(err).message };
  }
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = parseForm(loginSchema, formData);
  if (!parsed.ok) return parsed.state as AuthState;

  return safely(async () => {
    const user = await db.user.findUnique({ where: { email: parsed.data.email } });
    const valid = user?.password && (await checkPassword(parsed.data.password, user.password));
    if (!user || !valid) return failure("Invalid email or password") as AuthState;

    await startSession(user.id);
    return { ok: true, message: `Welcome back, ${firstName(user.name) || "friend"}`, redirectTo: homeFor(user.role) };
  });
}

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = parseForm(signupSchema, formData);
  if (!parsed.ok) return parsed.state as AuthState;
  const { name, email, password } = parsed.data;

  return safely(async () => {
    if (await db.user.findUnique({ where: { email }, select: { id: true } })) {
      return failure("Email already registered") as AuthState;
    }
    const user = await db.user.create({ data: { name, email, password: await hashPassword(password) } });
    await startSession(user.id);
    return {
      ok: true,
      message: `Welcome to Storyly, ${firstName(user.name) || "friend"}`,
      redirectTo: homeFor(user.role),
    };
  });
}

/** Signs in (or signs up) with the credential from the Google button. */
export async function googleSignIn(credential: string): Promise<AuthState> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) return failure("Google sign-in is not set up yet.") as AuthState;

  return safely(async () => {
    const ticket = await new OAuth2Client(clientId)
      .verifyIdToken({ idToken: credential, audience: clientId })
      .catch(() => null);
    const profile = ticket?.getPayload();
    if (!profile?.email || !profile.email_verified)
      return failure("Google sign-in failed. Please try again.") as AuthState;

    const email = profile.email.toLowerCase();
    const existing = await db.user.findUnique({ where: { email } });
    const user = existing
      ? existing.googleId
        ? existing
        : await db.user.update({
            where: { id: existing.id },
            data: { googleId: profile.sub, avatar: existing.avatar || profile.picture },
          })
      : await db.user.create({
          data: { email, name: profile.name || email, avatar: profile.picture, googleId: profile.sub },
        });

    await startSession(user.id);
    return { ok: true, message: `Welcome, ${firstName(user.name) || "friend"}`, redirectTo: homeFor(user.role) };
  });
}

export async function logout() {
  await endSession();
  redirect("/login?signed-out=1");
}
