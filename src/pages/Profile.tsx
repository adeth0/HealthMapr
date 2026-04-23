import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import GradientMesh from '@/components/GradientMesh'
import Nav from '@/components/Nav'
import LoadingSpinner from '@/components/LoadingSpinner'
import { clearAllData, getProfile, getMetrics, hasProfile, saveProfile, seedMockData } from '@/lib/storage'
import { calculateBMR, calculateTDEE } from '@/lib/health/calculations'
import { getReminderConfig, saveReminderConfig, requestPermission } from '@/lib/notifications'
import type { ActivityLevel, BiologicalSex, UserProfile } from '@/lib/types'

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary',
  light: 'Lightly active',
  moderate: 'Moderately active',
  active: 'Very active',
  very_active: 'Athlete',
}

export default function Profile() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [saved, setSaved] = useState(false)
  const [metricCount, setMetricCount] = useState(0)

  // Edit state
  const [eName, setEName] = useState('')
  const [eAge, setEAge] = useState('')
  const [eHeight, setEHeight] = useState('')
  const [eWeight, setEWeight] = useState('')
  const [eSex, setESex] = useState<BiologicalSex>('male')
  const [eActivity, setEActivity] = useState<ActivityLevel>('moderate')

  // Reminder state
  const [reminderEnabled, setReminderEnabled] = useState(false)
  const [reminderTime, setReminderTime] = useState('20:00')
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default')

  useEffect(() => {
    seedMockData()
    if (!hasProfile()) { navigate('/setup', { replace: true }); return }
    const p = getProfile()!
    setProfile(p)
    setMetricCount(getMetrics().length)
    setEName(p.name)
    setEAge(p.age.toString())
    setEHeight(p.height_cm.toString())
    setEWeight(p.weight_kg.toString())
    setESex(p.sex)
    setEActivity(p.activity_level)
    // Load reminder config
    const reminder = getReminderConfig()
    setReminderEnabled(reminder.enabled)
    setReminderTime(reminder.time)
    if ('Notification' in window) setPermissionState(Notification.permission)
    setLoading(false)
  }, [navigate])

  if (loading || !profile) return <LoadingSpinner fullScreen />

  const bmr = calculateBMR(profile.weight_kg, profile.height_cm, profile.age, profile.sex)
  const tdee = calculateTDEE(bmr, profile.activity_level)

  function handleSave() {
    if (!eName || !eAge || !eHeight || !eWeight) return
    const updated = saveProfile({
      name: eName,
      age: parseInt(eAge),
      height_cm: parseFloat(eHeight),
      weight_kg: parseFloat(eWeight),
      sex: eSex,
      activity_level: eActivity,
    })
    setProfile(updated)
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleReset() {
    clearAllData()
    navigate('/', { replace: true })
  }

  async function handleReminderToggle() {
    const next = !reminderEnabled
    if (next && permissionState !== 'granted') {
      const granted = await requestPermission()
      if (!granted) return
      setPermissionState('granted')
    }
    setReminderEnabled(next)
    saveReminderConfig({ enabled: next, time: reminderTime })
  }

  function handleReminderTimeChange(t: string) {
    setReminderTime(t)
    saveReminderConfig({ enabled: reminderEnabled, time: t })
  }

  const inputClass = "w-full rounded-xl px-3 py-2.5 text-[14px] font-semibold text-white/80 bg-transparent focus:outline-none"
  const inputWrap = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 12 }

  return (
    <div className="min-h-dvh pb-32">
      <GradientMesh />

      {/* ── Header ── */}
      <div
        className="px-5 pb-6"
        style={{ paddingTop: 'max(24px, calc(var(--safe-top) + 16px))' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] text-white/35 mb-0.5">Your account</p>
            <h1 className="text-[28px] font-black text-white/95" style={{ letterSpacing: '-0.02em' }}>Profile</h1>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 rounded-2xl text-[13px] font-bold text-[#0A84FF] transition-all hover:bg-white/5"
              style={{ border: '1px solid rgba(10,132,255,0.25)', background: 'rgba(10,132,255,0.08)' }}
            >
              Edit
            </button>
          )}
        </div>
        {saved && (
          <div className="mt-3 px-4 py-2.5 rounded-2xl text-[13px] font-semibold text-[#30D158] animate-fade-in"
            style={{ background: 'rgba(48,209,88,0.10)', border: '1px solid rgba(48,209,88,0.22)' }}>
            ✓ Profile updated
          </div>
        )}
      </div>

      {/* ── Avatar + summary ── */}
      <div className="px-5 mb-5">
        <div className="glass-card p-5 flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-3xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(10,132,255,0.3), rgba(191,90,242,0.3))', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-[20px] font-bold text-white/90 mb-0.5">{profile.name}</div>
            <div className="text-[13px] text-white/45">
              {profile.age}y · {profile.height_cm}cm · {profile.weight_kg}kg
            </div>
            <div className="text-[12px] text-white/30 mt-0.5">
              {ACTIVITY_LABELS[profile.activity_level]}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="px-5 mb-5">
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: '🔥', label: 'BMR', value: `${Math.round(bmr)}`, unit: 'kcal/day' },
            { icon: '⚡', label: 'TDEE', value: `${tdee}`, unit: 'kcal/day' },
            { icon: '📅', label: 'Days logged', value: `${metricCount}`, unit: 'entries' },
          ].map((s) => (
            <div
              key={s.label}
              className="glass-card p-4 text-center"
            >
              <div className="text-xl mb-1.5">{s.icon}</div>
              <div className="text-[18px] font-black text-white/90 leading-none mb-0.5">{s.value}</div>
              <div className="text-[10px] text-white/35 font-semibold uppercase tracking-wide">{s.label}</div>
              <div className="text-[10px] text-white/20 mt-0.5">{s.unit}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Edit form ── */}
      {editing && (
        <div className="px-5 mb-5 animate-slide-up">
          <div className="glass-card p-5">
            <h2 className="text-[16px] font-bold text-white/80 mb-4">Edit Profile</h2>
            <div className="flex flex-col gap-3">
              {/* Name */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-white/35 mb-1.5 block">Name</label>
                <div style={inputWrap}>
                  <input className={inputClass} value={eName} onChange={(e) => setEName(e.target.value)} placeholder="Your name" />
                </div>
              </div>

              {/* Age / Height / Weight */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Age', val: eAge, set: setEAge, unit: 'yr', type: 'number' },
                  { label: 'Height', val: eHeight, set: setEHeight, unit: 'cm', type: 'number' },
                  { label: 'Weight', val: eWeight, set: setEWeight, unit: 'kg', type: 'number' },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-1 block">{f.label}</label>
                    <div style={inputWrap} className="flex items-center gap-1 px-3 py-2.5">
                      <input
                        type={f.type}
                        className="flex-1 text-[14px] font-semibold text-white/80 bg-transparent border-none outline-none w-full"
                        value={f.val}
                        onChange={(e) => f.set(e.target.value)}
                        inputMode="decimal"
                      />
                      <span className="text-[10px] text-white/30">{f.unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sex */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-white/35 mb-1.5 block">Sex</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['male', 'female', 'other'] as BiologicalSex[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setESex(s)}
                      className="py-2.5 rounded-xl text-[13px] font-semibold transition-all capitalize"
                      style={eSex === s
                        ? { background: 'rgba(10,132,255,0.2)', border: '1px solid rgba(10,132,255,0.4)', color: '#0A84FF' }
                        : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.45)' }
                      }
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Activity */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-white/35 mb-1.5 block">Activity Level</label>
                <div className="flex flex-col gap-1.5">
                  {(Object.entries(ACTIVITY_LABELS) as [ActivityLevel, string][]).map(([k, v]) => (
                    <button
                      key={k}
                      onClick={() => setEActivity(k)}
                      className="w-full text-left px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all"
                      style={eActivity === k
                        ? { background: 'rgba(10,132,255,0.15)', border: '1px solid rgba(10,132,255,0.35)', color: '#0A84FF' }
                        : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.50)' }
                      }
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 py-3 rounded-2xl text-[14px] font-semibold text-white/50 transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 rounded-2xl text-[14px] font-bold text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, #0A84FF, #BF5AF2)', boxShadow: '0 4px 16px rgba(10,132,255,0.3)' }}
                >
                  Save changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Daily Reminder ── */}
      <div className="px-5 mb-5">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="text-[15px] font-bold text-white/85">Daily reminder</h3>
              <p className="text-[12px] text-white/40 mt-0.5">
                Get a notification when you haven't logged yet
              </p>
            </div>
            {/* Toggle */}
            <button
              onClick={handleReminderToggle}
              className="relative w-12 h-7 rounded-full transition-all duration-300 flex-shrink-0"
              style={reminderEnabled
                ? { background: '#30D158' }
                : { background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.16)' }
              }
            >
              <span
                className="absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white shadow-sm transition-all duration-300"
                style={{ left: reminderEnabled ? 'calc(100% - 25px)' : '3px' }}
              />
            </button>
          </div>

          {reminderEnabled && (
            <div className="mt-4 animate-fade-in">
              <label className="text-[11px] font-bold uppercase tracking-widest text-white/35 mb-1.5 block">
                Remind me at
              </label>
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
              >
                <span className="text-lg">🔔</span>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => handleReminderTimeChange(e.target.value)}
                  className="flex-1 text-[16px] font-bold text-white/80 bg-transparent border-none outline-none"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              {permissionState === 'denied' && (
                <p className="text-[11px] text-[#FF453A] mt-2">
                  Notifications are blocked. Enable them in your browser settings.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Danger zone ── */}
      <div className="px-5">
        <div
          className="glass-card p-5"
          style={{ border: '1px solid rgba(255,69,58,0.18)', background: 'rgba(255,69,58,0.06)' }}
        >
          <h3 className="text-[14px] font-bold text-[#FF453A] mb-1">Reset all data</h3>
          <p className="text-[12px] text-white/40 mb-4 leading-relaxed">
            This will permanently delete your profile and all logged metrics. This cannot be undone.
          </p>

          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-4 py-2.5 rounded-xl text-[13px] font-bold text-[#FF453A] transition-all"
              style={{ background: 'rgba(255,69,58,0.10)', border: '1px solid rgba(255,69,58,0.25)' }}
            >
              Reset everything
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white/50"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white"
                style={{ background: '#FF453A' }}
              >
                Yes, reset
              </button>
            </div>
          )}
        </div>
      </div>

      <Nav />
    </div>
  )
}
