import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import GradientMesh from '@/components/GradientMesh'
import { useAuth } from '@/contexts/AuthContext'

const features = [
  {
    icon: '🛌',
    title: 'Sleep Intelligence',
    desc: 'Track your recovery patterns and get intelligent alerts when sleep debt is building. Your brain and body depend on it.',
    color: '#BF5AF2',
  },
  {
    icon: '⚡',
    title: 'Energy Balance',
    desc: 'Monitor your calorie intake against a personalised TDEE. Know exactly when you\'re in deficit, surplus, or maintenance.',
    color: '#FFD60A',
  },
  {
    icon: '🏃',
    title: 'Activity Trends',
    desc: 'Week-over-week step analysis with automatic alerts when your movement drops. Small habit shifts, big results.',
    color: '#30D158',
  },
  {
    icon: '⚖️',
    title: 'Weight Tracking',
    desc: 'Rate-of-change analysis that flags when you\'re losing too fast or too slow — protecting muscle while losing fat.',
    color: '#64D2FF',
  },
  {
    icon: '🔋',
    title: 'Fatigue Detection',
    desc: 'A composite signal that cross-references sleep, calories, and activity to catch overtraining before it hurts you.',
    color: '#FF453A',
  },
  {
    icon: '✨',
    title: 'Smart Insights',
    desc: 'Every insight has a headline, explanation, concrete recommendation, and supporting data — nothing generic.',
    color: '#0A84FF',
  },
]

const stats = [
  { value: '5', label: 'Insight rules', sub: 'running every day' },
  { value: '30', label: 'Days of history', sub: 'always in view' },
  { value: '100%', label: 'Private', sub: 'data stays on-device' },
]

export default function Landing() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  // Logged-in users skip the landing page and go straight to the dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, loading, navigate])

  if (loading) return null

  return (
    <div className="min-h-dvh relative overflow-x-hidden">
      <GradientMesh />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4"
        style={{
          background: 'rgba(0,5,16,0.7)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          paddingTop: 'max(16px, var(--safe-top))',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="HealthMapr"
            className="w-9 h-9 rounded-2xl"
            style={{ boxShadow: '0 2px 12px rgba(10,132,255,0.35)' }}
          />
          <span className="text-[16px] font-bold text-white/90">HealthMapr</span>
        </div>

        {/* Nav CTA */}
        <Link
          to="/dashboard"
          className="text-[13px] font-semibold text-white/60 hover:text-white/90 transition-colors"
        >
          Open app →
        </Link>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-36 pb-24 min-h-dvh">
        {/* Hero logo */}
        <div className="mb-8 animate-fade-in" style={{ animationDelay: '0s' }}>
          <img
            src="/logo.png"
            alt="HealthMapr"
            className="w-24 h-24 rounded-[28px] mx-auto"
            style={{
              boxShadow: '0 8px 40px rgba(10,132,255,0.4), 0 0 0 1px rgba(255,255,255,0.12)',
            }}
          />
        </div>

        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 animate-fade-in"
          style={{
            background: 'rgba(10,132,255,0.12)',
            border: '1px solid rgba(10,132,255,0.25)',
          }}
        >
          <span className="text-[12px] font-bold text-[#0A84FF] uppercase tracking-widest">
            Personal Health Intelligence
          </span>
        </div>

        {/* Headline */}
        <h1
          className="text-[48px] xs:text-[56px] sm:text-[72px] font-black leading-[1.05] mb-6 animate-slide-up"
          style={{ letterSpacing: '-0.03em' }}
        >
          <span className="text-white">Your health,</span>
          <br />
          <span className="text-gradient">intelligently</span>
          <br />
          <span className="text-white">mapped.</span>
        </h1>

        {/* Subheadline */}
        <p
          className="text-[17px] xs:text-[19px] text-white/55 max-w-[520px] leading-relaxed mb-10 animate-slide-up stagger-2"
          style={{ letterSpacing: '-0.01em' }}
        >
          AI-powered insights for sleep, nutrition, and activity.
          Built for the health-obsessed. Private by design.
        </p>

        {/* CTAs */}
        <div className="flex flex-col xs:flex-row items-center gap-3 mb-16 animate-slide-up stagger-3">
          <Link
            to="/dashboard"
            className="btn-primary px-8 py-4 text-[16px] font-bold rounded-2xl min-w-[180px]"
          >
            Start for free
          </Link>
          <a
            href="#features"
            className="btn-glass px-8 py-4 text-[16px] font-semibold rounded-2xl min-w-[180px]"
          >
            See how it works
          </a>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-8 xs:gap-12 animate-fade-in stagger-4">
          {stats.map((s, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-[28px] font-black text-gradient leading-none">{s.value}</span>
              <span className="text-[12px] font-semibold text-white/60 mt-0.5">{s.label}</span>
              <span className="text-[10px] text-white/30">{s.sub}</span>
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-pulse-soft">
          <span className="text-[11px] text-white/25">scroll</span>
          <svg width="14" height="8" viewBox="0 0 14 8" fill="none">
            <path d="M1 1.5L7 6.5L13 1.5" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </section>

      {/* ── App Preview mockup ──────────────────────────────────────────────── */}
      <section className="relative px-6 pb-24 flex justify-center">
        <div
          className="w-full max-w-sm rounded-[36px] overflow-hidden animate-fade-in"
          style={{
            background: 'rgba(10,15,30,0.8)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderTop: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
            backdropFilter: 'blur(40px)',
          }}
        >
          {/* Mock status bar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-white/5">
            <span className="text-[12px] font-semibold text-white/40">9:41</span>
            <div className="w-24 h-5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <div className="flex gap-1.5">
              {[3,4,5].map(h => (
                <div key={h} className="rounded-sm" style={{ width: 3, height: h, background: 'rgba(255,255,255,0.4)' }} />
              ))}
            </div>
          </div>

          {/* Mock app content */}
          <div className="px-5 py-6">
            <div className="text-[11px] text-white/35 mb-1">Good morning</div>
            <div className="text-[22px] font-bold text-white/92 mb-5">Martin</div>

            {/* Mock stat strip */}
            <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-none">
              {[
                { icon: '🛌', val: '5h 30m', color: '#FF453A' },
                { icon: '🏃', val: '6.2k', color: '#FFD60A' },
                { icon: '⚡', val: '−450', color: '#0A84FF' },
                { icon: '⚖️', val: '84.1', color: '#64D2FF' },
              ].map((s, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 rounded-2xl px-3 py-3"
                  style={{ background: `${s.color}12`, border: `1px solid ${s.color}20`, minWidth: 72 }}
                >
                  <div className="text-base mb-1">{s.icon}</div>
                  <div className="text-[14px] font-bold" style={{ color: s.color }}>{s.val}</div>
                </div>
              ))}
            </div>

            {/* Mock insight cards */}
            {[
              { color: '#FF453A', bg: 'rgba(255,69,58,0.10)', title: 'Recovery is impaired', sub: 'Averaging 5.5h — critical zone' },
              { color: '#FFD60A', bg: 'rgba(255,214,10,0.08)', title: 'Activity dropped 32%', sub: 'Steps down from 9k → 6.2k' },
              { color: '#0A84FF', bg: 'rgba(10,132,255,0.08)', title: 'Calorie deficit active', sub: '~450 kcal/day below TDEE' },
            ].map((m, i) => (
              <div
                key={i}
                className="rounded-2xl p-3.5 mb-2.5 flex items-start gap-3"
                style={{ background: m.bg, border: `1px solid ${m.color}22` }}
              >
                <div className="w-7 h-7 rounded-xl flex-shrink-0" style={{ background: `${m.color}20` }} />
                <div>
                  <div className="text-[13px] font-bold text-white/80">{m.title}</div>
                  <div className="text-[11px] text-white/40 mt-0.5">{m.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Mock nav */}
          <div
            className="flex justify-around px-4 py-3 mx-4 mb-5 rounded-[24px]"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {['Insights','Log','Trends','Profile'].map((t, i) => (
              <div key={t} className="flex flex-col items-center gap-1">
                <div
                  className="w-5 h-5 rounded-lg"
                  style={{ background: i === 0 ? 'rgba(10,132,255,0.3)' : 'rgba(255,255,255,0.06)' }}
                />
                <span className="text-[9px]" style={{ color: i === 0 ? '#0A84FF' : 'rgba(255,255,255,0.28)' }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section id="features" className="px-5 pb-24">
        <div className="text-center mb-12">
          <h2
            className="text-[36px] xs:text-[42px] font-black mb-4"
            style={{ letterSpacing: '-0.03em' }}
          >
            <span className="text-white">Built different.</span>
            <br />
            <span className="text-gradient">Insights that matter.</span>
          </h2>
          <p className="text-[15px] text-white/45 max-w-[380px] mx-auto leading-relaxed">
            Not just charts. Each insight is a specific finding with a concrete recommendation.
          </p>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {features.map((f, i) => (
            <div
              key={i}
              className={`glass-card p-5 animate-slide-up stagger-${Math.min(i + 1, 6)}`}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4"
                style={{ background: `${f.color}14`, border: `1px solid ${f.color}22` }}
              >
                {f.icon}
              </div>
              <h3 className="text-[15px] font-bold text-white/88 mb-2">{f.title}</h3>
              <p className="text-[13px] text-white/45 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Section ────────────────────────────────────────────────────── */}
      <section className="px-6 pb-24 text-center">
        <div
          className="glass-card p-10 max-w-lg mx-auto relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(10,132,255,0.12), rgba(191,90,242,0.10))',
            border: '1px solid rgba(10,132,255,0.22)',
          }}
        >
          {/* Glow */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(10,132,255,0.3) 0%, transparent 70%)',
              filter: 'blur(30px)',
            }}
          />

          <h2
            className="text-[32px] font-black mb-3 relative"
            style={{ letterSpacing: '-0.03em' }}
          >
            Start mapping <span className="text-gradient">your health</span>
          </h2>
          <p className="text-[14px] text-white/50 mb-8 relative">
            No account needed. No cloud. Just you and your data.
          </p>
          <Link
            to="/dashboard"
            className="btn-primary inline-flex px-10 py-4 text-[16px] font-bold rounded-2xl relative"
          >
            Get started free
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer
        className="px-6 py-8 border-t text-center"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <img
            src="/logo.png"
            alt="HealthMapr"
            className="w-7 h-7 rounded-xl opacity-70"
          />
          <span className="text-[14px] font-bold text-white/50">HealthMapr</span>
        </div>
        <p className="text-[12px] text-white/25">
          © 2025 KavuraLabs · All data stored locally on your device
        </p>
      </footer>
    </div>
  )
}
