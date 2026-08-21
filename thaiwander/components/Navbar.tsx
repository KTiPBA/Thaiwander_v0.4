"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Search, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { searchPlaces } from "@/lib/api/places";
import type { PlaceWithProvince } from "@/lib/supabase/types";

const DEBOUNCE_MS = 250;

export default function Navbar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceWithProvince[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const term = query.trim();
    if (term.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const supabase = createClient();
      const results = await searchPlaces(supabase, term);
      setSuggestions(results.slice(0, 6));
      setLoading(false);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function goToSearch() {
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
            <MapPin className="h-5 w-5" />
          </span>
          <span className="text-lg font-extrabold tracking-tight">
            THAI<span className="text-emerald-600">WANDER</span>
          </span>
        </Link>

        <div ref={boxRef} className="relative hidden flex-1 max-w-md md:block">
          <div className="flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 focus-within:border-emerald-400">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={e => e.key === "Enter" && goToSearch()}
              placeholder="ค้นหาสถานที่ จังหวัด..."
              className="w-full bg-transparent px-2 py-1 text-sm outline-none"
            />
          </div>
          {open && query.trim().length >= 2 && (
            <div className="absolute left-0 right-0 top-full mt-2 max-h-80 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
              {loading && <p className="px-3 py-2 text-xs text-slate-400">กำลังค้นหา...</p>}
              {!loading && suggestions.length === 0 && (
                <p className="px-3 py-2 text-xs text-slate-400">ไม่พบสถานที่ที่ตรงกัน</p>
              )}
              {!loading &&
                suggestions.map(place => (
                  <Link
                    key={place.id}
                    href={`/search?q=${encodeURIComponent(place.name)}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-emerald-50"
                  >
                    {place.image_url && (
                      <img src={place.image_url} alt={place.name} className="h-9 w-9 rounded-lg object-cover" />
                    )}
                    <span>
                      <span className="block font-semibold text-slate-800">{place.name}</span>
                      <span className="block text-xs text-slate-400">{place.province_name}</span>
                    </span>
                  </Link>
                ))}
              {!loading && query.trim() && (
                <button
                  onClick={goToSearch}
                  className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                >
                  <Search className="h-3.5 w-3.5" /> ค้นหา “{query.trim()}” ทั้งหมด
                </button>
              )}
            </div>
          )}
        </div>

        <nav className="ml-auto hidden gap-7 text-sm font-medium text-slate-600 md:flex">
          <Link href="/" className="hover:text-emerald-600">
            สำรวจ
          </Link>
          <a href="#provinces" className="hover:text-emerald-600">
            จังหวัด
          </a>
          <a href="#trending" className="hover:text-emerald-600">
            กำลังฮิต
          </a>
        </nav>
        <Link
          href="/login"
          className="ml-auto inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:border-emerald-300 hover:bg-emerald-50 md:ml-0"
        >
          <UserRound className="h-4 w-4" /> เข้าสู่ระบบ
        </Link>
      </div>
    </header>
  );
}
