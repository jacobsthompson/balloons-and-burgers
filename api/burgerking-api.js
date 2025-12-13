// api/burgerking-api.js
import fetch from "node-fetch";

const CACHE = {}; // Simple in-memory cache: key = "south-west-north-east"

export default async function handler(req, res) {
  const { south, west, north, east } = req.query;

  if (![south, west, north, east].every(v => v !== undefined)) {
    return res.status(400).json({ error: "Missing bounding box parameters" });
  }

  const s = parseFloat(south),
        w = parseFloat(west),
        n = parseFloat(north),
        e = parseFloat(east);

  // Limit bounding box size (degrees)
  const MAX_DEGREES = 2;
  if (Math.abs(n - s) > MAX_DEGREES || Math.abs(e - w) > MAX_DEGREES) {
    return res.status(400).json({ error: "Bounding box too large" });
  }

  const cacheKey = `${s}-${w}-${n}-${e}`;
  if (CACHE[cacheKey]) {
    return res.status(200).json(CACHE[cacheKey]);
  }

  // Overpass query
  const query = `
    [out:json][timeout:25];
    (
      node["name"="Burger King"](${s},${w},${n},${e});
      way["name"="Burger King"](${s},${w},${n},${e});
      relation["name"="Burger King"](${s},${w},${n},${e});
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

    CACHE[cacheKey] = locations; // cache result
    return res.status(200).json(locations);
  } catch (e) {
    console.error("Overpass error:", e);
    return res.status(500).json({ error: "Overpass API failed" });
  }
}
