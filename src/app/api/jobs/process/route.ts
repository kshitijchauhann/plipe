import { processNextJob } from "@/lib/ingest/worker";
import { getSession } from "@/lib/session";

async function authorized(request: Request) {
  const secret = process.env.PROCESS_SECRET;
  const header = request.headers.get("authorization");
  if (secret && header === `Bearer ${secret}`) {
    return true;
  }
  const session = await getSession();
  return Boolean(session);
}

export async function POST(request: Request) {
  if (!(await authorized(request))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = [];
  for (let i = 0; i < 5; i += 1) {
    const result = await processNextJob();
    if (!result.processed) {
      break;
    }
    results.push(result);
  }

  return Response.json({ processed: results.length, results });
}
