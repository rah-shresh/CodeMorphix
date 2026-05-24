// 1. Change this line (remove /edge)
import { PrismaClient } from "@prisma/client"; 
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "@neondatabase/serverless"; 

const prismaClientSingleton = () => {
  const connectionString =
    process.env.DATABASE_URL || "postgresql://dummy:dummy@localhost:5432/dummy";
  
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  
  return new PrismaClient({ adapter });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const db = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;