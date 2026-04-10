import type { Product } from './types';
import { smartSearch } from '../smartShoppingEngine';

const BLOCKED_TERMS = ['weapon', 'gun', 'adult', 'nsfw', 'violent'];
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=400&q=80';

const QUERY_EXPANSIONS: Record<string, string> = {
  chain: 'bicycle chain durable 9 speed',
  grease: 'bike bearing grease waterproof',
  wheel: 'bike training wheel repair replacement',
  tire: 'bike tire puncture resistant tube set',
  tube: 'bike inner tube puncture resistant',
  wrench: 'bike repair wrench tool beginner',
  brake: 'bike brake pad replacement safe kit',
  helmet: 'kids bike helmet safety certified',
};

class PriceSearchService {
  private cache = new Map<string, Product[]>();

  expandQuery(query: string) {
    const normalized = query.trim().toLowerCase();
    return QUERY_EXPANSIONS[normalized] || `${normalized} bike project part`;
  }

  async search(query: string, zipcode: string) {
    const expandedQuery = this.expandQuery(query);
    const cacheKey = `${expandedQuery}::${zipcode}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) || [];
    }

    const ranked = (await smartSearch({
      query: expandedQuery,
      part: {
        name: query,
        category: 'general',
      },
      project: {
        notes: '',
      },
      location: {
        zipCode: zipcode,
        radiusMiles: 25,
        preferredPickup: false,
      },
    }))
      .filter((product) => this.isSafeAndRelevant(product))
      .map((product) => this.ensureProducts([product as Product], product.source as Product['source'])[0])
      .sort((left, right) => left.totalPrice - right.totalPrice)
      .slice(0, 5);

    this.cache.set(cacheKey, ranked);
    return ranked;
  }

  async searchMany(queries: string[], zipcode: string) {
    const entries = await Promise.all(
      queries.map(async (query) => [query, await this.search(query, zipcode)] as const)
    );

    return Object.fromEntries(entries);
  }

  clearCache() {
    this.cache.clear();
  }

  private isSafeAndRelevant(product: Product) {
    const lowerTitle = product.title.toLowerCase();
    const hasBlockedTerm = BLOCKED_TERMS.some((term) => lowerTitle.includes(term));
    if (hasBlockedTerm) {
      return false;
    }

    if (!product.image) {
      return false;
    }

    // Accept products with no rating (undefined) or rating >= 3.0 from APIs
    const rating = product.rating;
    if (rating !== undefined && rating !== null && rating < 3.0) {
      return false;
    }

    return true;
  }

  private slugify(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  private ensureProducts(products: Product[], source: Product['source']) {
    return products.map((product, index) => {
      const price = Number(product.price || 0);
      const shipping = Number(product.shipping || product.shippingCost || 0);
      return {
        id: product.id || `${source}-${this.slugify(product.title || `${source}-${index}`)}`,
        title: product.title,
        price,
        shipping,
        totalPrice: Number((price + shipping).toFixed(2)),
        rating: product.rating,
        image: product.image || DEFAULT_IMAGE,
        source: product.source || source,
        sourceLabel: product.sourceLabel,
        url: product.url,
      };
    });
  }
}

export const priceSearchService = new PriceSearchService();
