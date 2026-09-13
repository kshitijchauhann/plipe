# Ingest module

Phase 1 module 2. **Upload a Cursor transcript, persist it, enqueue a job, return.** The UI polls **job status**, not the file. Transcripts are not a product surface.

Extract (module 3) is still a stub: a valid stored file is marked `review_ready` with **no draft cards**. Review/chat do not exist yet.

---

## Status machine

`pending` → `processing` → `review_ready` | `failed`

`done` is in the schema for module 4 (review confirm). Ingest never sets it.

| Status | Meaning |
|---|---|
| `pending` | File saved, waiting for a worker |
| `processing` | Worker claimed the row (`SKIP LOCKED`) |
| `review_ready` | File validated (extract stub). Ready for review later |
| `failed` | Permanent error, or transient errors exhausted `max_attempts` (3) |
| `done` | Unused until review commits to memory |

Invalid / empty files fail **immediately** (no retry). Other errors retry by returning the row to `pending` until attempts run out.

---

## Flow

1. Authenticated `POST /api/jobs` with multipart field `file` (one file).
2. File is written under `data/uploads/{jobId}/` (gitignored). A `job` row is inserted as `pending`.
3. The upload handler returns immediately, then `after()` runs `processNextJob()`.
4. Home lists jobs and refreshes every 2s while any row is `pending` or `processing`.
5. Cron or a person can also `POST /api/jobs/process` (session, or `Authorization: Bearer $PROCESS_SECRET`).

Allowed types: `.json`, `.jsonl`, `.txt`, `.md`. Max **10 MB**. Picker is single-file; the queue can still hold several jobs.

---

## What lives where

| Path | Role |
|---|---|
| `src/db/schema/jobs.ts` | `job` table |
| `src/lib/ingest/storage.ts` | Write checksummed file |
| `src/lib/ingest/worker.ts` | Claim + retry |
| `src/lib/ingest/extract.ts` | Stub; replace in module 3 |
| `src/app/api/jobs/route.ts` | `GET` list, `POST` upload |
| `src/app/api/jobs/[id]/route.ts` | Status for one job |
| `src/app/api/jobs/process/route.ts` | Drain up to 5 pending jobs |
| `/` | Upload form + job list |

`user_id` on `job` is who uploaded. Listing is org-wide (anyone signed in).

---

## Env / migrate

Optional: `PROCESS_SECRET` in `.env` for unattended process calls. `src/proxy.ts` skips `/api/jobs/process` so a missing cookie does not HTML-redirect; the route still requires a session or the bearer secret.

```bash
pnpm db:migrate
```

Migration: `drizzle/0001_neat_frog_thor.sql` (`job` table + `job_status` enum).

---

## Out of scope

- Groq extraction / `draft_cards`
- Review UI
- Replacing or editing an uploaded file
- Transcript viewer
