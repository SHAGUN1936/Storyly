"use server";

// The signed-in user's own profile and password.

import { OAuth2Client } from "google-auth-library";
import { failure, parseForm, refreshPages, success, type ActionState } from "@/lib/action";
import { checkPassword, hashPassword, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { changePasswordSchema, profileSchema } from "@/lib/validators";

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = parseForm(profileSchema, formData);
  if (!parsed.ok) return parsed.state;
  await db.user.update({ where: { id: user.id }, data: { name: parsed.data.name } });
  refreshPages();
  return success("Profile saved");
}

/** Google-only accounts have no password yet, so they can set one without the current password. */
export async function changePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireUser();
  const parsed = parseForm(changePasswordSchema, formData);
  if (!parsed.ok) return parsed.state;

  const user = await db.user.findUniqueOrThrow({ where: { id: me.id }, select: { password: true } });
  if (user.password) {
    if (!parsed.data.currentPassword) return failure("Enter your current password");
    if (!(await checkPassword(parsed.data.currentPassword, user.password))) {
      return failure("Current password is incorrect");
    }
  }
  await db.user.update({ where: { id: me.id }, data: { password: await hashPassword(parsed.data.newPassword) } });
  return success("Password updated");
}

/**
 * Connects Google sign-in to this account. The Google account must use the same email,
 * because Google sign-in finds accounts by email.
 */
export async function linkGoogle(credential: string): Promise<ActionState> {
  const me = await requireUser();
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) return failure("Google sign-in is not set up yet.");
  const ticket = await new OAuth2Client(clientId)
    .verifyIdToken({ idToken: credential, audience: clientId })
    .catch(() => null);
  const profile = ticket?.getPayload();
  if (!profile?.email || !profile.email_verified) return failure("Google did not confirm that account.");
  if (profile.email.toLowerCase() !== me.email.toLowerCase()) {
    return failure(`Use the Google account for ${me.email}.`);
  }
  await db.user.update({ where: { id: me.id }, data: { googleId: profile.sub } });
  refreshPages();
  return success("Google connected. You can now sign in with Google.");
}
