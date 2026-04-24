// ─────────────────────────────────────────────────────────────────────────────
// HealthMapr — Supabase Data Service
//
// All reads/writes for authenticated users go through here.
// localStorage is used as a write-through cache so the UI stays fast.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from './supabase'
import type { DailyMetric, UserProfile } from './types'
import { readLocalProfile, writeLocalProfile, readLocalMetrics, writeLocalMetric } from './storage-internal'

// ── Profile ───────────────────────────────────────────────────────────────────

export async function loadProfileFromSupabase(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) { console.error('loadProfile error:', error); return null }
  if (!data) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any
  const profile: UserProfile = {
    name:             row.name            ?? '',
    age:              row.age             ?? 25,
    height_cm:        row.height_cm       ?? 170,
    weight_kg:        row.weight_kg       ?? 70,
    sex:              row.sex             ?? 'other',
    activity_level:   row.activity_level  ?? 'moderate',
    goal:             row.goal            ?? undefined,
    reminder_enabled: row.reminder_enabled ?? false,
    reminder_time:    row.reminder_time   ?? '09:00',
    setup_complete:   row.setup_complete  ?? false,
    created_at:       row.created_at,
    updated_at:       row.updated_at,
  }

  // Populate localStorage cache
  writeLocalProfile(profile)
  return profile
}

export async function saveProfileToSupabase(
  userId: string,
  profile: Omit<UserProfile, 'created_at' | 'updated_at'>
): Promise<void> {
  const now = new Date().toISOString()
  const { error } = await supabase.from('profiles').upsert(
    {
      user_id:          userId,
      name:             profile.name,
      age:              profile.age,
      height_cm:        profile.height_cm,
      weight_kg:        profile.weight_kg,
      sex:              profile.sex,
      activity_level:   profile.activity_level,
      goal:             profile.goal ?? null,
      reminder_enabled: profile.reminder_enabled ?? false,
      reminder_time:    profile.reminder_time ?? '09:00',
      setup_complete:   profile.setup_complete ?? false,
      updated_at:       now,
    },
    { onConflict: 'user_id' }
  )
  if (error) console.error('saveProfile error:', error)
}

// ── Metrics ───────────────────────────────────────────────────────────────────

export async function loadMetricsFromSupabase(userId: string, days = 90): Promise<DailyMetric[]> {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data, error } = await supabase
    .from('daily_metrics')
    .select('*')
    .eq('user_id', userId)
    .gte('date', since.toISOString().slice(0, 10))
    .order('date', { ascending: false })

  if (error) { console.error('loadMetrics error:', error); return [] }
  if (!data) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metrics: DailyMetric[] = (data as any[]).map((row: any) => ({
    date:          row.date,
    calories_in:   row.calories_in   ?? undefined,
    calories_out:  row.calories_out  ?? undefined,
    steps:         row.steps         ?? undefined,
    sleep_hours:   row.sleep_hours   ?? undefined,
    weight_kg:     row.weight_kg     ?? undefined,
    note:          row.note          ?? undefined,
    workouts:      row.workouts      ?? [],
  }))

  // Populate localStorage cache
  for (const m of metrics) writeLocalMetric(m)
  return metrics
}

export async function saveMetricToSupabase(userId: string, metric: DailyMetric): Promise<void> {
  const { error } = await supabase.from('daily_metrics').upsert(
    {
      user_id:       userId,
      date:          metric.date,
      calories_in:   metric.calories_in  ?? null,
      calories_out:  metric.calories_out ?? null,
      steps:         metric.steps        ?? null,
      sleep_hours:   metric.sleep_hours  ?? null,
      weight_kg:     metric.weight_kg    ?? null,
      note:          metric.note         ?? null,
      workouts:      metric.workouts     ?? [],
      updated_at:    new Date().toISOString(),
    },
    { onConflict: 'user_id,date' }
  )
  if (error) console.error('saveMetric error:', error)
}

// ── Full sync on login ─────────────────────────────────────────────────────────

export async function syncOnLogin(userId: string): Promise<{
  profile: UserProfile | null
  metrics: DailyMetric[]
}> {
  const [profile, metrics] = await Promise.all([
    loadProfileFromSupabase(userId),
    loadMetricsFromSupabase(userId),
  ])
  return { profile, metrics }
}

// ── Internal localStorage helpers (exported for storage.ts to use) ─────────────

export { readLocalProfile, writeLocalProfile, readLocalMetrics, writeLocalMetric }
