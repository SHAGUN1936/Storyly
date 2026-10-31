import { PrismaClient } from "@prisma/client";

// One shared database client. In development Next.js reloads files often,
// so we keep the client on `globalThis` to avoid opening a new connection each time.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
