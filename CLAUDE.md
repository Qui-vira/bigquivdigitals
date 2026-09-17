@../CLAUDE.md

# bigquivdigitals — databases, read this before touching data code

There are **two** databases here. Getting this wrong is the most likely way to break the site.

| Where | What it holds | Client |
|---|---|---|
| **Neon** (`DATABASE_URL`) | course purchases, waitlist, prospects, drone signups | `lib/pg-client.ts` via `lib/supabase.ts` |
| **Neon** (`DATABASE_URL`) | the graph, leads, prospecting | `lib/pg-client.ts` via `lib/supabase-outreach.ts` |
| **Neon** (`DATABASE_URL`) | the `cta_documents` articles | `lib/articles-db.ts` |
| **Turso** (`TURSO_DATABASE_URL`) | site content: services, case studies, testimonials, stats | `lib/db.ts` (drizzle) |

## ✅ Supabase is gone

**Owner's decision, 2026-09-13: "i am not using supabase again".** Nothing in this repo connects
to Supabase any more, and `@supabase/supabase-js` has been removed from `package.json`.

The three files that still carry the word are named that way on purpose, so their call sites did
not have to be rewritten: `lib/supabase.ts`, `lib/supabase-outreach.ts` and
`lib/supabase-outreach-admin.ts` all return the Neon client. **The name is a scar, not a
dependency.**

⚠ **`cta_documents` last published on 2026-05-19.** The writer that produced those articles lives
outside this repo and wrote to Supabase. It has been silent about four months, which is why the
cutover was safe. **If it is ever restarted, point it at Neon** — otherwise it writes somewhere the
site no longer reads and the new article never appears, silently, because an unseen article and no
article look identical from here.

⚠ **12 article assets moved to Vercel Blob** (11 in the Lexus workflow, 1 in the comic template).
The bodies in Neon were rewritten to the new URLs and the Supabase host was dropped from
`next.config.ts`. **Supabase storage can now be deleted without breaking a page.**

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

⛔ **One piece is outside this repo.** The `graph-worker` Railway service still needs
`DATABASE_URL` set, which needs `railway login` and his browser session. Until then that worker
writes to Supabase while the site reads Neon, so graph rows it produces will not appear.

## One environment trap

**`vercel whoami` reports `Logged out` while valid credentials exist.** The CLI does not read its
own store when invoked from Git Bash. Read the token from
`AppData/Roaming/com.vercel.cli/Data/auth.json` and pass it as `VERCEL_TOKEN`. Do not tell the
owner to log in again — it is not his end. (`expiresAt` in that file is in **seconds**.)

## Deploys

The project is git-connected (`Qui-vira/bigquivdigitals`, Vercel project **website**). **Commit and
push — do not `vercel --prod` from local files.** A direct deploy works once and then silently
reverts the next time anything rebuilds from git.

## Adding a case study to /work

Four builds live at `/work/<slug>`: peaceway, alpha-plays, content-engine and
nigeria-business-costs. **Project data is hardcoded TypeScript, not the database.** The
`case_studies` table in Turso exists but nothing on these pages reads it.

Adding one touches six places. Miss any and the page is live but unreachable:

| File | What to add |
|---|---|
| `app/work/<slug>/page.mdx` | The case study. `export const metadata`, an accent kicker `<p>`, then `# headline` |
| `components/HomeClient.tsx` | An entry in `CASE_STUDIES` — the home grid |
| `components/PortfolioShowcase.tsx` | An entry in `PROJECTS` — the `/portfolio` grid, with a `category` |
| `app/sitemap.ts` | The route, priority 0.8 |
| `app/not-found.tsx` | The route, in the recovery link list |
| `app/portfolio/page.tsx` | The "NN builds" count in the header |

**`mdx-components.tsx` styles every heading, paragraph and list globally**, so an MDX file
inherits the whole design system and needs no imports and no CSS. `app/work/layout.tsx`
supplies the back link, the 760px column and the closing CTA.

**`<Evidence>` is available in every MDX file without an import.** It is the unit the site
argues from: a claim and the screenshot proving it, rendered together and never separable.
It takes `src`, `alt`, `claim`, `tier` and an optional `href`. **Do not add a variant that
renders a claim without its image.** Where a caption line would otherwise sit under an
image as a paragraph, make it the figure's `claim` instead — otherwise the same sentence
appears twice.

Screenshots go in `public/proof/<slug>/NN-name.webp`, numbered, real captures of the real
thing. ⚠ **Crop application chrome out before saving.** A window capture of Excel carries
the owner's account name in the title bar, and a Document Recovery pane will happily list
unrelated private filenames.

**A project can answer more than one discipline tab.** `PortfolioShowcase` has an optional
`alsoIn` array beside `category`. NBCI is both data engineering and data analysis and
appears under both; without it the Data Engineer tab rendered "I have not shipped one of
these yet", which had stopped being true.

## Not built yet

**`/course`** does not exist. Only `app/api/course-access` (the Telegram gate for existing buyers).
It is required by the positioning doc and everything needed to build it is in the vault, but
**it must not go live before launch day** — a live sales page with a price kills the waitlist that
the 30-day arc is built on.
