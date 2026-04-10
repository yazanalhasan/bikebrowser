class SafetyFilter {
  constructor() {
    this.blockedKeywords = [
      'violent', 'crash', 'destroyed', 'fight', 'kill', 'explode',
      'scam', 'fake', 'naked', 'sexy', 'adult', '18+'
    ];

    this.elsagatePatterns = [
      /elsa.*spider.*man/i,
      /peppa.*pig.*shoot/i,
      /finger.*family.*spider/i,
      /character.*mashup/i
    ];
  }

  preFilter(results = [], expandedQuery = {}) {
    const filtered = [];

    for (const result of results) {
      const titleLower = String(result.title || '').toLowerCase();
      const descLower = String(result.description || '').toLowerCase();
      let blocked = false;

      for (const keyword of this.blockedKeywords) {
        if (titleLower.includes(keyword) || descLower.includes(keyword)) {
          blocked = true;
          break;
        }
      }

      if (!blocked) {
        for (const pattern of this.elsagatePatterns) {
          if (pattern.test(result.title || '') || pattern.test(result.description || '')) {
            blocked = true;
            break;
          }
        }
      }

      if (!blocked && expandedQuery?.suggested_filters?.price_max && result.price?.amount) {
        if (result.price.amount > expandedQuery.suggested_filters.price_max) {
          blocked = true;
        }
      }

      if (!blocked) {
        filtered.push(result);
      }
    }

    return filtered;
  }
}

module.exports = {
  SafetyFilter
};