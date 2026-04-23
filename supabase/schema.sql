-- ─────────────────────────────────────────────────────────────────────────────
-- HealthMapr — Supabase Schema
-- Run this in your Supabase project's SQL Editor
-- Dashboard → SQL Editor → New query → paste → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Profiles ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id   TEXT UNIQUE NOT NULL,   -- localStorage UUID (pre-auth device identifier)
  name        TEXT,
  age         INTEGER,
  height_cm   REAL,
  weight_kg   REAL,
  sex         TEXT CHECK (sex IN ('male', 'female', 'other')),
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Daily Metrics ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS daily_metrics (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id    TEXT NOT NULL REFERENCES profiles(device_id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  calories_in  REAL,
  calories_out REAL,
  steps        INTEGER,
  sleep_hours  REAL,
  weight_kg    REAL,
  note         TEXT,
  -- Workout array: [{type, duration_min, calories, source, source_id}]
  workouts     JSONB DEFAULT '[]'::jsonb,
  -- Integration tokens (stored per device, pre-auth)
  strava_access_token   TEXT,
  strava_refresh_token  TEXT,
  strava_token_expires  BIGINT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(device_id, date)
);

-- Separate integrations table for OAuth tokens (one row per device per source)
CREATE TABLE IF NOT EXISTS integrations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id    TEXT NOT NULL REFERENCES profiles(device_id) ON DELETE CASCADE,
  source       TEXT NOT NULL CHECK (source IN ('strava', 'google_fit')),
  access_token  TEXT,
  refresh_token TEXT,
  token_expires BIGINT,
  scope         TEXT,
  athlete_id    TEXT,   -- external user ID for this source
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(device_id, source)
);

ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "integrations_open" ON integrations FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS daily_metrics_device_date ON daily_metrics(device_id, date DESC);

-- ── Auto-update timestamps ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER daily_metrics_updated_at
  BEFORE UPDATE ON daily_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────────────
-- NOTE: Currently open (device_id-based access, no auth yet).
-- When you add Supabase Auth later, update these policies to use auth.uid().

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (pre-auth phase)
-- These will be tightened when authentication is integrated
CREATE POLICY "profiles_open" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "daily_metrics_open" ON daily_metrics FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- FUTURE AUTH POLICIES (uncomment when you add Supabase Auth):
-- ─────────────────────────────────────────────────────────────────────────────
-- DROP POLICY IF EXISTS "profiles_open" ON profiles;
-- DROP POLICY IF EXISTS "daily_metrics_open" ON daily_metrics;
--
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users;
-- ALTER TABLE daily_metrics ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users;
--
-- CREATE POLICY "profiles_auth" ON profiles
--   FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- CREATE POLICY "daily_metrics_auth" ON daily_metrics
--   FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- ─────────────────────────────────────────────────────────────────────────────
