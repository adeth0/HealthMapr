// ─────────────────────────────────────────────────────────────────────────────
// HealthMapr — Health Data Webhook
//
// Receives health data POSTed by an iOS Shortcut and upserts it into
// the daily_metrics table, keyed by device_id.
//
// Deploy:
//   supabase functions deploy health-webhook --no-verify-jwt
//
// Expected body:
//   {
//     "device_id": "uuid",
//     "date": "YYYY-MM-DD",          // optional, defaults to today
//     "steps": 8500,                 // optional
//     "sleep_hours": 7.5,            // optional
//     "weight_kg": 84.2,             // optional
//     "calories_in": 2200            // optional
//   }
// ─────────────────────────────────────────────────────────────────────────────

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGINS = [
  'https://health.kavauralabs.com',
  'http://localhost:5173',
  'http://localhost:4173',
]

function corsHeaders(origin: string) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

serve(async (req: Request) => {
  const origin = req.headers.get('origin') ?? ''

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders(origin) })
  }

  try {
    const body = await req.json()
    const { device_id, date, steps, sleep_hours, weight_kg, calories_in } = body

    if (!device_id || typeof device_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'device_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
      return new Response(
        JSON.stringify({ error: 'Server not configured' }),
        { status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Ensure a profile row exists for this device (required by FK constraint)
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ device_id, updated_at: new Date().toISOString() }, { onConflict: 'device_id', ignoreDuplicates: false })

    if (profileError) {
      console.error('Profile upsert error:', profileError)
      // Non-fatal — proceed anyway (profile may already exist)
    }

    // Build the metric row — only include fields that were actually provided
    const metricDate = typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/) ? date : todayStr()

    const metricRow: Record<string, unknown> = {
      device_id,
      date: metricDate,
      updated_at: new Date().toISOString(),
    }

    if (typeof steps === 'number' && steps >= 0) metricRow.steps = Math.round(steps)
    if (typeof sleep_hours === 'number' && sleep_hours > 0) metricRow.sleep_hours = Math.round(sleep_hours * 10) / 10
    if (typeof weight_kg === 'number' && weight_kg > 0) metricRow.weight_kg = Math.round(weight_kg * 10) / 10
    if (typeof calories_in === 'number' && calories_in > 0) metricRow.calories_in = Math.round(calories_in)

    const { error: metricError } = await supabase
      .from('daily_metrics')
      .upsert(metricRow, { onConflict: 'device_id,date' })

    if (metricError) {
      console.error('Metric upsert error:', metricError)
      return new Response(
        JSON.stringify({ error: 'Failed to save metric', detail: metricError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } }
      )
    }

    return new Response(
      JSON.stringify({ ok: true, date: metricDate }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } }
    )

  } catch (err) {
    console.error('Webhook error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } }
    )
  }
})
