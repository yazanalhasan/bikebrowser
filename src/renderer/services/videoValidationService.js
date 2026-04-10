const STOP_WORDS = new Set([
  'bike',
  'bicycle',
  'ebike',
  'e',
  'and',
  'for',
  'with',
  'the',
  'kit',
  'set',
  'pack',
  'inch',
  'from',
]);

const VALIDATION_CACHE_TTL_MS = 5 * 60 * 1000;
const VALIDATION_TIMEOUT_MS = 2500;
const validationCache = new Map();

function normalize(value) {
  return String(value || '').toLowerCase();
}

function tokenize(value) {
  return normalize(value)
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((token) => token && token.length > 2 && !STOP_WORDS.has(token));
}

function uniqueTokens(tokens) {
  return Array.from(new Set(tokens));
}

function getCategorySignals(category) {
  const value = normalize(category);

  if (value.includes('motor') || value.includes('drive')) {
    return ['motor', 'mid', 'drive', 'hub', 'conversion'];
  }

  if (value.includes('battery') || value.includes('power')) {
    return ['battery', '48v', '52v', 'lithium', 'downtube'];
  }

  if (value.includes('brake')) {
    return ['brake', 'hydraulic', 'disc', 'rotor', 'caliper'];
  }

  if (value.includes('drivetrain') || value.includes('cassette') || value.includes('freewheel')) {
    return ['drivetrain', 'cassette', 'freewheel', 'chainring', 'derailleur'];
  }

  if (value.includes('safety') || value.includes('hardware')) {
    return ['torque', 'arm', 'helmet', 'light', 'lock'];
  }

  return ['bike', 'bicycle'];
}

function normalizeVideo(video) {
  const videoId = video?.videoId || video?.id?.videoId || (typeof video?.id === 'string' ? video.id : '');
  const title = video?.title || '';
  const channelName = video?.channelName || video?.channelTitle || 'Unknown Channel';
  const description = video?.description || '';

  return {
    videoId,
    title,
    channelName,
    description,
    url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : '',
  };
}

function overlapRatio(candidateTokens, targetText) {
  if (!candidateTokens.length) return 0;

  const hits = candidateTokens.filter((token) => targetText.includes(token)).length;
  return hits / candidateTokens.length;
}

function getMatchConfidence(product, part, video) {
  const videoText = normalize(`${video.title} ${video.description}`);
  const productTokens = uniqueTokens(tokenize(product?.title || '')).slice(0, 8);
  const categorySignals = getCategorySignals(part?.category);

  const categoryRatio = overlapRatio(categorySignals, videoText);
  const productRatio = overlapRatio(productTokens, videoText);
  const brandModelTokens = productTokens.filter((token) => /\d/.test(token) || token.length >= 5).slice(0, 5);
  const brandModelRatio = overlapRatio(brandModelTokens, videoText);

  const score = (categoryRatio * 0.45) + (brandModelRatio * 0.35) + (productRatio * 0.2);
  return Number(score.toFixed(2));
}

function buildMatchReason(confidence, product, part) {
  if (confidence >= 0.75) {
    return `Strong match for ${part?.category || 'part'} and model terms from ${product?.title || 'listing'}`;
  }
  if (confidence >= 0.6) {
    return `Likely installation reference for ${part?.category || 'part'}`;
  }
  return `Category-level tutorial reference for ${part?.category || 'part'}`;
}

async function getValidationVideos(query, part) {
  if (!window?.api?.youtubeSearch) {
    return [];
  }

  const base = String(query || part?.name || '').trim();
  const validationQuery = `${base} install tutorial ebike`.trim();
  const cacheKey = `${validationQuery}::${String(part?.category || '').toLowerCase()}`;

  const cached = validationCache.get(cacheKey);
  if (cached && (Date.now() - cached.ts) < VALIDATION_CACHE_TTL_MS) {
    return cached.value;
  }

  try {
    const response = await Promise.race([
      window.api.youtubeSearch(validationQuery),
      new Promise((resolve) => setTimeout(() => resolve({ videos: [] }), VALIDATION_TIMEOUT_MS)),
    ]);
    const videos = Array.isArray(response?.videos) ? response.videos : [];
    const normalized = videos.map(normalizeVideo).filter((video) => video.videoId && video.title);
    validationCache.set(cacheKey, {
      ts: Date.now(),
      value: normalized,
    });
    return normalized;
  } catch {
    return [];
  }
}

function buildVideoReferences(product, part, videos) {
  return videos
    .map((video) => {
      const matchConfidence = getMatchConfidence(product, part, video);
      return {
        videoId: video.videoId,
        title: video.title,
        channelName: video.channelName,
        url: video.url,
        matchConfidence,
        matchReason: buildMatchReason(matchConfidence, product, part),
      };
    })
    .filter((reference) => reference.matchConfidence >= 0.45)
    .sort((a, b) => b.matchConfidence - a.matchConfidence)
    .slice(0, 2);
}

export async function enrichProductsWithVideoValidation(products, part, query) {
  const safeProducts = Array.isArray(products) ? products : [];
  if (safeProducts.length === 0) {
    return [];
  }

  const validationVideos = await getValidationVideos(query, part);

  return safeProducts.map((product) => {
    const videoReferences = buildVideoReferences(product, part, validationVideos);
    return {
      ...product,
      videoReferences,
    };
  });
}

export default {
  enrichProductsWithVideoValidation,
};
