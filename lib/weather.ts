/**
 * Real-time weather via Open-Meteo (free, no API key needed).
 * Returns null on any failure — the UI simply omits weather rather than
 * showing a made-up number/condition.
 */

// WMO weather codes → short Thai description. Source: Open-Meteo docs
// (https://open-meteo.com/en/docs — "WMO Weather interpretation codes").
const WEATHER_CODE_TH: Record<number, string> = {
  0: "ท้องฟ้าแจ่มใส",
  1: "แดดออกเป็นส่วนใหญ่",
  2: "มีเมฆบางส่วน",
  3: "เมฆมาก",
  45: "มีหมอก",
  48: "หมอกน้ำแข็ง",
  51: "ฝนปรอยเบาๆ",
  53: "ฝนปรอย",
  55: "ฝนปรอยหนาแน่น",
  56: "ฝนปรอยเยือกแข็ง",
  57: "ฝนปรอยเยือกแข็งหนาแน่น",
  61: "ฝนตกเล็กน้อย",
  63: "ฝนตก",
  65: "ฝนตกหนัก",
  66: "ฝนเยือกแข็งเล็กน้อย",
  67: "ฝนเยือกแข็งหนัก",
  71: "หิมะตกเล็กน้อย",
  73: "หิมะตก",
  75: "หิมะตกหนัก",
  77: "เกล็ดหิมะ",
  80: "ฝนตกเป็นช่วงๆ",
  81: "ฝนตกเป็นช่วงๆ ปานกลาง",
  82: "ฝนตกหนักเป็นช่วงๆ",
  85: "หิมะตกเป็นช่วงๆ",
  86: "หิมะตกหนักเป็นช่วงๆ",
  95: "พายุฝนฟ้าคะนอง",
  96: "พายุฝนฟ้าคะนองมีลูกเห็บ",
  99: "พายุฝนฟ้าคะนองมีลูกเห็บหนัก"
};

const WEATHER_CODE_EMOJI: Record<number, string> = {
  0: "☀️",
  1: "🌤️",
  2: "⛅",
  3: "☁️",
  45: "🌫️",
  48: "🌫️",
  51: "🌦️",
  53: "🌦️",
  55: "🌧️",
  56: "🌧️",
  57: "🌧️",
  61: "🌧️",
  63: "🌧️",
  65: "🌧️",
  66: "🌧️",
  67: "🌧️",
  71: "🌨️",
  73: "🌨️",
  75: "🌨️",
  77: "🌨️",
  80: "🌦️",
  81: "🌧️",
  82: "🌧️",
  85: "🌨️",
  86: "🌨️",
  95: "⛈️",
  96: "⛈️",
  99: "⛈️"
};

export interface WeatherSnapshot {
  temperature: number;
  description: string;
  emoji: string;
}

export async function fetchCurrentWeather(lat: number, lng: number): Promise<WeatherSnapshot | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`;
    const res = await fetch(url, { next: { revalidate: 1800 } }); // cache 30 min
    if (!res.ok) return null;
    const json = await res.json();
    const temp = json?.current_weather?.temperature;
    const code = json?.current_weather?.weathercode;
    if (typeof temp !== "number") return null;

    return {
      temperature: Math.round(temp),
      description: WEATHER_CODE_TH[code] ?? "สภาพอากาศทั่วไป",
      emoji: WEATHER_CODE_EMOJI[code] ?? "🌤️"
    };
  } catch {
    return null;
  }
}
