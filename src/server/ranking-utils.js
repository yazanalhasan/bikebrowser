const { normalizeKey } = require('./storage');

function tokenize(value) {
  return normalizeKey(value)
    .split(' ')
    .map((item) => item.trim())
    .filter(Boolean);
}

function jaccardSimilarity(a, b) {
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));

  if (setA.size === 0 || setB.size === 0) {
    return 0;
  }

  let intersection = 0;
  for (const value of setA) {
    if (setB.has(value)) {
      intersection += 1;
    }
  }

  const union = setA.size + setB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

function dedupeResults(results = [], threshold = 0.72) {
  const clusters = [];

  for (const result of results) {
    const title = result.title || result.name || '';
    let cluster = null;

    for (const existing of clusters) {
      const similarity = jaccardSimilarity(existing.anchor.title || existing.anchor.name || '', title);
      if (similarity >= threshold) {
        cluster = existing;
        break;
      }
    }

    if (!cluster) {
      clusters.push({
        anchor: result,
        items: [{ ...result, similarityScore: 1 }],
      });
      continue;
    }

    const similarityScore = jaccardSimilarity(cluster.anchor.title || cluster.anchor.name || '', title);
    cluster.items.push({ ...result, similarityScore });
  }

  return clusters;
}

function compatibilityScore(input = {}) {
  const frame = String(input.frame || '').toLowerCase();
  const motorType = String(input.motorType || '').toLowerCase();
  const batteryVoltage = Number(input.batteryVoltage || 0);

  let score = 55;

  if (frame.includes('mountain') || frame.includes('hardtail')) {
    score += 12;
  }

  if (motorType.includes('hub')) {
    score += 12;
  }

  if (motorType.includes('mid')) {
    score += 8;
  }

  if (batteryVoltage >= 36 && batteryVoltage <= 52) {
    score += 15;
  } else if (batteryVoltage > 52) {
    score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

function applyNotesDecisionState(results = [], preferences = {}) {
  return results.map((item) => {
    const key = normalizeKey(item.title || item.name || '');
    const pref = preferences[key] || { preferred: 0, rejected: 0 };

    let state = 'alternative';
    let rankDelta = 0;

    if (pref.preferred > pref.rejected && pref.preferred > 0) {
      state = 'preferred';
      rankDelta = 0.2;
    } else if (pref.rejected > 0 && pref.rejected >= pref.preferred) {
      state = 'rejected';
      rankDelta = -0.3;
    }

    const base = Number(item.compositeScore || item.score || 0);
    return {
      ...item,
      decisionState: state,
      score: base + rankDelta,
      compositeScore: base + rankDelta,
    };
  });
}

/**
 * Apply learned suppression/boost based on HistoryStore decision data.
 * - Items similar to previously rejected items get score suppressed.
 * - Items matching preferred patterns get boosted.
 * - Near-duplicates of recently shown results get faded.
 *
 * @param {Array} results - Search results array
 * @param {Object} historyStore - HistoryStore instance (or null)
 * @returns {Array} results with adjusted scores
 */
function applyLearnedSuppression(results = [], historyStore = null) {
  if (!historyStore || results.length === 0) return results;

  let rejected = [];
  let preferred = [];
  try {
    rejected = historyStore.getRejectedItems();
    preferred = historyStore.getPreferredItems();
  } catch (_) {
    return results;
  }

  const rejectedTitles = rejected.map((r) => r.item_title);
  const preferredTitles = preferred.map((r) => r.item_title);

  return results.map((item) => {
    const title = item.title || item.name || '';
    let delta = 0;

    // Suppress items similar to rejected items
    for (const rTitle of rejectedTitles) {
      const sim = jaccardSimilarity(title, rTitle);
      if (sim >= 0.6) {
        delta -= 0.25 * sim;
        break; // one suppression per item
      }
    }

    // Boost items similar to preferred items
    for (const pTitle of preferredTitles) {
      const sim = jaccardSimilarity(title, pTitle);
      if (sim >= 0.5) {
        delta += 0.15 * sim;
        break;
      }
    }

    if (delta === 0) return item;

    const base = Number(item.compositeScore || item.score || 0);
    return {
      ...item,
      learnedDelta: delta,
      score: base + delta,
      compositeScore: base + delta,
    };
  });
}

/**
 * Apply compatibility hints from normalized intent to score results higher
 * when they match the user's bike profile (wheel size, voltage, brake type etc).
 */
function applyCompatibilityHints(results = [], hints = {}) {
  if (!hints || Object.keys(hints).length === 0) return results;

  const hintTokens = Object.values(hints)
    .filter(Boolean)
    .map((v) => String(v).toLowerCase());

  if (hintTokens.length === 0) return results;

  return results.map((item) => {
    const text = ((item.title || '') + ' ' + (item.description || '') + ' ' + (item.category || '')).toLowerCase();
    let matchCount = 0;
    for (const token of hintTokens) {
      if (text.includes(token)) matchCount++;
    }
    if (matchCount === 0) return item;

    const bonus = Math.min(0.3, matchCount * 0.1);
    const base = Number(item.compositeScore || item.score || 0);
    return {
      ...item,
      compatibilityBonus: bonus,
      score: base + bonus,
      compositeScore: base + bonus,
    };
  });
}

module.exports = {
  dedupeResults,
  compatibilityScore,
  applyNotesDecisionState,
  applyLearnedSuppression,
  applyCompatibilityHints,
  jaccardSimilarity,
};
