// ─────────────────────────────────────────────────────────────────────────────
// HealthMapr — Strava Integration
//
// OAuth 2.0 flow:
//   1. redirectToStrava()      → user authorises on strava.com
//   2. handleStravaCallback()  → exchanges code via edge function, stores tokens
//   3. syncStravaActivities()  → fetches activities, normalises to DailyMetric[]
//
// Required env:
//   VITE_STRAVA_CLIENT_ID  (public — safe in frontend)
//   SUPABASE_URL           (for calling the strava-auth edge function)
//
// Required Supabase secrets (server-side only):
//   STRAVA_CLIENT_SECRET
// ─────────────────────────────────────────────────────────────────────────────

import type { DailyMetric, WorkoutEntry } from '@/lib/types'
import { getDeviceUserId, saveMetric } from '@/lib/storage'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const STRAVA_CLIENT_ID = import.meta.env.VITE_STRAVA_CLIENT_ID as string | undefined

// localStorage keys
const STRAVA_TOKEN_KEY = 'healthmapr_strava_tokens'

interface StravaTokens {
  access_token: string
  refresh_token: string
  expires_at: number   // Unix timestamp (seconds)
  athlete_id: number
}

// ── Token storage ─────────────────────────────────────────────────────────────

export function getStravaTokens(): StravaTokens | null {
  try {
    const raw = localStorage.getItem(STRAVA_TOKEN_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StravaTokens
  } catch { return null }
}

function saveStravaTokens(tokens: StravaTokens): void {
  localStorage.setItem(STRAVA_TOKEN_KEY, JSON.stringify(tokens))
}

export function clearStravaTokens(): void {
  localStorage.removeItem(STRAVA_TOKEN_KEY)
}

export function isStravaConnected(): boolean {
  return getStravaTokens() !== null
}

// ── OAuth redirect ────────────────────────────────────────────────────────────

export function redirectToStrava(): void {
  if (!STRAVA_CLIENT_ID) {
    alert('VITE_STRAVA_CLIENT_ID is not set. Add it to .env.local.')
    return
  }
  // Redirect back to the root — the callback handler reads ?code= from the URL
  const redirectUri = `${window.location.origin}${window.location.pathname}`
  const params = new URLSearchParams({
    client_id: STRAVA_CLIENT_ID,
    response_type: 'code',
    redirect_uri: redirectUri,
    approval_prompt: 'auto',
    scope: 'activity:read_all',
    state: 'strava_oauth',
  })
  window.location.href = `https://www.strava.com/oauth/authorize?${params}`
}

// ── OAuth callback — call this on app mount when ?code= is in the URL ─────────

export async function handleStravaCallback(): Promise<boolean> {
  const params = new URLSearchParams(window.location.search)
  if (params.get('state') !== 'strava_oauth') return false
  const code = params.get('code')
  const error = params.get('error')
  if (error || !code) return false

  if (!SUPABASE_URL) return false

  // Exchange code via edge function (keeps client_secret server-side)
  const res = await fetch(`${SUPABASE_URL}/functions/v1/strava-auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, device_id: getDeviceUserId() }),
  })

  if (!res.ok) return false

  const data = await res.json()
  if (!data.access_token) return false

  saveStravaTokens({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
    athlete_id: data.athlete?.id ?? 0,
  })

  // Clean the OAuth params from the URL without reloading
  const clean = window.location.href.split('?')[0]
  window.history.replaceState({}, '', clean)

  return true
}

// ── Token refresh ─────────────────────────────────────────────────────────────

async function refreshAccessToken(tokens: StravaTokens): Promise<StravaTokens | null> {
  if (!SUPABASE_URL) return null
  const res = await fetch(`${SUPABASE_URL}/functions/v1/strava-auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: tokens.refresh_token, device_id: getDeviceUserId() }),
  })
  if (!res.ok) return null
  const data = await res.json()
  if (!data.access_token) return null
  const refreshed: StravaTokens = {
    ...tokens,
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? tokens.refresh_token,
    expires_at: data.expires_at,
  }
  saveStravaTokens(refreshed)
  return refreshed
}

async function getValidToken(): Promise<string | null> {
  let tokens = getStravaTokens()
  if (!tokens) return null
  // Refresh if within 5 minutes of expiry
  if (Date.now() / 1000 > tokens.expires_at - 300) {
    tokens = await refreshAccessToken(tokens)
  }
  return tokens?.access_token ?? null
}

// ── Activity type normalisation ───────────────────────────────────────────────

const STRAVA_TYPE_MAP: Record<string, string> = {
  Run: 'Run', VirtualRun: 'Run', TrailRun: 'Run',
  Ride: 'Cycling', VirtualRide: 'Cycling', EBikeRide: 'Cycling', MountainBikeRide: 'Cycling',
  Swim: 'Swimming',
  Walk: 'Walk', Hike: 'Hike',
  WeightTraining: 'Strength', Crossfit: 'HIIT', Workout: 'Workout',
  Yoga: 'Yoga', Pilates: 'Pilates', Rowing: 'Rowing',
  Soccer: 'Football', Tennis: 'Tennis', Basketball: 'Basketball',
  Elliptical: 'Elliptical', StairStepper: 'Stairs',
  NordicSki: 'Skiing', AlpineSki: 'Skiing', Snowboard: 'Snowboarding',
  Kayaking: 'Kayaking', Surfing: 'Surfing',
}

// ── Fetch + normalise activities ──────────────────────────────────────────────

export interface StravaSyncResult {
  synced: number
  error?: string
}

export async function syncStravaActivities(days = 90): Promise<StravaSyncResult> {
  const token = await getValidToken()
  if (!token) return { synced: 0, error: 'Not connected to Strava' }

  const after = Math.floor(Date.now() / 1000) - days * 86400

  try {
    const res = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=200`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    if (!res.ok) {
      if (res.status === 401) clearStravaTokens()
      return { synced: 0, error: `Strava API ${res.status}` }
    }

    const activities: StravaActivity[] = await res.json()

    // Group by date
    const byDate = new Map<string, WorkoutEntry[]>()

    for (const act of activities) {
      const dateStr = act.start_date_local.split('T')[0]
      if (!byDate.has(dateStr)) byDate.set(dateStr, [])

      const workout: WorkoutEntry = {
        type: STRAVA_TYPE_MAP[act.type] ?? act.type,
        duration_min: Math.round(act.moving_time / 60),
        source: 'strava',
        source_id: String(act.id),
      }
      if (act.calories && act.calories > 0) workout.calories = Math.round(act.calories)
      byDate.get(dateStr)!.push(workout)
    }

    // Merge workouts into existing DailyMetric entries
    let synced = 0
    for (const [date, workouts] of byDate.entries()) {
      const totalCaloriesBurned = workouts.reduce((s, w) => s + (w.calories ?? 0), 0)
      const metric: DailyMetric = {
        date,
        workouts,
        ...(totalCaloriesBurned > 0 ? { calories_out: totalCaloriesBurned } : {}),
      }
      saveMetric(metric)
      synced++
    }

    return { synced }
  } catch (err) {
    return { synced: 0, error: err instanceof Error ? err.message : 'Network error' }
  }
}

// ── Strava API types (minimal) ────────────────────────────────────────────────

interface StravaActivity {
  id: number
  name: string
  type: string
  sport_type: string
  start_date_local: string   // ISO 8601 local time
  moving_time: number        // seconds
  elapsed_time: number       // seconds
  distance: number           // metres
  total_elevation_gain: number
  calories: number
  average_heartrate?: number
  max_heartrate?: number
}
