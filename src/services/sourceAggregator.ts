type RawExternalItem = {
  title?: string;
  price?: number;
  platform?: string;
  specs?: Record<string, any>;
  category?: string;
};

export type NormalizedExternalItem = {
  name: string;
  price?: number;
  source?: string;
  specs: Record<string, any>;
  category: string;
};

export const normalizeExternalItem = (raw: RawExternalItem): NormalizedExternalItem => {
  return {
    name: String(raw?.title || 'Unknown Item'),
    price: Number.isFinite(Number(raw?.price)) ? Number(raw?.price) : undefined,
    source: raw?.platform,
    specs: raw?.specs || {},
    category: raw?.category || 'unknown',
  };
};

export const scoreItem = (item: NormalizedExternalItem): number => {
  let score = 0;

  if (Number(item?.price) < 500) score += 2;
  if (Number(item?.specs?.voltage) >= 48) score += 3;
  if (String(item?.source || '').toLowerCase() === 'youtube') score += 1;

  return score;
};
