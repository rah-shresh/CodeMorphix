import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "@neondatabase/serverless"; // Edge-compatible driver

const prismaClientSingleton = () => {
  // Build step ke liye fallback dummy URL
  const connectionString =
    process.env.DATABASE_URL || "postgresql://dummy:dummy@localhost:5432/dummy";
  
  // Neon ka serverless pool use karein jo web sockets ke throw connect hota hai
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  
  // Regular PrismaClient mein adapter pass karein
  return new PrismaClient({ adapter });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const db = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;