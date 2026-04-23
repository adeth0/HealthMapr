import { useEffect, useState } from 'react'

interface Props {
  days: number
  onDismiss: () => void
}

const MILESTONE_COPY: Record<number, { title: string; sub: string; emoji: string }> = {
  3:   { emoji: '🌱', title: '3-day streak!',   sub: 'A habit is forming. Keep showing up.' },
  7:   { emoji: '🔥', title: 'One week streak!', sub: "Seven days consistent. You're building something real." },
  14:  { emoji: '💪', title: 'Two weeks strong!',sub: 'Two weeks of data. Your insights are getting sharper.' },
  30:  { emoji: '🏆', title: '30-day streak!',   sub: "A full month. That's not luck — that's discipline." },
  60:  { emoji: '⚡', title: '60 days!',          sub: "Two months of daily logging. You're in elite company." },
  100: { emoji: '💯', title: '100 days!',         sub: "One hundred days. This is who you are now." },
  365: { emoji: '🌟', title: 'One full year!',    sub: "365 days. Extraordinary consistency." },
}

export default function MilestoneToast({ days, onDismiss }: Props) {
  const [visible, setVisible] = useState(false)
  const copy = MILESTONE_COPY[days] ?? {
    emoji: '🔥',
    title: `${days}-day streak!`,
    sub: 'Keep the momentum going.',
  }

  useEffect(() => {
    // Animate in
    const t1 = setTimeout(() => setVisible(true), 50)
    // Auto-dismiss after 5 s
    const t2 = setTimeout(() => { setVisible(false); setTimeout(onDismiss, 350) }, 5000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDismiss])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center px-5 pb-10 pointer-events-none"
      style={{ paddingBottom: 'max(40px, calc(var(--safe-bottom) + 100px))' }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-5 pointer-events-auto"
        style={{
          background: 'linear-gradient(135deg, rgba(48,209,88,0.15), rgba(10,132,255,0.12))',
          border: '1px solid rgba(48,209,88,0.30)',
          borderTop: '1px solid rgba(48,209,88,0.45)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(48,209,88,0.15)',
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)',
          opacity: visible ? 1 : 0,
          transition: 'transform 380ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 280ms ease',
        }}
        onClick={() => { setVisible(false); setTimeout(onDismiss, 350) }}
      >
        <div className="flex items-start gap-4">
          <span className="text-[42px] leading-none flex-shrink-0">{copy.emoji}</span>
          <div className="flex-1 min-w-0">
            <p
              className="text-[18px] font-black text-white/95 leading-tight mb-1"
              style={{ letterSpacing: '-0.02em' }}
            >
              {copy.title}
            </p>
            <p className="text-[13px] text-white/60 leading-snug">{copy.sub}</p>
          </div>
          <button
            className="flex-shrink-0 w-7 h-7 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.08)' }}
            onClick={(e) => { e.stopPropagation(); setVisible(false); setTimeout(onDismiss, 350) }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 1L9 9M9 1L1 9" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Progress bar that counts down the auto-dismiss */}
        <div
          className="mt-4 h-1 rounded-full overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #30D158, #0A84FF)',
              width: visible ? '0%' : '100%',
              transition: visible ? 'width 5000ms linear' : 'none',
            }}
          />
        </div>
      </div>
    </div>
  )
}
