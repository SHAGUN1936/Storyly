// Login token helpers. Kept free of database code so the middleware can use them too.
//
// After login we store a signed token (JWT) in an httpOnly cookie.
// Only the server knows AUTH_SECRET, so nobody can fake or change the token.

import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "token";
export const SESSION_DAYS = 7;

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is missing. Add it to your .env file.");
  return new TextEncoder().encode(secret);
}

export async function signSession(userId: string) {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());
}

/** Returns the logged-in user's id, or null if the token is missing, fake or expired. */
export async function verifySession(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return typeof payload.userId === "string" ? payload.userId : null;
  } catch {
    return null;
  }
}
