// ─────────────────────────────────────────────────────────────────────────────
// HealthMapr — Browser Notification Helper
// No push / no service worker — fires when the app is open past the user's
// chosen reminder time and today's data hasn't been logged yet.
// ─────────────────────────────────────────────────────────────────────────────

import type { DailyMetric } from '@/lib/types'

const REMINDER_KEY = 'healthmapr_reminder'

interface ReminderConfig {
  enabled: boolean
  time: string // HH:MM
}

export function getReminderConfig(): ReminderConfig {
  try {
    const raw = localStorage.getItem(REMINDER_KEY)
    if (!raw) return { enabled: false, time: '20:00' }
    return JSON.parse(raw) as ReminderConfig
  } catch {
    return { enabled: false, time: '20:00' }
  }
}

export function saveReminderConfig(config: ReminderConfig): void {
  localStorage.setItem(REMINDER_KEY, JSON.stringify(config))
}

export async function requestPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function checkAndNotify(metrics: DailyMetric[]): void {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  const config = getReminderConfig()
  if (!config.enabled) return

  const today = new Date().toISOString().split('T')[0]

  // Don't fire twice in one day
  const notifiedKey = `healthmapr_notified_${today}`
  if (localStorage.getItem(notifiedKey)) return

  // Only fire after the user's chosen time
  const now = new Date()
  const [hour, minute] = config.time.split(':').map(Number)
  const reminderTime = new Date()
  reminderTime.setHours(hour, minute, 0, 0)
  if (now < reminderTime) return

  // Don't fire if today is already logged
  const alreadyLogged = metrics.some((m) => m.date === today)
  if (alreadyLogged) return

  new Notification('HealthMapr', {
    body: "You haven't logged today yet — takes 30 seconds 💪",
    icon: '/favicon.ico',
    tag: 'healthmapr-reminder',
  })

  localStorage.setItem(notifiedKey, '1')
}
