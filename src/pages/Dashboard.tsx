import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import GradientMesh from '@/components/GradientMesh'
import Nav from '@/components/Nav'
import { InsightCard, InsightEmptyState } from '@/components/InsightCard'
import StatStrip from '@/components/StatStrip'
import LoadingSpinner from '@/components/LoadingSpinner'
import AIInsightsCard from '@/components/AIInsightsCard'
import HealthScoreRing from '@/components/HealthScoreRing'
import NextActionCard from '@/components/NextActionCard'
import ProjectionCard from '@/components/ProjectionCard'
import { generateInsights, computeHealthStats } from '@/lib/engine'
import { computeHealthScore } from '@/lib/engine/health-score'
import { getNextAction } from '@/lib/engine/next-action'
import { getProjections } from '@/lib/engine/projections'
import { getMetrics, getProfile, hasProfile, seedMockData } from '@/lib/storage'
import { checkAndNotify } from '@/lib/notifications'
import type { InsightObject, HealthStats, DailyMetric, UserProfile } from '@/lib/types'
import type { NextAction } from '@/lib/engine/next-action'
import type { HealthProjection } from '@/lib/engine/projections'
import type { ScoreBreakdown } from '@/lib/engine/health-score'

export default function Dashboard() {
  const navigate = useNavigate()
  const [insights, setInsights] = useState<InsightObject[]>([])
  const [stats, setStats] = useState<HealthStats | null>(null)
  const [profileName, setProfileName] = useState('')
  const [loading, setLoading] = useState(true)
  const [allMetrics, setAllMetrics] = useState<DailyMetric[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [nextAction, setNextAction] = useState<NextAction | null>(null)
  const [projection, setProjection] = useState<HealthProjection | null>(null)
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown | null>(null)

  useEffect(() => {
    seedMockData()
    if (!hasProfile()) {
      navigate('/setup', { replace: true })
      return
    }
    const profile = getProfile()!
    const metrics = getMetrics()
    const insights = generateInsights(metrics, profile)
    setProfileName(profile.name)
    setInsights(insights)
    setStats(computeHealthStats(metrics, profile))
    setAllMetrics(metrics)
    setUserProfile(profile)
    setNextAction(getNextAction(insights, metrics, profile))
    setProjection(getProjections(metrics, profile))
    setScoreBreakdown(computeHealthScore(metrics, profile))
    setLoading(false)
    // Fire reminder notification if conditions are met
    checkAndNotify(metrics)
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

      {/* ── Health Score Ring ── */}
      {scoreBreakdown && (
        <div className="px-5 mb-6">
          <HealthScoreRing breakdown={scoreBreakdown} />
        </div>
      )}

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

      {/* ── Next Best Action ── */}
      {nextAction && (
        <div className="px-5 mt-6">
          <NextActionCard action={nextAction} />
        </div>
      )}

      {/* ── Projections ── */}
      {projection && (
        <div className="px-5 mt-6">
          <ProjectionCard projection={projection} />
        </div>
      )}

      {/* ── AI Analysis ── */}
      {userProfile && allMetrics.length > 0 && (
        <div className="px-5 mt-6">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-[18px] font-bold text-white/80">AI Analysis</h2>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-widest"
              style={{ background: 'rgba(191,90,242,0.12)', color: '#BF5AF2', border: '1px solid rgba(191,90,242,0.22)' }}
            >
              Powered by Claude
            </span>
          </div>
          <AIInsightsCard metrics={allMetrics} profile={userProfile} />
        </div>
      )}

      {/* Quick log CTA */}
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
