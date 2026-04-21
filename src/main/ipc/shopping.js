const { ipcMain } = require('electron');
const { searchEbay } = require('../../services/ebayService');
const { searchRetailerProducts, searchLocalProducts } = require('../../services/projectShoppingService');
const ctx = require('./ctx');

function register() {
  ipcMain.handle('shopping:searchRetailers', async (_event, query) => {
    try {
      const shoppingManager = ctx.searchPipeline?.sources?.shopping;
      const results = await ctx.withIpcCache(
        'shopping:searchRetailers',
        { query: String(query || '').trim() },
        45 * 1000,
        async () => searchRetailerProducts(shoppingManager, query)
      );
      return { success: true, results };
    } catch (error) {
      console.error('Retailer shopping search error:', error.message);
      return { success: false, error: error.message, results: [] };
    }
  });

  ipcMain.handle('shopping:searchLocal', async (_event, query, zipcode) => {
    try {
      const shoppingManager = ctx.searchPipeline?.sources?.shopping;
      const results = await searchLocalProducts(shoppingManager, `${query} ${zipcode}`.trim());
      return { success: true, results };
    } catch (error) {
      console.error('Local shopping search error:', error.message);
      return { success: false, error: error.message, results: [] };
    }
  });

  ipcMain.handle('shopping:searchEbay', async (_event, query, zipcode) => {
    try {
      const results = await searchEbay(query, zipcode);
      return { success: true, results };
    } catch (error) {
      console.error('eBay shopping search error:', error.message);
      return { success: false, error: error.message, results: [] };
    }
  });
}

module.exports = { register };
