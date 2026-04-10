function normalize(value) {
  return String(value || '').trim();
}

const SIGNAL_CACHE_TTL_MS = 3 * 60 * 1000;
const SIGNAL_REQUEST_TIMEOUT_MS = 2500;
const signalCache = new Map();
const ENABLE_EXTERNAL_SIGNALS = String(import.meta?.env?.VITE_ENABLE_EXTERNAL_SIGNALS || '').toLowerCase() === 'true';

function toList(value) {
  return Array.isArray(value) ? value : [];
}

export function buildSignalQuery(part) {
  const name = normalize(part?.name || 'ebike part');
  return `${name} ebike install review build`;
}

async function safeFetchJson(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SIGNAL_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

function normalizeYouTubeVideos(videos) {
  return toList(videos)
    .map((video) => {
      const videoId = video?.videoId || video?.id?.videoId || (typeof video?.id === 'string' ? video.id : '');
      if (!videoId) return null;

      return {
        id: videoId,
        title: video?.title || 'Build video',
        url: `https://www.youtube.com/watch?v=${videoId}`,
        channel: video?.channelName || video?.channelTitle || 'Unknown channel',
      };
    })
    .filter(Boolean)
    .slice(0, 8);
}

export async function searchYouTube(query) {
  try {
    if (!window?.api?.youtubeSearch) {
      return [];
    }

    const response = await Promise.race([
      window.api.youtubeSearch(query),
      new Promise((resolve) => setTimeout(() => resolve({ videos: [] }), SIGNAL_REQUEST_TIMEOUT_MS)),
    ]);
    return normalizeYouTubeVideos(response?.videos || []);
  } catch {
    return [];
  }
}

export async function searchReddit(query) {
  const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=relevance&limit=8`;
  const data = await safeFetchJson(url);

  return toList(data?.data?.children)
    .map((entry) => {
      const item = entry?.data || {};
      const permalink = item?.permalink ? `https://www.reddit.com${item.permalink}` : '';
      if (!item?.id || !permalink) {
        return null;
      }

      return {
        id: item.id,
        title: item.title || 'Builder discussion',
        url: permalink,
        channel: `r/${item.subreddit || 'bicycling'}`,
      };
    })
    .filter(Boolean)
    .slice(0, 8);
}

export async function searchBilibili(query) {
  const url = `https://api.bilibili.com/x/web-interface/search/type?search_type=video&keyword=${encodeURIComponent(query)}&page=1`;
  const data = await safeFetchJson(url);
  const results = toList(data?.data?.result);

  return results
    .map((item) => {
      const id = item?.bvid || '';
      if (!id) {
        return null;
      }

      return {
        id,
        title: String(item?.title || 'Build video').replace(/<[^>]+>/g, ''),
        url: `https://www.bilibili.com/video/${id}`,
        channel: item?.author || 'Bilibili creator',
      };
    })
    .filter(Boolean)
    .slice(0, 8);
}

// Global signal layer: confidence/discovery only, never a product source.
export async function getBuildSignals(part) {
  const query = buildSignalQuery(part);

  const cached = signalCache.get(query);
  if (cached && (Date.now() - cached.ts) < SIGNAL_CACHE_TTL_MS) {
    return cached.value;
  }

  const [youtube, bilibili, reddit] = ENABLE_EXTERNAL_SIGNALS
    ? await Promise.all([
        searchYouTube(query),
        searchBilibili(query),
        searchReddit(query),
      ])
    : await Promise.all([
        searchYouTube(query),
        Promise.resolve([]),
        Promise.resolve([]),
      ]);

  const value = {
    query,
    youtube,
    bilibili,
    reddit,
  };

  signalCache.set(query, {
    ts: Date.now(),
    value,
  });

  return value;
}

export default {
  buildSignalQuery,
  getBuildSignals,
  searchYouTube,
  searchBilibili,
  searchReddit,
};
