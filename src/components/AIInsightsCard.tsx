import { useState, useEffect, useCallback } from 'react'
import type { DailyMetric, UserProfile } from '@/lib/types'
import { fetchAIAnalysis, clearAICache, type AIAnalysis, type AIStatus } from '@/lib/ai'

// ── Health score ring ─────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 36
  const circ = 2 * Math.PI * r
  const progress = (score / 100) * circ
  const color = score >= 75 ? '#30D158' : score >= 50 ? '#FFD60A' : '#FF453A'

  return (
    <div className="relative flex items-center justify-center" style={{ width: 96, height: 96 }}>
      <svg width="96" height="96" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6" />
        <circle
          cx="48" cy="48" r={r} fill="none"
          stroke={color} strokeWidth="6"
          strokeDasharray={`${progress} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.34,1.56,0.64,1)', filter: `drop-shadow(0 0 6px ${color}60)` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-[26px] font-black leading-none" style={{ color }}>{score}</span>
        <span className="text-[9px] font-bold uppercase tracking-widest text-white/35 mt-0.5">score</span>
      </div>
    </div>
  )
}

// ── Insight row ───────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  warning: { color: '#FFD60A', bg: 'rgba(255,214,10,0.08)', border: 'rgba(255,214,10,0.20)', icon: '⚠️' },
  positive: { color: '#30D158', bg: 'rgba(48,209,88,0.08)', border: 'rgba(48,209,88,0.20)', icon: '✅' },
  info: { color: '#0A84FF', bg: 'rgba(10,132,255,0.08)', border: 'rgba(10,132,255,0.20)', icon: 'ℹ️' },
}

function InsightRow({ insight, index }: { insight: AIAnalysis['insights'][0]; index: number }) {
  const [open, setOpen] = useState(false)
  const cfg = TYPE_CONFIG[insight.type] ?? TYPE_CONFIG.info
  const delayClass = ['stagger-1','stagger-2','stagger-3','stagger-4'][Math.min(index, 3)]

  return (
    <div
      className={`rounded-2xl overflow-hidden animate-slide-up ${delayClass} cursor-pointer transition-all`}
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
      onClick={() => setOpen(!open)}
    >
      <div className="p-3.5 flex items-start gap-3">
        <span className="text-base mt-0.5 flex-shrink-0">{cfg.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-bold text-white/88 leading-snug">{insight.title}</div>
          <div className={`text-[12px] text-white/50 mt-0.5 leading-relaxed transition-all ${open ? '' : 'line-clamp-1'}`}>
            {insight.description}
          </div>
          {open && (
            <div className="mt-2.5 space-y-2 animate-fade-in">
              <div className="rounded-xl p-2.5" style={{ background: 'rgba(0,0,0,0.2)' }}>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Impact</span>
                <p className="text-[12px] text-white/65 mt-0.5">{insight.impact}</p>
              </div>
              <div className="rounded-xl p-2.5" style={{ background: `${cfg.color}10`, border: `1px solid ${cfg.color}20` }}>
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: cfg.color }}>Action</span>
                <p className="text-[12px] text-white/80 mt-0.5 font-medium">{insight.action}</p>
              </div>
            </div>
          )}
        </div>
        <div
          className="flex-shrink-0 w-5 h-5 flex items-center justify-center transition-transform duration-300 mt-0.5"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
            <path d="M1 1L5 5L9 1" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </div>
  )
}

// ── Projection row ────────────────────────────────────────────────────────────

function Projections({ proj }: { proj: AIAnalysis['future_projection'] }) {
  const items = [
    { label: '7 days', value: proj['7_days'], color: '#64D2FF' },
    { label: '30 days', value: proj['30_days'], color: '#BF5AF2' },
    { label: '90 days', value: proj['90_days'], color: '#30D158' },
  ]
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.label} className="flex gap-3">
          <div
            className="flex-shrink-0 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg mt-0.5 whitespace-nowrap"
            style={{ color: item.color, background: `${item.color}14`, border: `1px solid ${item.color}22` }}
          >
            {item.label}
          </div>
          <p className="text-[13px] text-white/60 leading-relaxed">{item.value}</p>
        </div>
      ))}
    </div>
  )
}

// ── Skeleton loader ───────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-24 h-24 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="flex-1 space-y-2">
          <div className="h-4 rounded-lg w-3/4" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="h-3 rounded-lg w-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
          <div className="h-3 rounded-lg w-2/3" style={{ background: 'rgba(255,255,255,0.04)' }} />
        </div>
      </div>
      {[1,2,3].map(i => (
        <div key={i} className="h-12 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface AIInsightsCardProps {
  metrics: DailyMetric[]
  profile: UserProfile
}

export default function AIInsightsCard({ metrics, profile }: AIInsightsCardProps) {
  const [status, setStatus] = useState<AIStatus>('idle')
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [error, setError] = useState<string>('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const load = useCallback(async (force = false) => {
    setStatus('loading')
    setError('')
    try {
      const data = await fetchAIAnalysis(metrics, profile, force)
      setAnalysis(data)
      setLastUpdated(new Date())
      setStatus('success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      if (msg === 'UNCONFIGURED') {
        setStatus('unconfigured')
      } else {
        setError(msg)
        setStatus('error')
      }
    }
  }, [metrics, profile])

  // Auto-load on mount
  useEffect(() => { load() }, [load])

  // ── Unconfigured state ──
  if (status === 'unconfigured') {
    return (
      <div
        className="glass-card p-5"
        style={{ border: '1px solid rgba(10,132,255,0.18)', background: 'rgba(10,132,255,0.06)' }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl"
            style={{ background: 'rgba(10,132,255,0.15)', border: '1px solid rgba(10,132,255,0.25)' }}
          >
            🤖
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-white/88 mb-1">AI Analysis not yet configured</h3>
            <p className="text-[12px] text-white/45 leading-relaxed mb-3">
              Connect Supabase to unlock AI-powered health scoring, personalised projections, and action recommendations.
            </p>
            <a
              href="https://github.com/adeth0/HealthMapr/blob/main/SETUP_GUIDE.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] font-bold text-[#0A84FF]"
            >
              Setup guide →
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="glass-card p-5 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(10,132,255,0.07), rgba(191,90,242,0.05))',
        border: '1px solid rgba(10,132,255,0.18)',
        borderTop: '1px solid rgba(10,132,255,0.28)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center text-sm"
            style={{ background: 'linear-gradient(135deg, #0A84FF, #BF5AF2)' }}
          >
            ✦
          </div>
          <span className="text-[13px] font-bold text-white/70">AI Analysis</span>
          {status === 'success' && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
              style={{ background: 'rgba(48,209,88,0.12)', color: '#30D158', border: '1px solid rgba(48,209,88,0.2)' }}
            >
              LIVE
            </span>
          )}
        </div>
        {status === 'success' && (
          <button
            onClick={() => { clearAICache(); load(true) }}
            className="text-[11px] text-white/30 hover:text-white/60 transition-colors"
            title="Refresh analysis"
          >
            ↻ refresh
          </button>
        )}
      </div>

      {/* Loading */}
      {status === 'loading' && (
        <div>
          <Skeleton />
          <p className="text-[11px] text-white/25 text-center mt-4 animate-pulse-soft">
            Analysing your last 7 days…
          </p>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="text-center py-6">
          <div className="text-2xl mb-2">⚠️</div>
          <p className="text-[13px] text-white/55 mb-1">AI analysis unavailable</p>
          <p className="text-[11px] text-white/30 mb-4">{error}</p>
          <button
            onClick={() => load(true)}
            className="text-[12px] font-bold text-[#0A84FF] hover:text-[#5AA8FF] transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {/* Success */}
      {status === 'success' && analysis && (
        <div className="space-y-5">
          {/* Score + summary */}
          <div className="flex items-center gap-4">
            <ScoreRing score={analysis.health_score} />
            <div className="flex-1">
              <p className="text-[14px] text-white/75 leading-relaxed">{analysis.summary}</p>
              {lastUpdated && (
                <p className="text-[10px] text-white/25 mt-1.5">
                  Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </div>

          {/* Next best action */}
          <div
            className="rounded-2xl p-3.5 flex items-start gap-3"
            style={{
              background: 'linear-gradient(135deg, rgba(10,132,255,0.14), rgba(191,90,242,0.10))',
              border: '1px solid rgba(10,132,255,0.25)',
            }}
          >
            <span className="text-lg flex-shrink-0">🎯</span>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-0.5">Next best action</div>
              <p className="text-[13px] font-semibold text-white/85">{analysis.next_best_action}</p>
            </div>
          </div>

          {/* Insights */}
          {analysis.insights.length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-1">Insights</div>
              {analysis.insights.map((insight, i) => (
                <InsightRow key={i} insight={insight} index={i} />
              ))}
            </div>
          )}

          {/* Projections */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-2.5">Projections</div>
            <Projections proj={analysis.future_projection} />
          </div>
        </div>
      )}
    </div>
  )
}
