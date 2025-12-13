// burgerking-api.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  const { south, west, north, east } = req.query;

  // Validate input
  if (![south, west, north, east].every(v => v !== undefined)) {
    return res.status(200).json([]);
  }

  // Limit bounding box size to prevent Overpass timeout
  const MAX_DEGREES = 5;
  const latSpan = Math.abs(north - south);
  const lonSpan = Math.abs(east - west);

  if (latSpan > MAX_DEGREES || lonSpan > MAX_DEGREES) {
    return res.status(200).json([]);
  }

  const query = `
    [out:json][timeout:25];
    (
      node["name"="Burger King"](${south},${west},${north},${east});
      way["name"="Burger King"](${south},${west},${north},${east});
      relation["name"="Burger King"](${south},${west},${north},${east});
    );
    out center;
  `;

  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: query
    });

    const data = await response.json();

    const locations = data.elements
      .map(el => ({
        id: el.id,
        lat: el.lat ?? el.center?.lat,
        lon: el.lon ?? el.center?.lon
      }))
      .filter(bk => bk.lat && bk.lon);

    return res.status(200).json(locations);
  } catch (e) {
    console.error("Overpass API error:", e);
    return res.status(500).json([]);
  }
}
