import { PrismaClient } from "@prisma/client";

// Singleton so we don't open a new connection pool on every hot reload.
const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
