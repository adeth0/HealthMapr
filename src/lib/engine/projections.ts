// ─────────────────────────────────────────────────────────────────────────────
// HealthMapr — Projection Engine
//
// Projects weight, energy and fitness trends forward 7 / 30 / 90 days based on
// recent observable behaviour.  All estimates are conservative and honest —
// no inflated promises.
// ─────────────────────────────────────────────────────────────────────────────

import type { DailyMetric, UserProfile } from '@/lib/types'
import { getTDEEFromProfile } from '@/lib/health/calculations'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ProjectionTone = 'positive' | 'neutral' | 'warning'

export interface TimeframeProjection {
  summary: string      // 1-sentence human-readable forecast
  tone: ProjectionTone
}

export interface HealthProjection {
  weight: { '7d': TimeframeProjection; '30d': TimeframeProjection; '90d': TimeframeProjection }
  energy: { '7d': TimeframeProjection; '30d': TimeframeProjection; '90d': TimeframeProjection }
  fitness: { '7d': TimeframeProjection; '30d': TimeframeProjection; '90d': TimeframeProjection }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function avg(values: number[]): number | null {
  const valid = values.filter((v) => v !== undefined && !isNaN(v))
  if (!valid.length) return null
  return valid.reduce((s, v) => s + v, 0) / valid.length
}

/** kg per week based on average net calorie balance (3,500 kcal ≈ 0.45 kg) */
function weeklyWeightDelta(avgNetKcal: number): number {
  return (avgNetKcal * 7) / 7700 // 7700 kcal ≈ 1 kg fat
}

/** Rolling n-day average of a numeric field */
function rollingAvg(metrics: DailyMetric[], field: keyof DailyMetric, days: number): number | null {
  const sorted = [...metrics].sort((a, b) => b.date.localeCompare(a.date)).slice(0, days)
  const vals = sorted.map((m) => m[field] as number | undefined).filter((v): v is number => v !== undefined)
  return avg(vals)
}

/** Count workout days in last N days */
function workoutDaysIn(metrics: DailyMetric[], days: number): number {
  const sorted = [...metrics].sort((a, b) => b.date.localeCompare(a.date)).slice(0, days)
  return sorted.filter((m) => (m.workouts ?? []).length > 0).length
}

/** Average sleep over last N days */
function avgSleepIn(metrics: DailyMetric[], days: number): number | null {
  return rollingAvg(metrics, 'sleep_hours', days)
}

// ── Weight projection ─────────────────────────────────────────────────────────

function projectWeight(
  metrics: DailyMetric[],
  profile: UserProfile
): HealthProjection['weight'] {
  const tdee = getTDEEFromProfile(profile)
  const avgCalsIn7 = rollingAvg(metrics, 'calories_in', 7)
  const latestWeight = [...metrics]
    .filter((m) => m.weight_kg !== undefined)
    .sort((a, b) => b.date.localeCompare(a.date))[0]?.weight_kg

  if (!avgCalsIn7 || !latestWeight) {
    const noData: TimeframeProjection = {
      summary: 'Log your meals for a few days to unlock weight projections.',
      tone: 'neutral',
    }
    return { '7d': noData, '30d': noData, '90d': noData }
  }

  const netKcalPerDay = avgCalsIn7 - tdee
  const kgPerWeek = weeklyWeightDelta(netKcalPerDay)

  const w7  = latestWeight + kgPerWeek
  const w30 = latestWeight + kgPerWeek * (30 / 7)
  const w90 = latestWeight + kgPerWeek * (90 / 7)

  const fmt = (kg: number) => `${Math.abs(kg - latestWeight).toFixed(1)} kg`
  const dir7  = w7  < latestWeight ? 'lose' : w7  > latestWeight ? 'gain' : 'maintain'
  const dir30 = w30 < latestWeight ? 'lose' : w30 > latestWeight ? 'gain' : 'maintain'
  const dir90 = w90 < latestWeight ? 'lose' : w90 > latestWeight ? 'gain' : 'maintain'

  function tone(dir: string, delta: number): ProjectionTone {
    const abs = Math.abs(delta)
    if (dir === 'lose' && abs <= 2) return 'positive'       // healthy loss
    if (dir === 'maintain') return 'positive'                // stable
    if (dir === 'gain' && abs <= 1) return 'neutral'         // slight gain
    if (dir === 'lose' && abs > 4) return 'warning'          // losing too fast
    if (dir === 'gain' && abs > 2) return 'warning'          // gaining too fast
    return 'neutral'
  }

  function summary(dir: string, target: number, label: string): string {
    if (dir === 'maintain') return `Weight stays stable around ${latestWeight.toFixed(1)} kg over ${label}.`
    const delta = fmt(target)
    const verb = dir === 'lose' ? 'drop' : 'rise'
    const qualifier = Math.abs(target - latestWeight) > 3 && dir === 'gain'
      ? ' — consider adjusting your intake'
      : Math.abs(target - latestWeight) > 4 && dir === 'lose'
      ? ' — this rate is faster than recommended'
      : ''
    return `On track to ${verb} ~${delta} over ${label}${qualifier}.`
  }

  return {
    '7d':  { summary: summary(dir7,  w7,  '7 days'),   tone: tone(dir7,  w7  - latestWeight) },
    '30d': { summary: summary(dir30, w30, '30 days'),  tone: tone(dir30, w30 - latestWeight) },
    '90d': { summary: summary(dir90, w90, '90 days'),  tone: tone(dir90, w90 - latestWeight) },
  }
}

// ── Energy projection ─────────────────────────────────────────────────────────

function projectEnergy(metrics: DailyMetric[], profile: UserProfile): HealthProjection['energy'] {
  const tdee = getTDEEFromProfile(profile)
  const sleep7  = avgSleepIn(metrics, 7)
  const cals7   = rollingAvg(metrics, 'calories_in', 7)

  // Score energy 0–100 based on sleep and calorie adequacy
  function energyScore(sleep: number | null, cals: number | null): number {
    let score = 50
    if (sleep !== null) {
      if (sleep >= 8) score += 25
      else if (sleep >= 7) score += 15
      else if (sleep >= 6) score += 0
      else score -= 20
    }
    if (cals !== null) {
      const ratio = cals / tdee
      if (ratio >= 0.9 && ratio <= 1.15) score += 25
      else if (ratio >= 0.75) score += 10
      else score -= 15
    }
    return Math.min(100, Math.max(0, score))
  }

  const currentScore = energyScore(sleep7, cals7)

  function energySummary(score: number, frame: string): TimeframeProjection {
    if (score >= 75) return { summary: `Energy levels look strong — expect to feel consistently fuelled over ${frame}.`, tone: 'positive' }
    if (score >= 55) return { summary: `Moderate energy expected over ${frame}. A bit more sleep would make a noticeable difference.`, tone: 'neutral' }
    if (score >= 35) return { summary: `Energy is likely to stay low over ${frame} unless sleep or nutrition improves.`, tone: 'warning' }
    return { summary: `Fatigue risk is high over ${frame} — address sleep and calorie intake to reverse this.`, tone: 'warning' }
  }

  return {
    '7d':  energySummary(currentScore, '7 days'),
    '30d': energySummary(currentScore, '30 days'),
    '90d': score90Energy(currentScore, metrics, profile),
  }
}

function score90Energy(
  currentScore: number,
  metrics: DailyMetric[],
  _profile: UserProfile
): TimeframeProjection {
  const sleep30 = avgSleepIn(metrics, 30) ?? avgSleepIn(metrics, 7)
  const trend = sleep30 !== null && sleep30 >= 7 ? 'improving' : 'flat'

  if (trend === 'improving' && currentScore >= 55) {
    return { summary: 'At this pace, energy levels should stabilise above your current baseline by 90 days.', tone: 'positive' }
  }
  if (currentScore < 40) {
    return { summary: 'Chronic low energy likely over 90 days unless sleep or diet changes are made soon.', tone: 'warning' }
  }
  return { summary: 'Energy will remain moderate over 90 days — small, consistent sleep improvements will compound noticeably.', tone: 'neutral' }
}

// ── Fitness projection ────────────────────────────────────────────────────────

function projectFitness(metrics: DailyMetric[]): HealthProjection['fitness'] {
  const workouts7  = workoutDaysIn(metrics, 7)
  const workouts14 = workoutDaysIn(metrics, 14)
  const steps7     = rollingAvg(metrics, 'steps', 7)

  // Extrapolate consistency
  const sessionsPerWeek = workouts7        // last 7 days is a reasonable sample

  function fitnessSummary(sessions: number, frame: string, days: number): TimeframeProjection {
    const totalProjected = Math.round(sessions * (days / 7))
    if (sessions >= 4) {
      return {
        summary: `${totalProjected}+ sessions projected over ${frame} — at this consistency you'll see measurable fitness gains.`,
        tone: 'positive',
      }
    }
    if (sessions >= 2) {
      return {
        summary: `~${totalProjected} sessions projected over ${frame} — solid maintenance, though 3+ weekly sessions unlock faster gains.`,
        tone: 'neutral',
      }
    }
    if (sessions === 1) {
      return {
        summary: `Current pace projects only ~${totalProjected} sessions over ${frame}. Building to 2–3/week would shift the trajectory.`,
        tone: 'neutral',
      }
    }
    return {
      summary: `No workout activity logged recently — fitness will decline over ${frame} without consistent movement.`,
      tone: 'warning',
    }
  }

  const step7Summary: TimeframeProjection | null = steps7 !== null
    ? steps7 >= 8000
      ? { summary: 'Strong daily step count — your aerobic base is being maintained.', tone: 'positive' }
      : steps7 >= 5000
      ? { summary: 'Moderate daily movement — adding 2,000 steps/day would meaningfully improve your base fitness.', tone: 'neutral' }
      : { summary: 'Low daily steps are reducing your aerobic base over time.', tone: 'warning' }
    : null

  // For 90d, consider whether trend is improving (more workouts in last 7 vs prior 7)
  const prev7Workouts = workouts14 - workouts7
  const trending = workouts7 >= prev7Workouts

  const fitness90: TimeframeProjection = (() => {
    if (sessionsPerWeek >= 3 && trending) {
      return { summary: 'On track for a meaningful fitness improvement by 90 days — consistency at this level compounds powerfully.', tone: 'positive' }
    }
    if (sessionsPerWeek >= 2) {
      return { summary: '90-day outlook is solid maintenance — ramping to 3 sessions/week would add clear performance gains.', tone: 'neutral' }
    }
    return { summary: 'At current activity levels, expect fitness to stay flat or gently decline by 90 days.', tone: 'warning' }
  })()

  return {
    '7d':  step7Summary ?? fitnessSummary(sessionsPerWeek, '7 days', 7),
    '30d': fitnessSummary(sessionsPerWeek, '30 days', 30),
    '90d': fitness90,
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export function getProjections(
  metrics: DailyMetric[],
  profile: UserProfile
): HealthProjection | null {
  if (metrics.length < 3) return null // need at least a few days of data

  return {
    weight:  projectWeight(metrics, profile),
    energy:  projectEnergy(metrics, profile),
    fitness: projectFitness(metrics),
  }
}
