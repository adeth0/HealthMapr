import type { DailyMetric, HealthGoal, HealthStats, InsightObject, InsightSeverity, UserProfile } from '@/lib/types'
import { getTDEEFromProfile, last7Average, prev7Average } from '@/lib/health/calculations'
import { evaluateActivity } from './rules/activity'
import { evaluateCalories } from './rules/calories'
import { evaluateFatigue } from './rules/fatigue'
import { evaluateSleep } from './rules/sleep'
import { evaluateWeight } from './rules/weight'
import { evaluateWorkouts } from './rules/workouts'

const SEVERITY_ORDER: Record<InsightSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
  positive: 3,
}

// Insight types that each goal should surface first
const GOAL_PRIORITY: Record<HealthGoal, string[]> = {
  lose_weight:      ['energy_balance', 'weight_trend', 'workout_fuelling_deficit'],
  sleep_better:     ['sleep_quality', 'sleep_debt', 'fatigue_risk', 'workout_underrecovery'],
  move_more:        ['activity', 'workout_streak', 'workout_returning', 'fatigue_risk'],
  track_everything: [], // no bias — show highest severity across all domains
}

function goalBoost(insight: InsightObject, goal: HealthGoal | undefined): number {
  if (!goal) return 0
  const priorityTypes = GOAL_PRIORITY[goal]
  // Match on insight.type OR insight.id
  const match = priorityTypes.some(
    (p) => insight.type?.includes(p) || insight.id?.includes(p)
  )
  return match ? -0.5 : 0 // shift matching insights earlier (lower sort value = higher rank)
}

export function generateInsights(metrics: DailyMetric[], profile: UserProfile): InsightObject[] {
  if (metrics.length === 0) return []

  const candidates: (InsightObject | null)[] = [
    evaluateFatigue(metrics, profile),
    evaluateSleep(metrics),
    evaluateCalories(metrics, profile),
    evaluateActivity(metrics),
    evaluateWeight(metrics, profile),
    evaluateWorkouts(metrics),
  ]

  const all = candidates.filter((i): i is InsightObject => i !== null)

  // Sort: severity first, then goal-priority boost, then positives last
  const sorted = all.sort((a, b) => {
    const severityDiff =
      (SEVERITY_ORDER[a.severity] + goalBoost(a, profile.goal)) -
      (SEVERITY_ORDER[b.severity] + goalBoost(b, profile.goal))
    return severityDiff
  })

  // If there are any critical/warning insights, drop excess positives (keep at most 1)
  const hasUrgent = sorted.some(
    (i) => i.severity === 'critical' || i.severity === 'warning'
  )
  const filtered = hasUrgent
    ? (() => {
        let positiveCount = 0
        return sorted.filter((i) => {
          if (i.severity === 'positive') {
            positiveCount++
            return positiveCount <= 1
          }
          return true
        })
      })()
    : sorted

  // Hard cap at 3 insights
  return filtered.slice(0, 3)
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
