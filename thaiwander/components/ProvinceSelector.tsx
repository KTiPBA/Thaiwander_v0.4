"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Province, Region } from "@/lib/supabase/types";

const REGION_ORDER: Region[] = ["เหนือ", "กลาง", "อีสาน", "ตะวันออก", "ตะวันตก", "ใต้"];

export default function ProvinceSelector({ provincesByRegion }: { provincesByRegion: Record<string, Province[]> }) {
  const availableRegions = REGION_ORDER.filter(r => provincesByRegion[r]?.length);
  const [activeRegion, setActiveRegion] = useState<string>(availableRegions[0] ?? "เหนือ");
  const provinces = provincesByRegion[activeRegion] ?? [];

  return (
    <section id="provinces" className="border-y border-slate-200/70 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="mb-2 text-sm font-bold text-emerald-600">EXPLORE THAILAND</p>
          <h2 className="text-2xl font-black sm:text-3xl">เลือกเที่ยวตามจังหวัด</h2>
          <p className="mt-2 text-sm text-slate-500">ยังไม่รู้ว่าจะไปไหน? เริ่มจากภาคที่สนใจ</p>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          {availableRegions.map(region => (
            <button
              key={region}
              onClick={() => setActiveRegion(region)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeRegion === region
                  ? "bg-emerald-600 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
              }`}
            >
              ภาค{region}
            </button>
          ))}
        </div>

        {provinces.length === 0 ? (
          <p className="text-sm text-slate-400">ยังไม่มีข้อมูลจังหวัดในภาคนี้</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {provinces.map(province => (
              <Link
                href={`/province/${province.slug}`}
                key={province.id}
                className="group relative aspect-[4/3] overflow-hidden rounded-3xl"
              >
                {province.cover_image_url && (
                  <img
                    src={province.cover_image_url}
                    alt={province.name_th}
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <div className="absolute bottom-5 left-5 text-white">
                  <h3 className="text-xl font-bold">{province.name_th}</h3>
                  <p className="mt-1 text-sm text-white/80">{province.place_count} สถานที่น่าเที่ยว</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/search"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold hover:border-emerald-300 hover:text-emerald-600"
          >
            ดูสถานที่ทั้งหมด <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
