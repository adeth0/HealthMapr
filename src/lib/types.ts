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

// ── User Profile ──────────────────────────────────────────────────────────────

export interface UserProfile {
  name: string
  age: number
  height_cm: number
  weight_kg: number
  sex: BiologicalSex
  activity_level: ActivityLevel
  created_at: string
  updated_at: string
}

// ── Daily Health Metric ───────────────────────────────────────────────────────

export interface DailyMetric {
  date: string
  calories_in?: number
  calories_out?: number
  steps?: number
  sleep_hours?: number
  weight_kg?: number
  note?: string
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
