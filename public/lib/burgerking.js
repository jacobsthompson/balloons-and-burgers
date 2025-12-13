// Fetch Burger King locations dynamically
// Uses restaurant-location-search-api package (free, no API key needed)

// Calculate distance between two points using Haversine formula
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const Radius = 6371e3; // Earth's radius in meters
  const latWB = lat1 * Math.PI / 180;
  const latBK = lat2 * Math.PI / 180;
  const latDiff = (lat2 - lat1) * Math.PI / 180;
  const lonDiff = (lon2 - lon1) * Math.PI / 180;

  const chord = Math.sin(latDiff/2) * Math.sin(latDiff/2) +
          Math.cos(latWB) * Math.cos(latBK) *
          Math.sin(lonDiff/2) * Math.sin(lonDiff/2);
  const distance = 2 * Math.atan2(Math.sqrt(chord), Math.sqrt(1-chord));

  return Radius * distance; // Distance in meters
}

// Find the closest Burger King to a balloon
export function findClosestBurgerKing(balloonLat, balloonLon, burgerKings) {
  if (!burgerKings || burgerKings.length === 0) return null;

  let closest = null;
  let minDistance = Infinity;

  burgerKings.forEach(bk => {
    const distance = calculateDistance(balloonLat, balloonLon, bk.lat, bk.lng);
    if (distance < minDistance) {
      minDistance = distance;
      closest = { ...bk, distance };
    }
  });

  return closest;
}

// Create connections between balloons and their closest BKs
export function createBalloonBKConnections(balloons, burgerKings) {
  return balloons.map(balloon => {
    const closestBK = findClosestBurgerKing(balloon.lat, balloon.lon, burgerKings);

    return {
      balloon,
      burgerKing: closestBK,
      distance: closestBK ? closestBK.distance : null,
      distanceMiles: closestBK ? (closestBK.distance / 1609.34).toFixed(2) : null
    };
  }).filter(conn => conn.burgerKing !== null);
}

// Fetch BK locations from server
export async function fetchBurgerKingLocations() {
  try {
    const res = await fetch('/api/burgerking-api');
    if (!res.ok) throw new Error("Failed to fetch BK locations");
    return await res.json();
  } catch (e) {
    console.error("Error fetching Burger King locations:", e);
    return [];
  }
}