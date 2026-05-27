export class InventorySystem {
  static carryForward = {
    environmentalPrimitives: ['material_source', 'tool_source'],
    progressionPrimitives: ['item_acquired', 'material_sample_acquired'],
    actScalingPath: 'Inventory stays player-owned so later terrain, ecology, and construction systems can consume the same item facts.',
  };

  constructor() {
    this.items = new Set(['bike', 'patch_kit', 'tire_lever']);
  }

  add(itemId) {
    this.items.add(itemId);
    return { ok: true, itemId };
  }

  addMany(itemIds = []) {
    return itemIds.map((itemId) => this.add(itemId));
  }

  has(itemId) {
    return this.items.has(itemId);
  }

  getState() {
    return { items: [...this.items] };
  }

  loadState(state = {}) {
    this.items = new Set(state.items || ['bike', 'patch_kit', 'tire_lever']);
  }
}
