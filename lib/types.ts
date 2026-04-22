// ─────────────────────────────────────────────────────────────────────────────
// HealthMapr — Core Data Model
// ─────────────────────────────────────────────────────────────────────────────

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export type BiologicalSex = "male" | "female" | "other";

// ── User Profile ──────────────────────────────────────────────────────────────

export interface UserProfile {
  /** Full name (display only) */
  name: string;
  /** Age in years */
  age: number;
  /** Height in centimetres */
  height_cm: number;
  /** Current weight in kilograms */
  weight_kg: number;
  /** Biological sex — used for BMR formula */
  sex: BiologicalSex;
  /** Self-reported general activity level */
  activity_level: ActivityLevel;
  /** ISO date string of when the profile was created */
  created_at: string;
  /** ISO date string of last update */
  updated_at: string;
}

// ── Daily Health Metric ───────────────────────────────────────────────────────

export interface DailyMetric {
  /** ISO date string — YYYY-MM-DD, used as primary key */
  date: string;
  /** Total calories consumed (kcal) — optional */
  calories_in?: number;
  /** Total calories burned via activity (kcal) — optional */
  calories_out?: number;
  /** Total steps taken — optional */
  steps?: number;
  /** Sleep duration in decimal hours (e.g. 7.5 = 7h 30m) */
  sleep_hours?: number;
  /** Morning body weight in kilograms — optional */
  weight_kg?: number;
  /** Any free-form note for the day */
  note?: string;
}

// ── Insight Objects ───────────────────────────────────────────────────────────

export type InsightType =
  | "recovery"
  | "energy_balance"
  | "activity"
  | "weight"
  | "fatigue_risk"
  | "positive";

export type InsightSeverity = "critical" | "warning" | "info" | "positive";

export interface InsightDataPoint {
  label: string;
  value: string;
}

export interface InsightObject {
  /** Unique identifier for deduplication */
  id: string;
  /** Category of insight */
  type: InsightType;
  /** Visual severity / colour coding */
  severity: InsightSeverity;
  /** Short headline — the question it answers */
  headline: string;
  /** One sentence explanation with specific numbers */
  message: string;
  /** Concrete, actionable recommendation */
  recommendation: string;
  /** Supporting data points shown in expanded view */
  dataPoints: InsightDataPoint[];
  /** Optional trend direction */
  trend?: "improving" | "declining" | "stable";
}

// ── Computed Health Stats (used in the dashboard stat strip) ──────────────────

export interface HealthStats {
  /** Estimated TDEE for today */
  tdee: number;
  /** Average calories in over last 7 days */
  avgCaloriesIn7d: number;
  /** Average sleep hours over last 7 days */
  avgSleep7d: number;
  /** Average steps over last 7 days */
  avgSteps7d: number;
  /** Most recent logged weight */
  latestWeight: number | null;
  /** 7-day weight change (kg) */
  weightChange7d: number | null;
  /** Net calorie balance (intake − TDEE average) over last 7d */
  netCalorieBalance7d: number;
}

// ── Storage Envelope ──────────────────────────────────────────────────────────

export interface HealthMaprStore {
  profile: UserProfile | null;
  metrics: Record<string, DailyMetric>; // keyed by date string
  schemaVersion: number;
}
