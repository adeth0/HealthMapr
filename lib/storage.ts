// ─────────────────────────────────────────────────────────────────────────────
// HealthMapr — localStorage Data Layer
// ─────────────────────────────────────────────────────────────────────────────

import type {
  DailyMetric,
  HealthMaprStore,
  UserProfile,
} from "@/lib/types";

const STORAGE_KEY = "healthmapr_v1";
const SCHEMA_VERSION = 1;

// ── Helpers ───────────────────────────────────────────────────────────────────

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function getDefaultStore(): HealthMaprStore {
  return {
    profile: null,
    metrics: {},
    schemaVersion: SCHEMA_VERSION,
  };
}

function readStore(): HealthMaprStore {
  if (!isBrowser()) return getDefaultStore();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultStore();
    const parsed = JSON.parse(raw) as HealthMaprStore;
    // Basic version migration hook — extend as schema evolves
    if (parsed.schemaVersion !== SCHEMA_VERSION) {
      return getDefaultStore();
    }
    return parsed;
  } catch {
    return getDefaultStore();
  }
}

function writeStore(store: HealthMaprStore): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

// ── Profile ───────────────────────────────────────────────────────────────────

export function getProfile(): UserProfile | null {
  return readStore().profile;
}

export function saveProfile(profile: Omit<UserProfile, "created_at" | "updated_at">): UserProfile {
  const store = readStore();
  const now = new Date().toISOString();
  const full: UserProfile = {
    ...profile,
    created_at: store.profile?.created_at ?? now,
    updated_at: now,
  };
  store.profile = full;
  writeStore(store);
  return full;
}

// ── Daily Metrics ─────────────────────────────────────────────────────────────

export function getMetrics(): DailyMetric[] {
  const store = readStore();
  return Object.values(store.metrics).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}

export function getMetricByDate(date: string): DailyMetric | null {
  const store = readStore();
  return store.metrics[date] ?? null;
}

/** Upserts a metric for a given date (merges partial updates) */
export function saveMetric(metric: DailyMetric): DailyMetric {
  const store = readStore();
  const existing = store.metrics[metric.date] ?? {};
  store.metrics[metric.date] = { ...existing, ...metric };
  writeStore(store);
  return store.metrics[metric.date];
}

/** Returns metrics for the last N days (inclusive of today) */
export function getRecentMetrics(days: number): DailyMetric[] {
  const all = getMetrics();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days + 1);
  const cutoffStr = cutoff.toISOString().split("T")[0];
  return all.filter((m) => m.date >= cutoffStr);
}

/** Returns metrics sorted newest-first */
export function getMetricsDescending(): DailyMetric[] {
  return getMetrics().reverse();
}

// ── Store management ──────────────────────────────────────────────────────────

export function clearAllData(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(STORAGE_KEY);
}

export function hasProfile(): boolean {
  return getProfile() !== null;
}

// ── Mock Data Seeder ──────────────────────────────────────────────────────────
// Generates 30 days of realistic data with built-in patterns so the insight
// engine fires meaningful cards on first load.

export function seedMockData(): void {
  if (!isBrowser()) return;
  const existing = readStore();
  // Only seed if completely fresh
  if (existing.profile !== null || Object.keys(existing.metrics).length > 0) {
    return;
  }

  // Profile
  const profile: UserProfile = {
    name: "Martin",
    age: 32,
    height_cm: 180,
    weight_kg: 84.5,
    sex: "male",
    activity_level: "moderate",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Generate 30 days of metrics with realistic patterns:
  // - Sleep: trending downward over last 10 days (recovery warning)
  // - Steps: dropped ~30% in last week (activity insight)
  // - Calories: slight deficit vs ~2700 TDEE
  // - Weight: slow downward trend with noise
  const metrics: Record<string, DailyMetric> = {};
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];

    // Sleep: 7.5h average early on, trending to ~5.5h in last 10 days
    const sleepBase = i > 10 ? 7.5 : 5.8;
    const sleepNoise = (Math.random() - 0.5) * 1.2;
    const sleep_hours = Math.max(3, Math.round((sleepBase + sleepNoise) * 10) / 10);

    // Steps: ~9000/day early, dropping to ~6200 in last 7 days
    const stepsBase = i > 7 ? 9000 : 6200;
    const stepsNoise = Math.floor((Math.random() - 0.5) * 2000);
    const steps = Math.max(1000, stepsBase + stepsNoise);

    // Calories: hovering around 2200–2350 (below ~2700 TDEE)
    const calBase = 2250;
    const calNoise = Math.floor((Math.random() - 0.5) * 300);
    const calories_in = calBase + calNoise;

    // Weight: starts at 86 kg, slowly declining with noise
    const weightBase = 86 - (29 - i) * 0.04;
    const weightNoise = (Math.random() - 0.5) * 0.4;
    const weight_kg = Math.round((weightBase + weightNoise) * 10) / 10;

    metrics[dateStr] = {
      date: dateStr,
      calories_in,
      steps,
      sleep_hours,
      weight_kg,
    };
  }

  const store: HealthMaprStore = {
    profile,
    metrics,
    schemaVersion: SCHEMA_VERSION,
  };

  writeStore(store);
}
