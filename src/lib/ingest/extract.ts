import { readFile, stat } from "node:fs/promises";
import type { job } from "@/db/schema/jobs";
import { PermanentJobError } from "@/lib/ingest/constants";
import { resolveStoragePath } from "@/lib/ingest/storage";

export type JobRow = typeof job.$inferSelect;

/**
 * Extract module (3) replaces this. Ingest only checks the stored file
 * is present and non-empty, then the worker marks the job review_ready.
 */
export async function runExtractStub(row: JobRow) {
  const absolute = resolveStoragePath(row.storagePath);
  let fileStat: Awaited<ReturnType<typeof stat>>;
  try {
    fileStat = await stat(absolute);
  } catch {
    throw new PermanentJobError("Uploaded file is missing from storage.");
  }
  if (fileStat.size === 0) {
    throw new PermanentJobError("Uploaded file is empty.");
  }
  const bytes = await readFile(absolute);
  if (bytes.byteLength === 0) {
    throw new PermanentJobError("Uploaded file is empty.");
  }
}
