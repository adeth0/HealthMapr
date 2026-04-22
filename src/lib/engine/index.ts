import type { DailyMetric, HealthStats, InsightObject, InsightSeverity, UserProfile } from '@/lib/types'
import { getTDEEFromProfile, last7Average, prev7Average } from '@/lib/health/calculations'
import { evaluateActivity } from './rules/activity'
import { evaluateCalories } from './rules/calories'
import { evaluateFatigue } from './rules/fatigue'
import { evaluateSleep } from './rules/sleep'
import { evaluateWeight } from './rules/weight'

const SEVERITY_ORDER: Record<InsightSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
  positive: 3,
}

export function generateInsights(metrics: DailyMetric[], profile: UserProfile): InsightObject[] {
  if (metrics.length === 0) return []
  const candidates: (InsightObject | null)[] = [
    evaluateFatigue(metrics, profile),
    evaluateSleep(metrics),
    evaluateCalories(metrics, profile),
    evaluateActivity(metrics),
    evaluateWeight(metrics, profile),
  ]
  return candidates
    .filter((i): i is InsightObject => i !== null)
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
}

export function computeHealthStats(metrics: DailyMetric[], profile: UserProfile): HealthStats {
  const tdee = getTDEEFromProfile(profile)
  const avgCaloriesIn7d = last7Average(metrics, 'calories_in') ?? 0
  const avgSleep7d = last7Average(metrics, 'sleep_hours') ?? 0
  const avgSteps7d = last7Average(metrics, 'steps') ?? 0

  const weightMetrics = [...metrics]
    .filter((m) => m.weight_kg !== undefined)
    .sort((a, b) => b.date.localeCompare(a.date))
  const latestWeight = weightMetrics[0]?.weight_kg ?? null

  const w7avg = last7Average(metrics, 'weight_kg')
  const wPrev = prev7Average(metrics, 'weight_kg')
  const weightChange7d = w7avg !== null && wPrev !== null
    ? Math.round((w7avg - wPrev) * 10) / 10
    : null

  const netCalorieBalance7d = Math.round(avgCaloriesIn7d - tdee)

  return { tdee, avgCaloriesIn7d, avgSleep7d, avgSteps7d, latestWeight, weightChange7d, netCalorieBalance7d }
}
