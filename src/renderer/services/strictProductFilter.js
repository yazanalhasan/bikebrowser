const HARD_BLOCK_PATTERNS = [
  /\bmotorcycle\b/i,
  /\butv\b/i,
  /\bharley\b/i,
  /\bchainsaw\b/i,
  /\bcharger\b/i,
  /\bcable\b/i,
  /\bbleeder\b/i,
  /\barduino\b/i,
  /\bfuel\b/i,
  /\bdev\s*board\b/i,
  /\bbreakout\b/i,
  /\bshield\b/i,
  /\bsparkfun\b/i,
  /\badafruit\b/i,
];

const BIKE_CONTEXT_TERMS = [
  'bike',
  'bicycle',
  'ebike',
  'e-bike',
  'mtb',
  'shimano',
  'hub motor',
  'mid drive',
  'disc brake',
  'hydraulic',
  'cassette',
  'freewheel',
  'downtube',
  'torque arm',
  'controller',
];

const CATEGORY_TERMS = {
  motor: ['motor', 'mid drive', 'hub motor', 'conversion kit', 'controller', 'ebike'],
  battery: ['battery', '48v', '52v', 'lithium', 'downtube', 'bms'],
  brakes: ['brake', 'disc', 'hydraulic', 'caliper', 'rotor', 'lever'],
  drivetrain: ['drivetrain', 'cassette', 'freewheel', 'chainring', 'derailleur', 'crank'],
  safety: ['helmet', 'torque arm', 'brake', 'light', 'reflective', 'lock'],
  general: [],
};

export const STRICT_REASON = {
  BLOCKED_TERM: 'blocked_term',
  CATEGORY_MISMATCH: 'category_mismatch',
  INSUFFICIENT_RELEVANCE: 'insufficient_relevance',
  BELOW_THRESHOLD: 'below_threshold',
};

function normalize(value) {
  return String(value || '').toLowerCase();
}

function hasAnyTerm(text, terms) {
  return terms.some((term) => text.includes(term));
}

export function getCategoryKey(category) {
  const value = normalize(category);

  if (value.includes('motor') || value.includes('drive')) return 'motor';
  if (value.includes('battery') || value.includes('power')) return 'battery';
  if (value.includes('brake')) return 'brakes';
  if (value.includes('drivetrain') || value.includes('cassette') || value.includes('freewheel')) return 'drivetrain';
  if (value.includes('safety') || value.includes('hardware')) return 'safety';

  return 'general';
}

export function isHardBlockedText(text) {
  return HARD_BLOCK_PATTERNS.some((pattern) => pattern.test(text));
}

export function matchesCategoryLock(text, category) {
  const key = getCategoryKey(category);
  const requiredTerms = CATEGORY_TERMS[key] || [];

  if (requiredTerms.length === 0) {
    return true;
  }

  return hasAnyTerm(text, requiredTerms);
}

export function hasBikeContext(text, category) {
  const categoryTerms = CATEGORY_TERMS[getCategoryKey(category)] || [];
  return hasAnyTerm(text, BIKE_CONTEXT_TERMS) || hasAnyTerm(text, categoryTerms);
}

export function evaluateProductStrict(product, part) {
  const text = normalize(`${product?.title || ''} ${product?.category || ''} ${product?.compatibilityHint || ''}`);

  if (isHardBlockedText(text)) {
    return {
      allowed: false,
      reasonCode: STRICT_REASON.BLOCKED_TERM,
    };
  }

  if (!hasBikeContext(text, part?.category)) {
    return {
      allowed: false,
      reasonCode: STRICT_REASON.INSUFFICIENT_RELEVANCE,
    };
  }

  if (!matchesCategoryLock(text, part?.category)) {
    return {
      allowed: false,
      reasonCode: STRICT_REASON.CATEGORY_MISMATCH,
    };
  }

  return {
    allowed: true,
    reasonCode: null,
  };
}

export function filterStrictProducts(products, part) {
  const safeProducts = Array.isArray(products) ? products : [];
  const accepted = [];
  const rejected = [];

  safeProducts.forEach((product) => {
    const evaluation = evaluateProductStrict(product, part);
    if (evaluation.allowed) {
      accepted.push(product);
      return;
    }

    rejected.push({
      product,
      reasonCode: evaluation.reasonCode,
    });
  });

  return {
    accepted,
    rejected,
  };
}

export function deriveNoResultsReasonCode(rejected) {
  const safeRejected = Array.isArray(rejected) ? rejected : [];

  if (safeRejected.length === 0) {
    return STRICT_REASON.INSUFFICIENT_RELEVANCE;
  }

  const counts = safeRejected.reduce((acc, entry) => {
    const key = entry?.reasonCode || STRICT_REASON.INSUFFICIENT_RELEVANCE;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || STRICT_REASON.INSUFFICIENT_RELEVANCE;
}

export default {
  STRICT_REASON,
  getCategoryKey,
  isHardBlockedText,
  matchesCategoryLock,
  hasBikeContext,
  evaluateProductStrict,
  filterStrictProducts,
  deriveNoResultsReasonCode,
};
