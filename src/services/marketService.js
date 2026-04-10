/**
 * Marketcheck Service
 * Search for bike/vehicle listings and inventory
 */

const axios = require('axios');

const MARKETCHECK_BASE_URL = 'https://api.marketcheck.com/v2';

/**
 * Search Marketcheck for bike/vehicle listings
 * @param {string} query - Search query
 * @param {Object} options - Search filters
 * @returns {Promise<Array>} - Array of normalized listings
 */
async function searchMarket(query, options = {}) {
  try {
    const apiKey = process.env.MARKETCHECK_API_KEY;
    
    if (!apiKey) {
      console.warn('Marketcheck API key not configured, using fallback');
      // Try alternate key
      const altKey = process.env.MARKETCHECK_API_KEY_ALT;
      if (!altKey) {
        throw new Error('No Marketcheck API key available');
      }
      return searchWithKey(query, altKey, options);
    }

    return searchWithKey(query, apiKey, options);
  } catch (error) {
    console.error('Error searching Marketcheck:', error.message);
    return [];
  }
}

/**
 * Search with specific API key
 * @param {string} query - Search query
 * @param {string} apiKey - API key to use
 * @param {Object} options - Search filters
 * @returns {Promise<Array>} - Normalized listings
 */
async function searchWithKey(query, apiKey, options = {}) {
  const params = {
    api_key: apiKey,
    search: query,
    start: options.start || 0,
    rows: options.rows || 20,
    ...options
  };

  // Marketcheck is primarily for cars/motorcycles
  // For bikes, we may need to use specific endpoints or filters
  const url = `${MARKETCHECK_BASE_URL}/search/car/active`;
  
  const response = await axios.get(url, { params });

  if (!response.data || response.data.error) {
    console.error('Marketcheck API error:', response.data?.error);
    return [];
  }

  return normalizeMarketListings(response.data.listings || []);
}

/**
 * Search for motorcycles/dirt bikes
 * @param {string} query - Search query (e.g., "electric dirt bike")
 * @param {Object} filters - Additional filters
 * @returns {Promise<Array>} - Array of motorcycle listings
 */
async function searchMotorcycles(query, filters = {}) {
  try {
    const apiKey = process.env.MARKETCHECK_API_KEY;
    
    if (!apiKey) {
      throw new Error('Marketcheck API key not configured');
    }

    const params = {
      api_key: apiKey,
      year_min: filters.yearMin,
      year_max: filters.yearMax,
      price_min: filters.priceMin,
      price_max: filters.priceMax,
      miles_max: filters.milesMax,
      radius: filters.radius || 50,
      zip: filters.zip,
      search: query,
      start: 0,
      rows: filters.rows || 20
    };

    // Remove undefined values
    Object.keys(params).forEach(key => 
      params[key] === undefined && delete params[key]
    );

    const url = `${MARKETCHECK_BASE_URL}/search/car/active`;
    const response = await axios.get(url, { params });

    if (!response.data || response.data.error) {
      console.error('Marketcheck motorcycles error:', response.data?.error);
      return [];
    }

    return normalizeMarketListings(response.data.listings || []);
  } catch (error) {
    console.error('Error searching motorcycles:', error.message);
    return [];
  }
}

/**
 * Get inventory stats (useful for showing trends to kids)
 * @param {string} query - Search query
 * @returns {Promise<Object>} - Inventory statistics
 */
async function getInventoryStats(query) {
  try {
    const apiKey = process.env.MARKETCHECK_API_KEY;
    
    if (!apiKey) {
      throw new Error('Marketcheck API key not configured');
    }

    const params = {
      api_key: apiKey,
      search: query
    };

    const url = `${MARKETCHECK_BASE_URL}/stats/market`;
    const response = await axios.get(url, { params });

    if (!response.data || response.data.error) {
      return null;
    }

    return {
      totalListings: response.data.num_listings,
      averagePrice: response.data.average_price,
      medianPrice: response.data.median_price,
      priceRange: {
        min: response.data.min_price,
        max: response.data.max_price
      },
      averageMiles: response.data.average_miles
    };
  } catch (error) {
    console.error('Error getting inventory stats:', error.message);
    return null;
  }
}

/**
 * Normalize Marketcheck listings to consistent format
 * @param {Array} listings - Raw Marketcheck listings
 * @returns {Array} - Normalized listings
 */
function normalizeMarketListings(listings) {
  return listings.map(listing => ({
    id: listing.id || listing.vin,
    title: listing.heading || `${listing.year} ${listing.make} ${listing.model}`,
    description: listing.dealer_description || '',
    price: listing.price,
    priceFormatted: formatPrice(listing.price),
    location: formatLocation(listing),
    distance: listing.distance,
    image: listing.media?.photo_links?.[0] || null,
    images: listing.media?.photo_links || [],
    year: listing.year,
    make: listing.make,
    model: listing.model,
    trim: listing.trim,
    miles: listing.miles,
    condition: listing.is_certified ? 'certified' : 'used',
    dealer: {
      name: listing.dealer_name,
      phone: listing.dealer_phone,
      city: listing.dealer_city,
      state: listing.dealer_state
    },
    vin: listing.vin,
    url: listing.vdp_url,
    source: 'marketcheck',
    type: 'vehicle'
  }));
}

/**
 * Format price for display
 * @param {number} price - Raw price
 * @returns {string} - Formatted price
 */
function formatPrice(price) {
  if (!price) return 'Price not available';
  return `$${price.toLocaleString()}`;
}

/**
 * Format location from listing
 * @param {Object} listing - Raw listing object
 * @returns {string} - Formatted location
 */
function formatLocation(listing) {
  const parts = [];
  if (listing.city) parts.push(listing.city);
  if (listing.state) parts.push(listing.state);
  if (listing.zip) parts.push(listing.zip);
  return parts.join(', ') || 'Location not available';
}

/**
 * Search for electric bikes/motorcycles (specific use case)
 * @param {Object} filters - Search filters
 * @returns {Promise<Array>} - Electric vehicle listings
 */
async function searchElectricBikes(filters = {}) {
  return searchMotorcycles('electric motorcycle', {
    ...filters,
    // Add electric-specific filters if available
  });
}

/**
 * Search for dirt bikes
 * @param {Object} filters - Search filters
 * @returns {Promise<Array>} - Dirt bike listings
 */
async function searchDirtBikes(filters = {}) {
  return searchMotorcycles('dirt bike', filters);
}

/**
 * Compare prices across listings
 * @param {Array} listings - Array of listings
 * @returns {Object} - Price comparison data
 */
function comparePrices(listings) {
  if (!listings || listings.length === 0) {
    return null;
  }

  const prices = listings
    .map(l => l.price)
    .filter(p => p && p > 0)
    .sort((a, b) => a - b);

  if (prices.length === 0) return null;

  return {
    lowest: prices[0],
    highest: prices[prices.length - 1],
    average: Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length),
    median: prices[Math.floor(prices.length / 2)],
    count: prices.length
  };
}

module.exports = {
  searchMarket,
  searchMotorcycles,
  searchElectricBikes,
  searchDirtBikes,
  getInventoryStats,
  comparePrices,
  normalizeMarketListings
};
