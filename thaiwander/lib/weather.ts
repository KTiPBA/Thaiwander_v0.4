/**
 * Real-time weather via Open-Meteo (free, no API key needed).
 * Returns null on any failure — the UI simply omits the temperature rather
 * than showing a made-up number.
 */
export async function fetchCurrentTemperature(lat: number, lng: number): Promise<number | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`;
    const res = await fetch(url, { next: { revalidate: 1800 } }); // cache 30 min
    if (!res.ok) return null;
    const json = await res.json();
    const temp = json?.current_weather?.temperature;
    return typeof temp === "number" ? Math.round(temp) : null;
  } catch {
    return null;
  }
}
