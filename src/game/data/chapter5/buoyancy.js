// buoyancy.js — Chapter 5 (Boat) fluid-dynamics & buoyancy rig (arc.md §3).
//
// The buoyancy/hydro tank opens Act 2 (Sea & Air). Archimedes: a hull floats if
// it displaces water weighing more than the whole boat — and it stays upright only
// if its weight sits low enough (ballast) relative to its beam. Two failure modes
// the chapter teaches: SINK (too heavy for the displacement) and CAPSIZE (top-heavy
// / too narrow). Salt corrosion is the new material concern carried into Act 2.
// Data-driven, primitive-declaring.

// Hulls declare how much water they can displace (volume) and their beam (width →
// righting stability).
export const HULL_OPTIONS = [
  { id: 'skiff', name: 'Narrow skiff', volume: 90, beam: 2, note: 'Slips through water; tippy and low capacity.' },
  { id: 'dinghy', name: 'Beamy dinghy', volume: 140, beam: 3, note: 'A balance of capacity and stability.' },
  { id: 'barge', name: 'Wide barge', volume: 240, beam: 5, note: 'Huge displacement and very stable — but heavy.' },
];

// Hull material sets weight and salt-water corrosion (Act 2's new material axis).
export const MATERIAL_OPTIONS = [
  { id: 'pine', name: 'Pine', weightFactor: 1.0, corrosion: 'low', note: 'Light and cheap; needs sealing.' },
  { id: 'steel', name: 'Steel', weightFactor: 1.5, corrosion: 'high', note: 'Strong but heavy — and rusts in salt water.' },
  { id: 'aluminum', name: 'Aluminium', weightFactor: 0.7, corrosion: 'low', note: 'Light and salt-resistant.' },
];

export const CARGO_OPTIONS = [
  { id: 'light', name: 'Light cargo', weight: 30, topWeight: 1, note: 'Easy to float and keep upright.' },
  { id: 'medium', name: 'Medium cargo', weight: 80, topWeight: 4, note: 'A useful load for the crossing.' },
  { id: 'heavy', name: 'Heavy cargo', weight: 150, topWeight: 8, note: 'Lots of weight, and it rides high.' },
];

// Ballast adds weight DOWN LOW — it costs displacement margin but buys stability.
export const BALLAST_OPTIONS = [
  { id: 'none', name: 'No ballast', weight: 0, stab: 0, note: 'Lightest, but nothing to right the boat.' },
  { id: 'low', name: 'Low ballast', weight: 20, stab: 3, note: 'A little weight in the keel — much steadier.' },
  { id: 'heavy', name: 'Heavy ballast', weight: 70, stab: 4, note: 'Very stable, but eats your buoyancy margin.' },
];

export const BOAT_SLOTS = ['hull', 'material', 'cargo', 'ballast'];

export const BOAT_CATALOG = {
  hull: HULL_OPTIONS,
  material: MATERIAL_OPTIONS,
  cargo: CARGO_OPTIONS,
  ballast: BALLAST_OPTIONS,
};

export const BOAT_CHALLENGE = {
  id: 'boat_crossing',
  title: 'Float the boat across the salt water',
  vehicle: 'Boat',
  goal: 'Build a boat that floats with the cargo (displaces more than it weighs), stays upright (low weight, enough beam), and resists salt corrosion.',
  predictPrompt: 'Lower it into the tank: will it FLOAT, SINK (too heavy for its displacement), or CAPSIZE (top-heavy)?',
  predictOptions: ['float', 'sink', 'capsize'],
  idealSelection: { hull: 'dinghy', material: 'aluminum', cargo: 'medium', ballast: 'low' },
  teaches: 'Buoyancy = displaced water weight; stability = weight kept low under enough beam. Salt corrosion now picks the material.',
};

export function boatOptionById(slot, id) {
  return (BOAT_CATALOG[slot] || []).find((o) => o.id === id) || null;
}

export default { HULL_OPTIONS, MATERIAL_OPTIONS, CARGO_OPTIONS, BALLAST_OPTIONS, BOAT_SLOTS, BOAT_CATALOG, BOAT_CHALLENGE, boatOptionById };
