import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, MapPin, Navigation, Star, Hotel } from "lucide-react";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import { getPlaceDetailsById, trackVisit } from "@/lib/api/places";
import { CROWD_LEVEL_LABEL, FORECAST_LEVEL_LABEL, MONTH_LABEL_TH } from "@/lib/supabase/types";
import type { ForecastLevel } from "@/lib/supabase/types";

const forecastDot: Record<ForecastLevel, string> = {
  low: "bg-emerald-500",
  medium: "bg-amber-500",
  high: "bg-red-500"
};

export default async function PlaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const place = await getPlaceDetailsById(supabase, id);

  if (!place) notFound();

  // Best-effort — a metrics hiccup should never break the page.
  trackVisit(supabase, place.id).catch(() => {});

  const mapsUrl =
    place.latitude && place.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + " " + place.province_name)}`;

  const directionsUrl =
    place.latitude && place.longitude
      ? `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.name + " " + place.province_name)}`;

  const currentMonth = new Date().getMonth() + 1;
  const currentMonthForecast = place.seasonal_forecast?.find(f => f.month === currentMonth);

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <Navbar />

      <div className="relative aspect-[16/9] max-h-[480px] w-full overflow-hidden sm:aspect-[21/9]">
        {place.image_url ? (
          <img src={place.image_url} alt={place.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-slate-200" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <Link
          href="/search"
          className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold backdrop-blur hover:bg-white"
        >
          <ArrowLeft className="h-4 w-4" /> กลับ
        </Link>
        <div className="absolute bottom-5 left-4 right-4 text-white sm:left-8">
          <p className="text-sm text-white/80">{place.category}</p>
          <h1 className="text-2xl font-black sm:text-4xl">{place.name}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-white/90">
            <MapPin className="h-4 w-4" />
            {place.district ? `${place.district}, ` : ""}
            {place.province_name}
            <span className="mx-1">·</span>
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            {place.rating.toFixed(1)}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        {/* Quick actions — the main thing a visitor taps, no reading required */}
        <div className="grid grid-cols-3 gap-3">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white py-4 text-center hover:border-emerald-300 hover:bg-emerald-50"
          >
            <MapPin className="h-5 w-5 text-emerald-600" />
            <span className="text-xs font-semibold text-slate-700">ดูแผนที่</span>
          </a>
          <button
            disabled
            title="เร็วๆ นี้ — รอการอนุมัติพาร์ทเนอร์"
            className="flex cursor-not-allowed flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 py-4 text-center opacity-60"
          >
            <Hotel className="h-5 w-5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500">จองที่พัก</span>
            <span className="text-[10px] text-slate-400">เร็วๆ นี้</span>
          </button>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white py-4 text-center hover:border-emerald-300 hover:bg-emerald-50"
          >
            <Navigation className="h-5 w-5 text-emerald-600" />
            <span className="text-xs font-semibold text-slate-700">วิธีเดินทาง</span>
          </a>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
            {CROWD_LEVEL_LABEL[place.crowd_level]}
          </span>
        </div>

        {/* Recommended hours — only when the AI actually produced this for the place */}
        {place.recommended_hours && place.recommended_hours.length > 0 && (
          <section className="mt-8">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Clock className="h-5 w-5 text-emerald-600" />
              ช่วงเวลาที่แนะนำ
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              เป็นการคาดการณ์จาก AI ไม่ใช่ข้อมูลจำนวนคนแบบเรียลไทม์
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {place.recommended_hours.map((block, i) => (
                <div key={i} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${forecastDot[block.level]}`} />
                  <div>
                    <p className="text-sm font-semibold">{block.label}</p>
                    <p className="text-xs text-slate-500">
                      {block.start}–{block.end} · {FORECAST_LEVEL_LABEL[block.level]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 12-month seasonal calendar — only when AI produced it for this place */}
        {place.seasonal_forecast && place.seasonal_forecast.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-bold">📅 คาดการณ์ตามฤดูกาล</h2>
            <p className="mt-1 text-xs text-slate-400">การประเมินจาก AI จากฤดูกาล/เทศกาลท่องเที่ยว ไม่ใช่ข้อมูลสถิติจริง</p>
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
              {MONTH_LABEL_TH.map((label, idx) => {
                const month = idx + 1;
                const entry = place.seasonal_forecast?.find(f => f.month === month);
                const isCurrent = month === currentMonth;
                return (
                  <div
                    key={month}
                    className={`rounded-xl border px-2 py-3 text-center ${
                      isCurrent ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-white"
                    }`}
                  >
                    <p className="text-xs font-semibold text-slate-600">{label}</p>
                    <p className="mt-1 text-xs">
                      {entry ? FORECAST_LEVEL_LABEL[entry.level] : "—"}
                    </p>
                  </div>
                );
              })}
            </div>

            {currentMonthForecast?.reason && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold">🤖 ทำไมเดือนนี้ถึงเป็นแบบนี้?</p>
                <p className="mt-1 text-sm text-slate-600">{currentMonthForecast.reason}</p>
                {currentMonthForecast.factors && (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                    {currentMonthForecast.factors.weather && <span>🌤 {currentMonthForecast.factors.weather}</span>}
                    {currentMonthForecast.factors.festival && <span>🎉 {currentMonthForecast.factors.festival}</span>}
                    {currentMonthForecast.factors.season && <span>🏖 {currentMonthForecast.factors.season}</span>}
                    {currentMonthForecast.factors.holiday && <span>📅 {currentMonthForecast.factors.holiday}</span>}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {place.description && (
          <section className="mt-8">
            <h2 className="text-lg font-bold">เกี่ยวกับสถานที่นี้</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">{place.description}</p>
          </section>
        )}
      </div>
    </main>
  );
}
