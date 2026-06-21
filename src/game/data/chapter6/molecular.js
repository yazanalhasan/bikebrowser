// molecular.js — Chapter 6 biology pillar (arc.md §3 biological spine).
//
// Molecular biology: what MECHANISM (DNA / RNA / protein / enzyme) explains an
// observation? This closes the willow thread the game started in Chapter 1's
// ecology and Chapter 3's phytochemistry: *why* does willow tea reduce pain? The
// player assembles the molecular explanation — the active molecule, the target it
// acts on, and how it acts — and the bench validates whether that chain actually
// accounts for the observation. Mechanism, never prescription (§2). Data-driven.

// The candidate active molecule (from the willow extraction in Ch3).
export const MOLECULE_OPTIONS = [
  { id: 'salicylic_acid', name: 'Salicylic acid', active: true, note: 'Salicin is converted to this in the body — the active form.' },
  { id: 'tannin', name: 'Tannin', active: false, note: 'Astringent, but not what relieves the pain.' },
  { id: 'caffeine', name: 'Caffeine', active: false, note: 'A different plant alkaloid — wrong molecule entirely.' },
];

// What it acts ON — and which biological level that is.
export const TARGET_OPTIONS = [
  { id: 'cox_enzyme', name: 'COX enzyme', level: 'protein', correct: true, note: 'A protein enzyme that builds inflammatory signals.' },
  { id: 'dna', name: 'DNA', level: 'gene', correct: false, note: 'Genes — but salicylates don\'t act here.' },
  { id: 'membrane', name: 'Cell membrane', level: 'cell', correct: false, note: 'Structural — not the inflammatory pathway.' },
];

// How it acts. (Slot key is `effect`, not `action`, to avoid colliding with the
// trigger-graph's interaction-`action:` heuristic; the player-facing label is
// still "Action".)
export const EFFECT_OPTIONS = [
  { id: 'inhibits', name: 'Inhibits', correct: true, note: 'Blocks the enzyme — fewer inflammatory signals made.' },
  { id: 'activates', name: 'Activates', correct: false, note: 'Would increase signalling — the opposite of relief.' },
  { id: 'binds_randomly', name: 'Binds randomly', correct: false, note: 'No specific, explanatory effect.' },
];

export const MECH_SLOTS = ['molecule', 'target', 'effect'];

export const MECH_CATALOG = {
  molecule: MOLECULE_OPTIONS,
  target: TARGET_OPTIONS,
  effect: EFFECT_OPTIONS,
};

export const MECH_CHALLENGE = {
  id: 'willow_mechanism',
  title: 'Explain why willow tea reduces pain',
  observation: 'Willow tea reduces pain and inflammation.',
  vehicle: 'Plane',
  goal: 'Assemble the molecular mechanism behind the willow remedy: the active molecule, the target it acts on, and how it acts. The chain must actually explain the observation.',
  predictPrompt: 'Submit your mechanism: does it EXPLAIN the observation, or is it the WRONG MOLECULE, WRONG TARGET, or WRONG ACTION?',
  predictOptions: ['mechanism', 'wrong_molecule', 'wrong_target', 'wrong_action'],
  idealSelection: { molecule: 'salicylic_acid', target: 'cox_enzyme', effect: 'inhibits' },
  teaches: 'A mechanism connects molecule → target → effect at the right biological level. Salicylic acid inhibits the COX protein, cutting the inflammatory signal.',
};

export function mechOptionById(slot, id) {
  return (MECH_CATALOG[slot] || []).find((o) => o.id === id) || null;
}

export default { MOLECULE_OPTIONS, TARGET_OPTIONS, EFFECT_OPTIONS, MECH_SLOTS, MECH_CATALOG, MECH_CHALLENGE, mechOptionById };
