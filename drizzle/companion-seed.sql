-- TheEditCompanion product row. Run ONCE, AFTER drizzle/companion-schema.sql.
-- Idempotent: ON CONFLICT (slug) DO NOTHING, so running it again never changes an existing row
-- (prices, dates or the on/off switch the owner set later are left alone).
-- Hand-run on a Neon BRANCH first. Do not run on production without the owner's written approval.
-- Written 2026-10-19.
--
-- Values (owner decisions, OPEN-QUESTIONS.md Q2/Q3 and the 15 Oct pricing):
--   charged in NGN only:   N89,000 founders (8900000 kobo), then N129,000 (12900000 kobo)
--   shown as a reference:  $67 founders, then $97 (display only, never charged)
--   founders window:       30 days from go-live, no cap
--   file:                  the hash and size in lib/companion/file-hash.ts (verified 2026-10-19)
--
-- The row is created DARK (active = false): the page shows the product, the Pay button is off,
-- checkout answers "inactive". Turn it on with the GO-LIVE statement at the bottom.

insert into companion_products (
  slug,
  name,
  active,
  currency_base,
  founders_minor,
  regular_minor,
  founders_ends_at,
  founders_cap,
  display_usd_founders_minor,
  display_usd_regular_minor,
  file_pathname,
  file_sha256,
  file_bytes,
  link_ttl_hours,
  max_downloads,
  allow_manual_transfer,
  bank_details
) values (
  'theeditcompanion',                    -- must equal PRODUCT_SLUG in lib/companion/checkout-handler.ts
  'TheEditCompanion by BigQuiv Digitals',
  false,                                 -- dark until the Preview drills pass (see GO-LIVE below)
  'NGN',
  8900000,                               -- N89,000 founders
  12900000,                              -- N129,000 regular
  null,                                  -- TODO(owner): set at go-live, see GO-LIVE below. null = founders price never ends
  null,                                  -- no cap (owner Q3). Set a number here only if a cap is wanted
  6700,                                  -- $67 display only
  9700,                                  -- $97 display only
  'companion/TheEditCompanion.zip',      -- Blob key; equals the COMPANION_FILE_KEY default
  'db8e28c30292b1a68562b72bf7ca60cf35ee660717cd44ce6a68c1b6f3d6f802',
  11773338,
  168,                                   -- download links last 7 days (schema default)
  5,                                     -- 5 downloads per link (schema default)
  false,                                 -- bank transfer off; card and bank via Flutterwave only
  null                                   -- TODO(owner): bank details text, only if manual transfer is ever switched on
)
on conflict (slug) do nothing;

-- Check:
--   select slug, name, active, founders_minor, regular_minor, founders_ends_at, founders_cap, file_sha256, file_bytes
--     from companion_products where slug = 'theeditcompanion';

-- GO-LIVE (run once, the moment sales open; starts the 30-day founders window from that moment):
--   update companion_products
--      set active = true, founders_ends_at = now() + interval '30 days', updated_at = now()
--    where slug = 'theeditcompanion';
--
-- Stop sales again:
--   update companion_products set active = false, updated_at = now() where slug = 'theeditcompanion';
--
-- After a zip rebuild: node scripts/companion-zip-hash.mjs <zip> --write prints the update for file_sha256 / file_bytes.
