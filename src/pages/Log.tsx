import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import GradientMesh from '@/components/GradientMesh'
import Nav from '@/components/Nav'
import { getMetricByDate, saveMetric } from '@/lib/storage'
import type { DailyMetric } from '@/lib/types'

interface FieldConfig {
  key: keyof Pick<DailyMetric, 'weight_kg' | 'sleep_hours' | 'steps' | 'calories_in'>
  label: string
  placeholder: string
  unit: string
  icon: string
  min: number
  max: number
  step: number
  hint: string
  color: string
}

const FIELDS: FieldConfig[] = [
  {
    key: 'weight_kg',
    label: 'Weight',
    placeholder: '84.5',
    unit: 'kg',
    icon: '⚖️',
    min: 30,
    max: 300,
    step: 0.1,
    hint: 'Morning weight, after bathroom',
    color: '#64D2FF',
  },
  {
    key: 'sleep_hours',
    label: 'Sleep',
    placeholder: '7.5',
    unit: 'hours',
    icon: '🛌',
    min: 0,
    max: 24,
    step: 0.25,
    hint: 'Total sleep time last night',
    color: '#BF5AF2',
  },
  {
    key: 'steps',
    label: 'Steps',
    placeholder: '8500',
    unit: 'steps',
    icon: '🏃',
    min: 0,
    max: 100000,
    step: 100,
    hint: 'Total steps today',
    color: '#30D158',
  },
  {
    key: 'calories_in',
    label: 'Calories',
    placeholder: '2200',
    unit: 'kcal',
    icon: '⚡',
    min: 0,
    max: 10000,
    step: 50,
    hint: 'Total calories consumed',
    color: '#FFD60A',
  },
]

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

export default function Log() {
  const navigate = useNavigate()
  const [dateStr, setDateStr] = useState(getTodayStr())
  const [values, setValues] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const existing = getMetricByDate(dateStr)
    if (existing) {
      setValues({
        weight_kg: existing.weight_kg?.toString() ?? '',
        sleep_hours: existing.sleep_hours?.toString() ?? '',
        steps: existing.steps?.toString() ?? '',
        calories_in: existing.calories_in?.toString() ?? '',
        note: existing.note ?? '',
      })
    } else {
      setValues({ weight_kg: '', sleep_hours: '', steps: '', calories_in: '', note: '' })
    }
    setSaved(false)
  }, [dateStr])

  function handleChange(key: string, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }))
    setSaved(false)
  }

  function handleSave() {
    setSaving(true)
    const metric: DailyMetric = { date: dateStr }
    const w = parseFloat(values.weight_kg ?? '')
    const s = parseFloat(values.sleep_hours ?? '')
    const st = parseInt(values.steps ?? '')
    const c = parseInt(values.calories_in ?? '')
    if (!isNaN(w) && w > 0) metric.weight_kg = w
    if (!isNaN(s) && s > 0) metric.sleep_hours = s
    if (!isNaN(st) && st > 0) metric.steps = st
    if (!isNaN(c) && c > 0) metric.calories_in = c
    const note = (values.note ?? '').trim()
    if (note) metric.note = note
    saveMetric(metric)
    setTimeout(() => {
      setSaving(false)
      setSaved(true)
      setTimeout(() => navigate('/dashboard'), 900)
    }, 300)
  }

  const hasAnyValue = Object.values(values).some((v) => v.trim() !== '')
  const isToday = dateStr === getTodayStr()

  const shiftDate = (delta: number) => {
    const d = new Date(dateStr)
    d.setDate(d.getDate() + delta)
    const next = d.toISOString().split('T')[0]
    if (next <= getTodayStr()) setDateStr(next)
  }

  return (
    <div className="min-h-dvh pb-32">
      <GradientMesh />

      {/* ── Header ── */}
      <div
        className="px-5 pb-4"
        style={{ paddingTop: 'max(24px, calc(var(--safe-top) + 16px))' }}
      >
        <div className="flex items-center gap-3 mb-1">
          <Link
            to="/dashboard"
            className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
              <path d="M7 1L1 7l6 6" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div>
            <h1 className="text-[24px] font-black text-white/95" style={{ letterSpacing: '-0.02em' }}>
              Quick Log
            </h1>
            <p className="text-[12px] text-white/35">
              {isToday ? 'Today — ' : ''}{formatDateLabel(dateStr)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Date picker ── */}
      <div className="px-5 mb-5 flex items-center gap-2">
        <button
          onClick={() => shiftDate(-1)}
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg text-white/50 transition-all hover:text-white/80"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}
        >
          ‹
        </button>
        <div
          className="flex-1 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', height: 40 }}
        >
          <input
            type="date"
            value={dateStr}
            max={getTodayStr()}
            onChange={(e) => setDateStr(e.target.value)}
            className="text-center text-[13px] font-semibold text-white/70 bg-transparent border-none outline-none"
            style={{ colorScheme: 'dark' }}
          />
        </div>
        <button
          onClick={() => shiftDate(1)}
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg text-white/50 transition-all hover:text-white/80 disabled:opacity-25"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}
          disabled={dateStr >= getTodayStr()}
        >
          ›
        </button>
      </div>

      {/* ── Fields ── */}
      <div className="px-5 flex flex-col gap-3">
        {FIELDS.map((field) => (
          <div
            key={field.key}
            className="glass-card p-4 flex items-center gap-4"
          >
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: `${field.color}12`, border: `1px solid ${field.color}20` }}
            >
              {field.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[13px] font-bold text-white/75">
                  {field.label}
                </label>
                <span
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-lg"
                  style={{ color: field.color, background: `${field.color}12` }}
                >
                  {field.unit}
                </span>
              </div>
              <input
                type="number"
                placeholder={field.placeholder}
                value={values[field.key] ?? ''}
                min={field.min}
                max={field.max}
                step={field.step}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className="text-[20px] font-bold text-white/90 w-full bg-transparent border-none outline-none"
                inputMode="decimal"
              />
              <div className="text-[11px] text-white/25 mt-0.5">{field.hint}</div>
            </div>
            {values[field.key] && (
              <button
                onClick={() => handleChange(field.key, '')}
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white/30 hover:text-white/60 transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {/* ── Note ── */}
      <div className="px-5 mt-3">
        <div className="glass-card p-4">
          <label className="text-[12px] font-bold text-white/40 uppercase tracking-widest block mb-2">
            Note (optional)
          </label>
          <textarea
            placeholder="How did you feel today? Anything unusual?"
            className="text-[14px] text-white/70 min-h-[70px] leading-relaxed w-full bg-transparent border-none outline-none resize-none"
            value={values.note ?? ''}
            onChange={(e) => handleChange('note', e.target.value)}
          />
        </div>
      </div>

      {/* ── Save button ── */}
      <div className="px-5 mt-5">
        <button
          onClick={handleSave}
          disabled={!hasAnyValue || saving || saved}
          className="w-full py-4 rounded-2xl font-bold text-[16px] transition-all duration-200 active:scale-[0.98]"
          style={
            saved
              ? { background: 'rgba(48,209,88,0.15)', border: '1px solid rgba(48,209,88,0.3)', color: '#30D158' }
              : saving
              ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.35)' }
              : hasAnyValue
              ? { background: 'linear-gradient(135deg, #0A84FF, #BF5AF2)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', boxShadow: '0 4px 20px rgba(10,132,255,0.3)' }
              : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.20)', cursor: 'not-allowed' }
          }
        >
          {saved ? '✓  Saved — returning to dashboard' : saving ? 'Saving…' : 'Save Entry'}
        </button>

        {saved && (
          <p className="text-center text-[12px] text-white/30 mt-2 animate-fade-in">
            Your insights will update automatically
          </p>
        )}
      </div>

      <Nav />
    </div>
  )
}
