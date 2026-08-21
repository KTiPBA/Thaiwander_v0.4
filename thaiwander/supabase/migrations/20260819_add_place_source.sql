-- THAIWANDER — add AI-content tracking
-- Run this AFTER 20260818_init_thaiwander.sql (safe to run even if places already has data).

alter table public.places
  add column if not exists source text not null default 'manual';

-- quick index for reviewing pending AI suggestions
create index if not exists idx_places_source_status on public.places(source, status);
