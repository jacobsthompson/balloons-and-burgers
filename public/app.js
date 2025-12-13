import { fetchCurrentBalloons } from "./lib/balloons.js";
import { fetchBurgerKingLocations, createBalloonBKConnections } from "./lib/burgerking.js";

const map = new maplibregl.Map({
  container: "map",
  style: "https://demotiles.maplibre.org/style.json",
  center: [-98.5795, 39.8283], // Center of USA
  zoom: 4
});

let balloons = [];
let burgerkings = [];
let connections = [];
let markers = [];

async function init() {
  map.on('load', async () => {
    console.log('✓ Map loaded');
    await loadBalloons();

    burgerkings = await fetchBurgerKingLocations();
    console.log(`Loaded ${burgerkings.length} Burger Kings`);
    renderBurgerKings();

    // Refresh every 5 minutes
    setInterval(loadBalloons, 5 * 60 * 1000);
  });
}

async function loadBalloons() {
  console.log('=== Loading balloons ===');
  updateStatus('Loading balloons...');

  try {
    const balloonsData = await fetchCurrentBalloons();
    console.log(`Fetched ${balloonsData.length} balloons`);

    if (balloonsData.length === 0) {
      console.error('No balloons received!');
      updateStatus('No balloons found');
      return;
    }

    balloons = balloonsData.slice(0, 100); // Limit to 100
    console.log(`Using ${balloons.length} balloons`);

    connections = createBalloonBKConnections(balloons, burgerkings);
    console.log(`Made ${connections.length} Connections`);

    // Log first balloon to verify data structure
    console.log('First balloon:', balloons[0]);

    updateStatus(`✓ Loaded ${balloons.length} balloons`);
    renderBalloons();
    renderConnections();

  } catch (error) {
    console.error('Error loading balloons:', error);
    updateStatus('❌ Error loading balloons');
  }
}

function renderBalloons() {
  console.log('=== Rendering balloons ===');

  // Check if map is ready
  if (!map.isStyleLoaded()) {
    console.log('Map not ready, waiting...');
    map.once('idle', renderBalloons);
    return;
  }

  // Clear old markers
  console.log(`Clearing ${markers.length} old markers`);
  markers.forEach(m => m.remove());
  markers = [];

  // Render each balloon
  let successCount = 0;

  balloons.forEach((balloon, index) => {
    try {
      // Validate coordinates
      if (!balloon.lat || !balloon.lon) {
        console.warn(`Balloon ${index} missing coordinates:`, balloon);
        return;
      }

      if (isNaN(balloon.lat) || isNaN(balloon.lon)) {
        console.warn(`Balloon ${index} has invalid coordinates:`, balloon);
        return;
      }

      // Create marker element
      const el = document.createElement('div');
      el.className = 'balloon-marker';
      el.style.backgroundColor = '#ffff00';
      el.style.width = '16px';
      el.style.height = '16px';
      el.style.borderRadius = '50%';
      el.style.border = '3px solid #ff4f4f';
      el.style.cursor = 'pointer';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.5)';

      // Create marker
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([balloon.lon, balloon.lat])
        .addTo(map);

      // Add click handler
      el.addEventListener('click', () => {
        new maplibregl.Popup({ offset: 25 })
          .setLngLat([balloon.lon, balloon.lat])
          .setHTML(`
            <div style="font-family: monospace; font-size: 12px;">
              <strong style="color: #ffff00;">🎈 ${balloon.id}</strong><br/>
              Lat: ${balloon.lat.toFixed(4)}°<br/>
              Lon: ${balloon.lon.toFixed(4)}°<br/>
              Alt: ${balloon.alt ? balloon.alt.toFixed(2) + ' km' : 'unknown'}
            </div>
          `)
          .addTo(map);

        showBalloonDetails(balloon);
      });

      markers.push(marker);
      successCount++;

    } catch (err) {
      console.error(`Failed to render balloon ${index}:`, err);
    }
  });

  console.log(`✓ Successfully rendered ${successCount}/${balloons.length} balloons`);
  updateStatus(`✓ Showing ${successCount} balloons on map`);
}

function renderBurgerKings() {
  burgerkings.forEach(bk => {
    const el = document.createElement("div");
    el.className = "bk-marker";
    el.style.width = "12px";
    el.style.height = "12px";
    el.style.background = "#ff0000";
    el.style.borderRadius = "50%";
    el.style.border = "2px solid white";

    new maplibregl.Marker(el)
      .setLngLat([bk.lon, bk.lat])
      .addTo(map);
  });
}

function renderConnections() {
  const geojson = {
    type: "FeatureCollection",
    features: connections.map(conn => ({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [conn.balloon.lon, conn.balloon.lat],
          [conn.burgerKing.lon, conn.burgerKing.lat]
        ]
      },
      properties: {
        distance: conn.distance
      }
    }))
  };

  if (map.getSource("balloon-bk-lines")) {
    map.getSource("balloon-bk-lines").setData(geojson);
    return;
  }

  map.addSource("balloon-bk-lines", {
    type: "geojson",
    data: geojson
  });

  map.addLayer({
    id: "balloon-bk-layer",
    type: "line",
    source: "balloon-bk-lines",
    paint: {
      "line-color": "#ffa500",
      "line-width": 2,
      "line-opacity": 0.6
    }
  });
}

function showBalloonDetails(balloon) {
  const div = document.getElementById("balloon-details");
  if (!div) return;

  div.textContent = `
Balloon: ${balloon.id}
Position: ${balloon.lat.toFixed(4)}°, ${balloon.lon.toFixed(4)}°
Altitude: ${balloon.alt ? balloon.alt.toFixed(2) + ' km' : 'unknown'}
  `.trim();
}

function updateStatus(text) {
  const statusEl = document.getElementById('status');
  if (statusEl) statusEl.textContent = text;
  console.log('Status:', text);
}

// Manual refresh button
const refreshBtn = document.getElementById('refresh-now');
if (refreshBtn) {
  refreshBtn.addEventListener('click', () => {
    console.log('Manual refresh triggered');
    loadBalloons();
  });
}

console.log('App initialized');
init();