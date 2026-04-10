const LOCAL_SOURCES = new Set(['offerup', 'facebook-marketplace']);

function normalizeRetailerResult(result) {
  const price = Number(result?.price?.amount || 0);
  const shipping = 0;

  return {
    id: result.id,
    title: result.title,
    price,
    shipping,
    totalPrice: Number((price + shipping).toFixed(2)),
    rating: result.sourceMetadata?.rating || 4.1,
    image: result.thumbnail || 'https://via.placeholder.com/240x240?text=Bike+Part',
    source: 'amazon',
    sourceLabel: result.sourceName || result.source,
    url: result.url,
  };
}

function normalizeLocalResult(result) {
  const price = Number(result?.price?.amount || 0);
  const shipping = 0;

  return {
    id: result.id,
    title: result.title,
    price,
    shipping,
    totalPrice: Number((price + shipping).toFixed(2)),
    rating: result.sourceMetadata?.rating || 4.2,
    image: result.thumbnail || 'https://via.placeholder.com/240x240?text=Local+Pickup',
    source: 'local',
    sourceLabel: result.sourceName || 'Local Pickup',
    url: result.url,
  };
}

async function searchRetailerProducts(shoppingManager, query) {
  if (!shoppingManager) {
    return [];
  }

  const results = await shoppingManager.search([query], { intent: 'buy', usOnly: true });
  return results
    .filter((result) => !LOCAL_SOURCES.has(result.source))
    .slice(0, 8)
    .map(normalizeRetailerResult);
}

async function searchLocalProducts(shoppingManager, query) {
  if (!shoppingManager) {
    return [];
  }

  const results = await shoppingManager.search([query], { intent: 'buy', localOnly: true });
  return results
    .filter((result) => LOCAL_SOURCES.has(result.source))
    .slice(0, 8)
    .map(normalizeLocalResult);
}

module.exports = {
  searchRetailerProducts,
  searchLocalProducts,
};