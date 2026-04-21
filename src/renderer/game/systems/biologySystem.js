/**
 * Biology System — sample collection, molecular extraction, and gene expression.
 *
 * Integrates into the unified pipeline:
 *   🌿 Plants → 🧬 Biology → ⚗️ Chemistry → 🔋 Energy → ⚙️ Engineering
 *
 * Biology adds a layer BETWEEN plants and chemistry:
 *   - Extract biological molecules (DNA, RNA, protein) from living tissue
 *   - Simulate gene expression (DNA → RNA → Protein)
 *   - Produce functional proteins that enhance chemistry outputs
 *
 * All property-based. Extraction quality depends on sample integrity,
 * contamination, skill, and handling. Expression efficiency depends
 * on gene properties and organism type.
 *
 * Pure functions — no side effects.
 */

import {
  SAMPLE_SOURCES, GENES, MOLECULAR_TYPES,
  getSampleSource, getGene,
} from '../data/biology.js';

// ── Sample Collection ────────────────────────────────────────────────────────

/**
 * Collect a biological sample from the world.
 *
 * @param {string} sourceId - sample source id (from biology.js)
 * @param {number} [skillLevel=1] - player's biology skill (1–5)
 * @param {object} [environment] - { temperature, moisture }
 * @returns {{ sample: object, explanation: string }}
 */
export function collectSample(sourceId, skillLevel = 1, environment = {}) {
  const source = getSampleSource(sourceId);
  if (!source) return { sample: null, explanation: 'Unknown sample source.' };

  const skillBonus = (skillLevel - 1) * 0.08;
  const temp = environment.temperature || 0.5;

  // Heat increases degradation risk
  const heatPenalty = Math.max(0, (temp - 0.6) * 0.3);

  const sample = {
    id: `sample_${sourceId}_${Date.now()}`,
    sourceId,
    sourceType: source.sourceType,
    label: source.label,
    icon: source.icon,
    collectedAt: Date.now(),
    properties: {
      integrity: Math.min(0.95, 0.7 + skillBonus - heatPenalty),
      contamination: Math.max(0.02, source.properties.contamination_risk - skillBonus),
      cell_density: source.properties.cell_density,
      degradation_rate: source.properties.degradation_rate + heatPenalty * 0.01,
    },
    extractableGenes: source.extractableGenes,
  };

  const explanation = `Collected ${source.label}. ` +
    `Integrity: ${Math.round(sample.properties.integrity * 100)}% ` +
    `(${sample.properties.integrity > 0.8 ? 'good' : sample.properties.integrity > 0.6 ? 'fair' : 'poor'}). ` +
    `Contamination: ${Math.round(sample.properties.contamination * 100)}%. ` +
    `${heatPenalty > 0 ? 'Heat is degrading the sample — work quickly!' : 'Desert morning is ideal collection time.'}`;

  return { sample, explanation };
}

/**
 * Apply time-based degradation to a sample.
 * Call periodically to model biological decay.
 */
export function degradeSample(sample, elapsedMinutes) {
  const rate = sample.properties.degradation_rate;
  const newIntegrity = Math.max(0, sample.properties.integrity - rate * elapsedMinutes);

  return {
    ...sample,
    properties: {
      ...sample.properties,
      integrity: newIntegrity,
    },
  };
}

// ── Molecular Extraction ─────────────────────────────────────────────────────

/**
 * Extract DNA from a biological sample.
 *
 * DNA is the most stable biological molecule — tolerates some degradation.
 * Contamination reduces purity. Skill improves yield.
 *
 * @param {object} sample
 * @param {number} [skillLevel=1]
 * @returns {{ material: object, explanation: string }}
 */
export function extractDNA(sample, skillLevel = 1) {
  return _extractMolecule(sample, 'DNA', skillLevel, {
    stabilityBonus: 0.2,  // DNA is inherently stable
    yieldKey: 'dna_yield',
  });
}

/**
 * Extract RNA from a biological sample.
 *
 * RNA is fragile — degrades rapidly. Must act quickly after collection.
 * Teaches the concept of molecular instability.
 *
 * @param {object} sample
 * @param {number} [skillLevel=1]
 * @returns {{ material: object, explanation: string }}
 */
export function extractRNA(sample, skillLevel = 1) {
  return _extractMolecule(sample, 'RNA', skillLevel, {
    stabilityBonus: -0.2,  // RNA is fragile
    yieldKey: 'rna_yield',
    fragile: true,
  });
}

/**
 * Extract protein from a biological sample.
 *
 * Protein yield depends on source type. Temperature-sensitive.
 *
 * @param {object} sample
 * @param {number} [skillLevel=1]
 * @returns {{ material: object, explanation: string }}
 */
export function extractProtein(sample, skillLevel = 1) {
  return _extractMolecule(sample, 'Protein', skillLevel, {
    stabilityBonus: 0,
    yieldKey: 'protein_yield',
    temperatureSensitive: true,
  });
}

/**
 * Internal extraction logic — property-driven, not hardcoded per type.
 */
function _extractMolecule(sample, moleculeType, skillLevel, options) {
  const molType = MOLECULAR_TYPES[moleculeType];
  if (!molType) return { material: null, explanation: 'Unknown molecule type.' };

  const source = getSampleSource(sample.sourceId);
  const sourceYield = source?.properties[options.yieldKey] || 0.3;
  const skillBonus = (skillLevel - 1) * 0.06;

  // Core extraction computation — all from properties
  const integrity = sample.properties.integrity;
  const contamination = sample.properties.contamination;

  // Purity: inversely proportional to contamination, boosted by skill
  const purity = Math.min(0.95, Math.max(0.05,
    (1 - contamination) * integrity * (0.5 + skillBonus) + (options.stabilityBonus || 0) * 0.2
  ));

  // Yield: depends on source, integrity, and skill
  const yieldAmount = Math.min(0.95, Math.max(0.05,
    sourceYield * integrity * (0.6 + skillBonus)
  ));

  // Degradation: molecule-specific stability
  const degradation = Math.max(0, 1 - molType.stability - (options.stabilityBonus || 0));

  // Check for failure conditions
  if (integrity < 0.15) {
    return {
      material: null,
      explanation: `Sample too degraded for ${moleculeType} extraction. ` +
        `Integrity: ${Math.round(integrity * 100)}%. ` +
        `Collect a fresh sample and process it quickly — biological molecules break down over time.`,
    };
  }

  if (options.fragile && integrity < 0.5) {
    return {
      material: null,
      explanation: `${moleculeType} extraction failed — sample integrity too low (${Math.round(integrity * 100)}%). ` +
        `RNA is extremely fragile. It degrades within minutes at room temperature. ` +
        `Collect a fresh sample and extract immediately.`,
    };
  }

  const material = {
    id: `${moleculeType.toLowerCase()}_${sample.id}`,
    type: moleculeType,
    label: `${moleculeType} (from ${sample.label})`,
    icon: molType.icon,
    sourceId: sample.sourceId,
    sourceSampleId: sample.id,
    extractedAt: Date.now(),
    properties: {
      purity,
      yield: yieldAmount,
      degradation,
      stability: molType.stability + (options.stabilityBonus || 0),
      degradation_rate: molType.degradation_rate,
    },
    // Carry forward extractable genes for DNA
    genes: moleculeType === 'DNA' ? (sample.extractableGenes || []) : [],
  };

  const qualityWord = purity > 0.7 ? 'high' : purity > 0.4 ? 'moderate' : 'low';
  const explanation = `Extracted ${moleculeType} from ${sample.label}. ` +
    `Purity: ${Math.round(purity * 100)}% (${qualityWord}). ` +
    `Yield: ${Math.round(yieldAmount * 100)}%. ` +
    molType.explanation;

  return { material, explanation };
}

// ── Gene Expression Simulation ───────────────────────────────────────────────

/**
 * Simulate gene expression: DNA → RNA → Protein.
 *
 * This is the central dogma of molecular biology, modeled as
 * a property pipeline:
 *   gene.stability → transcription_success → rna quality
 *   rna quality → translation_success → protein properties
 *
 * @param {object} dna - extracted DNA material
 * @param {string} geneId - which gene to express
 * @param {number} [skillLevel=1]
 * @returns {{ protein: object, intermediates: object, explanation: string }}
 */
export function simulateExpression(dna, geneId, skillLevel = 1) {
  if (!dna || dna.type !== 'DNA') {
    return { protein: null, intermediates: null, explanation: 'Need extracted DNA to simulate gene expression.' };
  }

  const gene = getGene(geneId);
  if (!gene) {
    return { protein: null, intermediates: null, explanation: `Unknown gene: ${geneId}` };
  }

  if (!dna.genes.includes(geneId)) {
    return {
      protein: null,
      intermediates: null,
      explanation: `Gene "${gene.label}" not found in this DNA sample. ` +
        `It comes from ${SAMPLE_SOURCES[gene.source]?.label || gene.source}. Collect the right sample.`,
    };
  }

  const skillBonus = (skillLevel - 1) * 0.05;

  // ── Step 1: Transcription (DNA → RNA) ──
  const transcriptionSuccess = Math.min(0.95,
    dna.properties.purity * gene.properties.stability * (0.7 + skillBonus)
  );
  const rnaQuality = transcriptionSuccess * (1 - gene.properties.expression_difficulty * 0.3);

  // ── Step 2: Translation (RNA → Protein) ──
  const translationSuccess = Math.min(0.95,
    rnaQuality * (0.8 + skillBonus)
  );

  // ── Step 3: Protein folding ──
  // More complex genes are harder to fold correctly
  const foldingAccuracy = Math.min(0.95,
    translationSuccess * (1 - gene.properties.sequence_length * 0.2 + skillBonus)
  );

  // If folding fails badly, protein is non-functional
  if (foldingAccuracy < 0.2) {
    return {
      protein: null,
      intermediates: { rnaQuality, translationSuccess, foldingAccuracy },
      explanation: `Expression of ${gene.label} produced a misfolded protein (${Math.round(foldingAccuracy * 100)}% accuracy). ` +
        `The protein can't perform its function because its 3D shape is wrong. ` +
        `Improve DNA purity or use an organism with better protein folding machinery (yeast > bacteria).`,
    };
  }

  // ── Compute protein properties from gene template ──
  const proteinProps = {};
  for (const [key, baseValue] of Object.entries(gene.proteinProperties)) {
    if (typeof baseValue === 'number') {
      // Scale by expression quality
      proteinProps[key] = Math.min(0.95, baseValue * foldingAccuracy);
    } else {
      proteinProps[key] = baseValue;
    }
  }

  // Add universal protein properties
  proteinProps.purity = foldingAccuracy;
  proteinProps.stability = gene.properties.stability * foldingAccuracy;
  proteinProps.expression_efficiency = translationSuccess;

  const protein = {
    id: `protein_${geneId}_${Date.now()}`,
    type: 'Protein',
    label: `${gene.label} Protein`,
    icon: '🔬',
    geneId,
    geneLabel: gene.label,
    category: gene.category,
    properties: proteinProps,
    engineeringUse: gene.engineeringUse,
  };

  const explanation = `Gene expression: ${gene.label}\n` +
    `  DNA → RNA (transcription): ${Math.round(transcriptionSuccess * 100)}% success\n` +
    `  RNA → Protein (translation): ${Math.round(translationSuccess * 100)}% success\n` +
    `  Protein folding: ${Math.round(foldingAccuracy * 100)}% accuracy\n\n` +
    `${gene.description}\n` +
    `Function: ${gene.proteinProperties.function || 'unknown'}`;

  return {
    protein,
    intermediates: { rnaQuality, transcriptionSuccess, translationSuccess, foldingAccuracy },
    explanation,
  };
}

// ── Bio→Chemistry Bridge ─────────────────────────────────────────────────────

/**
 * Convert a bio-produced protein into a chemistry-system chemical.
 *
 * This bridges biology output into the existing chemistry pipeline,
 * so bio-proteins can enhance electrolytes, electrodes, and separators.
 *
 * @param {object} protein - from simulateExpression
 * @returns {object} chemical compatible with chemistrySystem.js
 */
export function proteinToChemical(protein) {
  if (!protein || protein.type !== 'Protein') return null;

  const p = protein.properties;

  // Map protein category to chemistry type
  const categoryToChemType = {
    structural: 'fiber',
    transport: 'electrolyte',
    metabolic: 'organic',
    regulatory: 'organic',
  };

  const chemType = categoryToChemType[protein.category] || 'organic';

  // Build chemistry-compatible properties from protein properties
  const chemProps = {
    purity: p.purity || 0.5,
    stability: p.stability || 0.5,
  };

  // Map protein-specific properties to chemistry properties
  if (p.fiber_strength) chemProps.fiber_strength = p.fiber_strength;
  if (p.structural_integrity) chemProps.tensile_modulus = p.structural_integrity;
  if (p.conductivity_boost) chemProps.conductivity_potential = (chemProps.conductivity_potential || 0) + p.conductivity_boost;
  if (p.ion_selectivity) chemProps.conductivity_potential = (chemProps.conductivity_potential || 0) + p.ion_selectivity * 0.3;
  if (p.transport_rate) chemProps.conductivity_potential = (chemProps.conductivity_potential || 0) + p.transport_rate * 0.2;
  if (p.dielectric_strength) chemProps.dielectric_strength = p.dielectric_strength;
  if (p.thermal_stability) chemProps.thermal_stability = p.thermal_stability;
  if (p.carbon_density) chemProps.carbon_content = p.carbon_density;
  if (p.porosity) chemProps.porosity = p.porosity;
  if (p.adhesion) chemProps.adhesion = p.adhesion;
  if (p.tensile_strength) chemProps.fiber_strength = p.tensile_strength;
  if (p.acid_output) chemProps.conductivity_potential = (chemProps.conductivity_potential || 0) + p.acid_output * 0.3;

  return {
    id: `bio_${protein.id}`,
    compoundId: `bio_${protein.geneId}`,
    label: `Bio-${protein.label}`,
    type: chemType,
    sourceId: 'biological',
    sourcePart: protein.geneId,
    properties: chemProps,
    refined: true,               // bio-produced = already refined
    refinementCount: 0,
    bioDerived: true,
    explanation: protein.engineeringUse,
  };
}

// ── Queries ──────────────────────────────────────────────────────────────────

/** Get all sample sources available in a biome. */
export function getSamplesForBiome(biome) {
  return Object.values(SAMPLE_SOURCES).filter((s) => s.biome === biome);
}

/** Get all genes extractable from a sample source. */
export function getGenesForSource(sourceId) {
  const source = getSampleSource(sourceId);
  if (!source) return [];
  return source.extractableGenes.map((gId) => getGene(gId)).filter(Boolean);
}

/** Check if a sample is still viable (integrity above threshold). */
export function isSampleViable(sample, threshold = 0.15) {
  return sample.properties.integrity > threshold;
}
