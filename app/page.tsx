import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import TrendingToday from "@/components/TrendingToday";
import ProvinceSelector from "@/components/ProvinceSelector";
import FeaturedPlaces from "@/components/FeaturedPlaces";
import { createClient } from "@/lib/supabase/server";
import { getFeaturedPlaces, getProvincesByRegion, getTrendingPlacesToday } from "@/lib/api/places";

export const revalidate = 300; // re-fetch homepage data at most every 5 minutes

async function TrendingSection() {
  const supabase = await createClient();
  const places = await getTrendingPlacesToday(supabase, 3);
  return <TrendingToday places={places} />;
}

async function ProvincesSection() {
  const supabase = await createClient();
  const provincesByRegion = await getProvincesByRegion(supabase);
  return <ProvinceSelector provincesByRegion={provincesByRegion} />;
}

async function FeaturedSection() {
  const supabase = await createClient();
  const places = await getFeaturedPlaces(supabase, 6);
  return <FeaturedPlaces places={places} />;
}

function CardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="animate-pulse overflow-hidden rounded-3xl border border-slate-200/80 bg-white">
            <div className="aspect-[4/3] bg-slate-200" />
            <div className="space-y-3 p-5">
              <div className="h-4 w-2/3 rounded bg-slate-200" />
              <div className="h-4 w-1/3 rounded bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <Navbar />
      <Hero />

      <Suspense fallback={<CardsSkeleton count={3} />}>
        <TrendingSection />
      </Suspense>

      <Suspense fallback={<div className="h-96 animate-pulse bg-slate-100" />}>
        <ProvincesSection />
      </Suspense>

      <Suspense fallback={<CardsSkeleton count={6} />}>
        <FeaturedSection />
      </Suspense>

      <footer className="bg-slate-950 px-4 py-12 text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:justify-between">
          <div>
            <div className="text-lg font-black text-white">
              THAI<span className="text-emerald-400">WANDER</span>
            </div>
            <p className="mt-2 text-sm">ค้นพบประเทศไทยในแบบที่เป็นคุณ</p>
          </div>
          <p className="text-xs">© 2026 THAIWANDER</p>
        </div>
      </footer>
    </main>
  );
}
