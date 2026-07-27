/**
 * READ-ONLY. Dumps the About-page database rows so they can be backed up and
 * diffed before any edit. Makes no writes.
 *
 * Run: npx tsx --env-file=.env.local scripts/about-inspect.ts
 */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../lib/schema";

async function main() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  const db = drizzle(client, { schema });

  const ecosystem = await db.select().from(schema.aboutEcosystem);
  const milestones = await db.select().from(schema.milestones);

  console.log("=== about_ecosystem ===");
  for (const e of ecosystem) {
    console.log(`  [${e.id}] sort=${e.sortOrder} ${e.name} | ${e.role}`);
    console.log(`        ${e.description}`);
  }

  console.log("\n=== milestones ===");
  for (const m of milestones) {
    console.log(`  [${m.id}] sort=${m.sortOrder} ${m.year} — ${m.title}`);
    const hasWeex = /weex/i.test(m.text);
    console.log(`        chars=${m.text.length} mentionsWeex=${hasWeex}`);
    if (hasWeex) {
      for (const line of m.text.split("\n")) {
        if (/weex/i.test(line)) console.log(`        >>> ${line.trim()}`);
      }
    }
  }

  console.log("\n=== JSON BACKUP ===");
  console.log(JSON.stringify({ ecosystem, milestones }, null, 2));
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
