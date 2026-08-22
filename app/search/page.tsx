import Link from "next/link";
import Navbar from "@/components/Navbar";
import PlaceCard from "@/components/PlaceCard";
import { createClient } from "@/lib/supabase/server";
import { searchPlaces } from "@/lib/api/places";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const supabase = await createClient();
  const results = await searchPlaces(supabase, q);

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Link href="/" className="text-sm font-semibold text-emerald-600">
          ← กลับหน้าแรก
        </Link>
        <div className="mt-7">
          <p className="text-sm font-bold text-emerald-600">DISCOVER</p>
          <h1 className="mt-2 text-3xl font-black">
            ผลการค้นหา{q && <> สำหรับ “{q}”</>}
          </h1>
          <p className="mt-2 text-sm text-slate-500">พบ {results.length} สถานที่</p>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {results.map((p, i) => (
            <PlaceCard key={p.id} place={p} rank={i + 1} />
          ))}
        </div>
        {!results.length && (
          <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <h2 className="font-bold">ยังไม่พบสถานที่</h2>
            <p className="mt-2 text-sm text-slate-500">ลองค้นหาด้วยชื่อจังหวัดหรือประเภทสถานที่</p>
          </div>
        )}
      </div>
    </main>
  );
}
