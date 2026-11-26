/**
 * Act 1 progress — Sonoran neighborhood completion gate.
 *
 * Primitive declarations (arc.md §8.1):
 * - Consults: quest completion, materialLog, reputation. Does not read a
 *   biome string and does not invent a second discovery set.
 * - Updates: state.act1 (milestone stamp only) and one journal line.
 *   Geographic discovery stays in discoverySystem.
 * - Scales: the same gate shape (required quest groups + a trust number)
 *   can name Act 2 groups later without an Act-1-only code fork.
 *
 * No scene imports.
 */

export const ACT1_TRUST = 40;

export const ACT1_GATES = [
  {
    id: 'bike',
    label: 'Bike rolls (tire and chain)',
    questsAll: ['flat_tire_repair', 'chain_repair'],
  },
  {
    id: 'bridge',
    label: 'Bridge holds',
    questsAny: ['bridge_collapse'],
  },
  {
    id: 'materials',
    label: 'Materials tested',
    questsAny: ['bridge_collapse', 'heat_failure', 'perfect_composite', 'desert_coating'],
    materialLog: true,
  },
  {
    id: 'ecology',
    label: 'Desert plants and animals',
    questsAny: ['desert_healer', 'food_chain_tracker', 'desert_survival'],
  },
  {
    id: 'chemistry',
    label: 'Medicine dose (help vs harm)',
    questsAny: ['medicine_balance'],
  },
  {
    id: 'trust',
    label: 'Neighbors trust you',
    reputation: ACT1_TRUST,
  },
];

function hasQuest(state, id) {
  return (state?.completedQuests || []).includes(id);
}

export function evaluateAct1(state) {
  const reputation = state?.reputation || 0;
  const materialCount = Array.isArray(state?.materialLog) ? state.materialLog.length : 0;
  const rows = ACT1_GATES.map((gate) => {
    let done = false;
    if (gate.questsAll) done = gate.questsAll.every((id) => hasQuest(state, id));
    if (gate.questsAny) done = done || gate.questsAny.some((id) => hasQuest(state, id));
    if (gate.materialLog) done = done || materialCount > 0;
    if (gate.reputation) done = done || reputation >= gate.reputation;
    return { id: gate.id, label: gate.label, done };
  });
  const complete = rows.every((row) => row.done);
  return {
    complete,
    rows,
    systemsUpgrade: complete ? 'regional_travel' : null,
  };
}

/**
 * Stamp the milestone once. Safe to call after every quest finish.
 * Does not remove quests or observations.
 */
export function stampAct1(state) {
  const report = evaluateAct1(state);
  const previous = state?.act1 || {};
  if (previous.complete && report.complete) {
    return { ...state, act1: { ...previous, ...report, systemsUpgrade: 'regional_travel' } };
  }
  const journal = state?.journal || [];
  const line = report.complete
    ? '🗺️ Wider map unlocked. The bike, the bridge, and your neighbors opened the road beyond the desert.'
    : null;
  return {
    ...state,
    act1: {
      complete: report.complete,
      systemsUpgrade: report.systemsUpgrade,
      stampedAt: report.complete ? new Date().toISOString() : previous.stampedAt || null,
    },
    journal: line && !journal.includes(line) ? [...journal, line] : journal,
  };
}
