// Makes ADMIN_EMAIL (from .env) an admin.
// - Account already exists: only its role is changed; the password is left as it is.
// - No account yet: one is created with ADMIN_PASSWORD and ADMIN_NAME.
// Safe to run again. Never touches other users.

import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!email) throw new Error("Set ADMIN_EMAIL in .env first.");

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    await db.user.update({ where: { email }, data: { role: "admin" } });
    console.log(`${email} is now an admin (password unchanged).`);
    return;
  }

  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 8) throw new Error("Set ADMIN_PASSWORD (8+ characters) in .env to create the admin account.");
  await db.user.create({
    data: {
      email,
      name: process.env.ADMIN_NAME?.trim() || "Admin",
      password: await bcrypt.hash(password, 12),
      role: "admin",
    },
  });
  console.log(`Admin account created: ${email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
