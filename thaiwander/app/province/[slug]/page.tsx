import PixelatedImage from "@/components/PixelatedImage";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import PlaceCard from "@/components/PlaceCard";
import { createClient } from "@/lib/supabase/server";
import { getPlacesByProvince, getProvinceBySlug, getProvinceCenter } from "@/lib/api/places";
import type { ProvinceRankingFilter } from "@/lib/api/places";
import { fetchCurrentTemperature } from "@/lib/weather";
import { CROWD_LEVEL_LABEL } from "@/lib/supabase/types";
import type { CrowdLevel } from "@/lib/supabase/types";

const FILTERS: { key: ProvinceRankingFilter; label: string }[] = [
  { key: "popularity", label: "ยอดนิยม" },
  { key: "rating", label: "คะแนนสูงสุด" },
  { key: "low_crowd", label: "คนน้อย" },
  { key: "nature", label: "ธรรมชาติ" },
  { key: "beach", label: "ทะเล" },
  { key: "culture", label: "วัฒนธรรม" }
];

// Aggregate crowd level across the province's active places into one summary
// badge for the hero — real data (the mode of what's already stored), never
// a fabricated live number.
function summarizeCrowd(levels: CrowdLevel[]): CrowdLevel | null {
  if (!levels.length) return null;
  const counts: Record<CrowdLevel, number> = { low: 0, medium: 0, high: 0, packed: 0 };
  for (const l of levels) counts[l]++;
  return (Object.keys(counts) as CrowdLevel[]).sort((a, b) => counts[b] - counts[a])[0];
}

export default async function ProvincePage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ filter?: string }>;
}) {
  const { slug } = await params;
  const { filter: filterParam } = await searchParams;
  const filter = (FILTERS.some(f => f.key === filterParam) ? filterParam : "popularity") as ProvinceRankingFilter;

  const supabase = await createClient();
  const province = await getProvinceBySlug(supabase, slug);
  if (!province) notFound();

  const [places, center] = await Promise.all([
    getPlacesByProvince(supabase, province.id, filter),
    getProvinceCenter(supabase, province.id)
  ]);
  const crowdSummary = summarizeCrowd(places.map(p => p.crowd_level));
  const temperature = center ? await fetchCurrentTemperature(center.lat, center.lng) : null;

  return (
    <main className="min-h-screen bg-brand-bg">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative h-[300px] w-full overflow-hidden sm:h-[360px] lg:h-[420px]">
        {province.cover_image_url ? (
          <PixelatedImage
            src={province.cover_image_url}
            alt={province.name_th}
            blockSize={10}
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <div className="absolute inset-0 bg-slate-300" />
        )}
        {/* Even dark wash so the big centered white title stays readable
            wherever the blurred photo is busy. */}
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/25" />

        <div className="relative mx-auto flex h-full max-w-[1400px] flex-col justify-between px-5 py-5 sm:px-8 sm:py-6 lg:px-12">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-white/70 sm:text-sm">
            <Link href="/" className="hover:text-white">
              หน้าแรก
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/#provinces" className="hover:text-white">
              จังหวัด
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white">{province.name_th}</span>
          </nav>

          {/* Big centered title */}
          <div className="flex flex-1 items-center justify-center text-center">
            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-white/80 sm:text-sm">
                สำรวจจังหวัด
              </p>
              <h1 className="text-5xl font-extrabold leading-tight text-white sm:text-6xl lg:text-7xl">
                {province.name_th}
              </h1>
            </div>
          </div>

          {/* Short description, bottom-left */}
          <div className="max-w-md text-white">
            {province.description && (
              <p className="mb-1.5 text-sm text-white/90 sm:text-base">{province.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/75 sm:text-sm">
              <span>{province.place_count} สถานที่น่าเที่ยว</span>
              <span className="text-white/40">·</span>
              <span>อัปเดตล่าสุดวันนี้</span>
              {typeof temperature === "number" && (
                <>
                  <span className="text-white/40">·</span>
                  <span>🌤️ {temperature}°C</span>
                </>
              )}
              {crowdSummary && (
                <>
                  <span className="text-white/40">·</span>
                  <span>👥 {CROWD_LEVEL_LABEL[crowdSummary].replace(/^[^\s]+\s/, "")}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
        {/* Single subtle CTA, right below the hero, not a giant button */}
        <div className="flex justify-end pt-4">
          <a
            href="#places-grid"
            className="text-sm font-semibold text-brand-emerald hover:text-brand-emeraldDark"
          >
            ดูสถานที่ทั้งหมด →
          </a>
        </div>

        {/* ── Category / filter nav — horizontally scrollable on mobile ── */}
        <div className="mt-3 -mx-5 overflow-x-auto px-5 pb-1 sm:mx-0 sm:overflow-visible sm:px-0">
          <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
            {FILTERS.map(f => (
              <Link
                key={f.key}
                href={`/province/${slug}?filter=${f.key}`}
                className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-medium transition ${
                  filter === f.key
                    ? "bg-brand-emerald text-white shadow-sm shadow-brand-emerald/30"
                    : "border border-slate-200 bg-white text-brand-text hover:border-brand-emerald/40"
                }`}
              >
                {f.label}
              </Link>
            ))}
          </div>
        </div>

        {/* ── Destination grid ────────────────────────────────────────── */}
        <div id="places-grid" className="py-8">
          {places.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <p className="font-bold text-brand-text">ยังไม่มีสถานที่ในหมวดนี้</p>
              <p className="mt-2 text-sm text-brand-muted">ลองเลือกตัวกรองอื่นดู</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {places.map((place, i) => (
                <PlaceCard key={place.id} place={place} rank={i + 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
