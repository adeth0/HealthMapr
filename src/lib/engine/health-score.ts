// ─────────────────────────────────────────────────────────────────────────────
// HealthMapr — Health Score Engine
//
// Produces a 0–100 composite score from the last 7 days of metrics.
// Weighted across four domains so any single bad area can't tank the whole score.
// ─────────────────────────────────────────────────────────────────────────────

import type { DailyMetric, UserProfile } from '@/lib/types'
import { getTDEEFromProfile, last7Average } from '@/lib/health/calculations'

export interface ScoreBreakdown {
  total: number           // 0–100 overall
  sleep: number           // 0–100
  activity: number        // 0–100
  nutrition: number       // 0–100
  fitness: number         // 0–100
  dataQuality: number     // 0–1, fraction of days with at least one entry
}

// ── Sub-score helpers ─────────────────────────────────────────────────────────

/** Sleep score: 8 h = 100, 6 h ≈ 62, 5 h ≈ 37, < 4 h = 0 */
function sleepScore(avgHours: number | null): number {
  if (avgHours === null) return 50 // no data → neutral
  const s = Math.round((avgHours / 8) * 100)
  return Math.min(100, Math.max(0, s))
}

/** Steps score: 10 k steps = 100, 5 k = 50, 0 = 0 */
function activityScore(avgSteps: number | null, workoutDays: number): number {
  if (avgSteps === null && workoutDays === 0) return 50 // no data → neutral
  const stepScore = avgSteps !== null ? Math.min(100, Math.round((avgSteps / 10_000) * 100)) : 40
  const workoutBonus = Math.min(20, workoutDays * 5) // up to +20 for 4 workout days
  return Math.min(100, stepScore + workoutBonus)
}

/** Nutrition score: within 200 kcal of TDEE = 100; large deficit/surplus penalised */
function nutritionScore(avgCalsIn: number | null, tdee: number): number {
  if (avgCalsIn === null) return 50
  const diff = Math.abs(avgCalsIn - tdee)
  if (diff < 200) return 100
  if (diff < 400) return 85
  if (diff < 600) return 70
  if (diff < 900) return 50
  if (diff < 1200) return 30
  return 10
}

/** Fitness score based on workout frequency and consistency */
function fitnessScore(workoutDays: number, prevWorkoutDays: number): number {
  // 4+ sessions per week = excellent
  const freqScore = Math.min(100, Math.round((workoutDays / 4) * 100))
  // Bonus for consistency (not just one big week)
  const consistencyBonus = workoutDays > 0 && prevWorkoutDays > 0 ? 10 : 0
  return Math.min(100, freqScore + consistencyBonus)
}

// ── Public API ────────────────────────────────────────────────────────────────

export function computeHealthScore(
  metrics: DailyMetric[],
  profile: UserProfile
): ScoreBreakdown {
  const sorted = [...metrics].sort((a, b) => b.date.localeCompare(a.date))
  const last7 = sorted.slice(0, 7)
  const prev7 = sorted.slice(7, 14)

  const tdee = getTDEEFromProfile(profile)
  const avgSleep   = last7Average(metrics, 'sleep_hours')
  const avgSteps   = last7Average(metrics, 'steps')
  const avgCalsIn  = last7Average(metrics, 'calories_in')

  const workoutDays     = last7.filter((m) => (m.workouts ?? []).length > 0).length
  const prevWorkoutDays = prev7.filter((m) => (m.workouts ?? []).length > 0).length

  // Data quality: fraction of last 7 days that have at least one metric logged
  const daysWithData = last7.filter((m) =>
    m.sleep_hours !== undefined ||
    m.steps       !== undefined ||
    m.calories_in !== undefined ||
    (m.workouts ?? []).length > 0
  ).length
  const dataQuality = last7.length > 0 ? daysWithData / Math.max(last7.length, 1) : 0

  const sleep     = sleepScore(avgSleep)
  const activity  = activityScore(avgSteps, workoutDays)
  const nutrition = nutritionScore(avgCalsIn, tdee)
  const fitness   = fitnessScore(workoutDays, prevWorkoutDays)

  // Weighted average: sleep 30 %, activity 25 %, nutrition 25 %, fitness 20 %
  const raw = sleep * 0.30 + activity * 0.25 + nutrition * 0.25 + fitness * 0.20

  // Scale down slightly if data quality is poor (can't score what you can't see)
  const qualityFactor = 0.6 + dataQuality * 0.4   // min 60 % weight at 0 data
  const total = Math.round(raw * qualityFactor)

  return { total, sleep, activity, nutrition, fitness, dataQuality }
}

/** Human-readable label for a score tier */
export function scoreLabel(score: number): string {
  if (score >= 85) return 'Excellent'
  if (score >= 70) return 'Good'
  if (score >= 55) return 'Fair'
  if (score >= 40) return 'Needs work'
  return 'Low'
}

/** Hex colour for a score */
export function scoreColor(score: number): string {
  if (score >= 80) return '#30D158'
  if (score >= 60) return '#64D2FF'
  if (score >= 45) return '#FFD60A'
  if (score >= 30) return '#FF9F0A'
  return '#FF453A'
}
