-- ─────────────────────────────────────────────────────────────────────────────
-- HealthMapr — Auth Schema Migration
--
-- Run this in your Supabase project → SQL Editor → New Query
-- It creates the profiles and daily_metrics tables with:
--   • user_id linked to auth.users
--   • Row Level Security (users see ONLY their own rows)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Enable UUID extension (should already be on, but safe to repeat) ──────────
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. PROFILES
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references auth.users(id) on delete cascade,

  name              text,
  age               integer,
  height_cm         numeric(5,1),
  weight_kg         numeric(5,1),
  sex               text check (sex in ('male','female','other')),
  activity_level    text check (activity_level in ('sedentary','light','moderate','active','very_active')),
  goal              text check (goal in ('lose_weight','sleep_better','move_more','track_everything')),
  reminder_enabled  boolean default false,
  reminder_time     text default '20:00',   -- HH:MM
  setup_complete    boolean default false,

  created_at        timestamptz default now(),
  updated_at        timestamptz default now(),

  constraint profiles_user_id_unique unique (user_id)
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

create policy "Users can delete own profile"
  on public.profiles for delete
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. DAILY METRICS
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.daily_metrics (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  date          date not null,

  calories_in   integer,
  calories_out  integer,
  steps         integer,
  sleep_hours   numeric(4,1),
  weight_kg     numeric(5,1),
  note          text,
  workouts      jsonb default '[]'::jsonb,

  updated_at    timestamptz default now(),

  constraint daily_metrics_user_date_unique unique (user_id, date)
);

-- Enable RLS
alter table public.daily_metrics enable row level security;

-- Policies
create policy "Users can view own metrics"
  on public.daily_metrics for select
  using (auth.uid() = user_id);

create policy "Users can insert own metrics"
  on public.daily_metrics for insert
  with check (auth.uid() = user_id);

create policy "Users can update own metrics"
  on public.daily_metrics for update
  using (auth.uid() = user_id);

create policy "Users can delete own metrics"
  on public.daily_metrics for delete
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. INDEXES (for performance at scale)
-- ─────────────────────────────────────────────────────────────────────────────

create index if not exists daily_metrics_user_id_idx  on public.daily_metrics (user_id);
create index if not exists daily_metrics_date_idx     on public.daily_metrics (date desc);
create index if not exists profiles_user_id_idx       on public.profiles (user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. AUTO-UPDATE updated_at trigger
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger daily_metrics_updated_at
  before update on public.daily_metrics
  for each row execute function public.handle_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- Done! Your tables are ready.
-- ─────────────────────────────────────────────────────────────────────────────
