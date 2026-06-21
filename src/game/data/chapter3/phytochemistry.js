// phytochemistry.js — Chapter 3 biology pillar (arc.md §3 biological spine).
//
// Phytochemistry answers the question Chapter 2's ethnobotany raised: *why* does
// the extraction method change the outcome? Because solvent polarity, temperature
// and time decide WHICH molecules come out of the plant and in what state. The
// player extracts a target compound (salicin, the pain molecule in willow) and
// learns that the wrong solvent pulls the wrong compound class, too much heat
// degrades the target, and over-extraction drags out bitter tannins.
// Data-driven, primitive-declaring — the model reads these numbers/flags.

// Solvent polarity selects the compound CLASS. Salicin is polar (water-soluble);
// a non-polar solvent pulls waxes/resins instead.
export const SOLVENT_OPTIONS = [
  { id: 'oil', name: 'Oil (non-polar)', polar: false, note: 'Dissolves waxes & resins — not the polar target.' },
  { id: 'water', name: 'Water (polar)', polar: true, aggressive: false, note: 'Dissolves polar compounds like salicin.' },
  { id: 'alcohol', name: 'Ethanol (polar)', polar: true, aggressive: true, note: 'Polar and strong — pulls salicin, but also more tannins.' },
];

// Temperature: too cold under-extracts; too hot degrades a heat-sensitive target.
export const TEMP_OPTIONS = [
  { id: 'cold', name: 'Cold', level: 0, note: 'Gentle, but slow — little comes out.' },
  { id: 'warm', name: 'Warm (~60°C)', level: 1, note: 'Enough energy to extract without cooking the target.' },
  { id: 'hot', name: 'Boiling', level: 2, note: 'Fast — but degrades salicin and pulls bitter tannins.' },
];

// Time: too short under-extracts; too long over-extracts (tannins).
export const TIME_OPTIONS = [
  { id: 'short', name: 'Short steep', level: 0, note: 'Barely any compound diffuses out.' },
  { id: 'medium', name: 'Medium steep', level: 1, note: 'The target compound reaches good concentration.' },
  { id: 'long', name: 'Long steep', level: 2, note: 'Over-extracts — bitter tannins follow the target out.' },
];

// Grind: surface area controls how fast compounds diffuse out.
export const GRIND_OPTIONS = [
  { id: 'whole', name: 'Whole bark', surface: 0, note: 'Low surface area — slow, weak extraction.' },
  { id: 'ground', name: 'Ground bark', surface: 1, note: 'High surface area — efficient extraction.' },
];

export const PHYTO_SLOTS = ['solvent', 'temp', 'time', 'grind'];

export const PHYTO_CATALOG = {
  solvent: SOLVENT_OPTIONS,
  temp: TEMP_OPTIONS,
  time: TIME_OPTIONS,
  grind: GRIND_OPTIONS,
};

export const PHYTO_CHALLENGE = {
  id: 'willow_salicin',
  title: 'Extract salicin from willow bark',
  source: 'Willow bark',
  target: 'salicin',
  vehicle: 'Motorcycle',
  goal: 'Extract pure salicin (the pain compound) from willow bark. Choose a solvent that dissolves it, enough heat and time to pull it out — but not so much that you degrade it or drag out bitter tannins.',
  predictPrompt: 'Run the extraction: will you get PURE salicin, the WRONG compound (waxes), a DEGRADED target, or a BITTER tannin-laden brew?',
  predictOptions: ['pure', 'wrong_compound', 'degraded', 'bitter', 'low_yield'],
  idealSelection: { solvent: 'water', temp: 'warm', time: 'medium', grind: 'ground' },
  teaches: 'Solvent polarity selects the compound class; heat/time decide yield vs degradation. The same bark gives salicin, waxes, or tannins depending on how you pull.',
};

export function phytoOptionById(slot, id) {
  return (PHYTO_CATALOG[slot] || []).find((o) => o.id === id) || null;
}

export default { SOLVENT_OPTIONS, TEMP_OPTIONS, TIME_OPTIONS, GRIND_OPTIONS, PHYTO_SLOTS, PHYTO_CATALOG, PHYTO_CHALLENGE, phytoOptionById };
