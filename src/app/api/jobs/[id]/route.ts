import { getJob } from "@/lib/ingest/queries";
import { getSession } from "@/lib/session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const row = await getJob(id);
  if (!row) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json({ job: row });
}
