// systemsBio.js — Chapter 7 biology pillar (arc.md §3 biological spine finale).
//
// Systems biology & life engineering: what happens to the WHOLE system if I
// change one part — and should I? On the alien planet the player seeds a closed
// ecosystem and learns that a self-sustaining loop needs every role (producer,
// consumer, decomposer) in balance, that removing or overloading one cascades
// through the rest, and — the game's north star — that you only act with
// monitoring and a way to undo it. "Should I?" is part of the engineering.
// Data-driven, primitive-declaring.

// Primary producer: turns light + CO₂ into oxygen and biomass — the energy base.
export const PRODUCER_OPTIONS = [
  { id: 'algae', name: 'Algae', producer: true, note: 'Photosynthesises — the oxygen and food base of the loop.' },
  { id: 'none_p', name: 'No producer', producer: false, note: 'Nothing captures energy — the system can\'t start.' },
];

// Decomposer: recycles dead matter back into nutrients. Without it nutrients lock up.
export const DECOMPOSER_OPTIONS = [
  { id: 'microbes', name: 'Decomposer microbes', decomposer: true, note: 'Recycle dead matter into nutrients — closes the loop.' },
  { id: 'none_d', name: 'No decomposer', decomposer: false, note: 'Nutrients lock up in dead matter; the loop starves.' },
];

// Consumer: grazes the producer, keeping it in check. None → the producer blooms
// and crashes.
export const CONSUMER_OPTIONS = [
  { id: 'grazers', name: 'Grazers', balanced: true, note: 'Keep the producer in check without wiping it out.' },
  { id: 'none_c', name: 'No consumer', balanced: false, note: 'The producer blooms unchecked, then crashes.' },
];

// The approach — the "should I?" axis. Only a monitored, reversible intervention
// is responsible at planetary scale.
export const APPROACH_OPTIONS = [
  { id: 'monitored', name: 'Monitored & reversible', responsible: true, note: 'Small, watched, with a way to undo it.' },
  { id: 'release', name: 'Release & leave', responsible: false, note: 'Large, irreversible — you change a whole world with no undo.' },
];

export const ECO_SLOTS = ['producer', 'decomposer', 'consumer', 'approach'];

export const ECO_CATALOG = {
  producer: PRODUCER_OPTIONS,
  decomposer: DECOMPOSER_OPTIONS,
  consumer: CONSUMER_OPTIONS,
  approach: APPROACH_OPTIONS,
};

export const ECO_CHALLENGE = {
  id: 'terraform_loop',
  title: 'Seed a self-sustaining ecosystem',
  vehicle: 'Spacecraft',
  goal: 'Engineer a closed loop on the alien planet: a producer for energy, a decomposer to recycle nutrients, a consumer to keep balance — and do it responsibly, monitored and reversible.',
  predictPrompt: 'Release the system: will it be STABLE, fail with NO BASE, lock up nutrients (NUTRIENT LOCKUP), bloom & crash (ALGAE BLOOM), or work but be RECKLESS (irreversible)?',
  predictOptions: ['stable', 'no_base', 'nutrient_lockup', 'algae_bloom', 'reckless'],
  idealSelection: { producer: 'algae', decomposer: 'microbes', consumer: 'grazers', approach: 'monitored' },
  teaches: 'A whole system needs every role in balance; change one part and the rest cascade. And the last question of engineering is not "can I?" but "should I?"',
};

export function ecoOptionById(slot, id) {
  return (ECO_CATALOG[slot] || []).find((o) => o.id === id) || null;
}

export default { PRODUCER_OPTIONS, DECOMPOSER_OPTIONS, CONSUMER_OPTIONS, APPROACH_OPTIONS, ECO_SLOTS, ECO_CATALOG, ECO_CHALLENGE, ecoOptionById };
