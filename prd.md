# PRD: Plipe — Roadmap & Feature Expansion

*Companion to the v1 core PRD (Cursor Transcript Pattern Knowledge Base). This document covers what Plipe becomes beyond v1.*

## 1. Vision

Plipe starts as "upload a Cursor transcript, get searchable patterns back." The end state is an always-on institutional memory layer for engineering work — knowledge shows up where and when it's needed, instead of requiring someone to remember to open a chat tab and search.

## 2. Guiding principle for prioritization

Ship what makes v1 solid and trustworthy first, then what changes daily behavior (surfacing in the IDE), then what changes what the product fundamentally is (proactive, cross-tool, org-wide).

## 3. Phase 1 — Solidify the core (near-term)

### 3.1 Async extraction with status
- **Problem:** Groq extraction on a long transcript shouldn't block the upload UI.
- **Requirement:** Upload creates a `transcripts` row with status `pending`; extraction runs as a background job; UI polls/subscribes and shows `pending → processing → done/failed`.

### 3.2 Dedup / near-duplicate detection
- **Problem:** The same bug fixed across multiple projects shouldn't produce redundant cards.
- **Requirement:** On insert, compare new card's embedding against existing cards above a similarity threshold. If a near-duplicate is found, link the new occurrence to the existing card (e.g. increment a `seen_count`, append `project`/`source` reference) instead of creating a new row.

### 3.3 Source linking
- **Problem:** A distilled card can be wrong or lose nuance; users need to verify against the original.
- **Requirement:** Each card stores a reference (offset/span or transcript id) back to the originating transcript excerpt. Chat answers that cite a card link through to that excerpt.

### 3.4 Manual card editing
- **Problem:** Extraction won't be perfect every time.
- **Requirement:** Authenticated users with appropriate scope can edit a card's `problem`, `solution`, `tags`, `gotchas` post-extraction. Edits re-trigger re-embedding of the changed text.

## 4. Phase 2 — Make it part of the daily workflow (medium-term)

### 4.1 IDE / MCP integration
- **Problem:** A separate chat tab is easy to forget to check.
- **Requirement:** Expose Plipe's retrieval as an MCP server (or Cursor/VS Code extension) so patterns can be queried directly from the editor, using current file/error context as the implicit query.
- **Priority note:** highest-leverage item in this phase — changes Plipe from "a tool you remember" to "context that's just there."

### 4.2 Auto-tagging
- **Requirement:** Infer `tech_stack` and `project` from transcript content during extraction rather than relying on manual metadata entry.

### 4.3 Feedback loop
- **Requirement:** Thumbs up/down (or "this solved it") on retrieved patterns in chat. Store feedback per card; use it to influence ranking and to flag low-value cards for review.

### 4.4 Team digest
- **Requirement:** Scheduled (e.g. weekly) summary of newly added patterns, sent to a channel/email, so passive users still see what's been learned.

## 5. Phase 3 — Change what the product is (longer-term)

### 5.1 Proactive surfacing
- **Requirement:** Watch for signals in the IDE/session (an error message, repeated failed attempts) and suggest a relevant pattern without an explicit query.

### 5.2 Cross-tool ingestion
- **Requirement:** Extend ingestion beyond Cursor transcripts to Claude Code sessions, ChatGPT sessions, Slack threads, and PR review comments — any source where engineering problem-solving happens and currently gets lost.

### 5.3 Org-wide onboarding tool
- **Requirement:** Position and surface Plipe as the first stop for new hires ("has anyone hit this before?") — a natural scale-up of the existing intern-upload flow.

### 5.4 Pattern quality scoring
- **Requirement:** Track retrieval frequency and feedback per card over time; surface high-value patterns, flag rarely-used or outdated ones (e.g. a workaround for a bug since fixed upstream) for pruning or review.

## 6. Sequencing summary

| Phase | Focus | Key features |
|---|---|---|
| 1 | Solidify v1 | Async extraction, dedup, source linking, manual editing |
| 2 | Daily workflow | IDE/MCP integration, auto-tagging, feedback loop, team digest |
| 3 | Product transformation | Proactive surfacing, cross-tool ingestion, onboarding tool, quality scoring |

## 7. Open questions

- Which IDE integration path first — MCP server (tool-agnostic) or a Cursor-specific extension?
- What similarity threshold defines a "near-duplicate" for dedup, and should it be tunable?
- Does proactive surfacing (Phase 3) require user opt-in given it involves passively reading editor/session signals?
- What's the retention/pruning policy once pattern quality scoring exists — auto-archive, or always human-reviewed?
