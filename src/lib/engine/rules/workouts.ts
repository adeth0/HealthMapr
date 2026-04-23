import type { DailyMetric, InsightObject } from '@/lib/types'
import { formatHours } from '@/lib/health/calculations'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Total workout minutes for a given day */
function totalWorkoutMins(day: DailyMetric): number {
  return (day.workouts ?? []).reduce((s, w) => s + w.duration_min, 0)
}

/** Total workout calories burned for a given day */
function totalWorkoutCals(day: DailyMetric): number {
  return (day.workouts ?? []).reduce((s, w) => s + (w.calories ?? 0), 0)
}

/** True if the day had a hard session (>= 40 min workout or >= 300 cal burned) */
function isHardDay(day: DailyMetric): boolean {
  return totalWorkoutMins(day) >= 40 || totalWorkoutCals(day) >= 300
}

// ── Main evaluator ────────────────────────────────────────────────────────────

export function evaluateWorkouts(metrics: DailyMetric[]): InsightObject | null {
  if (!metrics.length) return null

  const recent = [...metrics]
    .filter((m) => m.workouts && m.workouts.length > 0)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 14) // last 2 weeks of workout days

  if (!recent.length) return null

  const last7Days = [...metrics]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7)

  const workoutDaysLast7 = last7Days.filter((d) => (d.workouts ?? []).length > 0).length
  const hardDaysLast7 = last7Days.filter(isHardDay).length

  // ── 1. Back-to-back hard days with poor sleep ─────────────────────────────
  // If the last 2 days were both hard AND sleep was < 7h yesterday
  const sorted = [...metrics].sort((a, b) => b.date.localeCompare(a.date))
  const yesterday = sorted[0]
  const dayBefore = sorted[1]

  if (
    yesterday &&
    dayBefore &&
    isHardDay(yesterday) &&
    isHardDay(dayBefore) &&
    yesterday.sleep_hours !== undefined &&
    yesterday.sleep_hours < 7
  ) {
    const sleepStr = formatHours(yesterday.sleep_hours)
    const workoutType = yesterday.workouts?.[0]?.type ?? 'workout'
    return {
      id: 'workout_underrecovery',
      type: 'fatigue_risk',
      severity: 'warning',
      headline: `Hard back-to-back sessions on ${sleepStr} sleep`,
      message: `You did ${workoutType} yesterday after another hard session the day before — on only ${sleepStr} of sleep. Recovery is compromised.`,
      recommendation: `Make today a rest or light movement day (walk, stretch). Sleep is the best performance enhancer you have.`,
      trend: 'declining',
      dataPoints: [
        { label: 'Sleep last night', value: sleepStr },
        { label: 'Consecutive hard days', value: '2' },
        { label: 'Action', value: 'Rest or easy active recovery' },
      ],
    }
  }

  // ── 2. High workout volume + calorie deficit ──────────────────────────────
  // Hard workout yesterday AND calories were significantly below TDEE
  if (yesterday && isHardDay(yesterday)) {
    const workoutCals = totalWorkoutCals(yesterday)
    const caloriesIn = yesterday.calories_in
    const caloriesOut = yesterday.calories_out ?? workoutCals

    if (caloriesIn && caloriesOut > 0) {
      const net = caloriesIn - caloriesOut
      if (net < -400) {
        const workoutType = yesterday.workouts?.[0]?.type ?? 'workout'
        return {
          id: 'workout_fuelling_deficit',
          type: 'energy_balance',
          severity: 'warning',
          headline: `${workoutType} day with a large calorie gap`,
          message: `Yesterday's ${workoutType} burned ~${Math.round(caloriesOut)} kcal but you only ate ${Math.round(caloriesIn)} kcal — a ${Math.abs(Math.round(net))} kcal net deficit.`,
          recommendation: `On training days, aim to eat back at least 50–70% of workout calories. A banana + protein shake post-workout would close this gap.`,
          trend: 'stable',
          dataPoints: [
            { label: 'Calories in', value: `${Math.round(caloriesIn)} kcal` },
            { label: 'Workout burn', value: `~${Math.round(caloriesOut)} kcal` },
            { label: 'Net', value: `${Math.round(net)} kcal` },
          ],
        }
      }
    }
  }

  // ── 3. Strong consistency — positive reinforcement ────────────────────────
  if (workoutDaysLast7 >= 4) {
    const types = last7Days
      .flatMap((d) => d.workouts ?? [])
      .map((w) => w.type)
      .filter((v, i, a) => a.indexOf(v) === i) // unique
      .slice(0, 3)
      .join(', ')

    return {
      id: 'workout_streak',
      type: 'positive',
      severity: 'positive',
      headline: `${workoutDaysLast7} workout days this week`,
      message: `You trained ${workoutDaysLast7} out of the last 7 days${types ? ` (${types})` : ''}. Consistency like this is where fitness gains compound.`,
      recommendation: hardDaysLast7 >= 5
        ? 'High volume week — schedule at least one full rest day before it turns into overtraining.'
        : 'Keep the pattern going. Consider logging one flexibility or mobility session.',
      trend: 'improving',
      dataPoints: [
        { label: 'Workout days (7d)', value: `${workoutDaysLast7}/7` },
        { label: 'Hard sessions', value: String(hardDaysLast7) },
      ],
    }
  }

  // ── 4. First workout after inactivity ─────────────────────────────────────
  if (workoutDaysLast7 === 1) {
    const workoutType = recent[0]?.workouts?.[0]?.type ?? 'workout'
    return {
      id: 'workout_returning',
      type: 'positive',
      severity: 'positive',
      headline: 'Back in action',
      message: `You logged a ${workoutType} this week after some time away. Starting back is the hardest part.`,
      recommendation: 'Aim for one more session in the next 3 days to build momentum.',
      trend: 'improving',
      dataPoints: [
        { label: 'Sessions this week', value: '1' },
        { label: 'Target', value: '2–3/week' },
      ],
    }
  }

  return null
}
