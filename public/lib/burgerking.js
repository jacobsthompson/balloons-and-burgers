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

// Find closest BK to a balloon
export function findClosestBurgerKing(balloonLat, balloonLon, burgerKings) {
  if (!burgerKings || burgerKings.length === 0) return null;

  let closest = null;
  let minDistance = Infinity;

  burgerKings.forEach(bk => {
    const distance = calculateDistance(balloonLat, balloonLon, bk.lat, bk.lon);
    if (distance < minDistance) {
      minDistance = distance;
      closest = { ...bk, distance };
    }
  });

  return closest;
}

// Create connections
export function createBalloonBKConnections(balloons, burgerKings) {
  return balloons
    .map(balloon => {
      const closestBK = findClosestBurgerKing(balloon.lat, balloon.lon, burgerKings);
      if (!closestBK) return null;

      return {
        balloon,
        burgerKing: closestBK,
        distance: closestBK.distance,
        distanceMiles: (closestBK.distance / 1609.34).toFixed(2)
      };
    })
    .filter(conn => conn !== null);
}

// Fetch BKs from server endpoint
export async function fetchBurgerKingLocations(bounds) {
  const { south, west, north, east } = bounds || {};

  const queryParams =
    south && west && north && east
      ? `?south=${south}&west=${west}&north=${north}&east=${east}`
      : "";

  try {
    const res = await fetch(`/api/burgerking-api${queryParams}`);
    if (!res.ok) throw new Error(`BK fetch failed: ${res.status}`);
    const data = await res.json();

    return data
      .filter(bk => bk.lat !== undefined && bk.lon !== undefined)
      .map(bk => ({
        id: bk.id,
        lat: bk.lat,
        lon: bk.lon
      }));
  } catch (err) {
    console.error("Error fetching Burger King locations:", err);
    return [];
  }
}
