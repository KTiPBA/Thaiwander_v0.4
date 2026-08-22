import Link from "next/link";
import { ArrowRight, MapPin, Star, TrendingUp } from "lucide-react";
import type { PlaceWithProvince, CrowdLevel } from "@/lib/supabase/types";
import { CROWD_LEVEL_LABEL } from "@/lib/supabase/types";

const crowdStyles: Record<CrowdLevel, string> = {
  low: "bg-emerald-50 text-emerald-700",
  medium: "bg-amber-50 text-amber-700",
  high: "bg-orange-50 text-orange-700",
  packed: "bg-red-50 text-red-700"
};

export default function PlaceCard({
  place,
  rank,
  trendPct
}: {
  place: PlaceWithProvince;
  rank?: number;
  /** % growth vs. yesterday, shown as a trending badge when present. */
  trendPct?: number;
}) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[4/3] overflow-hidden">
        {place.image_url && (
          <img
            src={place.image_url}
            alt={place.name}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
        {rank && (
          <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold">
            {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`}
          </span>
        )}
        {typeof trendPct === "number" && (
          <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-emerald-600/90 px-2.5 py-1 text-xs font-bold text-white">
            <TrendingUp className="h-3 w-3" />
            {trendPct > 0 ? "↑" : trendPct < 0 ? "↓" : "→"} {Math.abs(trendPct)}%
          </span>
        )}
        <div className="absolute bottom-4 left-4 text-white">
          <p className="text-xs text-white/80">{place.category}</p>
          <h3 className="text-xl font-bold">{place.name}</h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-white/85">
            <MapPin className="h-3.5 w-3.5" />
            {place.province_name}
          </p>
        </div>
      </div>
      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 font-semibold">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            {place.rating.toFixed(1)}
          </span>
          <span className="text-xs text-slate-500">{place.visit_count.toLocaleString()} เข้าชม</span>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${crowdStyles[place.crowd_level]}`}
        >
          {CROWD_LEVEL_LABEL[place.crowd_level]}
        </span>
        <Link
          href={`/place/${place.id}`}
          className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
        >
          ดูรายละเอียด <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
