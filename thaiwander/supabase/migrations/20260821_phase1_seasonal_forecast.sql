-- THAIWANDER Phase 1 — Seasonal Forecast & Recommended Hours
-- Run AFTER 20260819_add_place_source.sql.

alter table public.places
  add column if not exists recommended_hours jsonb,
  add column if not exists seasonal_forecast jsonb;

comment on column public.places.recommended_hours is
  'Array of predicted daily time blocks, e.g. [{"label":"เช้าตรู่","start":"06:00","end":"09:00","level":"low"}]. AI-generated estimate, never live data.';
comment on column public.places.seasonal_forecast is
  'Array of 12 monthly predictions, e.g. [{"month":4,"level":"high","reason":"เทศกาลสงกรานต์...","factors":{"weather":"...","festival":"...","season":"...","holiday":"..."}}]. AI-generated estimate, never live data.';

-- Add a baseline (yesterday's) popularity_score to the trending RPC so the
-- frontend can tell "real, meaningful trend" apart from noise on very small
-- numbers (e.g. going from a popularity_score of 1 to 2 is technically
-- "+100%" but isn't a meaningful signal yet).
create or replace function public.calculate_daily_trending(target_date date default current_date)
returns table (
  place_id uuid,
  name text,
  slug text,
  province_name text,
  image_url text,
  crowd_level text,
  popularity_score numeric,
  baseline_score numeric,
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
    coalesce(y.popularity_score, 0) as baseline_score,
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
