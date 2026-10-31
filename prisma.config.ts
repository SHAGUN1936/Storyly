// Prisma settings. With this file Prisma no longer reads .env by itself, so we load it here.
// On Vercel the variables come from the project settings instead; a missing .env is fine.

import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    // `npm run db:seed` makes sure the admin login from .env exists
    seed: "tsx prisma/seed.ts",
  },
});
