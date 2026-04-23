import { useState } from 'react'
import type { HealthProjection, ProjectionTone, TimeframeProjection } from '@/lib/engine/projections'

interface Props {
  projection: HealthProjection
}

type Frame = '7d' | '30d' | '90d'
type Domain = 'weight' | 'energy' | 'fitness'

const FRAME_LABELS: Record<Frame, string> = {
  '7d':  '7 days',
  '30d': '30 days',
  '90d': '90 days',
}

const DOMAIN_META: Record<Domain, { label: string; icon: string }> = {
  weight:  { label: 'Weight',  icon: '⚖️'  },
  energy:  { label: 'Energy',  icon: '⚡'  },
  fitness: { label: 'Fitness', icon: '💪'  },
}

const TONE_STYLES: Record<ProjectionTone, { color: string; bg: string; border: string; dot: string }> = {
  positive: {
    color:  '#30D158',
    bg:     'rgba(48,209,88,0.08)',
    border: 'rgba(48,209,88,0.20)',
    dot:    '#30D158',
  },
  neutral: {
    color:  '#0A84FF',
    bg:     'rgba(10,132,255,0.07)',
    border: 'rgba(10,132,255,0.18)',
    dot:    '#0A84FF',
  },
  warning: {
    color:  '#FF9F0A',
    bg:     'rgba(255,159,10,0.08)',
    border: 'rgba(255,159,10,0.22)',
    dot:    '#FF9F0A',
  },
}

function DomainRow({ label, icon, item }: { label: string; icon: string; item: TimeframeProjection }) {
  const s = TONE_STYLES[item.tone]
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-2xl"
      style={{ background: s.bg, border: `1px solid ${s.border}` }}
    >
      <span className="text-[18px] mt-0.5 flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[11px] font-bold" style={{ color: s.color }}>{label}</span>
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: s.dot }}
          />
        </div>
        <p className="text-[13px] text-white/75 leading-snug">{item.summary}</p>
      </div>
    </div>
  )
}

export default function ProjectionCard({ projection }: Props) {
  const [frame, setFrame] = useState<Frame>('30d')

  const frames: Frame[] = ['7d', '30d', '90d']
  const domains: Domain[] = ['weight', 'energy', 'fitness']

  return (
    <div
      className="rounded-3xl p-5"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderTop: '1px solid rgba(255,255,255,0.13)',
      }}
    >
      {/* Header + frame toggle */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/35 mb-0.5">
            Projection
          </p>
          <h3 className="text-[16px] font-bold text-white/90">
            Where you're heading
          </h3>
        </div>

        {/* Pill toggle */}
        <div
          className="flex items-center gap-1 p-1 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {frames.map((f) => (
            <button
              key={f}
              onClick={() => setFrame(f)}
              className="px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all"
              style={
                frame === f
                  ? { background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.90)' }
                  : { color: 'rgba(255,255,255,0.35)' }
              }
            >
              {FRAME_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Domain rows */}
      <div className="flex flex-col gap-2.5">
        {domains.map((d) => (
          <DomainRow
            key={d}
            label={DOMAIN_META[d].label}
            icon={DOMAIN_META[d].icon}
            item={projection[d][frame]}
          />
        ))}
      </div>

      <p className="text-[10px] text-white/25 text-center mt-3 leading-tight">
        Projections based on your last 7 days. Log consistently for higher accuracy.
      </p>
    </div>
  )
}
