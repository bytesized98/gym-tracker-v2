# Lift Log

A progressive-overload workout tracker with proactive AI coaching, built with
React + TypeScript + Vite + Tailwind, backed by Supabase, deployed to GitHub Pages.

## Architecture

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Charts**: react-chartjs-2 (wraps Chart.js)
- **Data**: Supabase (Postgres + Auth + Row Level Security)
- **AI proxy**: Supabase Edge Function (Deno) — holds the Gemini API key
  server-side so it's never exposed in the browser
- **Hosting**: GitHub Pages, auto-deployed via GitHub Actions on every push to `main`
- **PWA**: vite-plugin-pwa for installable, offline-capable app behavior

## 1. Supabase setup

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste the contents of `supabase/migrations/0001_init.sql` → Run
3. Go to **Settings → API** and copy:
   - Project URL → `VITE_SUPABASE_URL`
   - `anon` `public` key → `VITE_SUPABASE_ANON_KEY`
4. Go to **Authentication → Providers** and make sure **Email** is enabled
   (magic link sign-in is used by default in `useAuth.ts`)

## 2. Edge Function setup (AI Coach)

Install the Supabase CLI if you haven't:

```bash
npm install -g supabase
supabase login
supabase link --project-ref your-project-ref
```

Set your Gemini key as a server-side secret (get a free key at
[aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)):

```bash
supabase secrets set GEMINI_API_KEY=your-gemini-key-here
```

Deploy the function:

```bash
supabase functions deploy ai-coach
```

The function automatically has access to `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` — Supabase injects these for you, no extra setup needed.

## 3. Local development

```bash
cp .env.example .env.local
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local

npm install
npm run dev
```

## 4. Seed your workouts

After signing in once (so a row exists in `auth.users`), either:
- Use the in-app "Manage workouts" panel (gear icon) to add your workouts and exercises, or
- Run the commented insert statements at the bottom of `0001_init.sql` with your actual user id

## 5. Deploy to GitHub Pages

1. Push this repo to GitHub
2. In **Settings → Pages**, set Source to **GitHub Actions**
3. In **Settings → Secrets and variables → Actions**, add two repository secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Edit `vite.config.ts` — change `base: "/lift-log/"` to match your actual repo name
5. Push to `main` — the workflow in `.github/workflows/deploy.yml` builds and deploys automatically

Your app will be live at `https://<your-username>.github.io/<repo-name>/`

## 6. PWA icons

Add `icon-192.png` and `icon-512.png` (square, your app logo) to the `public/`
folder before deploying — referenced by `vite.config.ts`'s PWA manifest.

## What's fully implemented

- Auth (magic link)
- Workouts CRUD (add/rename/delete) with inline confirmation UI (no native `confirm()`/`prompt()`)
- Exercises CRUD per workout
- Entry logging with baseline (last session) comparison and trend display
- Stagnation detection (no volume improvement across last 4 sessions)
- Rotation-based "suggested next workout" (no calendar lock-in)
- AI Coach chat with proactive auto-analysis on open, server-side key, full workout context
- **History tab**: List view (per-exercise recent entries) and **Calendar view**
  (month grid with colored dots per workout, tap a day for full detail)
- **Muscle group / volume breakdown** donut chart with All-time / Last-4-weeks toggle
- **Per-exercise progress chart** (Line, via react-chartjs-2) inside each exercise's
  expandable history panel
- GitHub Actions CI/CD to Pages

## Possible next steps

- Code-split Chart.js with `React.lazy()` if bundle size matters to you — it's the
  largest contributor to the current ~170KB gzipped bundle
- Add a "compare exercises" chart (overlay 2+ exercises on one Line chart) — the
  `useWorkouts` hook already exposes everything needed per exercise
- Push notifications / reminders to log a workout, via a Supabase scheduled function
- Multi-user support if you ever want to share this with training partners (the
  RLS policies already isolate each user's data, so this is mostly a UI question)
