/**
 * Knowledge State v1 — Seen / Interacted / Understood.
 *
 * Uses the proposed defaults in knowledge-state-substrate.md §13:
 * 13.1 B layer (does not replace state.observations or state.knowledge),
 * 13.2 coarse concept ids, 13.3 A binary Understood, 13.4 A no forgetting,
 * 13.5 B a correction overwrites sources, 13.7 A entries stay in their
 * own domain tables (this module only stores ids the caller already has).
 *
 * Primitive declarations (arc.md §8.1):
 * - Consults: none of the geographic discovery set.
 * - Updates: state.knowledgeState only.
 * - Scales: the same three states apply in later acts. No act fork.
 *
 * Cultural domain: ids starting with "cultural:" are refused unless the
 * entry was passed with requiresDesignBrief: true (substrate §13.9 A+B).
 * This module does not author cultural text.
 *
 * No scene imports.
 */

const RANK = { seen: 1, interacted: 2, understood: 3 };

function emptyBook() {
  return { entries: {} };
}

function bookOf(state) {
  const current = state?.knowledgeState;
  if (!current || typeof current !== 'object' || !current.entries) return emptyBook();
  return { entries: { ...current.entries } };
}

function assertId(id) {
  if (typeof id !== 'string' || !id) {
    throw new Error('knowledgeState: id is required');
  }
}

export function canAuthorKnowledgeId(id, entry = {}) {
  if (!String(id).startsWith('cultural:')) return true;
  return entry.requiresDesignBrief === true;
}

export function markKnowledge(state, id, level, source = 'play', entry = {}) {
  assertId(id);
  if (!RANK[level]) throw new Error(`knowledgeState: unknown level ${level}`);
  if (!canAuthorKnowledgeId(id, entry)) {
    throw new Error('knowledgeState: cultural entries need a human design brief');
  }
  const book = bookOf(state);
  const prev = book.entries[id];
  const prevRank = prev ? RANK[prev.level] || 0 : 0;
  const nextRank = RANK[level];
  if (prev && nextRank < prevRank) {
    return state;
  }
  const sources = Array.isArray(prev?.sources) ? [...prev.sources] : [];
  if (source && !sources.includes(source)) sources.push(source);
  book.entries[id] = {
    id,
    level,
    sources,
    updatedAt: new Date().toISOString(),
    ...(entry.requiresDesignBrief === true ? { requiresDesignBrief: true } : {}),
  };
  return { ...state, knowledgeState: book };
}

export function knowledgeLevel(state, id) {
  return state?.knowledgeState?.entries?.[id]?.level || null;
}

export function hasKnowledge(state, id, level = 'seen') {
  const current = knowledgeLevel(state, id);
  if (!current || !RANK[level]) return false;
  return RANK[current] >= RANK[level];
}
