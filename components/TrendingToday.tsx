import Link from "next/link";
import { Flame, TrendingUp } from "lucide-react";
import type { TrendingPlace } from "@/lib/supabase/types";
import { CROWD_LEVEL_LABEL } from "@/lib/supabase/types";

// Below this baseline, a % change is just noise on tiny numbers (e.g. 1 → 2
// looks like "+100%" but reflects almost no real activity) — show a
// descriptive label instead of a number that implies more certainty than
// the data actually supports.
const MIN_BASELINE_FOR_PERCENT = 5;

export default function TrendingToday({ places }: { places: TrendingPlace[] }) {
  return (
    <section id="trending" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-7 flex items-end justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-emerald-600">
            <Flame className="h-4 w-4" />
            TRENDING TODAY
          </div>
          <h2 className="text-2xl font-black sm:text-3xl">กำลังเป็นที่นิยมวันนี้</h2>
          <p className="mt-2 text-sm text-slate-500">สถานที่ที่นักท่องเที่ยวกำลังสนใจวันนี้</p>
        </div>
      </div>

      {places.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="font-bold">ยังไม่มีข้อมูล Trending</p>
          <p className="mt-2 text-sm text-slate-500">
            รันสคริปต์ seed และ daily snapshot ใน Supabase ก่อนเพื่อให้มีข้อมูลย้อนหลังสำหรับเปรียบเทียบ
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {places.map((p, i) => {
            const hasRealTrend = p.baseline_score >= MIN_BASELINE_FOR_PERCENT;

            return (
              <Link
                key={p.place_id}
                href={`/place/${p.place_id}`}
                className="group block overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  {p.image_url && (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                  <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                  </span>
                  {hasRealTrend ? (
                    <span className="absolute right-4 top-4 rounded-full bg-emerald-600/90 px-2.5 py-1 text-xs font-bold text-white">
                      {p.trend_vs_yesterday > 0 ? "↑" : p.trend_vs_yesterday < 0 ? "↓" : "→"}{" "}
                      {Math.abs(p.trend_vs_yesterday)}%
                    </span>
                  ) : (
                    <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-emerald-600/90 px-2.5 py-1 text-xs font-bold text-white">
                      <TrendingUp className="h-3 w-3" /> กำลังได้รับความสนใจ
                    </span>
                  )}
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-xl font-bold">{p.name}</h3>
                    <p className="mt-1 text-sm text-white/85">{p.province_name}</p>
                  </div>
                </div>
                <div className="space-y-3 p-5 text-sm">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                    {CROWD_LEVEL_LABEL[p.crowd_level]}
                  </span>
                  {hasRealTrend ? (
                    <p className="text-xs text-slate-400">
                      7 วันที่ผ่านมา {p.trend_vs_7d > 0 ? "↑" : p.trend_vs_7d < 0 ? "↓" : "→"} {Math.abs(p.trend_vs_7d)}%
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400">อันดับ #{i + 1} ประจำวันนี้</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
