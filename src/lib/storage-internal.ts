// ─────────────────────────────────────────────────────────────────────────────
// HealthMapr — Internal localStorage Helpers
//
// Re-exported from storage.ts so supabase-data.ts can import them without
// creating a circular dependency through the public storage API.
// ─────────────────────────────────────────────────────────────────────────────

export {
  readLocalProfile,
  writeLocalProfile,
  readLocalMetrics,
  writeLocalMetric,
} from './storage'
