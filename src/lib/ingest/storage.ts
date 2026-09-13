import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { safeFilename, UPLOAD_ROOT } from "@/lib/ingest/constants";

export async function storeUpload(
  jobId: string,
  filename: string,
  bytes: Buffer,
) {
  const dir = path.join(process.cwd(), UPLOAD_ROOT, jobId);
  await mkdir(dir, { recursive: true });
  const storedName = safeFilename(filename);
  const storagePath = path.join(UPLOAD_ROOT, jobId, storedName);
  await writeFile(path.join(process.cwd(), storagePath), bytes);
  return storagePath;
}

export function checksumSha256(bytes: Buffer) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function resolveStoragePath(storagePath: string) {
  const absolute = path.resolve(process.cwd(), storagePath);
  const root = path.resolve(process.cwd(), UPLOAD_ROOT);
  if (!absolute.startsWith(root + path.sep) && absolute !== root) {
    throw new Error("Invalid storage path");
  }
  return absolute;
}
