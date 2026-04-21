/**
 * Plant Chemistry Data — property-based plant definitions for the
 * chemistry→battery pipeline.
 *
 * Each plant has:
 *   - harvestable parts (fiber, sap, resin, wood, fruit, root)
 *   - chemical compounds present in each part
 *   - numeric properties that drive system behavior
 *
 * Properties flow through the pipeline:
 *   plant.part.property → extractedChemical.property → refinedMaterial.property
 *                       → batteryComponent.performance → simulation.result
 *
 * Nothing is recipe-based. Performance emerges from properties.
 */

// ── Plant Definitions ────────────────────────────────────────────────────────

export const PLANTS = {
  agave: {
    id: 'agave',
    name: 'Agave',
    biome: 'sonoran_desert',
    icon: '🌱',
    parts: {
      fiber: {
        id: 'agave_fiber',
        label: 'Agave Fiber',
        chemistry: ['cellulose', 'lignin'],
        properties: {
          fiber_strength: 0.85,
          tensile_modulus: 0.7,
          flexibility: 0.6,
          water_content: 0.15,
          density: 0.4,
        },
        harvestYield: 3,
        description: 'Strong plant fiber — tough enough for rope, mats, and structural reinforcement.',
      },
      sap: {
        id: 'agave_sap',
        label: 'Agave Sap',
        chemistry: ['fructans', 'saponins', 'organic_acids'],
        properties: {
          sugar_content: 0.7,
          viscosity: 0.6,
          water_content: 0.8,
          mineral_content: 0.15,
          pH: 5.5,
        },
        harvestYield: 2,
        description: 'Sweet sap with organic compounds. Fermentable and mildly acidic.',
      },
    },
  },

  creosote: {
    id: 'creosote',
    name: 'Creosote Bush',
    biome: 'desert_scrub',
    icon: '🌿',
    parts: {
      resin: {
        id: 'creosote_resin',
        label: 'Creosote Resin',
        chemistry: ['nordihydroguaiaretic_acid', 'hydrocarbons', 'phenolic_compounds'],
        properties: {
          resin_content: 0.9,
          viscosity: 0.8,
          hydrophobicity: 0.85,
          thermal_stability: 0.7,
          dielectric_strength: 0.65,
          toxicity: 0.3,
        },
        harvestYield: 2,
        description: 'Aromatic resin — water-repellent, insulating, and antimicrobial.',
      },
      leaves: {
        id: 'creosote_leaves',
        label: 'Creosote Leaves',
        chemistry: ['volatile_oils', 'waxes', 'phenols'],
        properties: {
          oil_content: 0.4,
          water_content: 0.2,
          resin_content: 0.3,
          mineral_content: 0.1,
        },
        harvestYield: 4,
        description: 'Fragrant leaves coated in protective resin.',
      },
    },
  },

  yucca: {
    id: 'yucca',
    name: 'Yucca',
    biome: 'sonoran_desert',
    icon: '🌴',
    parts: {
      fiber: {
        id: 'yucca_fiber',
        label: 'Yucca Fiber',
        chemistry: ['cellulose', 'hemicellulose'],
        properties: {
          fiber_strength: 0.75,
          tensile_modulus: 0.65,
          flexibility: 0.7,
          water_content: 0.2,
          porosity: 0.6,
        },
        harvestYield: 3,
        description: 'Flexible fiber excellent for weaving and filtration.',
      },
      root: {
        id: 'yucca_root',
        label: 'Yucca Root',
        chemistry: ['saponins', 'steroidal_compounds'],
        properties: {
          saponin_content: 0.8,
          surfactant_strength: 0.75,
          water_content: 0.5,
          foaming_capacity: 0.7,
        },
        harvestYield: 1,
        description: 'Rich in saponins — natural soap for cleaning and surfactant extraction.',
      },
    },
  },

  mesquite: {
    id: 'mesquite',
    name: 'Mesquite',
    biome: 'desert_scrub',
    icon: '🌳',
    parts: {
      wood: {
        id: 'mesquite_wood',
        label: 'Mesquite Wood',
        chemistry: ['cellulose', 'lignin', 'carbon_compounds'],
        properties: {
          carbon_content: 0.75,
          density: 0.85,
          hardness: 0.8,
          thermal_stability: 0.6,
          ash_mineral_content: 0.35,
        },
        harvestYield: 2,
        description: 'Dense hardwood — excellent carbon source when charred.',
      },
      ash: {
        id: 'mesquite_ash',
        label: 'Mesquite Ash',
        chemistry: ['potassium_carbonate', 'calcium_compounds', 'trace_minerals'],
        properties: {
          mineral_content: 0.9,
          potassium_content: 0.45,
          alkalinity: 0.8,
          solubility: 0.7,
          conductivity_potential: 0.5,
        },
        harvestYield: 1,
        description: 'Mineral-rich ash — source of potassium for electrolyte production.',
        requiresProcessing: 'burning', // must burn wood first
      },
      pods: {
        id: 'mesquite_pods',
        label: 'Mesquite Pods',
        chemistry: ['sugars', 'protein', 'fiber'],
        properties: {
          sugar_content: 0.6,
          protein_content: 0.15,
          water_content: 0.1,
        },
        harvestYield: 3,
        description: 'Nutritious pods — food source, not chemistry material.',
      },
    },
  },

  barrel_cactus: {
    id: 'barrel_cactus',
    name: 'Barrel Cactus',
    biome: 'sonoran_desert',
    icon: '🌵',
    parts: {
      pulp: {
        id: 'cactus_pulp',
        label: 'Cactus Pulp',
        chemistry: ['organic_acids', 'mucilage', 'electrolyte_minerals'],
        properties: {
          water_content: 0.85,
          mineral_content: 0.25,
          conductivity_potential: 0.3,
          pH: 4.5,
          viscosity: 0.5,
        },
        harvestYield: 2,
        description: 'Watery pulp with dissolved minerals — weak natural electrolyte.',
      },
    },
  },

  prickly_pear: {
    id: 'prickly_pear',
    name: 'Prickly Pear',
    biome: 'desert_scrub',
    icon: '🌵',
    parts: {
      fruit: {
        id: 'prickly_pear_fruit',
        label: 'Prickly Pear Fruit',
        chemistry: ['betalains', 'organic_acids', 'sugars', 'trace_minerals'],
        properties: {
          water_content: 0.8,
          sugar_content: 0.5,
          mineral_content: 0.2,
          conductivity_potential: 0.25,
          pH: 5.0,
        },
        harvestYield: 2,
        description: 'Sweet fruit with trace minerals — mild electrolyte source.',
      },
      pads: {
        id: 'prickly_pear_pads',
        label: 'Prickly Pear Pads',
        chemistry: ['mucilage', 'cellulose', 'organic_acids'],
        properties: {
          water_content: 0.9,
          mucilage_content: 0.4,
          fiber_strength: 0.3,
          viscosity: 0.6,
        },
        harvestYield: 3,
        description: 'Mucilaginous pads — gel-like substance useful as binder.',
      },
    },
  },

  jojoba: {
    id: 'jojoba',
    name: 'Jojoba',
    biome: 'chaparral',
    icon: '🫒',
    parts: {
      seeds: {
        id: 'jojoba_seeds',
        label: 'Jojoba Seeds',
        chemistry: ['wax_esters', 'fatty_acids'],
        properties: {
          oil_content: 0.85,
          viscosity: 0.5,
          thermal_stability: 0.75,
          hydrophobicity: 0.8,
          dielectric_strength: 0.5,
        },
        harvestYield: 2,
        description: 'Liquid wax — stable oil with insulating properties.',
      },
    },
  },
};

// ── Chemical Compound Definitions ────────────────────────────────────────────

/**
 * Properties of extractable chemical compounds.
 * These define what each compound can become when refined.
 */
export const COMPOUNDS = {
  cellulose: {
    id: 'cellulose',
    label: 'Cellulose',
    category: 'structural',
    baseProperties: {
      fiber_strength: 0.7,
      porosity: 0.5,
      thermal_stability: 0.4,
      carbonizable: true,
    },
    description: 'Plant cell wall material. Strong fiber, can be carbonized into electrode material.',
  },
  lignin: {
    id: 'lignin',
    label: 'Lignin',
    category: 'structural',
    baseProperties: {
      hardness: 0.8,
      carbon_content: 0.65,
      thermal_stability: 0.5,
      carbonizable: true,
    },
    description: 'Binding polymer in wood. High carbon content — good for electrodes when charred.',
  },
  potassium_carbonate: {
    id: 'potassium_carbonate',
    label: 'Potassium Carbonate (K₂CO₃)',
    category: 'ionic',
    baseProperties: {
      solubility: 0.85,
      conductivity_potential: 0.65,
      alkalinity: 0.9,
      stability: 0.7,
    },
    description: 'Ionic salt from wood ash. Dissolves in water to create conductive electrolyte.',
  },
  organic_acids: {
    id: 'organic_acids',
    label: 'Organic Acids',
    category: 'ionic',
    baseProperties: {
      conductivity_potential: 0.35,
      pH: 4.0,
      stability: 0.5,
      reactivity: 0.6,
    },
    description: 'Weak acids from fruit and pulp. Mildly conductive when dissolved.',
  },
  electrolyte_minerals: {
    id: 'electrolyte_minerals',
    label: 'Electrolyte Minerals',
    category: 'ionic',
    baseProperties: {
      conductivity_potential: 0.4,
      solubility: 0.6,
      stability: 0.6,
    },
    description: 'Dissolved mineral salts. Carry charge when in solution.',
  },
  hydrocarbons: {
    id: 'hydrocarbons',
    label: 'Hydrocarbons',
    category: 'organic',
    baseProperties: {
      hydrophobicity: 0.9,
      dielectric_strength: 0.7,
      viscosity: 0.6,
      thermal_stability: 0.5,
    },
    description: 'Non-polar organic compounds. Excellent electrical insulators.',
  },
  phenolic_compounds: {
    id: 'phenolic_compounds',
    label: 'Phenolic Compounds',
    category: 'organic',
    baseProperties: {
      antioxidant: 0.8,
      thermal_stability: 0.65,
      dielectric_strength: 0.55,
    },
    description: 'Aromatic ring compounds. Thermally stable, useful in resin formulations.',
  },
  saponins: {
    id: 'saponins',
    label: 'Saponins',
    category: 'surfactant',
    baseProperties: {
      surfactant_strength: 0.8,
      foaming_capacity: 0.75,
      solubility: 0.7,
      wetting_ability: 0.8,
    },
    description: 'Natural surfactants — reduce surface tension. Help electrolyte wet electrode surfaces.',
  },
  wax_esters: {
    id: 'wax_esters',
    label: 'Wax Esters',
    category: 'organic',
    baseProperties: {
      hydrophobicity: 0.85,
      thermal_stability: 0.7,
      dielectric_strength: 0.6,
      viscosity: 0.4,
    },
    description: 'Liquid wax — moisture barrier and electrical insulator.',
  },
  mucilage: {
    id: 'mucilage',
    label: 'Mucilage',
    category: 'binder',
    baseProperties: {
      viscosity: 0.8,
      adhesion: 0.7,
      water_retention: 0.85,
      porosity: 0.3,
    },
    description: 'Gel-like plant substance — binder and separator material.',
  },
};

/**
 * Get plant by id.
 */
export function getPlant(plantId) {
  return PLANTS[plantId] || null;
}

/**
 * Get all harvestable parts for a plant.
 */
export function getHarvestableParts(plantId) {
  const plant = PLANTS[plantId];
  if (!plant) return [];
  return Object.entries(plant.parts).map(([key, part]) => ({
    partKey: key,
    ...part,
    plantId,
    plantName: plant.name,
  }));
}

/**
 * Get compound definition.
 */
export function getCompound(compoundId) {
  return COMPOUNDS[compoundId] || null;
}

/**
 * Get all plants that contain a specific compound.
 */
export function getPlantsWithCompound(compoundId) {
  const results = [];
  for (const [plantId, plant] of Object.entries(PLANTS)) {
    for (const [partKey, part] of Object.entries(plant.parts)) {
      if (part.chemistry.includes(compoundId)) {
        results.push({ plantId, plantName: plant.name, partKey, part });
      }
    }
  }
  return results;
}
