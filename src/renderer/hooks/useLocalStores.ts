import { useEffect, useRef, useState } from 'react';

export type LocalStore = {
  id: string;
  name: string;
  address: string;
  rating?: number;
  totalRatings?: number;
  isOpen?: boolean;
  phone: string | null;
  website: string | null;
  tags: string[];
};

type PlacesResult = {
  id: string;
  name: string;
  address: string;
  rating?: number;
  totalRatings?: number;
  isOpen?: boolean;
  phone?: string;
  website?: string;
};

const TOOL_KEYWORDS = ['wrench', 'tool', 'bolt', 'screw', 'nut', 'hammer', 'drill', 'saw', 'plier'];

function deduplicateStores(stores: LocalStore[]): LocalStore[] {
  const seen = new Map<string, LocalStore>();

  for (const store of stores) {
    const existing = seen.get(store.id);
    if (existing) {
      const mergedTags = [...new Set([...existing.tags, ...store.tags])];
      seen.set(store.id, { ...existing, tags: mergedTags });
    } else {
      seen.set(store.id, store);
    }
  }

  return Array.from(seen.values());
}

async function fetchStoresForQuery(query: string, tag: string): Promise<LocalStore[]> {
  try {
    const results: PlacesResult[] = await (window as any).api.places.search(query);
    return (results || []).map((place) => ({
      id: place.id,
      name: place.name,
      address: place.address,
      rating: place.rating,
      totalRatings: place.totalRatings,
      isOpen: place.isOpen,
      phone: place.phone || null,
      website: place.website || null,
      tags: [tag],
    }));
  } catch {
    return [];
  }
}

async function fetchPhoneDetails(stores: LocalStore[]): Promise<void> {
  const needDetails = stores.filter((s) => !s.phone).slice(0, 10);
  if (needDetails.length === 0) return;

  const api = (window as any).api?.places;
  if (!api?.getDetails) return;

  await Promise.all(
    needDetails.map(async (store) => {
      try {
        const details = await api.getDetails(store.id);
        if (details?.phone) store.phone = details.phone;
        if (details?.website && !store.website) store.website = details.website;
        if (details?.isOpen !== undefined && store.isOpen === undefined) store.isOpen = details.isOpen;
      } catch {
        // detail fetch failures are non-critical
      }
    }),
  );
}

export function useLocalStores(zipcode: string, materials: string[]) {
  const [stores, setStores] = useState<LocalStore[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastKey = useRef('');

  useEffect(() => {
    const api = (window as any).api?.places;
    if (!zipcode || !api) {
      setStores([]);
      return;
    }

    const key = `${zipcode}::${materials.sort().join(',')}`;
    if (key === lastKey.current) return;
    lastKey.current = key;

    let active = true;
    setLoading(true);
    setError(null);

    const queries: { query: string; tag: string }[] = [
      { query: `bike shops near ${zipcode}`, tag: 'Bike Shop' },
      { query: `bike repair shops near ${zipcode}`, tag: 'Repair Shop' },
      { query: `sporting goods store near ${zipcode}`, tag: 'Sporting Goods' },
    ];

    const hasToolMaterial = materials.some((m) =>
      TOOL_KEYWORDS.some((kw) => m.toLowerCase().includes(kw)),
    );
    if (hasToolMaterial) {
      queries.push({ query: `hardware store near ${zipcode}`, tag: 'Hardware Store' });
    }

    Promise.all(queries.map(({ query, tag }) => fetchStoresForQuery(query, tag)))
      .then(async (batches) => {
        if (!active) return;

        const merged = deduplicateStores(batches.flat());
        await fetchPhoneDetails(merged);

        if (!active) return;
        setStores(merged);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message || 'Failed to load local stores');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [zipcode, materials]);

  return { stores, loading, error };
}
