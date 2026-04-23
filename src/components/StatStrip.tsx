import { useEffect, useRef, useState } from 'react'
import type { HealthStats } from '@/lib/types'
import { formatHours, formatSteps } from '@/lib/health/calculations'

// ── Count-up hook ─────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 650, decimals = 0): number {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (target === 0) return
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3)          // easeOutCubic
      const cur = target * ease
      setValue(decimals > 0 ? cur : Math.round(cur))
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
      else setValue(target)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration, decimals])

  return value
}

// ── Colours ───────────────────────────────────────────────────────────────────

function sleepColor(h: number)    { return h >= 7 ? '#30D158' : h >= 6 ? '#FFD60A' : '#FF453A' }
function stepsColor(s: number)    { return s >= 8000 ? '#30D158' : s >= 5000 ? '#FFD60A' : '#FF453A' }
function caloriesColor(b: number) {
  if (Math.abs(b) < 200) return '#30D158'
  if (b > 0) return '#FFD60A'
  return b < -600 ? '#FF453A' : '#0A84FF'
}

// ── Stat pill ─────────────────────────────────────────────────────────────────

interface StatPillProps {
  icon: string
  label: string
  display: string
  sub?: string
  color: string
}

function StatPill({ icon, label, display, sub, color }: StatPillProps) {
  return (
    <div
      className="flex-shrink-0 rounded-2xl p-3.5 active-press"
      style={{
        background: `${color}0e`,
        border: `1px solid ${color}22`,
        borderTop: `1px solid ${color}33`,
        minWidth: 120,
        transition: 'transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-base">{icon}</span>
        <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">{label}</span>
      </div>
      <div
        className="text-[22px] font-bold leading-none tabular-nums"
        style={{ color, textShadow: `0 0 12px ${color}44` }}
      >
        {display}
      </div>
      {sub && (
        <div className="text-[11px] text-white/30 mt-1">{sub}</div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface StatStripProps {
  stats: HealthStats
}

export default function StatStrip({ stats }: StatStripProps) {
  // Animate the raw numeric values, then format after
  const animSleep   = useCountUp(stats.avgSleep7d   > 0 ? stats.avgSleep7d * 100   : 0, 700, 0)
  const animSteps   = useCountUp(stats.avgSteps7d   > 0 ? stats.avgSteps7d          : 0, 700)
  const animBalance = useCountUp(Math.abs(stats.netCalorieBalance7d), 600)
  const animWeight  = useCountUp(stats.latestWeight ? stats.latestWeight * 10 : 0, 650, 0)

  const sleepDisplay  = stats.avgSleep7d > 0 ? formatHours(animSleep / 100) : '—'
  const stepsDisplay  = stats.avgSteps7d > 0 ? formatSteps(animSteps)       : '—'
  const balanceSign   = stats.netCalorieBalance7d >= 0 ? '+' : '−'
  const balDisplay    = stats.avgCaloriesIn7d > 0 ? `${balanceSign}${animBalance}` : '—'
  const weightDisplay = stats.latestWeight ? `${(animWeight / 10).toFixed(1)} kg` : '—'
  const weightChange  = stats.weightChange7d != null
    ? `${stats.weightChange7d >= 0 ? '+' : ''}${stats.weightChange7d.toFixed(1)} kg/wk`
    : undefined

  return (
    <div className="overflow-x-auto -mx-5 px-5 scrollbar-none">
      <div className="flex gap-3 pb-1" style={{ width: 'max-content' }}>
        <StatPill
          icon="🛌" label="Sleep"
          display={sleepDisplay} sub="7-day avg"
          color={sleepColor(stats.avgSleep7d)}
        />
        <StatPill
          icon="🏃" label="Steps"
          display={stepsDisplay} sub="7-day avg"
          color={stepsColor(stats.avgSteps7d)}
        />
        <StatPill
          icon="⚡" label="Balance"
          display={balDisplay} sub="kcal vs TDEE"
          color={caloriesColor(stats.netCalorieBalance7d)}
        />
        <StatPill
          icon="⚖️" label="Weight"
          display={weightDisplay} sub={weightChange}
          color="#64D2FF"
        />
      </div>
    </div>
  )
}
