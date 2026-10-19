/**
 * Read or set TheEditCompanion's prices on the live product row (Neon,
 * companion_products, slug 'theeditcompanion'). There is no admin editor for
 * the price; this is the one place it changes.
 *
 *   node scripts/companion-price.mjs                     read the row
 *   node scripts/companion-price.mjs --set <foundersNaira> <regularNaira> <usdFounders> <usdRegular>
 *       e.g. --set 50000 150000 37 113   (naira whole, USD whole; USD is display only)
 *
 * Charged in NAIRA kobo only (lib/companion/INTERFACE.md). The founders end date
 * and cap are not touched. Orders already created at the old price are caught by
 * the checkout's price_changed check, so nobody is charged a stale amount.
 *
 * Mirror any change in components/companion/product.ts FALLBACK_PRODUCT (used
 * only when this row cannot be read) and the $ lines in components/companion/content.ts.
 */
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sql = neon(process.env.DATABASE_URL);
const COLS = "slug, active, founders_minor, regular_minor, founders_ends_at, founders_cap, display_usd_founders_minor, display_usd_regular_minor, updated_at";

const args = process.argv.slice(2);
if (args[0] === "--set") {
  const [f, r, uf, ur] = args.slice(1).map((v) => Number(v));
  if (![f, r, uf, ur].every((v) => Number.isInteger(v) && v > 0) || f >= r) {
    console.error("usage: --set <foundersNaira> <regularNaira> <usdFounders> <usdRegular>, whole numbers, founders below regular");
    process.exit(1);
  }
  const rows = await sql.query(
    `UPDATE companion_products
        SET founders_minor = $2, regular_minor = $3,
            display_usd_founders_minor = $4, display_usd_regular_minor = $5, updated_at = now()
      WHERE slug = $1
      RETURNING ${COLS}`,
    ["theeditcompanion", f * 100, r * 100, uf * 100, ur * 100]
  );
  console.log("updated:", JSON.stringify(rows, null, 2));
} else {
  const rows = await sql.query(`SELECT ${COLS} FROM companion_products WHERE slug = $1`, ["theeditcompanion"]);
  console.log(JSON.stringify(rows, null, 2));
}
