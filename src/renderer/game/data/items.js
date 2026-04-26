/**
 * Item definitions for the bike adventure game.
 *
 * Each item has:
 *   id          - unique key used in inventory and save data
 *   name        - display name (kid-friendly)
 *   description - short tooltip / journal text
 *   icon        - emoji used as placeholder art
 *   category    - grouping key for future UI panels
 *   stackable   - whether multiple can stack in one slot
 *
 * Categories:
 *   tool     - reusable repair/build tools
 *   part     - consumable bike parts
 *   upgrade  - permanent capability unlocks
 *   quest    - special items tied to quest progression
 */

const ITEMS = {
  tire_lever: {
    id: 'tire_lever',
    name: 'Tire Lever',
    description: 'A small lever that helps pry a tire off the rim.',
    icon: '🔧',
    category: 'tool',
    stackable: false,
  },
  patch_kit: {
    id: 'patch_kit',
    name: 'Patch Kit',
    description: 'Rubber patches and glue for fixing small holes in tubes.',
    icon: '🩹',
    category: 'part',
    stackable: true,
  },
  basic_pump: {
    id: 'basic_pump',
    name: 'Basic Pump',
    description: 'A hand pump that fills tires back up with air.',
    icon: '💨',
    category: 'upgrade',
    stackable: false,
  },
  wrench: {
    id: 'wrench',
    name: 'Wrench',
    description: 'An adjustable wrench for bolts and nuts.',
    icon: '🔩',
    category: 'tool',
    stackable: false,
  },
  inner_tube: {
    id: 'inner_tube',
    name: 'Inner Tube',
    description: 'A spare rubber tube that goes inside a tire.',
    icon: '⭕',
    category: 'part',
    stackable: true,
  },
  chain_lube: {
    id: 'chain_lube',
    name: 'Chain Lube',
    description: 'Special oil that keeps bike chains running smoothly.',
    icon: '🫗',
    category: 'part',
    stackable: true,
  },
  multi_tool: {
    id: 'multi_tool',
    name: 'Multi-Tool',
    description: 'A folding tool with hex keys, screwdrivers, and a chain breaker.',
    icon: '🛠️',
    category: 'upgrade',
    stackable: false,
  },
  tool_rack: {
    id: 'tool_rack',
    name: 'Tool Rack',
    description: 'A wall-mounted rack that keeps your tools organized and easy to find.',
    icon: '🗄️',
    category: 'upgrade',
    stackable: false,
  },

  // ── Foraged materials ───────────────────────────────────────────────────────

  creosote_leaves: {
    id: 'creosote_leaves',
    name: 'Creosote Leaves',
    description: 'Fragrant, resinous leaves with anti-inflammatory properties. Use with caution.',
    icon: '🌿',
    category: 'foraged',
    stackable: true,
    plantSource: 'creosote',
  },
  mesquite_pods: {
    id: 'mesquite_pods',
    name: 'Mesquite Pods',
    description: 'Sweet, protein-rich pods. Can be eaten raw or ground into flour.',
    icon: '🫘',
    category: 'foraged',
    stackable: true,
    plantSource: 'mesquite',
  },
  prickly_pear_fruit: {
    id: 'prickly_pear_fruit',
    name: 'Prickly Pear Fruit',
    description: 'Sweet red fruit — careful of the tiny spines! Great for energy.',
    icon: '🍐',
    category: 'foraged',
    stackable: true,
    plantSource: 'prickly_pear',
  },
  prickly_pear_pads: {
    id: 'prickly_pear_pads',
    name: 'Prickly Pear Pads',
    description: 'Nopalitos — edible cactus pads used in cooking.',
    icon: '🌵',
    category: 'foraged',
    stackable: true,
    plantSource: 'prickly_pear',
  },
  saguaro_fruit: {
    id: 'saguaro_fruit',
    name: 'Saguaro Fruit',
    description: 'Rare red fruit from the top of a saguaro. Sweet and special.',
    icon: '🔴',
    category: 'foraged',
    stackable: true,
    plantSource: 'saguaro',
  },
  jojoba_seeds: {
    id: 'jojoba_seeds',
    name: 'Jojoba Seeds',
    description: 'Waxy seeds that produce natural sunscreen oil.',
    icon: '🫒',
    category: 'foraged',
    stackable: true,
    plantSource: 'jojoba',
  },
  barrel_cactus_pulp: {
    id: 'barrel_cactus_pulp',
    name: 'Barrel Cactus Pulp',
    description: 'Emergency water source. Bitter and can cause nausea.',
    icon: '💧',
    category: 'foraged',
    stackable: true,
    plantSource: 'barrel_cactus',
  },
  ephedra_stems: {
    id: 'ephedra_stems',
    name: 'Ephedra Stems',
    description: 'Dried stems for Mormon Tea. Powerful stimulant — use carefully!',
    icon: '🪵',
    category: 'foraged',
    stackable: true,
    plantSource: 'ephedra',
  },
  yerba_mansa_root: {
    id: 'yerba_mansa_root',
    name: 'Yerba Mansa Root',
    description: 'Powerful antimicrobial root found near water. The desert\'s aspirin.',
    icon: '🫚',
    category: 'foraged',
    stackable: true,
    plantSource: 'yerba_mansa',
  },
  desert_lavender_flowers: {
    id: 'desert_lavender_flowers',
    name: 'Desert Lavender',
    description: 'Purple flowers with a calming scent. Good for tea.',
    icon: '💜',
    category: 'foraged',
    stackable: true,
    plantSource: 'desert_lavender',
  },
  agave_fiber: {
    id: 'agave_fiber',
    name: 'Agave Fiber & Sap',
    description: 'Strong fibers for binding and healing sap for wounds.',
    icon: '🧵',
    category: 'foraged',
    stackable: true,
    plantSource: 'agave',
  },
  yucca_root: {
    id: 'yucca_root',
    name: 'Yucca Root',
    description: 'Rich in saponins — natural soap. Used for cleaning and surfactant extraction.',
    icon: '🌴',
    category: 'foraged',
    stackable: true,
    plantSource: 'yucca',
  },
  bio_sample_agave: {
    id: 'bio_sample_agave',
    name: 'Agave Tissue Sample',
    description: 'Living agave cells for DNA extraction. Handle carefully — degrades over time.',
    icon: '🧬',
    category: 'foraged',
    stackable: false,
    plantSource: 'agave',
  },
  bio_sample_bacteria: {
    id: 'bio_sample_bacteria',
    name: 'Desert Soil Bacteria',
    description: 'Hardy desert bacteria from soil near plant roots. Fast-growing lab organism.',
    icon: '🦠',
    category: 'foraged',
    stackable: false,
  },
  palo_verde_pods: {
    id: 'palo_verde_pods',
    name: 'Palo Verde Pods',
    description: 'Small edible pods from the palo verde tree.',
    icon: '🫘',
    category: 'foraged',
    stackable: true,
    plantSource: 'palo_verde',
  },

  // ── Crafted products ────────────────────────────────────────────────────────

  healing_salve: {
    id: 'healing_salve',
    name: 'Healing Salve',
    description: 'Anti-inflammatory salve for cuts and scrapes. Heals over time.',
    icon: '🧴',
    category: 'crafted',
    stackable: true,
    effectType: 'anti_inflammatory',
  },
  energy_cake: {
    id: 'energy_cake',
    name: 'Desert Energy Cake',
    description: 'Mesquite and prickly pear fuel — sustained energy for adventures.',
    icon: '🍰',
    category: 'crafted',
    stackable: true,
    effectType: 'nutritive',
  },
  stimulant_tea: {
    id: 'stimulant_tea',
    name: 'Mormon Tea',
    description: 'Brewed ephedra stems — boosts speed but watch your heart!',
    icon: '🍵',
    category: 'crafted',
    stackable: true,
    effectType: 'stimulant',
  },
  wound_poultice: {
    id: 'wound_poultice',
    name: 'Wound Poultice',
    description: 'Yerba mansa and agave bandage — fights infection and heals.',
    icon: '🩹',
    category: 'crafted',
    stackable: true,
    effectType: 'antimicrobial',
  },
  calming_tea: {
    id: 'calming_tea',
    name: 'Lavender Focus Tea',
    description: 'Calming brew that sharpens the mind for puzzles.',
    icon: '☕',
    category: 'crafted',
    stackable: true,
    effectType: 'calming',
  },
  sun_balm: {
    id: 'sun_balm',
    name: 'Desert Sun Balm',
    description: 'Jojoba-based sunscreen — reduces heat damage.',
    icon: '☀️',
    category: 'crafted',
    stackable: true,
    effectType: 'protective',
  },
  hydration_jelly: {
    id: 'hydration_jelly',
    name: 'Cactus Water Jelly',
    description: 'Prickly pear and barrel cactus gel — emergency hydration.',
    icon: '🧊',
    category: 'crafted',
    stackable: true,
    effectType: 'hydrating',
  },

  // ── Engineering materials ───────────────────────────────────────────────────

  scrap_metal: {
    id: 'scrap_metal', name: 'Scrap Metal', icon: '🔩', category: 'material', stackable: true,
    description: 'Recyclable metal scraps. Used in metal shop production.',
  },
  scrap_rubber: {
    id: 'scrap_rubber', name: 'Scrap Rubber', icon: '⚫', category: 'material', stackable: true,
    description: 'Old rubber from tires and tubes. Recyclable.',
  },
  raw_rubber: {
    id: 'raw_rubber', name: 'Raw Rubber', icon: '🟤', category: 'material', stackable: true,
    description: 'Unprocessed rubber for making tires and tubes.',
  },
  fiber: {
    id: 'fiber', name: 'Fiber', icon: '🧵', category: 'material', stackable: true,
    description: 'Strong fiber for reinforcement and insulation.',
  },
  copper_wire: {
    id: 'copper_wire', name: 'Copper Wire', icon: '🧶', category: 'material', stackable: true,
    description: 'Conductive wire for electrical connections.',
  },
  aluminum: {
    id: 'aluminum', name: 'Aluminum', icon: '🪨', category: 'material', stackable: true,
    description: 'Lightweight metal for frames and casings.',
  },
  components: {
    id: 'components', name: 'Electronic Components', icon: '🔌', category: 'material', stackable: true,
    description: 'Resistors, capacitors, and transistors for circuits.',
  },
  circuit_boards: {
    id: 'circuit_boards', name: 'Circuit Boards', icon: '💚', category: 'material', stackable: true,
    description: 'PCBs for building controllers and sensors.',
  },
  lithium_cell: {
    id: 'lithium_cell', name: 'Lithium Cell (18650)', icon: '🔋', category: 'material', stackable: true,
    description: 'Standard 18650 lithium-ion cell. 3.7V, 2500mAh.',
  },
  nickel_strip: {
    id: 'nickel_strip', name: 'Nickel Strip', icon: '🔗', category: 'material', stackable: true,
    description: 'Pure nickel strip for connecting battery cells.',
  },
  casing_material: {
    id: 'casing_material', name: 'Casing Material', icon: '📦', category: 'material', stackable: true,
    description: 'ABS plastic or aluminum for protective enclosures.',
  },

  // Factory outputs (intermediate products)
  tire_material: {
    id: 'tire_material', name: 'Tire Material', icon: '🛞', category: 'produced', stackable: true,
    description: 'Processed rubber ready for tire manufacturing.',
  },
  inner_tube_material: {
    id: 'inner_tube_material', name: 'Inner Tube Material', icon: '⭕', category: 'produced', stackable: true,
    description: 'Thin rubber tubing for inner tubes.',
  },
  brake_pads: {
    id: 'brake_pads', name: 'Brake Pads', icon: '🛑', category: 'produced', stackable: true,
    description: 'Friction pads for rim or disc brakes.',
  },
  steel_tubing: {
    id: 'steel_tubing', name: 'Steel Tubing', icon: '🔧', category: 'produced', stackable: true,
    description: 'Cut and welded steel tubes for frame construction.',
  },
  brackets: {
    id: 'brackets', name: 'Brackets', icon: '📎', category: 'produced', stackable: true,
    description: 'Metal brackets for mounting components.',
  },
  frame_components: {
    id: 'frame_components', name: 'Frame Components', icon: '🚲', category: 'produced', stackable: true,
    description: 'Pre-shaped frame tubes ready for welding.',
  },
  wiring_harness: {
    id: 'wiring_harness', name: 'Wiring Harness', icon: '🔌', category: 'produced', stackable: true,
    description: 'Pre-wired electrical harness with connectors.',
  },
  basic_sensor: {
    id: 'basic_sensor', name: 'Basic Sensor', icon: '📡', category: 'produced', stackable: true,
    description: 'Speed or cadence sensor module.',
  },
  motor_controller_kit: {
    id: 'motor_controller_kit', name: 'Controller Kit', icon: '🖥️', category: 'produced', stackable: true,
    description: 'Unassembled motor controller PCB and components.',
  },
  display_unit: {
    id: 'display_unit', name: 'Display Unit', icon: '📟', category: 'produced', stackable: true,
    description: 'LCD display for speed, battery, and trip data.',
  },
  tested_cell: {
    id: 'tested_cell', name: 'Tested Cell', icon: '✅', category: 'produced', stackable: true,
    description: 'Capacity-tested and matched lithium cell.',
  },
  cell_holder: {
    id: 'cell_holder', name: 'Cell Holder', icon: '🧱', category: 'produced', stackable: true,
    description: 'Plastic spacer that holds cells in formation.',
  },
  bms_module: {
    id: 'bms_module', name: 'BMS Module', icon: '🛡️', category: 'produced', stackable: true,
    description: 'Battery management system board.',
  },
  battery_pack_kit: {
    id: 'battery_pack_kit', name: 'Battery Pack Kit', icon: '🔋', category: 'produced', stackable: true,
    description: 'Complete battery pack assembly kit.',
  },
  wheel_assembly: {
    id: 'wheel_assembly', name: 'Wheel Assembly', icon: '⭕', category: 'produced', stackable: true,
    description: 'Hub, spokes, rim, tire, and tube — assembled.',
  },
  brake_assembly: {
    id: 'brake_assembly', name: 'Brake Assembly', icon: '🛑', category: 'produced', stackable: true,
    description: 'Complete brake caliper with pads and cable.',
  },
  drivetrain_assembly: {
    id: 'drivetrain_assembly', name: 'Drivetrain Assembly', icon: '⛓️', category: 'produced', stackable: true,
    description: 'Chain, cassette, and derailleur — ready to install.',
  },
  ebike_conversion_kit: {
    id: 'ebike_conversion_kit', name: 'E-Bike Kit', icon: '⚡', category: 'produced', stackable: true,
    description: 'Motor, controller, wiring — everything to convert a bike to e-bike.',
  },

  // Mining tools
  pickaxe: {
    id: 'pickaxe', name: 'Pickaxe', icon: '⛏️', category: 'tool', stackable: false,
    description: 'A sturdy pickaxe for mining ore veins. Unlocks uncommon materials.',
  },
  drill: {
    id: 'drill', name: 'Mining Drill', icon: '🔩', category: 'tool', stackable: false,
    description: 'Powered drill for faster mining. Unlocks rare materials.',
  },

  // ── Copper mine resources (CopperMineScene) ────────────────────────────────
  surface_copper: {
    id: 'surface_copper', name: 'Surface Copper', icon: '🟢', category: 'foraged', stackable: true,
    description: 'Oxidized copper ore from the surface — greenish patina (verdigris).',
  },
  deep_copper: {
    id: 'deep_copper', name: 'Deep Copper Ore', icon: '🔶', category: 'foraged', stackable: true,
    description: 'Pure chalcopyrite from deep in the mine — higher conductivity than surface ore.',
  },
  wire_spool: {
    id: 'wire_spool', name: 'Wire Spool', icon: '🧶', category: 'material', stackable: true,
    description: 'A spool of hand-drawn copper wire left by old miners.',
  },

  // ── Desert foraging resources (DesertForagingScene) ────────────────────────
  yucca_fiber: {
    id: 'yucca_fiber', name: 'Yucca Fiber', icon: '🧵', category: 'foraged', stackable: true,
    description: 'Strong natural fiber — used by indigenous peoples for rope and baskets.',
    plantSource: 'yucca',
  },
  jojoba_extract: {
    id: 'jojoba_extract', name: 'Jojoba Extract', icon: '🫧', category: 'foraged', stackable: true,
    description: 'Liquid wax from jojoba seeds — natural lubricant and solvent.',
    plantSource: 'jojoba',
  },
  creosote_resin: {
    id: 'creosote_resin', name: 'Creosote Resin', icon: '🧴', category: 'foraged', stackable: true,
    description: 'Antiseptic resin from creosote bush — used as a natural sealant.',
    plantSource: 'creosote',
  },
  cactus_water: {
    id: 'cactus_water', name: 'Cactus Water', icon: '💧', category: 'foraged', stackable: true,
    description: 'Emergency water from barrel cactus pulp.',
    plantSource: 'barrel_cactus',
  },

  // ── Salt River resources (SaltRiverScene) ──────────────────────────────────
  algae_sample: {
    id: 'algae_sample', name: 'Algae Sample', icon: '🧪', category: 'foraged', stackable: true,
    description: 'Green algae from the river — could produce organic compounds.',
  },
  microbial_sample: {
    id: 'microbial_sample', name: 'Microbial Sample', icon: '🔬', category: 'foraged', stackable: true,
    description: 'Microorganisms from river sediment — potential for bio-production.',
  },
  river_minerals: {
    id: 'river_minerals', name: 'River Minerals', icon: '💎', category: 'material', stackable: true,
    description: 'Dissolved minerals deposited along the riverbed.',
  },
  reed_fiber: {
    id: 'reed_fiber', name: 'Reed Fiber', icon: '🌿', category: 'foraged', stackable: true,
    description: 'Tough natural fiber from river reeds — good for weaving.',
  },

  // Material samples (quest items for bridge_collapse)
  mesquite_wood_sample: {
    id: 'mesquite_wood_sample', name: 'Mesquite Wood Sample', icon: '🪵', category: 'quest', stackable: false,
    description: 'A chunk of dense mesquite hardwood for material testing.',
  },
  copper_ore_sample: {
    id: 'copper_ore_sample', name: 'Copper Ore Sample', icon: '🟤', category: 'quest', stackable: false,
    description: 'A piece of raw copper ore from an Arizona rock face.',
  },
  steel_sample: {
    id: 'steel_sample', name: 'Steel Bracket', icon: '🔩', category: 'quest', stackable: false,
    description: 'A scrap steel bracket from the garage — heavy but strong.',
  },
};

export default ITEMS;
