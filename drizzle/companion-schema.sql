-- TheEditCompanion tables. ADDITIVE ONLY. Hand-run on a Neon BRANCH first.
-- Never alters or drops an existing table. Amounts are integer minor units
-- (kobo for NGN). Product is charged in NGN only; the USD columns are display only.
-- Written 2026-10-15. Do not run on production without the owner's written approval.
-- The product row is NOT created here: run drizzle/companion-seed.sql after this file.

create extension if not exists pgcrypto;

create table if not exists companion_products (
  slug                      text primary key,
  name                      text not null,
  active                    boolean not null default false,
  currency_base             text not null default 'NGN' check (currency_base = 'NGN'),
  founders_minor            integer not null check (founders_minor >= 0),   -- 8900000 = N89,000
  regular_minor             integer not null check (regular_minor >= 0),    -- 12900000 = N129,000
  founders_ends_at          timestamptz null,   -- set at launch (go-live + 30 days); null = no end
  founders_cap              integer null check (founders_cap is null or founders_cap > 0),
  display_usd_founders_minor integer null,      -- display only, never charged
  display_usd_regular_minor  integer null,      -- display only, never charged
  file_pathname             text,
  file_sha256               text,
  file_bytes                bigint,
  link_ttl_hours            integer not null default 168,
  max_downloads             integer not null default 5,
  allow_manual_transfer     boolean not null default false,
  bank_details              text null,          -- owner supplied, shown only when manual transfer is on
  updated_at                timestamptz not null default now()
);

create table if not exists companion_orders (
  id                    uuid primary key default gen_random_uuid(),
  order_ref             text not null unique,   -- 'TEC-' + 22 url-safe chars; also the Flutterwave tx_ref
  product_slug          text not null references companion_products(slug),
  email                 text not null,
  name                  text not null,
  status                text not null check (status in
                          ('created','awaiting_payment','awaiting_transfer','underpaid','paid','refunded','expired','flagged')),
  method                text not null check (method in ('flutterwave','blockradar','bank_transfer')),
  price_tier            text not null check (price_tier in ('founders','regular')),
  expected_minor        integer not null check (expected_minor >= 0),
  currency              text not null default 'NGN' check (currency = 'NGN'),
  support_until         timestamptz null,       -- paid_at + 30 days
  provider_tx_id        text null,
  provider_ref          text null,
  amount_received_minor integer null,
  received_note         text null,
  consent_at            timestamptz not null,
  consent_version       text not null,
  consent_ip_hash       text null,
  src                   text null,
  claim_hash            text not null,
  created_at            timestamptz not null default now(),
  paid_at               timestamptz null,
  email_sent_at         timestamptz null,
  email_attempts        integer not null default 0,
  last_email_error      text null
);

-- Payment idempotency: one provider payment can belong to one order only.
create unique index if not exists companion_orders_provider_tx_uidx
  on companion_orders (provider_tx_id) where provider_tx_id is not null;
create index if not exists companion_orders_email_idx on companion_orders (email);
create index if not exists companion_orders_status_created_idx on companion_orders (status, created_at);
create index if not exists companion_orders_src_idx on companion_orders (src);

create table if not exists companion_download_tokens (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references companion_orders(id),
  token_hash      text not null unique,         -- sha256 hex of the random token; plaintext is never stored
  expires_at      timestamptz not null,
  max_downloads   integer not null,
  download_count  integer not null default 0,
  revoked_at      timestamptz null,
  created_at      timestamptz not null default now(),
  created_by      text not null check (created_by in ('system','admin')),
  kind            text not null default 'email' check (kind in ('email','thanks'))  -- thanks = the thanks page link, revoked independently
);
-- Already created without kind (e.g. a Neon branch from before 16 Oct)? Run this once:
alter table companion_download_tokens add column if not exists kind text not null default 'email' check (kind in ('email','thanks'));
create index if not exists companion_tokens_order_idx on companion_download_tokens (order_id);

create table if not exists companion_download_log (
  id        bigserial primary key,
  token_id  uuid not null references companion_download_tokens(id),
  at        timestamptz not null default now(),
  ip_hash   text null,
  ua        text null                            -- trimmed to 200 chars by the app
);

create table if not exists companion_order_events (
  id        bigserial primary key,
  order_id  uuid not null references companion_orders(id),
  at        timestamptz not null default now(),
  actor     text not null check (actor in ('system','admin','webhook','buyer')),
  kind      text not null,
  detail    text not null default ''             -- never put secrets, emails or tokens here
);
create index if not exists companion_events_order_kind_idx on companion_order_events (order_id, kind, at);

-- ---------------------------------------------------------------------------
-- Wave 3 additions (race fixes S7, S12c, S14). SAFE TO RUN ON AN EXISTING BRANCH:
-- every statement is idempotent and additive (alter ... add column if not exists,
-- create ... if not exists). Run this whole block once on any branch that already
-- has the tables above. Nothing here changes or drops existing data.
-- ---------------------------------------------------------------------------

-- S7: each founders place is a numbered slot, so two checkouts cannot both take the last one.
-- Only used when companion_products.founders_cap is set. Slots are released by the app when a hold ends.
alter table companion_orders add column if not exists founders_slot integer null;
create unique index if not exists companion_orders_founders_slot_uidx
  on companion_orders (product_slug, founders_slot) where founders_slot is not null;

-- S14: at most one card order per buyer per product while its payment link is still being created.
-- Once the link is stored in provider_ref the order leaves this index (a later checkout is a new order).
--
-- PRE-CLEAN (review N-M5). Before wave 3 a card order never stored its link in provider_ref, so a
-- branch that already holds orders can have SEVERAL rows per (email, product_slug) matching the
-- index predicate, and "create unique index" would abort the whole script. This keeps the NEWEST
-- such row per buyer and product and marks the older ones expired. Expired is not terminal: a
-- real payment that still arrives on one of them is honoured (PAYABLE_FROM includes expired).
-- Idempotent: on an empty or already clean table it updates 0 rows. It never touches any other
-- table and never deletes a row.
update companion_orders o
   set status = 'expired'
 where o.method = 'flutterwave' and o.status = 'awaiting_payment' and o.provider_ref is null
   and exists (
         select 1 from companion_orders n
          where n.email = o.email and n.product_slug = o.product_slug
            and n.method = 'flutterwave' and n.status = 'awaiting_payment' and n.provider_ref is null
            and (n.created_at, n.id) > (o.created_at, o.id)
       );
create unique index if not exists companion_orders_inflight_uidx
  on companion_orders (email, product_slug)
  where method = 'flutterwave' and status = 'awaiting_payment' and provider_ref is null;

-- S14: atomic "5 checkout attempts per email per hour": the app claims slot n = 1..5 for the hour.
create table if not exists companion_checkout_attempts (
  email   text not null,
  bucket  timestamptz not null,   -- start of the UTC hour; the app deletes rows older than 24 h on every attempt (Privacy page)
  n       integer not null,
  primary key (email, bucket, n)
);

-- S12c: non-unique lookup of a bank reference (event kind 'bank_reference', detail = normalised reference).
create index if not exists companion_events_kind_detail_idx on companion_order_events (kind, detail);
