# HealthMapr v2

Your personal health intelligence engine — rebuilt with **Vite + React**, deployed on **GitHub Pages** at **health.kavauralabs.com**.

## Stack

| Layer | Tech |
|-------|------|
| Framework | Vite 5 + React 18 + TypeScript |
| Routing | React Router v6 (HashRouter) |
| Styling | Tailwind CSS v3 + custom Apple Glass CSS |
| Charts | Recharts |
| Storage | localStorage (Supabase-ready) |
| Hosting | GitHub Pages |

## Local Development

```bash
npm install
npm run dev
# → http://localhost:5173
```

## Deploy

```powershell
# Run from project folder in PowerShell:
Set-ExecutionPolicy -Scope Process Bypass; .\DEPLOY.ps1
```

## GitHub Pages Setup (one-time)

1. Go to https://github.com/adeth0/HealthMapr/settings/pages
2. Source → **GitHub Actions**
3. Custom domain → `health.kavauralabs.com`
4. Check **Enforce HTTPS**

## DNS Setup (one-time)

In your domain registrar (kavauralabs.com DNS):

| Type | Host | Value |
|------|------|-------|
| CNAME | health | adeth0.github.io |

## Supabase (optional — future)

1. Create project at https://supabase.com
2. Run `supabase/schema.sql` in SQL Editor
3. Add to GitHub Secrets: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

## Project Structure

```
src/
  pages/         Landing, Dashboard, Log, Trends, Profile, Setup
  components/    GradientMesh, Nav, InsightCard, StatStrip, SparkChart
  lib/
    types.ts     Data models
    storage.ts   localStorage layer
    health/      BMR / TDEE calculations
    engine/      5 insight rules engine
```
