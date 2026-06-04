import { act1NotebookEntries } from '../../data/act1/index.js';

export class NotebookSystem {
  static carryForward = {
    environmentalPrimitives: ['observed_feature', 'tested_material', 'social_context'],
    progressionPrimitives: ['notebook_entry_unlocked', 'evidence_recorded'],
    actScalingPath: 'Act 1 observations become searchable evidence cards for regional and space systems in Acts 2 and 3.',
  };

  constructor(entries = act1NotebookEntries) {
    this.entries = new Map(entries.map((entry) => [entry.id, entry]));
    this.unlocked = new Set();
    this.newEntries = new Set();
  }

  unlock(entryId) {
    if (!this.entries.has(entryId)) return { ok: false, reason: 'unknown_entry', entryId };
    const isNew = !this.unlocked.has(entryId);
    this.unlocked.add(entryId);
    if (isNew) this.newEntries.add(entryId);
    return { ok: true, entryId, isNew, entry: this.entries.get(entryId) };
  }

  ensureEntry(entry, defaultCategory = 'Ecology') {
    if (!entry?.id || this.entries.has(entry.id)) return;
    this.entries.set(entry.id, { category: defaultCategory, ...entry });
  }

  unlockMany(entryIds = []) {
    return entryIds.map((entryId) => this.unlock(entryId));
  }

  getState() {
    const unlockedOrder = [...this.unlocked];
    return {
      unlocked: unlockedOrder,
      newEntries: [...this.newEntries],
      categories: this.getCategories(),
      entries: [...this.entries.values()].map((entry) => ({
        ...entry,
        unlocked: this.unlocked.has(entry.id),
        unlockedIndex: unlockedOrder.indexOf(entry.id),
        isNew: this.newEntries.has(entry.id),
      })),
    };
  }

  markSeen(entryId = null) {
    if (entryId) {
      this.newEntries.delete(entryId);
    } else {
      this.newEntries.clear();
    }
    return { ok: true };
  }

  getCategories() {
    const counts = {};
    for (const entry of this.entries.values()) {
      counts[entry.category] = counts[entry.category] || { total: 0, unlocked: 0 };
      counts[entry.category].total += 1;
      if (this.unlocked.has(entry.id)) counts[entry.category].unlocked += 1;
    }
    return counts;
  }

  loadState(state = {}) {
    this.unlocked = new Set(state.unlocked || []);
    this.newEntries = new Set(state.newEntries || []);
  }
}
