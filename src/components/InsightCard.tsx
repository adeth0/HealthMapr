import { useState } from 'react'
import type { InsightObject } from '@/lib/types'

const SEVERITY_CONFIG = {
  critical: {
    color: '#FF453A',
    bg: 'rgba(255,69,58,0.10)',
    border: 'rgba(255,69,58,0.22)',
    icon: '🔴',
    label: 'Critical',
    dot: '#FF453A',
  },
  warning: {
    color: '#FFD60A',
    bg: 'rgba(255,214,10,0.08)',
    border: 'rgba(255,214,10,0.20)',
    icon: '⚠️',
    label: 'Warning',
    dot: '#FFD60A',
  },
  info: {
    color: '#0A84FF',
    bg: 'rgba(10,132,255,0.08)',
    border: 'rgba(10,132,255,0.20)',
    icon: 'ℹ️',
    label: 'Info',
    dot: '#0A84FF',
  },
  positive: {
    color: '#30D158',
    bg: 'rgba(48,209,88,0.08)',
    border: 'rgba(48,209,88,0.20)',
    icon: '✅',
    label: 'Positive',
    dot: '#30D158',
  },
}

const TYPE_ICONS: Record<string, string> = {
  recovery: '🛌',
  energy_balance: '⚡',
  activity: '🏃',
  weight: '⚖️',
  fatigue_risk: '🔋',
  positive: '✨',
}

const TREND_ICONS = {
  improving: { icon: '↗', color: '#30D158' },
  declining: { icon: '↘', color: '#FF453A' },
  stable: { icon: '→', color: 'rgba(255,255,255,0.4)' },
}

interface InsightCardProps {
  insight: InsightObject
  index?: number
}

export function InsightCard({ insight, index = 0 }: InsightCardProps) {
  const [expanded, setExpanded] = useState(false)
  const cfg = SEVERITY_CONFIG[insight.severity]
  const trend = insight.trend ? TREND_ICONS[insight.trend] : null
  const delayClass = ['stagger-1','stagger-2','stagger-3','stagger-4','stagger-5','stagger-6'][Math.min(index, 5)]

  return (
    <article
      className={`glass-card overflow-hidden animate-slide-up ${delayClass} cursor-pointer`}
      style={{ border: `1px solid ${cfg.border}`, background: cfg.bg }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Type icon */}
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg"
            style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.color}25` }}
          >
            {TYPE_ICONS[insight.type] ?? '📊'}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Severity badge */}
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: cfg.color }}
              >
                {cfg.label}
              </span>
              {trend && (
                <span className="text-[11px] font-bold" style={{ color: trend.color }}>
                  {trend.icon} {insight.trend}
                </span>
              )}
            </div>

            {/* Headline */}
            <h3 className="text-[15px] font-bold text-white/92 leading-tight mb-1">
              {insight.headline}
            </h3>

            {/* Message (collapsed: truncated) */}
            <p
              className={`text-[13px] text-white/55 leading-relaxed transition-all duration-300 ${
                expanded ? '' : 'line-clamp-2'
              }`}
            >
              {insight.message}
            </p>
          </div>

          {/* Expand chevron */}
          <div
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center transition-transform duration-300"
            style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
              <path d="M1 1.5L6 6.5L11 1.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* Expanded content */}
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: expanded ? 400 : 0 }}
      >
        <div
          className="mx-4 mb-4 rounded-2xl p-4"
          style={{
            background: 'rgba(0,0,0,0.25)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {/* Recommendation */}
          <div className="mb-4">
            <div className="text-[11px] font-bold uppercase tracking-widest text-white/35 mb-1.5">
              Recommendation
            </div>
            <p className="text-[13px] text-white/80 leading-relaxed">
              {insight.recommendation}
            </p>
          </div>

          {/* Data points */}
          {insight.dataPoints.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-white/35 mb-2">
                Data
              </div>
              <div className="grid grid-cols-2 gap-2">
                {insight.dataPoints.map((dp, i) => (
                  <div
                    key={i}
                    className="rounded-xl p-2.5"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <div className="text-[10px] text-white/35 mb-0.5">{dp.label}</div>
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
    </article>
  )
}

export function InsightEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-8 animate-fade-in">
      <div
        className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl mb-4"
        style={{
          background: 'rgba(10,132,255,0.1)',
          border: '1px solid rgba(10,132,255,0.2)',
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
