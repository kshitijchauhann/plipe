import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { job } from "@/db/schema/jobs";

export function serializeJob(row: typeof job.$inferSelect) {
  return {
    id: row.id,
    status: row.status,
    attempts: row.attempts,
    maxAttempts: row.maxAttempts,
    lastError: row.lastError,
    originalFilename: row.originalFilename,
    byteSize: row.byteSize,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listJobs() {
  const rows = await db.select().from(job).orderBy(desc(job.createdAt));
  return rows.map(serializeJob);
}

export async function getJob(id: string) {
  const [row] = await db.select().from(job).where(eq(job.id, id)).limit(1);
  return row ? serializeJob(row) : null;
}
