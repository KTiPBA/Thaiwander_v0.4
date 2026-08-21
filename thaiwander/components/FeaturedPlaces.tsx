import { Sparkles } from "lucide-react";
import PlaceCard from "@/components/PlaceCard";
import type { PlaceWithProvince } from "@/lib/supabase/types";

export default function FeaturedPlaces({ places }: { places: PlaceWithProvince[] }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-7">
        <div className="mb-2 flex items-center gap-2 text-sm font-bold text-emerald-600">
          <Sparkles className="h-4 w-4" />
          FEATURED
        </div>
        <h2 className="text-2xl font-black sm:text-3xl">สถานที่น่าสนใจวันนี้</h2>
        <p className="mt-2 text-sm text-slate-500">คัดสรรจากคะแนนรีวิวและความนิยมจริงในฐานข้อมูล</p>
      </div>

      {places.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="font-bold">ยังไม่มีสถานที่ในฐานข้อมูล</p>
          <p className="mt-2 text-sm text-slate-500">รัน supabase/seed.sql เพื่อเพิ่มข้อมูลตัวอย่าง</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {places.map(place => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      )}
    </section>
  );
}
