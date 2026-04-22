// ─────────────────────────────────────────────────────────────────────────────
// HealthMapr — Health Calculations (BMR, TDEE, rolling averages)
// ─────────────────────────────────────────────────────────────────────────────

import type { ActivityLevel, BiologicalSex, DailyMetric, UserProfile } from "@/lib/types";

// ── BMR (Mifflin-St Jeor) ─────────────────────────────────────────────────────

/**
 * Calculates Basal Metabolic Rate using Mifflin-St Jeor equation.
 * @param weight_kg  Body weight in kilograms
 * @param height_cm  Height in centimetres
 * @param age        Age in years
 * @param sex        Biological sex
 * @returns          BMR in kcal/day
 */
export function calculateBMR(
  weight_kg: number,
  height_cm: number,
  age: number,
  sex: BiologicalSex
): number {
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

// ── Activity Multipliers ──────────────────────────────────────────────────────

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/**
 * Calculates Total Daily Energy Expenditure.
 * @param bmr            Basal metabolic rate
 * @param activity_level Self-reported activity level
 * @returns              TDEE in kcal/day
 */
export function calculateTDEE(bmr: number, activity_level: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activity_level]);
}

/**
 * Convenience: compute TDEE directly from profile.
 */
export function getTDEEFromProfile(profile: UserProfile): number {
  const bmr = calculateBMR(
    profile.weight_kg,
    profile.height_cm,
    profile.age,
    profile.sex
  );
  return calculateTDEE(bmr, profile.activity_level);
}

// ── Rolling Averages ──────────────────────────────────────────────────────────

/**
 * Computes the average of a numeric field across a set of metrics.
 * Skips entries where the field is undefined.
 */
export function rollingAverage(
  metrics: DailyMetric[],
  field: keyof DailyMetric
): number | null {
  const values = metrics
    .map((m) => m[field])
    .filter((v): v is number => typeof v === "number");
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Computes the average for a field over the last N days of a sorted metric array.
 */
export function last7Average(
  metrics: DailyMetric[],
  field: keyof DailyMetric,
  n = 7
): number | null {
  const recent = [...metrics].sort((a, b) => b.date.localeCompare(a.date)).slice(0, n);
  return rollingAverage(recent, field);
}

/**
 * Returns the previous N-day window (days n..2n), used for week-over-week comparison.
 */
export function prev7Average(
  metrics: DailyMetric[],
  field: keyof DailyMetric,
  n = 7
): number | null {
  const sorted = [...metrics].sort((a, b) => b.date.localeCompare(a.date));
  const prev = sorted.slice(n, n * 2);
  return rollingAverage(prev, field);
}

// ── Week-over-week change ─────────────────────────────────────────────────────

/**
 * Returns percentage change from prev period to current period.
 * Positive = increase, negative = decrease.
 */
export function pctChange(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

// ── Format helpers ────────────────────────────────────────────────────────────

export function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatWeight(kg: number): string {
  return `${kg.toFixed(1)} kg`;
}

export function formatSteps(steps: number): string {
  return steps >= 1000
    ? `${(steps / 1000).toFixed(1)}k`
    : steps.toString();
}

export function formatCalories(kcal: number): string {
  return `${Math.round(kcal)} kcal`;
}

export function signedNumber(n: number, unit = ""): string {
  const sign = n >= 0 ? "+" : "−";
  return `${sign}${Math.abs(n).toFixed(1)}${unit}`;
}
