/**
 * Simulation Engine — validates builds and produces scored results.
 *
 * Takes a system graph (bike, battery, e-bike) and runs physics-based
 * validation rules against it. Every failure includes an explanation
 * so the player learns WHY something doesn't work.
 *
 * Result shape:
 *   {
 *     success: boolean,       // no errors
 *     errors: SimError[],     // hard failures
 *     warnings: SimWarning[], // degraded but functional
 *     score: number,          // 0–100 build quality
 *     metrics: {},            // computed values (range, speed, etc.)
 *   }
 *
 * Each error/warning:
 *   { code, message, explanation, nodeId?, severity }
 */

import {
  validateGraph, getInstalledNodes, getNodesByType,
  getDependencies, getFeeds,
} from './systemGraph.js';
import { loadTest, applyTemperature, applyFatigue, computeBuoyancy, applySurfactant, applyCoating } from './materialEngine.js';
import { MATERIAL_MAP } from '../data/materials.js';

// ── Core Simulation ──────────────────────────────────────────────────────────

/**
 * Run full simulation on a system graph.
 *
 * @param {object} graph - system graph
 * @param {string} systemType - 'bike' | 'battery' | 'ebike'
 * @param {object} [context] - additional context (environment, player skills)
 * @returns {object} SimulationResult
 */
export function simulate(graph, systemType, context = {}) {
  // Start with graph-level structural validation
  const graphResult = validateGraph(graph);

  const errors = graphResult.errors.map((e) => ({
    ...e,
    severity: 'error',
    code: e.type,
  }));

  const warnings = graphResult.warnings.map((w) => ({
    ...w,
    severity: 'warning',
    code: w.type,
  }));

  const metrics = {};

  // Run system-specific simulation rules
  switch (systemType) {
    case 'bike':
      runBikeSimulation(graph, errors, warnings, metrics, context);
      break;
    case 'battery':
      runBatterySimulation(graph, errors, warnings, metrics, context);
      break;
    case 'ebike':
      runBikeSimulation(graph, errors, warnings, metrics, context);
      runBatterySimulation(graph, errors, warnings, metrics, context);
      runEbikeSimulation(graph, errors, warnings, metrics, context);
      break;
    case 'plant_battery':
      runPlantBatterySimulation(graph, errors, warnings, metrics, context);
      break;
    case 'plant_ebike':
      runBikeSimulation(graph, errors, warnings, metrics, context);
      runPlantBatterySimulation(graph, errors, warnings, metrics, context);
      runEbikeSimulation(graph, errors, warnings, metrics, context);
      break;
    case 'bio_production':
      runBioProductionSimulation(graph, errors, warnings, metrics, context);
      break;
    case 'bio_battery':
      runBioProductionSimulation(graph, errors, warnings, metrics, context);
      runPlantBatterySimulation(graph, errors, warnings, metrics, context);
      break;
    case 'structure':
      runStructureSimulation(graph, errors, warnings, metrics, context);
      break;
    case 'vehicle':
      runBikeSimulation(graph, errors, warnings, metrics, context);
      runVehicleMaterialSimulation(graph, errors, warnings, metrics, context);
      break;
    case 'watercraft':
      runWatercraftSimulation(graph, errors, warnings, metrics, context);
      break;
  }

  // Compute score
  const score = computeScore(graph, errors, warnings, metrics);

  return {
    success: errors.length === 0,
    errors,
    warnings,
    score,
    metrics,
    systemType,
    timestamp: Date.now(),
  };
}

// ── Bike Simulation Rules ────────────────────────────────────────────────────

function runBikeSimulation(graph, errors, warnings, metrics, context) {
  const installed = getInstalledNodes(graph);
  const ids = new Set(installed.map((n) => n.id));

  // Frame is absolutely required
  if (!ids.has('frame')) {
    errors.push({
      code: 'no_frame',
      message: 'No frame installed',
      explanation: 'The frame is the skeleton of the bike. Everything mounts to it.',
      severity: 'error',
      nodeId: 'frame',
    });
    return; // Can't evaluate further without a frame
  }

  // Wheels
  const hasWheels = ids.has('front_wheel') && ids.has('rear_wheel');
  if (!hasWheels) {
    const missing = [];
    if (!ids.has('front_wheel')) missing.push('front wheel');
    if (!ids.has('rear_wheel')) missing.push('rear wheel');
    errors.push({
      code: 'missing_wheels',
      message: `Missing: ${missing.join(', ')}`,
      explanation: 'A bike needs both wheels to roll.',
      severity: 'error',
    });
  }

  // Tire condition
  for (const wheelId of ['front_wheel', 'rear_wheel']) {
    const wheel = graph.nodes.get(wheelId);
    if (wheel?.installed && wheel.properties?.tirePressure !== undefined) {
      if (wheel.properties.tirePressure <= 0) {
        errors.push({
          code: 'flat_tire',
          message: `${wheel.properties.label || wheelId} has a flat tire`,
          explanation: 'Pump up the tire or patch the tube. A flat tire means no rolling!',
          severity: 'error',
          nodeId: wheelId,
        });
      } else if (wheel.properties.tirePressure < 20) {
        warnings.push({
          code: 'low_pressure',
          message: `${wheel.properties.label || wheelId} tire pressure is low`,
          explanation: 'Low pressure makes pedaling harder and risks a pinch flat.',
          severity: 'warning',
          nodeId: wheelId,
        });
      }
    }
  }

  // Brakes
  if (!ids.has('brakes')) {
    errors.push({
      code: 'no_brakes',
      message: 'No brakes installed',
      explanation: 'Brakes are essential for safety. You need to be able to stop!',
      severity: 'error',
      nodeId: 'brakes',
    });
  }

  // Drivetrain
  if (!ids.has('drivetrain')) {
    errors.push({
      code: 'no_drivetrain',
      message: 'No drivetrain installed',
      explanation: 'The drivetrain (chain + gears) transfers pedaling power to the rear wheel.',
      severity: 'error',
      nodeId: 'drivetrain',
    });
  } else {
    const dt = graph.nodes.get('drivetrain');
    if (dt?.properties?.chainTension === 'loose') {
      warnings.push({
        code: 'loose_chain',
        message: 'Chain is loose',
        explanation: 'A loose chain can slip off the gears. Tighten it or adjust the derailleur.',
        severity: 'warning',
        nodeId: 'drivetrain',
      });
    }
  }

  // Compute bike metrics
  if (hasWheels && ids.has('drivetrain')) {
    const frame = graph.nodes.get('frame');
    metrics.bikeWeight = (frame?.properties?.weight || 12) +
      installed.reduce((sum, n) => sum + (n.properties?.weight || 0), 0);
    metrics.bikeRideable = errors.filter((e) => e.code !== 'loose_chain').length === 0;
    metrics.gearCount = graph.nodes.get('drivetrain')?.properties?.gears || 1;
  }
}

// ── Battery Simulation Rules ─────────────────────────────────────────────────

function runBatterySimulation(graph, errors, warnings, metrics, context) {
  const cells = getNodesByType(graph, 'cell').filter((n) => n.installed);
  const bms = graph.nodes.get('bms');
  const casing = graph.nodes.get('battery_casing');

  if (cells.length === 0) {
    // Only error if battery components exist at all
    const hasBatteryParts = graph.nodes.has('bms') || graph.nodes.has('battery_casing');
    if (hasBatteryParts) {
      errors.push({
        code: 'no_cells',
        message: 'No battery cells installed',
        explanation: 'A battery needs cells to store energy. Each cell holds 3.7V.',
        severity: 'error',
      });
    }
    return;
  }

  // Cell health check
  for (const cell of cells) {
    if ((cell.properties?.health || 1) < 0.3) {
      warnings.push({
        code: 'degraded_cell',
        message: `Cell ${cell.properties.label || cell.id} is degraded (${Math.round((cell.properties.health || 0) * 100)}%)`,
        explanation: 'Degraded cells reduce capacity and can be dangerous. Replace them.',
        severity: 'warning',
        nodeId: cell.id,
      });
    }
  }

  // Configuration
  const config = graph.nodes.get('battery_config');
  const series = config?.properties?.series || 1;
  const parallel = config?.properties?.parallel || 1;
  const expectedCells = series * parallel;

  if (cells.length < expectedCells) {
    errors.push({
      code: 'insufficient_cells',
      message: `Need ${expectedCells} cells for ${series}S${parallel}P, have ${cells.length}`,
      explanation: `A ${series}S${parallel}P configuration needs ${series} × ${parallel} = ${expectedCells} cells. Series = voltage, parallel = capacity.`,
      severity: 'error',
    });
  }

  // Compute battery metrics
  const cellVoltage = 3.7;
  const avgCapacity = cells.reduce((s, c) => s + (c.properties?.capacity || 2500), 0) / (cells.length || 1);
  const avgHealth = cells.reduce((s, c) => s + (c.properties?.health || 1), 0) / (cells.length || 1);

  metrics.batteryVoltage = series * cellVoltage;
  metrics.batteryCapacityMah = parallel * avgCapacity;
  metrics.batteryWh = (metrics.batteryVoltage * metrics.batteryCapacityMah) / 1000;
  metrics.batteryHealth = avgHealth;
  metrics.batteryConfig = `${series}S${parallel}P`;

  // Overvoltage check
  if (metrics.batteryVoltage > 60) {
    errors.push({
      code: 'overvoltage',
      message: `Battery voltage too high: ${metrics.batteryVoltage.toFixed(1)}V`,
      explanation: 'Voltage above 60V is dangerous and requires special handling. Reduce series count.',
      severity: 'error',
    });
  }

  // BMS check
  if (!bms?.installed) {
    warnings.push({
      code: 'no_bms',
      message: 'No Battery Management System installed',
      explanation: 'A BMS protects cells from overcharge, over-discharge, and short circuits. Essential for safety!',
      severity: 'warning',
    });
  }

  // Short circuit check (no insulation + no casing)
  if (!casing?.installed) {
    warnings.push({
      code: 'no_casing',
      message: 'Battery has no protective casing',
      explanation: 'An exposed battery pack is dangerous. Add a casing for protection.',
      severity: 'warning',
    });
  }

  // Overheating risk
  if (cells.length > 10 && !bms?.installed) {
    errors.push({
      code: 'overheating_risk',
      message: 'Large battery without BMS risks overheating',
      explanation: 'More than 10 cells without a BMS can overheat and fail catastrophically.',
      severity: 'error',
    });
  }
}

// ── E-Bike Simulation Rules ─────────────────────────────────────────────────

function runEbikeSimulation(graph, errors, warnings, metrics, context) {
  const motor = graph.nodes.get('motor');
  const controller = graph.nodes.get('controller');

  if (!motor?.installed) {
    errors.push({
      code: 'no_motor',
      message: 'No motor installed',
      explanation: 'An e-bike needs an electric motor to provide powered assistance.',
      severity: 'error',
      nodeId: 'motor',
    });
  }

  if (!controller?.installed) {
    errors.push({
      code: 'no_controller',
      message: 'No controller installed',
      explanation: 'The controller manages power from battery to motor. Without it, nothing works.',
      severity: 'error',
      nodeId: 'controller',
    });
  }

  // Voltage matching: battery → controller → motor
  if (motor?.installed && controller?.installed && metrics.batteryVoltage) {
    const controllerVoltage = controller.properties?.ratedVoltage;
    const motorVoltage = motor.properties?.ratedVoltage;

    if (controllerVoltage && metrics.batteryVoltage > controllerVoltage * 1.1) {
      errors.push({
        code: 'voltage_mismatch_controller',
        message: `Battery (${metrics.batteryVoltage.toFixed(1)}V) exceeds controller rating (${controllerVoltage}V)`,
        explanation: 'The battery voltage must match the controller input range. Too much voltage will fry the controller.',
        severity: 'error',
      });
    }

    if (motorVoltage && controllerVoltage && motorVoltage !== controllerVoltage) {
      warnings.push({
        code: 'voltage_mismatch_motor',
        message: `Motor (${motorVoltage}V) and controller (${controllerVoltage}V) voltage mismatch`,
        explanation: 'Motor and controller should have matching voltage ratings for optimal performance.',
        severity: 'warning',
      });
    }

    // Current overload check
    const motorMaxCurrent = motor.properties?.maxCurrent || 25;
    const controllerMaxCurrent = controller.properties?.maxCurrent || 25;
    if (motorMaxCurrent > controllerMaxCurrent) {
      warnings.push({
        code: 'current_overload_risk',
        message: `Motor can draw ${motorMaxCurrent}A but controller max is ${controllerMaxCurrent}A`,
        explanation: 'The controller might overheat if the motor demands more current than it can supply.',
        severity: 'warning',
      });
    }
  }

  // Compute e-bike metrics
  if (motor?.installed && metrics.batteryWh) {
    const efficiency = motor.properties?.efficiency || 0.8;
    const riderWeight = context.riderWeight || 60; // kg
    const bikeWeight = metrics.bikeWeight || 15;
    const totalLoad = riderWeight + bikeWeight;
    const whPerKm = totalLoad * 0.015; // rough estimate

    metrics.ebikeRange = Math.round((metrics.batteryWh * efficiency) / whPerKm);
    metrics.ebikeMotorPower = motor.properties?.power || 250;
    metrics.ebikeTopSpeed = motor.properties?.maxSpeed || 25;
    metrics.ebikeEfficiency = efficiency;
  }
}

// ── Plant Battery Chemistry Simulation ───────────────────────────────────────

function runPlantBatterySimulation(graph, errors, warnings, metrics, context) {
  const plantCells = context.plantCells || [];
  const electrode = context.electrode;
  const electrolyte = context.electrolyte;
  const separator = context.separator;

  // Validate chemistry components exist
  if (!electrode) {
    errors.push({
      code: 'no_electrode',
      message: 'No electrode material',
      explanation: 'An electrode stores electrical charge. Carbonize plant fiber or wood to create one. The carbon\'s porous surface holds charge — more surface area means more capacity.',
      severity: 'error',
    });
  }

  if (!electrolyte) {
    errors.push({
      code: 'no_electrolyte',
      message: 'No electrolyte solution',
      explanation: 'An electrolyte carries ions between electrodes, enabling current flow. Dissolve mineral ash (potassium carbonate) in water to create one.',
      severity: 'error',
    });
  }

  if (!separator) {
    errors.push({
      code: 'no_separator',
      message: 'No separator membrane',
      explanation: 'A separator prevents the electrodes from touching (short circuit) while allowing ions to pass. Use plant fiber coated with insulating resin.',
      severity: 'error',
    });
  }

  if (!electrode || !electrolyte || !separator) return;

  // ── Property-driven chemistry checks ──

  // Low conductivity → weak motor output
  const conductivity = electrolyte.properties?.conductivity || 0;
  if (conductivity < 0.15) {
    errors.push({
      code: 'critically_low_conductivity',
      message: `Electrolyte conductivity critically low (${Math.round(conductivity * 100)}%)`,
      explanation: 'The electrolyte can barely carry ions. The motor will not turn. Refine the electrolyte: dissolve more ionic compounds, filter impurities, and dry to concentrate.',
      severity: 'error',
    });
  } else if (conductivity < 0.3) {
    warnings.push({
      code: 'low_conductivity',
      message: `Low electrolyte conductivity (${Math.round(conductivity * 100)}%)`,
      explanation: 'Low conductivity means ions move slowly → less power to the motor. Refine your electrolyte to improve it. Dissolving potassium from ash gives the best results.',
      severity: 'warning',
    });
  }
  metrics.electrolyteConductivity = conductivity;

  // Unstable electrolyte → random failure
  const stability = electrolyte.properties?.stability || 0;
  if (stability < 0.3) {
    errors.push({
      code: 'unstable_electrolyte',
      message: `Electrolyte is unstable (${Math.round(stability * 100)}% stability)`,
      explanation: 'An unstable electrolyte decomposes during use, causing random shutdowns. Chemical side reactions produce gas and reduce performance. Improve purity through filtering and drying.',
      severity: 'error',
    });
  } else if (stability < 0.5) {
    warnings.push({
      code: 'electrolyte_degradation_risk',
      message: `Electrolyte may degrade over time (${Math.round(stability * 100)}% stability)`,
      explanation: 'Moderate stability means the battery will work but lose capacity over cycles. Higher purity and proper pH control improve longevity.',
      severity: 'warning',
    });
  }
  metrics.electrolyteStability = stability;

  // Poor insulation → short circuit
  const dielectric = separator.properties?.dielectric_strength || 0;
  if (dielectric < 0.2) {
    errors.push({
      code: 'short_circuit_risk',
      message: `Separator too weak — high short circuit risk (${Math.round(dielectric * 100)}% insulation)`,
      explanation: 'If electrons can pass through the separator, the electrodes short-circuit: all energy releases at once as heat. This is dangerous. Use a better insulating material — creosote resin or jojoba wax over fiber.',
      severity: 'error',
    });
  } else if (dielectric < 0.4) {
    warnings.push({
      code: 'weak_insulation',
      message: `Separator insulation is marginal (${Math.round(dielectric * 100)}%)`,
      explanation: 'The separator works but might fail under load. Coating fiber with hydrophobic resin improves dielectric strength.',
      severity: 'warning',
    });
  }
  metrics.separatorStrength = dielectric;

  // Low electrode surface area → low capacity
  const surfaceArea = electrode.properties?.surface_area || 0;
  if (surfaceArea < 0.2) {
    warnings.push({
      code: 'low_electrode_surface',
      message: `Low electrode surface area (${Math.round(surfaceArea * 100)}%)`,
      explanation: 'Capacity depends on electrode surface area. Carbonizing at high temperature creates more pores. More pores = more surface = more charge storage.',
      severity: 'warning',
    });
  }
  metrics.electrodeSurfaceArea = surfaceArea;

  // Overheating risk from poor thermal management
  const thermalResistance = separator.properties?.thermal_resistance || 0;
  const electrodeStability = electrode.properties?.stability || 0;
  if (thermalResistance < 0.3 && electrodeStability < 0.4) {
    warnings.push({
      code: 'chemistry_overheating',
      message: 'Overheating risk — poor thermal stability in both separator and electrode',
      explanation: 'Heat breaks down organic compounds. Plant-based materials are especially vulnerable. If both electrode and separator have low thermal stability, the battery may fail from heat buildup during discharge.',
      severity: 'warning',
    });
  }
  metrics.thermalRisk = Math.max(0, 1 - Math.min(thermalResistance, electrodeStability));

  // Compute plant battery metrics
  if (plantCells.length > 0) {
    const config = context.config || { series: 1, parallel: 1 };
    const avgVoltage = plantCells.reduce((s, c) => s + (c.properties?.voltage || 0.8), 0) / plantCells.length;
    const avgCapacity = plantCells.reduce((s, c) => s + (c.properties?.capacity || 100), 0) / plantCells.length;

    metrics.batteryVoltage = config.series * avgVoltage;
    metrics.batteryCapacityMah = config.parallel * avgCapacity;
    metrics.batteryWh = (metrics.batteryVoltage * metrics.batteryCapacityMah) / 1000;
    metrics.batteryConfig = `${config.series}S${config.parallel}P`;
    metrics.plantBased = true;

    // Efficiency penalty from chemistry quality
    const chemistryEfficiency = (conductivity + stability + dielectric) / 3;
    metrics.chemistryEfficiency = Math.round(chemistryEfficiency * 100);
  }
}

// ── Biological Production Simulation ─────────────────────────────────────────

function runBioProductionSimulation(graph, errors, warnings, metrics, context) {
  const organism = context.organism;
  if (!organism) {
    errors.push({
      code: 'no_organism',
      message: 'No engineered organism provided',
      explanation: 'Create an engineered organism first: collect sample → extract DNA → insert genes → create organism in a host (bacteria, yeast, or insect cells).',
      severity: 'error',
    });
    return;
  }

  const p = organism.properties;

  // Contamination check
  if (p.contamination_resistance < 0.3) {
    errors.push({
      code: 'contamination_critical',
      message: `Contamination resistance critically low (${Math.round(p.contamination_resistance * 100)}%)`,
      explanation: 'The organism can\'t resist environmental microbes. Contamination will destroy the culture. Use sterile technique and a clean lab environment (factory upgrade required).',
      severity: 'error',
    });
  } else if (p.contamination_resistance < 0.5) {
    warnings.push({
      code: 'contamination_risk',
      message: `Contamination risk — resistance at ${Math.round(p.contamination_resistance * 100)}%`,
      explanation: 'Moderate contamination risk. Unwanted microbes may compete with your organism, reducing output and introducing unpredictable products.',
      severity: 'warning',
    });
  }

  // Genome stability check
  if (p.stability < 0.2) {
    errors.push({
      code: 'genome_collapse',
      message: `Genome unstable (${Math.round(p.stability * 100)}%) — organism non-viable`,
      explanation: 'Too many modifications or accumulated mutations have destabilized the genome. The organism can\'t maintain its engineered genes. Start fresh with a new construct or reduce gene count.',
      severity: 'error',
    });
  } else if (p.stability < 0.4) {
    warnings.push({
      code: 'genome_drift',
      message: `Genome drifting (${Math.round(p.stability * 100)}% stability)`,
      explanation: 'The engineered genome is accumulating mutations. Over time, production output will shift unpredictably. High mutation rate means the organism is "evolving away" from your design.',
      severity: 'warning',
    });
  }

  // Expression efficiency check
  if (p.expression_efficiency < 0.2) {
    errors.push({
      code: 'expression_failure',
      message: `Expression efficiency too low (${Math.round(p.expression_efficiency * 100)}%)`,
      explanation: 'The organism can barely produce the target proteins. Possible causes: gene incompatibility with host organism, promoter mismatch, or protein misfolding. Try a different host organism — yeast folds proteins better than bacteria.',
      severity: 'error',
    });
  } else if (p.expression_efficiency < 0.4) {
    warnings.push({
      code: 'low_expression',
      message: `Low expression efficiency (${Math.round(p.expression_efficiency * 100)}%)`,
      explanation: 'The organism produces target proteins slowly. Optimize by: using a stronger promoter, reducing gene count, or switching to a more compatible host.',
      severity: 'warning',
    });
  }

  // Mutation rate check
  if (p.mutation_rate > 0.15) {
    errors.push({
      code: 'runaway_mutation',
      message: `Mutation rate dangerously high (${Math.round(p.mutation_rate * 100)}%)`,
      explanation: 'The genome is mutating so fast that engineered traits are being lost. Each generation, random mutations overwrite your inserted genes. Reduce construct complexity or improve DNA stability.',
      severity: 'error',
    });
  } else if (p.mutation_rate > 0.08) {
    warnings.push({
      code: 'elevated_mutation',
      message: `Elevated mutation rate (${Math.round(p.mutation_rate * 100)}%)`,
      explanation: 'Mutations are occurring faster than ideal. Production will gradually shift from designed output. Monitor and re-engineer periodically.',
      severity: 'warning',
    });
  }

  // Growth rate check
  if (p.growth_rate < 0.2) {
    warnings.push({
      code: 'slow_growth',
      message: `Very slow growth (${Math.round(p.growth_rate * 100)}%)`,
      explanation: 'The organism is barely growing. Too many inserted genes may be taxing its resources. Reduce genetic load or provide better growth conditions.',
      severity: 'warning',
    });
  }

  // Compute bio-production metrics
  metrics.bioOrganism = organism.type;
  metrics.bioStability = p.stability;
  metrics.bioExpression = p.expression_efficiency;
  metrics.bioMutationRate = p.mutation_rate;
  metrics.bioProductionRate = p.production_output;
  metrics.bioGeneCount = organism.genes.length;
  metrics.bioGeneration = organism.generation;
  metrics.bioOutputs = organism.productionOutputs?.map((o) => o.label) || [];

  // Integration quality with chemistry pipeline
  if (context.chemistryOutputs) {
    const avgQuality = context.chemistryOutputs.reduce(
      (s, c) => s + (c.properties?.purity || 0.5), 0
    ) / (context.chemistryOutputs.length || 1);
    metrics.bioChemistryIntegration = Math.round(avgQuality * 100);
  }
}

// ── Structure Material Simulation ────────────────────────────────────────────

function runStructureSimulation(graph, errors, warnings, metrics, context) {
  const installed = getInstalledNodes(graph);
  const loadForce = context.loadForce || 0.5;
  const envTemp = context.temperature || 0.3;
  const stressCycles = context.stressCycles || 100;

  let worstIntegrity = 1;
  let totalWeight = 0;

  for (const node of installed) {
    const matId = node.properties?.material;
    if (!matId || !MATERIAL_MAP[matId]) continue;

    const mat = MATERIAL_MAP[matId];
    totalWeight += mat.physical.massPerUnit * (node.properties?.volume || 1);

    // Run full load test
    const result = loadTest(matId, {
      staticLoad: loadForce,
      dynamicLoad: loadForce * 0.6,
      cycles: stressCycles,
      temperature: envTemp,
    }, node.properties?.integrity || 1);

    if (!result.passed) {
      for (const failure of result.failures) {
        const entry = {
          code: `material_${failure.type}`,
          nodeId: node.id,
          message: `${node.properties?.label || node.id} (${mat.label}): ${failure.type}`,
          explanation: failure.explanation,
          severity: failure.type === 'fracture' || failure.type === 'thermal_failure' ? 'error' : 'warning',
        };
        if (entry.severity === 'error') errors.push(entry);
        else warnings.push(entry);
      }
    }

    worstIntegrity = Math.min(worstIntegrity, result.integrity);
  }

  // Thermal expansion check — different materials expand at different rates
  const materialTypes = new Set();
  for (const node of installed) {
    if (node.properties?.material) materialTypes.add(node.properties.material);
  }
  if (materialTypes.size > 1 && envTemp > 0.4) {
    const expansions = [];
    for (const matId of materialTypes) {
      const mat = MATERIAL_MAP[matId];
      if (mat) expansions.push({ id: matId, rate: mat.thermal.expansion });
    }
    const maxDiff = Math.max(...expansions.map((e) => e.rate)) - Math.min(...expansions.map((e) => e.rate));
    if (maxDiff > 0.3) {
      warnings.push({
        code: 'differential_expansion',
        message: 'Materials expand at different rates — joints may fail',
        explanation: 'When different materials are bolted together and heated, they expand by different amounts. This creates stress at the joints. The bigger the difference in thermal expansion coefficients, the higher the risk of cracks or separation.',
        severity: 'warning',
      });
    }
  }

  metrics.structureIntegrity = worstIntegrity;
  metrics.structureWeight = Math.round(totalWeight * 10) / 10;
  metrics.structureLoadCapacity = loadForce;
  metrics.structurePassed = errors.length === 0;
}

// ── Vehicle Material Simulation ──────────────────────────────────────────────

function runVehicleMaterialSimulation(graph, errors, warnings, metrics, context) {
  const installed = getInstalledNodes(graph);
  const speed = context.speed || 0.5;         // 0–1 normalized
  const distance = context.distance || 100;    // km
  const envTemp = context.temperature || 0.4;

  // Vehicle stress scales with speed²
  const dynamicLoad = speed * speed * 0.8;
  const stressCycles = Math.round(distance * 50); // bumps per km

  // Run structure sim with vehicle-specific loads
  runStructureSimulation(graph, errors, warnings, metrics, {
    ...context,
    loadForce: dynamicLoad,
    stressCycles,
    temperature: envTemp + speed * 0.15, // speed generates heat
  });

  // Frame material check
  const frame = graph.nodes.get('frame');
  if (frame?.installed && frame.properties?.material) {
    const mat = MATERIAL_MAP[frame.properties.material];
    if (mat) {
      // Weight → speed tradeoff
      metrics.vehicleWeight = metrics.structureWeight || 0;
      metrics.vehicleSpeedPenalty = Math.max(0, mat.physical.density - 0.5) * 0.3;
      metrics.vehicleComfort = mat.structural.elasticity * 0.7; // flex = comfort

      if (mat.physical.density > 0.7 && speed > 0.7) {
        warnings.push({
          code: 'heavy_at_speed',
          message: `Heavy frame material (${mat.label}) reduces acceleration and climbing`,
          explanation: 'Heavier materials require more energy to accelerate (F = ma). On hills, gravity pulls harder on heavier bikes. The tradeoff: heavy = durable but slow.',
          severity: 'warning',
        });
      }

      if (mat.structural.elasticity < 0.15 && distance > 50) {
        warnings.push({
          code: 'rigid_long_ride',
          message: `Rigid frame (${mat.label}) transfers all road vibration to the rider`,
          explanation: 'Low elasticity means the frame doesn\'t flex to absorb bumps. Over long distances, this causes rider fatigue. Elastic materials (aluminum, carbon fiber) absorb vibration.',
          severity: 'warning',
        });
      }
    }
  }

  // Tire material check
  for (const wheelId of ['front_wheel', 'rear_wheel']) {
    const wheel = graph.nodes.get(wheelId);
    if (wheel?.installed && wheel.properties?.tireMaterial) {
      const tireMat = MATERIAL_MAP[wheel.properties.tireMaterial];
      if (tireMat && tireMat.structural.elasticity < 0.5) {
        warnings.push({
          code: 'hard_tires',
          nodeId: wheelId,
          message: `Tire material too rigid (${tireMat.label}) — poor grip and harsh ride`,
          explanation: 'Tires need high elasticity to conform to the road surface and absorb bumps. Rigid tires slip on corners and transmit every crack to the rider.',
          severity: 'warning',
        });
      }
    }
  }

  metrics.vehicleSpeed = speed;
  metrics.vehicleRange = distance;
}

// ── Watercraft Simulation ────────────────────────────────────────────────────

function runWatercraftSimulation(graph, errors, warnings, metrics, context) {
  const installed = getInstalledNodes(graph);
  const fluidDensity = context.fluidDensity || 0.12; // water ~1.0 g/cm³ normalized
  const cargo = context.cargoMass || 0;
  const cargoOffset = context.cargoOffset || 0;

  // Find hull material
  const hull = installed.find((n) => n.properties?.role === 'hull');
  const hullMat = hull?.properties?.material ? MATERIAL_MAP[hull.properties.material] : null;

  if (!hull) {
    errors.push({
      code: 'no_hull',
      message: 'No hull — watercraft needs a hull',
      explanation: 'A watercraft requires a hull to displace water. The hull\'s density must be less than water\'s density for it to float (Archimedes\' principle).',
      severity: 'error',
    });
    return;
  }

  // Buoyancy check
  const volume = hull.properties?.volume || 1;
  const buoyResult = computeBuoyancy(
    hull.properties.material || 'mesquite_wood',
    volume,
    fluidDensity,
    cargo,
    cargoOffset
  );

  metrics.buoyancy = buoyResult;

  if (!buoyResult.floats) {
    errors.push({
      code: 'sinks',
      message: `Hull sinks! Material too dense (${r(hullMat?.physical?.density || 0)}) for the load`,
      explanation: buoyResult.explanation,
      severity: 'error',
    });
  }

  if (buoyResult.capsizeRisk > 0.7) {
    errors.push({
      code: 'capsize',
      message: `Capsizing imminent! Tilt: ${buoyResult.tiltAngle}°`,
      explanation: buoyResult.explanation,
      severity: 'error',
    });
  } else if (buoyResult.capsizeRisk > 0.3) {
    warnings.push({
      code: 'tilt_warning',
      message: `Craft tilting (${buoyResult.tiltAngle}°) — redistribute cargo`,
      explanation: 'Uneven weight distribution shifts the center of gravity away from the center of buoyancy. Redistribute cargo to center to stabilize.',
      severity: 'warning',
    });
  }

  // Coating check: hull needs waterproofing
  const hasCoating = hull.properties?.coating;
  if (!hasCoating && hullMat?.category === 'wood') {
    warnings.push({
      code: 'no_waterproofing',
      message: 'Wood hull without waterproof coating — will absorb water and sink over time',
      explanation: 'Wood is porous. Without a coating (resin, wax, or paint), water wicks into the wood via capillary action, increasing weight until the craft sinks. Apply a hydrophobic coating.',
      severity: 'warning',
    });
  }

  // Surfactant in water reduces drag
  if (context.surfactantPresent) {
    metrics.dragReduction = 0.15;
    warnings.push({
      code: 'surfactant_spill',
      message: 'Surfactant in water — drag reduced by 15% but aquatic ecology impacted',
      explanation: 'Surfactant reduces water surface tension, decreasing drag on the hull. But it also disrupts aquatic ecosystems by breaking the surface film that insects rely on.',
      severity: 'warning',
    });
  }

  metrics.watercraftFloats = buoyResult.floats;
  metrics.watercraftSubmersion = buoyResult.submersion;
  metrics.watercraftStable = buoyResult.capsizeRisk < 0.3;
}

function r(v) { return Math.round(v * 100) / 100; }

// ── Score Computation ────────────────────────────────────────────────────────

function computeScore(graph, errors, warnings, metrics) {
  let score = 100;

  // Errors are severe
  score -= errors.length * 20;

  // Warnings are minor
  score -= warnings.length * 5;

  // Bonus for completeness
  const installed = getInstalledNodes(graph);
  const total = graph.nodes.size;
  if (total > 0) {
    const completeness = installed.length / total;
    score += completeness * 10;
  }

  // Bonus for good battery health
  if (metrics.batteryHealth) {
    score += metrics.batteryHealth * 5;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ── Convenience ──────────────────────────────────────────────────────────────

/**
 * Quick check: is a bike rideable?
 */
export function isBikeRideable(graph) {
  const result = simulate(graph, 'bike');
  return result.success;
}

/**
 * Quick check: is a battery safe?
 */
export function isBatterySafe(graph) {
  const result = simulate(graph, 'battery');
  return result.errors.filter((e) =>
    ['overvoltage', 'overheating_risk', 'short_circuit'].includes(e.code)
  ).length === 0;
}

/**
 * Get a human-readable summary of simulation results.
 */
export function getResultSummary(result) {
  if (result.success && result.warnings.length === 0) {
    return { emoji: '✅', text: 'System OK! All checks passed.', level: 'success' };
  }
  if (result.success) {
    return { emoji: '⚠️', text: `Working but ${result.warnings.length} warning(s).`, level: 'warning' };
  }
  return { emoji: '❌', text: `${result.errors.length} error(s) found. Fix them to continue.`, level: 'error' };
}
