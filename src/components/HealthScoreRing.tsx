import { useEffect, useRef, useState } from 'react'
import type { ScoreBreakdown } from '@/lib/engine/health-score'
import { scoreColor, scoreLabel } from '@/lib/engine/health-score'

// ── Constants ─────────────────────────────────────────────────────────────────

const R = 54                           // ring radius
const STROKE = 9                       // ring stroke width
const CX = 68                          // SVG centre x (leaves room for stroke)
const CY = 68                          // SVG centre y
const CIRC = 2 * Math.PI * R          // full circumference ≈ 339.3

// ── Domain bars ───────────────────────────────────────────────────────────────

const DOMAINS = [
  { key: 'sleep',     label: 'Sleep',     icon: '🛌', color: '#BF5AF2' },
  { key: 'activity',  label: 'Activity',  icon: '🏃', color: '#30D158' },
  { key: 'nutrition', label: 'Nutrition', icon: '⚡', color: '#FFD60A' },
  { key: 'fitness',   label: 'Fitness',   icon: '💪', color: '#0A84FF' },
] as const

type DomainKey = typeof DOMAINS[number]['key']

// ── Sub-components ────────────────────────────────────────────────────────────

function DomainBar({ label, icon, color, value }: { label: string; icon: string; color: string; value: number }) {
  const [animated, setAnimated] = useState(0)

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const start = performance.now()
      const dur = 700
      const tick = (now: number) => {
        const t = Math.min((now - start) / dur, 1)
        const ease = 1 - Math.pow(1 - t, 3)
        setAnimated(Math.round(value * ease))
        if (t < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(id)
  }, [value])

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <span className="text-[11px]">{icon}</span>
          <span className="text-[10px] text-white/40 font-medium">{label}</span>
        </div>
        <span className="text-[10px] font-bold" style={{ color }}>{animated}</span>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.07)' }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${animated}%`,
            background: color,
            transition: 'width 700ms cubic-bezier(0.22, 1, 0.36, 1)',
            boxShadow: `0 0 6px ${color}55`,
          }}
        />
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  breakdown: ScoreBreakdown
}

export default function HealthScoreRing({ breakdown }: Props) {
  const [animScore, setAnimScore] = useState(0)
  const [dashOffset, setDashOffset] = useState(CIRC)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const target = breakdown.total
    const targetOffset = CIRC * (1 - target / 100)
    const dur = 900
    const start = performance.now()

    const tick = (now: number) => {
      const t = Math.min((now - start) / dur, 1)
      // Spring-ish easing: ease out back
      const ease = t < 1 ? 1 - Math.pow(1 - t, 3) : 1
      const current = Math.round(target * ease)
      const offset  = CIRC - (CIRC - targetOffset) * ease
      setAnimScore(current)
      setDashOffset(offset)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [breakdown.total])

  const color = scoreColor(breakdown.total)
  const label = scoreLabel(breakdown.total)

  return (
    <div
      className="rounded-3xl p-5 overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderTop: '1px solid rgba(255,255,255,0.14)',
      }}
    >
      <div className="flex items-center gap-5">

        {/* ── Ring ── */}
        <div className="flex-shrink-0 relative" style={{ width: 136, height: 136 }}>
          <svg
            width="136"
            height="136"
            viewBox="0 0 136 136"
            style={{ transform: 'rotate(-90deg)' }}
          >
            {/* Track */}
            <circle
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth={STROKE}
            />
            {/* Score arc */}
            <circle
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              stroke={color}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={dashOffset}
              style={{
                filter: `drop-shadow(0 0 8px ${color}66)`,
                transition: 'stroke 0.4s ease',
              }}
            />
          </svg>

          {/* Centre text */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ pointerEvents: 'none' }}
          >
            <span
              className="text-[34px] font-black leading-none tabular-nums"
              style={{ color, letterSpacing: '-0.03em' }}
            >
              {animScore}
            </span>
            <span className="text-[10px] font-bold text-white/35 uppercase tracking-widest mt-0.5">
              {label}
            </span>
          </div>
        </div>

        {/* ── Domain bars ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-0.5">
              Health Score
            </p>
            <p className="text-[13px] text-white/55 leading-snug">
              {breakdown.dataQuality < 0.5
                ? 'Log more days for a complete picture'
                : `Based on ${Math.round(breakdown.dataQuality * 7)} days of data`}
            </p>
          </div>

          {DOMAINS.map((d) => (
            <DomainBar
              key={d.key}
              label={d.label}
              icon={d.icon}
              color={d.color}
              value={breakdown[d.key as DomainKey]}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
