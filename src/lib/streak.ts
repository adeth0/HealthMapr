// ─────────────────────────────────────────────────────────────────────────────
// HealthMapr — Streak Engine
//
// Rewards consistency, not perfection. A streak is maintained if the user
// logged at least one metric on each of the last N consecutive days.
// Missing today doesn't break the streak until tomorrow — giving a grace window.
// ─────────────────────────────────────────────────────────────────────────────

import type { DailyMetric } from '@/lib/types'

export interface StreakData {
  current: number          // consecutive days with at least one log entry
  longest: number          // all-time best
  loggedToday: boolean     // has user logged anything today?
  milestoneReached: number | null  // if a milestone was just hit, which one
}

const MILESTONES = [3, 7, 14, 30, 60, 100, 365]
const STREAK_KEY = 'healthmapr_streak'

interface StoredStreak {
  longest: number
  lastCelebrated: number   // milestone last shown to avoid repeat toasts
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function yesterdayStr() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

/** A day counts as "logged" if it has any non-null metric value */
function isDayLogged(m: DailyMetric): boolean {
  return (
    m.sleep_hours  !== undefined ||
    m.steps        !== undefined ||
    m.calories_in  !== undefined ||
    m.weight_kg    !== undefined ||
    (m.workouts ?? []).length > 0
  )
}

export function computeStreak(metrics: DailyMetric[]): StreakData {
  const logged = new Set(
    metrics.filter(isDayLogged).map((m) => m.date)
  )

  const today = todayStr()
  const loggedToday = logged.has(today)

  // Walk backwards from yesterday (today is still in progress)
  let streak = loggedToday ? 1 : 0
  let d = new Date()
  if (loggedToday) d.setDate(d.getDate() - 1) // start from yesterday if today is done

  while (true) {
    const ds = d.toISOString().slice(0, 10)
    if (!logged.has(ds)) break
    streak++
    d.setDate(d.getDate() - 1)
    if (streak > 1000) break // safety
  }

  // If today is NOT logged yet, check if yesterday was — streak is still alive
  if (!loggedToday) {
    const yest = yesterdayStr()
    if (!logged.has(yest)) streak = 0  // streak broken
  }

  // Retrieve stored longest + last celebrated
  let stored: StoredStreak = { longest: 0, lastCelebrated: 0 }
  try {
    const raw = localStorage.getItem(STREAK_KEY)
    if (raw) stored = JSON.parse(raw)
  } catch { /* ignore */ }

  const longest = Math.max(stored.longest, streak)

  // Determine if a new milestone was just reached
  let milestoneReached: number | null = null
  for (const m of MILESTONES) {
    if (streak >= m && stored.lastCelebrated < m) {
      milestoneReached = m
      break
    }
  }

  // Persist updated longest + lastCelebrated
  const newStored: StoredStreak = {
    longest,
    lastCelebrated: milestoneReached ?? stored.lastCelebrated,
  }
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify(newStored))
  } catch { /* ignore */ }

  return { current: streak, longest, loggedToday, milestoneReached }
}

/** Friendly label for a streak count */
export function streakLabel(n: number): string {
  if (n === 0) return 'Start your streak today'
  if (n === 1) return '1 day streak'
  return `${n} day streak`
}

/** Emoji flame intensity based on streak length */
export function streakFlame(n: number): string {
  if (n >= 30) return '🔥🔥🔥'
  if (n >= 14) return '🔥🔥'
  if (n >= 3)  return '🔥'
  return '✦'
}
