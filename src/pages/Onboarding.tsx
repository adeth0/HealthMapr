// ─────────────────────────────────────────────────────────────────────────────
// HealthMapr — Onboarding Wizard
//
// A 6-step skip-able setup flow. Steps:
//   0  Welcome
//   1  Your Goal
//   2  Body Stats (age, height, weight, sex)
//   3  Activity & Calories
//   4  Reminders
//   5  All Done
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import GradientMesh from '@/components/GradientMesh'
import { useAuth } from '@/contexts/AuthContext'
import { saveProfileToSupabase } from '@/lib/supabase-data'
import type { HealthGoal, ActivityLevel, BiologicalSex } from '@/lib/types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface WizardState {
  goal: HealthGoal | null
  name: string
  age: string
  sex: BiologicalSex
  height_cm: string
  weight_kg: string
  activity_level: ActivityLevel
  calories_target: string
  reminder_enabled: boolean
  reminder_time: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 6

const GOAL_OPTIONS: { value: HealthGoal; label: string; emoji: string; desc: string }[] = [
  { value: 'lose_weight',       label: 'Lose Weight',        emoji: '⚖️', desc: 'Track calories, weight & habits' },
  { value: 'sleep_better',      label: 'Sleep Better',       emoji: '🌙', desc: 'Optimise recovery & energy' },
  { value: 'move_more',         label: 'Move More',          emoji: '🏃', desc: 'Build activity streaks' },
  { value: 'track_everything',  label: 'Full Tracking',      emoji: '📊', desc: 'Comprehensive health picture' },
]

const SEX_OPTIONS: { value: BiologicalSex; label: string }[] = [
  { value: 'male',   label: 'Male'   },
  { value: 'female', label: 'Female' },
  { value: 'other',  label: 'Other'  },
]

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; desc: string }[] = [
  { value: 'sedentary',   label: 'Sedentary',    desc: 'Desk job, little movement' },
  { value: 'light',       label: 'Lightly Active', desc: '1-3 exercise days / week' },
  { value: 'moderate',    label: 'Moderate',     desc: '3-5 exercise days / week' },
  { value: 'active',      label: 'Active',       desc: '6-7 exercise days / week' },
  { value: 'very_active', label: 'Very Active',  desc: 'Athlete or physical job' },
]

// ── TDEE calculator (Mifflin-St Jeor) ────────────────────────────────────────

function estimateTDEE(state: WizardState): number {
  const age = parseInt(state.age) || 30
  const h   = parseFloat(state.height_cm) || 170
  const w   = parseFloat(state.weight_kg) || 70
  const bmr = state.sex === 'female'
    ? (10 * w) + (6.25 * h) - (5 * age) - 161
    : (10 * w) + (6.25 * h) - (5 * age) + 5
  const multiplier: Record<ActivityLevel, number> = {
    sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
  }
  return Math.round(bmr * (multiplier[state.activity_level] ?? 1.55))
}

// ── Progress Dots ─────────────────────────────────────────────────────────────

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5 justify-center mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="transition-all duration-300"
          style={{
            width:  i === current ? 20 : 6,
            height: 6,
            borderRadius: 3,
            background: i < current
              ? 'rgba(10,132,255,0.5)'
              : i === current
                ? 'linear-gradient(90deg, #0A84FF, #BF5AF2)'
                : 'rgba(255,255,255,0.15)',
          }}
        />
      ))}
    </div>
  )
}

// ── Slide wrapper ─────────────────────────────────────────────────────────────

function Slide({ children, dir }: { children: React.ReactNode; dir: 'forward' | 'back' | 'none' }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const from = dir === 'forward' ? 40 : dir === 'back' ? -40 : 0
    el.style.transform = `translateX(${from}px)`
    el.style.opacity   = '0'
    requestAnimationFrame(() => {
      el.style.transition = 'transform 380ms cubic-bezier(0.34,1.2,0.64,1), opacity 280ms ease'
      el.style.transform  = 'translateX(0)'
      el.style.opacity    = '1'
    })
  }, [dir])
  return <div ref={ref}>{children}</div>
}

// ── Field wrapper ─────────────────────────────────────────────────────────────

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-widest text-white/40 mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-white/30 mt-1.5">{hint}</p>}
    </div>
  )
}

function TextInput({
  value, onChange, placeholder, type = 'text', suffix,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  type?: string
  suffix?: string
}) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-3 rounded-2xl"
      style={{
        background: 'rgba(255,255,255,0.06)',
        border:     '1px solid rgba(255,255,255,0.10)',
      }}
    >
      <input
        type={type}
        inputMode={type === 'number' ? 'decimal' : undefined}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-[15px] text-white/90 placeholder:text-white/25 outline-none"
      />
      {suffix && <span className="text-[13px] text-white/35 shrink-0">{suffix}</span>}
    </div>
  )
}

// ── Steps ─────────────────────────────────────────────────────────────────────

// Step 0 — Welcome
function StepWelcome({ name, onChangeName }: { name: string; onChangeName: (v: string) => void }) {
  return (
    <div className="flex flex-col items-center text-center gap-6">
      <div
        className="w-20 h-20 rounded-[24px] flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, rgba(10,132,255,0.25), rgba(191,90,242,0.2))',
          border:     '1px solid rgba(10,132,255,0.3)',
          boxShadow:  '0 0 40px rgba(10,132,255,0.25)',
        }}
      >
        <img src="/logo.png" alt="HealthMapr" className="w-14 h-14 rounded-[16px]" />
      </div>

      <div>
        <h2 className="text-[26px] font-black text-white/95" style={{ letterSpacing: '-0.03em' }}>
          Welcome to HealthMapr
        </h2>
        <p className="text-[14px] text-white/50 mt-2 max-w-[280px] mx-auto leading-relaxed">
          Let's personalise your experience so the insights actually mean something to you.
        </p>
      </div>

      <div className="w-full mt-2">
        <Field label="What should we call you?">
          <TextInput
            value={name}
            onChange={onChangeName}
            placeholder="Your first name"
          />
        </Field>
      </div>

      <div
        className="w-full rounded-2xl px-4 py-3 text-left"
        style={{ background: 'rgba(10,132,255,0.08)', border: '1px solid rgba(10,132,255,0.15)' }}
      >
        <p className="text-[12px] text-white/50 leading-relaxed">
          <span className="text-[#0A84FF] font-semibold">Takes 2 minutes.</span>{' '}
          Every step is optional — you can skip anything and fill it in later from your profile.
        </p>
      </div>
    </div>
  )
}

// Step 1 — Goal
function StepGoal({ goal, onSelect }: { goal: HealthGoal | null; onSelect: (g: HealthGoal) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <h2 className="text-[22px] font-black text-white/95" style={{ letterSpacing: '-0.02em' }}>
          What's your main goal?
        </h2>
        <p className="text-[13px] text-white/45 mt-1">
          We'll tune insights and recommendations around this.
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        {GOAL_OPTIONS.map(opt => {
          const selected = goal === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => onSelect(opt.value)}
              className="flex items-center gap-4 w-full px-4 py-3.5 rounded-2xl text-left transition-all active-press"
              style={{
                background: selected ? 'rgba(10,132,255,0.12)' : 'rgba(255,255,255,0.04)',
                border: selected ? '1px solid rgba(10,132,255,0.4)' : '1px solid rgba(255,255,255,0.08)',
                boxShadow: selected ? '0 0 20px rgba(10,132,255,0.12)' : 'none',
              }}
            >
              <span className="text-2xl">{opt.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-white/90">{opt.label}</p>
                <p className="text-[12px] text-white/40 mt-0.5">{opt.desc}</p>
              </div>
              <div
                className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center transition-all"
                style={{
                  background: selected ? '#0A84FF' : 'transparent',
                  border: selected ? '2px solid #0A84FF' : '2px solid rgba(255,255,255,0.2)',
                }}
              >
                {selected && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Step 2 — Body Stats
function StepBody({ state, onChange }: {
  state: WizardState
  onChange: (key: keyof WizardState, val: string | BiologicalSex) => void
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <h2 className="text-[22px] font-black text-white/95" style={{ letterSpacing: '-0.02em' }}>
          Body stats
        </h2>
        <p className="text-[13px] text-white/45 mt-1">
          Used for TDEE calculations and accurate insights.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Field label="Age">
          <TextInput
            value={state.age}
            onChange={v => onChange('age', v)}
            placeholder="30"
            type="number"
            suffix="years"
          />
        </Field>

        <Field label="Biological sex">
          <div className="flex gap-2">
            {SEX_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => onChange('sex', opt.value)}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all active-press"
                style={{
                  background: state.sex === opt.value ? 'rgba(10,132,255,0.15)' : 'rgba(255,255,255,0.05)',
                  border: state.sex === opt.value ? '1px solid rgba(10,132,255,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  color: state.sex === opt.value ? '#0A84FF' : 'rgba(255,255,255,0.5)',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Field>

        <div className="flex gap-3">
          <div className="flex-1">
            <Field label="Height">
              <TextInput
                value={state.height_cm}
                onChange={v => onChange('height_cm', v)}
                placeholder="175"
                type="number"
                suffix="cm"
              />
            </Field>
          </div>
          <div className="flex-1">
            <Field label="Weight">
              <TextInput
                value={state.weight_kg}
                onChange={v => onChange('weight_kg', v)}
                placeholder="75"
                type="number"
                suffix="kg"
              />
            </Field>
          </div>
        </div>
      </div>

      <div
        className="rounded-2xl px-4 py-3"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <p className="text-[11px] text-white/30 leading-relaxed">
          🔒 Your body data never leaves your account. It's used locally to compute
          accurate calorie and health estimates.
        </p>
      </div>
    </div>
  )
}

// Step 3 — Activity & Calories
function StepActivity({ state, onChange }: {
  state: WizardState
  onChange: (key: keyof WizardState, val: string | ActivityLevel) => void
}) {
  const tdee = estimateTDEE(state)
  const hasBodyData = !!state.age && !!state.height_cm && !!state.weight_kg

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <h2 className="text-[22px] font-black text-white/95" style={{ letterSpacing: '-0.02em' }}>
          Activity & calories
        </h2>
        <p className="text-[13px] text-white/45 mt-1">
          Helps us calculate your daily energy needs.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="block text-[11px] font-bold uppercase tracking-widest text-white/40 mb-1">
          Activity level
        </label>
        {ACTIVITY_OPTIONS.map(opt => {
          const selected = state.activity_level === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => onChange('activity_level', opt.value)}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-left transition-all active-press"
              style={{
                background: selected ? 'rgba(48,209,88,0.08)' : 'rgba(255,255,255,0.04)',
                border: selected ? '1px solid rgba(48,209,88,0.3)' : '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <div className="flex-1">
                <p className="text-[13px] font-semibold" style={{ color: selected ? '#30D158' : 'rgba(255,255,255,0.8)' }}>
                  {opt.label}
                </p>
                <p className="text-[11px] text-white/35 mt-0.5">{opt.desc}</p>
              </div>
              {selected && (
                <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                  <path d="M1 6L5.5 10.5L15 1" stroke="#30D158" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          )
        })}
      </div>

      {hasBodyData && (
        <div
          className="rounded-2xl px-4 py-3 text-center animate-fade-in"
          style={{ background: 'rgba(10,132,255,0.08)', border: '1px solid rgba(10,132,255,0.15)' }}
        >
          <p className="text-[11px] text-white/40 mb-0.5">Your estimated daily needs (TDEE)</p>
          <p className="text-[22px] font-black text-white/90" style={{ letterSpacing: '-0.02em' }}>
            {tdee.toLocaleString()} <span className="text-[14px] font-normal text-white/50">kcal / day</span>
          </p>
        </div>
      )}

      <Field label="Daily calorie target" hint="Leave blank to use your TDEE estimate above">
        <TextInput
          value={state.calories_target}
          onChange={v => onChange('calories_target', v)}
          placeholder={hasBodyData ? tdee.toString() : '2000'}
          type="number"
          suffix="kcal"
        />
      </Field>
    </div>
  )
}

// Step 4 — Reminders
function StepReminders({ state, onToggle, onTimeChange }: {
  state: WizardState
  onToggle: () => void
  onTimeChange: (t: string) => void
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <h2 className="text-[22px] font-black text-white/95" style={{ letterSpacing: '-0.02em' }}>
          Daily check-in
        </h2>
        <p className="text-[13px] text-white/45 mt-1">
          A nudge keeps your streak alive and data accurate.
        </p>
      </div>

      <button
        onClick={onToggle}
        className="flex items-center gap-4 w-full px-4 py-4 rounded-2xl transition-all active-press"
        style={{
          background: state.reminder_enabled ? 'rgba(10,132,255,0.10)' : 'rgba(255,255,255,0.04)',
          border: state.reminder_enabled ? '1px solid rgba(10,132,255,0.35)' : '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="text-2xl">🔔</div>
        <div className="flex-1 text-left">
          <p className="text-[14px] font-semibold text-white/90">Daily reminder</p>
          <p className="text-[12px] text-white/40 mt-0.5">
            {state.reminder_enabled ? "You'll get a reminder to log your day" : "No reminders — you'll check in manually"}
          </p>
        </div>
        {/* Toggle pill */}
        <div
          className="w-11 h-6 rounded-full relative transition-all duration-300"
          style={{ background: state.reminder_enabled ? '#0A84FF' : 'rgba(255,255,255,0.15)' }}
        >
          <div
            className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-300"
            style={{ left: state.reminder_enabled ? 22 : 2 }}
          />
        </div>
      </button>

      {state.reminder_enabled && (
        <div className="animate-fade-in">
          <Field label="Reminder time">
            <div
              className="flex items-center px-4 py-3 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
            >
              <input
                type="time"
                value={state.reminder_time}
                onChange={e => onTimeChange(e.target.value)}
                className="flex-1 bg-transparent text-[15px] text-white/90 outline-none"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </Field>
        </div>
      )}

      <div
        className="rounded-2xl px-4 py-3"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <p className="text-[11px] text-white/30 leading-relaxed">
          💡 Users who log daily see 3× more useful insights. You can change this anytime in Settings.
        </p>
      </div>
    </div>
  )
}

// Step 5 — Complete
function StepComplete({ name, goal }: { name: string; goal: HealthGoal | null }) {
  const goalEmoji: Record<HealthGoal, string> = {
    lose_weight: '⚖️', sleep_better: '🌙', move_more: '🏃', track_everything: '📊',
  }
  const goalLabel: Record<HealthGoal, string> = {
    lose_weight: 'losing weight', sleep_better: 'sleeping better', move_more: 'moving more', track_everything: 'tracking everything',
  }

  return (
    <div className="flex flex-col items-center text-center gap-6">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
        style={{
          background: 'linear-gradient(135deg, rgba(48,209,88,0.2), rgba(10,132,255,0.15))',
          border:     '1px solid rgba(48,209,88,0.3)',
          boxShadow:  '0 0 40px rgba(48,209,88,0.2)',
        }}
      >
        🎉
      </div>

      <div>
        <h2 className="text-[26px] font-black text-white/95" style={{ letterSpacing: '-0.03em' }}>
          {name ? `You're all set, ${name}!` : "You're all set!"}
        </h2>
        <p className="text-[14px] text-white/50 mt-2 max-w-[280px] mx-auto leading-relaxed">
          {goal
            ? `Your dashboard is tuned for ${goalLabel[goal]}. ${goalEmoji[goal]} Start logging to see your insights come to life.`
            : 'Start logging to see your personalised health insights come to life.'
          }
        </p>
      </div>

      <div className="w-full flex flex-col gap-2.5">
        {[
          { icon: '📋', text: 'Log your first entry today' },
          { icon: '📈', text: 'Check your Trends after 3 days' },
          { icon: '🤖', text: 'AI insights unlock after 7 days' },
        ].map(({ icon, text }) => (
          <div
            key={text}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <span className="text-lg">{icon}</span>
            <p className="text-[13px] text-white/65">{text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Onboarding Component ─────────────────────────────────────────────────

export default function Onboarding() {
  const { user } = useAuth()
  const navigate  = useNavigate()

  const [step, setStep] = useState(0)
  const [dir,  setDir]  = useState<'forward' | 'back' | 'none'>('none')
  const [saving, setSaving] = useState(false)

  const [wizard, setWizard] = useState<WizardState>({
    goal:             null,
    name:             '',
    age:              '',
    sex:              'other',
    height_cm:        '',
    weight_kg:        '',
    activity_level:   'moderate',
    calories_target:  '',
    reminder_enabled: false,
    reminder_time:    '20:00',
  })

  function update<K extends keyof WizardState>(key: K, val: WizardState[K]) {
    setWizard(w => ({ ...w, [key]: val }))
  }

  // ── Navigation ───────────────────────────────────────────────────────────────

  function goNext() {
    if (step < TOTAL_STEPS - 1) {
      setDir('forward')
      setStep(s => s + 1)
    }
  }

  function goBack() {
    if (step > 0) {
      setDir('back')
      setStep(s => s - 1)
    }
  }

  async function finish() {
    setSaving(true)
    if (user) {
      const tdee = estimateTDEE(wizard)
      await saveProfileToSupabase(user.id, {
        name:             wizard.name || 'Friend',
        age:              parseInt(wizard.age) || 25,
        height_cm:        parseFloat(wizard.height_cm) || 170,
        weight_kg:        parseFloat(wizard.weight_kg) || 70,
        sex:              wizard.sex,
        activity_level:   wizard.activity_level,
        goal:             wizard.goal ?? undefined,
        reminder_enabled: wizard.reminder_enabled,
        reminder_time:    wizard.reminder_time,
        setup_complete:   true,
      })
    }
    setSaving(false)
    navigate('/dashboard', { replace: true })
  }

  async function skipAll() {
    if (user) {
      // Save minimal profile so setup_complete is true
      await saveProfileToSupabase(user.id, {
        name:             wizard.name || 'Friend',
        age:              25,
        height_cm:        170,
        weight_kg:        70,
        sex:              'other',
        activity_level:   'moderate',
        goal:             undefined,
        reminder_enabled: false,
        reminder_time:    '20:00',
        setup_complete:   true,
      })
    }
    navigate('/dashboard', { replace: true })
  }

  // ── Step-level CTA logic ─────────────────────────────────────────────────────

  const isLastStep = step === TOTAL_STEPS - 1

  // "Continue" label override per step
  const ctaLabels: Record<number, string> = {
    0: wizard.name ? `Let's go, ${wizard.name}!` : "Let's go",
    5: saving ? 'Saving…' : 'Go to my Dashboard',
  }
  const ctaLabel = ctaLabels[step] ?? 'Continue'

  const handleCta = isLastStep ? finish : goNext

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-dvh flex flex-col items-center justify-start px-5 pt-10 pb-8 relative overflow-hidden">
      <GradientMesh />

      {/* Skip all */}
      {!isLastStep && (
        <button
          onClick={skipAll}
          className="absolute top-6 right-5 text-[13px] text-white/35 hover:text-white/60 transition-colors"
          style={{ paddingTop: 'max(0px, var(--safe-top))' }}
        >
          Skip all
        </button>
      )}

      {/* Back arrow */}
      {step > 0 && !isLastStep && (
        <button
          onClick={goBack}
          className="absolute top-6 left-5 flex items-center gap-1.5 text-[13px] text-white/40 hover:text-white/70 transition-colors"
          style={{ paddingTop: 'max(0px, var(--safe-top))' }}
        >
          <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
            <path d="M6 1L1 6L6 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>
      )}

      {/* Card */}
      <div
        className="w-full max-w-sm rounded-[32px] p-7 mt-8"
        style={{
          background:       'rgba(255,255,255,0.05)',
          border:           '1px solid rgba(255,255,255,0.10)',
          borderTop:        '1px solid rgba(255,255,255,0.18)',
          backdropFilter:   'blur(60px)',
          WebkitBackdropFilter: 'blur(60px)',
          boxShadow:        '0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.10)',
        }}
      >
        <ProgressDots current={step} total={TOTAL_STEPS} />

        <Slide key={step} dir={dir}>
          {step === 0 && (
            <StepWelcome
              name={wizard.name}
              onChangeName={v => update('name', v)}
            />
          )}
          {step === 1 && (
            <StepGoal
              goal={wizard.goal}
              onSelect={g => { update('goal', g); setTimeout(goNext, 200) }}
            />
          )}
          {step === 2 && (
            <StepBody
              state={wizard}
              onChange={(k, v) => update(k, v as WizardState[typeof k])}
            />
          )}
          {step === 3 && (
            <StepActivity
              state={wizard}
              onChange={(k, v) => update(k, v as WizardState[typeof k])}
            />
          )}
          {step === 4 && (
            <StepReminders
              state={wizard}
              onToggle={() => update('reminder_enabled', !wizard.reminder_enabled)}
              onTimeChange={t => update('reminder_time', t)}
            />
          )}
          {step === 5 && (
            <StepComplete name={wizard.name} goal={wizard.goal} />
          )}
        </Slide>

        {/* Step-level footer */}
        <div className="mt-7 flex flex-col gap-2.5">
          <button
            onClick={handleCta}
            disabled={saving}
            className="w-full py-3.5 rounded-2xl font-bold text-[15px] text-white transition-all active-press"
            style={{
              background: 'linear-gradient(135deg, #0A84FF, #BF5AF2)',
              boxShadow:  '0 4px 20px rgba(10,132,255,0.35)',
              opacity:    saving ? 0.7 : 1,
            }}
          >
            {ctaLabel}
          </button>

          {/* Per-step skip (not on last step) */}
          {!isLastStep && step > 0 && (
            <button
              onClick={goNext}
              className="w-full py-2.5 rounded-2xl text-[13px] text-white/35 hover:text-white/55 transition-colors font-medium"
            >
              Skip this step
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
