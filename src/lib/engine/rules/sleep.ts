import type { DailyMetric, InsightObject } from '@/lib/types'
import { formatHours, last7Average, prev7Average } from '@/lib/health/calculations'

export function evaluateSleep(metrics: DailyMetric[]): InsightObject | null {
  const avg7 = last7Average(metrics, 'sleep_hours')
  const avg_prev = prev7Average(metrics, 'sleep_hours')
  if (avg7 === null) return null
  const formatted = formatHours(avg7)
  const prevFormatted = avg_prev !== null ? formatHours(avg_prev) : null

  if (avg7 < 6) {
    const deficit = 7.5 - avg7
    return {
      id: 'sleep_critical', type: 'recovery', severity: 'critical',
      headline: 'Recovery is significantly impaired',
      message: `You're averaging ${formatted} of sleep — well below the 7–9h recommended. Cognitive performance, metabolism, and muscle recovery are all affected.`,
      recommendation: `Aim to add ${formatHours(deficit)} per night. Start by moving bedtime 30 minutes earlier for 3 days.`,
      trend: avg_prev !== null && avg7 < avg_prev ? 'declining' : 'stable',
      dataPoints: [
        { label: '7-day avg sleep', value: formatted },
        ...(prevFormatted ? [{ label: 'Prior 7-day avg', value: prevFormatted }] : []),
        { label: 'Recommended', value: '7–9h' },
        { label: 'Deficit', value: formatHours(deficit) + '/night' },
      ],
    }
  }

  if (avg7 < 7) {
    const isTrending = avg_prev !== null && avg7 < avg_prev - 0.25
    return {
      id: 'sleep_warning', type: 'recovery', severity: 'warning',
      headline: isTrending ? 'Sleep is declining — recovery at risk' : 'Sleep is below optimal',
      message: `You're averaging ${formatted} over the last 7 days. Just below the threshold where recovery and focus are noticeably affected.`,
      recommendation: `Try to add 30–45 minutes per night. Consistent sleep times matter more than total hours.`,
      trend: isTrending ? 'declining' : 'stable',
      dataPoints: [
        { label: '7-day avg sleep', value: formatted },
        ...(prevFormatted ? [{ label: 'Prior 7-day avg', value: prevFormatted }] : []),
        { label: 'Recommended', value: '7–9h' },
      ],
    }
  }

  if (avg7 >= 7.5) {
    return {
      id: 'sleep_positive', type: 'positive', severity: 'positive',
      headline: 'Recovery is strong',
      message: `You're averaging ${formatted} — your body has the time it needs to repair, consolidate memory, and regulate hormones.`,
      recommendation: 'Keep your current sleep schedule. Consistency is key.',
      trend: 'stable',
      dataPoints: [
        { label: '7-day avg sleep', value: formatted },
        { label: 'Status', value: 'Optimal' },
      ],
    }
  }

  return null
}
