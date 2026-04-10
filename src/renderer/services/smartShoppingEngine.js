import { rankProducts } from './productRanking';
import {
  STRICT_REASON,
  filterStrictProducts,
  deriveNoResultsReasonCode,
} from './strictProductFilter';
import { enrichProductsWithVideoValidation } from './videoValidationService';
import { getBuildSignals } from './buildSignalEngine';

const DEFAULT_LOCATION = {
  zipCode: '',
  radiusMiles: 25,
  preferredPickup: false,
};

const ALLOWED_SOURCES = new Set([
  'amazon',
  'ebay',
]);

const MIN_SCORE_THRESHOLD = 40;

function normalizeSource(source) {
  const value = String(source || '').toLowerCase();
  if (value === 'facebook-marketplace') return 'facebook_marketplace';
  if (value === 'google places' || value === 'google_places') return 'google_places';
  return value;
}

function normalizeProductShape(item, sourceFallback = 'marketcheck') {
  const source = normalizeSource(item?.source || item?.sourceLabel || sourceFallback);
  const basePrice = Number(item?.totalPrice ?? item?.price ?? 0);

  return {
    id: item?.id || `${source}-${Math.random().toString(36).slice(2, 10)}`,
    title: item?.title || 'Listing',
    price: Number.isFinite(basePrice) ? basePrice : 0,
    shippingCost: Number.isFinite(Number(item?.shipping)) ? Number(item.shipping) : 0,
    totalCost: Number.isFinite(basePrice) ? basePrice : 0,
    image: item?.image || item?.thumbnail || 'https://via.placeholder.com/240x240?text=Listing',
    source,
    distance: Number.isFinite(Number(item?.distance)) ? Number(item.distance) : null,
    type: item?.type || 'online',
    score: 0,
    category: item?.category || '',
    compatibilityHint: '',
    url: item?.url || '',
  };
}

function reasonCodeToMessage(code) {
  if (code === STRICT_REASON.BLOCKED_TERM) {
    return 'No relevant listings found after removing blocked off-domain results.';
  }

  if (code === STRICT_REASON.CATEGORY_MISMATCH) {
    return 'No relevant listings found that matched the required part category.';
  }

  if (code === STRICT_REASON.BELOW_THRESHOLD) {
    return 'No relevant listings found that met the quality threshold.';
  }

  return 'No relevant listings found after strict relevance checks.';
}

function extractList(value, fallbackKey) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (Array.isArray(value[fallbackKey])) return value[fallbackKey];
  return [];
}

async function safeSearch(factory) {
  try {
    return await factory();
  } catch {
    return null;
  }
}

export function buildSmartQuery(query, part) {
  const base = String(query || part?.name || '').trim();
  const category = String(part?.category || '').toLowerCase();

  if (category.includes('motor')) {
    return `${base} ebike mid drive 48V kit`.trim();
  }

  if (category.includes('battery') || category.includes('power')) {
    return `${base} ebike lithium 48V downtube`.trim();
  }

  return `${base} bicycle compatible`.trim();
}

export function estimateShipping(item, zipCode) {
  if (Number.isFinite(Number(item?.shipping)) && Number(item.shipping) > 0) {
    return Number(item.shipping);
  }

  const price = Number(item?.price || 0);
  if (price < 50) return 10;
  if (price < 200) return 20;

  // Keep room for future ZIP-zone shipping logic.
  if (zipCode) {
    return 35;
  }

  return 40;
}

export function filterSources(results) {
  const safe = Array.isArray(results) ? results : [];
  return safe.filter((item) => ALLOWED_SOURCES.has(normalizeSource(item.source)));
}

export function filterBikeProducts(results, category) {
  const strict = filterStrictProducts(results, { category });
  return strict.accepted;
}

export async function searchOnlineProducts(query, location) {
  const [marketResult, retailerResult, ebayResult] = await Promise.all([
    safeSearch(() => window.api.market.search(query, { rows: 8 })),
    safeSearch(() => window.api.shopping.searchRetailers(query)),
    safeSearch(() => window.api.shopping.searchEbay(query, location?.zipCode || '')),
  ]);

  const marketListings = extractList(marketResult, 'listings').map((item) => normalizeProductShape(item, 'marketcheck'));
  const retailerListings = extractList(retailerResult, 'results').map((item) => normalizeProductShape(item, 'amazon'));
  const ebayListings = extractList(ebayResult, 'results').map((item) => normalizeProductShape(item, 'ebay'));

  return [...marketListings, ...retailerListings, ...ebayListings].map((item) => {
    const shipping = estimateShipping(item, location?.zipCode || '');
    return {
      ...item,
      shippingCost: shipping,
      totalCost: Number((Number(item.price || 0) + shipping).toFixed(2)),
      type: 'online',
    };
  });
}

export async function searchLocalProducts() {
  // Local search is intentionally disabled until fully implemented with real listings.
  return [];
}

export function enrichWithLocationData(products, location) {
  const activeLocation = {
    ...DEFAULT_LOCATION,
    ...(location || {}),
  };

  return (Array.isArray(products) ? products : []).map((item) => ({
    ...item,
    distance: Number.isFinite(Number(item.distance)) ? Number(item.distance) : null,
    zipCode: activeLocation.zipCode,
  }));
}

function dedupeResults(products) {
  const seen = new Set();
  const deduped = [];

  (products || []).forEach((item) => {
    const key = `${String(item.title || '').toLowerCase()}|${String(item.source || '')}|${String(item.url || '').toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(item);
    }
  });

  return deduped;
}

async function runSmartSearch({ query, part, project, location }) {
  const optimizedQuery = buildSmartQuery(query, part);
  const activeLocation = {
    ...DEFAULT_LOCATION,
    ...(location || {}),
  };

  const [onlineResults, localResults] = await Promise.all([
    searchOnlineProducts(optimizedQuery, activeLocation),
    searchLocalProducts(optimizedQuery, activeLocation),
  ]);

  const merged = dedupeResults([...onlineResults, ...localResults]);
  const allowed = filterSources(merged);
  const enriched = enrichWithLocationData(allowed, activeLocation);
  const signals = await getBuildSignals(part || {});
  const strict = filterStrictProducts(enriched, part || {});

  if (strict.accepted.length === 0) {
    const noResultsCode = deriveNoResultsReasonCode(strict.rejected);
    return {
      products: [],
      signals,
      noResultsCode,
      noResultsReason: reasonCodeToMessage(noResultsCode),
    };
  }

  const validated = await enrichProductsWithVideoValidation(strict.accepted, part || {}, optimizedQuery);
  const ranked = rankProducts(validated, part || {}, project || {}, signals);
  const thresholded = ranked.filter((item) => Number(item?.score || 0) >= MIN_SCORE_THRESHOLD);

  if (thresholded.length === 0) {
    return {
      products: [],
      signals,
      noResultsCode: STRICT_REASON.BELOW_THRESHOLD,
      noResultsReason: reasonCodeToMessage(STRICT_REASON.BELOW_THRESHOLD),
    };
  }

  const products = thresholded.map((item) => ({
    ...item,
    signals,
    category: part?.category || item.category || 'general',
    compatibilityHint: Array.isArray(item.explanation) && item.explanation.length > 0
      ? item.explanation[0]
      : 'Matches bike project filters',
  }));

  return {
    products,
    signals,
    noResultsCode: null,
    noResultsReason: null,
  };
}

export async function smartSearchWithMeta(params) {
  return runSmartSearch(params || {});
}

export async function smartSearch(params) {
  const result = await runSmartSearch(params || {});
  return result.products;
}

export default {
  smartSearch,
  smartSearchWithMeta,
  buildSmartQuery,
  filterBikeProducts,
  filterSources,
  enrichWithLocationData,
  searchOnlineProducts,
  searchLocalProducts,
  estimateShipping,
};
