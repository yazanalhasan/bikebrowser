export const act1Materials = [
  {
    id: 'balsa',
    name: 'Balsa',
    displayName: 'Balsa',
    strength: 2,
    stiffness: 2,
    weight: 1,
    failureMode: 'Crushes, buckles, then splits along the grain.',
    curve: { elasticLimit: 0.035, ultimateStress: 2, strainAtFailure: 0.12 },
    notes: {
      compression: 'Very light, but columns crush and buckle early under compression.',
      tension: 'Can take a little pull along the grain, then tears suddenly.',
    },
    bestUse: 'light model panels',
    bridgeUsefulness: 0.22,
    childReadableDescription: 'Balsa is extremely light, but the UTM shows it gives up early under real load.',
  },
  {
    id: 'pine',
    name: 'Pine',
    displayName: 'Pine',
    strength: 4,
    stiffness: 4,
    weight: 3,
    failureMode: 'Bends first, then cracks along knots or grain.',
    curve: { elasticLimit: 0.055, ultimateStress: 4, strainAtFailure: 0.16 },
    notes: {
      compression: 'Useful in short blocks, but long pieces can buckle.',
      tension: 'Fibers pull for a while before a crack runs along the grain.',
    },
    bestUse: 'temporary deck planks',
    bridgeUsefulness: 0.56,
    childReadableDescription: 'Pine is a useful wood with limits: it bends before it breaks, which gives warning.',
  },
  {
    id: 'bamboo',
    name: 'Bamboo',
    displayName: 'Bamboo',
    strength: 6,
    stiffness: 5,
    weight: 2,
    failureMode: 'Flexes, then splits lengthwise if overloaded.',
    curve: { elasticLimit: 0.075, ultimateStress: 6, strainAtFailure: 0.20 },
    notes: {
      compression: 'Strong for its weight, especially in short braced pieces.',
      tension: 'Long fibers carry pulling loads well before splitting.',
    },
    bestUse: 'light deck and braces',
    bridgeUsefulness: 0.78,
    childReadableDescription: 'Bamboo is light and strong for its size, so its curve rises higher than ordinary wood.',
  },
  {
    id: 'brick',
    name: 'Brick',
    displayName: 'Brick',
    strength: 5,
    stiffness: 7,
    weight: 8,
    failureMode: 'Cracks suddenly instead of bending.',
    curve: { elasticLimit: 0.018, ultimateStress: 5, strainAtFailure: 0.028 },
    notes: {
      compression: 'Good when squeezed evenly in a wall or pier.',
      tension: 'Weak in pulling or bending; cracks appear quickly.',
    },
    bestUse: 'stacked compression pier',
    bridgeUsefulness: 0.42,
    childReadableDescription: 'Brick can carry squeezing force, but the UTM shows it is brittle when bent or pulled.',
  },
  {
    id: 'concrete',
    name: 'Concrete',
    displayName: 'Concrete',
    strength: 6,
    stiffness: 8,
    weight: 9,
    failureMode: 'Holds compression, but opens cracks on the tension side.',
    curve: { elasticLimit: 0.016, ultimateStress: 6, strainAtFailure: 0.032 },
    notes: {
      compression: 'The teaching outlier: very strong when squeezed.',
      tension: 'Weak when pulled, so bridge beams need help from rebar or a different material.',
    },
    bestUse: 'compression footing',
    bridgeUsefulness: 0.48,
    childReadableDescription: 'Concrete is strong in compression and weak in tension, so one number cannot tell the whole story.',
  },
  {
    id: 'iron',
    name: 'Iron',
    displayName: 'Iron',
    strength: 7,
    stiffness: 7,
    weight: 8,
    failureMode: 'Yields a little, then fractures if the load keeps rising.',
    curve: { elasticLimit: 0.06, ultimateStress: 7, strainAtFailure: 0.14 },
    notes: {
      compression: 'Strong under squeezing, but heavy for small builds.',
      tension: 'Carries pull well, though it can rust and is less forgiving than steel.',
    },
    bestUse: 'short support post',
    bridgeUsefulness: 0.74,
    childReadableDescription: 'Iron is strong but heavy; its curve rises high, then fails after a smaller stretch than steel.',
  },
  {
    id: 'steel',
    name: 'Steel',
    displayName: 'Steel',
    strength: 9,
    stiffness: 8,
    weight: 8,
    failureMode: 'Yields before breaking, giving visible warning.',
    curve: { elasticLimit: 0.085, ultimateStress: 9, strainAtFailure: 0.24 },
    notes: {
      compression: 'Excellent for columns and supports when buckling is controlled.',
      tension: 'Excellent in pull; it stretches before failure instead of snapping suddenly.',
    },
    bestUse: 'main support',
    bridgeUsefulness: 0.94,
    childReadableDescription: 'Steel is heavy but reliable: it carries high loads and gives warning before failure.',
  },
  {
    id: 'carbon_fiber',
    name: 'Carbon Fiber',
    displayName: 'Carbon Fiber',
    strength: 10,
    stiffness: 9,
    weight: 2,
    failureMode: 'Stays stiff, then splinters or delaminates suddenly.',
    curve: { elasticLimit: 0.07, ultimateStress: 10, strainAtFailure: 0.09 },
    notes: {
      compression: 'Very stiff and light, but layers can buckle or delaminate if loaded wrong.',
      tension: 'Extremely strong along the fibers, with little warning before failure.',
    },
    bestUse: 'high-performance tension member',
    bridgeUsefulness: 0.9,
    childReadableDescription: 'Carbon fiber is very strong and light, but its brittle failure means the curve drops fast.',
  },
].map((material) => {
  const tensionStrength = material.id === 'concrete' || material.id === 'brick'
    ? Number((material.strength * 0.45).toFixed(2))
    : material.strength;
  const compressionStrength = material.id === 'concrete'
    ? 9.5
    : material.id === 'brick'
      ? 7.8
      : material.id === 'balsa'
        ? 1.7
        : material.strength;
  return {
    ...material,
    compressionStrength,
    tensionStrength,
    density: material.weight / 10,
    tensileStrength: Number((tensionStrength / 10).toFixed(2)),
    compressiveStrength: Number((compressionStrength / 10).toFixed(2)),
    elasticity: Number((material.stiffness / 10).toFixed(2)),
    brittleness: Number(Math.max(0.12, Math.min(0.9, 1 - material.curve.strainAtFailure / 0.24)).toFixed(2)),
    thermalTolerance: material.id === 'balsa' ? 0.25 : material.id === 'pine' ? 0.35 : material.id === 'bamboo' ? 0.42 : 0.76,
    corrosionResistance: material.id === 'steel' || material.id === 'iron' ? 0.42 : 0.72,
    costAvailability: material.id === 'carbon_fiber' ? 0.2 : material.id === 'steel' || material.id === 'iron' ? 0.46 : 0.72,
  };
});

