import prismaPkg from "@prisma/client";
import { execSync } from "child_process";
const { PrismaClient } = prismaPkg;
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "pg";

const { Pool } = pkg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const basePrisma = new PrismaClient({ adapter });

const prisma = basePrisma.$extends({
  query: {
    async $allOperations({ query, args }) {
      try {
        return await query(args);
      } catch (err) {
        console.error("Query failed. Forcing reconnect...", err.message);
        await basePrisma.$disconnect();
        await basePrisma.$connect();
        return await query(args);
      }
    },
  },
});

async function connectWithRetry(maxRetries = 10) {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      await basePrisma.$queryRawUnsafe('SELECT 1');
      console.log("Database connected. Running migrations...");
      execSync("npx prisma migrate deploy", { stdio: "inherit" });
      console.log("Migrations complete.");
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