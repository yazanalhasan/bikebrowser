const SHOPPING_SOURCES = new Set([
  'aliexpress',
  'banggood',
  'alibaba',
  'revzilla',
  'jensonusa',
  'chainreaction',
  'offerup',
  'facebook-marketplace',
  'adafruit',
  'makerbeam'
]);

class ShoppingSafetyFilter {
  constructor(config = {}) {
    this.maxPrice = Number.parseInt(process.env.SHOPPING_MAX_PRICE || `${config.maxPrice || 1000}`, 10);
    this.parentThreshold = Number.parseInt(process.env.SHOPPING_PARENTAL_GATE_THRESHOLD || `${config.parentThreshold || 100}`, 10);
    this.blockedPatterns = [
      /\b(adult|xxx|porn|sexy|nude)\b/i,
      /\b(weapon|gun|ammo|knife|blade|taser)\b/i,
      /\b(tobacco|cigarette|cigar|vape|nicotine)\b/i,
      /\b(alcohol|beer|wine|vodka|whiskey)\b/i,
      /\b(drug|cannabis|weed|thc|cbd|opioid)\b/i
    ];
    this.dangerousPatterns = [
      /\b(battery|lithium|lipo|motor|controller|solder|soldering|charger|48v|52v|72v)\b/i,
      /\b(frame kit|metal cutting|welding|grinder|drill)\b/i
    ];
    this.trustedRetailers = new Set(['revzilla', 'jensonusa', 'chainreaction', 'adafruit', 'makerbeam']);
  }

  isShoppingResult(result) {
    return SHOPPING_SOURCES.has(result?.source);
  }

  filter(results = [], options = {}) {
    const filtered = [];

    for (const result of results) {
      if (!this.isShoppingResult(result)) {
        filtered.push(result);
        continue;
      }

      const next = this.applySafetyRules(result, options);
      if (next) {
        filtered.push(next);
      }
    }

    return filtered;
  }

  applySafetyRules(result, options = {}) {
    const content = `${result.title || ''} ${result.description || ''}`;
    if (this.blockedPatterns.some((pattern) => pattern.test(content))) {
      return null;
    }

    const warnings = [];
    let safetyScore = 0.7;
    const source = String(result.source || '').toLowerCase();
    const priceAmount = Number(result.price?.amount || 0);
    const metadata = {
      ...(result.sourceMetadata || {})
    };

    if (this.trustedRetailers.has(source)) {
      safetyScore += 0.15;
    }

    if (metadata.sellerVerified) {
      safetyScore += 0.05;
    }

    if ((metadata.rating || 0) >= 4.5) {
      safetyScore += 0.05;
    }

    if (metadata.isInternational) {
      safetyScore -= 0.1;
      warnings.push('International shipping may take longer and require parent review.');
    }

    if (metadata.condition === 'used') {
      safetyScore -= 0.1;
      warnings.push('Used item - ask a parent to inspect condition carefully.');
    }

    if (priceAmount > this.maxPrice) {
      return null;
    }

    if (priceAmount > this.parentThreshold) {
      warnings.push(`Needs parental approval because the price is over $${this.parentThreshold}.`);
      metadata.parentApprovalRequired = true;
    }

    const hasDangerousComponents = this.dangerousPatterns.some((pattern) => pattern.test(content));
    if (hasDangerousComponents && priceAmount > 50) {
      warnings.push('Adult supervision required for batteries, motors, or tool-based assembly.');
      metadata.parentApprovalRequired = true;
    }

    if (options.localOnly && metadata.isInternational) {
      return null;
    }

    if (options.usOnly && metadata.country && metadata.country !== 'US') {
      return null;
    }

    metadata.shoppingWarnings = warnings;

    return {
      ...result,
      safety_score: Math.max(0, Math.min(1, safetyScore)),
      requires_supervision: Boolean(result.requires_supervision || metadata.parentApprovalRequired || hasDangerousComponents),
      summary: warnings.length > 0
        ? `${warnings[0]} ${result.summary || result.title}`.trim()
        : (result.summary || result.title),
      sourceMetadata: metadata
    };
  }
}

module.exports = {
  ShoppingSafetyFilter,
  SHOPPING_SOURCES
};