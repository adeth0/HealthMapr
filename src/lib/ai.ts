// ─────────────────────────────────────────────────────────────────────────────
// HealthMapr — AI Insights Client
// Calls the Supabase Edge Function that proxies Claude API.
// ─────────────────────────────────────────────────────────────────────────────

import type { DailyMetric, UserProfile } from '@/lib/types'

export interface AIInsight {
  type: 'warning' | 'positive' | 'info'
  title: string
  description: string
  impact: string
  action: string
}

export interface AIAnalysis {
  health_score: number
  summary: string
  insights: AIInsight[]
  next_best_action: string
  future_projection: {
    '7_days': string
    '30_days': string
    '90_days': string
  }
}

export type AIStatus = 'idle' | 'loading' | 'success' | 'error' | 'unconfigured'

// ── Cache ─────────────────────────────────────────────────────────────────────
// Cache analysis for 1 hour — Claude API calls cost money, no need to re-run
// on every page reload.

const CACHE_KEY = 'healthmapr_ai_cache'
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

interface CacheEntry {
  data: AIAnalysis
  ts: number
}

function getCached(): AIAnalysis | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const entry: CacheEntry = JSON.parse(raw)
    if (Date.now() - entry.ts > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }
    return entry.data
  } catch {
    return null
  }
}

function setCache(data: AIAnalysis): void {
  try {
    const entry: CacheEntry = { data, ts: Date.now() }
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry))
  } catch {
    // ignore storage errors
  }
}

export function clearAICache(): void {
  localStorage.removeItem(CACHE_KEY)
}

// ── Main fetch ────────────────────────────────────────────────────────────────

export async function fetchAIAnalysis(
  metrics: DailyMetric[],
  profile: UserProfile,
  forceRefresh = false
): Promise<AIAnalysis> {
  // Return cached result if fresh
  if (!forceRefresh) {
    const cached = getCached()
    if (cached) return cached
  }

  // Support both old and new Supabase key naming conventions
  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)
  if (!supabaseUrl) {
    throw new Error('UNCONFIGURED')
  }

  const endpoint = `${supabaseUrl}/functions/v1/ai-insights`

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ metrics, profile }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error ?? `HTTP ${res.status}`)
  }

  const data: AIAnalysis = await res.json()

  // Validate shape
  if (
    typeof data.health_score !== 'number' ||
    !Array.isArray(data.insights) ||
    !data.future_projection
  ) {
    throw new Error('Invalid response shape from AI service')
  }

  setCache(data)
  return data
}
