import { getBuildPlannerAIClient } from './buildPlannerAIClient';
import { runCompatibilityReview } from './buildPlannerCompatibility';
import { runAITask } from '../aiOrchestrator';
import { getTemplateChecklist } from './buildTemplates';
import { resolveProductsForParts } from '../productResolver';
import { userLocation as defaultUserLocation } from '../../state/userLocation';
import { matchCuratedBuild, mergeAIWithCurated } from './curatedBuildMatcher';

const BIKE_TYPE_LABELS = {
  'road-bike': 'Road Bike',
  'mountain-bike': 'Mountain Bike',
  bmx: 'BMX',
  'e-bike': 'E-Bike',
  'kids-bike': 'Kids Bike',
};

const USE_LABELS = {
  commute: 'Commuting',
  trail: 'Trail Riding',
  downhill: 'Downhill',
  'street-tricks': 'Street Tricks',
  neighborhood: 'Neighborhood Rides',
};

const DEFAULT_RECOMMENDED_PARTS = [
  {
    name: '500W rear hub motor kit (7-speed freewheel compatible)',
    category: 'Drivetrain',
    type: 'motor-kit',
    description: 'Complete rear hub conversion kit with controller and throttle.',
    reason: 'Reliable baseline for mixed trail and commuting conversion projects.',
    estimatedPrice: '$180-$320',
    priority: 'required',
    fitmentConfidence: 0.8,
    universal: false,
    mustVerify: true,
    exampleSearchQueries: ['500W rear hub motor kit 7 speed freewheel'],
  },
  {
    name: '48V 13Ah Hailong downtube battery',
    category: 'Power',
    type: 'battery-pack',
    description: 'Downtube battery pack with lockable rail and BMS.',
    reason: 'Good energy density and common mounting ecosystem for entry e-builds.',
    estimatedPrice: '$220-$380',
    priority: 'required',
    fitmentConfidence: 0.74,
    universal: false,
    mustVerify: true,
    exampleSearchQueries: ['48V 13Ah Hailong downtube battery'],
  },
  {
    name: 'Hydraulic disc brakes (Shimano MT200 level)',
    category: 'Braking',
    type: 'brake-set',
    description: 'Front/rear hydraulic brake set with calipers and levers.',
    reason: 'Improves stopping control for heavier conversion builds.',
    estimatedPrice: '$55-$95',
    priority: 'required',
    fitmentConfidence: 0.86,
    universal: false,
    mustVerify: true,
    exampleSearchQueries: ['Shimano MT200 hydraulic disc brake set'],
  },
  {
    name: 'Small-frame hardtail MTB donor bike (15-16 inch frame)',
    category: 'Frame/Donor',
    type: 'donor-bike',
    description: 'Entry-level hardtail with standard dropout and disc mounts.',
    reason: 'Better geometry and standover for shorter riders and trail stability.',
    estimatedPrice: '$250-$550 used/new',
    priority: 'optional',
    fitmentConfidence: 0.68,
    universal: false,
    mustVerify: true,
    exampleSearchQueries: ['small frame hardtail MTB 15 inch donor bike'],
  },
  {
    name: 'Torque arm kit for rear hub motor',
    category: 'Safety/Hardware',
    type: 'safety-hardware',
    description: 'Dual torque arm kit to protect dropouts under motor load.',
    reason: 'Critical safety hardware for most rear hub conversions.',
    estimatedPrice: '$12-$30',
    priority: 'required',
    fitmentConfidence: 0.9,
    universal: true,
    mustVerify: false,
    exampleSearchQueries: ['ebike dual torque arm kit'],
  },
  {
    name: '27.5 wheelset with double-wall rims',
    category: 'Wheels',
    type: 'wheelset',
    description: 'Strong wheelset option for shorter riders needing lower standover.',
    reason: 'Lower rollover height than 29-inch and often better fit under 155 cm.',
    estimatedPrice: '$120-$260',
    priority: 'optional',
    fitmentConfidence: 0.71,
    universal: false,
    mustVerify: true,
    exampleSearchQueries: ['27.5 MTB wheelset double wall'],
  },
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeRecommendationPart(part, index) {
  const source = part && typeof part === 'object' ? part : {};
  const fallback = DEFAULT_RECOMMENDED_PARTS[index % DEFAULT_RECOMMENDED_PARTS.length];
  const priority = source.priority === 'optional' ? 'optional' : 'required';

  return {
    name: source.name || fallback.name,
    category: source.category || fallback.category,
    type: source.type || fallback.type,
    description: source.description || fallback.description,
    reason: source.reason || fallback.reason,
    estimatedPrice: source.estimatedPrice || fallback.estimatedPrice,
    priority,
    fitmentConfidence: Number.isFinite(Number(source.fitmentConfidence))
      ? clamp(Number(source.fitmentConfidence), 0, 1)
      : fallback.fitmentConfidence,
    universal: Boolean(source.universal),
    mustVerify: source.mustVerify === undefined ? true : Boolean(source.mustVerify),
    source: source.source || 'ai',
    confidence: Number.isFinite(Number(source.confidence))
      ? clamp(Number(source.confidence), 0, 1)
      : 0.62,
    knownGood: Boolean(source.knownGood),
    fallbackLink: source.fallbackLink || '',
    exampleSearchQueries: Array.isArray(source.exampleSearchQueries)
      ? source.exampleSearchQueries.filter(Boolean).slice(0, 4)
      : fallback.exampleSearchQueries,
    products: Array.isArray(source.products)
      ? source.products
          .filter((entry) => entry && typeof entry === 'object')
          .slice(0, 3)
          .map((entry) => ({
            title: entry.title || 'Listing',
            price: Number.isFinite(Number(entry.price)) ? Number(entry.price) : 0,
            url: entry.url || '',
            image: entry.image || 'https://via.placeholder.com/240x240?text=Listing',
            source: entry.source || 'market',
            score: Number.isFinite(Number(entry.score)) ? Number(entry.score) : 0,
            shippingCost: Number.isFinite(Number(entry.shippingCost)) ? Number(entry.shippingCost) : 0,
            totalCost: Number.isFinite(Number(entry.totalCost)) ? Number(entry.totalCost) : Number(entry.price || 0),
            distance: Number.isFinite(Number(entry.distance)) ? Number(entry.distance) : null,
            type: entry.type === 'local' ? 'local' : 'online',
            explanation: Array.isArray(entry.explanation) ? entry.explanation.filter(Boolean).slice(0, 4) : [],
            videoReferences: Array.isArray(entry.videoReferences)
              ? entry.videoReferences
                  .filter((ref) => ref && typeof ref === 'object' && ref.videoId && ref.url)
                  .slice(0, 2)
              : [],
          }))
      : [],
  };
}

function isTooGenericRecommendation(part) {
  const forbidden = ['motor', 'battery', 'brakes', 'frame', 'donor bike', 'donor'];
  const normalized = String(part?.name || '').trim().toLowerCase();
  return !normalized || forbidden.includes(normalized);
}

function buildFallbackRecommendedParts(profile, checklist) {
  const parts = [...DEFAULT_RECOMMENDED_PARTS];

  if ((profile.riderHeightCm || 0) < 155) {
    parts.unshift({
      name: 'XS or small frame hardtail donor bike with low standover',
      category: 'Frame/Donor',
      type: 'donor-bike',
      description: 'Prioritize low standover geometry for shorter rider comfort and control.',
      reason: 'Riders below ~155 cm usually fit better on XS/small frames.',
      estimatedPrice: '$250-$600 used/new',
      priority: 'required',
      fitmentConfidence: 0.87,
      universal: false,
      mustVerify: true,
      exampleSearchQueries: ['XS small frame hardtail MTB low standover'],
    });
  }

  if ((profile.riderHeightCm || 0) < 155 && Number(profile.wheelSizeIn) === 29) {
    parts.unshift({
      name: '27.5 wheel upgrade (or 27.5 donor) for lower standover',
      category: 'Wheels',
      type: 'wheelset',
      description: 'Alternative wheel size to reduce height and improve fit confidence.',
      reason: '29-inch wheels can be difficult to fit safely for riders around 5 ft.',
      estimatedPrice: '$120-$280',
      priority: 'required',
      fitmentConfidence: 0.89,
      universal: false,
      mustVerify: true,
      exampleSearchQueries: ['27.5 MTB wheelset for small rider fit'],
    });
  }

  (checklist || []).forEach((item) => {
    const rec = item?.recommendedItem;
    if (!rec?.name) {
      return;
    }

    parts.push({
      name: rec.name,
      category: item.category || 'General',
      type: String(item.category || 'general').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: rec.description || `Recommended from checklist item: ${item.title || rec.name}`,
      reason: item.reason || 'Included from AI checklist recommendation.',
      estimatedPrice: `$${Number(item.estimatedCost || 0).toFixed(0)}`,
      priority: item.required ? 'required' : 'optional',
      fitmentConfidence: item.required ? 0.76 : 0.64,
      universal: false,
      mustVerify: Boolean(item.measurementNeeded),
      exampleSearchQueries: [rec.name],
    });
  });

  const normalized = parts
    .map((part, index) => normalizeRecommendationPart(part, index))
    .filter((part) => !isTooGenericRecommendation(part));

  const deduped = [];
  const seen = new Set();

  normalized.forEach((part) => {
    const key = part.name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(part);
    }
  });

  return deduped.slice(0, 6);
}

function normalizeRecommendedParts(parts, profile, checklist) {
  const source = Array.isArray(parts) ? parts : [];
  const normalized = source
    .map((part, index) => normalizeRecommendationPart(part, index))
    .filter((part) => !isTooGenericRecommendation(part));

  const finalList = normalized.length >= 3
    ? normalized.slice(0, 6)
    : buildFallbackRecommendedParts(profile, checklist).slice(0, 6);

  return finalList.length >= 3 ? finalList : DEFAULT_RECOMMENDED_PARTS.slice(0, 3);
}

function normalizeChecklistItem(item, index) {
  const source = item && typeof item === 'object' ? item : {};
  const title = source.title || source.name || `Checklist Item ${index + 1}`;

  return {
    id: source.id || `checklist-item-${index + 1}`,
    title,
    category: source.category || 'General',
    reason: source.reason || 'No reason provided yet.',
    required: Boolean(source.required),
    measurementNeeded: Boolean(source.measurementNeeded),
    estimatedCost: Number.isFinite(Number(source.estimatedCost)) ? Number(source.estimatedCost) : 0,
    recommendedItem: source.recommendedItem && typeof source.recommendedItem === 'object'
      ? {
          name: source.recommendedItem.name || title,
          quantity: Number(source.recommendedItem.quantity) || 1,
          description: source.recommendedItem.description || '',
        }
      : {
          name: title,
          quantity: 1,
          description: '',
        },
  };
}

function normalizeAIPlan(aiPlan, profile) {
  const source = aiPlan && typeof aiPlan === 'object' ? aiPlan : {};
  const checklist = Array.isArray(source.checklist)
    ? source.checklist.map((item, index) => normalizeChecklistItem(item, index))
    : [];

  const curatedBuild = matchCuratedBuild(profile);
  const warnings = Array.isArray(source.warnings) ? source.warnings : [];
  const curatedWarnings = Array.isArray(curatedBuild?.warnings) ? curatedBuild.warnings : [];
  const missingMeasurements = Array.isArray(source.missingMeasurements)
    ? source.missingMeasurements
    : Array.isArray(source.missingInfo)
      ? source.missingInfo
      : [];
  const donorBikeSuggestions = Array.isArray(source.donorBikeSuggestions)
    ? source.donorBikeSuggestions.map((entry, index) => {
      const value = entry && typeof entry === 'object' ? entry : {};
      return {
        id: value.id || `donor-${index + 1}`,
        name: value.name || `Donor Suggestion ${index + 1}`,
        reason: value.reason || 'Suggested based on rider fit and intended use.',
        fitmentConfidence: Number.isFinite(Number(value.fitmentConfidence))
          ? clamp(Number(value.fitmentConfidence), 0, 1)
          : 0.62,
      };
    })
    : [];
  const mergedParts = mergeAIWithCurated(source.recommendedParts, curatedBuild?.parts || null);
  const recommendedParts = normalizeRecommendedParts(mergedParts, profile, checklist);

  return {
    plannerVersion: source.plannerVersion || 'v1',
    provider: source.provider || 'orchestrated',
    projectSummary:
      source.summary ||
      source.projectSummary ||
      `Plan for ${profile.projectName}: ${profile.bikeTypeLabel} build for ${profile.intendedUseLabel}.`,
    buildStrategy: source.buildStrategy || 'Balanced conversion strategy with safety-first fitment checks.',
    readinessScore: source.readinessScore || 'workable',
    checklist,
    warnings: [...warnings, ...curatedWarnings],
    missingMeasurements,
    measurementsToConfirm: Array.isArray(source.measurementsToConfirm) ? source.measurementsToConfirm : [],
    recommendedParts,
    donorBikeSuggestions,
    curatedBuildId: curatedBuild?.id || null,
    curatedBuildName: curatedBuild?.name || null,
    nextBestAction: source.nextBestAction || 'Confirm fitment-critical measurements before ordering powertrain parts.',
  };
}

function fallbackCustomPartAnalysis(input, profile) {
  const itemName = input?.itemName || input?.name || input?.query || 'Custom Part';
  const lower = itemName.toLowerCase();

  let category = 'General';
  let subsystem = 'fitment';
  let status = 'verify';
  let confidence = 0.58;
  let summary = 'Needs fitment checks against frame and drivetrain before purchase.';
  const reasons = ['Input is partially specified, so compatibility is probabilistic.'];
  const requiredChecks = ['Confirm frame mounting interface.', 'Confirm voltage and connector compatibility.'];
  const warnings = [];
  const fitmentNotes = [];
  const recommendedAlternatives = [];

  if (lower.includes('battery')) {
    category = 'Power';
    subsystem = 'electrical';
    status = 'probable';
    confidence = 0.7;
    summary = 'Battery appears likely compatible if controller voltage and mount spacing match.';
    requiredChecks.push('Match battery nominal voltage to controller/motor kit.');
  } else if (lower.includes('bafang') || lower.includes('mid-drive')) {
    category = 'Drivetrain';
    subsystem = 'bottom-bracket';
    status = 'verify';
    confidence = 0.66;
    summary = 'Mid-drive fitment depends heavily on bottom bracket shell width and frame clearance.';
    requiredChecks.push('Measure bottom bracket shell width (e.g., 68-73mm).');
    recommendedAlternatives.push('500W rear hub motor kit (7-speed freewheel compatible)');
  } else if (lower.includes('ozark') || lower.includes('trek') || lower.includes('donor')) {
    category = 'Frame/Donor';
    subsystem = 'geometry';
    status = 'probable';
    confidence = 0.69;
    summary = 'Donor bike is likely workable if frame size and wheel size match rider fit goals.';
    requiredChecks.push('Confirm frame size label (XS/S) and standover clearance.');
  }

  if ((profile.riderHeightCm || 0) < 155 && Number(profile.wheelSizeIn) === 29) {
    warnings.push('29-inch wheels may create standover fit issues for riders under 155 cm.');
    fitmentNotes.push('Consider 27.5 wheels and XS/small frame to improve control and comfort.');
    if (status === 'probable') {
      status = 'verify';
      confidence = Math.min(confidence, 0.62);
    }
    recommendedAlternatives.push('27.5 wheelset with XS/small frame donor geometry');
  }

  return {
    itemName,
    category,
    subsystem,
    status,
    confidence,
    summary,
    reasons,
    requiredChecks,
    warnings,
    fitmentNotes,
    recommendedAlternatives,
  };
}

function normalizeCustomPartAnalysisResult(result, input, profile) {
  const source = result && typeof result === 'object' ? result : {};
  const fallback = fallbackCustomPartAnalysis(input, profile);
  const status = ['compatible', 'probable', 'verify', 'incompatible'].includes(source.status)
    ? source.status
    : fallback.status;

  return {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    itemName: source.itemName || fallback.itemName,
    category: source.category || fallback.category,
    subsystem: source.subsystem || fallback.subsystem,
    status,
    confidence: Number.isFinite(Number(source.confidence))
      ? clamp(Number(source.confidence), 0, 1)
      : fallback.confidence,
    summary: source.summary || fallback.summary,
    reasons: Array.isArray(source.reasons) ? source.reasons : fallback.reasons,
    requiredChecks: Array.isArray(source.requiredChecks) ? source.requiredChecks : fallback.requiredChecks,
    warnings: Array.isArray(source.warnings) ? source.warnings : fallback.warnings,
    fitmentNotes: Array.isArray(source.fitmentNotes) ? source.fitmentNotes : fallback.fitmentNotes,
    recommendedAlternatives: Array.isArray(source.alternatives)
      ? source.alternatives
      : Array.isArray(source.recommendedAlternatives)
        ? source.recommendedAlternatives
      : fallback.recommendedAlternatives,
    inputUrl: input?.url || '',
  };
}

function normalizeProfile(input) {
  return {
    projectName: (input.projectName || 'Untitled Build').trim(),
    projectType: input.projectType || 'ebike_conversion',
    userDescription: input.userDescription?.trim() || '',
    bikeType: input.bikeType || 'mountain-bike',
    bikeTypeLabel: BIKE_TYPE_LABELS[input.bikeType] || 'Bike',
    intendedUse: input.intendedUse || 'trail',
    intendedUseLabel: USE_LABELS[input.intendedUse] || 'General riding',
    riderHeightCm: input.riderHeightCm ? Number(input.riderHeightCm) : null,
    frameSizeCm: input.frameSizeCm ? Number(input.frameSizeCm) : null,
    wheelSizeIn: input.wheelSizeIn ? Number(input.wheelSizeIn) : null,
    budgetUsd: input.budgetUsd ? Number(input.budgetUsd) : 0,
    notes: input.notes?.trim() || '',
  };
}

export async function generateBuildPlannerReport(input) {
  const profile = normalizeProfile(input);
  const activeLocation = {
    ...defaultUserLocation,
    ...(input?.location || {}),
  };
  const checklistTemplate = getTemplateChecklist(profile.projectType);
  let aiPlan;

  try {
    const orchestrated = await runAITask('buildPlan', {
      project: profile,
      checklistTemplate,
      userDescription: profile.userDescription,
      fallbackData: null,
    });
    aiPlan = orchestrated.data;
  } catch (error) {
    const aiClient = getBuildPlannerAIClient();
    aiPlan = await aiClient.generatePlan(profile);
  }

  const normalizedPlan = normalizeAIPlan(aiPlan, profile);
  const resolvedParts = await resolveProductsForParts(normalizedPlan.recommendedParts || [], activeLocation, profile);
  const hydratedPlan = {
    ...normalizedPlan,
    recommendedParts: resolvedParts,
  };
  const compatibility = runCompatibilityReview(hydratedPlan, profile);

  return {
    profile,
    aiPlan: hydratedPlan,
    compatibility,
    generatedAt: new Date().toISOString(),
  };
}

export async function analyzeCustomPartCompatibility(input, profileInput) {
  const profile = normalizeProfile(profileInput || {});
  const fallbackData = fallbackCustomPartAnalysis(input, profile);

  try {
    const orchestrated = await runAITask('analyzeCustomPart', {
      project: profile,
      item: input,
      fallbackData,
    });

    return normalizeCustomPartAnalysisResult(orchestrated.data, input, profile);
  } catch (error) {
    return normalizeCustomPartAnalysisResult(fallbackData, input, profile);
  }
}

export default {
  generateBuildPlannerReport,
  analyzeCustomPartCompatibility,
};
