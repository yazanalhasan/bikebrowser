// Phase 2.2 — Discovery Registry. Everything the player discovers becomes a
// persistent record, grouped by category. Other systems (ecology, materials,
// investigation, engineering, language, NPCs, landmarks) register discoveries
// as the player earns them; each genuinely-new discovery fires "NEW DISCOVERY"
// feedback. The registry is the connective tissue between the notebook, the
// ecology loop, investigations, and engineering.
export const DISCOVERY_CATEGORIES = [
  'plant', 'animal', 'material', 'engineering', 'investigation', 'npc_fact', 'language', 'landmark',
];

const CATEGORY_LABEL = {
  plant: 'Plants', animal: 'Animals', material: 'Materials', engineering: 'Engineering',
  investigation: 'Investigations', npc_fact: 'People', language: 'Language', landmark: 'Landmarks',
};

export class DiscoveryRegistrySystem {
  static carryForward = {
    environmentalPrimitives: ['discovery', 'category', 'persistence'],
    progressionPrimitives: ['discovery_registered', 'category_expanded'],
    actScalingPath: 'The registry generalises: every later biome/act feeds the same persistent, categorised knowledge base.',
  };

  constructor() {
    this.entries = new Map(); // id -> { id, category, title, detail, source }
    this.order = []; // insertion order of ids
    this.newIds = new Set();
  }

  // Register a discovery. Returns isNew=false (idempotent) if already known, so
  // callers can fire "NEW DISCOVERY" feedback only on genuinely new knowledge.
  register({ id, category, title, detail = '', source = '' }) {
    if (!id || !category) return { ok: false, reason: 'missing_fields' };
    if (!DISCOVERY_CATEGORIES.includes(category)) return { ok: false, reason: 'unknown_category', category };
    if (this.entries.has(id)) {
      return { ok: true, isNew: false, entry: this.entries.get(id) };
    }
    const entry = { id, category, title: title || id, detail, source };
    this.entries.set(id, entry);
    this.order.push(id);
    this.newIds.add(id);
    return { ok: true, isNew: true, entry };
  }

  markSeen(id = null) {
    if (id) this.newIds.delete(id); else this.newIds.clear();
    return { ok: true };
  }

  byCategory() {
    const grouped = {};
    for (const category of DISCOVERY_CATEGORIES) grouped[category] = [];
    for (const id of this.order) {
      const e = this.entries.get(id);
      grouped[e.category].push({ ...e, isNew: this.newIds.has(e.id) });
    }
    return grouped;
  }

  getState() {
    const grouped = this.byCategory();
    const categoryCounts = DISCOVERY_CATEGORIES.map((c) => ({ category: c, label: CATEGORY_LABEL[c], count: grouped[c].length }));
    const lastId = this.order[this.order.length - 1] || null;
    return {
      total: this.order.length,
      newCount: this.newIds.size,
      categories: categoryCounts,
      byCategory: grouped,
      entries: this.order.map((id) => ({ ...this.entries.get(id), isNew: this.newIds.has(id) })),
      last: lastId ? { ...this.entries.get(lastId), isNew: this.newIds.has(lastId) } : null,
    };
  }

  loadState(state = {}) {
    this.entries = new Map();
    this.order = [];
    this.newIds = new Set();
    for (const e of state.entries || []) {
      if (!e || !e.id || !e.category) continue;
      this.entries.set(e.id, { id: e.id, category: e.category, title: e.title || e.id, detail: e.detail || '', source: e.source || '' });
      this.order.push(e.id);
      if (e.isNew) this.newIds.add(e.id);
    }
  }
}
