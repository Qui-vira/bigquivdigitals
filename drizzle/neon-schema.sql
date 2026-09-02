-- Course/business tables, migrated from Supabase content-engine 2026-08-14.
-- Schema, defaults and indexes reproduced exactly, including the functional
-- unique index on lower(email) that makes a duplicate waitlist signup return
-- 23505 rather than an error.

create table if not exists course_purchases (
  id                uuid primary key default gen_random_uuid(),
  email             text not null,
  first_name        text,
  course_slug       text not null default 'ai-content-mastery',
  amount            numeric not null,
  currency          text not null default 'NGN',
  payment_method    text not null,
  transaction_ref   text,
  status            text not null default 'confirmed',
  created_at        timestamptz default now(),
  email_sent        boolean default false,
  invite_count      integer default 0,
  telegram_username text,
  telegram_user_id  text,
  sweep_verified_at timestamptz,
  referred_by       text
);
create unique index if not exists unique_email_course on course_purchases (email, course_slug);
create index if not exists idx_course_purchases_email on course_purchases (email);

create table if not exists course_waitlist (
  id         bigserial primary key,
  email      text not null,
  source     text not null default 'homepage',
  created_at timestamptz not null default now()
);
create unique index if not exists course_waitlist_email_key on course_waitlist (lower(email));

create table if not exists prospects (
  id         uuid primary key default gen_random_uuid(),
  first_name text not null,
  email      text not null,
  created_at timestamptz default now()
);
create unique index if not exists prospects_email_key on prospects (email);

create table if not exists drone_pilot_signups (
  id               uuid primary key default gen_random_uuid(),
  full_name        text not null,
  email            text not null,
  phone            text not null,
  instagram_handle text,
  city             text not null,
  state            text not null,
  drone_model      text not null,
  has_license      boolean default false,
  license_type     text,
  experience_years integer not null,
  portfolio_url    text,
  services_offered text[] default '{}'::text[],
  availability     text not null,
  rate_per_hour    text,
  additional_notes text,
  created_at       timestamptz default now(),
  status           text default 'pending'
);
