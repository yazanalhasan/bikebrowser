/**
 * Biology Data — molecular biology definitions integrated into
 * the unified progression pipeline.
 *
 * Pipeline position:
 *   🌿 Plants → 🧬 Biology → ⚗️ Chemistry → 🔋 Energy → ⚙️ Engineering
 *
 * Biology adds a new extraction tier: instead of just extracting
 * chemical compounds from plant matter, the player can extract
 * biological molecules (DNA, RNA, protein) and engineer organisms
 * that produce chemicals at scale.
 *
 * Everything is property-based. Outcomes emerge from numeric properties,
 * not from fixed recipes.
 */

// ── Sample Sources ───────────────────────────────────────────────────────────

/**
 * Biological sample sources — where the player collects living material.
 * Links to existing plant/ecology systems via sourceLink.
 */
export const SAMPLE_SOURCES = {
  agave_tissue: {
    id: 'agave_tissue',
    label: 'Agave Leaf Tissue',
    sourceType: 'plant',
    sourceLink: 'agave',           // links to plantChemistry.js
    biome: 'sonoran_desert',
    icon: '🌱',
    properties: {
      cell_density: 0.6,
      dna_yield: 0.5,
      rna_yield: 0.4,
      protein_yield: 0.7,          // fibrous plants = high structural protein
      contamination_risk: 0.1,
      degradation_rate: 0.02,      // per game-minute
    },
    extractableGenes: ['cellulose_synthase', 'stress_tolerance'],
    description: 'Living agave cells. High protein content from structural fibers. Low contamination in desert conditions.',
  },
  cactus_tissue: {
    id: 'cactus_tissue',
    label: 'Cactus Stem Tissue',
    sourceType: 'plant',
    sourceLink: 'barrel_cactus',
    biome: 'sonoran_desert',
    icon: '🌵',
    properties: {
      cell_density: 0.5,
      dna_yield: 0.4,
      rna_yield: 0.3,
      protein_yield: 0.5,
      contamination_risk: 0.15,
      degradation_rate: 0.03,
      water_content: 0.85,
      electrolyte_potential: 0.3,  // links to chemistry pipeline
    },
    extractableGenes: ['water_retention', 'ion_transport'],
    description: 'Cactus cells packed with water and dissolved minerals. The ion transport genes are useful for electrolyte production.',
  },
  mesquite_cambium: {
    id: 'mesquite_cambium',
    label: 'Mesquite Cambium',
    sourceType: 'plant',
    sourceLink: 'mesquite',
    biome: 'desert_scrub',
    icon: '🌳',
    properties: {
      cell_density: 0.7,
      dna_yield: 0.6,
      rna_yield: 0.5,
      protein_yield: 0.4,
      contamination_risk: 0.2,
      degradation_rate: 0.025,
      carbon_content: 0.6,        // links to electrode carbon pipeline
    },
    extractableGenes: ['lignin_synthesis', 'carbon_fixation'],
    description: 'Active growth tissue from mesquite bark. Contains genes for wood and carbon compound production.',
  },
  soil_bacteria: {
    id: 'soil_bacteria',
    label: 'Desert Soil Bacteria',
    sourceType: 'bacteria',
    sourceLink: null,              // environmental, not from a specific plant
    biome: 'desert_scrub',
    icon: '🦠',
    properties: {
      cell_density: 0.9,
      dna_yield: 0.7,
      rna_yield: 0.6,
      protein_yield: 0.5,
      contamination_risk: 0.4,    // soil = mixed microbial community
      degradation_rate: 0.01,     // bacteria are hardy
      growth_rate: 0.8,
      doubling_time: 0.5,        // fast replication
    },
    extractableGenes: ['metal_reduction', 'acid_production', 'biofilm_formation'],
    description: 'Hardy desert bacteria. Fast-growing, easy to culture. High contamination risk from mixed soil communities. Metal reduction genes can produce conductive biofilms.',
  },
  yeast_culture: {
    id: 'yeast_culture',
    label: 'Wild Yeast Culture',
    sourceType: 'yeast',
    sourceLink: null,
    biome: 'riparian',
    icon: '🍞',
    properties: {
      cell_density: 0.8,
      dna_yield: 0.65,
      rna_yield: 0.55,
      protein_yield: 0.6,
      contamination_risk: 0.25,
      degradation_rate: 0.015,
      growth_rate: 0.6,
      doubling_time: 0.7,
      fermentation_capacity: 0.7,
      protein_expression: 0.65,   // yeast is good at making proteins
    },
    extractableGenes: ['fermentation_pathway', 'protein_secretion', 'stress_response'],
    description: 'Eukaryotic yeast — more complex than bacteria. Excellent protein expression system. Can ferment sugars into useful chemicals.',
  },
  fruit_fly: {
    id: 'fruit_fly',
    label: 'Desert Fruit Fly',
    sourceType: 'insect',
    sourceLink: null,
    biome: 'sonoran_desert',
    icon: '🪰',
    properties: {
      cell_density: 0.4,
      dna_yield: 0.8,
      rna_yield: 0.7,
      protein_yield: 0.6,
      contamination_risk: 0.3,
      degradation_rate: 0.04,     // insect tissue degrades faster
      genome_complexity: 0.9,     // multicellular = complex genome
      tissue_types: 0.8,          // diverse cell types
    },
    extractableGenes: ['chitin_production', 'silk_protein', 'developmental_genes'],
    description: 'Multicellular organism with complex genetics. Chitin and silk protein genes produce strong structural materials. Advanced genetic engineering target.',
  },
};

// ── Gene Definitions ─────────────────────────────────────────────────────────

/**
 * Genes that can be extracted, studied, and engineered.
 * Each gene produces a specific protein with measurable properties.
 * Properties feed into chemistry/battery/engineering pipelines.
 */
export const GENES = {
  // ── Plant genes ─────────────────────────────────────────────────
  cellulose_synthase: {
    id: 'cellulose_synthase',
    label: 'Cellulose Synthase',
    category: 'structural',
    icon: '🧬',
    source: 'agave_tissue',
    protein: 'cellulose_synthase_protein',
    properties: {
      sequence_length: 0.6,       // moderate gene
      stability: 0.8,
      expression_difficulty: 0.3, // easy to express
    },
    proteinProperties: {
      fiber_strength: 0.85,
      structural_integrity: 0.8,
      function: 'produces_cellulose',
    },
    description: 'Encodes the enzyme that builds cellulose fibers. When expressed in bacteria, produces strong structural material for separators.',
    engineeringUse: 'Produces cellulose fiber → battery separator material',
  },
  stress_tolerance: {
    id: 'stress_tolerance',
    label: 'Stress Tolerance Factor',
    category: 'regulatory',
    icon: '🛡️',
    source: 'agave_tissue',
    protein: 'stress_protein',
    properties: {
      sequence_length: 0.4,
      stability: 0.9,
      expression_difficulty: 0.2,
    },
    proteinProperties: {
      thermal_stability: 0.85,
      chemical_resistance: 0.7,
      function: 'stabilizes_other_proteins',
    },
    description: 'Desert plant survival gene. The protein stabilizes other molecules under heat stress — useful for improving battery thermal resistance.',
    engineeringUse: 'Improves thermal stability of bio-derived materials',
  },
  water_retention: {
    id: 'water_retention',
    label: 'Aquaporin Gene',
    category: 'transport',
    icon: '💧',
    source: 'cactus_tissue',
    protein: 'aquaporin_protein',
    properties: {
      sequence_length: 0.3,
      stability: 0.7,
      expression_difficulty: 0.4,
    },
    proteinProperties: {
      ion_selectivity: 0.6,
      transport_rate: 0.7,
      function: 'selective_ion_transport',
    },
    description: 'Controls water and ion movement across cell membranes. The protein creates channels that can improve electrolyte ion flow.',
    engineeringUse: 'Improves electrolyte ion transport efficiency',
  },
  ion_transport: {
    id: 'ion_transport',
    label: 'Ion Channel Gene',
    category: 'transport',
    icon: '⚡',
    source: 'cactus_tissue',
    protein: 'ion_channel_protein',
    properties: {
      sequence_length: 0.5,
      stability: 0.65,
      expression_difficulty: 0.5,
    },
    proteinProperties: {
      conductivity_boost: 0.4,
      ion_selectivity: 0.8,
      transport_rate: 0.85,
      function: 'enhances_conductivity',
    },
    description: 'Encodes an ion channel — a protein tube that lets specific ions pass rapidly. When added to electrolyte, it dramatically improves conductivity.',
    engineeringUse: 'Bio-enhanced electrolyte with higher conductivity',
  },

  // ── Carbon/wood genes ───────────────────────────────────────────
  lignin_synthesis: {
    id: 'lignin_synthesis',
    label: 'Lignin Synthase',
    category: 'structural',
    icon: '🪵',
    source: 'mesquite_cambium',
    protein: 'lignin_synthase_protein',
    properties: {
      sequence_length: 0.7,
      stability: 0.75,
      expression_difficulty: 0.5,
    },
    proteinProperties: {
      carbon_density: 0.8,
      structural_integrity: 0.85,
      function: 'produces_high_carbon_polymer',
    },
    description: 'Produces lignin — a carbon-rich polymer. When carbonized, this creates electrode material with exceptional surface area.',
    engineeringUse: 'Produces precursor for high-quality carbon electrodes',
  },
  carbon_fixation: {
    id: 'carbon_fixation',
    label: 'Carbon Fixation Enzyme',
    category: 'metabolic',
    icon: '⚫',
    source: 'mesquite_cambium',
    protein: 'rubisco_analog',
    properties: {
      sequence_length: 0.8,
      stability: 0.6,
      expression_difficulty: 0.6,
    },
    proteinProperties: {
      carbon_capture_rate: 0.7,
      efficiency: 0.5,
      function: 'converts_co2_to_organic_carbon',
    },
    description: 'Captures CO₂ and converts it into organic carbon compounds. The fundamental engine of photosynthesis.',
    engineeringUse: 'Bio-carbon production for electrode materials',
  },

  // ── Bacterial genes ─────────────────────────────────────────────
  metal_reduction: {
    id: 'metal_reduction',
    label: 'Metal Reductase',
    category: 'metabolic',
    icon: '🔩',
    source: 'soil_bacteria',
    protein: 'metal_reductase_protein',
    properties: {
      sequence_length: 0.5,
      stability: 0.7,
      expression_difficulty: 0.4,
    },
    proteinProperties: {
      conductivity_generation: 0.6,
      metal_binding: 0.75,
      function: 'creates_conductive_deposits',
    },
    description: 'Some bacteria deposit metal nanoparticles as part of their metabolism. This creates naturally conductive surfaces — living electrodes.',
    engineeringUse: 'Bio-conductive electrode coating',
  },
  acid_production: {
    id: 'acid_production',
    label: 'Organic Acid Pathway',
    category: 'metabolic',
    icon: '🧪',
    source: 'soil_bacteria',
    protein: 'acid_synthase',
    properties: {
      sequence_length: 0.6,
      stability: 0.65,
      expression_difficulty: 0.45,
    },
    proteinProperties: {
      acid_output: 0.7,
      pH_range: 3.5,
      ionic_strength: 0.55,
      function: 'produces_ionic_compounds',
    },
    description: 'Produces organic acids that dissociate into ions. A biological source of electrolyte compounds.',
    engineeringUse: 'Biological electrolyte production',
  },
  biofilm_formation: {
    id: 'biofilm_formation',
    label: 'Biofilm Matrix Gene',
    category: 'structural',
    icon: '🧫',
    source: 'soil_bacteria',
    protein: 'biofilm_protein',
    properties: {
      sequence_length: 0.4,
      stability: 0.8,
      expression_difficulty: 0.3,
    },
    proteinProperties: {
      adhesion: 0.85,
      porosity: 0.6,
      dielectric_strength: 0.4,
      function: 'creates_structured_matrix',
    },
    description: 'Bacteria form biofilms — structured mats of protein and sugar. These porous matrices can serve as bio-separators.',
    engineeringUse: 'Bio-separator from structured biofilm',
  },

  // ── Yeast genes ─────────────────────────────────────────────────
  fermentation_pathway: {
    id: 'fermentation_pathway',
    label: 'Fermentation Pathway',
    category: 'metabolic',
    icon: '🍺',
    source: 'yeast_culture',
    protein: 'fermentation_enzymes',
    properties: {
      sequence_length: 0.7,
      stability: 0.7,
      expression_difficulty: 0.4,
    },
    proteinProperties: {
      conversion_efficiency: 0.75,
      output_rate: 0.7,
      function: 'converts_sugar_to_chemicals',
    },
    description: 'The enzyme cascade that converts sugars into useful chemicals. Yeast fermentation is nature\'s chemical factory.',
    engineeringUse: 'Converts plant sugars into battery electrolyte precursors',
  },
  protein_secretion: {
    id: 'protein_secretion',
    label: 'Protein Secretion System',
    category: 'transport',
    icon: '📤',
    source: 'yeast_culture',
    protein: 'secretion_machinery',
    properties: {
      sequence_length: 0.8,
      stability: 0.6,
      expression_difficulty: 0.6,
    },
    proteinProperties: {
      export_rate: 0.7,
      folding_accuracy: 0.65,
      function: 'exports_proteins_outside_cell',
    },
    description: 'Allows yeast to secrete proteins into the surrounding liquid. Crucial for harvesting bio-produced materials without destroying cells.',
    engineeringUse: 'Continuous bio-production without cell lysis',
  },

  // ── Insect genes (advanced) ─────────────────────────────────────
  chitin_production: {
    id: 'chitin_production',
    label: 'Chitin Synthase',
    category: 'structural',
    icon: '🦗',
    source: 'fruit_fly',
    protein: 'chitin_synthase_protein',
    properties: {
      sequence_length: 0.7,
      stability: 0.75,
      expression_difficulty: 0.7, // complex eukaryotic gene
    },
    proteinProperties: {
      structural_integrity: 0.9,
      dielectric_strength: 0.7,
      thermal_stability: 0.8,
      function: 'produces_chitin_polymer',
    },
    description: 'Chitin — the material in insect exoskeletons — is a strong, insulating biopolymer. Excellent separator and casing material.',
    engineeringUse: 'Bio-produced insulating material for battery casing and separators',
  },
  silk_protein: {
    id: 'silk_protein',
    label: 'Silk Fibroin Gene',
    category: 'structural',
    icon: '🕸️',
    source: 'fruit_fly',
    protein: 'silk_fibroin',
    properties: {
      sequence_length: 0.9,
      stability: 0.7,
      expression_difficulty: 0.8, // large, complex protein
    },
    proteinProperties: {
      tensile_strength: 0.95,
      flexibility: 0.8,
      porosity: 0.5,
      dielectric_strength: 0.6,
      function: 'produces_silk_fiber',
    },
    description: 'Silk is one of the strongest natural fibers. When produced by engineered yeast, it creates excellent separator membranes.',
    engineeringUse: 'Ultra-strong bio-separator membrane',
  },
};

// ── Organism Templates ───────────────────────────────────────────────────────

/**
 * Base organism types that can be engineered.
 * Properties determine what modifications are possible and how
 * the organism performs as a biological factory.
 */
export const ORGANISM_TYPES = {
  bacteria: {
    id: 'bacteria',
    label: 'Bacteria',
    icon: '🦠',
    tier: 1,
    properties: {
      growth_rate: 0.8,
      doubling_time: 20,       // minutes (game time)
      genetic_capacity: 3,     // max inserted genes
      expression_efficiency: 0.5,
      stability: 0.7,
      mutation_rate: 0.05,
      oxygen_requirement: 'facultative',
      temperature_optimum: 0.6,
      contamination_resistance: 0.4,
    },
    advantages: 'Fast growth, easy to modify, simple genetics',
    limitations: 'Limited protein folding, no post-translational modifications',
    description: 'Single-celled prokaryotes. Fast, cheap, and hackable — the workhorses of genetic engineering.',
  },
  yeast: {
    id: 'yeast',
    label: 'Yeast',
    icon: '🍞',
    tier: 2,
    properties: {
      growth_rate: 0.6,
      doubling_time: 90,
      genetic_capacity: 5,
      expression_efficiency: 0.65,
      stability: 0.75,
      mutation_rate: 0.03,
      oxygen_requirement: 'facultative',
      temperature_optimum: 0.7,
      contamination_resistance: 0.5,
      protein_folding: 0.7,    // can fold complex proteins
      secretion_capacity: 0.6,
    },
    advantages: 'Better protein folding, can secrete products, more stable',
    limitations: 'Slower growth, more complex to engineer',
    description: 'Single-celled eukaryotes. More complex than bacteria but can properly fold and secrete complex proteins.',
  },
  fly_cells: {
    id: 'fly_cells',
    label: 'Insect Cell Culture',
    icon: '🪰',
    tier: 3,
    properties: {
      growth_rate: 0.3,
      doubling_time: 360,
      genetic_capacity: 8,
      expression_efficiency: 0.8,
      stability: 0.6,
      mutation_rate: 0.02,
      oxygen_requirement: 'aerobic',
      temperature_optimum: 0.55,
      contamination_resistance: 0.3,
      protein_folding: 0.9,
      post_translational: 0.8,  // complex modifications
    },
    advantages: 'Complex protein production, post-translational modifications, largest gene capacity',
    limitations: 'Slow growth, fragile, expensive to maintain, contamination-prone',
    description: 'Multicellular insect cells grown in culture. Can produce the most complex proteins but require careful maintenance.',
  },
};

// ── Molecular Material Types ─────────────────────────────────────────────────

/**
 * Types of molecular material that can be extracted.
 * Each has different stability, handling requirements, and uses.
 */
export const MOLECULAR_TYPES = {
  DNA: {
    id: 'DNA',
    label: 'DNA',
    icon: '🧬',
    stability: 0.9,              // DNA is relatively stable
    degradation_rate: 0.005,     // slow degradation
    storage_requirement: 'cold', // -20°C
    description: 'Deoxyribonucleic acid — stores genetic instructions. The blueprint for all proteins.',
    explanation: 'DNA is a double-stranded molecule that stores the code for building proteins. Each gene is a section of DNA that encodes one protein. DNA → RNA → Protein is the central dogma of biology.',
  },
  RNA: {
    id: 'RNA',
    label: 'RNA',
    icon: '📜',
    stability: 0.4,              // RNA is fragile
    degradation_rate: 0.05,      // rapid degradation
    storage_requirement: 'ice',  // -80°C
    description: 'Ribonucleic acid — carries instructions from DNA to the protein-making machinery. Fragile and short-lived.',
    explanation: 'RNA is the messenger. When a gene is "expressed," DNA is copied into RNA (transcription), which is then read by ribosomes to build protein (translation). RNA degrades quickly — it\'s a temporary instruction sheet.',
  },
  Protein: {
    id: 'Protein',
    label: 'Protein',
    icon: '🔬',
    stability: 0.6,
    degradation_rate: 0.02,
    storage_requirement: 'cold',
    description: 'Proteins are molecular machines — they perform functions. Enzymes, structural fibers, ion channels are all proteins.',
    explanation: 'Proteins are the workers of the cell. They catalyze reactions (enzymes), provide structure (collagen, silk), transport molecules (ion channels), and much more. Their function depends on their 3D shape, which is determined by their amino acid sequence.',
  },
};

/** Lookup helpers */
export function getSampleSource(id) { return SAMPLE_SOURCES[id] || null; }
export function getGene(id) { return GENES[id] || null; }
export function getOrganismType(id) { return ORGANISM_TYPES[id] || null; }
