import { db } from "@/lib/db";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Quick check that the app and the database are up. */
export async function GET() {
  const database = await db
    .$runCommandRaw({ ping: 1 })
    .then(() => "connected")
    .catch(() => "disconnected");
  return json({ status: "ok", database });
}
