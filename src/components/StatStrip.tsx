import type { HealthStats } from '@/lib/types'
import { formatHours, formatSteps } from '@/lib/health/calculations'

interface StatStripProps {
  stats: HealthStats
}

function getSlColor(hours: number) {
  if (hours < 6) return '#FF453A'
  if (hours < 7) return '#FFD60A'
  return '#30D158'
}

function getStepsColor(steps: number) {
  if (steps < 5000) return '#FF453A'
  if (steps < 7500) return '#FFD60A'
  return '#30D158'
}

function getCaloriesColor(balance: number) {
  if (Math.abs(balance) < 150) return '#30D158'
  if (balance > 0) return '#FFD60A'
  if (balance < -500) return '#FF453A'
  return '#0A84FF'
}

interface StatPillProps {
  icon: string
  label: string
  value: string
  sub?: string
  color: string
  className?: string
}

function StatPill({ icon, label, value, sub, color, className = '' }: StatPillProps) {
  return (
    <div
      className={`flex-shrink-0 rounded-2xl p-3.5 ${className}`}
      style={{
        background: `${color}10`,
        border: `1px solid ${color}22`,
        minWidth: 120,
      }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-base">{icon}</span>
        <span className="text-[11px] font-semibold text-white/45 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-[22px] font-bold leading-none" style={{ color }}>
        {value}
      </div>
      {sub && (
        <div className="text-[11px] text-white/35 mt-1">{sub}</div>
      )}
    </div>
  )
}

export default function StatStrip({ stats }: StatStripProps) {
  const balSign = stats.netCalorieBalance7d >= 0 ? '+' : ''
  const weightStr = stats.latestWeight ? `${stats.latestWeight.toFixed(1)} kg` : '—'
  const weightChange = stats.weightChange7d != null
    ? `${stats.weightChange7d >= 0 ? '+' : ''}${stats.weightChange7d.toFixed(1)} kg/wk`
    : undefined

  return (
    <div className="overflow-x-auto -mx-5 px-5 scrollbar-none">
      <div className="flex gap-3 pb-1" style={{ width: 'max-content' }}>
        <StatPill
          icon="🛌"
          label="Sleep"
          value={stats.avgSleep7d > 0 ? formatHours(stats.avgSleep7d) : '—'}
          sub="7-day avg"
          color={getSlColor(stats.avgSleep7d)}
        />
        <StatPill
          icon="🏃"
          label="Steps"
          value={stats.avgSteps7d > 0 ? formatSteps(Math.round(stats.avgSteps7d)) : '—'}
          sub="7-day avg"
          color={getStepsColor(stats.avgSteps7d)}
        />
        <StatPill
          icon="⚡"
          label="Balance"
          value={stats.avgCaloriesIn7d > 0 ? `${balSign}${stats.netCalorieBalance7d}` : '—'}
          sub="kcal vs TDEE"
          color={getCaloriesColor(stats.netCalorieBalance7d)}
        />
        <StatPill
          icon="⚖️"
          label="Weight"
          value={weightStr}
          sub={weightChange}
          color="#64D2FF"
        />
      </div>
    </div>
  )
}
