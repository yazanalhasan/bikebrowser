// microbiology.js — Chapter 5 biology pillar (arc.md §3 biological spine).
//
// Microbiology: why does fermentation work, and how do microbes reshape an
// ecosystem? The Fermentation Bench. The lesson is that the PRODUCT depends on
// which microbe you culture and the conditions you give it — the same sugar
// becomes alcohol, vinegar or sour pickle depending on the organism and whether
// it has oxygen; too much heat kills the culture; no sugar means no food.
// Data-driven, primitive-declaring.

// Substrate must contain fermentable sugar to feed the microbes.
export const SUBSTRATE_OPTIONS = [
  { id: 'fruit_juice', name: 'Fruit juice', sugar: true, note: 'Rich in fermentable sugar.' },
  { id: 'sugar_water', name: 'Sugar water', sugar: true, note: 'Pure sugar to ferment.' },
  { id: 'sterile_water', name: 'Sterile water', sugar: false, note: 'No sugar — nothing for microbes to eat.' },
];

// The microbe decides the product.
export const MICROBE_OPTIONS = [
  { id: 'yeast', name: 'Yeast', makes: 'alcohol', needsOxygen: false, note: 'Ferments sugar to alcohol — without oxygen.' },
  { id: 'acetobacter', name: 'Acetobacter', makes: 'vinegar', needsOxygen: true, note: 'Turns alcohol/sugar to vinegar — needs oxygen.' },
  { id: 'lactobacillus', name: 'Lactobacillus', makes: 'sour', needsOxygen: false, note: 'Makes lactic acid — sours & preserves food.' },
];

export const TEMP_OPTIONS = [
  { id: 'cold', name: 'Cold', level: 0, note: 'Microbes go dormant — almost no activity.' },
  { id: 'warm', name: 'Warm (~30°C)', level: 1, note: 'Microbes thrive and work fast.' },
  { id: 'hot', name: 'Hot (boiling)', level: 2, note: 'Kills the culture outright.' },
];

export const OXYGEN_OPTIONS = [
  { id: 'sealed', name: 'Sealed (anaerobic)', oxygen: false, note: 'No air — favours alcohol/lactic fermentation.' },
  { id: 'open', name: 'Open (aerobic)', oxygen: true, note: 'Air available — favours vinegar / aerobic growth.' },
];

export const FERMENT_SLOTS = ['substrate', 'microbe', 'temp', 'oxygen'];

export const FERMENT_CATALOG = {
  substrate: SUBSTRATE_OPTIONS,
  microbe: MICROBE_OPTIONS,
  temp: TEMP_OPTIONS,
  oxygen: OXYGEN_OPTIONS,
};

export const FERMENT_CHALLENGE = {
  id: 'ferment_alcohol',
  title: 'Ferment sugar into alcohol',
  vehicle: 'Boat',
  goal: 'Culture the right microbe under the right conditions to ferment sugar into alcohol — feed it, keep it warm (not hot), and deny it oxygen.',
  predictPrompt: 'Seal the jar and wait: will you get ALCOHOL, VINEGAR, a SOUR brew, a DEAD culture, or just AEROBIC growth (no alcohol)?',
  predictOptions: ['alcohol', 'vinegar', 'sour', 'dead', 'aerobic_growth'],
  idealSelection: { substrate: 'fruit_juice', microbe: 'yeast', temp: 'warm', oxygen: 'sealed' },
  teaches: 'Same sugar, different microbe & conditions → alcohol, vinegar or sour. Microbes are how ecosystems recycle and transform matter.',
};

export function fermentOptionById(slot, id) {
  return (FERMENT_CATALOG[slot] || []).find((o) => o.id === id) || null;
}

export default { SUBSTRATE_OPTIONS, MICROBE_OPTIONS, TEMP_OPTIONS, OXYGEN_OPTIONS, FERMENT_SLOTS, FERMENT_CATALOG, FERMENT_CHALLENGE, fermentOptionById };
