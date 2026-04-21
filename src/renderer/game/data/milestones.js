/**
 * Milestone Definitions — full progression tree from bicycle to planetary engineering.
 *
 * Each milestone has:
 *   id           — unique key, stored in save data
 *   name         — display name
 *   description  — what the player accomplished
 *   category     — mechanical | physics | chemistry | biology | space | ecology | engineering
 *   phase        — 1–10 (bicycle → planetary engineering)
 *   conditions   — array of checks against game state
 *   rewards      — what completing this milestone grants
 *   dependencies — milestone IDs that must be completed first
 *
 * Condition types:
 *   quest      — { type: 'quest', target: 'quest_id' }
 *   craft      — { type: 'craft', target: 'recipe_id' }
 *   collect    — { type: 'collect', target: 'item_id', value: count }
 *   build      — { type: 'build', target: 'build_key' }  (non-null in state.builds)
 *   reputation — { type: 'reputation', value: threshold }
 *   skill      — { type: 'skill', target: 'skill_id', value: level }
 *   knowledge  — { type: 'knowledge', target: 'concept_id' }
 *   material   — { type: 'material', target: 'material_id', value: count }
 *   milestone  — { type: 'milestone', target: 'milestone_id' }  (alias for dependency)
 *   bio        — { type: 'bio', target: 'samples|extracted|constructs|organisms', value: count }
 *
 * Reward types:
 *   unlock     — { type: 'unlock', target: 'system_or_feature_id' }
 *   item       — { type: 'item', target: 'item_id' }
 *   skill      — { type: 'skill', target: 'skill_id', value: amount }
 *   knowledge  — { type: 'knowledge', target: 'concept_id' }
 *   era        — { type: 'era', target: 'era_id' }
 *   zone       — { type: 'zone', target: 'zone_id' }
 */

const MILESTONES = [

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 1 — BICYCLE (Foundations)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'ms_first_repair',
    name: 'First Repair',
    description: 'Complete your first bike repair and earn a neighbor\'s trust.',
    category: 'mechanical',
    phase: 1,
    conditions: [
      { type: 'quest', target: 'flat_tire_repair' },
    ],
    rewards: [
      { type: 'skill', target: 'mechanic', value: 1 },
      { type: 'unlock', target: 'tool_upgrades' },
    ],
    dependencies: [],
  },
  {
    id: 'ms_chain_master',
    name: 'Chain Master',
    description: 'Understand drivetrain mechanics by fixing a slipped chain.',
    category: 'mechanical',
    phase: 1,
    conditions: [
      { type: 'quest', target: 'chain_repair' },
    ],
    rewards: [
      { type: 'skill', target: 'mechanic', value: 1 },
      { type: 'knowledge', target: 'torque' },
    ],
    dependencies: [],
  },
  {
    id: 'ms_tool_collector',
    name: 'Tool Collector',
    description: 'Gather essential bike repair tools.',
    category: 'mechanical',
    phase: 1,
    conditions: [
      { type: 'collect', target: 'tire_lever', value: 1 },
      { type: 'collect', target: 'patch_kit', value: 1 },
      { type: 'collect', target: 'wrench', value: 1 },
      { type: 'collect', target: 'chain_lube', value: 1 },
    ],
    rewards: [
      { type: 'skill', target: 'tools', value: 1 },
    ],
    dependencies: [],
  },
  {
    id: 'ms_neighborhood_hero',
    name: 'Neighborhood Hero',
    description: 'Earn the trust of your neighbors through repairs and kindness.',
    category: 'mechanical',
    phase: 1,
    conditions: [
      { type: 'reputation', value: 20 },
      { type: 'milestone', target: 'ms_first_repair' },
      { type: 'milestone', target: 'ms_chain_master' },
    ],
    rewards: [
      { type: 'unlock', target: 'advanced_zones' },
      { type: 'zone', target: 'desert_trail' },
      { type: 'era', target: 'era_1_bikes' },
    ],
    dependencies: ['ms_first_repair', 'ms_chain_master'],
  },
  {
    id: 'ms_motion_basics',
    name: 'Motion Basics',
    description: 'Understand distance, speed, and how wheels convert rotation to travel.',
    category: 'physics',
    phase: 1,
    conditions: [
      { type: 'knowledge', target: 'tire_pressure' },
      { type: 'knowledge', target: 'torque' },
    ],
    rewards: [
      { type: 'unlock', target: 'physics_challenges' },
    ],
    dependencies: ['ms_first_repair', 'ms_chain_master'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 2 — E-BIKE (Electrical Systems)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'ms_plant_chemist',
    name: 'Plant Chemist',
    description: 'Extract useful chemicals from desert plants.',
    category: 'chemistry',
    phase: 2,
    conditions: [
      { type: 'quest', target: 'desert_healer' },
      { type: 'craft', target: 'healing_salve' },
    ],
    rewards: [
      { type: 'skill', target: 'chemistry', value: 1 },
      { type: 'unlock', target: 'plant_extraction' },
    ],
    dependencies: ['ms_first_repair'],
  },
  {
    id: 'ms_primitive_electrolyte',
    name: 'Primitive Electrolyte',
    description: 'Create an electrolyte solution from plant-derived acids.',
    category: 'chemistry',
    phase: 2,
    conditions: [
      { type: 'quest', target: 'desert_survival' },
      { type: 'milestone', target: 'ms_plant_chemist' },
    ],
    rewards: [
      { type: 'unlock', target: 'battery_lab' },
    ],
    dependencies: ['ms_plant_chemist'],
  },
  {
    id: 'ms_first_battery',
    name: 'First Battery Cell',
    description: 'Assemble a working battery cell from raw materials.',
    category: 'engineering',
    phase: 2,
    conditions: [
      { type: 'quest', target: 'toxic_knowledge' },
      { type: 'milestone', target: 'ms_primitive_electrolyte' },
    ],
    rewards: [
      { type: 'skill', target: 'electrical', value: 1 },
      { type: 'unlock', target: 'motor_assembly' },
    ],
    dependencies: ['ms_primitive_electrolyte'],
  },
  {
    id: 'ms_motor_integration',
    name: 'Motor Integration',
    description: 'Connect a motor to a battery and controller for powered movement.',
    category: 'engineering',
    phase: 2,
    conditions: [
      { type: 'quest', target: 'engineer_bacteria' },
      { type: 'milestone', target: 'ms_first_battery' },
    ],
    rewards: [
      { type: 'skill', target: 'electrical', value: 1 },
      { type: 'unlock', target: 'ebike_assembly' },
    ],
    dependencies: ['ms_first_battery'],
  },
  {
    id: 'ms_ebike_complete',
    name: 'E-Bike Engineer',
    description: 'Build a complete electric bicycle — pedals + motor + battery.',
    category: 'engineering',
    phase: 2,
    conditions: [
      { type: 'quest', target: 'bio_battery_integration' },
      { type: 'milestone', target: 'ms_motor_integration' },
    ],
    rewards: [
      { type: 'era', target: 'era_3_ebikes' },
      { type: 'unlock', target: 'trails' },
      { type: 'skill', target: 'engineering', value: 2 },
    ],
    dependencies: ['ms_motor_integration', 'ms_neighborhood_hero'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 3 — MOTORCYCLE (Combustion & Thermodynamics)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'ms_fuel_basics',
    name: 'Fuel Basics',
    description: 'Understand how chemical energy converts to mechanical motion.',
    category: 'chemistry',
    phase: 3,
    conditions: [
      { type: 'knowledge', target: 'thermal_expansion' },
      { type: 'milestone', target: 'ms_ebike_complete' },
    ],
    rewards: [
      { type: 'unlock', target: 'fuel_refining' },
    ],
    dependencies: ['ms_ebike_complete'],
  },
  {
    id: 'ms_engine_components',
    name: 'Engine Components',
    description: 'Build pistons, cylinders, and a crankshaft for a combustion engine.',
    category: 'mechanical',
    phase: 3,
    conditions: [
      { type: 'milestone', target: 'ms_fuel_basics' },
      { type: 'skill', target: 'mechanic', value: 3 },
    ],
    rewards: [
      { type: 'skill', target: 'engines', value: 1 },
      { type: 'unlock', target: 'drivetrain_assembly' },
    ],
    dependencies: ['ms_fuel_basics'],
  },
  {
    id: 'ms_drivetrain',
    name: 'Drivetrain Assembly',
    description: 'Connect engine to wheels through gears, chain, and clutch.',
    category: 'mechanical',
    phase: 3,
    conditions: [
      { type: 'milestone', target: 'ms_engine_components' },
      { type: 'knowledge', target: 'torque' },
    ],
    rewards: [
      { type: 'skill', target: 'engines', value: 1 },
    ],
    dependencies: ['ms_engine_components'],
  },
  {
    id: 'ms_motorcycle_complete',
    name: 'Motorcycle Builder',
    description: 'A working motorcycle — combustion engine, suspension, and speed.',
    category: 'engineering',
    phase: 3,
    conditions: [
      { type: 'milestone', target: 'ms_drivetrain' },
      { type: 'reputation', value: 200 },
    ],
    rewards: [
      { type: 'era', target: 'era_4_motorcycles' },
      { type: 'unlock', target: 'highways' },
      { type: 'skill', target: 'engineering', value: 2 },
    ],
    dependencies: ['ms_drivetrain'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 4 — CAR (System Integration)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'ms_suspension_system',
    name: 'Suspension System',
    description: 'Design a suspension that absorbs bumps and keeps wheels on the ground.',
    category: 'mechanical',
    phase: 4,
    conditions: [
      { type: 'milestone', target: 'ms_motorcycle_complete' },
      { type: 'knowledge', target: 'stress_strain' },
    ],
    rewards: [
      { type: 'skill', target: 'engineering', value: 1 },
    ],
    dependencies: ['ms_motorcycle_complete'],
  },
  {
    id: 'ms_braking_system',
    name: 'Braking System',
    description: 'Build brakes that convert kinetic energy to heat safely.',
    category: 'physics',
    phase: 4,
    conditions: [
      { type: 'milestone', target: 'ms_motorcycle_complete' },
      { type: 'knowledge', target: 'stress_strain' },
    ],
    rewards: [
      { type: 'skill', target: 'engineering', value: 1 },
    ],
    dependencies: ['ms_motorcycle_complete'],
  },
  {
    id: 'ms_aerodynamics_intro',
    name: 'Aerodynamics Introduction',
    description: 'Shape a car body to reduce air resistance.',
    category: 'physics',
    phase: 4,
    conditions: [
      { type: 'milestone', target: 'ms_suspension_system' },
      { type: 'milestone', target: 'ms_braking_system' },
    ],
    rewards: [
      { type: 'unlock', target: 'wind_tunnel' },
    ],
    dependencies: ['ms_suspension_system', 'ms_braking_system'],
  },
  {
    id: 'ms_car_complete',
    name: 'Car Builder',
    description: 'A multi-system vehicle — engine, suspension, brakes, body, and steering.',
    category: 'engineering',
    phase: 4,
    conditions: [
      { type: 'milestone', target: 'ms_aerodynamics_intro' },
      { type: 'reputation', value: 400 },
    ],
    rewards: [
      { type: 'era', target: 'era_5_cars' },
      { type: 'unlock', target: 'towns' },
      { type: 'skill', target: 'logistics', value: 1 },
    ],
    dependencies: ['ms_aerodynamics_intro'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 5 — BOAT (Fluid Dynamics)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'ms_buoyancy',
    name: 'Buoyancy Mastery',
    description: 'Understand why things float and design a hull that displaces water.',
    category: 'physics',
    phase: 5,
    conditions: [
      { type: 'quest', target: 'boat_puzzle' },
      { type: 'knowledge', target: 'buoyancy' },
    ],
    rewards: [
      { type: 'unlock', target: 'hull_design' },
    ],
    dependencies: ['ms_neighborhood_hero'],
  },
  {
    id: 'ms_hull_design',
    name: 'Hull Design',
    description: 'Shape a hull for stability and speed through water.',
    category: 'engineering',
    phase: 5,
    conditions: [
      { type: 'milestone', target: 'ms_buoyancy' },
      { type: 'knowledge', target: 'surfactants_interfaces' },
    ],
    rewards: [
      { type: 'skill', target: 'water_craft', value: 1 },
    ],
    dependencies: ['ms_buoyancy'],
  },
  {
    id: 'ms_water_propulsion',
    name: 'Water Propulsion',
    description: 'Build a propeller or paddle system that pushes against water.',
    category: 'mechanical',
    phase: 5,
    conditions: [
      { type: 'milestone', target: 'ms_hull_design' },
      { type: 'milestone', target: 'ms_motion_basics' },
    ],
    rewards: [
      { type: 'skill', target: 'water_craft', value: 1 },
    ],
    dependencies: ['ms_hull_design'],
  },
  {
    id: 'ms_boat_complete',
    name: 'Boat Builder',
    description: 'A seaworthy vessel — hull, propulsion, and navigation.',
    category: 'engineering',
    phase: 5,
    conditions: [
      { type: 'milestone', target: 'ms_water_propulsion' },
      { type: 'reputation', value: 50 },
    ],
    rewards: [
      { type: 'era', target: 'era_2_boats' },
      { type: 'unlock', target: 'docks' },
      { type: 'zone', target: 'lake' },
    ],
    dependencies: ['ms_water_propulsion'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 6 — FLIGHT (Aerodynamics)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'ms_wing_construction',
    name: 'Wing Construction',
    description: 'Build an airfoil that generates lift from moving air.',
    category: 'physics',
    phase: 6,
    conditions: [
      { type: 'milestone', target: 'ms_car_complete' },
      { type: 'milestone', target: 'ms_aerodynamics_intro' },
    ],
    rewards: [
      { type: 'unlock', target: 'wing_testing' },
    ],
    dependencies: ['ms_car_complete'],
  },
  {
    id: 'ms_lift_calculations',
    name: 'Lift Calculations',
    description: 'Calculate the wing area and speed needed to achieve flight.',
    category: 'physics',
    phase: 6,
    conditions: [
      { type: 'milestone', target: 'ms_wing_construction' },
      { type: 'skill', target: 'engineering', value: 4 },
    ],
    rewards: [
      { type: 'skill', target: 'flight', value: 1 },
    ],
    dependencies: ['ms_wing_construction'],
  },
  {
    id: 'ms_flight_propulsion',
    name: 'Flight Propulsion',
    description: 'Optimize a propulsion system to overcome drag at flight speed.',
    category: 'engineering',
    phase: 6,
    conditions: [
      { type: 'milestone', target: 'ms_lift_calculations' },
      { type: 'milestone', target: 'ms_fuel_basics' },
    ],
    rewards: [
      { type: 'skill', target: 'flight', value: 1 },
      { type: 'unlock', target: 'navigation' },
    ],
    dependencies: ['ms_lift_calculations'],
  },
  {
    id: 'ms_plane_complete',
    name: 'Plane Builder',
    description: 'Take to the skies — wings, engine, controls, and navigation.',
    category: 'engineering',
    phase: 6,
    conditions: [
      { type: 'milestone', target: 'ms_flight_propulsion' },
      { type: 'reputation', value: 800 },
    ],
    rewards: [
      { type: 'era', target: 'era_6_planes' },
      { type: 'unlock', target: 'airways' },
      { type: 'zone', target: 'islands' },
    ],
    dependencies: ['ms_flight_propulsion'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 7 — SPACE (Advanced Physics)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'ms_rocket_propulsion',
    name: 'Rocket Propulsion',
    description: 'Build a reaction engine — thrust without air.',
    category: 'physics',
    phase: 7,
    conditions: [
      { type: 'milestone', target: 'ms_plane_complete' },
      { type: 'skill', target: 'engines', value: 3 },
    ],
    rewards: [
      { type: 'unlock', target: 'rocket_lab' },
    ],
    dependencies: ['ms_plane_complete'],
  },
  {
    id: 'ms_fuel_optimization',
    name: 'Fuel Optimization',
    description: 'Maximize specific impulse — more thrust per kilogram of fuel.',
    category: 'chemistry',
    phase: 7,
    conditions: [
      { type: 'milestone', target: 'ms_rocket_propulsion' },
      { type: 'skill', target: 'chemistry', value: 3 },
    ],
    rewards: [
      { type: 'skill', target: 'space_systems', value: 1 },
    ],
    dependencies: ['ms_rocket_propulsion'],
  },
  {
    id: 'ms_orbital_mechanics',
    name: 'Orbital Mechanics',
    description: 'Calculate orbits — when falling sideways is fast enough to miss the ground.',
    category: 'physics',
    phase: 7,
    conditions: [
      { type: 'milestone', target: 'ms_fuel_optimization' },
    ],
    rewards: [
      { type: 'skill', target: 'space_systems', value: 1 },
      { type: 'unlock', target: 'orbit_simulator' },
    ],
    dependencies: ['ms_fuel_optimization'],
  },
  {
    id: 'ms_spacecraft_complete',
    name: 'Spacecraft Builder',
    description: 'Reach orbit — rocket, fuel, guidance, and life support.',
    category: 'engineering',
    phase: 7,
    conditions: [
      { type: 'milestone', target: 'ms_orbital_mechanics' },
      { type: 'reputation', value: 1500 },
    ],
    rewards: [
      { type: 'era', target: 'era_7_space' },
      { type: 'unlock', target: 'space' },
      { type: 'zone', target: 'orbit' },
    ],
    dependencies: ['ms_orbital_mechanics'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 8 — CHEMISTRY (Refinement & Materials)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'ms_solvent_extraction',
    name: 'Solvent Extraction',
    description: 'Use solvents to isolate pure compounds from plant mixtures.',
    category: 'chemistry',
    phase: 8,
    conditions: [
      { type: 'milestone', target: 'ms_plant_chemist' },
      { type: 'quest', target: 'desert_survival' },
    ],
    rewards: [
      { type: 'skill', target: 'chemistry', value: 1 },
      { type: 'unlock', target: 'distillation' },
    ],
    dependencies: ['ms_plant_chemist'],
  },
  {
    id: 'ms_electrolyte_optimization',
    name: 'Electrolyte Optimization',
    description: 'Tune pH, concentration, and additives for maximum conductivity.',
    category: 'chemistry',
    phase: 8,
    conditions: [
      { type: 'milestone', target: 'ms_solvent_extraction' },
      { type: 'milestone', target: 'ms_primitive_electrolyte' },
    ],
    rewards: [
      { type: 'skill', target: 'chemistry', value: 1 },
    ],
    dependencies: ['ms_solvent_extraction'],
  },
  {
    id: 'ms_material_synthesis',
    name: 'Material Synthesis',
    description: 'Create new materials by combining elements under controlled conditions.',
    category: 'chemistry',
    phase: 8,
    conditions: [
      { type: 'milestone', target: 'ms_electrolyte_optimization' },
      { type: 'quest', target: 'perfect_composite' },
    ],
    rewards: [
      { type: 'unlock', target: 'advanced_materials' },
      { type: 'skill', target: 'chemistry', value: 2 },
    ],
    dependencies: ['ms_electrolyte_optimization'],
  },
  {
    id: 'ms_advanced_materials',
    name: 'Advanced Materials',
    description: 'Master composites, alloys, and ceramics for extreme environments.',
    category: 'chemistry',
    phase: 8,
    conditions: [
      { type: 'milestone', target: 'ms_material_synthesis' },
      { type: 'quest', target: 'heat_failure' },
    ],
    rewards: [
      { type: 'unlock', target: 'extreme_engineering' },
    ],
    dependencies: ['ms_material_synthesis'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 9 — BIOLOGY (Life Systems)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'ms_dna_extraction',
    name: 'DNA Extraction',
    description: 'Extract DNA from desert organisms and read the code of life.',
    category: 'biology',
    phase: 9,
    conditions: [
      { type: 'quest', target: 'extract_dna' },
      { type: 'bio', target: 'extracted', value: 1 },
    ],
    rewards: [
      { type: 'skill', target: 'biology', value: 1 },
      { type: 'unlock', target: 'gene_analysis' },
    ],
    dependencies: ['ms_plant_chemist'],
  },
  {
    id: 'ms_cell_analysis',
    name: 'Cell Analysis',
    description: 'Understand cell structure — membrane, nucleus, organelles.',
    category: 'biology',
    phase: 9,
    conditions: [
      { type: 'milestone', target: 'ms_dna_extraction' },
      { type: 'quest', target: 'understand_expression' },
    ],
    rewards: [
      { type: 'skill', target: 'biology', value: 1 },
      { type: 'knowledge', target: 'gene_expression' },
    ],
    dependencies: ['ms_dna_extraction'],
  },
  {
    id: 'ms_organism_culture',
    name: 'Organism Culture',
    description: 'Grow living organisms under controlled laboratory conditions.',
    category: 'biology',
    phase: 9,
    conditions: [
      { type: 'milestone', target: 'ms_cell_analysis' },
      { type: 'bio', target: 'organisms', value: 1 },
    ],
    rewards: [
      { type: 'skill', target: 'biology', value: 1 },
      { type: 'unlock', target: 'bio_engineering' },
    ],
    dependencies: ['ms_cell_analysis'],
  },
  {
    id: 'ms_genetic_modification',
    name: 'Genetic Modification',
    description: 'Edit genes to give organisms new capabilities.',
    category: 'biology',
    phase: 9,
    conditions: [
      { type: 'milestone', target: 'ms_organism_culture' },
      { type: 'quest', target: 'engineer_bacteria' },
      { type: 'bio', target: 'constructs', value: 1 },
    ],
    rewards: [
      { type: 'unlock', target: 'synthetic_biology' },
      { type: 'skill', target: 'biology', value: 2 },
    ],
    dependencies: ['ms_organism_culture'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 10 — PLANETARY ENGINEERING (Endgame)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'ms_ecosystem_creation',
    name: 'Ecosystem Creation',
    description: 'Design a self-sustaining ecosystem with producers, consumers, and decomposers.',
    category: 'biology',
    phase: 10,
    conditions: [
      { type: 'milestone', target: 'ms_genetic_modification' },
      { type: 'milestone', target: 'ms_spacecraft_complete' },
    ],
    rewards: [
      { type: 'unlock', target: 'planetary_tools' },
    ],
    dependencies: ['ms_genetic_modification', 'ms_spacecraft_complete'],
  },
  {
    id: 'ms_atmosphere_engineering',
    name: 'Atmosphere Engineering',
    description: 'Engineer an atmosphere — gas composition, pressure, temperature balance.',
    category: 'space',
    phase: 10,
    conditions: [
      { type: 'milestone', target: 'ms_ecosystem_creation' },
      { type: 'milestone', target: 'ms_advanced_materials' },
    ],
    rewards: [
      { type: 'skill', target: 'space_systems', value: 2 },
    ],
    dependencies: ['ms_ecosystem_creation', 'ms_advanced_materials'],
  },
  {
    id: 'ms_introduce_life',
    name: 'Introduce Life',
    description: 'Seed a barren world with engineered organisms adapted to survive.',
    category: 'biology',
    phase: 10,
    conditions: [
      { type: 'milestone', target: 'ms_atmosphere_engineering' },
      { type: 'milestone', target: 'ms_genetic_modification' },
    ],
    rewards: [
      { type: 'unlock', target: 'terraform' },
    ],
    dependencies: ['ms_atmosphere_engineering'],
  },
  {
    id: 'ms_planetary_master',
    name: 'Planetary Master',
    description: 'Full system mastery — mechanical, chemical, biological, and spatial engineering.',
    category: 'space',
    phase: 10,
    conditions: [
      { type: 'milestone', target: 'ms_introduce_life' },
      { type: 'milestone', target: 'ms_advanced_materials' },
      { type: 'milestone', target: 'ms_spacecraft_complete' },
      { type: 'milestone', target: 'ms_genetic_modification' },
    ],
    rewards: [
      { type: 'unlock', target: 'mastery_mode' },
    ],
    dependencies: ['ms_introduce_life'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CROSS-DOMAIN BRIDGES (connect chemistry ↔ biology ↔ physics ↔ engineering)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'ms_chemistry_to_battery',
    name: 'Chemistry Powers Engineering',
    description: 'Your chemistry knowledge enables better battery design.',
    category: 'engineering',
    phase: 2,
    conditions: [
      { type: 'milestone', target: 'ms_plant_chemist' },
      { type: 'milestone', target: 'ms_motion_basics' },
    ],
    rewards: [
      { type: 'unlock', target: 'battery_chemistry' },
    ],
    dependencies: ['ms_plant_chemist', 'ms_motion_basics'],
  },
  {
    id: 'ms_biology_to_chemistry',
    name: 'Biology Meets Chemistry',
    description: 'Use biological processes to produce chemical compounds.',
    category: 'chemistry',
    phase: 9,
    conditions: [
      { type: 'milestone', target: 'ms_organism_culture' },
      { type: 'milestone', target: 'ms_solvent_extraction' },
    ],
    rewards: [
      { type: 'unlock', target: 'bio_chemistry' },
    ],
    dependencies: ['ms_organism_culture', 'ms_solvent_extraction'],
  },
  {
    id: 'ms_physics_to_flight',
    name: 'Physics Enables Flight',
    description: 'Deep physics understanding unlocks aerodynamic design.',
    category: 'physics',
    phase: 6,
    conditions: [
      { type: 'milestone', target: 'ms_aerodynamics_intro' },
      { type: 'milestone', target: 'ms_motion_basics' },
    ],
    rewards: [
      { type: 'unlock', target: 'advanced_aerodynamics' },
    ],
    dependencies: ['ms_aerodynamics_intro', 'ms_motion_basics'],
  },
  {
    id: 'ms_ecology_foundation',
    name: 'Ecology Foundation',
    description: 'Understand food chains, biomes, and how ecosystems self-regulate.',
    category: 'ecology',
    phase: 2,
    conditions: [
      { type: 'quest', target: 'food_chain_tracker' },
      { type: 'quest', target: 'desert_healer' },
    ],
    rewards: [
      { type: 'unlock', target: 'ecology_research' },
    ],
    dependencies: ['ms_first_repair', 'ms_chain_master'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MINING & MATERIALS PROGRESSION
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'ms_first_mine',
    name: 'First Strike',
    description: 'Mine your first raw material from the Arizona desert.',
    category: 'engineering',
    phase: 1,
    conditions: [
      { type: 'mine', target: 'copper_ore', value: 1 },
    ],
    rewards: [
      { type: 'unlock', target: 'mining_basics' },
    ],
    dependencies: ['ms_first_repair'],
  },
  {
    id: 'ms_copper_refiner',
    name: 'Copper Refiner',
    description: 'Refine copper ore into usable copper — the foundation of electronics.',
    category: 'chemistry',
    phase: 1,
    conditions: [
      { type: 'refine', target: 'copper', value: 1 },
      { type: 'milestone', target: 'ms_first_mine' },
    ],
    rewards: [
      { type: 'unlock', target: 'basic_electronics' },
      { type: 'skill', target: 'chemistry', value: 1 },
    ],
    dependencies: ['ms_first_mine'],
  },
  {
    id: 'ms_material_scientist',
    name: 'Material Scientist',
    description: 'Mine and compare 3 different materials to understand their properties.',
    category: 'engineering',
    phase: 1,
    conditions: [
      { type: 'mine', target: 'copper_ore', value: 2 },
      { type: 'mine', target: 'quartz', value: 2 },
      { type: 'milestone', target: 'ms_copper_refiner' },
    ],
    rewards: [
      { type: 'skill', target: 'engineering', value: 1 },
    ],
    dependencies: ['ms_copper_refiner'],
  },
  {
    id: 'ms_rare_discovery',
    name: 'Rare Discovery',
    description: 'Find a rare or epic material — proof that patience and better tools pay off.',
    category: 'engineering',
    phase: 2,
    conditions: [
      { type: 'mine', target: 'gold_ore', value: 1 },
    ],
    rewards: [
      { type: 'unlock', target: 'early_trade' },
    ],
    dependencies: ['ms_first_mine'],
  },
];

export default MILESTONES;

// ── Indexes for fast lookup ─────────────────────────────────────────────────

export const MILESTONE_MAP = Object.fromEntries(MILESTONES.map((m) => [m.id, m]));

export function getMilestonesByPhase(phase) {
  return MILESTONES.filter((m) => m.phase === phase);
}

export function getMilestonesByCategory(category) {
  return MILESTONES.filter((m) => m.category === category);
}

export const PHASE_NAMES = {
  1: 'Bicycle',
  2: 'E-Bike',
  3: 'Motorcycle',
  4: 'Car',
  5: 'Boat',
  6: 'Flight',
  7: 'Space',
  8: 'Chemistry',
  9: 'Biology',
  10: 'Planetary Engineering',
};

export const CATEGORY_ICONS = {
  mechanical: '🔧',
  physics: '📐',
  chemistry: '🧪',
  biology: '🧬',
  space: '🚀',
  ecology: '🌿',
  engineering: '⚙️',
};
