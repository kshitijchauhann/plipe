import { loadEnvFile } from "node:process";
import { defineConfig } from "drizzle-kit";

try {
  loadEnvFile(".env");
} catch {
  // .env is optional if DATABASE_URL is already in the environment
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env and include user:password@host/dbname.",
  );
}

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
