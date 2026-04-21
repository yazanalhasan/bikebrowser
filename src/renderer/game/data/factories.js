/**
 * Factory Definitions — friend houses that become production facilities.
 *
 * Each friend can host one factory type. Factories produce materials
 * and components that feed into bike repair, battery construction,
 * and e-bike assembly.
 *
 * Unlock requirements: reputation threshold + quest completion.
 * Upgrade path: level 1→3, each level boosts output and unlocks new products.
 */

// ── Friend Definitions ───────────────────────────────────────────────────────

export const FRIENDS = {
  zevon: {
    id: 'zevon',
    name: 'Zevon',
    emoji: '😎',
    description: 'Creative and hands-on. Works with fiber, rubber, and structural materials from plants.',
    defaultFactory: 'rubber_workshop',
    chemistryRole: 'fiber_processor',
    unlockRequirements: { reputation: 5, quest: null },
  },
  jacob: {
    id: 'jacob',
    name: 'Jacob',
    emoji: '💪',
    description: 'Runs the kiln. Carbonizes wood into electrode material. Burns ash for electrolyte minerals.',
    defaultFactory: 'metal_shop',
    chemistryRole: 'kiln_operator',
    unlockRequirements: { reputation: 10, quest: 'flat_tire_repair' },
  },
  charlie: {
    id: 'charlie',
    name: 'Charlie',
    emoji: '🤓',
    description: 'Electronics and wiring. Builds controllers and integrates electrical systems.',
    defaultFactory: 'electronics_bench',
    chemistryRole: 'electronics_specialist',
    unlockRequirements: { reputation: 20, quest: 'chain_repair' },
  },
  cole: {
    id: 'cole',
    name: 'Cole',
    emoji: '⚡',
    description: 'Battery chemist. Assembles plant-derived cells, integrates electrolyte + electrode.',
    defaultFactory: 'battery_lab',
    chemistryRole: 'battery_chemist',
    unlockRequirements: { reputation: 30, quest: 'desert_survival' },
  },
  james: {
    id: 'james',
    name: 'James',
    emoji: '🔧',
    description: 'Refinement expert. Filters, dries, and purifies chemicals to improve conductivity and stability.',
    defaultFactory: 'assembly_garage',
    chemistryRole: 'refiner',
    unlockRequirements: { reputation: 40, quest: 'food_chain_tracker' },
  },
};

// ── Factory Types ────────────────────────────────────────────────────────────

export const FACTORY_TYPES = {
  rubber_workshop: {
    id: 'rubber_workshop',
    label: 'Rubber Workshop',
    emoji: '🏭',
    description: 'Produces tire materials, tubing, and rubber components.',
    levels: [
      {
        level: 1,
        productionRate: 1,
        inputs: ['raw_rubber'],
        outputs: ['tire_material', 'inner_tube_material'],
        upgradeCost: { zuzubucks: 0 },
      },
      {
        level: 2,
        productionRate: 2,
        inputs: ['raw_rubber'],
        outputs: ['tire_material', 'inner_tube_material', 'brake_pads'],
        upgradeCost: { zuzubucks: 50, materials: { scrap_rubber: 5 } },
      },
      {
        level: 3,
        productionRate: 3,
        inputs: ['raw_rubber', 'fiber'],
        outputs: ['tire_material', 'inner_tube_material', 'brake_pads', 'insulation'],
        upgradeCost: { zuzubucks: 120, materials: { scrap_rubber: 10, fiber: 5 } },
      },
    ],
  },

  metal_shop: {
    id: 'metal_shop',
    label: 'Metal Shop',
    emoji: '🔨',
    description: 'Produces frames, brackets, and metal structural parts.',
    levels: [
      {
        level: 1,
        productionRate: 1,
        inputs: ['scrap_metal'],
        outputs: ['steel_tubing', 'brackets'],
        upgradeCost: { zuzubucks: 0 },
      },
      {
        level: 2,
        productionRate: 2,
        inputs: ['scrap_metal'],
        outputs: ['steel_tubing', 'brackets', 'frame_components'],
        upgradeCost: { zuzubucks: 75, materials: { scrap_metal: 8 } },
      },
      {
        level: 3,
        productionRate: 3,
        inputs: ['scrap_metal', 'aluminum'],
        outputs: ['steel_tubing', 'brackets', 'frame_components', 'nickel_strip'],
        upgradeCost: { zuzubucks: 150, materials: { scrap_metal: 15 } },
      },
    ],
  },

  electronics_bench: {
    id: 'electronics_bench',
    label: 'Electronics Bench',
    emoji: '🔌',
    description: 'Produces controllers, wiring harnesses, and sensors.',
    levels: [
      {
        level: 1,
        productionRate: 1,
        inputs: ['copper_wire', 'components'],
        outputs: ['wiring_harness', 'basic_sensor'],
        upgradeCost: { zuzubucks: 0 },
      },
      {
        level: 2,
        productionRate: 2,
        inputs: ['copper_wire', 'components', 'circuit_boards'],
        outputs: ['wiring_harness', 'basic_sensor', 'motor_controller_kit'],
        upgradeCost: { zuzubucks: 100, materials: { copper_wire: 10 } },
      },
      {
        level: 3,
        productionRate: 3,
        inputs: ['copper_wire', 'components', 'circuit_boards'],
        outputs: ['wiring_harness', 'basic_sensor', 'motor_controller_kit', 'display_unit'],
        upgradeCost: { zuzubucks: 200, materials: { copper_wire: 20, components: 10 } },
      },
    ],
  },

  battery_lab: {
    id: 'battery_lab',
    label: 'Battery Lab',
    emoji: '🔋',
    description: 'Produces cells, BMS modules, and battery packs.',
    levels: [
      {
        level: 1,
        productionRate: 1,
        inputs: ['lithium_cell', 'nickel_strip'],
        outputs: ['tested_cell', 'cell_holder'],
        upgradeCost: { zuzubucks: 0 },
      },
      {
        level: 2,
        productionRate: 2,
        inputs: ['lithium_cell', 'nickel_strip', 'copper_wire'],
        outputs: ['tested_cell', 'cell_holder', 'bms_module'],
        upgradeCost: { zuzubucks: 120, materials: { lithium_cell: 5, nickel_strip: 10 } },
      },
      {
        level: 3,
        productionRate: 3,
        inputs: ['lithium_cell', 'nickel_strip', 'copper_wire', 'casing_material'],
        outputs: ['tested_cell', 'cell_holder', 'bms_module', 'battery_pack_kit'],
        upgradeCost: { zuzubucks: 250, materials: { lithium_cell: 10, casing_material: 3 } },
      },
    ],
  },

  assembly_garage: {
    id: 'assembly_garage',
    label: 'Assembly Garage',
    emoji: '🏗️',
    description: 'Assembles finished components from sub-parts.',
    levels: [
      {
        level: 1,
        productionRate: 1,
        inputs: ['frame_components', 'tire_material'],
        outputs: ['wheel_assembly', 'brake_assembly'],
        upgradeCost: { zuzubucks: 0 },
      },
      {
        level: 2,
        productionRate: 2,
        inputs: ['frame_components', 'tire_material', 'wiring_harness'],
        outputs: ['wheel_assembly', 'brake_assembly', 'drivetrain_assembly'],
        upgradeCost: { zuzubucks: 100, materials: { frame_components: 3, tire_material: 5 } },
      },
      {
        level: 3,
        productionRate: 3,
        inputs: ['frame_components', 'tire_material', 'wiring_harness', 'motor_controller_kit'],
        outputs: ['wheel_assembly', 'brake_assembly', 'drivetrain_assembly', 'ebike_conversion_kit'],
        upgradeCost: { zuzubucks: 300, materials: { frame_components: 5 } },
      },
    ],
  },
};

// ── Chemistry Processing Capabilities ────────────────────────────────────────

/**
 * Maps factory chemistry roles to the refinement methods they can perform.
 * This integrates factories into the chemistry pipeline.
 */
export const FACTORY_CHEMISTRY = {
  fiber_processor: {
    label: 'Fiber Processing',
    canExtractFrom: ['agave', 'yucca'],
    refinementMethods: ['filtering', 'drying'],
    chemistryOutputs: ['fiber', 'surfactant'],
    explanation: 'Processes plant fibers into structural materials and extracts surfactants from roots.',
  },
  kiln_operator: {
    label: 'Kiln & Furnace',
    canExtractFrom: ['mesquite', 'creosote'],
    refinementMethods: ['heating', 'carbonizing'],
    chemistryOutputs: ['carbon', 'electrolyte'],
    explanation: 'Burns wood into carbon electrodes. Produces mineral ash for electrolyte base. The kiln reaches temperatures that break organic bonds, leaving pure carbon behind.',
  },
  electronics_specialist: {
    label: 'Electronics Lab',
    canExtractFrom: [],
    refinementMethods: [],
    chemistryOutputs: [],
    explanation: 'Doesn\'t process raw chemistry, but integrates finished electrical components into systems.',
  },
  battery_chemist: {
    label: 'Battery Chemistry Lab',
    canExtractFrom: ['barrel_cactus', 'prickly_pear'],
    refinementMethods: ['dissolving', 'combining'],
    chemistryOutputs: ['electrolyte', 'binder'],
    explanation: 'Assembles battery cells from electrode, electrolyte, and separator. Can dissolve minerals and combine chemicals for better electrolyte formulations.',
  },
  refiner: {
    label: 'Refinement Plant',
    canExtractFrom: ['jojoba', 'creosote'],
    refinementMethods: ['filtering', 'drying', 'heating'],
    chemistryOutputs: ['insulator', 'organic'],
    explanation: 'Purifies raw extracts through filtering, drying, and gentle heating. Higher purity = better conductivity, stability, and performance.',
  },
};

// ── Biological Factory Extensions ────────────────────────────────────────────

/**
 * Biology-capable factory upgrades. When a friend's factory reaches
 * level 3, they can unlock a biology specialization.
 */
export const FACTORY_BIOLOGY = {
  battery_chemist: {
    bioUpgrade: 'bio_lab',
    label: 'Bio-Battery Lab',
    icon: '🧬',
    bioCapabilities: ['sample_processing', 'organism_hosting', 'bio_electrolyte_production'],
    organismCapacity: 2,   // max simultaneous organisms
    sterileRating: 0.6,
    description: 'Cole\'s lab gains sterile culture capability. Can host engineered organisms that produce battery chemicals biologically.',
  },
  refiner: {
    bioUpgrade: 'fermentation_lab',
    label: 'Fermentation Lab',
    icon: '🍺',
    bioCapabilities: ['fermentation', 'protein_purification', 'scale_production'],
    organismCapacity: 3,
    sterileRating: 0.7,
    description: 'James adds fermentation tanks and protein purification columns. Scale biological production to factory quantities.',
  },
  electronics_specialist: {
    bioUpgrade: 'gene_control_lab',
    label: 'Gene Control Systems Lab',
    icon: '🔬',
    bioCapabilities: ['gene_sequencing', 'construct_design', 'expression_optimization'],
    organismCapacity: 1,
    sterileRating: 0.8,
    description: 'Charlie builds genetic circuit design tools. Improves construct stability and expression efficiency through computational optimization.',
  },
};
