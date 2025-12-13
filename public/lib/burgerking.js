// Calculate distance between two points using Haversine formula
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const Radius = 6371e3; // Earth's radius in meters
  const latWB = lat1 * Math.PI / 180;
  const latBK = lat2 * Math.PI / 180;
  const latDiff = (lat2 - lat1) * Math.PI / 180;
  const lonDiff = (lon2 - lon1) * Math.PI / 180;

  const chord = Math.sin(latDiff/2) ** 2 + Math.cos(latWB) * Math.cos(latBK) * Math.sin(lonDiff/2) ** 2;
  const distance = 2 * Math.atan2(Math.sqrt(chord), Math.sqrt(1-chord));

  return Radius * distance; // Distance in meters
}

// Find the closest Burger King to a balloon
export function findClosestBurgerKing(balloonLat, balloonLon, burgerKings) {
  if (!Array.isArray(burgerKings) || burgerKings.length === 0) return null;

  let closest = null;
  let minDistance = Infinity;

  for (const bk of burgerKings) {
    if (
      typeof bk.lat !== "number" ||
      typeof bk.lon !== "number"
    ) continue;

    const distance = calculateDistance(
      balloonLat,
      balloonLon,
      bk.lat,
      bk.lon
    );

    if (distance < minDistance) {
      minDistance = distance;
      closest = {
        ...bk,
        distance
      };
    }
  }

  return closest;
}

// Create connections between balloons and their closest BKs
export function createBalloonBKConnections(balloons, burgerKings) {
  if (!Array.isArray(balloons) || !Array.isArray(burgerKings)) return [];

  return balloons
    .map(balloon => {
      if (
        typeof balloon.lat !== "number" ||
        typeof balloon.lon !== "number"
      ) return null;

      const closestBK = findClosestBurgerKing(
        balloon.lat,
        balloon.lon,
        burgerKings
      );

      if (!closestBK) return null;

      return {
        balloon,
        burgerKing: closestBK,
        distance: closestBK.distance,
        distanceMiles: (closestBK.distance / 1609.34).toFixed(2)
      };
    })
    .filter(Boolean);
}

// Fetch BK locations from server (Overpass-backed API)
export async function fetchBurgerKingLocations() {
  try {
    const res = await fetch("/api/burgerking-api");
    if (!res.ok) {
      throw new Error(`BK fetch failed: ${res.status}`);
    }

    const data = await res.json();

    // Expected shape:
    // [{ id, lat, lon }, ...]
    if (!Array.isArray(data)) {
      console.warn("Unexpected BK response:", data);
      return [];
    }

    return data;
  } catch (e) {
    console.error("Error fetching Burger King locations:", e);
    return [];
  }
}