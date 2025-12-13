// API endpoint to fetch Burger King locations
// Uses restaurant-location-search-api (no API key needed)
// Install: npm install restaurant-location-search-api

const getLocations = require('restaurant-location-search-api');

// Cache BK locations for 1 hour to reduce API calls
let cachedLocations = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

module.exports = async (req, res) => {
  try {
    // Return cached data if still valid
    if (cachedLocations && Date.now() - cacheTimestamp < CACHE_DURATION) {
      console.log('Returning cached BK locations');
      return res.status(200).json(cachedLocations);
    }

    console.log('Fetching fresh BK locations from API...');

    // Fetch BK locations across major US regions
    // We'll query multiple center points to get broader coverage
    const queries = [
      { lat: 39.8283, long: -98.5795, name: 'Central US' },      // Geographic center
      { lat: 34.0522, long: -118.2437, name: 'West Coast' },     // LA
      { lat: 40.7128, long: -74.0060, name: 'East Coast' },      // NYC
      { lat: 29.7604, long: -95.3698, name: 'South' },           // Houston
      { lat: 41.8781, long: -87.6298, name: 'Midwest' }          // Chicago
    ];

    const allLocations = [];
    const seenIds = new Set();

    // Fetch locations from each region
    for (const query of queries) {
      try {
        const locations = await getLocations('burgerKing', {
          lat: query.lat,
          long: query.long
        }, '100000', '20'); // 100km radius, max 20 results

        if (Array.isArray(locations)) {
          locations.forEach(loc => {
            // Create unique ID from coordinates
            const id = `${loc.latitude}-${loc.longitude}`;

            if (!seenIds.has(id)) {
              seenIds.add(id);
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

    console.log(`Fetched ${allLocations.length} unique BK locations`);

    // Cache the results
    cachedLocations = allLocations;
    cacheTimestamp = Date.now();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    return res.status(200).json(allLocations);

  } catch (error) {
    console.error('Error in BK locations API:', error);

    // Return fallback locations if API fails
    const fallbackLocations = [
      { id: 'bk-0', lat: 34.052235, lng: -118.243683, name: "Los Angeles, CA", address: "Downtown LA" },
      { id: 'bk-1', lat: 40.712776, lng: -74.005974, name: "New York, NY", address: "Manhattan" },
      { id: 'bk-2', lat: 41.878113, lng: -87.629799, name: "Chicago, IL", address: "Downtown" },
      { id: 'bk-3', lat: 29.760427, lng: -95.369804, name: "Houston, TX", address: "Downtown" },
      { id: 'bk-4', lat: 33.448376, lng: -112.074036, name: "Phoenix, AZ", address: "Downtown" }
    ];

    return res.status(200).json(fallbackLocations);
  }
};