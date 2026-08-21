// supabase/functions/ai-daily-content/index.ts
//
// Deploy with:
//   supabase functions deploy ai-daily-content
//
// Requires the GEMINI_API_KEY secret (get one free at aistudio.google.com/apikey):
//   supabase secrets set GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxx
//
// What it does, once a day:
//   1. Reads the places/provinces already in the database (so it doesn't
//      suggest duplicates).
//   2. Asks Gemini for a handful of NEW real Thai destinations, each with:
//      - basic details (name, province, category, description, coords)
//      - recommended_hours: a predicted daily crowd pattern (Phase 1)
//      - seasonal_forecast: a 12-month predicted crowd calendar with a
//        short reason per month (Phase 1)
//      All of this is clearly a PREDICTION, not live data — the UI labels
//      it that way everywhere it's shown.
//   3. Inserts them with status = 'inactive' and source = 'ai' — they do
//      NOT show up on the site until a human reviews and flips them to
//      'active' in the Supabase Table Editor. AI can get coordinates,
//      image URLs, or details wrong, so this is a review queue, not an
//      auto-publish pipeline.
//
// Note: recommended_hours / seasonal_forecast are only generated for NEW
// places the AI suggests here — the original ~20 seeded places intentionally
// don't get this data backfilled (by design, see project notes).
//
// To review pending suggestions, run in the SQL Editor:
//   select id, name, district, category, description, latitude, longitude
//   from public.places
//   where source = 'ai' and status = 'inactive'
//   order by last_updated desc;
//
// Once you've checked/fixed a row (especially image_url — the AI does not
// supply one), flip it live:
//   update public.places set status = 'active', image_url = '...'
//   where id = '...';

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUGGESTIONS_PER_RUN = 3;
const GEMINI_MODEL = "gemini-3.6-flash";

Deno.serve(async (_req: Request) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const geminiKey = Deno.env.get("GEMINI_API_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: existingPlaces } = await supabase.from("places").select("name");
    const { data: provinces } = await supabase.from("provinces").select("id, name_th, slug");

    const existingNames = (existingPlaces ?? []).map((p: any) => p.name).join(", ") || "(ยังไม่มี)";
    const provinceList = (provinces ?? []).map((p: any) => `${p.name_th} (slug: ${p.slug})`).join(", ");

    const prompt = `คุณคือผู้เชี่ยวชาญด้านการท่องเที่ยวไทย ช่วยแนะนำสถานที่ท่องเที่ยวจริง ${SUGGESTIONS_PER_RUN} แห่งในประเทศไทยที่ "ยังไม่มี" ในรายการนี้: ${existingNames}

เลือก province_slug จากรายการนี้เท่านั้น (ห้ามสร้างจังหวัดใหม่): ${provinceList}

สำหรับแต่ละสถานที่ ให้ประเมินเพิ่มด้วย (เป็นการคาดการณ์จากความรู้ทั่วไป ไม่ใช่ข้อมูลจริงแบบเรียลไทม์):
- recommended_hours: ช่วงเวลาแนะนำ 3 ช่วงในหนึ่งวัน (เช้า/สาย/บ่าย) พร้อมระดับความหนาแน่นที่คาดว่าจะเจอ
- seasonal_forecast: การคาดการณ์ความหนาแน่นทั้ง 12 เดือน แต่ละเดือนให้เหตุผลสั้นๆ (เช่น เทศกาล, ฤดูกาล, วันหยุดยาว, สภาพอากาศ) เฉพาะเดือนที่มีเหตุผลชัดเจน (level เป็น high หรือ low ผิดปกติ) ค่อยใส่ reason และ factors ไม่งั้นใส่แค่ level ก็พอ

ตอบเป็น JSON array ล้วนๆ เท่านั้น ห้ามมีข้อความอื่นหรือ markdown fence ก่อน/หลัง รูปแบบแต่ละรายการ:
{
  "name": "ชื่อสถานที่",
  "slug": "kebab-case-slug",
  "province_slug": "...",
  "district": "...",
  "category": "ธรรมชาติ|วัฒนธรรม|ทะเล|ช้อปปิ้ง|ประวัติศาสตร์|ทั่วไป",
  "description": "1-2 ประโยค",
  "latitude": 0.0,
  "longitude": 0.0,
  "rating_estimate": 4.5,
  "recommended_hours": [
    {"label": "เช้าตรู่", "start": "06:00", "end": "09:00", "level": "low"},
    {"label": "สาย", "start": "10:00", "end": "12:00", "level": "medium"},
    {"label": "บ่าย", "start": "13:00", "end": "17:00", "level": "high"}
  ],
  "seasonal_forecast": [
    {"month": 1, "level": "low"},
    {"month": 4, "level": "high", "reason": "เทศกาลสงกรานต์และวันหยุดยาว", "factors": {"holiday": "สงกรานต์", "season": "หน้าร้อน"}}
  ]
}
seasonal_forecast ต้องมีครบ 12 เดือน (month 1-12), level เป็น "low" | "medium" | "high" เท่านั้น`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: "application/json"
          }
        })
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      throw new Error(`Gemini API error: ${geminiRes.status} ${errText}`);
    }

    const geminiJson = await geminiRes.json();
    const text: string =
      geminiJson?.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? "").join("") ?? "[]";
    const cleaned = text.replace(/```json|```/g, "").trim();

    let suggestions: any[] = [];
    try {
      suggestions = JSON.parse(cleaned);
    } catch {
      throw new Error(`Could not parse AI response as JSON: ${cleaned.slice(0, 300)}`);
    }

    const provinceMap = new Map((provinces ?? []).map((p: any) => [p.slug, p.id]));
    let inserted = 0;
    const skipped: string[] = [];

    const VALID_LEVELS = new Set(["low", "medium", "high"]);

    for (const s of suggestions) {
      const provinceId = provinceMap.get(s.province_slug);
      if (!provinceId || !s.name || !s.slug) {
        skipped.push(s?.name ?? "unknown");
        continue;
      }

      const recommendedHours = Array.isArray(s.recommended_hours)
        ? s.recommended_hours
            .filter((h: any) => h?.label && h?.start && h?.end && VALID_LEVELS.has(h?.level))
            .map((h: any) => ({ label: h.label, start: h.start, end: h.end, level: h.level }))
        : null;

      const seasonalForecast = Array.isArray(s.seasonal_forecast)
        ? s.seasonal_forecast
            .filter((f: any) => Number.isInteger(f?.month) && f.month >= 1 && f.month <= 12 && VALID_LEVELS.has(f?.level))
            .map((f: any) => ({
              month: f.month,
              level: f.level,
              ...(f.reason ? { reason: String(f.reason) } : {}),
              ...(f.factors && typeof f.factors === "object" ? { factors: f.factors } : {})
            }))
        : null;

      const { error } = await supabase.from("places").upsert(
        {
          name: s.name,
          slug: s.slug,
          province_id: provinceId,
          district: s.district ?? null,
          category: s.category ?? "ทั่วไป",
          description: s.description ?? null,
          latitude: typeof s.latitude === "number" ? s.latitude : null,
          longitude: typeof s.longitude === "number" ? s.longitude : null,
          rating: typeof s.rating_estimate === "number" ? s.rating_estimate : 0,
          status: "inactive", // pending human review — never auto-published
          source: "ai",
          recommended_hours: recommendedHours && recommendedHours.length ? recommendedHours : null,
          seasonal_forecast: seasonalForecast && seasonalForecast.length ? seasonalForecast : null
        },
        { onConflict: "slug", ignoreDuplicates: true }
      );

      if (error) skipped.push(`${s.name} (${error.message})`);
      else inserted++;
    }

    return new Response(
      JSON.stringify({ ok: true, suggested: suggestions.length, inserted, skipped }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("ai-daily-content failed:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
