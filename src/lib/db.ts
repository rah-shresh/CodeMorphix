import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const connectionString = process.env.DATABASE_URL;

// Next.js page collection/compilation may run with empty/missing environment variables.
// Providing a fallback dummy connection string avoids builder failures.
const pool = new Pool({
  connectionString: connectionString || "postgresql://dummy:dummy@localhost:5432/dummy",
});
const adapter = new PrismaPg(pool);

export const db =
  globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}