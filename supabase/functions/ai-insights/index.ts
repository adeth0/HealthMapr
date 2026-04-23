// ─────────────────────────────────────────────────────────────────────────────
// HealthMapr — AI Insights Edge Function
// Proxies requests to the Claude API so the API key never touches the browser.
//
// Deploy:
//   supabase functions deploy ai-insights --no-verify-jwt
//
// Set secret:
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// ─────────────────────────────────────────────────────────────────────────────

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const ALLOWED_ORIGINS = [
  'https://health.kavauralabs.com',
  'http://localhost:5173',
  'http://localhost:4173',
]

const SYSTEM_PROMPT = `You are the HealthMapr Intelligence Engine.
Your role is to:
1. Analyze user health data (sleep, steps, calories, weight, activity)
2. Generate clear, motivating, non-judgmental insights
3. Recommend 1–3 high-impact actions per day
4. Project future outcomes based on trends
5. Educate users with short, useful explanations

Rules:
- Keep responses concise and human
- Avoid overwhelming the user
- Prioritize clarity over technical detail
- Always include: a) Insight  b) Why it matters  c) Action

Tone: Supportive, not preachy. Smart, not robotic. Encouraging but honest.

IMPORTANT: Respond ONLY with valid JSON matching exactly this schema — no markdown, no prose, just raw JSON:
{
  "health_score": number (0–100),
  "summary": "1 sentence overview",
  "insights": [
    {
      "type": "warning | positive | info",
      "title": "",
      "description": "",
      "impact": "",
      "action": ""
    }
  ],
  "next_best_action": "",
  "future_projection": {
    "7_days": "",
    "30_days": "",
    "90_days": ""
  }
}`

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

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders(origin) })
  }

  try {
    const { metrics, profile } = await req.json()

    if (!metrics || !profile) {
      return new Response(
        JSON.stringify({ error: 'Missing metrics or profile' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } }
      )
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY secret not set')
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } }
      )
    }

    // Build a clear, structured user message
    const last7 = metrics.slice(-7)
    const avgSleep = avg(last7, 'sleep_hours')
    const avgSteps = avg(last7, 'steps')
    const avgCalories = avg(last7, 'calories_in')
    const latestWeight = [...metrics].reverse().find((m: Record<string, number>) => m.weight_kg)?.weight_kg

    const userMessage = `
Analyze this user's health data and generate insights.

Profile:
- Name: ${profile.name}
- Age: ${profile.age} years
- Height: ${profile.height_cm} cm
- Weight: ${profile.weight_kg} kg
- Sex: ${profile.sex}
- Activity level: ${profile.activity_level}

Last 7-day averages:
- Sleep: ${avgSleep ? avgSleep.toFixed(1) + 'h/night' : 'no data'}
- Steps: ${avgSteps ? Math.round(avgSteps).toLocaleString() + '/day' : 'no data'}
- Calories in: ${avgCalories ? Math.round(avgCalories) + ' kcal/day' : 'no data'}
- Latest weight: ${latestWeight ? latestWeight + ' kg' : 'no data'}

Raw last 7 days:
${JSON.stringify(last7, null, 2)}

Return only JSON. No markdown fences.`

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!claudeRes.ok) {
      const err = await claudeRes.text()
      console.error('Claude API error:', err)
      return new Response(
        JSON.stringify({ error: 'AI service error', detail: claudeRes.status }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } }
      )
    }

    const claudeData = await claudeRes.json()
    const rawText: string = claudeData.content?.[0]?.text ?? ''

    // Strip markdown fences if Claude wraps it anyway
    const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

    let parsed
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      console.error('Failed to parse Claude response as JSON:', rawText)
      return new Response(
        JSON.stringify({ error: 'Invalid AI response format' }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } }
      )
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    })

  } catch (err) {
    console.error('Edge function error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } }
    )
  }
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function avg(arr: Record<string, number>[], field: string): number | null {
  const vals = arr.map((m) => m[field]).filter((v) => typeof v === 'number' && !isNaN(v))
  if (!vals.length) return null
  return vals.reduce((s, v) => s + v, 0) / vals.length
}
