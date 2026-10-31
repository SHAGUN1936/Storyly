// Helpers shared by all API routes (src/app/api/**/route.ts).
//
//   export const GET = route(async (req) => {
//     const user = await apiUser();            // 401 if not signed in
//     const body = await readJson(req, schema); // 400 with the first problem if invalid
//     return json({ ... });
//   });
//
// Throw `new HttpError(404, "Page not found")` anywhere inside; the wrapper turns it into a JSON error.

import "server-only";
import { Prisma } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type z } from "zod";
import { getCurrentUser } from "./auth";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

/** The signed-in user, or a 401 error. */
export async function apiUser() {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "Please sign in again.");
  return user;
}

/** The signed-in admin, or a 401/403 error. */
export async function apiAdmin() {
  const user = await apiUser();
  if (user.role !== "admin") throw new HttpError(403, "Admin access required");
  return user;
}

/** Reads the JSON body and checks it against a Zod schema. */
export async function readJson<S extends z.ZodType>(req: NextRequest, schema: S): Promise<z.output<S>> {
  const body = await req.json().catch(() => {
    throw new HttpError(400, "Request body must be JSON");
  });
  return schema.parse(body);
}

/** Dynamic route params, e.g. { id } for /api/pages/[id]. */
export type RouteContext<P extends string = string> = { params: Promise<Record<P, string>> };

/** Wraps a route handler so any thrown error becomes a clean JSON error response. */
export function route<C = RouteContext>(handler: (req: NextRequest, ctx: C) => Promise<Response>) {
  return async (req: NextRequest, ctx: C) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      const { status, message } = toFriendlyError(err);
      if (status >= 500) console.error(`[api] ${req.method} ${req.nextUrl.pathname}`, err);
      return json({ message }, status);
    }
  };
}

/**
 * Maps any error to a status and a message that is safe to show users
 * (never leaks things like database host names).
 */
export function toFriendlyError(err: unknown): { status: number; message: string } {
  if (err instanceof HttpError) return { status: err.status, message: err.message };
  if (err instanceof ZodError) return { status: 400, message: err.issues[0]?.message ?? "Invalid request" };

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") return { status: 400, message: "Already exists" };
    if (err.code === "P2025") return { status: 404, message: "Not found" };
    if (err.code === "P2023") return { status: 400, message: "Invalid id" };
  }
  if (err instanceof Prisma.PrismaClientInitializationError || isNetworkError(err)) {
    return {
      status: 503,
      message: "We can't reach our servers right now. Please check your internet connection and try again.",
    };
  }
  return { status: 500, message: "Something went wrong. Please try again." };
}

function isNetworkError(err: unknown) {
  const text = String((err as Error)?.message ?? err);
  return /ENOTFOUND|ECONNREFUSED|EAI_AGAIN|ETIMEDOUT|ENETUNREACH|EHOSTUNREACH|server selection/i.test(text);
}
