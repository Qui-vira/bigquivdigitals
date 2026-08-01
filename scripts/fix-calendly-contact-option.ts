/**
 * One-time migration: one booking link, everywhere.
 *
 * The `settings` rows (`calendly_url`, `calendly_free_url`) already point at
 * `_quivira/one-on-one-meeting`, but the `contact_options` row rendered on
 * /contact was seeded with a second, different link (`bigquiv/15min`). Two live
 * booking links split the calendar and make the promised call length ambiguous.
 *
 * Run: npx tsx scripts/fix-calendly-contact-option.ts
 */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { sql } from "drizzle-orm";
import * as schema from "../lib/schema";

const CANONICAL = "https://calendly.com/_quivira/one-on-one-meeting";

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error("TURSO_DATABASE_URL not set");

  const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  const db = drizzle(client, { schema });

  const before = await db.select().from(schema.contactOptions);
  console.log("Current contact options:");
  before.forEach((o) => console.log(`  [${o.id}] ${o.title} | ${o.description} | ${o.href}`));

  await db
    .update(schema.contactOptions)
    .set({ href: CANONICAL, description: "Schedule a free intro call" })
    .where(
      sql`${schema.contactOptions.href} LIKE '%calendly.com%' AND ${schema.contactOptions.href} <> ${CANONICAL}`
    );

  const after = await db.select().from(schema.contactOptions);
  console.log("\nAfter update:");
  after.forEach((o) => console.log(`  [${o.id}] ${o.title} | ${o.description} | ${o.href}`));

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
