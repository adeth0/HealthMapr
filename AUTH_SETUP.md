# HealthMapr Auth Setup Guide

Everything you need to activate Google Sign-In, Magic Link email auth, and
per-user Supabase data storage. Takes about 15 minutes.

---

## Step 1 — Run the database migration

1. Open your Supabase project → **SQL Editor** → **New query**
2. Open `supabase/schema-auth.sql` from this repo and paste the entire file
3. Click **Run** (green button)

You should see "Success. No rows returned." — that's correct.
This creates:
- `profiles` table (one row per user)
- `daily_metrics` table (one row per user per day)
- Row Level Security policies (users only see their own data)
- Auto-update triggers for `updated_at`

---

## Step 2 — Enable Email (Magic Link) in Supabase

1. Supabase dashboard → **Authentication** → **Providers**
2. Scroll to **Email** — ensure it is **enabled** (it should be on by default)
3. Under Email → **Confirm email**: set to **disabled** for a smoother magic-link
   flow (the link IS the confirmation). You can re-enable later if you want
   email verification.
4. **Save**

---

## Step 3 — Set up Google OAuth

### 3a — Create a Google Cloud project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click the project dropdown (top-left) → **New Project**
3. Name it `HealthMapr` → **Create**
4. Make sure the new project is selected in the dropdown

### 3b — Configure the OAuth consent screen

1. Left sidebar → **APIs & Services** → **OAuth consent screen**
2. Select **External** → **Create**
3. Fill in:
   - **App name**: `HealthMapr`
   - **User support email**: your email
   - **Developer contact email**: your email
4. Click **Save and Continue** through the Scopes page (no extra scopes needed)
5. On the **Test users** page, add your own email address so you can test while
   the app is in "Testing" mode → **Save and Continue**

> You don't need to publish the app unless you expect non-Google-account users.
> For personal use, "Testing" mode is fine indefinitely.

### 3c — Create OAuth credentials

1. Left sidebar → **APIs & Services** → **Credentials**
2. **+ Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `HealthMapr Web`
5. **Authorised JavaScript origins** — add:
   ```
   https://aonyvtbsvyrnkwsabmug.supabase.co
   ```
6. **Authorised redirect URIs** — add:
   ```
   https://aonyvtbsvyrnkwsabmug.supabase.co/auth/v1/callback
   ```
7. Click **Create**
8. Copy your **Client ID** and **Client Secret** — you'll need them in the next step

---

## Step 4 — Enable Google provider in Supabase

1. Supabase → **Authentication** → **Providers** → **Google**
2. Toggle **Enable** on
3. Paste your **Google Client ID** and **Google Client Secret** from Step 3c
4. **Save**

---

## Step 5 — Update your .env.local (local dev)

Your `.env.local` should already have the Supabase URL and key.
No changes needed for auth — Google OAuth and Magic Link use Supabase's built-in
credentials, not env vars.

```env
VITE_SUPABASE_URL=https://aonyvtbsvyrnkwsabmug.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_BVmEwB0jT4eTSamwhg6f0A_vMU1LrYr
VITE_STRAVA_CLIENT_ID=229446
```

---

## Step 6 — Install the new dependency locally

The auth system uses `@supabase/supabase-js`. Run this in your project folder:

```bash
npm install
```

Then verify the build passes:

```bash
npm run build
```

---

## Step 7 — Update Site URL in Supabase (important!)

1. Supabase → **Authentication** → **URL Configuration**
2. Set **Site URL** to your GitHub Pages URL:
   ```
   https://<your-github-username>.github.io
   ```
   (or your custom domain if you have one set in CNAME)
3. Under **Redirect URLs**, add:
   ```
   https://<your-github-username>.github.io
   https://<your-github-username>.github.io/
   ```
4. **Save**

> This tells Supabase where to send users back after they click a Magic Link or
> complete Google OAuth. Without this, auth redirects will fail.

---

## Step 8 — Push to GitHub

```bash
git push origin main
```

GitHub Actions will run `npm install` (picking up `@supabase/supabase-js`),
build, and deploy. The `VITE_SUPABASE_PUBLISHABLE_KEY` secret is already set
from the previous setup.

---

## How it all works

```
User clicks "Continue with Google"
  → Supabase redirects to Google
  → Google redirects back to your site with #access_token=...
  → Supabase JS picks up the token (detectSessionInUrl: true)
  → onAuthStateChange fires → session established
  → Dashboard calls syncOnLogin → loads their profile from Supabase
  → If new user (setup_complete = false) → redirected to /onboarding
  → User fills in goal, body stats, activity level → saved to Supabase profiles table
  → All future metrics saved to daily_metrics with their user_id
  → On next login: data loads instantly from localStorage cache, syncs from Supabase
```

---

## Troubleshooting

**"redirect_uri_mismatch" error from Google**
→ Double-check your Authorised Redirect URI in Google Cloud Console is exactly:
`https://aonyvtbsvyrnkwsabmug.supabase.co/auth/v1/callback`

**Magic link goes to wrong page / "Email link is invalid or has expired"**
→ Check Site URL + Redirect URLs in Supabase Auth → URL Configuration

**Users see a blank screen after login**
→ Make sure `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are set
correctly in GitHub Actions secrets and `.env.local`

**New users not going to onboarding**
→ Check the `profiles` table — the row's `setup_complete` column should be `false`
for new users until they complete the wizard

---

That's it! Your users can now sign in with Google or a magic email link, and all
their health data is stored privately in Supabase — completely separate from every
other user.
