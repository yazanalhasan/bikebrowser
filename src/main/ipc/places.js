const { ipcMain } = require('electron');
const googlePlacesService = require('../../services/googlePlacesService');

function register() {
  ipcMain.handle('places:search', async (event, query) => {
    try {
      console.log('Places search request:', query);
      const places = await googlePlacesService.searchPlaces(query);
      return { success: true, places };
    } catch (error) {
      console.error('Places search error:', error);
      return { success: false, error: error.message, places: [] };
    }
  });

  ipcMain.handle('places:nearby', async (event, { lat, lng, type, radius }) => {
    try {
      console.log('Places nearby request:', lat, lng, type);
      const places = await googlePlacesService.searchNearby(lat, lng, type, radius);
      return { success: true, places };
    } catch (error) {
      console.error('Places nearby error:', error);
      return { success: false, error: error.message, places: [] };
    }
  });

  ipcMain.handle('places:details', async (event, placeId) => {
    try {
      console.log('Place details request:', placeId);
      const details = await googlePlacesService.getPlaceDetails(placeId);
      return { success: true, details };
    } catch (error) {
      console.error('Place details error:', error);
      return { success: false, error: error.message, details: null };
    }
  });

  ipcMain.handle('places:bikeShops', async (event, location) => {
    try {
      console.log('Bike shops search:', location);
      const shops = await googlePlacesService.findBikeShops(location);
      return { success: true, shops };
    } catch (error) {
      console.error('Bike shops search error:', error);
      return { success: false, error: error.message, shops: [] };
    }
  });
}

module.exports = { register };
