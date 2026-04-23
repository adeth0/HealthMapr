import { useEffect, useState } from 'react'
import type { DailyMetric, UserProfile } from '@/lib/types'
import { last7Average } from '@/lib/health/calculations'
import { getTDEEFromProfile } from '@/lib/health/calculations'

interface Props {
  metrics: DailyMetric[]
  profile: UserProfile
}

interface GoalStat {
  label: string
  current: string
  target: string
  pct: number       // 0–100
  color: string
  sub: string
}

function buildStats(metrics: DailyMetric[], profile: UserProfile): GoalStat[] {
  const goal = profile.goal ?? 'track_everything'
  const avgSleep  = last7Average(metrics, 'sleep_hours')
  const avgSteps  = last7Average(metrics, 'steps')
  const avgCals   = last7Average(metrics, 'calories_in')
  const tdee      = getTDEEFromProfile(profile)

  const sorted = [...metrics].sort((a, b) => b.date.localeCompare(a.date))
  const latestWeight = sorted.find((m) => m.weight_kg !== undefined)?.weight_kg
  const workouts7 = sorted.slice(0, 7).filter((m) => (m.workouts ?? []).length > 0).length

  const stats: GoalStat[] = []

  if (goal === 'lose_weight') {
    // Calorie deficit: target is ≤ -300 kcal/day
    const net = avgCals ? avgCals - tdee : null
    const deficitTarget = -300
    const pct = net !== null ? Math.min(100, Math.max(0, ((deficitTarget - net) / deficitTarget) * 100)) : 0
    stats.push({
      label: 'Daily deficit',
      current: net !== null ? `${net > 0 ? '+' : ''}${Math.round(net)} kcal` : '—',
      target: '−300 kcal/day',
      pct: net !== null && net <= -300 ? 100 : net !== null ? Math.min(100, Math.round((-net / 300) * 100)) : 0,
      color: '#FF9F0A',
      sub: net !== null && net <= -300 ? 'On target 🎯' : 'Reduce intake or increase activity',
    })
    // Weight trend
    const w7 = last7Average(metrics, 'weight_kg')
    const prev7 = [...metrics].sort((a, b) => b.date.localeCompare(a.date)).slice(7, 14)
    const prevAvg = prev7.length ? prev7.reduce((s, m) => s + (m.weight_kg ?? 0), 0) / prev7.filter((m) => m.weight_kg).length : null
    const delta = w7 && prevAvg ? w7 - prevAvg : null
    stats.push({
      label: 'Weekly weight change',
      current: delta !== null ? `${delta > 0 ? '+' : ''}${delta.toFixed(1)} kg` : '—',
      target: '−0.5 kg/wk',
      pct: delta !== null ? Math.min(100, Math.max(0, Math.round((1 - delta / -0.5) * 50 + 50))) : 0,
      color: '#FF9F0A',
      sub: delta !== null && delta < -0.5 ? 'Losing too fast — eat a bit more' : delta !== null && delta < 0 ? 'Healthy pace ✓' : 'Increase your deficit slightly',
    })
  }

  if (goal === 'sleep_better') {
    const pct = avgSleep ? Math.min(100, Math.round((avgSleep / 8) * 100)) : 0
    stats.push({
      label: '7-day sleep avg',
      current: avgSleep ? `${avgSleep.toFixed(1)}h` : '—',
      target: '8 h/night',
      pct,
      color: '#BF5AF2',
      sub: pct >= 90 ? 'Excellent sleep ✓' : pct >= 75 ? 'Nearly there' : 'Aim to sleep 30 min earlier',
    })
    // Consistency (% of last 7 days with sleep logged)
    const logged = sorted.slice(0, 7).filter((m) => m.sleep_hours !== undefined).length
    stats.push({
      label: 'Sleep logged',
      current: `${logged}/7 days`,
      target: '7/7 days',
      pct: Math.round((logged / 7) * 100),
      color: '#BF5AF2',
      sub: logged === 7 ? 'Perfect consistency ✓' : `Log ${7 - logged} more day${7 - logged > 1 ? 's' : ''}`,
    })
  }

  if (goal === 'move_more') {
    const pct = avgSteps ? Math.min(100, Math.round((avgSteps / 10_000) * 100)) : 0
    stats.push({
      label: '7-day step avg',
      current: avgSteps ? `${Math.round(avgSteps).toLocaleString()}` : '—',
      target: '10,000 steps',
      pct,
      color: '#30D158',
      sub: pct >= 100 ? 'Step goal crushed 🏆' : pct >= 75 ? 'Nearly there' : 'Add a short walk each day',
    })
    stats.push({
      label: 'Workout days',
      current: `${workouts7}/7`,
      target: '4+ sessions/wk',
      pct: Math.min(100, Math.round((workouts7 / 4) * 100)),
      color: '#30D158',
      sub: workouts7 >= 4 ? 'Activity goal met ✓' : `${4 - workouts7} more session${4 - workouts7 > 1 ? 's' : ''} this week`,
    })
  }

  if (goal === 'track_everything' || stats.length === 0) {
    const daysLogged = sorted.slice(0, 7).filter((m) =>
      m.sleep_hours !== undefined || m.steps !== undefined || m.calories_in !== undefined
    ).length
    stats.push({
      label: 'Days logged (7d)',
      current: `${daysLogged}/7`,
      target: '7/7 days',
      pct: Math.round((daysLogged / 7) * 100),
      color: '#0A84FF',
      sub: daysLogged === 7 ? 'Full week logged ✓' : `${7 - daysLogged} day${7 - daysLogged > 1 ? 's' : ''} remaining`,
    })
    stats.push({
      label: 'Metrics per entry',
      current: `${avgCals ? 1 : 0 + (avgSleep ? 1 : 0) + (avgSteps ? 1 : 0)}/3`,
      target: '3 metrics/day',
      pct: Math.round(((avgCals ? 1 : 0) + (avgSleep ? 1 : 0) + (avgSteps ? 1 : 0)) / 3 * 100),
      color: '#0A84FF',
      sub: 'Log sleep, steps and calories daily',
    })
  }

  return stats.slice(0, 2)
}

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  const [animated, setAnimated] = useState(0)
  useEffect(() => {
    const id = setTimeout(() => setAnimated(pct), 100)
    return () => clearTimeout(id)
  }, [pct])

  return (
    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
      <div
        className="h-full rounded-full"
        style={{
          width: `${animated}%`,
          background: color,
          boxShadow: `0 0 8px ${color}55`,
          transition: 'width 700ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      />
    </div>
  )
}

const GOAL_META: Record<string, { label: string; icon: string }> = {
  lose_weight:      { label: 'Lose weight',     icon: '🎯' },
  sleep_better:     { label: 'Sleep better',    icon: '🛌' },
  move_more:        { label: 'Move more',       icon: '🏃' },
  track_everything: { label: 'Track everything',icon: '📊' },
}

export default function GoalProgressCard({ metrics, profile }: Props) {
  const stats = buildStats(metrics, profile)
  const meta = GOAL_META[profile.goal ?? 'track_everything']

  return (
    <div
      className="rounded-3xl p-5"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderTop: '1px solid rgba(255,255,255,0.14)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <span className="text-[20px]">{meta.icon}</span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Goal Progress</p>
          <p className="text-[14px] font-bold text-white/80">{meta.label}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-col gap-4">
        {stats.map((s, i) => (
          <div key={i}>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-[12px] font-semibold text-white/55">{s.label}</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[15px] font-bold" style={{ color: s.color }}>{s.current}</span>
                <span className="text-[11px] text-white/30">/ {s.target}</span>
              </div>
            </div>
            <ProgressBar pct={s.pct} color={s.color} />
            <p className="text-[11px] text-white/35 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
