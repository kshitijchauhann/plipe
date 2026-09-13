# Auth module

Phase 1 module 1. **Anyone with a session can upload and review.** There is one organization; we do not use Better Auth’s organization plugin.

Sign-in is **email and password only**. No OAuth, email verification, or password-reset mail in this cut.

---

## Stack

| Piece | Choice |
|---|---|
| Auth | [Better Auth 1.7](https://better-auth.com/docs/installation) |
| Adapter | [`@better-auth/drizzle-adapter`](https://better-auth.com/docs/adapters/drizzle) (`provider: "pg"`) |
| ORM / migrations | Drizzle + Drizzle Kit (`pnpm db:generate` / `pnpm db:migrate`) |
| Database | Same Postgres as later pgvector (`DATABASE_URL`) |
| App | Next.js 16 App Router |

Better Auth stores users and sessions. Drizzle owns **all** tables, including auth. Do **not** run `auth migrate` (that path is Kysely-only). Generate SQL with Drizzle Kit and apply it.

---

## Environment

Copy `.env.example` to `.env`:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/plipe
BETTER_AUTH_SECRET=   # openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000
```

`BETTER_AUTH_SECRET` must be at least 32 characters. These stay server-side (no `NEXT_PUBLIC_`).

`DATABASE_URL` must include a Postgres **role and password**. A URL without a user (or with your Linux username) fails with `password authentication failed for user "…"`. Create the database if it does not exist (`createdb plipe`).

Apply the auth schema:

```bash
pnpm db:migrate
```

First migration: `drizzle/0000_sharp_drax.sql` — tables `user`, `session`, `account`, `verification`. Credential passwords live on `account` (`provider_id = credential`), not on `user`.

---

## What lives where

| Path | Role |
|---|---|
| `src/db/index.ts` | Postgres client + Drizzle `db` |
| `src/db/schema/auth.ts` | Better Auth tables + relations |
| `src/lib/auth.ts` | Server `auth` instance |
| `src/lib/auth-client.ts` | React `authClient` |
| `src/lib/session.ts` | `getSession` / `requireSession` |
| `src/app/api/auth/[...all]/route.ts` | `GET`/`POST` via `toNextJsHandler` |
| `src/proxy.ts` | Optimistic cookie gate (Next 16 proxy) |
| `/sign-in`, `/sign-up` | Public forms |
| `/` | Requires a real session |

`nextCookies()` is the last plugin in `auth.ts` so Server Actions can set cookies later if needed. Forms today sign in from the client.

---

## Request path

1. Unauthenticated request (except `/sign-in`, `/sign-up`, `/api/auth/*`, static assets) → `src/proxy.ts` checks for a session **cookie** and redirects to `/sign-in?next=…`. Cookie presence is **not** a security check.
2. Pages and future mutations call `auth.api.getSession({ headers })` (`getSession` / `requireSession`). That is the real gate.
3. Sign-up: `authClient.signUp.email({ name, email, password })` then redirect home. Password min length is Better Auth’s default (8).
4. Sign-in: `authClient.signIn.email`. `next` is only used if it is a same-origin path (`/`…, not `//`).
5. Sign-out: `authClient.signOut()`.

There is no tenant id. Later jobs/cards should store `user.id` as “who uploaded / who confirmed.”

---

## Protecting new routes

**Pages / server components**

```ts
import { requireSession } from "@/lib/session";

const session = await requireSession();
// session.user.id, session.user.email
```

**Route handlers**

```ts
import { getSession } from "@/lib/session";

const session = await getSession();
if (!session) {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
```

Do not treat `getSessionCookie` in proxy as authorization for uploads, review, or chat.

---

## Out of scope (this module)

- GitHub / other social providers
- Email verification or reset-password sending
- Organization / roles / invite-only signup
- pgvector (memory module; same Postgres later)

Restricting who can register (email domain, invites) can be added later without changing the session helpers.
