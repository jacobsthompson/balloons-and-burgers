// routes/burgerKings.js
import express from "express";
import fetch from "node-fetch";

const router = express.Router();

let cached = null;
let lastFetch = 0;
const CACHE_TIME = 24 * 60 * 60 * 1000; // 24 hours

router.get("/", async (req, res) => {
  const { south, west, north, east } = req.query;

  if (![south, west, north, east].every(v => v !== undefined)) {
    return res.json([]);
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
    const response = await fetch(
      "https://overpass-api.de/api/interpreter",
      {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: query
      }
    );

    const data = await response.json();

    const locations = data.elements
      .map(el => ({
        id: el.id,
        lat: el.lat ?? el.center?.lat,
        lon: el.lon ?? el.center?.lon
      }))
      .filter(bk => bk.lat && bk.lon);

    res.json(locations);
  } catch (e) {
    console.error("Overpass error:", e);
    res.json([]);
  }
});


export default router;
