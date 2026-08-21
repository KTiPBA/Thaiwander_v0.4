# THAIWANDER 🇹🇭

Real-time Thai travel discovery web app — Next.js (App Router), TypeScript, Tailwind CSS, Lucide React, and Supabase (PostgreSQL, Auth, Edge Functions, pg_cron).

**Phase 1 status:** the homepage, search, trending, provinces, and crowd-level badges are now driven entirely by Supabase — no hard-coded demo arrays. Phase 2 (favorites, check-ins, richer profiles) builds on the `favorites` table already in the schema.

## 1. Install dependencies

```bash
npm install
```

## 2. Create a Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Copy `.env.local.example` to `.env.local` and fill in your project URL + anon key (Project Settings → API).

## 3. Run the database migration

In the Supabase SQL Editor, run, in order:

1. `supabase/migrations/20260818_init_thaiwander.sql` — tables (`provinces`, `places`, `daily_place_stats`, `favorites`), enums, indices, RLS policies, and the `determine_crowd_level`, `run_daily_snapshot`, `calculate_daily_trending`, `increment_search_count`, `increment_visit_count` functions.
1b. `supabase/migrations/20260819_add_place_source.sql` — adds the `source` column used to tell AI-suggested places apart from manually seeded ones.
1c. `supabase/migrations/20260821_phase1_seasonal_forecast.sql` — adds `recommended_hours` / `seasonal_forecast` columns and updates `calculate_daily_trending` to also return `baseline_score` (Phase 1: predicted crowd-by-hour and crowd-by-month, shown on the place detail page — only populated for places the AI suggests going forward, not backfilled onto the original seed data).
2. `supabase/seed.sql` — 15 provinces across all 6 regions, 20 real destinations, and 7 days of `daily_place_stats` history so Trending has something to compare against on first load.

(Or use the Supabase CLI: `supabase db push` for the migration, then run the seed file's SQL directly in the SQL Editor — seed data isn't part of `db push`.)

## 4. Enable auth providers

In Supabase → Authentication → Providers, enable **Google** and **Email (OTP / magic link)**. Under Authentication → URL Configuration:

- Site URL: your deployed URL (or `http://localhost:3000` for local dev)
- Redirect URL: `https://YOUR-DOMAIN.com/auth/callback` (and `http://localhost:3000/auth/callback` for local dev)

## 5. Run the app

```bash
npm run dev
```

Open http://localhost:3000 — the homepage, search, trending badges, crowd levels, and province tabs all read from your Supabase database now.

## 6. Deploy the daily-update Edge Function

This keeps `popularity_score`, `crowd_level`, and the trending history fresh every day.

```bash
supabase functions deploy daily-update
```

Then schedule it with `pg_cron` + `pg_net` (run once in the SQL Editor — see the full example, including headers, at the top of `supabase/functions/daily-update/index.ts`):

```sql
select cron.schedule(
  'thaiwander-daily-update',
  '0 6 * * *', -- every day at 06:00
  $$
  select net.http_post(
    url := 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/daily-update',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || 'YOUR_SERVICE_ROLE_KEY'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

You can inspect past runs any time with `select * from cron.job_run_details order by start_time desc;`.

## Project structure

```
app/                     Routes (Home, Search, Login, OAuth callback)
components/              Navbar, Hero, TrendingToday, ProvinceSelector, FeaturedPlaces, PlaceCard
lib/supabase/            client.ts (browser), server.ts (SSR/cookies), types.ts (Place/Province/Trending)
lib/api/places.ts        getTrendingPlacesToday, searchPlaces, getProvincesByRegion, getFeaturedPlaces, getPlaceDetailsById
supabase/migrations/     Schema, enums, indices, RLS, SQL functions
supabase/seed.sql        Provinces + places + 7-day stats history
supabase/functions/      daily-update Edge Function (cron target)
```

## Important — crowd level honesty

`crowd_level` is derived from a weighted score of views, searches, and check-ins already in the database (`determine_crowd_level`) — it is **not** a claim of real visitor counts. Don't relabel it as a live headcount in the UI unless you wire in an actual authorized data source for that.

## Google OAuth

Configure Google OAuth credentials in Supabase Auth according to its current provider setup instructions, then point the redirect URL at `/auth/callback` as noted above.
