// ─────────────────────────────────────────────────────────────────────────────
// HealthMapr — Strava OAuth Token Exchange
//
// Handles both initial code exchange and refresh token flow.
//
// Required Supabase secrets:
//   STRAVA_CLIENT_ID
//   STRAVA_CLIENT_SECRET
//
// Deploy:
//   supabase functions deploy strava-auth --no-verify-jwt
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

serve(async (req: Request) => {
  const origin = req.headers.get('origin') ?? ''

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) })
  }
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders(origin) })
  }

  const clientId = Deno.env.get('STRAVA_CLIENT_ID')
  const clientSecret = Deno.env.get('STRAVA_CLIENT_SECRET')

  if (!clientId || !clientSecret) {
    return new Response(
      JSON.stringify({ error: 'Strava credentials not configured' }),
      { status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } }
    )
  }

  try {
    const body = await req.json()
    const { code, refresh_token, device_id } = body

    if (!code && !refresh_token) {
      return new Response(
        JSON.stringify({ error: 'Provide code (initial auth) or refresh_token' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } }
      )
    }

    // Build the token exchange payload
    const payload: Record<string, string> = {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: code ? 'authorization_code' : 'refresh_token',
    }
    if (code) payload.code = code
    if (refresh_token) payload.refresh_token = refresh_token

    const stravaRes = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!stravaRes.ok) {
      const err = await stravaRes.text()
      console.error('Strava token error:', err)
      return new Response(
        JSON.stringify({ error: 'Strava auth failed', detail: stravaRes.status }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } }
      )
    }

    const tokenData = await stravaRes.json()

    // Persist tokens in Supabase integrations table if device_id provided
    if (device_id) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey)
        // Ensure profile exists
        await supabase.from('profiles').upsert(
          { device_id, updated_at: new Date().toISOString() },
          { onConflict: 'device_id', ignoreDuplicates: false }
        )
        // Store integration
        await supabase.from('integrations').upsert({
          device_id,
          source: 'strava',
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expires: tokenData.expires_at,
          scope: tokenData.scope ?? 'activity:read_all',
          athlete_id: String(tokenData.athlete?.id ?? ''),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'device_id,source' })
      }
    }

    // Return the full token response to the frontend
    return new Response(JSON.stringify(tokenData), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    })

  } catch (err) {
    console.error('strava-auth error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } }
    )
  }
})
