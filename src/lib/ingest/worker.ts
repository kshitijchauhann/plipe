import { eq } from "drizzle-orm";
import { db } from "@/db";
import { job } from "@/db/schema/jobs";
import {
  MAX_JOB_ATTEMPTS,
  PermanentJobError,
  TransientJobError,
} from "@/lib/ingest/constants";
import { runExtractStub } from "@/lib/ingest/extract";

function isTransient(error: unknown) {
  if (error instanceof TransientJobError) {
    return true;
  }
  if (error instanceof PermanentJobError) {
    return false;
  }
  return true;
}

async function claimNextJob() {
  return db.transaction(async (tx) => {
    const [claimed] = await tx
      .select()
      .from(job)
      .where(eq(job.status, "pending"))
      .orderBy(job.createdAt)
      .limit(1)
      .for("update", { skipLocked: true });

    if (!claimed) {
      return null;
    }

    const [updated] = await tx
      .update(job)
      .set({
        status: "processing",
        attempts: claimed.attempts + 1,
        startedAt: new Date(),
        lastError: null,
      })
      .where(eq(job.id, claimed.id))
      .returning();

    return updated ?? null;
  });
}

async function finishSuccess(jobId: string) {
  await db
    .update(job)
    .set({
      status: "review_ready",
      lastError: null,
      finishedAt: new Date(),
    })
    .where(eq(job.id, jobId));
}

async function finishFailure(row: typeof job.$inferSelect, error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  const attempts = row.attempts;
  const retry =
    isTransient(error) && attempts < (row.maxAttempts ?? MAX_JOB_ATTEMPTS);

  await db
    .update(job)
    .set({
      status: retry ? "pending" : "failed",
      lastError: message,
      finishedAt: retry ? null : new Date(),
    })
    .where(eq(job.id, row.id));
}

export async function processNextJob() {
  const claimed = await claimNextJob();
  if (!claimed) {
    return { processed: false as const };
  }

  try {
    await runExtractStub(claimed);
    await finishSuccess(claimed.id);
    return {
      processed: true as const,
      id: claimed.id,
      status: "review_ready" as const,
    };
  } catch (error) {
    await finishFailure(claimed, error);
    return { processed: true as const, id: claimed.id, error: String(error) };
  }
}
