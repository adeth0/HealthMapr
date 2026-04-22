# HealthMapr v2 — Full Setup Guide
# From zero to https://health.kavauralabs.com

---

## STEP 1 — Push to GitHub (run DEPLOY.ps1)

Open PowerShell in your HealthMapr folder and run:

```powershell
Set-ExecutionPolicy -Scope Process Bypass; .\DEPLOY.ps1
```

This will:
- Run `npm install` (installs Vite, React 18, React Router, Recharts)
- Run `npm run build` (verifies it compiles cleanly)
- Commit all new files to git
- Push to https://github.com/adeth0/HealthMapr (main branch)
- GitHub Actions auto-starts building and deploying

---

## STEP 2 — Enable GitHub Pages (one-time, 2 minutes)

1. Go to: https://github.com/adeth0/HealthMapr/settings/pages
2. **Source** → select `GitHub Actions`
3. **Custom domain** → type `health.kavauralabs.com`
4. Tick **Enforce HTTPS**
5. Click Save

---

## STEP 3 — DNS Record (one-time, in your domain registrar)

Add this record in the kavauralabs.com DNS settings:

| Type  | Host   | Value              | TTL  |
|-------|--------|--------------------|------|
| CNAME | health | adeth0.github.io   | 3600 |

> DNS can take up to 24h to propagate, but usually under 30 min.

---

## STEP 4 — Watch the build

- Actions tab: https://github.com/adeth0/HealthMapr/actions
- Each push to `main` auto-deploys
- Green tick = live at https://health.kavauralabs.com

---

## STEP 5 — Supabase (OPTIONAL — when you want data to sync across devices)

Currently the app stores everything in localStorage. This is great for privacy
and works with no backend. When you want cloud sync (and later auth):

1. Create a free project at https://supabase.com
2. Go to: SQL Editor → New query
3. Paste the contents of `supabase/schema.sql` → Run
4. Go to: Settings → API → copy **Project URL** and **anon public** key
5. In GitHub: Settings → Secrets → Actions → Add:
   - `VITE_SUPABASE_URL` = your Project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon key
6. Also create `.env.local` locally with the same values (for local dev)
7. Re-run DEPLOY.ps1 to push a new build

---

## Local Development

```powershell
npm install
npm run dev
# Opens: http://localhost:5173
```

---

## App Routes (HashRouter)

| URL | Page |
|-----|------|
| `/#/` | Landing page |
| `/#/dashboard` | Insights dashboard |
| `/#/log` | Quick data entry |
| `/#/trends` | 30-day sparkline charts |
| `/#/profile` | Profile + reset |
| `/#/setup` | Onboarding wizard |

---

## What to expect on first load

The app seeds 30 days of realistic mock data (for Martin, 32y)
so the insight engine fires immediately and you can see the design.
You can reset this from Profile → Reset all data, then go through Setup.

---

## Auth (planned for later)

When you're ready to add login (magic link + Google):
- Tell Claude: "Add Supabase Auth with magic link and Google OAuth"
- The schema is already structured for this (auth.uid() ready)
- The landing page has reserved space for the auth buttons
