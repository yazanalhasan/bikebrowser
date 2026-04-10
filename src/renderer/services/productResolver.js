import {
  smartSearchWithMeta,
  buildSmartQuery,
  filterBikeProducts,
  filterSources,
  searchOnlineProducts,
  searchLocalProducts,
  estimateShipping,
} from './smartShoppingEngine';
import { rankProducts } from './productRanking';
import { getBuildSignals } from './buildSignalEngine';
import { getKnownGoodProducts } from './curatedBuildLibrary';
import { generateFallbackLink } from './buildPlanner/curatedBuildMatcher';

const DEFAULT_SIGNALS = { youtube: [], bilibili: [], reddit: [] };

export function buildSearchQuery(part) {
  return buildSmartQuery(part?.name || '', part);
}

export function mergeAndRankResults(online, local) {
  const merged = [...(online || []), ...(local || [])];
  return merged.sort((a, b) => Number(a.totalCost || 0) - Number(b.totalCost || 0));
}

export function isValidListing(product) {
  const url = String(product?.url || '').trim();
  const title = String(product?.title || '').toLowerCase();
  const source = String(product?.source || '').toLowerCase();

  return (
    Boolean(url) &&
    url.startsWith('http') &&
    !title.includes('style listing') &&
    !source.includes('mock')
  );
}

function normalizeCategory(category) {
  const value = String(category || '').toLowerCase();
  if (value.includes('motor') || value.includes('drive')) return 'motor';
  if (value.includes('battery') || value.includes('power')) return 'battery';
  if (value.includes('brake')) return 'brakes';
  return 'general';
}

export function isRealisticPrice(product, category) {
  const price = Number(product?.price || 0);
  const normalizedCategory = normalizeCategory(category);

  if (normalizedCategory === 'motor') {
    return price > 300 && price < 1500;
  }

  if (normalizedCategory === 'battery') {
    return price > 200 && price < 800;
  }

  if (normalizedCategory === 'brakes') {
    return price > 50 && price < 300;
  }

  return true;
}

function parsePriceFloor(priceRange) {
  const text = String(priceRange || '');
  const matches = text.match(/\d+/g);
  if (!matches || matches.length === 0) {
    return 0;
  }

  return Number(matches[0]) || 0;
}

function boostKnownGoodProducts(products, part) {
  const safeProducts = Array.isArray(products) ? products : [];
  if (!part?.knownGood) {
    return safeProducts;
  }

  return safeProducts
    .map((product) => ({
      ...product,
      score: Number(product?.score || 0) + 30,
      explanation: [
        'Known-good curated part boost',
        ...(Array.isArray(product?.explanation) ? product.explanation : []),
      ].slice(0, 4),
    }))
    .sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
}

function toCuratedProduct(entry, part, signals, index) {
  const category = normalizeCategory(part?.category);
  const price = parsePriceFloor(entry?.priceRange);

  const firstQuery = Array.isArray(part?.exampleSearchQueries) && part.exampleSearchQueries.length > 0
    ? part.exampleSearchQueries[0]
    : part?.name || entry?.name || '';

  return {
    id: `curated-${category}-${index + 1}`,
    title: entry?.name || `${part?.name || 'Part'} (curated)`,
    price,
    shippingCost: 0,
    totalCost: price,
    image: 'https://via.placeholder.com/240x240?text=Curated+Part',
    source: 'curated',
    sourceLabel: 'Curated Build Library',
    url: entry?.url || generateFallbackLink(firstQuery),
    type: 'online',
    score: 55,
    explanation: [
      'Known-good part from curated build library',
      entry?.priceRange ? `Expected price range: ${entry.priceRange}` : 'Price range curated from known listings',
    ],
    knownGood: true,
    signals,
  };
}

function passesRelaxedMatch(product, part) {
  const text = String(product?.title || '').toLowerCase();
  const firstToken = String(part?.name || '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)[0];

  return (
    (Boolean(firstToken) && text.includes(firstToken)) ||
    text.includes('ebike') ||
    text.includes('bike')
  );
}

async function searchRelaxed(part, location, project, incomingSignals) {
  const relaxedQuery = `${String(part?.name || '').trim()} ebike bike`;
  const online = await searchOnlineProducts(relaxedQuery, location || {});
  const filtered = filterSources(online)
    .filter(isValidListing)
    .filter((product) => isRealisticPrice(product, part?.category))
    .filter((product) => passesRelaxedMatch(product, part));

  if (filtered.length === 0) {
    return {
      products: [],
      signals: incomingSignals || DEFAULT_SIGNALS,
    };
  }

  const signals = incomingSignals || await getBuildSignals(part || {});
  const ranked = rankProducts(filtered, part || {}, project || {}, signals)
    .filter((product) => Number(product?.score || 0) >= 20);

  return {
    products: ranked.slice(0, 3),
    signals,
  };
}

async function resolveWithFallback(part, project, location) {
  const strictQuery = buildSearchQuery(part);
  const strict = await smartSearchWithMeta({
    query: strictQuery,
    part,
    project,
    location,
  });

  const strictProducts = (Array.isArray(strict?.products) ? strict.products : [])
    .filter(isValidListing)
    .filter((product) => isRealisticPrice(product, part?.category));

  if (strictProducts.length > 0) {
    const boosted = boostKnownGoodProducts(strictProducts, part);
    return {
      products: boosted.slice(0, 3),
      signals: strict?.signals || DEFAULT_SIGNALS,
      noResultsReason: null,
      noResultsCode: null,
      resolutionTier: 'strict',
    };
  }

  const relaxed = await searchRelaxed(part, location, project, strict?.signals || DEFAULT_SIGNALS);
  const relaxedProducts = Array.isArray(relaxed.products) ? relaxed.products : [];

  if (relaxedProducts.length > 0) {
    const boosted = boostKnownGoodProducts(relaxedProducts, part);
    return {
      products: boosted,
      signals: relaxed.signals || strict?.signals || DEFAULT_SIGNALS,
      noResultsReason: null,
      noResultsCode: null,
      resolutionTier: 'relaxed',
    };
  }

  const signals = relaxed.signals || strict?.signals || await getBuildSignals(part || {});
  const curatedEntries = getKnownGoodProducts(part || {});
  const curatedProducts = curatedEntries
    .map((entry, index) => toCuratedProduct(entry, part, signals, index))
    .filter(isValidListing)
    .slice(0, 3);

  // Proof-of-use shortcut: when validation signals are strong, prefer curated known-good links.
  if ((signals?.youtube?.length || 0) > 2 && curatedProducts.length > 0) {
    return {
      products: curatedProducts,
      signals,
      noResultsReason: null,
      noResultsCode: null,
      resolutionTier: 'curated-proof',
    };
  }

  if (curatedProducts.length > 0) {
    return {
      products: curatedProducts,
      signals,
      noResultsReason: null,
      noResultsCode: null,
      resolutionTier: 'curated',
    };
  }

  return {
    products: [],
    signals,
    noResultsReason: strict?.noResultsReason || 'No relevant listings found in strict, relaxed, or curated tiers.',
    noResultsCode: strict?.noResultsCode || 'tiered_source_empty',
    resolutionTier: 'none',
  };
}

export async function resolveProductsForParts(parts, location) {
  const safeParts = Array.isArray(parts) ? parts : [];
  const activeLocation = location || { zipCode: '', radiusMiles: 25, preferredPickup: false };
  const project = arguments.length > 2 ? arguments[2] : {};

  const resolved = await Promise.all(safeParts.map(async (part) => {
    const resolvedWithFallback = await resolveWithFallback(part, project, activeLocation);

    return {
      ...part,
      products: resolvedWithFallback.products,
      signals: resolvedWithFallback.signals || DEFAULT_SIGNALS,
      noResultsReason: resolvedWithFallback.noResultsReason || null,
      noResultsCode: resolvedWithFallback.noResultsCode || null,
      resolutionTier: resolvedWithFallback.resolutionTier,
    };
  }));

  return resolved;
}

export default {
  resolveProductsForParts,
  buildSearchQuery,
  filterSources,
  filterBikeProducts,
  searchOnlineProducts,
  searchLocalProducts,
  mergeAndRankResults,
  estimateShipping,
};
