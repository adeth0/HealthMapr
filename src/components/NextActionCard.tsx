import type { NextAction } from '@/lib/engine/next-action'

interface Props {
  action: NextAction
}

export default function NextActionCard({ action }: Props) {
  return (
    <div
      className="rounded-3xl p-5 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(48,209,88,0.13) 0%, rgba(10,132,255,0.09) 100%)',
        border: '1px solid rgba(48,209,88,0.22)',
        borderTop: '1px solid rgba(48,209,88,0.32)',
      }}
    >
      {/* Subtle glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 20% 50%, rgba(48,209,88,0.07) 0%, transparent 70%)',
        }}
      />

      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3 relative">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-[16px] flex-shrink-0"
          style={{ background: 'rgba(48,209,88,0.15)', border: '1px solid rgba(48,209,88,0.25)' }}
        >
          {action.icon}
        </div>
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: '#30D158' }}
          >
            Today's Action
          </p>
          <p className="text-[11px] text-white/40 leading-tight">{action.reason}</p>
        </div>
      </div>

      {/* The action */}
      <p
        className="text-[16px] font-bold text-white/95 leading-snug relative mb-3"
        style={{ letterSpacing: '-0.01em' }}
      >
        {action.action}
      </p>

      {/* Expected benefit pill */}
      <div
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl relative"
        style={{
          background: 'rgba(48,209,88,0.08)',
          border: '1px solid rgba(48,209,88,0.16)',
        }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path
            d="M1.5 5.5L3.5 7.5L8.5 2.5"
            stroke="#30D158"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-[11px] text-white/55 leading-tight">{action.expected_benefit}</span>
      </div>
    </div>
  )
}
