import Link from "next/link";
import { Search, Sparkles } from "lucide-react";

const quickFilters = ["เชียงใหม่", "ภูเก็ต", "ทะเล", "ธรรมชาติ", "วัฒนธรรม"];

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.14),_transparent_40%)]" />
      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 lg:px-8 lg:pb-20 lg:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
            <Sparkles className="h-3.5 w-3.5" />
            อัปเดตสถานที่น่าเที่ยวทุกวัน
          </div>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            วันนี้ไปเที่ยว
            <span className="block bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              ที่ไหนดี?
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-500 sm:text-lg">
            ค้นพบสถานที่ท่องเที่ยวทั่วประเทศไทย พร้อมดูความนิยม ความหนาแน่นของคน และสถานที่ที่กำลังมาแรงในวันนี้
          </p>
          <form action="/search" className="mx-auto mt-8 flex max-w-2xl rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/5">
            <Search className="ml-3 mt-3 h-5 w-5 shrink-0 text-slate-400" />
            <input
              name="q"
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none"
              placeholder="ค้นหาสถานที่ จังหวัด ทะเล ภูเขา วัด..."
            />
            <button className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700">
              ค้นหา
            </button>
          </form>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {quickFilters.map(x => (
              <Link
                key={x}
                href={`/search?q=${encodeURIComponent(x)}`}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
              >
                {x}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
