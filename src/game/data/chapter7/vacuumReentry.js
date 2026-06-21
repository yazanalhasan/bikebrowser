// vacuumReentry.js — Chapter 7 (Spacecraft) vacuum & extremes rig (arc.md §3).
//
// The vacuum / re-entry chamber — the finale of the mechanical spine and the
// gateway to Act 3 (Space → the alien planet). Here the carry-forward thread
// reaches its final form: strong enough AND light enough AND *redundant* enough.
// Four lessons the chamber certifies: propulsion must push against nothing (no air
// to breathe or shove), the shield must survive re-entry heat, life support must
// keep a crew alive, and no single component may be a fatal single point of
// failure. Data-driven, primitive-declaring.

// Propulsion: only reaction engines work in vacuum (Newton's third law, carrying
// their own reaction mass). An air-breathing engine has nothing to ingest.
export const PROPULSION_OPTIONS = [
  { id: 'air_breathing', name: 'Air-breathing jet', vacuumCapable: false, note: 'Needs atmosphere to ingest — dead in vacuum.' },
  { id: 'chemical', name: 'Chemical rocket', vacuumCapable: true, note: 'Carries its own oxidiser — works anywhere.' },
  { id: 'ion', name: 'Ion thruster', vacuumCapable: true, note: 'Reaction mass expelled electrically — vacuum-native.' },
];

// Heat shield: re-entry dumps enormous heat; the shield must out-rate it.
export const SHIELD_OPTIONS = [
  { id: 'none', name: 'No shield', protection: 0, note: 'Burns up on re-entry.' },
  { id: 'ablative', name: 'Ablative shield', protection: 70, note: 'Carries heat away by burning off — proven.' },
  { id: 'ceramic', name: 'Ceramic tiles', protection: 90, note: 'Re-usable high-temperature tiles.' },
];

// Life support: a crewed flight needs to recycle air/water and reject heat.
export const LIFE_OPTIONS = [
  { id: 'none', name: 'None', capacity: 0, note: 'No crewed flight survives this.' },
  { id: 'basic', name: 'Open-loop', capacity: 1, note: 'Consumables only — works for a short hop.' },
  { id: 'recycling', name: 'Closed-loop recycling', capacity: 2, note: 'Recycles air & water — sustains a crew.' },
];

// Redundancy: how many independent backups a critical system has.
export const REDUNDANCY_OPTIONS = [
  { id: 'single', name: 'Single string', failTolerance: 0, note: 'One fault anywhere is mission-ending.' },
  { id: 'dual', name: 'Dual redundant', failTolerance: 1, note: 'Survives one failure of a critical system.' },
  { id: 'triple', name: 'Triple redundant', failTolerance: 2, note: 'Survives two — crewed-flight standard.' },
];

export const SPACE_SLOTS = ['propulsion', 'shield', 'life', 'redundancy'];

export const SPACE_CATALOG = {
  propulsion: PROPULSION_OPTIONS,
  shield: SHIELD_OPTIONS,
  life: LIFE_OPTIONS,
  redundancy: REDUNDANCY_OPTIONS,
};

// Re-entry heat the shield must beat (carried as a chamber constant).
export const REENTRY_HEAT = 60;

export const SPACE_CHALLENGE = {
  id: 'spacecraft_certify',
  title: 'Certify the spacecraft for launch',
  vehicle: 'Spacecraft',
  goal: 'Certify a crewed spacecraft: propulsion that works in vacuum, a shield that survives re-entry, closed-loop life support, and redundancy so no single failure is fatal.',
  predictPrompt: 'In the vacuum / re-entry chamber: will it CERTIFY, fail in VACUUM, BURN-UP on re-entry, lose LIFE-SUPPORT, or have a SINGLE-POINT-FAILURE?',
  predictOptions: ['certified', 'vacuum_fail', 'burn_up', 'life_fail', 'single_point'],
  idealSelection: { propulsion: 'chemical', shield: 'ceramic', life: 'recycling', redundancy: 'dual' },
  teaches: 'The spine completes: strong AND light AND redundant. Certification means surviving every extreme, with backups for the critical few.',
};

export function spaceOptionById(slot, id) {
  return (SPACE_CATALOG[slot] || []).find((o) => o.id === id) || null;
}

export default { PROPULSION_OPTIONS, SHIELD_OPTIONS, LIFE_OPTIONS, REDUNDANCY_OPTIONS, SPACE_SLOTS, SPACE_CATALOG, REENTRY_HEAT, SPACE_CHALLENGE, spaceOptionById };
