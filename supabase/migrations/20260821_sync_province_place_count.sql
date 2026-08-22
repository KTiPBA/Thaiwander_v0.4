-- THAIWANDER — keep provinces.place_count accurate automatically
--
-- place_count was only ever set once during seeding, so it went stale the
-- moment AI-suggested places got approved or any place's status/province
-- changed. This trigger recalculates it for real, on every insert/update/
-- delete on places, so the number shown site-wide is always correct.

create or replace function public.sync_province_place_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'DELETE' then
    update public.provinces
    set place_count = (select count(*) from public.places where province_id = OLD.province_id and status = 'active')
    where id = OLD.province_id;
    return OLD;
  end if;

  update public.provinces
  set place_count = (select count(*) from public.places where province_id = NEW.province_id and status = 'active')
  where id = NEW.province_id;

  -- a place moved to a different province — recount the old one too
  if TG_OP = 'UPDATE' and OLD.province_id is distinct from NEW.province_id then
    update public.provinces
    set place_count = (select count(*) from public.places where province_id = OLD.province_id and status = 'active')
    where id = OLD.province_id;
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_sync_province_place_count on public.places;
create trigger trg_sync_province_place_count
after insert or delete or update of status, province_id
on public.places
for each row execute function public.sync_province_place_count();

-- one-time fix for counts that are already stale right now
update public.provinces p
set place_count = (
  select count(*) from public.places pl
  where pl.province_id = p.id and pl.status = 'active'
);
