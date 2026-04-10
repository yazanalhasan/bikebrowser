const axios = require('axios');
const { BaseSourceManager } = require('../source-managers/base-manager');

const HOUR_MS = 60 * 60 * 1000;
const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeTitle(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeTitle(value) {
  const text = String(value || '')
    .replace(/[!?.]{2,}/g, '!')
    .replace(/\b(BEST|HOT|WOW|MUST SEE|AMAZING DEAL)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!text) {
    return 'Shopping result';
  }

  const letters = text.replace(/[^A-Za-z]/g, '');
  if (letters.length > 4 && letters === letters.toUpperCase()) {
    return text.toLowerCase().replace(/(^|\s)\S/g, (match) => match.toUpperCase());
  }

  return text;
}

function extractPrice(value) {
  if (typeof value === 'number') {
    return value;
  }

  const match = String(value || '').replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
  return match ? Number.parseFloat(match[1]) : 0;
}

function titleSimilarity(left, right) {
  const leftWords = new Set(normalizeTitle(left).split(' ').filter(Boolean));
  const rightWords = new Set(normalizeTitle(right).split(' ').filter(Boolean));
  if (leftWords.size === 0 || rightWords.size === 0) {
    return 0;
  }

  const overlap = [...leftWords].filter((word) => rightWords.has(word)).length;
  const union = new Set([...leftWords, ...rightWords]).size;
  return union === 0 ? 0 : overlap / union;
}

// Words too generic to count as a real match on their own
const GENERIC_TOKENS = new Set(['bike', 'bicycle', 'cycling', 'cycle', 'part', 'parts', 'set', 'kit', 'replacement', 'durable', 'safe', 'project']);

function matchesQuery(item, queries) {
  const haystack = normalizeTitle(`${item.title} ${item.description || ''} ${(item.tags || []).join(' ')}`);
  const tokens = queries.flatMap((query) => normalizeTitle(query).split(' ').filter(Boolean));
  const specificTokens = tokens.filter((t) => !GENERIC_TOKENS.has(t));

  // Require at least one specific (non-generic) token to match
  if (specificTokens.length > 0) {
    return specificTokens.some((token) => haystack.includes(token));
  }

  // If all tokens are generic, require at least one match
  return tokens.some((token) => haystack.includes(token));
}

function fallbackCatalog() {
  return {
    aliexpress: [
      { id: 'ae-chain', title: 'Bicycle Chain 6/7/8 Speed', description: 'Universal bike chain for multi-speed drivetrains.', price: 8.50, thumbnail: '', tags: ['chain', 'drivetrain', 'bike', 'bicycle'], url: 'https://www.aliexpress.com/w/wholesale-bicycle-chain.html', sellerVerified: false, shippingEstimate: '10-20 days', country: 'CN', isInternational: true },
      { id: 'ae-tube', title: 'Bicycle Inner Tube 26 inch', description: 'Butyl rubber inner tube for 26 inch rims.', price: 3.20, thumbnail: '', tags: ['tube', 'inner tube', 'bike', 'bicycle'], url: 'https://www.aliexpress.com/w/wholesale-bicycle-inner-tube.html', sellerVerified: false, shippingEstimate: '10-20 days', country: 'CN', isInternational: true },
      { id: 'ae-brake', title: 'Bicycle Brake Pads V-Brake', description: 'Replacement V-brake pads for rim brakes.', price: 2.80, thumbnail: '', tags: ['brake', 'brake pads', 'bike', 'bicycle'], url: 'https://www.aliexpress.com/w/wholesale-bicycle-brake-pads.html', sellerVerified: false, shippingEstimate: '10-20 days', country: 'CN', isInternational: true },
      { id: 'ae-tire', title: 'Bicycle Tire 26x1.95', description: 'Mountain bike tire with puncture protection.', price: 9.50, thumbnail: '', tags: ['tire', 'wheel', 'bike', 'bicycle'], url: 'https://www.aliexpress.com/w/wholesale-bicycle-tire.html', sellerVerified: false, shippingEstimate: '10-20 days', country: 'CN', isInternational: true },
      { id: 'ae-grease', title: 'Bicycle Chain Lubricant', description: 'Chain lube for smooth shifting and rust prevention.', price: 4.50, thumbnail: '', tags: ['grease', 'lube', 'chain', 'bike', 'bicycle'], url: 'https://www.aliexpress.com/w/wholesale-bicycle-chain-lubricant.html', sellerVerified: false, shippingEstimate: '10-20 days', country: 'CN', isInternational: true }
    ],
    banggood: [
      { id: 'bg-chain', title: 'Mountain Bike Chain 8 Speed', description: 'Durable chain for 8-speed MTB drivetrains.', price: 9.99, thumbnail: '', tags: ['chain', 'drivetrain', 'bike', 'bicycle'], url: 'https://www.banggood.com/search/bicycle-chain.html', sellerVerified: false, shippingEstimate: '7-14 days', warehouseLocation: 'CN', country: 'CN', isInternational: true },
      { id: 'bg-tube', title: 'Bicycle Inner Tube 700c', description: 'Road bike inner tube with Presta valve.', price: 3.50, thumbnail: '', tags: ['tube', 'inner tube', 'bike', 'bicycle'], url: 'https://www.banggood.com/search/bicycle-inner-tube.html', sellerVerified: false, shippingEstimate: '7-14 days', warehouseLocation: 'CN', country: 'CN', isInternational: true },
      { id: 'bg-wrench', title: 'Bike Repair Tool Kit 16-in-1', description: 'Multi-tool for bicycle maintenance and repair.', price: 12.99, thumbnail: '', tags: ['wrench', 'tool', 'repair', 'bike', 'bicycle'], url: 'https://www.banggood.com/search/bicycle-repair-tool.html', sellerVerified: false, shippingEstimate: '7-14 days', warehouseLocation: 'CN', country: 'CN', isInternational: true }
    ],
    alibaba: [
      { id: 'ab-chain', title: 'Bicycle Chain Bulk', description: 'Bicycle chains available in single quantity.', price: 6.00, thumbnail: '', tags: ['chain', 'drivetrain', 'bike', 'bicycle'], url: 'https://www.alibaba.com/trade/search?SearchText=bicycle+chain', sellerVerified: true, shippingEstimate: '14-25 days', country: 'CN', isInternational: true },
      { id: 'ab-tire', title: 'Bicycle Tire All Sizes', description: 'Bike tires available in various sizes.', price: 7.00, thumbnail: '', tags: ['tire', 'wheel', 'bike', 'bicycle'], url: 'https://www.alibaba.com/trade/search?SearchText=bicycle+tire', sellerVerified: true, shippingEstimate: '14-25 days', country: 'CN', isInternational: true }
    ],
    revzilla: [
      { id: 'rz-helmet', title: 'Kids Bike Helmet CPSC Certified', description: 'Safety-certified helmet for young riders.', price: 34.99, thumbnail: '', tags: ['helmet', 'safety', 'bike', 'bicycle'], url: 'https://www.revzilla.com/search?query=kids+bike+helmet', sellerVerified: true, country: 'US', rating: 4.5 },
      { id: 'rz-light', title: 'Bicycle LED Light Set', description: 'Front and rear LED lights for bike safety.', price: 19.99, thumbnail: '', tags: ['light', 'safety', 'bike', 'bicycle'], url: 'https://www.revzilla.com/search?query=bicycle+light', sellerVerified: true, country: 'US', rating: 4.3 }
    ],
    jensonusa: [
      { id: 'ju-chain', title: 'KMC Bicycle Chain 8 Speed', description: 'High quality chain from a trusted bike shop.', price: 12.99, thumbnail: '', tags: ['chain', 'drivetrain', 'bike', 'bicycle'], url: 'https://www.jensonusa.com/search?q=bicycle+chain', sellerVerified: true, country: 'US', rating: 4.7 },
      { id: 'ju-tube', title: 'Bicycle Inner Tube 26 inch Schrader', description: 'Standard inner tube for mountain bikes.', price: 6.99, thumbnail: '', tags: ['tube', 'inner tube', 'bike', 'bicycle'], url: 'https://www.jensonusa.com/search?q=inner+tube', sellerVerified: true, country: 'US', rating: 4.6 },
      { id: 'ju-brake', title: 'Shimano Brake Pads', description: 'Reliable disc brake pads for mountain bikes.', price: 14.99, thumbnail: '', tags: ['brake', 'brake pads', 'disc brake', 'bike', 'bicycle'], url: 'https://www.jensonusa.com/search?q=brake+pads', sellerVerified: true, country: 'US', rating: 4.8 },
      { id: 'ju-tire', title: 'Continental Bicycle Tire 26x2.0', description: 'Durable mountain bike tire with flat protection.', price: 29.99, thumbnail: '', tags: ['tire', 'wheel', 'bike', 'bicycle'], url: 'https://www.jensonusa.com/search?q=bicycle+tire', sellerVerified: true, country: 'US', rating: 4.7 },
      { id: 'ju-grease', title: 'Finish Line Bike Chain Lube', description: 'Premium bike chain lubricant for smooth operation.', price: 9.99, thumbnail: '', tags: ['grease', 'lube', 'chain', 'bike', 'bicycle'], url: 'https://www.jensonusa.com/search?q=chain+lube', sellerVerified: true, country: 'US', rating: 4.9 },
      { id: 'ju-wrench', title: 'Park Tool Bike Multi-Tool', description: 'Essential bicycle repair multi-tool.', price: 24.99, thumbnail: '', tags: ['wrench', 'tool', 'repair', 'bike', 'bicycle'], url: 'https://www.jensonusa.com/search?q=bike+tool', sellerVerified: true, country: 'US', rating: 4.8 },
      { id: 'ju-helmet', title: 'Kids Bike Helmet', description: 'Youth cycling helmet with adjustable fit.', price: 39.99, thumbnail: '', tags: ['helmet', 'safety', 'bike', 'bicycle'], url: 'https://www.jensonusa.com/search?q=kids+helmet', sellerVerified: true, country: 'US', rating: 4.6 },
      { id: 'ju-wheel', title: 'Bicycle Wheelset 26 inch', description: 'Complete front and rear wheel set for mountain bikes.', price: 89.99, thumbnail: '', tags: ['wheel', 'rim', 'bike', 'bicycle'], url: 'https://www.jensonusa.com/search?q=bicycle+wheel', sellerVerified: true, country: 'US', rating: 4.5 },
      { id: 'ju-pedals', title: 'Shimano Flat Pedals', description: 'Reliable platform pedals for everyday cycling.', price: 24.99, thumbnail: '', tags: ['pedal', 'pedals', 'bike', 'bicycle'], url: 'https://www.jensonusa.com/search?q=bicycle+pedals', sellerVerified: true, country: 'US', rating: 4.6 },
      { id: 'ju-seat', title: 'Bicycle Comfort Saddle', description: 'Ergonomic bike seat with cushion padding.', price: 29.99, thumbnail: '', tags: ['seat', 'saddle', 'bike', 'bicycle'], url: 'https://www.jensonusa.com/search?q=bicycle+seat', sellerVerified: true, country: 'US', rating: 4.4 },
      { id: 'ju-handlebar', title: 'Bicycle Handlebar Riser', description: 'Aluminum handlebar for mountain and hybrid bikes.', price: 19.99, thumbnail: '', tags: ['handlebar', 'handlebars', 'bike', 'bicycle'], url: 'https://www.jensonusa.com/search?q=bicycle+handlebar', sellerVerified: true, country: 'US', rating: 4.5 },
      { id: 'ju-lock', title: 'Kryptonite Bike U-Lock', description: 'Heavy-duty U-lock for bicycle security.', price: 34.99, thumbnail: '', tags: ['lock', 'security', 'bike', 'bicycle'], url: 'https://www.jensonusa.com/search?q=bike+lock', sellerVerified: true, country: 'US', rating: 4.7 },
      { id: 'ju-spoke', title: 'Bicycle Spoke Set Stainless Steel', description: 'Replacement spokes for bicycle rims.', price: 12.99, thumbnail: '', tags: ['spoke', 'spokes', 'wheel', 'bike', 'bicycle'], url: 'https://www.jensonusa.com/search?q=bicycle+spokes', sellerVerified: true, country: 'US', rating: 4.5 },
      { id: 'ju-derailleur', title: 'Shimano Rear Derailleur', description: 'Reliable rear derailleur for smooth gear shifting.', price: 34.99, thumbnail: '', tags: ['derailleur', 'gears', 'shifting', 'drivetrain', 'bike', 'bicycle'], url: 'https://www.jensonusa.com/search?q=rear+derailleur', sellerVerified: true, country: 'US', rating: 4.7 },
      { id: 'ju-cable', title: 'Bicycle Brake & Shift Cable Set', description: 'Complete cable replacement set for stopping and gear systems.', price: 8.99, thumbnail: '', tags: ['cable', 'cables', 'shift cable', 'bike', 'bicycle'], url: 'https://www.jensonusa.com/search?q=bicycle+cable+set', sellerVerified: true, country: 'US', rating: 4.5 }
    ],
    chainreaction: [
      { id: 'crc-chain', title: 'Shimano HG Chain 9 Speed', description: 'Quality chain from UK cycling retailer.', price: 14.99, thumbnail: '', tags: ['chain', 'drivetrain', 'bike', 'bicycle'], url: 'https://www.chainreactioncycles.com/search?q=bicycle+chain', sellerVerified: true, country: 'UK', isInternational: true, shippingEstimate: '6-12 days', rating: 4.6 },
      { id: 'crc-brake', title: 'Disc Brake Pads Shimano', description: 'Sintered disc brake pads for reliable stopping.', price: 11.99, thumbnail: '', tags: ['brake', 'brake pads', 'disc brake', 'bike', 'bicycle'], url: 'https://www.chainreactioncycles.com/search?q=brake+pads', sellerVerified: true, country: 'UK', isInternational: true, shippingEstimate: '6-12 days', rating: 4.7 },
      { id: 'crc-tire', title: 'Continental Mountain Bike Tire', description: 'Trail-ready tire with puncture protection.', price: 24.99, thumbnail: '', tags: ['tire', 'wheel', 'bike', 'bicycle'], url: 'https://www.chainreactioncycles.com/search?q=bicycle+tire', sellerVerified: true, country: 'UK', isInternational: true, shippingEstimate: '6-12 days', rating: 4.5 }
    ],
    offerup: [
      { id: 'ou-bike', title: 'Used Bicycle Parts - Local Pickup', description: 'Nearby listing for used bicycle components.', price: 25, thumbnail: '', tags: ['bike', 'bicycle', 'parts', 'used'], url: 'https://offerup.com/search/?q=bicycle+parts', sellerVerified: false, country: 'US', localPickup: true, distanceMiles: 12, condition: 'used' }
    ],
    'facebook-marketplace': [
      { id: 'fbm-bike', title: 'Bicycle Parts and Accessories - Local', description: 'Local marketplace listing for bike parts.', price: 20, thumbnail: '', tags: ['bike', 'bicycle', 'parts'], url: 'https://www.facebook.com/marketplace/search/?query=bicycle+parts', sellerVerified: false, country: 'US', localPickup: true, distanceMiles: 18, condition: 'used' }
    ],
    adafruit: [
      { id: 'ada-led', title: 'Bicycle LED Strip Kit', description: 'Programmable LED strip for bike decoration projects.', price: 19.95, thumbnail: '', tags: ['light', 'led', 'bike', 'bicycle', 'safety'], url: 'https://www.adafruit.com/search?q=bicycle+led', sellerVerified: true, country: 'US', educational: true, diyComponent: true, rating: 4.9 },
      { id: 'ada-sensor', title: 'Bike Speed Sensor Module', description: 'Hall effect sensor for measuring bicycle speed.', price: 7.95, thumbnail: '', tags: ['sensor', 'speed', 'bike', 'bicycle'], url: 'https://www.adafruit.com/search?q=speed+sensor', sellerVerified: true, country: 'US', educational: true, diyComponent: true, rating: 4.8 }
    ],
    makerbeam: [
      { id: 'mb-beam', title: 'Aluminum Beam Kit for Bike Projects', description: 'MakerBeam extrusion kit for custom bike accessories.', price: 42, thumbnail: '', tags: ['frame', 'beam', 'bike', 'bicycle'], url: 'https://www.makerbeam.com/search?q=beam+kit', sellerVerified: true, country: 'NL', isInternational: true, educational: true, diyComponent: true, shippingEstimate: '5-10 days', rating: 4.7 }
    ]
  };
}

class BaseShoppingSource {
  constructor(config) {
    this.config = config;
    this.name = 'Shopping';
    this.sourceId = 'shopping';
    this.country = 'US';
    this.isInternational = false;
    this.isLocalMarketplace = false;
    this.isEducational = false;
    this.delayMs = 200;
    this.lastRequestAt = 0;
  }

  async throttle() {
    const elapsed = Date.now() - this.lastRequestAt;
    if (elapsed < this.delayMs) {
      await sleep(this.delayMs - elapsed);
    }
    this.lastRequestAt = Date.now();
  }

  async fetchText(url, requestOptions = {}) {
    await this.throttle();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        signal: controller.signal,
        headers: {
          ...DEFAULT_HEADERS,
          ...(requestOptions.headers || {})
        },
        params: requestOptions.params,
        responseType: 'text'
      });
      return String(response.data || '');
    } finally {
      clearTimeout(timeout);
    }
  }

  async fetchJson(url, requestOptions = {}) {
    await this.throttle();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        signal: controller.signal,
        headers: {
          ...DEFAULT_HEADERS,
          ...(requestOptions.headers || {})
        },
        params: requestOptions.params
      });
      return response.data;
    } finally {
      clearTimeout(timeout);
    }
  }

  buildResult(item) {
    return {
      id: `${this.sourceId}:${item.id}`,
      title: sanitizeTitle(item.title),
      source: this.sourceId,
      sourceName: this.name,
      url: item.url || '',
      thumbnail: item.thumbnail || '',
      description: item.description || '',
      safety_score: item.safety_score || 0.7,
      relevance_score: item.relevance_score || 0.65,
      educational_score: item.educational_score || (this.isEducational ? 0.85 : 0.45),
      category: 'buy',
      summary: item.summary || item.description || sanitizeTitle(item.title),
      tags: item.tags || [],
      requires_supervision: Boolean(item.requires_supervision),
      sourceMetadata: {
        author: item.seller || this.name,
        is_curated: false,
        sellerVerified: Boolean(item.sellerVerified),
        shippingEstimate: item.shippingEstimate || '',
        warehouseLocation: item.warehouseLocation || '',
        localPickup: Boolean(item.localPickup),
        educational: Boolean(item.educational || this.isEducational),
        diyComponent: Boolean(item.diyComponent || this.isEducational),
        condition: item.condition || 'new',
        country: item.country || this.country,
        isInternational: Boolean(item.isInternational ?? this.isInternational),
        rating: item.rating || 0,
        relatedParts: item.relatedParts || []
      },
      price: item.price ? {
        amount: Number(item.price),
        currency: item.currency || 'USD'
      } : undefined
    };
  }

  getFallbackResults(queries = []) {
    const catalog = fallbackCatalog()[this.sourceId] || [];
    return catalog.filter((item) => matchesQuery(item, queries)).map((item) => this.buildResult(item));
  }

  async search() {
    return [];
  }
}

class AliExpressSource extends BaseShoppingSource {
  constructor(config) {
    super(config);
    this.name = 'AliExpress';
    this.sourceId = 'aliexpress';
    this.country = 'CN';
    this.isInternational = true;
  }

  async search(queries) {
    const query = queries[0];
    try {
      if (process.env.ALIEXPRESS_API_KEY) {
        const data = await this.fetchJson('https://api.aliexpress.com/product/search', {
          params: { q: query, api_key: process.env.ALIEXPRESS_API_KEY }
        });
        const items = Array.isArray(data?.items) ? data.items : [];
        return items.slice(0, 6).map((item, index) => this.buildResult({
          id: item.id || `${index}`,
          title: item.title,
          description: item.description,
          price: extractPrice(item.price),
          thumbnail: item.thumbnail,
          url: item.url,
          seller: item.seller_name,
          sellerVerified: Boolean(item.verified),
          shippingEstimate: item.shipping_time || '10-20 days',
          isInternational: true,
          country: 'CN',
          tags: ['international', 'marketplace']
        }));
      }

      const xml = await this.fetchText(`https://www.aliexpress.com/rss/search.xml?q=${encodeURIComponent(query)}`);
      const items = [...xml.matchAll(/<item>[\s\S]*?<title><!\[CDATA\[(.*?)\]\]><\/title>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<description><!\[CDATA\[(.*?)\]\]><\/description>/gi)];
      if (items.length > 0) {
        return items.slice(0, 6).map((match, index) => this.buildResult({
          id: `${index}`,
          title: match[1],
          url: match[2],
          description: match[3].replace(/<[^>]+>/g, ' '),
          price: extractPrice(match[3]),
          shippingEstimate: '10-20 days',
          isInternational: true,
          country: 'CN'
        }));
      }
    } catch (error) {
      console.warn('[AliExpressSource] Search failed:', error.message);
    }

    return this.getFallbackResults(queries);
  }
}

class BanggoodSource extends BaseShoppingSource {
  constructor(config) {
    super(config);
    this.name = 'Banggood';
    this.sourceId = 'banggood';
    this.country = 'CN';
    this.isInternational = true;
  }

  async search(queries) {
    try {
      const data = await this.fetchJson('https://api.banggood.com/product/search', {
        params: {
          q: queries[0],
          api_key: process.env.BANGGOOD_API_KEY
        }
      });
      const items = Array.isArray(data?.products) ? data.products : [];
      if (items.length > 0) {
        return items.slice(0, 6).map((item, index) => this.buildResult({
          id: item.id || `${index}`,
          title: item.product_name,
          description: item.summary,
          price: extractPrice(item.price),
          thumbnail: item.image,
          url: item.url,
          warehouseLocation: item.warehouse || 'CN',
          shippingEstimate: item.shipping_time || '7-14 days',
          isInternational: true,
          country: item.warehouse === 'US' ? 'US' : 'CN'
        }));
      }
    } catch (error) {
      console.warn('[BanggoodSource] Search failed:', error.message);
    }

    return this.getFallbackResults(queries);
  }
}

class AlibabaSource extends BaseShoppingSource {
  constructor(config) {
    super(config);
    this.name = 'Alibaba';
    this.sourceId = 'alibaba';
    this.country = 'CN';
    this.isInternational = true;
  }

  async search(queries) {
    try {
      const html = await this.fetchText(`https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(queries[0])}`);
      const matches = [...html.matchAll(/"title":"([^"]+)"[\s\S]*?"price":"([^"]+)"[\s\S]*?"productUrl":"([^"]+)"/g)];
      if (matches.length > 0) {
        return matches.slice(0, 4).map((match, index) => this.buildResult({
          id: `${index}`,
          title: match[1],
          price: extractPrice(match[2]),
          url: match[3].startsWith('http') ? match[3] : `https:${match[3]}`,
          description: 'Wholesale-capable listing with MOQ filters recommended.',
          sellerVerified: true,
          shippingEstimate: '14-25 days',
          isInternational: true,
          country: 'CN'
        }));
      }
    } catch (error) {
      console.warn('[AlibabaSource] Search failed:', error.message);
    }

    return this.getFallbackResults(queries);
  }
}

class RevZillaSource extends BaseShoppingSource {
  constructor(config) {
    super(config);
    this.name = 'RevZilla';
    this.sourceId = 'revzilla';
    this.country = 'US';
  }

  async search(queries) {
    try {
      const html = await this.fetchText(`https://www.revzilla.com/search?query=${encodeURIComponent(queries[0])}`);
      const matches = [...html.matchAll(/href="(\/motorcycle\/[^"#?]+)"[\s\S]*?alt="([^"]+)"[\s\S]*?\$(\d+(?:\.\d+)?)/g)];
      if (matches.length > 0) {
        return matches.slice(0, 6).map((match, index) => this.buildResult({
          id: `${index}`,
          title: match[2],
          url: `https://www.revzilla.com${match[1]}`,
          price: extractPrice(match[3]),
          sellerVerified: true,
          rating: 4.8,
          safety_score: 0.9,
          relevance_score: 0.7,
          description: 'Trusted motorcycle gear and parts retailer.'
        }));
      }
    } catch (error) {
      console.warn('[RevZillaSource] Search failed:', error.message);
    }

    return this.getFallbackResults(queries);
  }
}

class MotoSportSource extends BaseShoppingSource {
  constructor(config) {
    super(config);
    this.name = 'MotoSport';
    this.sourceId = 'motosport';
    this.country = 'US';
  }

  async search(queries) {
    try {
      const html = await this.fetchText(`https://www.motosport.com/search?query=${encodeURIComponent(queries[0])}`);
      const matches = [...html.matchAll(/href="([^"]+)"[\s\S]*?title="([^"]+)"[\s\S]*?\$(\d+(?:\.\d+)?)/g)];
      if (matches.length > 0) {
        return matches.slice(0, 6).map((match, index) => this.buildResult({
          id: `${index}`,
          title: match[2],
          url: match[1].startsWith('http') ? match[1] : `https://www.motosport.com${match[1]}`,
          price: extractPrice(match[3]),
          sellerVerified: true,
          rating: 4.7,
          description: 'Trusted dirt bike and motorcycle parts retailer.'
        }));
      }
    } catch (error) {
      console.warn('[MotoSportSource] Search failed:', error.message);
    }

    return this.getFallbackResults(queries);
  }
}

class JensonUSASource extends BaseShoppingSource {
  constructor(config) {
    super(config);
    this.name = 'Jenson USA';
    this.sourceId = 'jensonusa';
    this.country = 'US';
  }

  async search(queries) {
    try {
      const data = await this.fetchJson(`https://www.jensonusa.com/api/search?q=${encodeURIComponent(queries[0])}`);
      const items = Array.isArray(data?.items) ? data.items : [];
      if (items.length > 0) {
        return items.slice(0, 6).map((item, index) => this.buildResult({
          id: item.id || `${index}`,
          title: item.name,
          description: item.shortDescription,
          price: extractPrice(item.price),
          thumbnail: item.image,
          url: item.url,
          sellerVerified: true,
          rating: item.rating || 4.6
        }));
      }
    } catch (error) {
      console.warn('[JensonUSASource] Search failed:', error.message);
    }

    return this.getFallbackResults(queries);
  }
}

class ChainReactionCyclesSource extends BaseShoppingSource {
  constructor(config) {
    super(config);
    this.name = 'Chain Reaction Cycles';
    this.sourceId = 'chainreaction';
    this.country = 'UK';
    this.isInternational = true;
  }

  async search(queries) {
    try {
      const html = await this.fetchText(`https://www.chainreactioncycles.com/search?term=${encodeURIComponent(queries[0])}`);
      const matches = [...html.matchAll(/href="([^"]+)"[\s\S]*?title="([^"]+)"[\s\S]*?\$(\d+(?:\.\d+)?)/g)];
      if (matches.length > 0) {
        return matches.slice(0, 6).map((match, index) => this.buildResult({
          id: `${index}`,
          title: match[2],
          url: match[1].startsWith('http') ? match[1] : `https://www.chainreactioncycles.com${match[1]}`,
          price: extractPrice(match[3]),
          sellerVerified: true,
          rating: 4.6,
          shippingEstimate: '6-12 days',
          isInternational: true,
          country: 'UK'
        }));
      }
    } catch (error) {
      console.warn('[ChainReactionCyclesSource] Search failed:', error.message);
    }

    return this.getFallbackResults(queries);
  }
}

class OfferUpSource extends BaseShoppingSource {
  constructor(config) {
    super(config);
    this.name = 'OfferUp';
    this.sourceId = 'offerup';
    this.country = 'US';
    this.isLocalMarketplace = true;
  }

  async search(queries, options = {}) {
    const zip = options.zip || process.env.OFFERUP_ZIP_CODE || '85255';
    try {
      const data = await this.fetchJson('https://offerup.com/webapp/api/v2/search', {
        params: {
          q: queries[0],
          location: zip,
          radius: 50
        }
      });
      const items = Array.isArray(data?.items) ? data.items : [];
      if (items.length > 0) {
        return items.slice(0, 6).map((item, index) => this.buildResult({
          id: item.id || `${index}`,
          title: item.title,
          description: item.description,
          price: extractPrice(item.price),
          thumbnail: item.photo?.url,
          url: item.web_url,
          seller: item.seller?.name,
          sellerVerified: Boolean(item.seller?.verified),
          localPickup: true,
          country: 'US',
          condition: item.condition || 'used',
          rating: item.seller?.rating || 0
        }));
      }
    } catch (error) {
      console.warn('[OfferUpSource] Search failed:', error.message);
    }

    return this.getFallbackResults(queries);
  }
}

class FacebookMarketplaceSource extends BaseShoppingSource {
  constructor(config) {
    super(config);
    this.name = 'Facebook Marketplace';
    this.sourceId = 'facebook-marketplace';
    this.country = 'US';
    this.isLocalMarketplace = true;
  }

  async search(queries) {
    try {
      if (!process.env.FACEBOOK_ACCESS_TOKEN) {
        return this.getFallbackResults(queries);
      }

      const data = await this.fetchJson('https://graph.facebook.com/v18.0/marketplace/search', {
        params: {
          q: queries[0],
          access_token: process.env.FACEBOOK_ACCESS_TOKEN
        }
      });
      const items = Array.isArray(data?.data) ? data.data : [];
      if (items.length > 0) {
        return items.slice(0, 6).map((item, index) => this.buildResult({
          id: item.id || `${index}`,
          title: item.name,
          description: item.description,
          price: extractPrice(item.price),
          thumbnail: item.picture,
          url: item.permalink,
          seller: item.seller?.name,
          sellerVerified: Boolean(item.seller?.is_verified),
          localPickup: true,
          country: 'US',
          condition: item.condition || 'used'
        }));
      }
    } catch (error) {
      console.warn('[FacebookMarketplaceSource] Search failed:', error.message);
    }

    return this.getFallbackResults(queries);
  }
}

class AdafruitSource extends BaseShoppingSource {
  constructor(config) {
    super(config);
    this.name = 'Adafruit';
    this.sourceId = 'adafruit';
    this.country = 'US';
    this.isEducational = true;
  }

  async search(queries) {
    try {
      const data = await this.fetchJson(`https://www.adafruit.com/api/products?q=${encodeURIComponent(queries[0])}`);
      const items = Array.isArray(data?.products) ? data.products : [];
      if (items.length > 0) {
        return items.slice(0, 6).map((item, index) => this.buildResult({
          id: item.id || `${index}`,
          title: item.title,
          description: item.description,
          price: extractPrice(item.price),
          thumbnail: item.image,
          url: item.url,
          sellerVerified: true,
          educational: true,
          diyComponent: true,
          relatedParts: ['Battery monitor', 'Motor controller', 'Wiring kit'],
          rating: 4.9
        }));
      }
    } catch (error) {
      console.warn('[AdafruitSource] Search failed:', error.message);
    }

    return this.getFallbackResults(queries);
  }
}

class SparkFunSource extends BaseShoppingSource {
  constructor(config) {
    super(config);
    this.name = 'SparkFun';
    this.sourceId = 'sparkfun';
    this.country = 'US';
    this.isEducational = true;
  }

  async search(queries) {
    try {
      const html = await this.fetchText(`https://www.sparkfun.com/search/results?term=${encodeURIComponent(queries[0])}`);
      const matches = [...html.matchAll(/href="([^"]+)"[\s\S]*?title="([^"]+)"[\s\S]*?\$(\d+(?:\.\d+)?)/g)];
      if (matches.length > 0) {
        return matches.slice(0, 6).map((match, index) => this.buildResult({
          id: `${index}`,
          title: match[2],
          url: match[1].startsWith('http') ? match[1] : `https://www.sparkfun.com${match[1]}`,
          price: extractPrice(match[3]),
          educational: true,
          diyComponent: true,
          sellerVerified: true,
          rating: 4.8,
          relatedParts: ['Motor driver', 'Sensor board', 'Connector kit']
        }));
      }
    } catch (error) {
      console.warn('[SparkFunSource] Search failed:', error.message);
    }

    return this.getFallbackResults(queries);
  }
}

class MakerBeamSource extends BaseShoppingSource {
  constructor(config) {
    super(config);
    this.name = 'MakerBeam';
    this.sourceId = 'makerbeam';
    this.country = 'NL';
    this.isInternational = true;
    this.isEducational = true;
  }

  async search(queries) {
    try {
      const html = await this.fetchText(`https://www.makerbeam.com/search?q=${encodeURIComponent(queries[0])}`);
      const matches = [...html.matchAll(/href="([^"]+)"[\s\S]*?>([^<]+MakerBeam[^<]*)<[\s\S]*?\$(\d+(?:\.\d+)?)/g)];
      if (matches.length > 0) {
        return matches.slice(0, 6).map((match, index) => this.buildResult({
          id: `${index}`,
          title: match[2],
          url: match[1].startsWith('http') ? match[1] : `https://www.makerbeam.com${match[1]}`,
          price: extractPrice(match[3]),
          educational: true,
          diyComponent: true,
          sellerVerified: true,
          shippingEstimate: '5-10 days',
          isInternational: true,
          country: 'NL',
          relatedParts: ['Beams', 'Brackets', 'Connectors']
        }));
      }
    } catch (error) {
      console.warn('[MakerBeamSource] Search failed:', error.message);
    }

    return this.getFallbackResults(queries);
  }
}

class ShoppingManager extends BaseSourceManager {
  constructor(config = {}) {
    super('Shopping');
    this.sourceId = 'shopping';
    this.cache = new Map();
    this.resultIndex = new Map();
    this.sources = {
      aliexpress: new AliExpressSource(config),
      banggood: new BanggoodSource(config),
      alibaba: new AlibabaSource(config),
      jensonusa: new JensonUSASource(config),
      chainreaction: new ChainReactionCyclesSource(config),
      offerup: new OfferUpSource(config),
      'facebook-marketplace': new FacebookMarketplaceSource(config),
      adafruit: new AdafruitSource(config),
      makerbeam: new MakerBeamSource(config)
    };
  }

  buildCacheKey(queries, options) {
    return JSON.stringify({ queries, options });
  }

  getCacheEntry(key) {
    const entry = this.cache.get(key);
    if (!entry || entry.expiresAt <= Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return entry.results;
  }

  setCacheEntry(key, results) {
    this.cache.set(key, {
      results,
      expiresAt: Date.now() + HOUR_MS
    });
  }

  getEnabledSources(options = {}) {
    const localOnly = Boolean(options.localOnly);
    const usOnly = Boolean(options.usOnly);
    const intent = options.intent || 'buy';
    let entries = Object.entries(this.sources);

    if (localOnly) {
      entries = entries.filter(([, source]) => source.isLocalMarketplace);
    } else if (usOnly) {
      entries = entries.filter(([, source]) => !source.isInternational && source.country === 'US');
    }

    if (intent === 'build') {
      entries = entries.sort((left, right) => Number(right[1].isEducational) - Number(left[1].isEducational));
    }

    return entries;
  }

  dedupe(results = []) {
    const deduped = [];

    for (const result of results) {
      const existing = deduped.find((candidate) => {
        const similarTitle = titleSimilarity(candidate.title, result.title) >= 0.8;
        const leftPrice = Number(candidate.price?.amount || 0);
        const rightPrice = Number(result.price?.amount || 0);
        const similarPrice = leftPrice === 0 || rightPrice === 0 || Math.abs(leftPrice - rightPrice) <= Math.max(10, leftPrice * 0.2);
        return similarTitle && similarPrice;
      });

      if (!existing) {
        deduped.push(result);
      }
    }

    return deduped;
  }

  async searchAll(queries = [], options = {}) {
    const cacheKey = this.buildCacheKey(queries, options);
    const cached = this.getCacheEntry(cacheKey);
    if (cached) {
      return cached;
    }

    const sourceEntries = this.getEnabledSources(options);
    const results = await Promise.all(sourceEntries.map(async ([name, source]) => {
      try {
        return await source.search(queries, options);
      } catch (error) {
        console.warn(`[ShoppingManager] ${name} search failed:`, error.message);
        return [];
      }
    }));

    const flattened = this.dedupe(results.flat())
      .map((result) => ({
        ...result,
        relevance_score: Math.max(result.relevance_score || 0.6, matchesQuery(result, queries) ? 0.8 : 0.55)
      }))
      .sort((left, right) => {
        const leftBoost = Number(Boolean(left.sourceMetadata?.educational || left.sourceMetadata?.diyComponent && options.intent === 'build'));
        const rightBoost = Number(Boolean(right.sourceMetadata?.educational || right.sourceMetadata?.diyComponent && options.intent === 'build'));
        return (right.relevance_score + rightBoost) - (left.relevance_score + leftBoost);
      });

    for (const result of flattened) {
      this.resultIndex.set(result.id, result);
    }

    this.setCacheEntry(cacheKey, flattened);
    return flattened;
  }

  async search(queries = [], options = {}) {
    return this.searchAll(queries, options);
  }

  async getById(id) {
    return this.resultIndex.get(id) || null;
  }
}

module.exports = {
  ShoppingManager
};