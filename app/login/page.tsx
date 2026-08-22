"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Mail, MapPin } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function loginWithGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback` } });
  }

  async function loginWithEmail(e: FormEvent) {
    e.preventDefault(); setLoading(true); setMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
    setLoading(false);
    setMessage(error ? error.message : "ส่งลิงก์เข้าสู่ระบบไปที่อีเมลแล้ว กรุณาตรวจสอบกล่องจดหมาย");
  }

  return <main className="min-h-screen bg-[#f8fafc] px-4 py-10">
    <div className="mx-auto max-w-md">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-emerald-600"><ArrowLeft className="h-4 w-4" />กลับหน้าแรก</Link>
      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/5 sm:p-9">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white"><MapPin /></div>
        <h1 className="mt-6 text-3xl font-black">ยินดีต้อนรับกลับ 👋</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">เข้าสู่ระบบเพื่อบันทึกสถานที่โปรดและสร้างรายการเที่ยวของคุณ</p>
        <button onClick={loginWithGoogle} className="mt-7 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold hover:bg-slate-50"><span className="font-black">G</span> ดำเนินการต่อด้วย Google</button>
        <div className="my-6 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200" />หรือ<span className="h-px flex-1 bg-slate-200" /></div>
        <form onSubmit={loginWithEmail} className="space-y-4">
          <label className="block text-sm font-semibold">อีเมล<div className="mt-2 flex items-center rounded-xl border border-slate-200 px-3 focus-within:border-emerald-500"><Mail className="h-4 w-4 text-slate-400" /><input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="w-full bg-transparent px-3 py-3 text-sm outline-none" /></div></label>
          <button disabled={loading} className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white hover:bg-emerald-700 disabled:opacity-60">{loading ? "กำลังส่ง..." : "เข้าสู่ระบบด้วยอีเมล"}</button>
        </form>
        {message && <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{message}</p>}
      </div>
    </div>
  </main>;
}