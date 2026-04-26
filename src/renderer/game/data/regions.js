/**
 * Region Definitions — geography, culture, and mineable materials.
 *
 * Each region represents a real-world area with historically accurate
 * materials. Materials here are MINEABLE resources — they feed into
 * the existing MATERIAL_MAP in materials.js after refinement.
 *
 * Region unlock gates through the milestone engine via dependencies.
 * Arizona is always available as the starting region.
 *
 * Material properties use the same 0–1 normalized model as materials.js.
 * Rarity affects spawn chance: common=60%, uncommon=25%, rare=10%, epic=5%.
 */

// ── Biome enum ──────────────────────────────────────────────────────────────
// Canonical biome tags consumed by terrain rendering and biome-aware quests.
// Each region carries a `biome:` field set to one of these values.
export const BIOME = Object.freeze({
  DESERT: 'desert',
  GRASSLAND: 'grassland',
  WATER: 'water',
  ROCK: 'rock',
  MOUNTAIN: 'mountain',
  URBAN: 'urban',
  UNKNOWN: 'unknown',
});

const REGIONS = [
  // ── Starting Region ─────────────────────────────────────────────────────

  {
    id: 'arizona',
    name: 'Arizona',
    culture: 'Sonoran Desert',
    description: 'Your home in the Sonoran Desert — copper country. Ancient mines and modern engineering.',
    icon: '🏜️',
    color: '#D97706',
    // Sonoran Desert — copper country, arid scrubland.
    biome: BIOME.DESERT,
    materials: [
      {
        id: 'copper_ore',
        name: 'Copper Ore',
        type: 'metal',
        rarity: 'common',
        nodeType: 'vein',
        color: '#B87333',
        glowIntensity: 0.2,
        properties: { conductivity: 0.95, strength: 0.35, weight: 0.90, energyValue: 0 },
        refinesTo: 'copper',
        uses: ['crafting', 'battery', 'structure'],
      },
      {
        id: 'quartz',
        name: 'Quartz Crystal',
        type: 'mineral',
        rarity: 'common',
        nodeType: 'crystal',
        color: '#F5F5F5',
        glowIntensity: 0.4,
        properties: { conductivity: 0, strength: 0.65, weight: 0.40, energyValue: 0 },
        refinesTo: 'silicon',
        uses: ['crafting', 'structure'],
      },
      {
        id: 'silver_ore',
        name: 'Silver Ore',
        type: 'metal',
        rarity: 'uncommon',
        nodeType: 'vein',
        color: '#C0C0C0',
        glowIntensity: 0.5,
        properties: { conductivity: 0.98, strength: 0.25, weight: 0.85, energyValue: 0 },
        refinesTo: 'silver',
        uses: ['crafting', 'trade'],
      },
      {
        id: 'gold_ore',
        name: 'Gold Ore',
        type: 'metal',
        rarity: 'rare',
        nodeType: 'vein',
        color: '#FFD700',
        glowIntensity: 0.7,
        properties: { conductivity: 0.90, strength: 0.15, weight: 0.95, energyValue: 0 },
        refinesTo: 'gold',
        uses: ['trade', 'crafting'],
      },
      {
        id: 'turquoise',
        name: 'Turquoise',
        type: 'gem',
        rarity: 'epic',
        nodeType: 'crystal',
        color: '#40E0D0',
        glowIntensity: 0.9,
        properties: { conductivity: 0, strength: 0.30, weight: 0.35, energyValue: 0 },
        refinesTo: null,
        uses: ['trade'],
      },
    ],
    unlocks: ['basic_electronics', 'early_trade'],
    dependencies: [],
  },

  // ── Americas ────────────────────────────────────────────────────────────

  {
    id: 'andes',
    name: 'Mexico & Andes',
    culture: 'Mesoamerican & Andean',
    description: 'Silver mountains and lithium flats. Ancient metallurgy meets modern batteries.',
    icon: '⛰️',
    color: '#6D28D9',
    // "Silver mountains and lithium flats" — Andean highlands; mountain wins
    // over flats since silver/copper/gold veins are mountain-mined.
    biome: BIOME.MOUNTAIN,
    materials: [
      {
        id: 'silver_ore_andes',
        name: 'Silver Ore',
        type: 'metal',
        rarity: 'common',
        nodeType: 'vein',
        color: '#C0C0C0',
        glowIntensity: 0.5,
        properties: { conductivity: 0.98, strength: 0.25, weight: 0.85, energyValue: 0 },
        refinesTo: 'silver',
        uses: ['trade', 'crafting'],
      },
      {
        id: 'lithium_brine',
        name: 'Lithium Brine',
        type: 'mineral',
        rarity: 'uncommon',
        nodeType: 'rock',
        color: '#E8E8E8',
        glowIntensity: 0.3,
        properties: { conductivity: 0.40, strength: 0.05, weight: 0.10, energyValue: 0.90 },
        refinesTo: 'lithium_compound',
        uses: ['battery'],
      },
      {
        id: 'obsidian',
        name: 'Obsidian',
        type: 'mineral',
        rarity: 'uncommon',
        nodeType: 'rock',
        color: '#1A1A2E',
        glowIntensity: 0.6,
        properties: { conductivity: 0, strength: 0.70, weight: 0.40, energyValue: 0 },
        refinesTo: null,
        uses: ['crafting', 'trade'],
      },
      {
        id: 'copper_ore_andes',
        name: 'Copper Ore',
        type: 'metal',
        rarity: 'common',
        nodeType: 'vein',
        color: '#B87333',
        glowIntensity: 0.2,
        properties: { conductivity: 0.95, strength: 0.35, weight: 0.90, energyValue: 0 },
        refinesTo: 'copper',
        uses: ['crafting', 'battery'],
      },
      {
        id: 'gold_ore_andes',
        name: 'Gold Ore',
        type: 'metal',
        rarity: 'rare',
        nodeType: 'vein',
        color: '#FFD700',
        glowIntensity: 0.7,
        properties: { conductivity: 0.90, strength: 0.15, weight: 0.95, energyValue: 0 },
        refinesTo: 'gold',
        uses: ['trade'],
      },
    ],
    unlocks: ['currency_system', 'battery_system'],
    dependencies: ['ms_ebike_complete'],
  },

  // ── Middle East & North Africa ──────────────────────────────────────────

  {
    id: 'arabian',
    name: 'Arabian Region',
    culture: 'Arabian',
    description: 'Gold, salt, and frankincense — the materials that built ancient trade routes.',
    icon: '🕌',
    color: '#D4A017',
    // Arabian Peninsula — arid desert; frankincense/salt/gold trade routes.
    biome: BIOME.DESERT,
    materials: [
      {
        id: 'gold_ore_arabian',
        name: 'Gold Ore',
        type: 'metal',
        rarity: 'uncommon',
        nodeType: 'vein',
        color: '#FFD700',
        glowIntensity: 0.7,
        properties: { conductivity: 0.90, strength: 0.15, weight: 0.95, energyValue: 0 },
        refinesTo: 'gold',
        uses: ['trade', 'crafting'],
      },
      {
        id: 'copper_ore_arabian',
        name: 'Copper Ore',
        type: 'metal',
        rarity: 'common',
        nodeType: 'vein',
        color: '#B87333',
        glowIntensity: 0.2,
        properties: { conductivity: 0.95, strength: 0.35, weight: 0.90, energyValue: 0 },
        refinesTo: 'copper',
        uses: ['crafting'],
      },
      {
        id: 'rock_salt',
        name: 'Rock Salt',
        type: 'mineral',
        rarity: 'common',
        nodeType: 'rock',
        color: '#FFF5EE',
        glowIntensity: 0.1,
        properties: { conductivity: 0.30, strength: 0.10, weight: 0.35, energyValue: 0 },
        refinesTo: 'salt_crystal',
        uses: ['crafting', 'trade'],
      },
      {
        id: 'phosphate_rock',
        name: 'Phosphate Rock',
        type: 'mineral',
        rarity: 'uncommon',
        nodeType: 'rock',
        color: '#8B8682',
        glowIntensity: 0.1,
        properties: { conductivity: 0, strength: 0.20, weight: 0.50, energyValue: 0.30 },
        refinesTo: 'phosphate',
        uses: ['crafting'],
      },
      {
        id: 'frankincense_resin',
        name: 'Frankincense Resin',
        type: 'organic',
        rarity: 'rare',
        nodeType: 'crystal',
        color: '#F5DEB3',
        glowIntensity: 0.5,
        properties: { conductivity: 0, strength: 0.05, weight: 0.10, energyValue: 0.15 },
        refinesTo: null,
        uses: ['crafting', 'trade'],
      },
    ],
    unlocks: ['alchemy_system', 'agriculture_system'],
    dependencies: ['ms_boat_complete'],
  },

  // ── Anatolia ────────────────────────────────────────────────────────────

  {
    id: 'turkish',
    name: 'Turkish Region',
    culture: 'Anatolian',
    description: 'Where metallurgy began. Iron, copper, and the world\'s richest boron deposits.',
    icon: '🏛️',
    color: '#DC2626',
    // Anatolian temperate steppe — open grassland with iron/copper/boron beds.
    biome: BIOME.GRASSLAND,
    materials: [
      {
        id: 'iron_ore_turkish',
        name: 'Iron Ore',
        type: 'metal',
        rarity: 'common',
        nodeType: 'vein',
        color: '#8B4513',
        glowIntensity: 0.2,
        properties: { conductivity: 0.15, strength: 0.80, weight: 0.80, energyValue: 0 },
        refinesTo: 'iron_ingot',
        uses: ['structure', 'crafting'],
      },
      {
        id: 'copper_ore_turkish',
        name: 'Copper Ore',
        type: 'metal',
        rarity: 'common',
        nodeType: 'vein',
        color: '#B87333',
        glowIntensity: 0.2,
        properties: { conductivity: 0.95, strength: 0.35, weight: 0.90, energyValue: 0 },
        refinesTo: 'copper',
        uses: ['crafting'],
      },
      {
        id: 'boron_ore',
        name: 'Boron Ore',
        type: 'mineral',
        rarity: 'uncommon',
        nodeType: 'rock',
        color: '#2F4F4F',
        glowIntensity: 0.3,
        properties: { conductivity: 0.05, strength: 0.90, weight: 0.40, energyValue: 0.20 },
        refinesTo: 'boron',
        uses: ['structure', 'crafting'],
      },
      {
        id: 'marble',
        name: 'Marble',
        type: 'mineral',
        rarity: 'uncommon',
        nodeType: 'rock',
        color: '#F0EAD6',
        glowIntensity: 0.3,
        properties: { conductivity: 0, strength: 0.50, weight: 0.45, energyValue: 0 },
        refinesTo: null,
        uses: ['structure', 'trade'],
      },
    ],
    unlocks: ['metallurgy_advanced', 'structural_building'],
    dependencies: ['ms_motorcycle_complete'],
  },

  // ── Persian Plateau ─────────────────────────────────────────────────────

  {
    id: 'persian',
    name: 'Persian Region',
    culture: 'Persian',
    description: 'Brass, turquoise, and lapis lazuli. The birthplace of alloys and pigments.',
    icon: '🏺',
    color: '#1E40AF',
    // Iranian plateau — high arid rocky terrain; all materials are minerals
    // (copper, zinc, lead, turquoise, lapis), so ROCK fits better than DESERT.
    biome: BIOME.ROCK,
    materials: [
      {
        id: 'copper_ore_persian',
        name: 'Copper Ore',
        type: 'metal',
        rarity: 'common',
        nodeType: 'vein',
        color: '#B87333',
        glowIntensity: 0.2,
        properties: { conductivity: 0.95, strength: 0.35, weight: 0.90, energyValue: 0 },
        refinesTo: 'copper',
        uses: ['crafting'],
      },
      {
        id: 'zinc_ore',
        name: 'Zinc Ore',
        type: 'metal',
        rarity: 'uncommon',
        nodeType: 'vein',
        color: '#B0C4DE',
        glowIntensity: 0.2,
        properties: { conductivity: 0.30, strength: 0.25, weight: 0.70, energyValue: 0 },
        refinesTo: 'zinc',
        uses: ['crafting'],
      },
      {
        id: 'lead_ore',
        name: 'Lead Ore',
        type: 'metal',
        rarity: 'uncommon',
        nodeType: 'vein',
        color: '#708090',
        glowIntensity: 0.1,
        properties: { conductivity: 0.08, strength: 0.10, weight: 0.99, energyValue: 0 },
        refinesTo: 'lead',
        uses: ['battery', 'crafting'],
      },
      {
        id: 'turquoise_persian',
        name: 'Turquoise',
        type: 'gem',
        rarity: 'rare',
        nodeType: 'crystal',
        color: '#40E0D0',
        glowIntensity: 0.8,
        properties: { conductivity: 0, strength: 0.30, weight: 0.35, energyValue: 0 },
        refinesTo: null,
        uses: ['trade'],
      },
      {
        id: 'lapis_lazuli',
        name: 'Lapis Lazuli',
        type: 'gem',
        rarity: 'rare',
        nodeType: 'crystal',
        color: '#26619C',
        glowIntensity: 0.9,
        properties: { conductivity: 0, strength: 0.35, weight: 0.40, energyValue: 0 },
        refinesTo: null,
        uses: ['trade'],
      },
    ],
    unlocks: ['alloy_system', 'pigment_chemistry'],
    dependencies: ['ms_car_complete'],
  },

  // ── East Africa ─────────────────────────────────────────────────────────

  {
    id: 'swahili',
    name: 'Swahili Coast',
    culture: 'Swahili',
    description: 'Iron-working masters and Indian Ocean traders. Tanzanite found nowhere else.',
    icon: '🌊',
    color: '#059669',
    // Swahili Coast — Indian Ocean traders; the coast/sea is the defining
    // feature even though materials (iron, gold, tanzanite) are inland.
    biome: BIOME.WATER,
    materials: [
      {
        id: 'iron_ore_swahili',
        name: 'Iron Ore',
        type: 'metal',
        rarity: 'common',
        nodeType: 'vein',
        color: '#8B4513',
        glowIntensity: 0.2,
        properties: { conductivity: 0.15, strength: 0.80, weight: 0.80, energyValue: 0 },
        refinesTo: 'iron_ingot',
        uses: ['structure', 'crafting'],
      },
      {
        id: 'gold_ore_swahili',
        name: 'Gold Ore',
        type: 'metal',
        rarity: 'uncommon',
        nodeType: 'vein',
        color: '#FFD700',
        glowIntensity: 0.7,
        properties: { conductivity: 0.90, strength: 0.15, weight: 0.95, energyValue: 0 },
        refinesTo: 'gold',
        uses: ['trade'],
      },
      {
        id: 'tanzanite',
        name: 'Tanzanite',
        type: 'gem',
        rarity: 'epic',
        nodeType: 'crystal',
        color: '#4169E1',
        glowIntensity: 1.0,
        properties: { conductivity: 0, strength: 0.50, weight: 0.35, energyValue: 0 },
        refinesTo: null,
        uses: ['trade'],
      },
      {
        id: 'garnet',
        name: 'Garnet',
        type: 'gem',
        rarity: 'rare',
        nodeType: 'crystal',
        color: '#8B0000',
        glowIntensity: 0.7,
        properties: { conductivity: 0, strength: 0.65, weight: 0.40, energyValue: 0 },
        refinesTo: null,
        uses: ['crafting', 'trade'],
      },
    ],
    unlocks: ['trade_networks', 'tool_upgrades'],
    dependencies: ['ms_boat_complete'],
  },

  // ── East Asia ───────────────────────────────────────────────────────────

  {
    id: 'chinese',
    name: 'Chinese Region',
    culture: 'Chinese',
    description: 'Rare earth elements, tungsten, and jade. The foundation of modern electronics.',
    icon: '🏯',
    color: '#B91C1C',
    // Existing data tagged "varied" (China spans many biomes); enum has no
    // multi-biome value, so UNKNOWN — terrain renderer can pick a default.
    biome: BIOME.UNKNOWN,
    materials: [
      {
        id: 'iron_ore_chinese',
        name: 'Iron Ore',
        type: 'metal',
        rarity: 'common',
        nodeType: 'vein',
        color: '#8B4513',
        glowIntensity: 0.2,
        properties: { conductivity: 0.15, strength: 0.80, weight: 0.80, energyValue: 0 },
        refinesTo: 'iron_ingot',
        uses: ['structure', 'crafting'],
      },
      {
        id: 'tungsten_ore',
        name: 'Tungsten Ore',
        type: 'metal',
        rarity: 'uncommon',
        nodeType: 'vein',
        color: '#4A4A4A',
        glowIntensity: 0.3,
        properties: { conductivity: 0.20, strength: 0.95, weight: 0.98, energyValue: 0 },
        refinesTo: 'tungsten',
        uses: ['structure', 'crafting'],
      },
      {
        id: 'rare_earth_ore',
        name: 'Rare Earth Elements',
        type: 'mineral',
        rarity: 'rare',
        nodeType: 'rock',
        color: '#9370DB',
        glowIntensity: 0.6,
        properties: { conductivity: 0.30, strength: 0.20, weight: 0.60, energyValue: 0.50 },
        refinesTo: 'rare_earth_refined',
        uses: ['battery', 'crafting'],
      },
      {
        id: 'jade',
        name: 'Jade',
        type: 'gem',
        rarity: 'uncommon',
        nodeType: 'crystal',
        color: '#00A86B',
        glowIntensity: 0.5,
        properties: { conductivity: 0, strength: 0.60, weight: 0.50, energyValue: 0 },
        refinesTo: null,
        uses: ['trade'],
      },
      {
        id: 'coal',
        name: 'Coal',
        type: 'energy',
        rarity: 'common',
        nodeType: 'rock',
        color: '#1C1C1C',
        glowIntensity: 0.1,
        properties: { conductivity: 0.10, strength: 0.10, weight: 0.30, energyValue: 0.80 },
        refinesTo: 'coke',
        uses: ['crafting'],
      },
    ],
    unlocks: ['electronics_advanced', 'industrial_energy'],
    dependencies: ['ms_plane_complete'],
  },

  // ── South Asia ──────────────────────────────────────────────────────────

  {
    id: 'pakistan',
    name: 'Pakistan Region',
    culture: 'South Asian',
    description: 'Emeralds from the Swat Valley, copper from Balochistan, salt from Khewra.',
    icon: '🏔️',
    color: '#065F46',
    // Karakoram/Himalayan foothills — Swat Valley emeralds, Khewra salt mine,
    // marble; clear mountain region.
    biome: BIOME.MOUNTAIN,
    materials: [
      {
        id: 'copper_ore_pakistan',
        name: 'Copper Ore',
        type: 'metal',
        rarity: 'common',
        nodeType: 'vein',
        color: '#B87333',
        glowIntensity: 0.2,
        properties: { conductivity: 0.95, strength: 0.35, weight: 0.90, energyValue: 0 },
        refinesTo: 'copper',
        uses: ['crafting', 'battery'],
      },
      {
        id: 'gold_ore_pakistan',
        name: 'Gold Ore',
        type: 'metal',
        rarity: 'rare',
        nodeType: 'vein',
        color: '#FFD700',
        glowIntensity: 0.7,
        properties: { conductivity: 0.90, strength: 0.15, weight: 0.95, energyValue: 0 },
        refinesTo: 'gold',
        uses: ['trade'],
      },
      {
        id: 'emerald',
        name: 'Emerald',
        type: 'gem',
        rarity: 'epic',
        nodeType: 'crystal',
        color: '#50C878',
        glowIntensity: 1.0,
        properties: { conductivity: 0, strength: 0.55, weight: 0.40, energyValue: 0 },
        refinesTo: null,
        uses: ['trade'],
      },
      {
        id: 'peridot',
        name: 'Peridot',
        type: 'gem',
        rarity: 'rare',
        nodeType: 'crystal',
        color: '#ADFF2F',
        glowIntensity: 0.6,
        properties: { conductivity: 0, strength: 0.50, weight: 0.35, energyValue: 0 },
        refinesTo: null,
        uses: ['trade'],
      },
      {
        id: 'pink_salt',
        name: 'Himalayan Pink Salt',
        type: 'mineral',
        rarity: 'common',
        nodeType: 'rock',
        color: '#FFB6C1',
        glowIntensity: 0.2,
        properties: { conductivity: 0.35, strength: 0.10, weight: 0.35, energyValue: 0 },
        refinesTo: 'salt_crystal',
        uses: ['crafting', 'trade'],
      },
      {
        id: 'marble_pakistan',
        name: 'Marble',
        type: 'mineral',
        rarity: 'uncommon',
        nodeType: 'rock',
        color: '#F0EAD6',
        glowIntensity: 0.3,
        properties: { conductivity: 0, strength: 0.50, weight: 0.45, energyValue: 0 },
        refinesTo: null,
        uses: ['structure', 'trade'],
      },
    ],
    unlocks: ['gem_refinement', 'construction_materials'],
    dependencies: ['ms_car_complete'],
  },

  // ── Southeast Asia ──────────────────────────────────────────────────────

  {
    id: 'malay',
    name: 'Malay Archipelago',
    culture: 'Malay',
    description: 'Tin, rubber, and bauxite. The materials that built modern lightweight engineering.',
    icon: '🌴',
    color: '#0891B2',
    // Malay Archipelago — tropical rainforest islands. Enum has no
    // jungle/forest value; archipelago could read as WATER but tin/bauxite/
    // rubber are land resources, so UNKNOWN until the enum grows.
    biome: BIOME.UNKNOWN,
    materials: [
      {
        id: 'tin_ore',
        name: 'Tin Ore',
        type: 'metal',
        rarity: 'common',
        nodeType: 'vein',
        color: '#C0C0C0',
        glowIntensity: 0.2,
        properties: { conductivity: 0.15, strength: 0.15, weight: 0.70, energyValue: 0 },
        refinesTo: 'tin',
        uses: ['crafting'],
      },
      {
        id: 'bauxite',
        name: 'Bauxite',
        type: 'mineral',
        rarity: 'uncommon',
        nodeType: 'rock',
        color: '#CD853F',
        glowIntensity: 0.2,
        properties: { conductivity: 0.05, strength: 0.30, weight: 0.40, energyValue: 0 },
        refinesTo: 'aluminum',
        uses: ['structure', 'crafting'],
      },
      {
        id: 'natural_rubber',
        name: 'Natural Rubber',
        type: 'organic',
        rarity: 'common',
        nodeType: 'rock',
        color: '#F5F5DC',
        glowIntensity: 0.1,
        properties: { conductivity: 0.01, strength: 0.15, weight: 0.15, energyValue: 0 },
        refinesTo: 'rubber',
        uses: ['crafting'],
      },
      {
        id: 'gold_ore_malay',
        name: 'Gold Ore',
        type: 'metal',
        rarity: 'rare',
        nodeType: 'vein',
        color: '#FFD700',
        glowIntensity: 0.7,
        properties: { conductivity: 0.90, strength: 0.15, weight: 0.95, energyValue: 0 },
        refinesTo: 'gold',
        uses: ['trade'],
      },
    ],
    unlocks: ['soldering', 'lightweight_engineering'],
    dependencies: ['ms_plane_complete'],
  },
];

export default REGIONS;

// ── Indexes ─────────────────────────────────────────────────────────────────

export const REGION_MAP = Object.fromEntries(REGIONS.map((r) => [r.id, r]));

export function getRegionMaterial(regionId, materialId) {
  const region = REGION_MAP[regionId];
  if (!region) return null;
  return region.materials.find((m) => m.id === materialId) || null;
}

export function getAllMineableMaterials() {
  const all = [];
  for (const region of REGIONS) {
    for (const mat of region.materials) {
      all.push({ ...mat, regionId: region.id, regionName: region.name });
    }
  }
  return all;
}

// Rarity spawn chances (used by mining system)
export const RARITY_CHANCE = {
  common: 0.60,
  uncommon: 0.25,
  rare: 0.10,
  epic: 0.05,
};

// Biome lookup helper — returns the BIOME enum value for a given region id,
// or BIOME.UNKNOWN if the region id is missing or has no biome tag.
export function getBiome(regionId) {
  return REGION_MAP[regionId]?.biome || BIOME.UNKNOWN;
}
