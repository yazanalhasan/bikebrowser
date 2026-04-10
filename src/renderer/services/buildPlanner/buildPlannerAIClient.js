const BIKE_BASE_PARTS = {
  'road-bike': ['wheelset', 'rim brake pads', 'drop handlebars', 'road tires'],
  'mountain-bike': ['knobby tires', 'disc brake pads', 'wide handlebars', 'chain guide'],
  'bmx': ['single-speed chain', 'peg set', 'bmx tires', 'bmx crankset'],
  'e-bike': ['motor-safe chain', 'battery mount kit', 'torque arm', 'disc brake pads'],
  'kids-bike': ['training wheel kit', 'chain guard', 'reflector set', 'helmet'],
};

function toTitleCase(value) {
  return value
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

function createChecklistItem(name, index, profile) {
  const normalizedName = name.toLowerCase();
  const needsMeasurement =
    normalizedName.includes('wheel') ||
    normalizedName.includes('tire') ||
    normalizedName.includes('chain') ||
    normalizedName.includes('crank');

  return {
    id: `${normalizedName.replace(/[^a-z0-9]+/g, '-')}-${index + 1}`,
    title: toTitleCase(name),
    category: index % 2 === 0 ? 'Required Parts' : 'Safety and Setup',
    reason: `Recommended for ${profile.bikeTypeLabel} builds focused on ${profile.intendedUseLabel}.`,
    required: true,
    measurementNeeded: needsMeasurement,
    estimatedCost: 20 + index * 12,
    recommendedItem: {
      name,
      quantity: 1,
      description: `Starter option for ${profile.bikeTypeLabel}`,
    },
  };
}

function deriveMissingMeasurements(profile) {
  const missing = [];

  if (!profile.riderHeightCm) {
    missing.push('Rider height (cm)');
  }
  if (!profile.wheelSizeIn) {
    missing.push('Wheel size (inches)');
  }
  if (!profile.frameSizeCm) {
    missing.push('Frame size (cm)');
  }

  return missing;
}

function createWarnings(profile, missingMeasurements) {
  const warnings = [];

  if (missingMeasurements.length > 0) {
    warnings.push('Some fit and compatibility checks are provisional until missing measurements are provided.');
  }

  if (profile.bikeType === 'e-bike' && profile.budgetUsd < 500) {
    warnings.push('E-bike builds under $500 often require reused parts or phased upgrades.');
  }

  if (profile.intendedUse === 'downhill' && profile.bikeType === 'road-bike') {
    warnings.push('Road bike geometry is not suitable for downhill use. Consider a mountain-bike frame.');
  }

  if (profile.riderHeightCm && profile.wheelSizeIn && Number(profile.riderHeightCm) < 155 && Number(profile.wheelSizeIn) === 29) {
    warnings.push('29-inch wheels may not fit this rider comfortably. Consider 27.5 wheels and XS/small frame with lower standover.');
  }

  return warnings;
}

export class MockBuildPlannerAIClient {
  async generatePlan(profile) {
    const seedParts = BIKE_BASE_PARTS[profile.bikeType] || BIKE_BASE_PARTS['mountain-bike'];
    const checklist = seedParts.map((part, index) => createChecklistItem(part, index, profile));
    const missingMeasurements = deriveMissingMeasurements(profile);
    const warnings = createWarnings(profile, missingMeasurements);

    return {
      plannerVersion: 'mock-v1',
      provider: 'mock-ai',
      projectSummary: `Plan for ${profile.projectName}: ${profile.bikeTypeLabel} build for ${profile.intendedUseLabel}.`,
      checklist,
      warnings,
      missingMeasurements,
      compatibilityRequests: [
        {
          id: 'wheel-frame-fit',
          title: 'Wheel and Frame Fit',
          requiredMeasurements: ['wheelSizeIn', 'frameSizeCm'],
          guidance: 'Verify wheel diameter and frame clearance before ordering tires and wheelset.',
        },
        {
          id: 'rider-fit',
          title: 'Rider Fit',
          requiredMeasurements: ['riderHeightCm', 'frameSizeCm'],
          guidance: 'Confirm rider standover and reach to avoid unsafe setup.',
        },
        {
          id: 'budget-check',
          title: 'Budget Feasibility',
          requiredMeasurements: ['budgetUsd'],
          guidance: 'Ensure selected components fit total budget with 10% contingency.',
        },
      ],
    };
  }
}

let activeBuildPlannerAIClient = new MockBuildPlannerAIClient();

export function setBuildPlannerAIClient(client) {
  if (!client || typeof client.generatePlan !== 'function') {
    throw new Error('BuildPlanner AI client must implement generatePlan(profile).');
  }
  activeBuildPlannerAIClient = client;
}

export function getBuildPlannerAIClient() {
  return activeBuildPlannerAIClient;
}
