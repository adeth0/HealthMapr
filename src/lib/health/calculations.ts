import type { ActivityLevel, BiologicalSex, DailyMetric, UserProfile } from '@/lib/types'

// ── BMR (Mifflin-St Jeor) ─────────────────────────────────────────────────────

export function calculateBMR(
  weight_kg: number,
  height_cm: number,
  age: number,
  sex: BiologicalSex
): number {
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age
  return sex === 'male' ? base + 5 : base - 161
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

export function calculateTDEE(bmr: number, activity_level: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activity_level])
}

export function getTDEEFromProfile(profile: UserProfile): number {
  const bmr = calculateBMR(profile.weight_kg, profile.height_cm, profile.age, profile.sex)
  return calculateTDEE(bmr, profile.activity_level)
}

// ── Rolling Averages ──────────────────────────────────────────────────────────

export function rollingAverage(
  metrics: DailyMetric[],
  field: keyof DailyMetric
): number | null {
  const values = metrics
    .map((m) => m[field])
    .filter((v): v is number => typeof v === 'number')
  if (values.length === 0) return null
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

export function last7Average(
  metrics: DailyMetric[],
  field: keyof DailyMetric,
  n = 7
): number | null {
  const recent = [...metrics].sort((a, b) => b.date.localeCompare(a.date)).slice(0, n)
  return rollingAverage(recent, field)
}

export function prev7Average(
  metrics: DailyMetric[],
  field: keyof DailyMetric,
  n = 7
): number | null {
  const sorted = [...metrics].sort((a, b) => b.date.localeCompare(a.date))
  const prev = sorted.slice(n, n * 2)
  return rollingAverage(prev, field)
}

export function pctChange(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous === 0) return null
  return ((current - previous) / previous) * 100
}

// ── Formatters ────────────────────────────────────────────────────────────────

export function formatHours(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function formatWeight(kg: number): string {
  return `${kg.toFixed(1)} kg`
}

export function formatSteps(steps: number): string {
  return steps >= 1000 ? `${(steps / 1000).toFixed(1)}k` : steps.toString()
}

export function formatCalories(kcal: number): string {
  return `${Math.round(kcal)} kcal`
}

export function signedNumber(n: number, unit = ''): string {
  const sign = n >= 0 ? '+' : '−'
  return `${sign}${Math.abs(n).toFixed(1)}${unit}`
}
