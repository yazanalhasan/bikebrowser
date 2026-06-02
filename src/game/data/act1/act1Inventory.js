// Phase 1.4 — Inventory metadata.
// Per-item facts (quantity is tracked at runtime). category/tags/source make
// items reasoned-about objects, and engineering/ecology attributes let the UTM,
// bridge, ecology, and future crafting systems consume the same item facts.
// Durability/strength values are grounded in act1Materials + act1Ecology.
export const act1InventoryMetadata = {
  mesquite: {
    category: 'material', type: 'organic', tags: ['wood', 'desert', 'renewable'],
    source: 'desert ecology', durability: 0.64,
    engineering: { strengthBand: 'medium', bridgeSafe: true, bestUse: 'deck planks' },
    ecology: { species: 'mesquite', harvestEthic: 'take little; leave habitat' },
  },
  steel: {
    category: 'material', type: 'metal', tags: ['metal', 'strong', 'imported'],
    source: 'salvage yard', durability: 0.94,
    engineering: { strengthBand: 'high', bridgeSafe: true, bestUse: 'main support' },
    ecology: null,
  },
  copper_brace: {
    category: 'material', type: 'metal', tags: ['metal', 'brace', 'corrosion-resistant'],
    source: 'local trader', durability: 0.70,
    engineering: { strengthBand: 'medium', bridgeSafe: true, bestUse: 'triangular brace' },
    ecology: null,
  },
  weak_scrap: {
    category: 'material', type: 'scrap', tags: ['scrap', 'brittle', 'unsafe'],
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
