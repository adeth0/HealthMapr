// ─────────────────────────────────────────────────────────────────────────────
// HealthMapr — localStorage Data Layer
// ─────────────────────────────────────────────────────────────────────────────

import type { DailyMetric, HealthMaprStore, UserProfile } from '@/lib/types'

const STORAGE_KEY = 'healthmapr_v2'
const SCHEMA_VERSION = 2

// ── Helpers ───────────────────────────────────────────────────────────────────

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function getDefaultStore(): HealthMaprStore {
  return { profile: null, metrics: {}, schemaVersion: SCHEMA_VERSION }
}

function readStore(): HealthMaprStore {
  if (!isBrowser()) return getDefaultStore()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getDefaultStore()
    const parsed = JSON.parse(raw) as HealthMaprStore
    if (parsed.schemaVersion !== SCHEMA_VERSION) return getDefaultStore()
    return parsed
  } catch {
    return getDefaultStore()
  }
}

function writeStore(store: HealthMaprStore): void {
  if (!isBrowser()) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

// ── Device User ID (for future Supabase sync) ─────────────────────────────────

export function getDeviceUserId(): string {
  if (!isBrowser()) return 'server'
  const key = 'healthmapr_uid'
  let uid = localStorage.getItem(key)
  if (!uid) {
    uid = crypto.randomUUID()
    localStorage.setItem(key, uid)
  }
  return uid
}

// ── Profile ───────────────────────────────────────────────────────────────────

export function getProfile(): UserProfile | null {
  return readStore().profile
}

export function saveProfile(profile: Omit<UserProfile, 'created_at' | 'updated_at'>): UserProfile {
  const store = readStore()
  const now = new Date().toISOString()
  const full: UserProfile = {
    ...profile,
    created_at: store.profile?.created_at ?? now,
    updated_at: now,
  }
  store.profile = full
  writeStore(store)
  return full
}

// ── Daily Metrics ─────────────────────────────────────────────────────────────

export function getMetrics(): DailyMetric[] {
  const store = readStore()
  return Object.values(store.metrics).sort((a, b) => a.date.localeCompare(b.date))
}

export function getMetricByDate(date: string): DailyMetric | null {
  const store = readStore()
  return store.metrics[date] ?? null
}

export function saveMetric(metric: DailyMetric): DailyMetric {
  const store = readStore()
  const existing = store.metrics[metric.date] ?? {}
  store.metrics[metric.date] = { ...existing, ...metric }
  writeStore(store)
  return store.metrics[metric.date]
}

export function getRecentMetrics(days: number): DailyMetric[] {
  const all = getMetrics()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days + 1)
  const cutoffStr = cutoff.toISOString().split('T')[0]
  return all.filter((m) => m.date >= cutoffStr)
}

export function getMetricsDescending(): DailyMetric[] {
  return getMetrics().reverse()
}

// ── Store management ──────────────────────────────────────────────────────────

export function clearAllData(): void {
  if (!isBrowser()) return
  localStorage.removeItem(STORAGE_KEY)
}

export function hasProfile(): boolean {
  return getProfile() !== null
}

// ── Mock Data Seeder ──────────────────────────────────────────────────────────

export function seedMockData(): void {
  if (!isBrowser()) return
  const existing = readStore()
  if (existing.profile !== null || Object.keys(existing.metrics).length > 0) return

  const profile: UserProfile = {
    name: 'Martin',
    age: 32,
    height_cm: 180,
    weight_kg: 84.5,
    sex: 'male',
    activity_level: 'moderate',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const metrics: Record<string, DailyMetric> = {}
  const today = new Date()

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]

    const sleepBase = i > 10 ? 7.5 : 5.8
    const sleepNoise = (Math.random() - 0.5) * 1.2
    const sleep_hours = Math.max(3, Math.round((sleepBase + sleepNoise) * 10) / 10)

    const stepsBase = i > 7 ? 9000 : 6200
    const stepsNoise = Math.floor((Math.random() - 0.5) * 2000)
    const steps = Math.max(1000, stepsBase + stepsNoise)

    const calBase = 2250
    const calNoise = Math.floor((Math.random() - 0.5) * 300)
    const calories_in = calBase + calNoise

    const weightBase = 86 - (29 - i) * 0.04
    const weightNoise = (Math.random() - 0.5) * 0.4
    const weight_kg = Math.round((weightBase + weightNoise) * 10) / 10

    metrics[dateStr] = { date: dateStr, calories_in, steps, sleep_hours, weight_kg }
  }

  writeStore({ profile, metrics, schemaVersion: SCHEMA_VERSION })
}
