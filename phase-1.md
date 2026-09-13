# Plipe Phase 1 — Spec

Companion to [prd.md](./prd.md). This is the build spec for Phase 1 after product decisions.

**Goal:** Institutional memory as **cards**, not transcripts. Upload a Cursor transcript, review extracted patterns, commit them to a searchable org memory, retrieve them in chat.

---

## Locked decisions

| Topic | Decision |
|---|---|
| Product surface | Cards (problem / solution / tags / gotchas). Transcripts are ingest input only. |
| Pipeline | `upload → extract → review → commit to memory → done` |
| Transcript after upload | Immutable. No re-upload, no edit, no second pass on the same file. |
| Chat | In Phase 1, alongside ingest, review, and memory. |
| Vectors | Postgres + pgvector. HNSW index. |
| Tenancy | Single organization. No multi-tenant. Dedup and retrieval are org-wide. |
| Projects | Many repos/projects exist. Do **not** silo memory per project. Project is a tag on an occurrence. |
| Who can review/edit drafts | Anyone authenticated. |
| Status while extracting | Poll **job** status only (`pending → processing → review_ready \| failed`). Do not fetch transcripts as knowledge. |
| Upload UX | One file at a time in the picker. Queue may still hold sequential jobs. |
| Failure | Retry transient errors (Groq/network). Then mark job `failed`. |
| Near-dup with a different fix | Machine does **not** merge solutions. High similarity → no second card, do not overwrite canonical text, attach occurrence (project + excerpt). Reviewer keeps a truly different fix as its own card. |

---

## What is not the product

- A transcript library or transcript viewer as the main UX
- `GET /api/transcripts/:id` as “load memory”
- Per-project knowledge bases
- Changing an upload after **done**

Store the raw file only so extraction can run. After review, the app lives on cards. Copied excerpts on cards are enough to verify citations.

---

## End-to-end flow

```
[authenticated user]
        │
        ▼
   upload one file
        │
        ▼
   job: pending → processing
        │          (worker + retries)
        ▼
   draft cards (not searchable)
        │
        ▼
   review: edit / drop drafts
        │
        ▼
   confirm → commit to memory
        │          (embed + dedup)
        ▼
   done  →  chat/search hits cards only
```

1. User uploads one transcript.
2. System creates a job, returns immediately. UI polls job status.
3. Worker extracts **draft** cards plus a copied primary excerpt (and a message/span pointer if available).
4. User reviews: edit fields, drop junk, confirm.
5. On confirm, each remaining card is embedded and inserted into **memory**, with org-wide near-dup check.
6. Chat retrieves committed cards and shows stored excerpts inline.

---

## Modules (build order)

```
[1 Auth] → [2 Ingest] → [3 Extract] → [4 Review] → [5 Memory]
                                              ↘ [6 Dedup]
[5 Memory] → [7 Chat]
```

### 1. Auth & tenant

- Authenticated users only.
- Single org: every card belongs to that organization.
- Anyone logged in can upload and review.

### 2. Ingest (upload + job)

- Accept one file; persist it; enqueue a job; return.
- Job statuses: `pending` → `processing` → `review_ready` | `failed`.
- Producer lives in Next.js. Worker is a jobs table claimed by a Next.js process route (or equivalent queue). Not a transcript-as-product API.
- Retry with a cap on transient failures. Invalid payload / empty extract → fail without spinning.

### 3. Extract (draft cards)

- Groq (or equivalent) structured extract from the uploaded file.
- Output is **drafts**, not memory: `problem`, `solution`, `tags`, `gotchas`.
- Each draft stores a **copied primary excerpt** (and optional structured pointer: message index / id).
- Drafts are not embedded for search and must not appear in chat.

### 4. Review (quality gate)

- The only path from extract into memory.
- Authenticated user edits or drops drafts, then confirms.
- After confirm, that upload is **done**. Transcript stays frozen.
- No “edit the transcript later.” Optional later card edits are out of scope unless added explicitly; Phase 1 quality is this gate.

### 5. Memory (cards)

- Committed cards + embeddings in Postgres / pgvector (HNSW).
- Retrieval and chat talk **only** to this store.
- Card holds the canonical `problem` / `solution` / `tags` / `gotchas` plus primary excerpt copy.
- Further sightings append **sources/occurrences**: `project` tag, copied excerpt, job/upload id. They do not become new product records of the transcript.

### 6. Dedup (on commit, not on upload)

Run when a **reviewed** card is inserted into memory, org-wide:

- Embed the card text.
- Nearest-neighbor against existing memory cards.
- If similarity ≥ threshold: do **not** `INSERT` a new card; do **not** overwrite existing problem/solution; append an occurrence (project + excerpt). `seen_count` (or occurrence rows) records that it was seen again.
- If below threshold: insert a new card.

**Same symptom, different fix:** embeddings may still match. MVP does not auto-merge solutions or create variant arrays. The first committed text stays canonical. If the new write-up is a different fix, the reviewer keeps it as a separate card instead of treating it as a clone.

Threshold starts as a constant (env-tunable). Prefer a conservative (high) threshold so false merges stay rare. Undo/split of a bad merge can wait.

### 7. Chat / retrieval

- Query embeddings over memory cards only.
- Answers cite cards and show the **copied excerpt inline**.
- Optional “open original” transcript viewer is not required for Phase 1.

---

## Data (logical)

Not a migration — shape the schema toward this:

- **users** — authenticated accounts in the one org
- **jobs** — upload, status, attempts, pointer to stored file
- **draft_cards** — extract output, belongs to a job, editable until confirm
- **cards** — committed memory (canonical text + embedding + primary excerpt)
- **card_occurrences** — extra sources after dedup (`project`, excerpt copy, job id)

Chat reads `cards` (+ occurrences for “also seen in …”). Jobs/drafts are ingest machinery.

---

## Phase 1 out of scope

- MCP / IDE integration (Phase 2)
- Auto-tagging as a separate pipeline (project/tech may still be manual or cheap hints)
- Thumbs up/down ranking
- Team digest
- Proactive surfacing, cross-tool ingest, quality scoring (Phase 3)
- Multi-org tenancy
- Multiple solutions on one card (variants)
- Transcript viewer as a product
- Re-running extract or mutating an upload after **done**

---

## Implementation note (queue)

Enqueue from the Next.js upload route. Process via a jobs table + worker invocation (cron or `POST /api/jobs/process`) with retries. A hosted runner (Inngest, etc.) is compatible later; it must not change the user-visible flow.
