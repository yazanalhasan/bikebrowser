/**
 * Material Database — the foundation of crafting, vehicles, structures,
 * and environment interaction.
 *
 * Every material has a UNIFIED property model (7 domains):
 *   structural  — strength, elasticity, fracture, fatigue
 *   physical    — density, mass per unit, hardness
 *   thermal     — conductivity, expansion, melting/char point
 *   fluid       — viscosity, flowBehavior, surfaceTension, wetting, capillaryFactor
 *   electrical  — conductivity, resistance
 *   chemical    — reactivity, contaminationResistance, bonding
 *   coating     — reflectivity, absorption, coverage, degradationRate
 *
 * All values normalized 0–1 (relative to the strongest known material
 * in each category). This allows direct comparison and combination.
 *
 * Materials come from three sources:
 *   1. Industrial — steel, aluminum, rubber (purchased)
 *   2. Bio-derived — from plant chemistry pipeline (mesquite→carbon, agave→fiber)
 *   3. Composite — emergent from combining materials via materialEngine.js
 *
 * The game's crafting system uses material PROPERTIES, not recipes.
 * Combining metal + polymer doesn't look up a recipe — it blends
 * properties mathematically, producing a composite with emergent behavior.
 */

export const MATERIALS = {
  // ── Metals ──────────────────────────────────────────────────────────────────

  steel: {
    id: 'steel',
    label: 'Steel',
    category: 'metal',
    icon: '🔩',
    source: 'industrial',
    structural: {
      strength: 0.85,
      elasticity: 0.25,
      fracturePoint: 0.80,
      fatigueResistance: 0.70,
    },
    physical: {
      density: 0.80,
      massPerUnit: 7.8,    // g/cm³ (real: 7.8)
      hardness: 0.75,
    },
    thermal: {
      conductivity: 0.50,
      expansion: 0.45,     // thermal expansion coefficient (relative)
      meltingPoint: 0.85,  // ~1500°C
    },
    fluid: {
      viscosity: 0,
      flowBehavior: 'solid',
      surfaceTension: 0.85,
      wetting: 0.3,
      capillaryFactor: 0,
    },
    electrical: {
      conductivity: 0.15,
      resistance: 0.85,
    },
    chemical: {
      reactivity: 0.4,
      contaminationResistance: 0.6,
      bonding: 0.75,
    },
    coating: {
      reflectivity: 0.6,
      absorption: 0.3,
      coverage: 0,
      degradationRate: 0,
    },
    description: 'Strong, heavy, and durable. The standard for structural frames.',
    explanation: 'Steel is an alloy of iron and carbon. The carbon atoms lock into the iron crystal lattice, preventing layers from sliding — that\'s what makes it strong. More carbon = harder but more brittle.',
  },

  aluminum: {
    id: 'aluminum',
    label: 'Aluminum',
    category: 'metal',
    icon: '🪨',
    source: 'industrial',
    structural: {
      strength: 0.55,
      elasticity: 0.35,
      fracturePoint: 0.50,
      fatigueResistance: 0.45,
    },
    physical: {
      density: 0.35,
      massPerUnit: 2.7,
      hardness: 0.40,
    },
    thermal: {
      conductivity: 0.85,
      expansion: 0.65,
      meltingPoint: 0.40,  // ~660°C
    },
    fluid: {
      viscosity: 0,
      flowBehavior: 'solid',
      surfaceTension: 0.75,
      wetting: 0.35,
      capillaryFactor: 0,
    },
    electrical: {
      conductivity: 0.60,
      resistance: 0.40,
    },
    chemical: {
      reactivity: 0.3,
      contaminationResistance: 0.8,  // oxide layer protects
      bonding: 0.6,
    },
    coating: {
      reflectivity: 0.85,
      absorption: 0.15,
      coverage: 0,
      degradationRate: 0,
    },
    description: 'Light and corrosion-resistant. Trades strength for weight savings.',
    explanation: 'Aluminum is 1/3 the density of steel. It forms a natural oxide layer that prevents rust. Great for frames where weight matters, but fatigues faster than steel under repeated stress.',
  },

  copper: {
    id: 'copper',
    label: 'Copper',
    category: 'metal',
    icon: '🟤',
    source: 'industrial',
    structural: {
      strength: 0.35,
      elasticity: 0.45,
      fracturePoint: 0.40,
      fatigueResistance: 0.50,
    },
    physical: {
      density: 0.90,
      massPerUnit: 8.9,
      hardness: 0.30,
    },
    thermal: {
      conductivity: 0.95,
      expansion: 0.55,
      meltingPoint: 0.65,
    },
    fluid: {
      viscosity: 0,
      flowBehavior: 'solid',
      surfaceTension: 0.7,
      wetting: 0.4,
      capillaryFactor: 0,
    },
    electrical: {
      conductivity: 0.95,
      resistance: 0.05,
    },
    chemical: {
      reactivity: 0.5,
      contaminationResistance: 0.4,  // oxidizes (patina)
      bonding: 0.7,
    },
    coating: {
      reflectivity: 0.9,
      absorption: 0.1,
      coverage: 0,
      degradationRate: 0,
    },
    description: 'Excellent electrical and thermal conductor. Too soft for structure.',
    explanation: 'Copper\'s electrons move freely, making it the best practical conductor. Used for wiring, not frames. Its softness is actually an advantage for wiring — it bends without breaking.',
  },

  // ── Polymers ────────────────────────────────────────────────────────────────

  rubber: {
    id: 'rubber',
    label: 'Rubber',
    category: 'polymer',
    icon: '⚫',
    source: 'industrial',
    structural: {
      strength: 0.15,
      elasticity: 0.95,
      fracturePoint: 0.20,
      fatigueResistance: 0.80,
    },
    physical: {
      density: 0.15,
      massPerUnit: 1.2,
      hardness: 0.10,
    },
    thermal: {
      conductivity: 0.03,
      expansion: 0.70,
      meltingPoint: 0.10,  // degrades at ~180°C
    },
    fluid: {
      viscosity: 0.70,
      flowBehavior: 'viscoelastic',
      surfaceTension: 0.3,
      wetting: 0.2,
      capillaryFactor: 0,
    },
    electrical: {
      conductivity: 0.01,
      resistance: 0.99,
    },
    chemical: {
      reactivity: 0.2,
      contaminationResistance: 0.85,  // hydrophobic surface
      bonding: 0.5,
    },
    coating: {
      reflectivity: 0.1,
      absorption: 0.8,
      coverage: 0,
      degradationRate: 0,
    },
    description: 'Extremely flexible and shock-absorbing. Essential for tires and seals.',
    explanation: 'Rubber molecules are long tangled chains that can stretch and snap back. This elasticity absorbs bumps and vibrations. Vulcanization (adding sulfur) cross-links the chains, making rubber tougher.',
  },

  abs_plastic: {
    id: 'abs_plastic',
    label: 'ABS Plastic',
    category: 'polymer',
    icon: '📦',
    source: 'industrial',
    structural: {
      strength: 0.35,
      elasticity: 0.40,
      fracturePoint: 0.30,
      fatigueResistance: 0.55,
    },
    physical: {
      density: 0.15,
      massPerUnit: 1.05,
      hardness: 0.50,
    },
    thermal: {
      conductivity: 0.02,
      expansion: 0.50,
      meltingPoint: 0.15,
    },
    fluid: {
      viscosity: 0,
      flowBehavior: 'solid',
      surfaceTension: 0.5,
      wetting: 0.25,
      capillaryFactor: 0,
    },
    electrical: {
      conductivity: 0.01,
      resistance: 0.99,
    },
    chemical: {
      reactivity: 0.15,
      contaminationResistance: 0.75,
      bonding: 0.55,
    },
    coating: {
      reflectivity: 0.4,
      absorption: 0.5,
      coverage: 0,
      degradationRate: 0,
    },
    description: 'Lightweight, moldable, and impact-resistant. Used for casings and covers.',
    explanation: 'ABS combines three monomers: Acrylonitrile (chemical resistance), Butadiene (toughness), Styrene (rigidity). The blend gives properties none of the three have alone — a man-made composite.',
  },

  // ── Natural / Bio-Derived ───────────────────────────────────────────────────

  mesquite_wood: {
    id: 'mesquite_wood',
    label: 'Mesquite Hardwood',
    category: 'wood',
    icon: '🪵',
    source: 'bio',
    plantSource: 'mesquite',
    structural: {
      strength: 0.55,
      elasticity: 0.45,
      fracturePoint: 0.40,
      fatigueResistance: 0.35,
    },
    physical: {
      density: 0.55,
      massPerUnit: 0.83,
      hardness: 0.65,
    },
    thermal: {
      conductivity: 0.05,
      expansion: 0.15,
      meltingPoint: 0,     // chars, doesn't melt
      charPoint: 0.20,     // ~300°C
    },
    fluid: {
      viscosity: 0,
      flowBehavior: 'solid',
      surfaceTension: 0.6,
      wetting: 0.5,
      capillaryFactor: 0.6,  // wood has capillary channels
    },
    electrical: {
      conductivity: 0.01,
      resistance: 0.99,
    },
    chemical: {
      reactivity: 0.3,
      contaminationResistance: 0.3,
      bonding: 0.5,
    },
    coating: {
      reflectivity: 0.2,
      absorption: 0.7,
      coverage: 0,
      degradationRate: 0,
    },
    description: 'Dense desert hardwood. Burns into excellent carbon for electrodes.',
    explanation: 'Mesquite is one of the hardest woods in North America. Its density comes from tightly packed cellulose and lignin. When carbonized (heated without oxygen), this dense structure becomes porous carbon with enormous surface area.',
  },

  agave_fiber: {
    id: 'agave_fiber',
    label: 'Agave Fiber',
    category: 'fiber',
    icon: '🧵',
    source: 'bio',
    plantSource: 'agave',
    structural: {
      strength: 0.50,
      elasticity: 0.55,
      fracturePoint: 0.35,
      fatigueResistance: 0.40,
    },
    physical: {
      density: 0.20,
      massPerUnit: 0.4,
      hardness: 0.15,
    },
    thermal: {
      conductivity: 0.04,
      expansion: 0.10,
      meltingPoint: 0,
      charPoint: 0.15,
    },
    fluid: {
      viscosity: 0,
      flowBehavior: 'solid',
      surfaceTension: 0.4,
      wetting: 0.7,
      capillaryFactor: 0.8,  // fiber bundles = capillary wicking
    },
    electrical: {
      conductivity: 0.01,
      resistance: 0.99,
    },
    chemical: {
      reactivity: 0.2,
      contaminationResistance: 0.25,
      bonding: 0.65,
    },
    coating: {
      reflectivity: 0.1,
      absorption: 0.85,
      coverage: 0,
      degradationRate: 0,
    },
    description: 'Strong plant fiber for rope, reinforcement, and separator membranes.',
    explanation: 'Agave fibers are bundles of cellulose — the same material as wood but arranged in parallel strands. This gives tensile strength along the fiber direction. Woven fibers create a flexible mat that resists tearing.',
  },

  creosote_resin: {
    id: 'creosote_resin',
    label: 'Creosote Resin',
    category: 'resin',
    icon: '🫗',
    source: 'bio',
    plantSource: 'creosote',
    structural: {
      strength: 0.20,
      elasticity: 0.10,
      fracturePoint: 0.15,
      fatigueResistance: 0.60,
    },
    physical: {
      density: 0.30,
      massPerUnit: 1.1,
      hardness: 0.35,
    },
    thermal: {
      conductivity: 0.03,
      expansion: 0.25,
      meltingPoint: 0.08,
    },
    fluid: {
      viscosity: 0.80,
      flowBehavior: 'thixotropic',
      surfaceTension: 0.25,
      wetting: 0.85,       // spreads easily as coating
      capillaryFactor: 0.3,
    },
    electrical: {
      conductivity: 0.02,
      resistance: 0.98,
    },
    chemical: {
      reactivity: 0.6,
      contaminationResistance: 0.9,  // natural antimicrobial
      bonding: 0.75,
    },
    coating: {
      reflectivity: 0.15,
      absorption: 0.6,
      coverage: 0.85,       // excellent coating material
      degradationRate: 0.01, // very durable
    },
    description: 'Natural waterproofing and insulating resin. Antimicrobial coating.',
    explanation: 'Creosote resin is a complex mix of hydrocarbons and phenolic compounds. It repels water, resists microbes, and insulates electrically. Think of it as nature\'s varnish — protecting whatever it coats.',
  },

  bio_carbon: {
    id: 'bio_carbon',
    label: 'Bio-Carbon (Charcoal)',
    category: 'carbon',
    icon: '⚫',
    source: 'bio',
    plantSource: 'mesquite',
    structural: {
      strength: 0.10,
      elasticity: 0.02,
      fracturePoint: 0.05,
      fatigueResistance: 0.15,
    },
    physical: {
      density: 0.25,
      massPerUnit: 0.5,
      hardness: 0.30,
    },
    thermal: {
      conductivity: 0.15,
      expansion: 0.02,
      meltingPoint: 0.95,  // carbon sublimes at ~3600°C
    },
    fluid: {
      viscosity: 0,
      flowBehavior: 'solid',
      surfaceTension: 0.5,
      wetting: 0.4,
      capillaryFactor: 0.9,  // extreme porosity = capillary action
    },
    electrical: {
      conductivity: 0.35,
      resistance: 0.65,
    },
    chemical: {
      reactivity: 0.5,
      contaminationResistance: 0.5,
      bonding: 0.3,
    },
    coating: {
      reflectivity: 0.05,
      absorption: 0.95,    // absorbs everything
      coverage: 0,
      degradationRate: 0,
    },
    description: 'Porous carbon from pyrolysis. The basis of plant-derived electrodes.',
    explanation: 'Carbonization removes everything except carbon from wood. The remaining porous structure has enormous surface area — essential for electrodes. Carbon\'s electron structure allows it to conduct electricity, unlike most organic materials.',
  },

  cactus_mucilage: {
    id: 'cactus_mucilage',
    label: 'Cactus Mucilage',
    category: 'gel',
    icon: '💧',
    source: 'bio',
    plantSource: 'prickly_pear',
    structural: {
      strength: 0.02,
      elasticity: 0.70,
      fracturePoint: 0.01,
      fatigueResistance: 0.30,
    },
    physical: {
      density: 0.12,
      massPerUnit: 1.02,
      hardness: 0.01,
    },
    thermal: {
      conductivity: 0.20,
      expansion: 0.40,
      meltingPoint: 0.05,
    },
    fluid: {
      viscosity: 0.85,
      flowBehavior: 'shear_thinning',
      surfaceTension: 0.15,  // low = spreads easily
      wetting: 0.9,          // excellent wetting agent
      capillaryFactor: 0.7,
    },
    electrical: {
      conductivity: 0.10,
      resistance: 0.90,
    },
    chemical: {
      reactivity: 0.3,
      contaminationResistance: 0.2,
      bonding: 0.8,          // natural binder
    },
    coating: {
      reflectivity: 0.05,
      absorption: 0.9,
      coverage: 0.6,
      degradationRate: 0.05, // degrades quickly without drying
    },
    description: 'Gel-like cactus secretion. Binder, lubricant, and weak electrolyte.',
    explanation: 'Mucilage is a long-chain polysaccharide that traps water. It\'s shear-thinning: the more you stir, the thinner it gets (opposite of oobleck). Used by cacti to retain moisture, it serves as a natural binder and lubricant.',
  },

  jojoba_wax: {
    id: 'jojoba_wax',
    label: 'Jojoba Liquid Wax',
    category: 'wax',
    icon: '🫗',
    source: 'bio',
    plantSource: 'jojoba',
    structural: {
      strength: 0.02,
      elasticity: 0.15,
      fracturePoint: 0.01,
      fatigueResistance: 0.20,
    },
    physical: {
      density: 0.10,
      massPerUnit: 0.86,
      hardness: 0.02,
    },
    thermal: {
      conductivity: 0.05,
      expansion: 0.30,
      meltingPoint: 0.05,
    },
    fluid: {
      viscosity: 0.40,
      flowBehavior: 'newtonian',
      surfaceTension: 0.2,
      wetting: 0.8,
      capillaryFactor: 0.4,
    },
    electrical: {
      conductivity: 0.01,
      resistance: 0.99,
    },
    chemical: {
      reactivity: 0.1,
      contaminationResistance: 0.8,
      bonding: 0.4,
    },
    coating: {
      reflectivity: 0.3,
      absorption: 0.4,
      coverage: 0.75,        // good coating
      degradationRate: 0.005, // very stable wax
    },
    description: 'Stable liquid wax — moisture barrier, lubricant, and dielectric.',
    explanation: 'Jojoba "oil" is technically a liquid wax ester. Unlike fats, wax esters don\'t go rancid. This chemical stability makes it ideal for long-term lubrication and waterproofing.',
  },

  // ── Desert-Specific ─────────────────────────────────────────────────────────

  desert_clay: {
    id: 'desert_clay',
    label: 'Desert Clay',
    category: 'mineral',
    icon: '🟫',
    source: 'environmental',
    structural: {
      strength: 0.20,
      elasticity: 0.15,
      fracturePoint: 0.10,
      fatigueResistance: 0.10,
    },
    physical: {
      density: 0.45,
      massPerUnit: 1.8,
      hardness: 0.25,
    },
    thermal: {
      conductivity: 0.10,
      expansion: 0.20,
      meltingPoint: 0.60,
    },
    fluid: {
      viscosity: 0.60,
      flowBehavior: 'shear_thickening',
      surfaceTension: 0.6,
      wetting: 0.5,
      capillaryFactor: 0.55,
    },
    electrical: {
      conductivity: 0.05,
      resistance: 0.95,
    },
    chemical: {
      reactivity: 0.35,
      contaminationResistance: 0.15,
      bonding: 0.7,
    },
    coating: {
      reflectivity: 0.2,
      absorption: 0.6,
      coverage: 0.5,
      degradationRate: 0.03,
    },
    description: 'Desert clay — becomes non-Newtonian when mixed with organic secretions.',
    explanation: 'Clay particles are flat platelets. When mixed with water and organic polymers (plant secretions), they form a suspension that thickens under force — the oobleck effect. This is shear thickening: cornstarch + water behaves the same way.',
  },

  potassium_ash: {
    id: 'potassium_ash',
    label: 'Potassium Ash',
    category: 'mineral',
    icon: '⬜',
    source: 'bio',
    plantSource: 'mesquite',
    structural: {
      strength: 0.01,
      elasticity: 0.01,
      fracturePoint: 0.01,
      fatigueResistance: 0.01,
    },
    physical: {
      density: 0.30,
      massPerUnit: 2.3,
      hardness: 0.10,
    },
    thermal: {
      conductivity: 0.08,
      expansion: 0.10,
      meltingPoint: 0.55,
    },
    fluid: {
      viscosity: 0.10,
      flowBehavior: 'soluble',
      surfaceTension: 0.45,
      wetting: 0.6,
      capillaryFactor: 0.2,
    },
    electrical: {
      conductivity: 0.50,
      resistance: 0.50,
    },
    chemical: {
      reactivity: 0.7,
      contaminationResistance: 0.1,
      bonding: 0.2,
    },
    coating: {
      reflectivity: 0.7,
      absorption: 0.2,
      coverage: 0,
      degradationRate: 0,
    },
    description: 'Mineral ash from burned mesquite. Dissolves into electrolyte solution.',
    explanation: 'Wood ash is rich in potassium carbonate (K₂CO₃). When dissolved, it splits into K⁺ and CO₃²⁻ ions — free charge carriers. This is the basis of plant-derived electrolytes.',
  },

  // ── Surfactant / Coating Materials ──────────────────────────────────────────

  yucca_surfactant: {
    id: 'yucca_surfactant',
    label: 'Yucca Surfactant',
    category: 'surfactant',
    icon: '🧴',
    source: 'bio',
    plantSource: 'yucca',
    structural: { strength: 0, elasticity: 0, fracturePoint: 0, fatigueResistance: 0 },
    physical: { density: 0.12, massPerUnit: 1.01, hardness: 0 },
    thermal: { conductivity: 0.15, expansion: 0.3, meltingPoint: 0.05 },
    fluid: {
      viscosity: 0.3,
      flowBehavior: 'newtonian',
      surfaceTension: 0.05,  // KEY: dramatically lowers surface tension
      wetting: 0.95,         // KEY: maximum wetting
      capillaryFactor: 0.1,
    },
    electrical: { conductivity: 0.05, resistance: 0.95 },
    chemical: {
      reactivity: 0.6,
      contaminationResistance: 0.3,
      bonding: 0.3,
    },
    coating: {
      reflectivity: 0.05,
      absorption: 0.7,
      coverage: 0.4,
      degradationRate: 0.08,
    },
    description: 'Natural soap from yucca root. Drastically reduces surface tension.',
    explanation: 'Saponins are amphiphilic molecules: one end loves water, the other hates it. At a water-oil interface, they wedge between layers, breaking surface tension. This is how soap works — and why yucca root was used for thousands of years as a cleaning agent.',
  },

  protective_coating: {
    id: 'protective_coating',
    label: 'Resin-Wax Protective Coat',
    category: 'coating',
    icon: '🛡️',
    source: 'crafted',
    structural: { strength: 0.05, elasticity: 0.3, fracturePoint: 0.03, fatigueResistance: 0.4 },
    physical: { density: 0.15, massPerUnit: 0.9, hardness: 0.2 },
    thermal: { conductivity: 0.03, expansion: 0.2, meltingPoint: 0.08 },
    fluid: {
      viscosity: 0.6,
      flowBehavior: 'thixotropic',
      surfaceTension: 0.2,
      wetting: 0.85,
      capillaryFactor: 0.2,
    },
    electrical: { conductivity: 0.01, resistance: 0.99 },
    chemical: {
      reactivity: 0.1,
      contaminationResistance: 0.9,
      bonding: 0.7,
    },
    coating: {
      reflectivity: 0.4,
      absorption: 0.3,
      coverage: 0.9,         // excellent coverage
      degradationRate: 0.008, // slow degradation
    },
    description: 'Composite coating of creosote resin + jojoba wax. Protects from heat, UV, and moisture.',
    explanation: 'This coating combines resin (adhesion, antimicrobial) with wax (moisture barrier, UV reflection). The resin bonds to the surface while wax creates a hydrophobic outer layer. Together they protect better than either alone.',
  },
};

/** Lookup material by id. */
export const MATERIAL_MAP = Object.fromEntries(
  Object.entries(MATERIALS).map(([key, mat]) => [key, mat])
);

/** Get all materials from a given source. */
export function getMaterialsBySource(source) {
  return Object.values(MATERIALS).filter((m) => m.source === source);
}

/** Get all materials in a category. */
export function getMaterialsByCategory(category) {
  return Object.values(MATERIALS).filter((m) => m.category === category);
}

/** Get materials derived from a plant. */
export function getMaterialsFromPlant(plantId) {
  return Object.values(MATERIALS).filter((m) => m.plantSource === plantId);
}

/** Get a specific property value, or 0 if missing. */
export function getProperty(materialId, domain, property) {
  const mat = MATERIALS[materialId];
  if (!mat) return 0;
  return mat[domain]?.[property] ?? 0;
}
