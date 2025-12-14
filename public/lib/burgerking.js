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

// Find the closest BK to a balloon
export function findClosestBurgerKing(balloon, burgerKings) {
  let closest = null;
  let minDist = Infinity;
  burgerKings.forEach(bk => {
    const dist = calculateDistance(balloon.lat, balloon.lon, bk.lat, bk.lon);

    if(!Number.isFinite(dist)) return;

    if (dist < minDist) {
      minDist = dist;
      closest = { ...bk, distance: dist };
    }
  });

  // if (!closest) return null;

  return { bk: closest, distance: minDist };
}