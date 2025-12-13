// routes/burgerKings.js
import express from "express";
import fetch from "node-fetch";

const router = express.Router();

let cached = null;
let lastFetch = 0;
const CACHE_TIME = 24 * 60 * 60 * 1000; // 24 hours

router.get("/", async (req, res) => {
  try {
    if (cached && Date.now() - lastFetch < CACHE_TIME) {
      return res.json(cached);
    }

    const query = `
    [out:json][timeout:25];
    (
      node["amenity"="fast_food"]["name"="Burger King"];
      way["amenity"="fast_food"]["name"="Burger King"];
      relation["amenity"="fast_food"]["name"="Burger King"];
    );
    out center;
    `;


    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query
    });

    const data = await response.json();

    const locations = data.elements.map(el => ({
      id: el.id,
      lat: el.lat,
      lon: el.lon
    }));

    cached = locations;
    lastFetch = Date.now();

    res.json(locations);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

export default router;
