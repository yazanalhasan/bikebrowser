// aerodynamics.js — Chapter 6 (Plane) aerodynamics & flight rig (arc.md §3).
//
// The wind tunnel. Flight is the balance of four forces: lift vs weight, thrust
// vs drag. And it is where the spine's strength thread reaches its sharpest form:
// not just "strong enough" but "strong enough AND light enough" — a wing must
// carry its loads without being too heavy to fly. Four failure modes the chapter
// teaches: structural failure (wing too weak for the lift loads), stall (angle of
// attack too high), too-heavy (lift < weight), underpowered (thrust < drag).
// Data-driven, primitive-declaring.

// Airfoil shape sets how much lift it makes and the drag it pays, plus how well
// it tolerates a high angle of attack before stalling.
export const AIRFOIL_OPTIONS = [
  { id: 'flat', name: 'Flat plate', lift: 30, drag: 8, stallResist: 'low', note: 'Cheap; little lift and stalls early.' },
  { id: 'cambered', name: 'Cambered airfoil', lift: 55, drag: 16, stallResist: 'med', note: 'Strong lift for the weight — the classic wing.' },
  { id: 'thin', name: 'Thin high-speed', lift: 38, drag: 6, stallResist: 'high', note: 'Low drag, holds on at high angles; less lift.' },
];

// Angle of attack: more angle = more lift and drag, until the flow separates and
// the wing stalls.
export const ANGLE_OPTIONS = [
  { id: 'low', name: 'Low AoA', liftBonus: 0, dragBonus: 0, aoa: 'low', note: 'Safe and slippery, but little extra lift.' },
  { id: 'optimal', name: 'Optimal AoA', liftBonus: 18, dragBonus: 6, aoa: 'opt', note: 'Best lift-to-drag — the sweet spot.' },
  { id: 'high', name: 'High AoA', liftBonus: 30, dragBonus: 20, aoa: 'high', note: 'Max lift — but stalls unless the airfoil tolerates it.' },
];

// Structure: the strength-to-weight axis. Light AND strong is the goal.
export const STRUCTURE_OPTIONS = [
  { id: 'balsa', name: 'Balsa', weight: 20, strength: 25, note: 'Feather-light but too weak for flight loads.' },
  { id: 'aluminum', name: 'Aluminium', weight: 55, strength: 80, note: 'Strong, but heavy enough to hurt lift margin.' },
  { id: 'composite', name: 'Carbon composite', weight: 35, strength: 75, note: 'Light AND strong — the strength-to-weight winner.' },
];

export const ENGINE_OPTIONS = [
  { id: 'small', name: 'Small engine', thrust: 18, note: 'Efficient but may not overcome drag.' },
  { id: 'medium', name: 'Medium engine', thrust: 34, note: 'Enough thrust for a clean wing.' },
  { id: 'large', name: 'Large engine', thrust: 55, note: 'Plenty of thrust; heavier and thirstier.' },
];

export const PLANE_SLOTS = ['airfoil', 'angle', 'structure', 'engine'];

export const PLANE_CATALOG = {
  airfoil: AIRFOIL_OPTIONS,
  angle: ANGLE_OPTIONS,
  structure: STRUCTURE_OPTIONS,
  engine: ENGINE_OPTIONS,
};

export const PLANE_CHALLENGE = {
  id: 'plane_first_flight',
  title: 'Make the plane fly',
  vehicle: 'Plane',
  goal: 'Balance the four forces: lift over weight, thrust over drag — with a wing strong enough for the loads yet light enough to fly. Avoid the stall.',
  predictPrompt: 'In the wind tunnel: will it FLY, STALL, fail STRUCTURALLY, be TOO-HEAVY, or be UNDERPOWERED?',
  predictOptions: ['fly', 'stall', 'structural', 'too_heavy', 'underpowered'],
  idealSelection: { airfoil: 'cambered', angle: 'optimal', structure: 'composite', engine: 'medium' },
  teaches: 'Strength-to-weight peaks here: the wing must carry its lift loads AND be light enough to climb. Four forces in balance.',
};

export function planeOptionById(slot, id) {
  return (PLANE_CATALOG[slot] || []).find((o) => o.id === id) || null;
}

export default { AIRFOIL_OPTIONS, ANGLE_OPTIONS, STRUCTURE_OPTIONS, ENGINE_OPTIONS, PLANE_SLOTS, PLANE_CATALOG, PLANE_CHALLENGE, planeOptionById };
