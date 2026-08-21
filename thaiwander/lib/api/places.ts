import type { SupabaseClient } from "@supabase/supabase-js";
import type { Place, PlaceWithProvince, Province, TrendingPlace } from "@/lib/supabase/types";

/**
 * Every function here takes the Supabase client as its first argument
 * instead of creating one internally — that way the same function works
 * from a Server Component (lib/supabase/server.ts) and from a Client
 * Component (lib/supabase/client.ts) without duplicating query logic.
 */

/** Today's trending places, ranked by popularity with growth vs. yesterday / 7-day avg. */
export async function getTrendingPlacesToday(
  supabase: SupabaseClient,
  limit = 3
): Promise<TrendingPlace[]> {
  const { data, error } = await supabase
    .rpc("calculate_daily_trending")
    .limit(limit);

  if (error) {
    console.error("getTrendingPlacesToday failed:", error.message);
    return [];
  }
  return (data ?? []) as TrendingPlace[];
}

/** Full-text-ish search across name / description / category / district / province,
 *  optionally scoped to a province. Splits the query into words and requires every
 *  word to match somewhere (AND across words, OR across fields per word) — so
 *  partial or multi-word queries ("หาด ภูเก็ต") still find the right places instead
 *  of requiring the exact full phrase to appear verbatim in one field. */
export async function searchPlaces(
  supabase: SupabaseClient,
  query: string,
  provinceId?: string
): Promise<PlaceWithProvince[]> {
  const terms = query.trim().split(/\s+/).filter(Boolean);

  // Places don't carry province name directly, so first resolve any terms
  // that match a province name into province ids — lets "เชียงใหม่" or
  // "ภูเก็ต" match places even when the place's own name/district doesn't
  // contain that word.
  let matchedProvinceIds: string[] = [];
  if (terms.length) {
    const provinceOr = terms
      .map(t => `name_th.ilike.%${t}%,name_en.ilike.%${t}%`)
      .join(",");
    const { data: provinceMatches } = await supabase
      .from("provinces")
      .select("id")
      .or(provinceOr);
    matchedProvinceIds = (provinceMatches ?? []).map((p: { id: string }) => p.id);
  }

  let request = supabase
    .from("places")
    .select("*, provinces!inner(name_th)")
    .eq("status", "active");

  for (const term of terms) {
    const orParts = [
      `name.ilike.%${term}%`,
      `description.ilike.%${term}%`,
      `category.ilike.%${term}%`,
      `district.ilike.%${term}%`
    ];
    if (matchedProvinceIds.length) {
      orParts.push(`province_id.in.(${matchedProvinceIds.join(",")})`);
    }
    // Calling .or() again ANDs this group with the previous one — so each
    // word in the query must match at least one field, not just the first word.
    request = request.or(orParts.join(","));
  }

  if (provinceId) {
    request = request.eq("province_id", provinceId);
  }

  const { data, error } = await request
    .order("popularity_score", { ascending: false })
    .limit(60);

  if (error) {
    console.error("searchPlaces failed:", error.message);
    return [];
  }

  return (data ?? []).map(flattenProvince);
}

/** Every province, grouped by Thailand's 6 regions, for the province selector. */
export async function getProvincesByRegion(
  supabase: SupabaseClient
): Promise<Record<string, Province[]>> {
  const { data, error } = await supabase
    .from("provinces")
    .select("*")
    .order("place_count", { ascending: false });

  if (error) {
    console.error("getProvincesByRegion failed:", error.message);
    return {};
  }

  const grouped: Record<string, Province[]> = {};
  for (const province of (data ?? []) as Province[]) {
    grouped[province.region] = grouped[province.region] ?? [];
    grouped[province.region].push(province);
  }
  return grouped;
}

/** Curated grid of currently-active places for the homepage, highest rated first. */
export async function getFeaturedPlaces(
  supabase: SupabaseClient,
  limit = 6
): Promise<PlaceWithProvince[]> {
  const { data, error } = await supabase
    .from("places")
    .select("*, provinces!inner(name_th)")
    .eq("status", "active")
    .order("rating", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getFeaturedPlaces failed:", error.message);
    return [];
  }

  return (data ?? []).map(flattenProvince);
}

/** Single place by id, including its province name. Returns null if not found. */
export async function getPlaceDetailsById(
  supabase: SupabaseClient,
  id: string
): Promise<PlaceWithProvince | null> {
  const { data, error } = await supabase
    .from("places")
    .select("*, provinces!inner(name_th)")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("getPlaceDetailsById failed:", error.message);
    return null;
  }
  return flattenProvince(data);
}

export type ProvinceRankingFilter =
  | "popularity"
  | "rating"
  | "low_crowd"
  | "nature"
  | "beach"
  | "culture";

/** Live count of active places in a province — used instead of the stored
 *  `provinces.place_count` column so the number is correct even if the
 *  sync trigger hasn't run yet on an older database. */
export async function getProvincePlaceCount(supabase: SupabaseClient, provinceId: string): Promise<number> {
  const { count, error } = await supabase
    .from("places")
    .select("*", { count: "exact", head: true })
    .eq("province_id", provinceId)
    .eq("status", "active");

  if (error) {
    console.error("getProvincePlaceCount failed:", error.message);
    return 0;
  }
  return count ?? 0;
}

/** Province by slug, for the ranking page header. */
export async function getProvinceBySlug(supabase: SupabaseClient, slug: string): Promise<Province | null> {
  const { data, error } = await supabase.from("provinces").select("*").eq("slug", slug).maybeSingle();
  if (error || !data) {
    if (error) console.error("getProvinceBySlug failed:", error.message);
    return null;
  }
  return data as Province;
}

/** Average lat/lng across the province's active, geocoded places — used as a
 *  stand-in "center point" for the province (e.g. for a weather lookup).
 *  Returns null if no active place in the province has coordinates. */
export async function getProvinceCenter(
  supabase: SupabaseClient,
  provinceId: string
): Promise<{ lat: number; lng: number } | null> {
  const { data, error } = await supabase
    .from("places")
    .select("latitude, longitude")
    .eq("province_id", provinceId)
    .eq("status", "active")
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  if (error || !data || data.length === 0) return null;

  const sum = data.reduce(
    (acc, p) => ({ lat: acc.lat + (p.latitude as number), lng: acc.lng + (p.longitude as number) }),
    { lat: 0, lng: 0 }
  );
  return { lat: sum.lat / data.length, lng: sum.lng / data.length };
}

/** Ranked places within one province, with a small set of practical filters.
 *  "nature" / "beach" / "culture" map to the `category` values already used
 *  across the seed + AI-suggested data (ธรรมชาติ / ทะเล / วัฒนธรรม). */
export async function getPlacesByProvince(
  supabase: SupabaseClient,
  provinceId: string,
  filter: ProvinceRankingFilter = "popularity"
): Promise<PlaceWithProvince[]> {
  let request = supabase
    .from("places")
    .select("*, provinces!inner(name_th)")
    .eq("status", "active")
    .eq("province_id", provinceId);

  const categoryMap: Partial<Record<ProvinceRankingFilter, string>> = {
    nature: "ธรรมชาติ",
    beach: "ทะเล",
    culture: "วัฒนธรรม"
  };
  if (categoryMap[filter]) {
    request = request.eq("category", categoryMap[filter]!);
  }
  if (filter === "low_crowd") {
    request = request.eq("crowd_level", "low");
  }

  const orderColumn = filter === "rating" ? "rating" : "popularity_score";
  const { data, error } = await request.order(orderColumn, { ascending: false }).limit(50);

  if (error) {
    console.error("getPlacesByProvince failed:", error.message);
    return [];
  }
  return (data ?? []).map(flattenProvince);
}

/** Best-effort engagement counters — failures are swallowed so a metrics
 *  hiccup never breaks the page for the visitor. */
export async function trackSearch(supabase: SupabaseClient, placeId: string) {
  const { error } = await supabase.rpc("increment_search_count", { p_place_id: placeId });
  if (error) console.error("trackSearch failed:", error.message);
}

export async function trackVisit(supabase: SupabaseClient, placeId: string) {
  const { error } = await supabase.rpc("increment_visit_count", { p_place_id: placeId });
  if (error) console.error("trackVisit failed:", error.message);
}

// Supabase's nested select returns `provinces: { name_th }` — flatten that
// into the `province_name` field the UI actually reads.
function flattenProvince(row: Place & { provinces: { name_th: string } | { name_th: string }[] }): PlaceWithProvince {
  const { provinces, ...place } = row;
  const provinceRow = Array.isArray(provinces) ? provinces[0] : provinces;
  return { ...(place as Place), province_name: provinceRow?.name_th ?? "" };
}
