import type { StreakData } from '@/lib/streak'
import { streakFlame, streakLabel } from '@/lib/streak'

interface Props {
  streak: StreakData
}

export default function StreakBadge({ streak }: Props) {
  const { current, longest, loggedToday } = streak
  const flame = streakFlame(current)
  const label = streakLabel(current)

  // Colour: green if logged today, amber if not but streak alive, grey if zero
  const color   = current === 0 ? 'rgba(255,255,255,0.25)' : loggedToday ? '#30D158' : '#FFD60A'
  const bg      = current === 0 ? 'rgba(255,255,255,0.04)' : loggedToday ? 'rgba(48,209,88,0.09)' : 'rgba(255,214,10,0.09)'
  const border  = current === 0 ? 'rgba(255,255,255,0.08)' : loggedToday ? 'rgba(48,209,88,0.22)' : 'rgba(255,214,10,0.22)'

  return (
    <div
      className="rounded-3xl p-4 flex items-center gap-4"
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      {/* Flame + count */}
      <div className="flex flex-col items-center flex-shrink-0" style={{ minWidth: 56 }}>
        <span className="text-[26px] leading-none mb-0.5">{flame}</span>
        <span className="text-[28px] font-black leading-none tabular-nums" style={{ color }}>
          {current}
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-10 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />

      {/* Labels */}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-bold text-white/88 leading-tight">{label}</p>
        <p className="text-[12px] text-white/40 mt-0.5">
          {loggedToday
            ? "Today's data logged ✓"
            : current > 0
            ? "Log today to keep it going"
            : "Log anything to start"}
        </p>
      </div>

      {/* Best badge */}
      {longest > 0 && (
        <div
          className="flex-shrink-0 flex flex-col items-center px-2.5 py-1.5 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <span className="text-[16px] font-black text-white/70 leading-none tabular-nums">{longest}</span>
          <span className="text-[9px] text-white/30 uppercase tracking-widest mt-0.5">best</span>
        </div>
      )}
    </div>
  )
}
