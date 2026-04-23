import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import GradientMesh from '@/components/GradientMesh'
import { saveProfile } from '@/lib/storage'
import { calculateBMR, calculateTDEE } from '@/lib/health/calculations'
import type { ActivityLevel, BiologicalSex, HealthGoal } from '@/lib/types'

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; sub: string; icon: string }[] = [
  { value: 'sedentary', label: 'Sedentary', sub: 'Desk job, little exercise', icon: '💺' },
  { value: 'light', label: 'Lightly active', sub: '1–3 workouts/week', icon: '🚶' },
  { value: 'moderate', label: 'Moderately active', sub: '3–5 workouts/week', icon: '🏋️' },
  { value: 'active', label: 'Very active', sub: 'Hard training 6–7×/week', icon: '🏃' },
  { value: 'very_active', label: 'Athlete', sub: 'Twice-daily training', icon: '⚡' },
]

const GOAL_OPTIONS: { value: HealthGoal; label: string; sub: string; icon: string; color: string }[] = [
  { value: 'lose_weight', label: 'Lose weight', sub: 'Track calories and progress toward target', icon: '🎯', color: '#FF9F0A' },
  { value: 'sleep_better', label: 'Sleep better', sub: 'Build a consistent sleep routine', icon: '🛌', color: '#BF5AF2' },
  { value: 'move_more', label: 'Move more', sub: 'Hit daily step and activity goals', icon: '🏃', color: '#30D158' },
  { value: 'track_everything', label: 'Track everything', sub: 'Full visibility across all metrics', icon: '📊', color: '#0A84FF' },
]

const STEPS = [
  { title: "What's your name?", sub: 'Just your first name is fine' },
  { title: 'Your body metrics', sub: 'Used to calculate your personalised TDEE' },
  { title: 'Activity level', sub: 'Your general week-to-week activity' },
  { title: 'What's your main goal?', sub: 'We'll tailor your daily insights to this' },
]

// ── Welcome screen shown after completing all steps ───────────────────────────

function WelcomeScreen({
  name,
  tdee,
  goal,
  onLog,
  onDashboard,
}: {
  name: string
  tdee: number
  goal: HealthGoal
  onLog: () => void
  onDashboard: () => void
}) {
  const [seconds, setSeconds] = useState(4)

  useEffect(() => {
    const t = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) { clearInterval(t); onLog(); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [onLog])

  const goalConfig = GOAL_OPTIONS.find((g) => g.value === goal) ?? GOAL_OPTIONS[3]

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center animate-fade-in">
      <GradientMesh />

      {/* Big emoji */}
      <div
        className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl mb-6"
        style={{
          background: `linear-gradient(135deg, ${goalConfig.color}22, ${goalConfig.color}10)`,
          border: `1px solid ${goalConfig.color}30`,
        }}
      >
        {goalConfig.icon}
      </div>

      {/* Heading */}
      <h1
        className="text-[36px] font-black text-white/95 mb-2 leading-tight"
        style={{ letterSpacing: '-0.03em' }}
      >
        You're all set,<br />
        <span className="text-gradient">{name}!</span>
      </h1>

      <p className="text-[15px] text-white/45 mb-2">
        Your daily calorie target is
      </p>
      <div
        className="text-[42px] font-black text-white/90 mb-1 leading-none"
        style={{ letterSpacing: '-0.03em' }}
      >
        {tdee.toLocaleString()}
        <span className="text-[18px] text-white/40 ml-1 font-semibold">kcal</span>
      </div>
      <p className="text-[13px] text-white/35 mb-8">Goal: {goalConfig.label}</p>

      {/* CTAs */}
      <div className="w-full max-w-sm flex flex-col gap-3">
        <button
          onClick={onLog}
          className="w-full py-4 rounded-2xl text-[15px] font-bold text-white transition-all active:scale-[0.97]"
          style={{
            background: 'linear-gradient(135deg, #0A84FF, #BF5AF2)',
            boxShadow: '0 4px 24px rgba(10,132,255,0.35)',
          }}
        >
          Log today's data →
        </button>
        <button
          onClick={onDashboard}
          className="w-full py-3 rounded-2xl text-[14px] font-semibold text-white/45 transition-all"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
        >
          Skip to dashboard
        </button>
      </div>

      <p className="text-[12px] text-white/20 mt-5">
        Taking you to Log in {seconds}s…
      </p>
    </div>
  )
}

// ── Main Setup component ──────────────────────────────────────────────────────

export default function Setup() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [showWelcome, setShowWelcome] = useState(false)

  // Step 0
  const [name, setName] = useState('')
  // Step 1
  const [age, setAge] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [sex, setSex] = useState<BiologicalSex>('male')
  // Step 2
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate')
  // Step 3
  const [goal, setGoal] = useState<HealthGoal>('track_everything')

  const tdeePreview =
    age && heightCm && weightKg
      ? calculateTDEE(
          calculateBMR(parseFloat(weightKg), parseFloat(heightCm), parseInt(age), sex),
          activityLevel
        )
      : null

  function handleSubmit() {
    if (!name || !age || !heightCm || !weightKg) return
    saveProfile({
      name,
      age: parseInt(age),
      height_cm: parseFloat(heightCm),
      weight_kg: parseFloat(weightKg),
      sex,
      activity_level: activityLevel,
      goal,
    })
    setShowWelcome(true)
  }

  const canContinue = [
    name.trim().length > 0,
    !!(age && heightCm && weightKg && parseFloat(weightKg) > 20 && parseFloat(heightCm) > 100 && parseInt(age) > 0),
    true,
    true,
  ][step]

  const inputWrap = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 16,
  }

  if (showWelcome) {
    return (
      <WelcomeScreen
        name={name}
        tdee={tdeePreview ?? 2000}
        goal={goal}
        onLog={() => navigate('/log', { replace: true })}
        onDashboard={() => navigate('/dashboard', { replace: true })}
      />
    )
  }

  return (
    <div className="min-h-dvh flex flex-col" style={{ paddingTop: 'max(24px, var(--safe-top))' }}>
      <GradientMesh />

      {/* Progress bar */}
      <div className="flex gap-1.5 px-6 mb-10">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className="flex-1 h-1 rounded-full transition-all duration-500"
            style={{ background: i <= step ? '#0A84FF' : 'rgba(255,255,255,0.10)' }}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1 px-6 pb-8">
        <div className="mb-8 animate-slide-up" key={step}>
          <p className="text-[13px] font-semibold text-white/35 mb-2 uppercase tracking-widest">
            Step {step + 1} of {STEPS.length}
          </p>
          <h1
            className="text-[32px] font-black text-white/95 mb-2"
            style={{ letterSpacing: '-0.03em' }}
          >
            {STEPS[step].title}
          </h1>
          <p className="text-[15px] text-white/45">{STEPS[step].sub}</p>
        </div>

        <div className="animate-slide-up stagger-2" key={`content-${step}`}>

          {/* ── Step 0: Name ── */}
          {step === 0 && (
            <div>
              <div className="py-3 px-4" style={{ ...inputWrap, borderColor: name ? 'rgba(10,132,255,0.4)' : 'rgba(255,255,255,0.12)' }}>
                <input
                  autoFocus
                  type="text"
                  placeholder="e.g. Martin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-[28px] font-black text-white/90 w-full bg-transparent border-none outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && canContinue && setStep(1)}
                />
              </div>
              {name && (
                <p className="text-[13px] text-white/40 mt-3 animate-fade-in">
                  Nice to meet you, {name}! 👋
                </p>
              )}
            </div>
          )}

          {/* ── Step 1: Body metrics ── */}
          {step === 1 && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Age', val: age, set: setAge, unit: 'yr' },
                  { label: 'Height', val: heightCm, set: setHeightCm, unit: 'cm' },
                  { label: 'Weight', val: weightKg, set: setWeightKg, unit: 'kg' },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="text-[11px] font-bold uppercase tracking-widest text-white/35 mb-1.5 block">{f.label}</label>
                    <div style={inputWrap} className="flex items-end gap-1 px-3 pt-2.5 pb-2">
                      <input
                        type="number"
                        placeholder="—"
                        value={f.val}
                        onChange={(e) => f.set(e.target.value)}
                        className="flex-1 text-[22px] font-black text-white/90 bg-transparent border-none outline-none w-full leading-none"
                        inputMode="decimal"
                      />
                      <span className="text-[11px] text-white/30 font-semibold pb-0.5">{f.unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-white/35 mb-1.5 block">Biological Sex</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['male', 'female', 'other'] as BiologicalSex[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSex(s)}
                      className="py-3 rounded-2xl text-[13px] font-bold capitalize transition-all"
                      style={sex === s
                        ? { background: 'rgba(10,132,255,0.2)', border: '1px solid rgba(10,132,255,0.45)', color: '#0A84FF' }
                        : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.45)' }
                      }
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {tdeePreview && (
                <div
                  className="rounded-2xl p-4 animate-fade-in"
                  style={{ background: 'rgba(10,132,255,0.08)', border: '1px solid rgba(10,132,255,0.18)' }}
                >
                  <div className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-1">Estimated TDEE</div>
                  <div className="text-[28px] font-black text-[#0A84FF] leading-none">{tdeePreview} <span className="text-[14px] text-white/40">kcal/day</span></div>
                  <div className="text-[11px] text-white/35 mt-1">Will refine in next step</div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Activity ── */}
          {step === 2 && (
            <div className="flex flex-col gap-2.5">
              {ACTIVITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setActivityLevel(opt.value)}
                  className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all active:scale-[0.98]"
                  style={activityLevel === opt.value
                    ? { background: 'rgba(10,132,255,0.15)', border: '1px solid rgba(10,132,255,0.40)' }
                    : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }
                  }
                >
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                    style={activityLevel === opt.value
                      ? { background: 'rgba(10,132,255,0.2)', border: '1px solid rgba(10,132,255,0.35)' }
                      : { background: 'rgba(255,255,255,0.06)' }
                    }
                  >
                    {opt.icon}
                  </div>
                  <div>
                    <div className="text-[15px] font-bold mb-0.5" style={{ color: activityLevel === opt.value ? '#0A84FF' : 'rgba(255,255,255,0.80)' }}>
                      {opt.label}
                    </div>
                    <div className="text-[12px] text-white/40">{opt.sub}</div>
                  </div>
                  {activityLevel === opt.value && (
                    <div className="ml-auto">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#0A84FF' }}>
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
              ))}

              {tdeePreview && (
                <div
                  className="rounded-2xl p-4 mt-2 animate-fade-in"
                  style={{ background: 'rgba(48,209,88,0.08)', border: '1px solid rgba(48,209,88,0.20)' }}
                >
                  <div className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-1">Your personalised TDEE</div>
                  <div className="text-[28px] font-black text-[#30D158] leading-none">
                    {calculateTDEE(calculateBMR(parseFloat(weightKg || '0'), parseFloat(heightCm || '0'), parseInt(age || '0'), sex), activityLevel)}
                    <span className="text-[14px] text-white/40 ml-1">kcal/day</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Goal ── */}
          {step === 3 && (
            <div className="flex flex-col gap-2.5">
              {GOAL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setGoal(opt.value)}
                  className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all active:scale-[0.98]"
                  style={goal === opt.value
                    ? { background: `${opt.color}15`, border: `1px solid ${opt.color}40` }
                    : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }
                  }
                >
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                    style={goal === opt.value
                      ? { background: `${opt.color}20`, border: `1px solid ${opt.color}35` }
                      : { background: 'rgba(255,255,255,0.06)' }
                    }
                  >
                    {opt.icon}
                  </div>
                  <div>
                    <div className="text-[15px] font-bold mb-0.5" style={{ color: goal === opt.value ? opt.color : 'rgba(255,255,255,0.80)' }}>
                      {opt.label}
                    </div>
                    <div className="text-[12px] text-white/40">{opt.sub}</div>
                  </div>
                  {goal === opt.value && (
                    <div className="ml-auto">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: opt.color }}>
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* Navigation buttons */}
      <div className="px-6 pb-12 flex gap-3" style={{ paddingBottom: 'max(48px, calc(var(--safe-bottom) + 24px))' }}>
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="flex-1 py-4 rounded-2xl text-[15px] font-semibold text-white/55 transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            Back
          </button>
        )}
        <button
          onClick={step < STEPS.length - 1 ? () => setStep(step + 1) : handleSubmit}
          disabled={!canContinue}
          className="flex-1 py-4 rounded-2xl text-[15px] font-bold text-white transition-all active:scale-[0.97]"
          style={canContinue
            ? { background: 'linear-gradient(135deg, #0A84FF, #BF5AF2)', boxShadow: '0 4px 20px rgba(10,132,255,0.35)' }
            : { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.25)', cursor: 'not-allowed' }
          }
        >
          {step < STEPS.length - 1 ? 'Continue →' : "Let's go →"}
        </button>
      </div>
    </div>
  )
}
