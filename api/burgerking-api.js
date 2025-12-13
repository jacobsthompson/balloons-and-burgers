// Vercel serverless function for Burger King locations
// Make sure to install: npm install restaurant-location-search-api

let getLocations;

// Try to import the package
try {
  getLocations = require('restaurant-location-search-api');
  console.log('✓ restaurant-location-search-api loaded successfully');
} catch (err) {
  console.error('Failed to load restaurant-location-search-api:', err.message);
  getLocations = null;
}

// Cache BK locations for 1 hour to reduce API calls
let cachedLocations = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Fallback locations in case API fails
const fallbackLocations = [
  { id: 'bk-001', lat: 34.052235, lng: -118.243683, name: "Burger King - Los Angeles", address: "Downtown LA", city: "Los Angeles", state: "CA" },
  { id: 'bk-002', lat: 40.712776, lng: -74.005974, name: "Burger King - New York", address: "Manhattan", city: "New York", state: "NY" },
  { id: 'bk-003', lat: 41.878113, lng: -87.629799, name: "Burger King - Chicago", address: "Downtown", city: "Chicago", state: "IL" },
  { id: 'bk-004', lat: 29.760427, lng: -95.369804, name: "Burger King - Houston", address: "Downtown", city: "Houston", state: "TX" },
  { id: 'bk-005', lat: 33.448376, lng: -112.074036, name: "Burger King - Phoenix", address: "Downtown", city: "Phoenix", state: "AZ" },
  { id: 'bk-006', lat: 37.774929, lng: -122.419418, name: "Burger King - San Francisco", address: "Downtown", city: "San Francisco", state: "CA" },
  { id: 'bk-007', lat: 39.952583, lng: -75.165222, name: "Burger King - Philadelphia", address: "Center City", city: "Philadelphia", state: "PA" },
  { id: 'bk-008', lat: 32.715736, lng: -117.161087, name: "Burger King - San Diego", address: "Downtown", city: "San Diego", state: "CA" },
  { id: 'bk-009', lat: 32.776665, lng: -96.796989, name: "Burger King - Dallas", address: "Downtown", city: "Dallas", state: "TX" },
  { id: 'bk-010', lat: 37.338207, lng: -121.886330, name: "Burger King - San Jose", address: "Downtown", city: "San Jose", state: "CA" }
];

module.exports = async (req, res) => {
  try {
    // Return cached data if still valid
    if (cachedLocations && Date.now() - cacheTimestamp < CACHE_DURATION) {
      console.log('Returning cached BK locations');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json(cachedLocations);
    }

    // If package didn't load, use fallback
    if (!getLocations) {
      console.warn('Using fallback locations - restaurant API not available');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json(fallbackLocations);
    }

    console.log('Fetching fresh BK locations from API...');

    // Fetch BK locations from multiple center points for better coverage
    const queries = [
      { lat: 39.8283, long: -98.5795, name: 'Central US' },
      { lat: 34.0522, long: -118.2437, name: 'West Coast' },
      { lat: 40.7128, long: -74.0060, name: 'East Coast' },
      { lat: 29.7604, long: -95.3698, name: 'South' },
      { lat: 41.8781, long: -87.6298, name: 'Midwest' }
    ];

    const allLocations = [];
    const seenIds = new Set();

    // Fetch locations from each region
    for (const query of queries) {
      try {
        console.log(`Fetching from ${query.name}...`);

        // Call the API
        const locations = await getLocations('burgerKing', {
          lat: query.lat,
          long: query.long
        }, '100000', '20'); // 100km radius, max 20 results

        console.log(`Received ${Array.isArray(locations) ? locations.length : 0} locations from ${query.name}`);

        if (Array.isArray(locations) && locations.length > 0) {
          locations.forEach(loc => {
            // Create unique ID from coordinates
            const coordId = `${loc.latitude}-${loc.longitude}`;

            if (!seenIds.has(coordId)) {
              seenIds.add(coordId);
              allLocations.push({
                id: `bk-${allLocations.length}`,
                lat: parseFloat(loc.latitude),
                lng: parseFloat(loc.longitude),
                name: loc.name || loc.address || 'Burger King',
                address: loc.address || '',
                city: loc.city || '',
                state: loc.state || ''
              });
            }
          });
        }
      } catch (err) {
        console.error(`Failed to fetch from ${query.name}:`, err.message);
      }
    }

    console.log(`Total unique BK locations fetched: ${allLocations.length}`);

    // If we got results, cache them
    if (allLocations.length > 0) {
      cachedLocations = allLocations;
      cacheTimestamp = Date.now();

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.status(200).json(allLocations);
    } else {
      // No results from API, use fallback
      console.warn('No locations from API, using fallback');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json(fallbackLocations);
    }

  } catch (error) {
    console.error('Error in BK locations API:', error);

    // Return fallback locations on error
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(fallbackLocations);
  }
};