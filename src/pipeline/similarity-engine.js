class SimilarityEngine {
  constructor() {
    this.categoryWeights = {
      exact: 1.0,
      related: 0.5,
      none: 0
    };
  }

  compareItems(a, b) {
    const score = this.scoreSimilarity(a, b);
    return {
      score,
      isDuplicate: score > 0.8,
      isRelated: score > 0.4,
      breakdown: this._breakdown(a, b)
    };
  }

  scoreSimilarity(a, b) {
    if (!a || !b) return 0;

    let total = 0;
    let weights = 0;

    // Category match (weight: 3)
    const catScore = this._categoryMatch(a.category, b.category);
    total += catScore * 3;
    weights += 3;

    // Brand match (weight: 2)
    const brandScore = this._fieldMatch(
      a.attributes?.brand || a.brand,
      b.attributes?.brand || b.brand
    );
    total += brandScore * 2;
    weights += 2;

    // Title similarity (weight: 3)
    const titleScore = this._textSimilarity(a.title, b.title);
    total += titleScore * 3;
    weights += 3;

    // Attributes overlap (weight: 2)
    const attrScore = this._attributesOverlap(a.attributes || {}, b.attributes || {});
    total += attrScore * 2;
    weights += 2;

    // Source match (weight: 1)
    const sourceScore = this._fieldMatch(a.source, b.source);
    total += sourceScore * 1;
    weights += 1;

    // Price proximity (weight: 1)
    const priceScore = this._priceProximity(a.price, b.price);
    total += priceScore * 1;
    weights += 1;

    return weights > 0 ? total / weights : 0;
  }

  findDuplicates(items, threshold = 0.8) {
    const duplicates = [];
    const checked = new Set();

    for (let i = 0; i < items.length; i++) {
      if (checked.has(i)) continue;

      const group = [i];
      for (let j = i + 1; j < items.length; j++) {
        if (checked.has(j)) continue;

        const score = this.scoreSimilarity(items[i], items[j]);
        if (score >= threshold) {
          group.push(j);
          checked.add(j);
        }
      }

      if (group.length > 1) {
        duplicates.push({
          primary: items[group[0]],
          duplicates: group.slice(1).map((idx) => ({
            item: items[idx],
            similarity: this.scoreSimilarity(items[group[0]], items[idx])
          }))
        });
      }
    }

    return duplicates;
  }

  deduplicateResults(items, threshold = 0.8) {
    if (!items || items.length === 0) return [];

    const kept = [];
    const removed = new Set();

    for (let i = 0; i < items.length; i++) {
      if (removed.has(i)) continue;

      let isDupe = false;
      for (let j = 0; j < kept.length; j++) {
        if (this.scoreSimilarity(items[i], kept[j]) >= threshold) {
          isDupe = true;
          // Keep the one with higher score
          if ((items[i].compositeScore || items[i].score || 0) > (kept[j].compositeScore || kept[j].score || 0)) {
            kept[j] = { ...items[i], _hasDuplicates: true };
          } else {
            kept[j]._hasDuplicates = true;
          }
          break;
        }
      }

      if (!isDupe) {
        kept.push(items[i]);
      }
    }

    return kept;
  }

  _categoryMatch(a, b) {
    if (!a || !b) return 0;
    if (a === b) return 1.0;

    const relatedGroups = [
      ['motor', 'battery', 'drivetrain'],
      ['wheel', 'tire', 'tube'],
      ['brakes', 'drivetrain'],
      ['handlebar', 'seat', 'frame'],
      ['light', 'accessory']
    ];

    for (const group of relatedGroups) {
      if (group.includes(a) && group.includes(b)) return 0.5;
    }
    return 0;
  }

  _fieldMatch(a, b) {
    if (!a || !b) return 0;
    const na = String(a).toLowerCase().trim();
    const nb = String(b).toLowerCase().trim();
    if (na === nb) return 1.0;
    if (na.includes(nb) || nb.includes(na)) return 0.7;
    return 0;
  }

  _textSimilarity(a, b) {
    if (!a || !b) return 0;
    const tokensA = new Set(String(a).toLowerCase().split(/\s+/).filter(Boolean));
    const tokensB = new Set(String(b).toLowerCase().split(/\s+/).filter(Boolean));
    if (tokensA.size === 0 || tokensB.size === 0) return 0;

    let intersection = 0;
    for (const token of tokensA) {
      if (tokensB.has(token)) intersection++;
    }

    const union = new Set([...tokensA, ...tokensB]).size;
    return union > 0 ? intersection / union : 0;
  }

  _attributesOverlap(a, b) {
    const keysA = Object.keys(a).filter((k) => a[k]);
    const keysB = Object.keys(b).filter((k) => b[k]);
    if (keysA.length === 0 || keysB.length === 0) return 0;

    let matches = 0;
    let total = 0;

    for (const key of keysA) {
      if (keysB.includes(key)) {
        total++;
        const va = String(a[key]).toLowerCase().trim();
        const vb = String(b[key]).toLowerCase().trim();
        if (va === vb) matches++;
        else if (va.includes(vb) || vb.includes(va)) matches += 0.5;
      }
    }

    return total > 0 ? matches / total : 0;
  }

  _priceProximity(a, b) {
    const pa = Number(a) || 0;
    const pb = Number(b) || 0;
    if (pa === 0 || pb === 0) return 0;

    const diff = Math.abs(pa - pb);
    const avg = (pa + pb) / 2;
    const ratio = diff / avg;

    if (ratio < 0.1) return 1.0;
    if (ratio < 0.25) return 0.7;
    if (ratio < 0.5) return 0.4;
    return 0;
  }

  _breakdown(a, b) {
    return {
      category: this._categoryMatch(a?.category, b?.category),
      brand: this._fieldMatch(a?.attributes?.brand || a?.brand, b?.attributes?.brand || b?.brand),
      title: this._textSimilarity(a?.title, b?.title),
      attributes: this._attributesOverlap(a?.attributes || {}, b?.attributes || {}),
      source: this._fieldMatch(a?.source, b?.source),
      price: this._priceProximity(a?.price, b?.price)
    };
  }
}

module.exports = { SimilarityEngine };
