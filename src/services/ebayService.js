const axios = require('axios');

const EBAY_FINDING_URL = 'https://svcs.ebay.com/services/search/FindingService/v1';

function hasValidAppId() {
  const appId = String(process.env.EBAY_APP_ID || '').trim();
  return Boolean(appId && !appId.includes('your_ebay_app_id_here') && !appId.includes('your-app-id'));
}

function normalizeEbayItems(items = []) {
  return items.map((item) => {
    const sellingStatus = item.sellingStatus?.[0] || {};
    const shippingInfo = item.shippingInfo?.[0] || {};
    const price = Number(sellingStatus.currentPrice?.[0]?.__value__ || 0);
    const shipping = Number(shippingInfo.shippingServiceCost?.[0]?.__value__ || 0);
    const image = item.galleryURL?.[0] || item.pictureURLLarge?.[0] || '';

    return {
      id: item.itemId?.[0] || `ebay-${Math.random().toString(36).slice(2, 8)}`,
      title: item.title?.[0] || 'eBay listing',
      price,
      shipping,
      totalPrice: Number((price + shipping).toFixed(2)),
      rating: shippingInfo.topRatedListing?.[0] === 'true' ? 4.6 : 4.0,
      image,
      source: 'ebay',
      sourceLabel: 'eBay',
      url: item.viewItemURL?.[0] || '',
    };
  });
}

async function searchEbay(query, zipcode, limit = 6) {
  if (!hasValidAppId()) {
    return [];
  }

  try {
    const response = await axios.get(EBAY_FINDING_URL, {
      params: {
        'OPERATION-NAME': 'findItemsByKeywords',
        'SERVICE-VERSION': '1.0.0',
        'SECURITY-APPNAME': process.env.EBAY_APP_ID,
        'RESPONSE-DATA-FORMAT': 'JSON',
        'REST-PAYLOAD': true,
        keywords: query,
        sortOrder: 'PricePlusShippingLowest',
        buyerPostalCode: zipcode,
        'paginationInput.entriesPerPage': limit,
        'outputSelector(0)': 'SellerInfo',
        'outputSelector(1)': 'PictureURLLarge'
      },
      timeout: 12000,
    });

    const items = response.data?.findItemsByKeywordsResponse?.[0]?.searchResult?.[0]?.item || [];
    return normalizeEbayItems(items);
  } catch (error) {
    console.error('eBay search error:', error.message);
    return [];
  }
}

module.exports = {
  searchEbay,
  hasValidAppId,
};
