export type ProductSource =
  | 'amazon'
  | 'ebay'
  | 'curated'
  | 'local'
  | 'offerup'
  | 'marketcheck'
  | 'facebook_marketplace'
  | 'craigslist'
  | 'google_places'
  | 'jensonusa'
  | 'revzilla'
  | 'chainreaction'
  | 'adafruit'
  | 'retailer';

export type VideoReference = {
  videoId: string;
  url: string;
  title: string;
  channelName?: string;
  matchConfidence: number;
  matchReason?: string;
};

export type BuildSignalEntry = {
  id: string;
  title: string;
  url: string;
  channel?: string;
};

export type BuildSignals = {
  youtube: BuildSignalEntry[];
  bilibili: BuildSignalEntry[];
  reddit: BuildSignalEntry[];
};

export type ProjectNote = {
  id: string;
  url: string;
  title: string;
  category: string;
  normalizedName: string;
  groupKey: string;
  variantHash: string;
  partId?: string | null;
  price?: number | null;
  selected?: boolean;
  comment?: string;
  createdAt: string;
};

export type BikeProject = {
  id: string;
  name: string;
  notes: ProjectNote[];
};

export type Product = {
  id: string;
  title: string;
  price: number;
  shipping: number;
  totalPrice: number;
  shippingCost?: number;
  totalCost?: number;
  distance?: number | null;
  type?: 'online' | 'local';
  score?: number;
  explanation?: string[];
  rating?: number;
  image: string;
  source: ProductSource;
  sourceLabel?: string;
  url: string;
  videoReferences?: VideoReference[];
  signals?: BuildSignals;
  noResultsReason?: string;
  noResultsCode?: string;
};

export type ProjectCartItem = {
  name: string;
  quantity: number;
  selectedProduct?: Product;
  alternatives?: Product[];
  category?: string;
  sourceType?: 'checklist' | 'recommended' | 'custom-analysis';
  notes?: string;
};

export type ProjectCart = {
  projectId: string;
  items: ProjectCartItem[];
  subtotal: number;
};

export type GlobalCart = {
  items: ProjectCartItem[];
  totalEstimatedCost: number;
};

export type PriceSearchResultMap = Record<string, Product[]>;
