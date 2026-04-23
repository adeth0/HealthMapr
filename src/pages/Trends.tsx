import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GradientMesh from '@/components/GradientMesh'
import Nav from '@/components/Nav'
import SparkChart from '@/components/SparkChart'
import LoadingSpinner from '@/components/LoadingSpinner'
import { getRecentMetrics, hasProfile, seedMockData } from '@/lib/storage'
import { formatHours, formatSteps, rollingAverage, computeTrend } from '@/lib/health/calculations'
import type { DailyMetric } from '@/lib/types'

type Range = 7 | 14 | 30

const RANGES: { label: string; value: Range }[] = [
  { label: '7d', value: 7 },
  { label: '14d', value: 14 },
  { label: '30d', value: 30 },
]

function periodAvg(metrics: DailyMetric[], field: keyof DailyMetric): number | null {
  return rollingAverage(metrics, field)
}

function periodTrend(metrics: DailyMetric[], field: keyof DailyMetric): 'up' | 'down' | 'flat' {
  const values = metrics
    .map((m) => m[field])
    .filter((v): v is number => typeof v === 'number')
  return computeTrend(values)
}

export default function Trends() {
  const navigate = useNavigate()
  const [allMetrics, setAllMetrics] = useState<DailyMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<Range>(7)

  useEffect(() => {
    seedMockData()
    if (!hasProfile()) { navigate('/setup', { replace: true }); return }
    setAllMetrics(getRecentMetrics(30))
    setLoading(false)
  }, [navigate])

  // Slice to selected range whenever range changes
  const metrics = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - range + 1)
    const cutoffStr = cutoff.toISOString().split('T')[0]
    return allMetrics.filter((m) => m.date >= cutoffStr)
  }, [allMetrics, range])

  // Pre-compute per-metric avg + trend so each SparkChart gets static props
  const stats = useMemo(() => ({
    sleep: {
      avg: periodAvg(metrics, 'sleep_hours'),
      trend: periodTrend(metrics, 'sleep_hours'),
    },
    steps: {
      avg: periodAvg(metrics, 'steps'),
      trend: periodTrend(metrics, 'steps'),
    },
    calories: {
      avg: periodAvg(metrics, 'calories_in'),
      trend: periodTrend(metrics, 'calories_in'),
    },
    weight: {
      avg: periodAvg(metrics, 'weight_kg'),
      trend: periodTrend(metrics, 'weight_kg'),
    },
  }), [metrics])

  if (loading) return <LoadingSpinner fullScreen />

  return (
    <div className="min-h-dvh pb-32">
      <GradientMesh />

      {/* ── Header ── */}
      <div
        className="px-5 pb-4"
        style={{ paddingTop: 'max(24px, calc(var(--safe-top) + 16px))' }}
      >
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-[13px] text-white/35 mb-1">Your progress</p>
            <h1 className="text-[28px] font-black text-white/95" style={{ letterSpacing: '-0.02em' }}>
              Trends
            </h1>
          </div>

          {/* Range toggle */}
          <div
            className="flex items-center rounded-2xl p-1 gap-1"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}
          >
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className="px-3 py-1.5 rounded-xl text-[13px] font-bold transition-all"
                style={range === r.value
                  ? { background: '#0A84FF', color: '#fff', boxShadow: '0 2px 8px rgba(10,132,255,0.4)' }
                  : { color: 'rgba(255,255,255,0.40)' }
                }
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Charts ── */}
      <div className="px-5 flex flex-col gap-4">
        <SparkChart
          data={metrics}
          field="sleep_hours"
          color="#BF5AF2"
          label="Sleep"
          icon="🛌"
          formatter={(v) => formatHours(v)}
          avg={stats.sleep.avg !== null ? formatHours(stats.sleep.avg) : undefined}
          trend={stats.sleep.trend}
        />
        <SparkChart
          data={metrics}
          field="steps"
          color="#30D158"
          label="Steps"
          icon="🏃"
          formatter={(v) => formatSteps(Math.round(v))}
          avg={stats.steps.avg !== null ? formatSteps(Math.round(stats.steps.avg)) : undefined}
          trend={stats.steps.trend}
        />
        <SparkChart
          data={metrics}
          field="calories_in"
          color="#FFD60A"
          label="Calories"
          icon="⚡"
          formatter={(v) => `${Math.round(v)} kcal`}
          avg={stats.calories.avg !== null ? `${Math.round(stats.calories.avg)} kcal` : undefined}
          trend={stats.calories.trend}
        />
        <SparkChart
          data={metrics}
          field="weight_kg"
          color="#64D2FF"
          label="Weight"
          icon="⚖️"
          formatter={(v) => `${v.toFixed(1)} kg`}
          avg={stats.weight.avg !== null ? `${stats.weight.avg.toFixed(1)} kg` : undefined}
          trend={stats.weight.trend}
        />
      </div>

      {/* ── No data message ── */}
      {metrics.length < 3 && (
        <div className="px-5 mt-6">
          <div
            className="rounded-2xl p-4 text-center"
            style={{ background: 'rgba(10,132,255,0.08)', border: '1px solid rgba(10,132,255,0.18)' }}
          >
            <p className="text-[14px] text-white/60">
              Log at least 3 days of data to see trends
            </p>
          </div>
        </div>
      )}

      <Nav />
    </div>
  )
}
