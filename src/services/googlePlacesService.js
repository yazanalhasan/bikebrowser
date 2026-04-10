/**
 * Google Maps Places Service
 * Search for local businesses (bike shops, repair shops, etc.)
 */

const axios = require('axios');

const GOOGLE_PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

/**
 * Search for places using text query
 * @param {string} query - Search query (e.g., "bike shop near 85255")
 * @param {Object} options - Additional search options
 * @returns {Promise<Array>} - Array of normalized place results
 */
async function searchPlaces(query, options = {}) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    const params = {
      query: query,
      key: apiKey,
      ...options
    };

    const url = `${GOOGLE_PLACES_BASE_URL}/textsearch/json`;
    const response = await axios.get(url, { params });

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', response.data.status);
      return [];
    }

    return normalizeGooglePlaces(response.data.results || []);
  } catch (error) {
    console.error('Error searching Google Places:', error.message);
    return [];
  }
}

/**
 * Search for nearby places by location
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} type - Place type (e.g., 'bicycle_store')
 * @param {number} radius - Search radius in meters (default: 5000)
 * @returns {Promise<Array>} - Array of normalized place results
 */
async function searchNearby(lat, lng, type = 'bicycle_store', radius = 5000) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    const params = {
      location: `${lat},${lng}`,
      radius: radius,
      type: type,
      key: apiKey
    };

    const url = `${GOOGLE_PLACES_BASE_URL}/nearbysearch/json`;
    const response = await axios.get(url, { params });

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      console.error('Google Places Nearby API error:', response.data.status);
      return [];
    }

    return normalizeGooglePlaces(response.data.results || []);
  } catch (error) {
    console.error('Error searching nearby places:', error.message);
    return [];
  }
}

/**
 * Get detailed information about a place
 * @param {string} placeId - Google Place ID
 * @returns {Promise<Object>} - Detailed place information
 */
async function getPlaceDetails(placeId) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    const params = {
      place_id: placeId,
      fields: 'name,formatted_address,formatted_phone_number,opening_hours,website,rating,photos,geometry',
      key: apiKey
    };

    const url = `${GOOGLE_PLACES_BASE_URL}/details/json`;
    const response = await axios.get(url, { params });

    if (response.data.status !== 'OK') {
      console.error('Google Place Details API error:', response.data.status);
      return null;
    }

    return normalizeGooglePlace(response.data.result);
  } catch (error) {
    console.error('Error getting place details:', error.message);
    return null;
  }
}

/**
 * Normalize Google Places results to consistent format
 * @param {Array} places - Raw Google Places results
 * @returns {Array} - Normalized results
 */
function normalizeGooglePlaces(places) {
  return places.map(place => normalizeGooglePlace(place));
}

/**
 * Normalize a single Google Place
 * @param {Object} place - Raw Google Place object
 * @returns {Object} - Normalized place object
 */
function normalizeGooglePlace(place) {
  return {
    id: place.place_id,
    name: place.name,
    address: place.formatted_address || place.vicinity,
    location: {
      lat: place.geometry?.location?.lat,
      lng: place.geometry?.location?.lng
    },
    rating: place.rating,
    totalRatings: place.user_ratings_total,
    priceLevel: place.price_level,
    phone: place.formatted_phone_number,
    website: place.website,
    isOpen: place.opening_hours?.open_now,
    openingHours: place.opening_hours?.weekday_text,
    photo: place.photos?.[0] 
      ? getPhotoUrl(place.photos[0].photo_reference) 
      : null,
    source: 'google_places',
    type: 'business'
  };
}

/**
 * Get photo URL from photo reference
 * @param {string} photoReference - Google photo reference
 * @param {number} maxWidth - Maximum width in pixels (default: 400)
 * @returns {string} - Photo URL
 */
function getPhotoUrl(photoReference, maxWidth = 400) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey || !photoReference) return null;
  
  return `${GOOGLE_PLACES_BASE_URL}/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${apiKey}`;
}

/**
 * Search for bike shops near a location (convenience method)
 * @param {string} zipCode - US ZIP code or city name
 * @returns {Promise<Array>} - Array of bike shops
 */
async function findBikeShops(zipCode) {
  return searchPlaces(`bike shops near ${zipCode}`);
}

/**
 * Search for bike repair shops
 * @param {string} location - Location query
 * @returns {Promise<Array>} - Array of repair shops
 */
async function findRepairShops(location) {
  return searchPlaces(`bike repair shops near ${location}`);
}

module.exports = {
  searchPlaces,
  searchNearby,
  getPlaceDetails,
  findBikeShops,
  findRepairShops,
  getPhotoUrl
};
