/**
 * Genetic Engineering System — gene modification, organism construction,
 * and biological production.
 *
 * Integrates into the unified pipeline:
 *   Plants → Biology (extract) → Genetic Engineering (modify) →
 *   Bio-Factories (produce) → Chemistry → Battery → Engineering
 *
 * The player can:
 *   1. Modify DNA: insert, delete, or mutate genes
 *   2. Create engineered organisms from modified DNA + host organism
 *   3. Run organisms as biological factories (produce chemicals/materials)
 *   4. Integrate bio-outputs into the chemistry→battery pipeline
 *
 * All property-driven. Mutation outcomes are computed from gene/organism
 * properties, not looked up from a table.
 */

import { GENES, ORGANISM_TYPES, getGene, getOrganismType } from '../data/biology.js';
import { simulateExpression, proteinToChemical } from './biologySystem.js';

// ── DNA Modification ─────────────────────────────────────────────────────────

/**
 * Insert a gene into a DNA construct.
 *
 * @param {object} construct - current DNA construct { genes: string[], properties: {} }
 * @param {string} geneId - gene to insert
 * @param {number} [skillLevel=1]
 * @returns {{ construct: object, success: boolean, explanation: string }}
 */
export function insertGene(construct, geneId, skillLevel = 1) {
  const gene = getGene(geneId);
  if (!gene) return { construct, success: false, explanation: `Unknown gene: ${geneId}` };

  if (construct.genes.includes(geneId)) {
    return { construct, success: false, explanation: `${gene.label} is already in this construct.` };
  }

  const skillBonus = (skillLevel - 1) * 0.06;
  const difficulty = gene.properties.expression_difficulty;

  // Insertion success depends on skill vs difficulty
  const successProb = Math.min(0.95, 0.5 + skillBonus - difficulty * 0.3);
  const roll = seededRandom(geneId.length + construct.genes.length);

  if (roll > successProb) {
    // Insertion failed — gene didn't integrate
    const stabilityHit = difficulty * 0.1;
    return {
      construct: {
        ...construct,
        properties: {
          ...construct.properties,
          stability: Math.max(0, (construct.properties.stability || 0.8) - stabilityHit),
        },
      },
      success: false,
      explanation: `Gene insertion failed. ${gene.label} didn't integrate into the construct. ` +
        `Complexity: ${Math.round(difficulty * 100)}%. ` +
        `The attempt slightly damaged construct stability. Try again with higher skill.`,
    };
  }

  const newConstruct = {
    ...construct,
    genes: [...construct.genes, geneId],
    properties: {
      ...construct.properties,
      sequence_length: (construct.properties.sequence_length || 0) + gene.properties.sequence_length * 0.1,
      stability: Math.max(0.1, (construct.properties.stability || 0.8) - difficulty * 0.05),
    },
    modifications: [
      ...(construct.modifications || []),
      { type: 'insert', geneId, timestamp: Date.now() },
    ],
  };

  return {
    construct: newConstruct,
    success: true,
    explanation: `Successfully inserted ${gene.label}! ` +
      `The gene will produce: ${gene.proteinProperties.function || 'a functional protein'}. ` +
      `Construct now has ${newConstruct.genes.length} gene(s). ` +
      `Engineering use: ${gene.engineeringUse}`,
  };
}

/**
 * Delete a gene from a construct.
 */
export function deleteGene(construct, geneId) {
  if (!construct.genes.includes(geneId)) {
    return { construct, success: false, explanation: 'Gene not found in construct.' };
  }

  const gene = getGene(geneId);
  return {
    construct: {
      ...construct,
      genes: construct.genes.filter((g) => g !== geneId),
      properties: {
        ...construct.properties,
        stability: Math.min(0.95, (construct.properties.stability || 0.5) + 0.05),
      },
      modifications: [
        ...(construct.modifications || []),
        { type: 'delete', geneId, timestamp: Date.now() },
      ],
    },
    success: true,
    explanation: `Removed ${gene?.label || geneId} from construct. Stability slightly improved.`,
  };
}

/**
 * Mutate a gene — random property changes. Can be beneficial or harmful.
 *
 * @param {object} construct
 * @param {string} geneId
 * @param {'random'|'targeted'} mutationType
 * @param {number} [skillLevel=1]
 * @returns {{ construct: object, mutation: object, explanation: string }}
 */
export function mutateGene(construct, geneId, mutationType = 'random', skillLevel = 1) {
  if (!construct.genes.includes(geneId)) {
    return { construct, mutation: null, explanation: 'Gene not in construct.' };
  }

  const gene = getGene(geneId);
  if (!gene) return { construct, mutation: null, explanation: 'Unknown gene.' };

  const skillBonus = (skillLevel - 1) * 0.08;

  // Targeted mutations are more likely beneficial with skill
  const beneficialChance = mutationType === 'targeted'
    ? Math.min(0.85, 0.4 + skillBonus)
    : 0.35;

  const isBeneficial = seededRandom(geneId.length * 7 + construct.genes.length) < beneficialChance;
  const magnitude = 0.05 + seededRandom(geneId.length * 3) * 0.15; // 5–20% change

  const mutation = {
    geneId,
    type: mutationType,
    beneficial: isBeneficial,
    magnitude,
    affectedProperty: isBeneficial ? 'expression_efficiency' : 'stability',
    delta: isBeneficial ? magnitude : -magnitude,
  };

  // Apply mutation to construct properties
  const stabilityDelta = isBeneficial ? magnitude * 0.5 : -magnitude;
  const newConstruct = {
    ...construct,
    properties: {
      ...construct.properties,
      stability: Math.max(0.05, Math.min(0.95,
        (construct.properties.stability || 0.5) + stabilityDelta
      )),
      mutation_count: (construct.properties.mutation_count || 0) + 1,
    },
    modifications: [
      ...(construct.modifications || []),
      { type: 'mutate', geneId, mutation, timestamp: Date.now() },
    ],
  };

  const explanation = isBeneficial
    ? `Beneficial mutation in ${gene.label}! ` +
      `Expression efficiency improved by ${Math.round(magnitude * 100)}%. ` +
      `Mutations change the DNA sequence — sometimes a small change improves how well the protein works.`
    : `Harmful mutation in ${gene.label}. ` +
      `Stability decreased by ${Math.round(magnitude * 100)}%. ` +
      `Most random mutations are harmful — they disrupt the precise sequence needed for protein function. ` +
      `Targeted mutations with higher skill are more likely to be beneficial.`;

  return { construct: newConstruct, mutation, explanation };
}

// ── Construct Creation ───────────────────────────────────────────────────────

/**
 * Create a new empty DNA construct for engineering.
 */
export function createConstruct(label = 'New Construct') {
  return {
    id: `construct_${Date.now()}`,
    label,
    genes: [],
    properties: {
      stability: 0.9,
      sequence_length: 0,
      mutation_count: 0,
    },
    modifications: [],
    createdAt: Date.now(),
  };
}

// ── Organism Engineering ─────────────────────────────────────────────────────

/**
 * Create an engineered organism by combining a construct with a host organism type.
 *
 * @param {object} construct - DNA construct with inserted genes
 * @param {string} organismTypeId - 'bacteria' | 'yeast' | 'fly_cells'
 * @param {number} [skillLevel=1]
 * @returns {{ organism: object, explanation: string, warnings: string[] }}
 */
export function createOrganism(construct, organismTypeId, skillLevel = 1) {
  const orgType = getOrganismType(organismTypeId);
  if (!orgType) return { organism: null, explanation: 'Unknown organism type.', warnings: [] };

  if (construct.genes.length === 0) {
    return { organism: null, explanation: 'Construct has no genes. Insert at least one gene first.', warnings: [] };
  }

  const warnings = [];

  // Check genetic capacity
  if (construct.genes.length > orgType.properties.genetic_capacity) {
    return {
      organism: null,
      explanation: `${orgType.label} can only hold ${orgType.properties.genetic_capacity} genes, ` +
        `but construct has ${construct.genes.length}. Use a more complex organism (yeast or insect cells).`,
      warnings: ['Over capacity'],
    };
  }

  const skillBonus = (skillLevel - 1) * 0.05;

  // Compute organism properties from construct + host
  const constructStability = construct.properties.stability || 0.5;
  const hostStability = orgType.properties.stability;

  // Combined stability: weakest link
  const combinedStability = Math.min(constructStability, hostStability) * (0.8 + skillBonus);

  // Expression efficiency: depends on organism type and gene difficulty
  const geneEfficiencies = construct.genes.map((gId) => {
    const gene = getGene(gId);
    if (!gene) return 0.5;
    const diff = gene.properties.expression_difficulty;
    // Harder genes need better organisms (yeast/insect cells)
    const hostCapability = orgType.properties.expression_efficiency +
      (orgType.properties.protein_folding || 0) * 0.2;
    return Math.min(0.95, hostCapability * (1 - diff * 0.3) + skillBonus);
  });
  const avgEfficiency = geneEfficiencies.reduce((s, e) => s + e, 0) / geneEfficiencies.length;

  // Growth rate modified by construct load
  const loadPenalty = construct.genes.length / orgType.properties.genetic_capacity;
  const growthRate = orgType.properties.growth_rate * (1 - loadPenalty * 0.3);

  // Mutation rate increases with construct instability
  const mutationRate = orgType.properties.mutation_rate +
    (1 - constructStability) * 0.05 +
    (construct.properties.mutation_count || 0) * 0.01;

  // Production output: what this organism makes per cycle
  const productionOutputs = construct.genes.map((gId) => {
    const gene = getGene(gId);
    if (!gene) return null;
    return {
      geneId: gId,
      proteinId: gene.protein,
      label: gene.label,
      outputRate: avgEfficiency * growthRate,
      engineeringUse: gene.engineeringUse,
    };
  }).filter(Boolean);

  if (combinedStability < 0.3) {
    warnings.push('Low stability — organism may fail unpredictably. Reduce gene count or improve construct quality.');
  }
  if (mutationRate > 0.1) {
    warnings.push('High mutation rate — production output will drift over time. Genome may become unstable.');
  }
  if (avgEfficiency < 0.3) {
    warnings.push(`Low expression efficiency in ${orgType.label}. Consider a different host organism.`);
  }

  const organism = {
    id: `organism_${organismTypeId}_${Date.now()}`,
    type: organismTypeId,
    label: `Engineered ${orgType.label}`,
    icon: orgType.icon,
    constructId: construct.id,
    genes: [...construct.genes],
    tier: orgType.tier,
    properties: {
      growth_rate: Math.round(growthRate * 100) / 100,
      doubling_time: Math.round(orgType.properties.doubling_time / growthRate),
      expression_efficiency: Math.round(avgEfficiency * 100) / 100,
      stability: Math.round(combinedStability * 100) / 100,
      mutation_rate: Math.round(mutationRate * 1000) / 1000,
      production_output: Math.round(avgEfficiency * growthRate * 100) / 100,
      contamination_resistance: orgType.properties.contamination_resistance,
    },
    productionOutputs,
    createdAt: Date.now(),
    generation: 0,
    totalProduced: 0,
  };

  const explanation = `Created ${organism.label} with ${construct.genes.length} gene(s).\n` +
    `  Growth rate: ${Math.round(growthRate * 100)}%\n` +
    `  Expression efficiency: ${Math.round(avgEfficiency * 100)}%\n` +
    `  Stability: ${Math.round(combinedStability * 100)}%\n` +
    `  Mutation rate: ${Math.round(mutationRate * 100)}%\n` +
    `  Produces: ${productionOutputs.map((p) => p.label).join(', ')}\n\n` +
    `${orgType.description}`;

  return { organism, explanation, warnings };
}

// ── Biological Production ────────────────────────────────────────────────────

/**
 * Run a production cycle for an engineered organism.
 * Produces proteins that can be converted to chemistry-compatible chemicals.
 *
 * @param {object} organism
 * @param {number} cycleDuration - game-minutes for this cycle
 * @param {number} [skillLevel=1]
 * @returns {{ products: object[], organism: object, explanation: string, warnings: string[] }}
 */
export function runProductionCycle(organism, cycleDuration, skillLevel = 1) {
  const warnings = [];
  const products = [];

  // Growth: compute how many doublings occurred
  const doublings = cycleDuration / organism.properties.doubling_time;
  const populationFactor = Math.min(10, Math.pow(2, doublings)); // cap at 10x

  // Check for contamination
  const contaminationRoll = seededRandom(organism.id.length + Date.now() % 1000);
  if (contaminationRoll > organism.properties.contamination_resistance) {
    warnings.push('Contamination detected! Production efficiency reduced. Improve sterile technique.');
    // Contamination halves output
  }
  const contaminationPenalty = contaminationRoll > organism.properties.contamination_resistance ? 0.5 : 1.0;

  // Check for mutation drift
  let mutated = false;
  const mutationRoll = seededRandom(organism.generation + organism.id.length);
  if (mutationRoll < organism.properties.mutation_rate) {
    mutated = true;
    warnings.push('Genome mutation occurred! Output properties may have shifted. Re-engineer for consistency.');
  }

  // Produce proteins from each gene
  for (const output of organism.productionOutputs) {
    const gene = getGene(output.geneId);
    if (!gene) continue;

    const baseOutput = output.outputRate * populationFactor * contaminationPenalty;
    const mutationMod = mutated ? (0.7 + seededRandom(output.geneId.length) * 0.6) : 1.0;

    // Build protein with properties scaled by production quality
    const proteinProps = {};
    for (const [key, val] of Object.entries(gene.proteinProperties)) {
      if (typeof val === 'number') {
        proteinProps[key] = Math.min(0.95, val * organism.properties.expression_efficiency * mutationMod);
      } else {
        proteinProps[key] = val;
      }
    }
    proteinProps.purity = organism.properties.expression_efficiency * contaminationPenalty;
    proteinProps.stability = organism.properties.stability * (mutated ? 0.8 : 1.0);
    proteinProps.production_quantity = Math.round(baseOutput * 100) / 100;

    products.push({
      id: `bioproduct_${output.geneId}_${Date.now()}`,
      type: 'Protein',
      label: `${gene.label} (bio-produced)`,
      icon: '🔬',
      geneId: output.geneId,
      geneLabel: gene.label,
      category: gene.category,
      properties: proteinProps,
      engineeringUse: gene.engineeringUse,
      bioproduced: true,
    });
  }

  // Update organism state
  const updatedOrganism = {
    ...organism,
    generation: organism.generation + 1,
    totalProduced: organism.totalProduced + products.length,
    properties: {
      ...organism.properties,
      stability: mutated
        ? Math.max(0.1, organism.properties.stability - 0.05)
        : organism.properties.stability,
    },
  };

  const explanation = `Production cycle complete (${cycleDuration} min, gen ${updatedOrganism.generation}).\n` +
    `  Population growth: ${populationFactor.toFixed(1)}x\n` +
    `  Products: ${products.map((p) => p.label).join(', ')}\n` +
    (warnings.length > 0 ? `  ⚠️ ${warnings.join('; ')}` : '  ✅ Clean production run.');

  return { products, organism: updatedOrganism, explanation, warnings };
}

/**
 * Convert all bio-production outputs to chemistry-compatible chemicals.
 * Bridges genetic engineering output into the chemistry→battery pipeline.
 */
export function convertProductsToChemicals(products) {
  return products.map((p) => proteinToChemical(p)).filter(Boolean);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function seededRandom(seed) {
  let h = seed | 0;
  h = ((h << 5) - h + 374761393) | 0;
  h = ((h ^ (h >>> 15)) * 2246822519) | 0;
  h = ((h ^ (h >>> 13)) * 3266489917) | 0;
  h = (h ^ (h >>> 16)) | 0;
  return (h & 0x7fffffff) / 0x7fffffff;
}
