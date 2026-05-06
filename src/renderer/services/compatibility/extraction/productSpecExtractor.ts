import type { ProductSpecs } from '../bikeProfiles/schema';
import REGEX_LIBRARY from './regexLibrary';
import { maxCassetteTooth, normalizeCategory, normalizeText } from './normalization';

type ProductLike = {
  title?: string;
  description?: string;
  bulletPoints?: string[];
  category?: string;
  [key: string]: unknown;
};

function confidenceFromMatches(count: number): number {
  if (count >= 6) return 0.92;
  if (count >= 4) return 0.82;
  if (count >= 2) return 0.68;
  return 0.42;
}

export function extractProductSpecs(product: ProductLike | string): ProductSpecs {
  const source = typeof product === 'string' ? { title: product } : product || {};
  const text = normalizeText([
    source.title,
    source.description,
    Array.isArray(source.bulletPoints) ? source.bulletPoints.join(' ') : '',
    source.category,
  ].filter(Boolean).join(' '));

  const specs: ProductSpecs = {
    title: source.title || text,
    description: source.description || '',
    category: normalizeCategory(text),
    raw: product,
    extractedSpecs: {},
  };

  let matches = 0;

  if (/\bshimano\b/i.test(text)) {
    specs.brand = 'Shimano';
    matches += 1;
  }

  if (REGEX_LIBRARY.cues.test(text)) {
    specs.family = 'Shimano CUES';
    specs.pullRatio = 'LINKGLIDE';
    matches += 2;
  } else if (REGEX_LIBRARY.hyperglide.test(text)) {
    specs.family = 'Shimano Deore';
    specs.pullRatio = 'HYPERGLIDE';
    matches += 2;
  }

  const speedMatch = text.match(REGEX_LIBRARY.speeds);
  if (speedMatch) {
    specs.speeds = Number(speedMatch[1]);
    matches += 1;
  }

  const cassetteMatch = text.match(REGEX_LIBRARY.cassetteRange);
  if (cassetteMatch) {
    specs.cassetteRange = `${cassetteMatch[1]}-${cassetteMatch[2]}T`;
    specs.maxCogTeeth = Number(cassetteMatch[2]);
    matches += 1;
  } else {
    const maxCogMatch = text.match(REGEX_LIBRARY.maxCog);
    if (maxCogMatch) {
      specs.maxCogTeeth = Number(maxCogMatch[1]);
      matches += 1;
    }
  }

  if (!specs.maxCogTeeth && specs.cassetteRange) {
    specs.maxCogTeeth = maxCassetteTooth(specs.cassetteRange);
  }

  if (REGEX_LIBRARY.longCage.test(text)) {
    specs.cage = 'long';
    matches += 1;
  } else if (REGEX_LIBRARY.mediumCage.test(text)) {
    specs.cage = 'medium';
    matches += 1;
  }

  if (REGEX_LIBRARY.boostRear.test(text)) {
    specs.rearSpacing = '12x148 Boost';
    matches += 1;
  }

  if (REGEX_LIBRARY.boostFront.test(text)) {
    specs.frontSpacing = '15x110 Boost';
    matches += 1;
  }

  const seatpostMatch = text.match(REGEX_LIBRARY.seatpost);
  if (seatpostMatch) {
    specs.seatpostDiameter = Number(seatpostMatch[1]);
    matches += 1;
  }

  if (REGEX_LIBRARY.clamp318.test(text)) {
    specs.handlebarClamp = '31.8mm';
    specs.stemClamp = '31.8mm';
    matches += 1;
  }

  const rotorMatch = text.match(REGEX_LIBRARY.rotor);
  if (rotorMatch) {
    specs.rotorSize = Number(rotorMatch[1]);
    matches += 1;
  }

  if (REGEX_LIBRARY.postMount.test(text)) {
    specs.mountType = 'post mount';
    matches += 1;
  }

  if (REGEX_LIBRARY.external73.test(text)) {
    specs.bottomBracket = 'external 73mm';
    matches += 1;
  }

  specs.extractionConfidence = confidenceFromMatches(matches);
  specs.extractedSpecs = { ...specs };
  return specs;
}

export async function extractProductSpecsWithAIFallback(product: ProductLike | string): Promise<ProductSpecs> {
  const specs = extractProductSpecs(product);
  if ((specs.extractionConfidence || 0) >= 0.65) {
    return specs;
  }

  return {
    ...specs,
    warnings: ['AI extraction fallback placeholder: listing metadata is ambiguous.'],
  } as ProductSpecs;
}

export default {
  extractProductSpecs,
  extractProductSpecsWithAIFallback,
};
