// ─────────────────────────────────────────────────────────────────────────────
// HealthMapr — Supabase Sync Layer
//
// Pulls daily_metrics for this device from Supabase and merges them into
// localStorage. Used after an iOS Shortcut has POSTed fresh health data.
// ─────────────────────────────────────────────────────────────────────────────

import type { DailyMetric } from '@/lib/types'
import { getDeviceUserId, saveMetric } from '@/lib/storage'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

export interface SyncResult {
  synced: number
  error?: string
}

export async function syncFromSupabase(days = 90): Promise<SyncResult> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { synced: 0, error: 'Supabase not configured' }
  }

  const deviceId = getDeviceUserId()

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days + 1)
  const cutoffStr = cutoff.toISOString().split('T')[0]

  const url =
    `${SUPABASE_URL}/rest/v1/daily_metrics` +
    `?device_id=eq.${encodeURIComponent(deviceId)}` +
    `&date=gte.${cutoffStr}` +
    `&order=date.desc` +
    `&limit=90`

  try {
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) {
      const body = await res.text()
      return { synced: 0, error: `Supabase error ${res.status}: ${body}` }
    }

    const rows: Array<{
      date: string
      calories_in?: number
      calories_out?: number
      steps?: number
      sleep_hours?: number
      weight_kg?: number
      note?: string
    }> = await res.json()

    let synced = 0
    for (const row of rows) {
      const metric: DailyMetric = { date: row.date }
      if (row.calories_in != null) metric.calories_in = row.calories_in
      if (row.calories_out != null) metric.calories_out = row.calories_out
      if (row.steps != null) metric.steps = row.steps
      if (row.sleep_hours != null) metric.sleep_hours = row.sleep_hours
      if (row.weight_kg != null) metric.weight_kg = row.weight_kg
      if (row.note) metric.note = row.note
      saveMetric(metric)
      synced++
    }

    return { synced }
  } catch (err) {
    return { synced: 0, error: err instanceof Error ? err.message : 'Network error' }
  }
}

// ── Webhook URL helper (shown to user for Shortcut setup) ─────────────────────

export function getWebhookUrl(): string {
  if (!SUPABASE_URL) return ''
  return `${SUPABASE_URL}/functions/v1/health-webhook`
}

export function getDeviceWebhookPayloadExample(): string {
  const deviceId = getDeviceUserId()
  return JSON.stringify(
    {
      device_id: deviceId,
      date: new Date().toISOString().split('T')[0],
      steps: 8500,
      sleep_hours: 7.5,
      weight_kg: 84.2,
      calories_in: 2200,
    },
    null,
    2
  )
}
