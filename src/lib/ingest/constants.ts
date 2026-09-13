export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_JOB_ATTEMPTS = 3;
export const UPLOAD_ROOT = "data/uploads";

const ALLOWED_EXTENSIONS = new Set([".json", ".jsonl", ".txt", ".md"]);

export class PermanentJobError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PermanentJobError";
  }
}

export class TransientJobError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TransientJobError";
  }
}

export function isAllowedUpload(
  filename: string,
  mimeType: string | undefined,
) {
  const ext = filename.includes(".")
    ? filename.slice(filename.lastIndexOf(".")).toLowerCase()
    : "";
  if (ALLOWED_EXTENSIONS.has(ext)) {
    return true;
  }
  return (
    mimeType === "application/json" ||
    mimeType === "text/plain" ||
    mimeType === "text/markdown"
  );
}

export function safeFilename(filename: string) {
  const base = filename.replaceAll("\\", "/").split("/").pop() ?? "transcript";
  const cleaned = base.replaceAll(/[^a-zA-Z0-9._-]/g, "_").slice(0, 180);
  return cleaned.length > 0 ? cleaned : "transcript";
}
