import type { DailyMetric, InsightObject, UserProfile } from '@/lib/types'
import { formatCalories, formatHours, getTDEEFromProfile, last7Average } from '@/lib/health/calculations'

export function evaluateFatigue(metrics: DailyMetric[], profile: UserProfile): InsightObject | null {
  const avgSleep = last7Average(metrics, 'sleep_hours')
  const avgCalIn = last7Average(metrics, 'calories_in')
  const avgSteps = last7Average(metrics, 'steps')
  if (avgSleep === null || avgCalIn === null) return null

  const tdee = getTDEEFromProfile(profile)
  const deficit = tdee - avgCalIn
  const deficitPct = (deficit / tdee) * 100
  const lowSleep = avgSleep < 6.5
  const largeDeficit = deficitPct > 20
  const activeEnough = avgSteps !== null && avgSteps > 7000
  const riskCount = [lowSleep, largeDeficit, activeEnough].filter(Boolean).length

  if (riskCount >= 2) {
    const severity = riskCount === 3 ? 'critical' : 'warning'
    const factors: string[] = []
    if (lowSleep) factors.push(`${formatHours(avgSleep)} sleep`)
    if (largeDeficit) factors.push(`${Math.round(deficitPct)}% calorie deficit`)
    if (activeEnough) factors.push(`${Math.round(avgSteps!).toLocaleString()} steps/day`)

    return {
      id: 'fatigue_risk', type: 'fatigue_risk', severity,
      headline: severity === 'critical' ? 'High fatigue risk — action needed' : 'Fatigue risk building',
      message: `You're combining ${factors.join(', ')}. This combination will accelerate fatigue and impair recovery.`,
      recommendation: severity === 'critical'
        ? 'Take an active rest day today. Eat at maintenance, sleep 8+ hours.'
        : 'Add at least one rest day this week and bump calories by 150–200 kcal.',
      trend: 'declining',
      dataPoints: [
        { label: 'Avg sleep', value: formatHours(avgSleep) },
        { label: 'Calorie deficit', value: formatCalories(deficit) + '/day' },
        ...(avgSteps ? [{ label: 'Daily steps', value: `${Math.round(avgSteps).toLocaleString()}` }] : []),
        { label: 'Risk level', value: severity === 'critical' ? 'High' : 'Moderate' },
      ],
    }
  }

  return null
}
