export async function fetchAirQuality(lat, lon) {
  // Guard against invalid coordinates
  if (lat == null || lon == null) {
    return { pm25: null, pm10: null, co: null };
  }

  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm2_5,pm10,carbon_monoxide&forecast_days=1`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Air quality API returned HTTP ${res.status} for (${lat}, ${lon})`);
      return { pm25: null, pm10: null, co: null };
    }

    const json = await res.json();

    // Take the first hourly value as "latest"
    return {
      pm25: json.hourly?.pm2_5?.[0] ?? null,
      pm10: json.hourly?.pm10?.[0] ?? null,
      co: json.hourly?.carbon_monoxide?.[0] ?? null
    };
  } catch (e) {
    console.warn(`Failed to fetch air quality for (${lat}, ${lon}):`, e.message);
    return { pm25: null, pm10: null, co: null };
  }
}
