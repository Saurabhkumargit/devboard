import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "pg";

const { Pool } = pkg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function connectWithRetry(maxRetries = 10) {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      await prisma.$connect();
      console.log("Database connected");
      return;
    } catch (err) {
      attempt++;
      console.log(`DB not ready (attempt ${attempt})`, err.message);

      const delay = Math.min(2000 * attempt, 10000); // exponential-ish
      await new Promise((res) => setTimeout(res, delay));
    }
  }

  throw new Error("Failed to connect to database after retries");
}

export async function initDB() {
  await connectWithRetry();
}

export default prisma;