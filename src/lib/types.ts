// ─────────────────────────────────────────────────────────────────────────────
// HealthMapr — Core Data Model
// ─────────────────────────────────────────────────────────────────────────────

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'very_active'

export type BiologicalSex = 'male' | 'female' | 'other'

export type HealthGoal = 'lose_weight' | 'sleep_better' | 'move_more' | 'track_everything'

// ── User Profile ──────────────────────────────────────────────────────────────

export interface UserProfile {
  name: string
  age: number
  height_cm: number
  weight_kg: number
  sex: BiologicalSex
  activity_level: ActivityLevel
  goal?: HealthGoal
  reminder_enabled?: boolean
  reminder_time?: string       // HH:MM, e.g. "20:00"
  setup_complete?: boolean     // false = onboarding not finished
  created_at: string
  updated_at: string
}

// ── Workout Entry ─────────────────────────────────────────────────────────────

export type WorkoutSource = 'apple_health' | 'strava' | 'google_fit' | 'manual'

export interface WorkoutEntry {
  type: string           // e.g. "Run", "Cycling", "Swimming", "Strength"
  duration_min: number   // total duration in minutes
  calories?: number      // calories burned during workout
  source: WorkoutSource
  source_id?: string     // external ID for dedup (e.g. Strava activity ID)
}

// ── Daily Health Metric ───────────────────────────────────────────────────────

export interface DailyMetric {
  date: string
  calories_in?: number
  calories_out?: number  // total active energy burned (all sources)
  steps?: number
  sleep_hours?: number
  weight_kg?: number
  note?: string
  workouts?: WorkoutEntry[]
}

// ── Insight Objects ───────────────────────────────────────────────────────────

export type InsightType =
  | 'recovery'
  | 'energy_balance'
  | 'activity'
  | 'weight'
  | 'fatigue_risk'
  | 'positive'

export type InsightSeverity = 'critical' | 'warning' | 'info' | 'positive'

export interface InsightDataPoint {
  label: string
  value: string
}

export interface InsightObject {
  id: string
  type: InsightType
  severity: InsightSeverity
  headline: string
  message: string
  recommendation: string
  dataPoints: InsightDataPoint[]
  trend?: 'improving' | 'declining' | 'stable'
}

// ── Computed Health Stats ─────────────────────────────────────────────────────

export interface HealthStats {
  tdee: number
  avgCaloriesIn7d: number
  avgSleep7d: number
  avgSteps7d: number
  latestWeight: number | null
  weightChange7d: number | null
  netCalorieBalance7d: number
}

// ── Storage ───────────────────────────────────────────────────────────────────

export interface HealthMaprStore {
  profile: UserProfile | null
  metrics: Record<string, DailyMetric>
  schemaVersion: number
}
