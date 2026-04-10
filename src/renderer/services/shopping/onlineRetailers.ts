import type { Product, PriceSearchResultMap } from '../services/shopping/types';

export type OnlineRetailer = {
  key: string;
  name: string;
  color: string;
  icon: string;
  products: Product[];
  searchLinks: { material: string; url: string }[];
};

type RetailerConfig = {
  key: string;
  name: string;
  color: string;
  icon: string;
  sourceMatch: (source: string) => boolean;
  searchUrl: (query: string) => string;
};

const RETAILERS: RetailerConfig[] = [
  {
    key: 'amazon',
    name: 'Amazon',
    color: 'bg-orange-500',
    icon: '📦',
    sourceMatch: (s) => s === 'amazon',
    searchUrl: (q) => `https://www.amazon.com/s?k=${encodeURIComponent(q + ' bike')}`,
  },
  {
    key: 'ebay',
    name: 'eBay',
    color: 'bg-blue-600',
    icon: '🏷️',
    sourceMatch: (s) => s === 'ebay',
    searchUrl: (q) => `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(q + ' bike')}`,
  },
  {
    key: 'walmart',
    name: 'Walmart',
    color: 'bg-blue-500',
    icon: '🏬',
    sourceMatch: (s) => s === 'walmart',
    searchUrl: (q) => `https://www.walmart.com/search?q=${encodeURIComponent(q + ' bike')}`,
  },
];

export function buildOnlineRetailers(
  results: PriceSearchResultMap,
  materials: string[],
): OnlineRetailer[] {
  const allProducts = materials.flatMap((m) => results[m] || []);

  return RETAILERS.map((config) => {
    const products = dedupeProducts(
      allProducts.filter((p) => config.sourceMatch(String(p.source || '').toLowerCase())),
    );

    const searchLinks = materials.map((m) => ({
      material: m,
      url: config.searchUrl(m),
    }));

    return {
      key: config.key,
      name: config.name,
      color: config.color,
      icon: config.icon,
      products,
      searchLinks,
    };
  });
}

function dedupeProducts(products: Product[]): Product[] {
  const seen = new Set<string>();
  return products.filter((p) => {
    const key = `${p.title?.toLowerCase()}::${p.url?.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
