import type { Product } from './types';

const BLOCKED_TERMS = ['weapon', 'gun', 'adult', 'nsfw', 'violent'];
const MOTORCYCLE_TERMS = [
  'motorcycle', 'motocross', 'dirt bike', 'mx helmet', 'atv',
  'offroad helmet', 'off-road helmet', 'moto helmet',
  'street bike', 'sportbike', 'supermoto',
  '520 chain', '525 chain', '530 chain', '428 chain',
  'x-ring chain', 'o-ring chain',
];
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=400&q=80';

const QUERY_EXPANSIONS: Record<string, string> = {
  chain: 'bicycle chain',
  grease: 'bike bearing grease',
  wheel: 'bicycle wheel replacement',
  tire: 'bicycle tire',
  tube: 'bicycle inner tube',
  wrench: 'bike repair wrench set',
  brake: 'bicycle brake pads',
  'brake pads': 'bicycle brake pads',
  helmet: 'kids bike helmet',
  pedals: 'bicycle pedals',
  pedal: 'bicycle pedals',
  seat: 'bicycle seat saddle',
  saddle: 'bicycle seat saddle',
  handlebars: 'bicycle handlebars',
  handlebar: 'bicycle handlebars',
  lock: 'bicycle lock',
  light: 'bicycle light',
  spoke: 'bicycle spokes',
  spokes: 'bicycle spokes',
  derailleur: 'bicycle derailleur',
  cable: 'bicycle cable set',
};

function isFallbackItem(item: any): boolean {
  // Fallback catalog items have no real URL or generic placeholder URLs
  const url = String(item?.url || '');
  return (
    !url ||
    url === '' ||
    url.startsWith('https://via.placeholder') ||
    url.includes('placeholder')
  );
}

function extractList(value: any, key: string): any[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (Array.isArray(value[key])) return value[key];
  return [];
}

class PriceSearchService {
  private cache = new Map<string, Product[]>();

  expandQuery(query: string) {
    const normalized = query.trim().toLowerCase();
    return QUERY_EXPANSIONS[normalized] || `bicycle ${normalized}`;
  }

  async search(query: string, zipcode: string) {
    const expandedQuery = this.expandQuery(query);
    const cacheKey = `${expandedQuery}::${zipcode}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) || [];
    }

    // Fetch from eBay and retailer sources in parallel via IPC
    const api = (window as any).api;
    const [ebayResult, retailerResult] = await Promise.all([
      this.safeCall(() => api?.shopping?.searchEbay?.(expandedQuery, zipcode)),
      this.safeCall(() => api?.shopping?.searchRetailers?.(expandedQuery)),
    ]);

    const ebayItems = extractList(ebayResult, 'results')
      .filter((item: any) => !isFallbackItem(item))
      .map((item: any) => this.normalizeProduct(item, 'ebay', 'eBay'));

    const retailerItems = extractList(retailerResult, 'results')
      .filter((item: any) => !isFallbackItem(item))
      .map((item: any) => this.normalizeProduct(item, item.source || 'retailer', item.sourceLabel || item.sourceName || 'Retailer'));

    const allProducts = [...ebayItems, ...retailerItems]
      .filter((p) => this.isSafeAndRelevant(p))
      .sort((a, b) => a.totalPrice - b.totalPrice)
      .slice(0, 6);

    this.cache.set(cacheKey, allProducts);
    return allProducts;
  }

  async searchMany(queries: string[], zipcode: string) {
    const entries = await Promise.all(
      queries.map(async (q) => [q, await this.search(q, zipcode)] as const),
    );
    return Object.fromEntries(entries);
  }

  clearCache() {
    this.cache.clear();
  }

  private async safeCall<T>(factory: () => Promise<T>): Promise<T | null> {
    try {
      return await factory();
    } catch {
      return null;
    }
  }

  private normalizeProduct(item: any, source: string, sourceLabel: string): Product {
    const price = Number(item?.price || item?.totalPrice || 0);
    const shipping = Number(item?.shipping || item?.shippingCost || 0);
    const title = String(item?.title || 'Listing');

    return {
      id: item?.id || `${source}-${this.slugify(title)}`,
      title,
      price,
      shipping,
      totalPrice: Number((price + shipping).toFixed(2)),
      rating: Number.isFinite(Number(item?.rating)) ? Number(item.rating) : undefined,
      image: item?.image || item?.thumbnail || DEFAULT_IMAGE,
      source: source as Product['source'],
      sourceLabel,
      url: item?.url || '',
    } as Product;
  }

  private isSafeAndRelevant(product: Product) {
    const lowerTitle = product.title.toLowerCase();
    if (BLOCKED_TERMS.some((term) => lowerTitle.includes(term))) {
      return false;
    }
    // Reject motorcycle / motocross products
    if (MOTORCYCLE_TERMS.some((term) => lowerTitle.includes(term))) {
      return false;
    }
    // Require a real URL — no fallback catalog items
    if (!product.url || product.url.includes('placeholder')) {
      return false;
    }
    return true;
  }

  private slugify(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
}

export const priceSearchService = new PriceSearchService();
