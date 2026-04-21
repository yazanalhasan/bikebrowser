const { ipcMain } = require('electron');
const marketService = require('../../services/marketService');
const ctx = require('./ctx');

function register() {
  ipcMain.handle('market:search', async (event, { query, options }) => {
    try {
      console.log('Market search request:', query);
      const listings = await ctx.withIpcCache(
        'market:search',
        { query: String(query || '').trim(), options: options || {} },
        45 * 1000,
        async () => marketService.searchMarket(query, options)
      );
      return { success: true, listings };
    } catch (error) {
      console.error('Market search error:', error);
      return { success: false, error: error.message, listings: [] };
    }
  });

  ipcMain.handle('market:motorcycles', async (event, { query, filters }) => {
    try {
      console.log('Motorcycle search request:', query);
      const listings = await marketService.searchMotorcycles(query, filters);
      return { success: true, listings };
    } catch (error) {
      console.error('Motorcycle search error:', error);
      return { success: false, error: error.message, listings: [] };
    }
  });

  ipcMain.handle('market:electricBikes', async (event, filters) => {
    try {
      console.log('Electric bike search request');
      const listings = await marketService.searchElectricBikes(filters);
      return { success: true, listings };
    } catch (error) {
      console.error('Electric bike search error:', error);
      return { success: false, error: error.message, listings: [] };
    }
  });

  ipcMain.handle('market:dirtBikes', async (event, filters) => {
    try {
      console.log('Dirt bike search request');
      const listings = await marketService.searchDirtBikes(filters);
      return { success: true, listings };
    } catch (error) {
      console.error('Dirt bike search error:', error);
      return { success: false, error: error.message, listings: [] };
    }
  });

  ipcMain.handle('market:stats', async (event, query) => {
    try {
      console.log('Market stats request:', query);
      const stats = await marketService.getInventoryStats(query);
      return { success: true, stats };
    } catch (error) {
      console.error('Market stats error:', error);
      return { success: false, error: error.message, stats: null };
    }
  });

  ipcMain.handle('market:comparePrices', async (event, listings) => {
    try {
      const comparison = marketService.comparePrices(listings);
      return { success: true, comparison };
    } catch (error) {
      console.error('Price comparison error:', error);
      return { success: false, error: error.message, comparison: null };
    }
  });
}

module.exports = { register };
