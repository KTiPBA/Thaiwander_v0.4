export type CrowdLevel = "low" | "medium" | "high" | "packed";
export type PlaceStatus = "active" | "inactive";
export type Region = "เหนือ" | "กลาง" | "อีสาน" | "ตะวันออก" | "ตะวันตก" | "ใต้";
export type ForecastLevel = "low" | "medium" | "high";

export const CROWD_LEVEL_LABEL: Record<CrowdLevel, string> = {
  low: "🟢 คนน้อย",
  medium: "🟡 ปานกลาง",
  high: "🟠 ค่อนข้างเยอะ",
  packed: "🔴 คนแน่น"
};

export const FORECAST_LEVEL_LABEL: Record<ForecastLevel, string> = {
  low: "🟢 น้อย",
  medium: "🟡 ปานกลาง",
  high: "🔴 สูง"
};

export const MONTH_LABEL_TH = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
];

/** A predicted daily time block — always AI-estimated, never live occupancy. */
export interface RecommendedHourBlock {
  label: string;
  start: string;
  end: string;
  level: ForecastLevel;
}

/** A predicted monthly crowd level with the reasoning behind it. */
export interface SeasonalForecastEntry {
  month: number; // 1-12
  level: ForecastLevel;
  reason?: string;
  factors?: {
    weather?: string;
    festival?: string;
    season?: string;
    holiday?: string;
  };
}

export interface Province {
  id: string;
  name_th: string;
  name_en: string | null;
  slug: string;
  region: Region;
  cover_image_url: string | null;
  description: string | null;
  place_count: number;
}

export interface Place {
  id: string;
  name: string;
  slug: string;
  province_id: string;
  district: string | null;
  category: string;
  description: string | null;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number;
  popularity_score: number;
  crowd_level: CrowdLevel;
  visit_count: number;
  search_count: number;
  checkin_count: number;
  status: PlaceStatus;
  last_updated: string;
  /** AI-estimated, present only for places the AI itself suggested. */
  recommended_hours: RecommendedHourBlock[] | null;
  /** AI-estimated, present only for places the AI itself suggested. */
  seasonal_forecast: SeasonalForecastEntry[] | null;
}

/** `places` row joined with its province name — used across the UI. */
export interface PlaceWithProvince extends Place {
  province_name: string;
}

export interface DailyPlaceStat {
  id: string;
  place_id: string;
  date: string;
  views: number;
  searches: number;
  checkins: number;
  crowd_level: string | null;
  popularity_score: number;
}

/** Row shape returned by the `calculate_daily_trending` RPC. */
export interface TrendingPlace {
  place_id: string;
  name: string;
  slug: string;
  province_name: string;
  image_url: string | null;
  crowd_level: CrowdLevel;
  popularity_score: number;
  /** Yesterday's popularity_score — used to tell a real trend apart from
   *  noise on tiny numbers (e.g. 1 → 2 is "+100%" but means nothing yet). */
  baseline_score: number;
  trend_vs_yesterday: number;
  trend_vs_7d: number;
}

export interface ProvinceWithPlaces extends Province {
  places: Place[];
}
