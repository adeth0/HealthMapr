import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import GradientMesh from '@/components/GradientMesh'
import Nav from '@/components/Nav'
import { InsightCard, InsightEmptyState } from '@/components/InsightCard'
import StatStrip from '@/components/StatStrip'
import LoadingSpinner from '@/components/LoadingSpinner'
import { generateInsights, computeHealthStats } from '@/lib/engine'
import { getMetrics, getProfile, hasProfile, seedMockData } from '@/lib/storage'
import type { InsightObject, HealthStats } from '@/lib/types'

export default function Dashboard() {
  const navigate = useNavigate()
  const [insights, setInsights] = useState<InsightObject[]>([])
  const [stats, setStats] = useState<HealthStats | null>(null)
  const [profileName, setProfileName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    seedMockData()
    if (!hasProfile()) {
      navigate('/setup', { replace: true })
      return
    }
    const profile = getProfile()!
    const metrics = getMetrics()
    setProfileName(profile.name)
    setInsights(generateInsights(metrics, profile))
    setStats(computeHealthStats(metrics, profile))
    setLoading(false)
  }, [navigate])

  const greeting = useMemo(() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }, [])

  const today = useMemo(
    () =>
      new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
    []
  )

  if (loading) return <LoadingSpinner fullScreen />

  return (
    <div className="min-h-dvh pb-32">
      <GradientMesh />

      {/* ── Header ── */}
      <div
        className="px-5 pt-6 pb-5"
        style={{ paddingTop: 'max(24px, calc(var(--safe-top) + 16px))' }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[13px] text-white/40 mb-0.5">{today}</p>
            <h1 className="text-[28px] font-black text-white/95 leading-tight" style={{ letterSpacing: '-0.02em' }}>
              {greeting},<br />
              <span className="text-gradient">{profileName || 'there'}</span>
            </h1>
          </div>
          <Link
            to="/profile"
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 mt-1"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderTop: '1px solid rgba(255,255,255,0.16)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="6" r="3" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
              <path d="M2 16c0-3.5 3-5 7-5s7 1.5 7 5" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </Link>
        </div>

        {/* Stat Strip */}
        {stats && <StatStrip stats={stats} />}
      </div>

      {/* ── Insights ── */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[18px] font-bold text-white/80">
            Today's Insights
          </h2>
          <span
            className="text-[12px] font-bold px-2.5 py-1 rounded-xl"
            style={{
              background: 'rgba(10,132,255,0.12)',
              color: '#0A84FF',
              border: '1px solid rgba(10,132,255,0.20)',
            }}
          >
            {insights.length} active
          </span>
        </div>

        {insights.length > 0 ? (
          <div className="flex flex-col gap-3">
            {insights.map((insight, i) => (
              <InsightCard key={insight.id} insight={insight} index={i} />
            ))}
          </div>
        ) : (
          <InsightEmptyState />
        )}
      </div>

      {/* Quick log CTA when no recent data */}
      <div className="px-5 mt-6">
        <Link
          to="/log"
          className="w-full flex items-center justify-between p-4 rounded-2xl"
          style={{
            background: 'rgba(10,132,255,0.08)',
            border: '1px solid rgba(10,132,255,0.18)',
          }}
        >
          <div>
            <div className="text-[14px] font-bold text-white/80">Log today's data</div>
            <div className="text-[12px] text-white/40 mt-0.5">Keep your insights accurate</div>
          </div>
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: '#0A84FF' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2v10M2 7h10" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </Link>
      </div>

      <Nav />
    </div>
  )
}
