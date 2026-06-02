import { inventoryMetadataFor } from '../../data/act1/index.js';

export class InventorySystem {
  static carryForward = {
    environmentalPrimitives: ['material_source', 'tool_source', 'item_metadata'],
    progressionPrimitives: ['item_acquired', 'material_sample_acquired'],
    actScalingPath: 'Inventory stays player-owned with metadata so later terrain, ecology, construction, and crafting systems consume the same item facts.',
  };

  constructor() {
    // id -> quantity. Metadata is data-driven (act1Inventory.js), not per copy.
    this.items = new Map([
      ['bike', 1],
      ['patch_kit', 1],
      ['tire_lever', 1],
    ]);
  }

  add(itemId, quantity = 1) {
    this.items.set(itemId, (this.items.get(itemId) || 0) + quantity);
    return { ok: true, itemId, quantity: this.items.get(itemId) };
  }

  addMany(itemIds = []) {
    return itemIds.map((itemId) => this.add(itemId));
  }

  has(itemId) {
    return this.items.has(itemId);
  }

  getQuantity(itemId) {
    return this.items.get(itemId) || 0;
  }

  // Full item view: runtime quantity + data-driven metadata.
  getItem(itemId) {
    return { id: itemId, quantity: this.getQuantity(itemId), ...inventoryMetadataFor(itemId) };
  }

  getState() {
    const ids = [...this.items.keys()];
    return {
      items: ids, // backward-compatible array of ids
      details: ids.map((id) => this.getItem(id)),
      categories: ids.reduce((acc, id) => {
        const { category } = inventoryMetadataFor(id);
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {}),
    };
  }

  loadState(state = {}) {
    const ids = Array.isArray(state.items) && state.items.length ? state.items : ['bike', 'patch_kit', 'tire_lever'];
    const quantityById = new Map((state.details || []).map((detail) => [detail.id, detail.quantity]));
    this.items = new Map(ids.map((id) => [id, quantityById.get(id) || 1]));
  }
}
