@../CLAUDE.md

# bigquivdigitals — databases, read this before touching data code

There are **three** databases here. Getting this wrong is the most likely way to break the site.

| Where | What it holds | Client |
|---|---|---|
| **Neon** (`DATABASE_URL`) | course purchases, waitlist, prospects, drone signups | `lib/pg-client.ts` via `lib/supabase.ts` |
| **Neon** (`DATABASE_URL`) | the graph, leads, prospecting | `lib/pg-client.ts` via `lib/supabase-outreach.ts` |
| **Turso** (`TURSO_DATABASE_URL`) | site content: services, case studies, testimonials, stats | `lib/db.ts` (drizzle) |
| **Supabase — bots** | the `cta_documents` articles, mirrored to Neon | `lib/articles-db.ts` |

## ⚠ `lib/supabase.ts` does not talk to Supabase

**Since 2026-08-16 (`10180eb`) it returns a Neon-backed client.** The name and the
`getSupabase()` / `getSupabaseAdmin()` exports were kept so the nine call sites — both payment
webhooks, Flutterwave verify, the Telegram course gate, waitlist, drone signup, admin sweep,
update-student, the students page — did not have to change. Rewriting payment webhooks by hand is
where money gets lost.

**Why:** content-engine shares a Supabase org with the trading and scraper tables, so its egress
quota gets burned by unrelated work. When it trips the REST API returns 402 and every course
surface fails at once — and because a blocked read and an empty table look identical through
`data ?? []`, it fails silently.

`lib/pg-client.ts` implements only the query shapes those files use (`eq neq is not ilike in
gt gte lt lte order limit single maybeSingle`, and `insert update upsert delete`). **If you need an
operator it does not have, add it there** — it throws rather than silently doing the wrong thing.

**Rollback is one file:** restore `lib/supabase.ts` from git.

⚠ **A live payment has never run through this client.** Every write path is verified, including
that upsert on an existing email updates rather than duplicating (a duplicate would double-grant
course access on a repeat webhook). A real test purchase is still outstanding.

⚠ **Manual data fixes must be applied to BOTH Neon and Supabase** until Supabase is retired. Neon
is what the site reads; Supabase still holds the legacy copy.

## ⚠ `lib/supabase-outreach.ts` does not talk to Supabase either

**Since 2026-09-08 it returns the same Neon-backed client.** Same reasoning as above: the name and
the `getOutreachSupabase()` / `getOutreachSupabaseAdmin()` exports were kept so the 11 call sites,
the `/admin/graph` pages, `/admin/outreach`, and `app/admin/actions/graph.ts`, did not have to
change. 18 objects and 4,363 rows were copied and row-count verified.

Postgres does not split credentials by role the way Supabase's anon and service keys did, so both
exports reach the same connection. **The admin/anon distinction survives only in the names.**

⚠ **Two files called the Supabase REST endpoint directly with `fetch`**, so they do not appear in a
grep for `getOutreachSupabase`: `app/admin/actions/outreach.ts` and `app/api/telegram/webhook/route.ts`.
Both approve the same rows. Had either been left behind, a Telegram approval would have written to
Supabase while `/admin/outreach` read Neon, and the draft would sit pending forever.

⚠ **The repo's `scripts/*_schema.sql` files are OLDER than the tables were.** The first copy silently
dropped 16 columns, 13 of them on `graph_leads` including email, full_name, website and raw_json.
**Do not trust those files as the schema of record.**

**Rollback is two files:** restore `lib/supabase-outreach.ts` and `lib/supabase-outreach-admin.ts`
from git. Nothing was deleted from Supabase.

⛔ **The migration is not finished.** `DATABASE_URL` still needs setting on the `graph-worker`
Railway service, which is blocked on `railway login`. Until then the worker still writes to Supabase.

## One environment trap

**`vercel whoami` reports `Logged out` while valid credentials exist.** The CLI does not read its
own store when invoked from Git Bash. Read the token from
`AppData/Roaming/com.vercel.cli/Data/auth.json` and pass it as `VERCEL_TOKEN`. Do not tell the
owner to log in again — it is not his end. (`expiresAt` in that file is in **seconds**.)

## Deploys

The project is git-connected (`Qui-vira/bigquivdigitals`, Vercel project **website**). **Commit and
push — do not `vercel --prod` from local files.** A direct deploy works once and then silently
reverts the next time anything rebuilds from git.

## Not built yet

**`/course`** does not exist. Only `app/api/course-access` (the Telegram gate for existing buyers).
It is required by the positioning doc and everything needed to build it is in the vault, but
**it must not go live before launch day** — a live sales page with a price kills the waitlist that
the 30-day arc is built on.
