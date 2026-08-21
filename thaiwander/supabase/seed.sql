-- THAIWANDER Phase 1 — Seed Data
-- Run AFTER 20260818_init_thaiwander.sql. Safe to re-run (upserts by slug).

-- ────────────────────────────────────────────────────────────
-- PROVINCES (all 6 regions)
-- ────────────────────────────────────────────────────────────
insert into public.provinces (name_th, name_en, slug, region, cover_image_url, description)
values
  ('เชียงใหม่', 'Chiang Mai', 'chiang-mai', 'เหนือ', 'https://images.unsplash.com/photo-1512553353614-82a7370096dc?auto=format&fit=crop&w=900&q=85', 'เมืองเหนือที่มีทั้งภูเขา วัด และคาเฟ่'),
  ('เชียงราย', 'Chiang Rai', 'chiang-rai', 'เหนือ', 'https://images.unsplash.com/photo-1470004914212-05527e49370b?auto=format&fit=crop&w=900&q=85', 'ดินแดนดอกไม้และวัดสีขาว'),
  ('แม่ฮ่องสอน', 'Mae Hong Son', 'mae-hong-son', 'เหนือ', 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=900&q=85', 'เมืองในหมอกสามฤดู'),
  ('กรุงเทพมหานคร', 'Bangkok', 'bangkok', 'กลาง', 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=900&q=85', 'เมืองหลวงที่ไม่เคยหลับใหล'),
  ('พระนครศรีอยุธยา', 'Ayutthaya', 'ayutthaya', 'กลาง', 'https://images.unsplash.com/photo-1598935888738-cd2622bfc7d2?auto=format&fit=crop&w=900&q=85', 'อดีตราชธานีและมรดกโลก'),
  ('เพชรบูรณ์', 'Phetchabun', 'phetchabun', 'กลาง', 'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?auto=format&fit=crop&w=900&q=85', 'ภูเขาและทะเลหมอกใกล้กรุงเทพฯ'),
  ('ขอนแก่น', 'Khon Kaen', 'khon-kaen', 'อีสาน', 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=85', 'ศูนย์กลางอีสานที่กำลังเติบโต'),
  ('อุบลราชธานี', 'Ubon Ratchathani', 'ubon-ratchathani', 'อีสาน', 'https://images.unsplash.com/photo-1490682143684-14369e18dce8?auto=format&fit=crop&w=900&q=85', 'ผาแต้มและแม่น้ำโขง'),
  ('ชลบุรี', 'Chonburi', 'chonburi', 'ตะวันออก', 'https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?auto=format&fit=crop&w=900&q=85', 'พัทยาและเกาะล้าน ทะเลใกล้กรุงเทพฯ'),
  ('ระยอง', 'Rayong', 'rayong', 'ตะวันออก', 'https://images.unsplash.com/photo-1439405326854-014607f694d7?auto=format&fit=crop&w=900&q=85', 'เกาะเสม็ดและผลไม้ตามฤดูกาล'),
  ('ตราด', 'Trat', 'trat', 'ตะวันออก', 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=900&q=85', 'เกาะช้างและทะเลตะวันออกสุดชายแดน'),
  ('กาญจนบุรี', 'Kanchanaburi', 'kanchanaburi', 'ตะวันตก', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=85', 'สะพานข้ามแม่น้ำแคว น้ำตก และป่าเขา'),
  ('ภูเก็ต', 'Phuket', 'phuket', 'ใต้', 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=900&q=85', 'เพิร์ลออฟดิออเรียนท์ ทะเลอันดามัน'),
  ('กระบี่', 'Krabi', 'krabi', 'ใต้', 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?auto=format&fit=crop&w=900&q=85', 'หน้าผาหินปูนและทะเลใส'),
  ('สุราษฎร์ธานี', 'Surat Thani', 'surat-thani', 'ใต้', 'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?auto=format&fit=crop&w=900&q=85', 'ประตูสู่เกาะสมุยและเกาะเต่า')
on conflict (slug) do update set
  name_th = excluded.name_th,
  name_en = excluded.name_en,
  region = excluded.region,
  cover_image_url = excluded.cover_image_url,
  description = excluded.description;

-- ────────────────────────────────────────────────────────────
-- PLACES (15+ real Thai destinations)
-- ────────────────────────────────────────────────────────────
insert into public.places (name, slug, province_id, district, category, description, image_url, latitude, longitude, rating, visit_count, search_count, checkin_count, status)
select v.name, v.slug, p.id, v.district, v.category, v.description, v.image_url, v.lat, v.lng, v.rating, v.visit_count, v.search_count, v.checkin_count, 'active'
from (values
  ('ดอยอินทนนท์', 'doi-inthanon', 'chiang-mai', 'จอมทอง', 'ธรรมชาติ', 'ยอดเขาที่สูงที่สุดในประเทศไทย อากาศเย็นตลอดปี', 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1200&q=85', 18.5883, 98.4867, 4.8, 2400::int, 640::int, 210::int),
  ('วัดพระธาตุดอยสุเทพ', 'wat-doi-suthep', 'chiang-mai', 'เมืองเชียงใหม่', 'วัฒนธรรม', 'วัดคู่บ้านคู่เมืองเชียงใหม่บนยอดดอย', 'https://images.unsplash.com/photo-1598935888738-cd2622bfc7d2?auto=format&fit=crop&w=1200&q=85', 18.8047, 98.9217, 4.7, 3100::int, 820::int, 180::int),
  ('วัดร่องขุ่น', 'wat-rong-khun', 'chiang-rai', 'เมืองเชียงราย', 'วัฒนธรรม', 'วัดสีขาวสถาปัตยกรรมร่วมสมัย', 'https://images.unsplash.com/photo-1470004914212-05527e49370b?auto=format&fit=crop&w=1200&q=85', 19.8232, 99.7509, 4.6, 1900::int, 510::int, 95::int),
  ('ปาย', 'pai', 'mae-hong-son', 'ปาย', 'ธรรมชาติ', 'เมืองเล็กในหุบเขา บรรยากาศชิลๆ', 'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?auto=format&fit=crop&w=1200&q=85', 19.3583, 98.4400, 4.5, 2650::int, 700::int, 140::int),
  ('วัดพระแก้ว', 'wat-phra-kaew', 'bangkok', 'พระนคร', 'วัฒนธรรม', 'วัดที่ประดิษฐานพระแก้วมรกต', 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=1200&q=85', 13.7515, 100.4927, 4.9, 5200::int, 1400::int, 320::int),
  ('ตลาดนัดจตุจักร', 'chatuchak-market', 'bangkok', 'จตุจักร', 'ช้อปปิ้ง', 'ตลาดนัดสุดสัปดาห์ที่ใหญ่ที่สุดในไทย', 'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?auto=format&fit=crop&w=1200&q=85', 13.7999, 100.5504, 4.4, 4300::int, 980::int, 260::int),
  ('อุทยานประวัติศาสตร์อยุธยา', 'ayutthaya-historical-park', 'ayutthaya', 'พระนครศรีอยุธยา', 'วัฒนธรรม', 'มรดกโลกทางประวัติศาสตร์', 'https://images.unsplash.com/photo-1598935888738-cd2622bfc7d2?auto=format&fit=crop&w=1200&q=85', 14.3564, 100.5686, 4.6, 2100::int, 560::int, 110::int),
  ('ภูทับเบิก', 'phu-thap-boek', 'phetchabun', 'หล่มเก่า', 'ธรรมชาติ', 'จุดชมทะเลหมอกที่สูงที่สุดในไทย', 'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?auto=format&fit=crop&w=1200&q=85', 16.9333, 101.0333, 4.7, 3400::int, 890::int, 300::int),
  ('เขาค้อ', 'khao-kho', 'phetchabun', 'เขาค้อ', 'ธรรมชาติ', 'ภูเขาอากาศเย็นใกล้กรุงเทพฯ', 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=85', 16.6667, 101.0000, 4.5, 1800::int, 430::int, 150::int),
  ('บึงแก่นนคร', 'bueng-kaen-nakhon', 'khon-kaen', 'เมืองขอนแก่น', 'ธรรมชาติ', 'สวนสาธารณะกลางเมืองริมบึง', 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=85', 16.4322, 102.8236, 4.3, 1200::int, 260::int, 60::int),
  ('ผาแต้ม', 'pha-taem', 'ubon-ratchathani', 'โขงเจียม', 'ธรรมชาติ', 'ภาพเขียนสีโบราณริมแม่น้ำโขง', 'https://images.unsplash.com/photo-1490682143684-14369e18dce8?auto=format&fit=crop&w=1200&q=85', 15.3167, 105.5667, 4.6, 1500::int, 340::int, 90::int),
  ('เกาะล้าน', 'koh-lan', 'chonburi', 'บางละมุง', 'ทะเล', 'เกาะใกล้พัทยา น้ำทะเลใส หาดสวย', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85', 12.9236, 100.7772, 4.5, 8700::int, 2300::int, 610::int),
  ('เกาะเสม็ด', 'koh-samet', 'rayong', 'เมืองระยอง', 'ทะเล', 'เกาะทรายขาวใกล้กรุงเทพฯ', 'https://images.unsplash.com/photo-1439405326854-014607f694d7?auto=format&fit=crop&w=1200&q=85', 12.5786, 101.4508, 4.6, 3900::int, 990::int, 240::int),
  ('เกาะช้าง', 'koh-chang', 'trat', 'เกาะช้าง', 'ทะเล', 'เกาะใหญ่อันดับสองของไทย ป่าเขาและทะเล', 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=85', 12.0450, 102.3200, 4.7, 3300::int, 780::int, 220::int),
  ('สะพานข้ามแม่น้ำแคว', 'bridge-river-kwai', 'kanchanaburi', 'เมืองกาญจนบุรี', 'ประวัติศาสตร์', 'สถานที่ประวัติศาสตร์สงครามโลกครั้งที่ 2', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85', 14.0392, 99.5028, 4.5, 2200::int, 520::int, 130::int),
  ('หาดป่าตอง', 'patong-beach', 'phuket', 'กะทู้', 'ทะเล', 'หาดชื่อดังที่คึกคักที่สุดของภูเก็ต', 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=1200&q=85', 7.8965, 98.2963, 4.3, 9200::int, 2600::int, 700::int),
  ('หาดกะตะ', 'kata-beach', 'phuket', 'กะทู้', 'ทะเล', 'หาดสวยเหมาะแก่การเล่นเซิร์ฟ', 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=1200&q=85', 7.8202, 98.2989, 4.6, 5100::int, 1300::int, 310::int),
  ('อ่าวมาหยา', 'maya-bay', 'krabi', 'เกาะพีพี', 'ทะเล', 'อ่าวชื่อดังจากภาพยนตร์ The Beach', 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?auto=format&fit=crop&w=1200&q=85', 7.6791, 98.7639, 4.8, 6700::int, 1900::int, 480::int),
  ('เกาะพีพี', 'koh-phi-phi', 'krabi', 'เกาะลันตา', 'ทะเล', 'หมู่เกาะที่มีชื่อเสียงระดับโลก', 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?auto=format&fit=crop&w=1200&q=85', 7.7407, 98.7784, 4.7, 5800::int, 1550::int, 400::int),
  ('เกาะสมุย', 'koh-samui', 'surat-thani', 'เกาะสมุย', 'ทะเล', 'เกาะตากอากาศยอดนิยมในอ่าวไทย', 'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?auto=format&fit=crop&w=1200&q=85', 9.5120, 100.0136, 4.6, 4700::int, 1150::int, 290::int)
) as v(name, slug, province_slug, district, category, description, image_url, lat, lng, rating, visit_count, search_count, checkin_count)
join public.provinces p on p.slug = v.province_slug
on conflict (slug) do update set
  province_id = excluded.province_id,
  district = excluded.district,
  category = excluded.category,
  description = excluded.description,
  image_url = excluded.image_url,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  rating = excluded.rating,
  visit_count = excluded.visit_count,
  search_count = excluded.search_count,
  checkin_count = excluded.checkin_count;

-- keep provinces.place_count in sync with actual place counts
update public.provinces pr
set place_count = sub.cnt
from (
  select province_id, count(*) as cnt
  from public.places
  where status = 'active'
  group by province_id
) sub
where sub.province_id = pr.id;

-- ────────────────────────────────────────────────────────────
-- 7-DAY daily_place_stats HISTORY (so trending has something to compare against)
-- Builds a deterministic but varied growth curve per place: day 7 (oldest)
-- starts lower, day 1 (target_date) matches the place's current counters.
-- ────────────────────────────────────────────────────────────
do $$
declare
  pl record;
  d integer;
  target_date date := current_date;
  day_date date;
  factor numeric;
  v_views integer;
  v_searches integer;
  v_checkins integer;
  v_score numeric;
  v_crowd crowd_level_enum;
begin
  for pl in select * from public.places loop
    for d in 0..6 loop
      day_date := target_date - d;
      -- oldest day (d=6) at ~55% of current volume, growing toward 100% today,
      -- with a small per-place wobble so growth % differs between places.
      factor := 0.55 + (0.075 * (6 - d)) + ((('x' || substr(md5(pl.id::text || d::text), 1, 6))::bit(24)::int % 10) / 200.0);
      v_views := greatest(0, round(pl.visit_count * factor / 7.0));
      v_searches := greatest(0, round(pl.search_count * factor / 7.0));
      v_checkins := greatest(0, round(pl.checkin_count * factor / 7.0));
      v_score := round((v_views * 0.5) + (v_searches * 1.5) + (v_checkins * 3.0), 2);
      v_crowd := public.determine_crowd_level(v_views, v_searches, v_checkins);

      insert into public.daily_place_stats (place_id, date, views, searches, checkins, crowd_level, popularity_score)
      values (pl.id, day_date, v_views, v_searches, v_checkins, v_crowd::text, v_score)
      on conflict (place_id, date) do update set
        views = excluded.views,
        searches = excluded.searches,
        checkins = excluded.checkins,
        crowd_level = excluded.crowd_level,
        popularity_score = excluded.popularity_score;
    end loop;
  end loop;
end $$;

-- finally, sync `places` current popularity_score/crowd_level from today's snapshot
select public.run_daily_snapshot(current_date);
