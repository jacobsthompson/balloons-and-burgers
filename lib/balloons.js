const PROXY_HOST = "http://10.0.7.152:3001"; // your proxy LAN IP

export async function fetchBalloonState(offset) {
  const url = `${PROXY_HOST}/api/balloons/${String(offset).padStart(2,'0')}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const json = await res.json();

    console.log(`Raw JSON for offset ${offset}:`, json);

    if (!Array.isArray(json)) return [];

    return json
      .filter(arr => arr.length >= 3 && typeof arr[0] === "number" && typeof arr[1] === "number")
      .map((arr, i) => ({
        id: `balloon_${i}`,   // generate a simple ID
        lat: arr[0],
        lon: arr[1],
        alt: arr[2],
        timeOffsetHrs: offset
      }));

  } catch (e) {
    console.warn(`Corrupted or missing file: ${offset}`, e.message);
    return [];
  }
}

export async function fetch24hHistory() {
  const all = await Promise.all([...Array(24).keys()].map(fetchBalloonState));
  const flat = all.flat();

  const byId = {};
  flat.forEach(p => {
    if (!byId[p.id]) byId[p.id] = [];
    byId[p.id].push(p);
  });

  Object.values(byId).forEach(arr => arr.sort((a, b) => a.timeOffsetHrs - b.timeOffsetHrs));

  console.log("24h history:", byId); // should now show actual balloon data
  return byId;
}
