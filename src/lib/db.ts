import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL, // 👈 CORRETO NO PRISMA 7
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}