import { CURATED_EBIKE_BUILDS } from '../../data/curatedBuilds';

function normalizeUseCase(value) {
  const lower = String(value || '').trim().toLowerCase();
  if (lower === 'commute') return 'commuter';
  return lower;
}

export function matchCuratedBuild(project) {
  const intendedUse = normalizeUseCase(project?.intendedUse);
  const bikeType = String(project?.bikeType || '').toLowerCase();

  return CURATED_EBIKE_BUILDS.find((build) => (
    String(build?.bikeType || '').toLowerCase().includes('mtb') &&
    (bikeType.includes('mountain') || bikeType.includes('mtb') || bikeType.includes('hardtail')) &&
    Array.isArray(build?.useCase) &&
    build.useCase.map((value) => String(value).toLowerCase()).includes(intendedUse)
  ));
}

export function generateFallbackLink(query) {
  return `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(String(query || '').trim())}`;
}

export function mergeAIWithCurated(aiParts, curatedParts) {
  const aiList = Array.isArray(aiParts) ? aiParts : [];
  const curatedMap = curatedParts && typeof curatedParts === 'object' ? curatedParts : null;

  if (!curatedMap) {
    return aiList;
  }

  const result = [];
  const curatedCategories = new Set();

  Object.keys(curatedMap).forEach((key) => {
    const curated = curatedMap[key];
    const category = String(curated?.category || key).toLowerCase();
    curatedCategories.add(category);

    const queries = Array.isArray(curated?.searchQueries) && curated.searchQueries.length > 0
      ? curated.searchQueries
      : [curated?.name || key];

    result.push({
      ...curated,
      category: curated?.category || key,
      type: key,
      source: 'curated',
      confidence: 0.9,
      knownGood: curated?.knownGood !== false,
      description: curated?.description || `${curated?.name || key} from proven curated build setup.`,
      reason: curated?.reason || `Proven part from curated build library (${key}).`,
      estimatedPrice: curated?.estimatedPrice || 'Curated reference',
      exampleSearchQueries: queries,
      fallbackLink: generateFallbackLink(queries[0]),
      priority: curated?.priority === 'optional' ? 'optional' : 'required',
    });
  });

  aiList.forEach((part) => {
    const category = String(part?.category || '').toLowerCase();
    if (!curatedCategories.has(category)) {
      result.push(part);
    }
  });

  return result;
}

export default {
  matchCuratedBuild,
  mergeAIWithCurated,
  generateFallbackLink,
};
