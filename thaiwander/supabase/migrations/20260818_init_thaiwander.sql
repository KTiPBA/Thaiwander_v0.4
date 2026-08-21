-- THAIWANDER Phase 1 — Core Database Architecture
-- Run this in the Supabase SQL Editor, or via `supabase db push` / migration CLI.

create extension if not exists pgcrypto;

-- ────────────────────────────────────────────────────────────
-- ENUMS
-- ────────────────────────────────────────────────────────────
do $$ begin
  create type crowd_level_enum as enum ('low', 'medium', 'high', 'packed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type place_status_enum as enum ('active', 'inactive');
exception when duplicate_object then null; end $$;

do $$ begin
  create type region_enum as enum ('เหนือ', 'กลาง', 'อีสาน', 'ตะวันออก', 'ตะวันตก', 'ใต้');
exception when duplicate_object then null; end $$;

-- ────────────────────────────────────────────────────────────
-- TABLE: provinces
-- ────────────────────────────────────────────────────────────
create table if not exists public.provinces (
  id uuid primary key default gen_random_uuid(),
  name_th text not null,
  name_en text,
  slug text not null unique,
  region region_enum not null,
  cover_image_url text,
  description text,
  place_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
-- TABLE: places
-- ────────────────────────────────────────────────────────────
create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  province_id uuid not null references public.provinces(id) on delete cascade,
  district text,
  category text not null default 'ทั่วไป',
  description text,
  image_url text,
  latitude double precision,
  longitude double precision,
  rating numeric(2,1) not null default 0,
  popularity_score numeric not null default 0,
  crowd_level crowd_level_enum not null default 'low',
  visit_count integer not null default 0,
  search_count integer not null default 0,
  checkin_count integer not null default 0,
  status place_status_enum not null default 'active',
  source text not null default 'manual',
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_places_province on public.places(province_id);
create index if not exists idx_places_status on public.places(status);
create index if not exists idx_places_popularity on public.places(popularity_score desc);
create index if not exists idx_places_crowd_level on public.places(crowd_level);

-- ────────────────────────────────────────────────────────────
-- TABLE: daily_place_stats  (one row per place per day)
-- ────────────────────────────────────────────────────────────
create table if not exists public.daily_place_stats (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  date date not null default current_date,
  views integer not null default 0,
  searches integer not null default 0,
  checkins integer not null default 0,
  crowd_level text,
  popularity_score numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (place_id, date)
);

create index if not exists idx_daily_stats_place_date on public.daily_place_stats(place_id, date desc);
create index if not exists idx_daily_stats_date on public.daily_place_stats(date desc);

-- ────────────────────────────────────────────────────────────
-- TABLE: favorites (Phase 2 — kept here so auth already has somewhere to write)
-- ────────────────────────────────────────────────────────────
create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  place_id uuid not null references public.places(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, place_id)
);

-- ────────────────────────────────────────────────────────────
-- FUNCTION: determine_crowd_level
-- Weighted engagement score → crowd level. Searches and check-ins are
-- stronger intent signals than raw views, so they carry more weight.
-- ────────────────────────────────────────────────────────────
create or replace function public.determine_crowd_level(
  p_views integer,
  p_searches integer,
  p_checkins integer
) returns crowd_level_enum
language sql
immutable
as $$
  select case
    when (coalesce(p_views, 0) * 1.0 + coalesce(p_searches, 0) * 2.0 + coalesce(p_checkins, 0) * 3.0) >= 150 then 'packed'::crowd_level_enum
    when (coalesce(p_views, 0) * 1.0 + coalesce(p_searches, 0) * 2.0 + coalesce(p_checkins, 0) * 3.0) >= 60  then 'high'::crowd_level_enum
    when (coalesce(p_views, 0) * 1.0 + coalesce(p_searches, 0) * 2.0 + coalesce(p_checkins, 0) * 3.0) >= 20  then 'medium'::crowd_level_enum
    else 'low'::crowd_level_enum
  end;
$$;

-- ────────────────────────────────────────────────────────────
-- FUNCTION: run_daily_snapshot
-- Called once a day (see supabase/functions/daily-update). Snapshots the
-- current cumulative counters on `places` into `daily_place_stats` for
-- `target_date`, recomputes popularity_score + crowd_level, and writes
-- the fresh values back onto `places`.
-- ────────────────────────────────────────────────────────────
create or replace function public.run_daily_snapshot(target_date date default current_date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  p record;
  v_score numeric;
  v_crowd crowd_level_enum;
begin
  for p in select * from public.places where status = 'active' loop
    v_score := round(
      (p.visit_count * 0.5) + (p.search_count * 1.5) + (p.checkin_count * 3.0),
      2
    );
    v_crowd := public.determine_crowd_level(p.visit_count, p.search_count, p.checkin_count);

    insert into public.daily_place_stats (place_id, date, views, searches, checkins, crowd_level, popularity_score)
    values (p.id, target_date, p.visit_count, p.search_count, p.checkin_count, v_crowd::text, v_score)
    on conflict (place_id, date)
    do update set
      views = excluded.views,
      searches = excluded.searches,
      checkins = excluded.checkins,
      crowd_level = excluded.crowd_level,
      popularity_score = excluded.popularity_score;

    update public.places
    set popularity_score = v_score,
        crowd_level = v_crowd,
        last_updated = now()
    where id = p.id;
  end loop;
end;
$$;

-- ────────────────────────────────────────────────────────────
-- FUNCTION: calculate_daily_trending
-- Compares `target_date` popularity_score against yesterday and the
-- 7-day average, returning % growth for each place with a snapshot.
-- ────────────────────────────────────────────────────────────
create or replace function public.calculate_daily_trending(target_date date default current_date)
returns table (
  place_id uuid,
  name text,
  slug text,
  province_name text,
  image_url text,
  crowd_level text,
  popularity_score numeric,
  trend_vs_yesterday numeric,
  trend_vs_7d numeric
)
language sql
stable
as $$
  with today as (
    select * from public.daily_place_stats where date = target_date
  ),
  yesterday as (
    select * from public.daily_place_stats where date = target_date - 1
  ),
  last_7d as (
    select place_id, avg(popularity_score) as avg_score
    from public.daily_place_stats
    where date >= target_date - 7 and date < target_date
    group by place_id
  )
  select
    t.place_id,
    pl.name,
    pl.slug,
    pr.name_th as province_name,
    pl.image_url,
    t.crowd_level,
    t.popularity_score,
    case
      when y.popularity_score is null or y.popularity_score = 0 then 0
      else round(((t.popularity_score - y.popularity_score) / y.popularity_score) * 100, 1)
    end as trend_vs_yesterday,
    case
      when l7.avg_score is null or l7.avg_score = 0 then 0
      else round(((t.popularity_score - l7.avg_score) / l7.avg_score) * 100, 1)
    end as trend_vs_7d
  from today t
  join public.places pl on pl.id = t.place_id
  join public.provinces pr on pr.id = pl.province_id
  left join yesterday y on y.place_id = t.place_id
  left join last_7d l7 on l7.place_id = t.place_id
  where pl.status = 'active'
  order by t.popularity_score desc;
$$;

-- ────────────────────────────────────────────────────────────
-- RPC HELPERS: safe counters callable from the anon/browser client
-- (SECURITY DEFINER so anonymous visitors can increment engagement
-- counters without needing direct UPDATE grants on `places`).
-- ────────────────────────────────────────────────────────────
create or replace function public.increment_search_count(p_place_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.places set search_count = search_count + 1 where id = p_place_id;
$$;

create or replace function public.increment_visit_count(p_place_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.places set visit_count = visit_count + 1 where id = p_place_id;
$$;

-- ────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────
alter table public.provinces enable row level security;
alter table public.places enable row level security;
alter table public.daily_place_stats enable row level security;
alter table public.favorites enable row level security;

drop policy if exists "public read provinces" on public.provinces;
create policy "public read provinces" on public.provinces for select using (true);

drop policy if exists "public read places" on public.places;
create policy "public read places" on public.places for select using (status = 'active');

drop policy if exists "public read daily stats" on public.daily_place_stats;
create policy "public read daily stats" on public.daily_place_stats for select using (true);

drop policy if exists "users read own favorites" on public.favorites;
create policy "users read own favorites" on public.favorites for select using (auth.uid() = user_id);

drop policy if exists "users insert own favorites" on public.favorites;
create policy "users insert own favorites" on public.favorites for insert with check (auth.uid() = user_id);

drop policy if exists "users delete own favorites" on public.favorites;
create policy "users delete own favorites" on public.favorites for delete using (auth.uid() = user_id);

-- increment_search_count / increment_visit_count are SECURITY DEFINER,
-- so they run as the function owner and bypass the read-only RLS above
-- for their single targeted UPDATE — no separate UPDATE policy needed.
