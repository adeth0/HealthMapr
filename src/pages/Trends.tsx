import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GradientMesh from '@/components/GradientMesh'
import Nav from '@/components/Nav'
import SparkChart from '@/components/SparkChart'
import LoadingSpinner from '@/components/LoadingSpinner'
import { getRecentMetrics, hasProfile, seedMockData } from '@/lib/storage'
import { formatHours, formatSteps } from '@/lib/health/calculations'
import type { DailyMetric } from '@/lib/types'

export default function Trends() {
  const navigate = useNavigate()
  const [metrics, setMetrics] = useState<DailyMetric[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    seedMockData()
    if (!hasProfile()) { navigate('/setup', { replace: true }); return }
    setMetrics(getRecentMetrics(30))
    setLoading(false)
  }, [navigate])

  if (loading) return <LoadingSpinner fullScreen />

  return (
    <div className="min-h-dvh pb-32">
      <GradientMesh />

      {/* ── Header ── */}
      <div
        className="px-5 pb-6"
        style={{ paddingTop: 'max(24px, calc(var(--safe-top) + 16px))' }}
      >
        <p className="text-[13px] text-white/35 mb-1">Last 30 days</p>
        <h1 className="text-[28px] font-black text-white/95" style={{ letterSpacing: '-0.02em' }}>
          Trends
        </h1>
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
        />
        <SparkChart
          data={metrics}
          field="steps"
          color="#30D158"
          label="Steps"
          icon="🏃"
          formatter={(v) => formatSteps(Math.round(v))}
        />
        <SparkChart
          data={metrics}
          field="calories_in"
          color="#FFD60A"
          label="Calories"
          icon="⚡"
          formatter={(v) => `${Math.round(v)} kcal`}
        />
        <SparkChart
          data={metrics}
          field="weight_kg"
          color="#64D2FF"
          label="Weight"
          icon="⚖️"
          formatter={(v) => `${v.toFixed(1)} kg`}
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
