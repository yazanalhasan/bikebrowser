// crashLoad.js — Chapter 4 (Car) systems-integration & safety rig (arc.md §3).
//
// The crash/load test. The spine so far: strong enough (Ch1) → rated for the
// current (Ch2) → strong AND cool AND won't knock (Ch3). Chapter 4 adds the
// counterintuitive safety lesson: a front that *folds* (a crumple zone) protects
// the people inside better than a rigid one, because it spreads the impact over
// time and absorbs energy — as long as the cabin cage around them does NOT fold.
// "Manage the energy, protect the cell." Data-driven, primitive-declaring.

// The frontal structure: how much impact energy it absorbs by crumpling, and how
// much it risks folding back INTO the cabin if it's too soft.
export const FRONT_OPTIONS = [
  { id: 'rigid', name: 'Rigid front', crumple: 0.10, intrusionRisk: 0.0, note: 'Barely deforms — transmits almost the whole hit to the occupants.' },
  { id: 'crumple', name: 'Crumple zone', crumple: 0.55, intrusionRisk: 0.1, note: 'Folds in a controlled way, absorbing energy and lowering peak g.' },
  { id: 'soft', name: 'Soft front', crumple: 0.80, intrusionRisk: 0.8, note: 'Absorbs a lot — but folds into the cabin unless the cage is strong.' },
];

// The survival cell around the occupants. Must NOT collapse.
export const CAGE_OPTIONS = [
  { id: 'light', name: 'Light cage', strength: 40, note: 'Light & cheap; intrudes under a hard hit.' },
  { id: 'reinforced', name: 'Reinforced cage', strength: 85, note: 'Heavier, but keeps the survival space intact.' },
];

// Restraints reduce how much of the deceleration reaches the occupant's body.
export const RESTRAINT_OPTIONS = [
  { id: 'none', name: 'No restraint', gReduction: 0.0, note: 'The occupant takes the full deceleration.' },
  { id: 'belt', name: 'Seatbelt', gReduction: 0.25, note: 'Spreads load across the strong parts of the body.' },
  { id: 'belt_airbag', name: 'Belt + airbag', gReduction: 0.40, note: 'Belt + airbag ride-down — lowest occupant g.' },
];

// Load distribution affects stability (a separate handling check).
export const LOAD_OPTIONS = [
  { id: 'front_heavy', name: 'Front-heavy', balanced: false, note: 'Noses in; understeers and pitches forward.' },
  { id: 'balanced', name: 'Balanced', balanced: true, note: 'Even weight — stable and predictable.' },
  { id: 'rear_heavy', name: 'Rear-heavy', balanced: false, note: 'Tail-happy; can swap ends under load.' },
];

export const CRASH_SLOTS = ['front', 'cage', 'restraint', 'load'];

export const CRASH_CATALOG = {
  front: FRONT_OPTIONS,
  cage: CAGE_OPTIONS,
  restraint: RESTRAINT_OPTIONS,
  load: LOAD_OPTIONS,
};

export const CRASH_CHALLENGE = {
  id: 'car_crash_safety',
  title: 'Pass the crash & load test',
  vehicle: 'Car',
  goal: 'Build a car that keeps the occupant under survivable g in a frontal crash AND keeps the cabin intact AND stays balanced. A crumple zone helps — but only with a cabin cage that holds.',
  predictPrompt: 'Before the crash sled fires: will it be SAFE, COLLAPSE (cabin intrudes), HIGH-G (occupant injury), or UNSTABLE (poor balance)?',
  predictOptions: ['safe', 'collapse', 'high_g', 'unstable'],
  idealSelection: { front: 'crumple', cage: 'reinforced', restraint: 'belt_airbag', load: 'balanced' },
  teaches: 'A controlled crumple lowers peak g while a stiff cage protects the survival cell — softer-in-front can be safer.',
};

export function crashOptionById(slot, id) {
  return (CRASH_CATALOG[slot] || []).find((o) => o.id === id) || null;
}

export default { FRONT_OPTIONS, CAGE_OPTIONS, RESTRAINT_OPTIONS, LOAD_OPTIONS, CRASH_SLOTS, CRASH_CATALOG, CRASH_CHALLENGE, crashOptionById };
