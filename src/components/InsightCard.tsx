import { useState } from 'react'
import type { InsightObject } from '@/lib/types'

// ── Config ────────────────────────────────────────────────────────────────────

const SEVERITY_CONFIG = {
  critical: {
    color: '#FF453A',
    bg: 'rgba(255,69,58,0.08)',
    border: 'rgba(255,69,58,0.20)',
    stripe: '#FF453A',
    label: 'Critical',
  },
  warning: {
    color: '#FFD60A',
    bg: 'rgba(255,214,10,0.07)',
    border: 'rgba(255,214,10,0.18)',
    stripe: '#FFD60A',
    label: 'Warning',
  },
  info: {
    color: '#0A84FF',
    bg: 'rgba(10,132,255,0.07)',
    border: 'rgba(10,132,255,0.18)',
    stripe: '#0A84FF',
    label: 'Info',
  },
  positive: {
    color: '#30D158',
    bg: 'rgba(48,209,88,0.07)',
    border: 'rgba(48,209,88,0.18)',
    stripe: '#30D158',
    label: 'Positive',
  },
}

const TYPE_ICONS: Record<string, string> = {
  recovery:         '🛌',
  energy_balance:   '⚡',
  activity:         '🏃',
  weight:           '⚖️',
  fatigue_risk:     '🔋',
  positive:         '✨',
  sleep_quality:    '🌙',
  sleep_debt:       '😴',
  workout_streak:   '🔥',
  workout_returning:'💪',
}

const TREND_CONFIG = {
  improving: { icon: '↗', color: '#30D158' },
  declining:  { icon: '↘', color: '#FF453A' },
  stable:     { icon: '→', color: 'rgba(255,255,255,0.35)' },
}

// ── Card ─────────────────────────────────────────────────────────────────────

interface InsightCardProps {
  insight: InsightObject
  index?: number
}

export function InsightCard({ insight, index = 0 }: InsightCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [pressed, setPressed]   = useState(false)
  const cfg   = SEVERITY_CONFIG[insight.severity]
  const trend = insight.trend ? TREND_CONFIG[insight.trend] : null
  const delay = [0.05, 0.10, 0.15, 0.20, 0.25, 0.30][Math.min(index, 5)]

  return (
    <article
      className="overflow-hidden animate-slide-up"
      style={{
        animationDelay: `${delay}s`,
        borderRadius: 20,
        border: `1px solid ${cfg.border}`,
        borderTop: `1px solid ${cfg.border}`,
        background: cfg.bg,
        // Press spring
        transform: pressed ? 'scale(0.975)' : 'scale(1)',
        transition: pressed
          ? 'transform 80ms ease-in'
          : 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 200ms ease',
        cursor: 'pointer',
        boxShadow: pressed
          ? '0 2px 12px rgba(0,0,0,0.3)'
          : '0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.07)',
        // Prevent text selection on fast taps
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
      onClick={() => setExpanded((e) => !e)}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
    >
      {/* Left severity stripe */}
      <div className="flex">
        <div
          className="w-1 flex-shrink-0 rounded-l-[20px]"
          style={{ background: cfg.stripe, opacity: 0.7 }}
        />

        <div className="flex-1 min-w-0">
          {/* ── Header ── */}
          <div className="p-4">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg"
                style={{
                  background: `${cfg.color}18`,
                  border: `1px solid ${cfg.color}28`,
                }}
              >
                {TYPE_ICONS[insight.type] ?? '📊'}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: cfg.color }}>
                    {cfg.label}
                  </span>
                  {trend && (
                    <span className="text-[11px] font-semibold" style={{ color: trend.color }}>
                      {trend.icon} {insight.trend}
                    </span>
                  )}
                </div>
                <h3 className="text-[15px] font-bold text-white/92 leading-tight mb-1">
                  {insight.headline}
                </h3>
                <p
                  className="text-[13px] text-white/55 leading-relaxed"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: expanded ? 'unset' : 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    transition: 'all 280ms cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                >
                  {insight.message}
                </p>
              </div>

              {/* Chevron */}
              <div
                className="flex-shrink-0 w-6 h-6 flex items-center justify-center"
                style={{
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 280ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                  marginTop: 2,
                }}
              >
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                  <path
                    d="M1 1.5L6 6.5L11 1.5"
                    stroke="rgba(255,255,255,0.28)"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* ── Expandable detail (CSS grid rows — silky smooth) ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateRows: expanded ? '1fr' : '0fr',
              transition: 'grid-template-rows 280ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            <div style={{ overflow: 'hidden' }}>
              <div
                className="mx-4 mb-4 rounded-2xl p-4"
                style={{
                  background: 'rgba(0,0,0,0.22)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  opacity: expanded ? 1 : 0,
                  transition: 'opacity 200ms ease 80ms',
                }}
              >
                {/* Recommendation */}
                <div className="mb-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1.5">
                    Recommendation
                  </div>
                  <p className="text-[13px] text-white/80 leading-relaxed">
                    {insight.recommendation}
                  </p>
                </div>

                {/* Data points */}
                {insight.dataPoints.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">
                      Data
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {insight.dataPoints.map((dp, i) => (
                        <div
                          key={i}
                          className="rounded-xl p-2.5"
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.07)',
                          }}
                        >
                          <div className="text-[10px] text-white/30 mb-0.5">{dp.label}</div>
                          <div className="text-[13px] font-semibold" style={{ color: cfg.color }}>
                            {dp.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

export function InsightEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-8 animate-fade-in">
      <div
        className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl mb-4"
        style={{
          background: 'rgba(10,132,255,0.08)',
          border: '1px solid rgba(10,132,255,0.18)',
        }}
      >
        ✨
      </div>
      <h3 className="text-lg font-bold text-white/80 mb-2">All good!</h3>
      <p className="text-[13px] text-white/40 max-w-[240px] leading-relaxed">
        No issues detected. Keep logging your daily metrics to unlock personalised insights.
      </p>
    </div>
  )
}
