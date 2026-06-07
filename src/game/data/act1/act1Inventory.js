// Phase 1.4 — Inventory metadata.
// Per-item facts (quantity is tracked at runtime). category/tags/source make
// items reasoned-about objects, and engineering/ecology attributes let the UTM,
// bridge, ecology, and future crafting systems consume the same item facts.
// Durability/strength values are grounded in act1Materials + act1Ecology.
export const act1InventoryMetadata = {
  balsa: {
    category: 'material', type: 'wood', tags: ['wood', 'light', 'utm'],
    source: 'Mr. Chen material tray', durability: 0.2,
    engineering: { strengthBand: 'low', bridgeSafe: false, bestUse: 'light model panels' },
    ecology: null,
  },
  pine: {
    category: 'material', type: 'wood', tags: ['wood', 'utm'],
    source: 'Mr. Chen material tray', durability: 0.4,
    engineering: { strengthBand: 'medium', bridgeSafe: true, bestUse: 'temporary deck planks' },
    ecology: null,
  },
  bamboo: {
    category: 'material', type: 'organic', tags: ['fiber', 'light', 'utm'],
    source: 'Mr. Chen material tray', durability: 0.6,
    engineering: { strengthBand: 'medium-high', bridgeSafe: true, bestUse: 'light deck and braces' },
    ecology: null,
  },
  brick: {
    category: 'material', type: 'ceramic', tags: ['brittle', 'compression', 'utm'],
    source: 'Mr. Chen material tray', durability: 0.5,
    engineering: { strengthBand: 'compression-only', bridgeSafe: false, bestUse: 'stacked compression pier' },
    ecology: null,
  },
  concrete: {
    category: 'material', type: 'composite', tags: ['compression', 'weak-tension', 'utm'],
    source: 'Mr. Chen material tray', durability: 0.6,
    engineering: { strengthBand: 'compression-only', bridgeSafe: false, bestUse: 'compression footing' },
    ecology: null,
  },
  iron: {
    category: 'material', type: 'metal', tags: ['metal', 'heavy', 'utm'],
    source: 'Mr. Chen material tray', durability: 0.7,
    engineering: { strengthBand: 'high', bridgeSafe: true, bestUse: 'short support post' },
    ecology: null,
  },
  steel: {
    category: 'material', type: 'metal', tags: ['metal', 'strong', 'imported', 'utm'],
    source: 'salvage yard', durability: 0.94,
    engineering: { strengthBand: 'high', bridgeSafe: true, bestUse: 'main support' },
    ecology: null,
  },
  carbon_fiber: {
    category: 'material', type: 'composite', tags: ['light', 'stiff', 'brittle', 'utm'],
    source: 'Mr. Chen material tray', durability: 0.9,
    engineering: { strengthBand: 'very-high', bridgeSafe: true, bestUse: 'high-performance tension member' },
    ecology: null,
  },
  mesquite: {
    category: 'material', type: 'organic', tags: ['wood', 'desert', 'renewable', 'legacy'],
    source: 'desert ecology', durability: 0.64,
    engineering: { strengthBand: 'medium', bridgeSafe: true, bestUse: 'deck planks' },
    ecology: { species: 'mesquite', harvestEthic: 'take little; leave habitat' },
  },
  copper_brace: {
    category: 'material', type: 'metal', tags: ['metal', 'brace', 'corrosion-resistant', 'legacy'],
    source: 'local trader', durability: 0.70,
    engineering: { strengthBand: 'medium', bridgeSafe: true, bestUse: 'triangular brace' },
    ecology: null,
  },
  weak_scrap: {
    category: 'material', type: 'scrap', tags: ['scrap', 'brittle', 'unsafe', 'legacy'],
    source: 'roadside', durability: 0.20,
    engineering: { strengthBand: 'low', bridgeSafe: false, bestUse: 'not for bridge load' },
    ecology: null,
  },
  patch_kit: {
    category: 'tool', type: 'repair', tags: ['repair', 'bike'], source: 'starting kit',
    durability: 0.80, engineering: null, ecology: null,
  },
  tire_lever: {
    category: 'tool', type: 'repair', tags: ['repair', 'bike'], source: 'starting kit',
    durability: 0.90, engineering: null, ecology: null,
  },
  bike: {
    category: 'vehicle', type: 'bike', tags: ['vehicle', 'rideable'], source: 'home',
    durability: 0.85, engineering: null, ecology: null,
  },
};

export function inventoryMetadataFor(itemId) {
  return act1InventoryMetadata[itemId] || {
    category: 'unknown', type: 'unknown', tags: [], source: 'unknown',
    durability: null, engineering: null, ecology: null,
  };
}
