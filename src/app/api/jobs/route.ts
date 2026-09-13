import { after } from "next/server";
import { db } from "@/db";
import { job } from "@/db/schema/jobs";
import {
  isAllowedUpload,
  MAX_JOB_ATTEMPTS,
  MAX_UPLOAD_BYTES,
} from "@/lib/ingest/constants";
import { listJobs, serializeJob } from "@/lib/ingest/queries";
import { checksumSha256, storeUpload } from "@/lib/ingest/storage";
import { processNextJob } from "@/lib/ingest/worker";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Response.json({ jobs: await listJobs() });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json(
      { error: "Choose one file to upload." },
      { status: 400 },
    );
  }
  if (file.size === 0) {
    return Response.json({ error: "File is empty." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return Response.json(
      { error: `File is larger than ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB.` },
      { status: 400 },
    );
  }
  if (!isAllowedUpload(file.name, file.type)) {
    return Response.json(
      { error: "Use a Cursor transcript (.json, .jsonl, .txt, or .md)." },
      { status: 400 },
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const id = crypto.randomUUID();
  const storagePath = await storeUpload(id, file.name, bytes);

  const [row] = await db
    .insert(job)
    .values({
      id,
      userId: session.user.id,
      status: "pending",
      attempts: 0,
      maxAttempts: MAX_JOB_ATTEMPTS,
      originalFilename: file.name,
      storagePath,
      byteSize: bytes.byteLength,
      mimeType: file.type || null,
      checksum: checksumSha256(bytes),
    })
    .returning();

  if (!row) {
    return Response.json({ error: "Could not create job." }, { status: 500 });
  }

  after(() => processNextJob());

  return Response.json({ job: serializeJob(row) }, { status: 201 });
}
