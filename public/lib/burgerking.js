// lib/burgerking.js
export async function fetchBurgerKingLocations(bounds) {
  const { south, west, north, east } = bounds;

  const queryParams = `?south=${south}&west=${west}&north=${north}&east=${east}`;
  try {
    const res = await fetch(`/api/burgerking-api${queryParams}`);
    if (!res.ok) throw new Error(`BK fetch failed: ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Error fetching Burger King locations:", err);
    return [];
  }
}
