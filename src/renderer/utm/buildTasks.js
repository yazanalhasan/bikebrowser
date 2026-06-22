// Build tasks the tested material is rated against. Thresholds are expressed on
// the game's relative 0–10 stress scale (same scale as material.UTS /
// material.yieldStrength from act1Materials), so the suitability check stays
// consistent with the existing curriculum.
export const BUILD_TASKS = {
  bridgeDeck: {
    id: 'bridgeDeck',
    name: 'Bridge Deck',
    minYieldStrength: 3.5,
    minUTS: 5,
    emphasis: 'tension',
    blurb: 'Must carry pedestrians and bikes in bending without cracking.',
  },
  suspensionCable: {
    id: 'suspensionCable',
    name: 'Suspension Cable',
    minYieldStrength: 5.5,
    minUTS: 8,
    emphasis: 'tension',
    blurb: 'Pure tension member — needs very high pull strength.',
  },
  compressionColumn: {
    id: 'compressionColumn',
    name: 'Compression Column',
    minYieldStrength: 3,
    minUTS: 4.5,
    emphasis: 'compression',
    blurb: 'Carries squeezing load; stiffness matters as much as strength.',
  },
};

export const DEFAULT_BUILD_TASK = BUILD_TASKS.suspensionCable;
export const listBuildTasks = () => Object.values(BUILD_TASKS);
