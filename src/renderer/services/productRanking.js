import { isHardBlockedText, matchesCategoryLock } from './strictProductFilter';

function normalize(text) {
  return String(text || '').toLowerCase();
}

export function matchesCategory(text, category) {
  return matchesCategoryLock(text, category);
}

function sourceTrustScore(source) {
  const normalized = normalize(source);
  if (normalized === 'amazon') return 10;
  if (normalized === 'ebay') return 9;
  if (normalized === 'marketcheck') return 7;
  if (normalized.includes('local')) return 6;
  return 2;
}

function shouldHardReject(text) {
  return isHardBlockedText(text);
}

export function computeScore(product, part, project) {
  let score = 0;
  const text = normalize(product?.title);
  const notes = normalize(project?.notes);
  const bikeType = normalize(project?.bikeTypeLabel || project?.bikeType);
  const intendedUse = normalize(project?.intendedUseLabel || project?.intendedUse);
  const reasons = [];

  if (matchesCategory(text, part?.category)) {
    score += 30;
    reasons.push('Category fit matched');
  }

  if (text.includes('ebike') || text.includes('e-bike')) {
    score += 10;
    reasons.push('E-bike keyword present');
  }
  if (text.includes('kit')) {
    score += 5;
    reasons.push('Kit bundle keyword present');
  }
  if (text.includes('48v')) {
    score += 5;
    reasons.push('48V compatibility hint');
  }

  if (normalize(part?.name).includes('mid drive') && text.includes('mid drive')) {
    score += 20;
    reasons.push('Mid-drive requirement match');
  }

  if (text.includes('kit') && text.includes('motor') && text.includes('battery')) {
    score += 15;
    reasons.push('Complete bundle detected');
  }

  if (bikeType.includes('mountain') && text.includes('mtb')) {
    score += 5;
    reasons.push('Mountain bike fit hint');
  }

  if (intendedUse.includes('trail') && text.includes('hydraulic')) {
    score += 5;
    reasons.push('Trail-use braking hint');
  }

  if (notes.includes('cyc phantom') && text.includes('cyc')) {
    score += 20;
    reasons.push('Project notes mention CYC Phantom');
  }

  const price = Number(product?.price || 0);
  if (price > 50 && price < 2000) {
    score += 10;
    reasons.push('Price in realistic range');
  }

  const trust = sourceTrustScore(product?.source);
  score += trust;
  if (trust >= 9) {
    reasons.push('Trusted source');
  }

  const videoReferences = Array.isArray(product?.videoReferences) ? product.videoReferences : [];
  if (videoReferences.length > 0) {
    const strongest = Math.max(...videoReferences.map((ref) => Number(ref?.matchConfidence || 0)));
    const videoBoost = Math.min(12, Math.round(strongest * 10) + 2);
    score += videoBoost;
    reasons.push(`Validated by ${videoReferences.length} build video${videoReferences.length > 1 ? 's' : ''}`);
  }

  if (shouldHardReject(text)) {
    score -= 60;
    reasons.push('Contains off-domain keywords');
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    reasons,
    rejected: shouldHardReject(text),
  };
}

function applyBuildSignalsBoost(score, reasons, signals) {
  const youtubeCount = Array.isArray(signals?.youtube) ? signals.youtube.length : 0;
  const bilibiliCount = Array.isArray(signals?.bilibili) ? signals.bilibili.length : 0;
  const redditCount = Array.isArray(signals?.reddit) ? signals.reddit.length : 0;

  let boosted = score;

  if (youtubeCount > 0) {
    boosted += 10;
    reasons.push(`Seen in ${youtubeCount} build video${youtubeCount > 1 ? 's' : ''}`);
  }

  if (bilibiliCount > 0) {
    boosted += 10;
    reasons.push(`Referenced in ${bilibiliCount} Bilibili build video${bilibiliCount > 1 ? 's' : ''}`);
  }

  if (redditCount > 0) {
    boosted += 5;
    reasons.push(`Discussed in ${redditCount} builder forum thread${redditCount > 1 ? 's' : ''}`);
  }

  if (youtubeCount + bilibiliCount >= 4 && redditCount > 0) {
    boosted += 6;
    reasons.push('Proof-of-use signals detected across multiple communities');
  }

  return boosted;
}

export function rankProducts(products, part, project, signals) {
  const safeProducts = Array.isArray(products) ? products : [];

  return safeProducts
    .map((product) => {
      const computed = computeScore(product, part, project);
      const boostedScore = applyBuildSignalsBoost(computed.score, computed.reasons, signals);
      return {
        ...product,
        score: Math.max(0, Math.min(100, boostedScore)),
        explanation: computed.reasons,
        rejected: computed.rejected,
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return Number(a.totalCost || a.price || 0) - Number(b.totalCost || b.price || 0);
    });
}

export default {
  rankProducts,
  computeScore,
  matchesCategory,
};
