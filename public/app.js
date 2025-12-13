import { fetchCurrentBalloons } from "./lib/balloons.js";
import { fetchBurgerKingLocations, createBalloonBKConnections } from "./lib/burgerking.js";

const map = new maplibregl.Map({
  container: "map",
  style: "https://demotiles.maplibre.org/style.json",
  center: [-98.5795, 39.8283], // Center of USA
  zoom: 4
});

let balloons = [];
let burgerKings = [];
let connections = [];
let markers = [];
let burgerKingMarkers = [];
let connectionLines = [];
let MAX_BALLOONS = 100;

async function init() {
  map.on('load', async () => {
    console.log('Map loaded, fetching data...');
    await loadData();
    setInterval(loadData, 60 * 60 * 1000); // Refresh every hour
  });
}

async function loadData() {
  updateStatus('Loading data...');

  // Fetch both balloons and BK locations
  const [balloonsData, bkData] = await Promise.all([
    fetchCurrentBalloons(),
    fetchBurgerKingLocations()
  ]);

  balloons = balloonsData.slice(0, MAX_BALLOONS);
  burgerKings = bkData;

  console.log(`Loaded ${balloons.length} balloons and ${burgerKings.length} Burger Kings`);

  // Create connections
  connections = createBalloonBKConnections(balloons, burgerKings);

  updateStatus(`${balloons.length} balloons • ${burgerKings.length} Burger Kings`);
  updateConnectionStats();

  renderMap();
}

function clearMarkers() {
  markers.forEach(m => m.remove());
  markers = [];

  burgerKingMarkers.forEach(m => m.remove());
  burgerKingMarkers = [];

  connectionLines.forEach(lineId => {
    if (map.getLayer(lineId)) map.removeLayer(lineId);
    if (map.getSource(lineId)) map.removeSource(lineId);
  });
  connectionLines = [];
}

function renderMap() {
  if (!map.isStyleLoaded()) {
    map.once('idle', renderMap);
    return;
  }

  clearMarkers();

  // Render Burger Kings
  burgerKings.forEach(bk => {
    const el = document.createElement('div');
    el.innerHTML = '🍔';
    el.style.fontSize = '24px';
    el.style.cursor = 'pointer';
    el.style.textShadow = '0 0 4px white';

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([bk.lng, bk.lat])
      .addTo(map);

    el.addEventListener('click', () => {
      new maplibregl.Popup({ offset: 25 })
        .setLngLat([bk.lng, bk.lat])
        .setHTML(`
          <div style="font-family: monospace; font-size: 12px;">
            <strong style="color: #d62300;">🍔 Burger King</strong><br/>
            ${bk.name}<br/>
            ${bk.address || ''}<br/>
            ${bk.lat.toFixed(4)}°, ${bk.lng.toFixed(4)}°
          </div>
        `)
        .addTo(map);
    });

    burgerKingMarkers.push(marker);
  });

  // Render balloons and connection lines
  connections.forEach((conn, index) => {
    const balloon = conn.balloon;
    const bk = conn.burgerKing;

    // Draw line from balloon to closest BK
    const lineId = `line-${balloon.id}`;

    try {
      map.addSource(lineId, {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [
              [balloon.lon, balloon.lat],
              [bk.lng, bk.lat]
            ]
          }
        }
      });

      map.addLayer({
        id: lineId,
        type: "line",
        source: lineId,
        layout: {
          "line-join": "round",
          "line-cap": "round"
        },
        paint: {
          "line-color": "#00ff00",
          "line-width": 2,
          "line-opacity": 0.4,
          "line-dasharray": [2, 2]
        }
      });

      connectionLines.push(lineId);
    } catch (e) {
      console.error(`Failed to draw line for ${balloon.id}:`, e);
    }

    // Add balloon marker
    const el = document.createElement('div');
    el.className = 'balloon-marker';
    el.style.backgroundColor = '#ffff00';
    el.style.width = '16px';
    el.style.height = '16px';
    el.style.borderRadius = '50%';
    el.style.border = '3px solid #ff4f4f';
    el.style.cursor = 'pointer';
    el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.5)';

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([balloon.lon, balloon.lat])
      .addTo(map);

    // Hover effects
    el.addEventListener('mouseenter', () => {
      if (map.getLayer(lineId)) {
        map.setPaintProperty(lineId, 'line-opacity', 0.8);
        map.setPaintProperty(lineId, 'line-width', 3);
      }
    });

    el.addEventListener('mouseleave', () => {
      if (map.getLayer(lineId)) {
        map.setPaintProperty(lineId, 'line-opacity', 0.4);
        map.setPaintProperty(lineId, 'line-width', 2);
      }
    });

    // Click to show info
    el.addEventListener('click', () => {
      if (map.getLayer(lineId)) {
        map.setPaintProperty(lineId, 'line-opacity', 1);
        map.setPaintProperty(lineId, 'line-width', 4);
      }

      new maplibregl.Popup({ offset: 25 })
        .setLngLat([balloon.lon, balloon.lat])
        .setHTML(`
          <div style="font-family: monospace; font-size: 12px;">
            <strong style="color: #ffff00;">🎈 ${balloon.id}</strong><br/>
            Position: ${balloon.lat.toFixed(4)}°, ${balloon.lon.toFixed(4)}°<br/>
            Altitude: ${balloon.alt ? balloon.alt.toFixed(2) + ' km' : 'unknown'}<br/>
            <hr style="margin: 8px 0;"/>
            <strong style="color: #00ff00;">Nearest Burger King:</strong><br/>
            ${bk.name}<br/>
            Distance: ${conn.distanceMiles} miles<br/>
            (${Math.round(conn.distance)} meters)
          </div>
        `)
        .addTo(map);

      showBalloonDetails(conn);
    });

    markers.push(marker);
  });

  console.log(`Rendered ${markers.length} balloons with ${connectionLines.length} connection lines`);
}

function showBalloonDetails(conn) {
  const div = document.getElementById("balloon-details");

  div.textContent = `
Balloon: ${conn.balloon.id}
Position: ${conn.balloon.lat.toFixed(4)}°, ${conn.balloon.lon.toFixed(4)}°
Altitude: ${conn.balloon.alt ? conn.balloon.alt.toFixed(2) + ' km' : 'unknown'}

Nearest Burger King:
  ${conn.burgerKing.name}
  ${conn.burgerKing.address || ''}
  Distance: ${conn.distanceMiles} miles (${Math.round(conn.distance)} meters)
  `.trim();
}

function updateStatus(text) {
  const statusEl = document.getElementById('status');
  if (statusEl) statusEl.textContent = text;
}

function updateConnectionStats() {
  const statsEl = document.getElementById('connection-stats');
  if (statsEl) {
    const avgDistance = connections.reduce((sum, c) => sum + parseFloat(c.distanceMiles), 0) / connections.length;
    statsEl.textContent = `${connections.length} connections • Avg distance: ${avgDistance.toFixed(1)} miles`;
  }
}

// Event listeners
const refreshBtn = document.getElementById('refresh-now');
if (refreshBtn) {
  refreshBtn.addEventListener('click', loadData);
}

const slider = document.getElementById('max-balloons-slider');
const sliderValue = document.getElementById('max-balloons-value');

if (slider) {
  slider.addEventListener('input', () => {
    const newMax = parseInt(slider.value, 10);
    if (MAX_BALLOONS !== newMax) {
      MAX_BALLOONS = newMax;
      sliderValue.textContent = MAX_BALLOONS;
      loadData();
    }
  });
}

init();