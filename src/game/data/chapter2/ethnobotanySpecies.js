// ethnobotanySpecies.js — Chapter 2 biology pillar (arc.md §3 biological spine).
//
// Ethnobotany asks: how do humans turn a plant into food, fiber, dye, medicine,
// fuel? The lesson the Extraction Bench makes visible is that the **method
// changes the outcome** — the same plant part yields different things (or
// nothing) depending on how you process it. That foreshadows Chapter 3
// (phytochemistry: *why* the method changes what comes out).
//
// Single-authority discipline (§8.6): a species is ONE entity with facets. These
// records carry the ethnobotany facet (parts + uses); the same `speciesId` is the
// hook for the ecology facet already in act1Ecology and for later chemistry/
// pharmacology facets. Data-driven and primitive-declaring: each part declares
// which method unlocks which product, so the model reads — never hard-codes — the
// verdict.

// Processing methods the player can apply at the bench.
export const METHODS = [
  { id: 'roast', name: 'Roast', verb: 'roast', hint: 'heat — breaks down tough tissue into food' },
  { id: 'grind', name: 'Grind', verb: 'grind', hint: 'mill dry material into flour or powder' },
  { id: 'ret', name: 'Ret', verb: 'ret', hint: 'soak & separate — frees long fibres from pulp' },
  { id: 'steep', name: 'Steep', verb: 'steep', hint: 'decoct in hot water — draws out compounds' },
  { id: 'press', name: 'Press', verb: 'press', hint: 'crush to release juice, sap or oil' },
  { id: 'ferment', name: 'Ferment', verb: 'ferment', hint: 'let microbes transform sugars' },
];

// Use categories (what humans get out). These become the biology↔gameplay hooks.
export const USE_CATEGORIES = ['food', 'fiber', 'dye', 'medicine', 'fuel', 'drink'];

// Each species declares parts; each part declares the ONE correct method and the
// product it yields, plus the most tempting WRONG method and why it fails — the
// teaching contrast.
export const ETHNOBOTANY_SPECIES = [
  {
    id: 'agave', name: 'Agave', region: 'Sonoran Desert',
    parts: [
      { id: 'leaf', name: 'leaf', method: 'ret', product: 'cordage', category: 'fiber',
        wrong: { method: 'grind', because: 'grinding a wet leaf just makes mush — fibre must be retted free of the pulp.' } },
      { id: 'heart', name: 'heart (piña)', method: 'roast', product: 'sweet food', category: 'food',
        wrong: { method: 'press', because: 'pressing the raw heart yields bitter sap — roasting converts it to sugar.' } },
      { id: 'sap', name: 'sap (aguamiel)', method: 'ferment', product: 'fermented drink', category: 'drink',
        wrong: { method: 'steep', because: 'steeping sap does nothing useful — its sugars need microbes, not hot water.' } },
    ],
  },
  {
    id: 'mesquite', name: 'Mesquite', region: 'Sonoran Desert',
    parts: [
      { id: 'pods', name: 'pods', method: 'grind', product: 'mesquite flour', category: 'food',
        wrong: { method: 'roast', because: 'roasting scorches the pods — the sweet flour comes from grinding them dry.' } },
      { id: 'wood', name: 'wood', method: 'roast', product: 'charcoal fuel', category: 'fuel',
        wrong: { method: 'ret', because: 'soaking wood rots it — charring (slow roast) makes the fuel.' } },
    ],
  },
  {
    id: 'creosote', name: 'Creosote bush', region: 'Sonoran Desert',
    parts: [
      { id: 'leaves', name: 'leaves', method: 'steep', product: 'soothing salve', category: 'medicine',
        wrong: { method: 'grind', because: 'ground dry leaves lose the resin — a hot-water steep draws the active compounds.' } },
    ],
  },
  {
    id: 'prickly_pear', name: 'Prickly pear', region: 'Sonoran Desert',
    parts: [
      { id: 'pad', name: 'pad (nopal)', method: 'roast', product: 'nopales food', category: 'food',
        wrong: { method: 'ret', because: 'retting the pad just slimes it — roasting tenderises it into food.' } },
      { id: 'fruit', name: 'fruit (tuna)', method: 'press', product: 'fruit syrup', category: 'food',
        wrong: { method: 'grind', because: 'grinding crushes the seeds bitter — press the fruit for sweet syrup.' } },
      { id: 'cochineal', name: 'cochineal', method: 'grind', product: 'crimson dye', category: 'dye',
        wrong: { method: 'steep', because: 'steeping dulls the colour — the dye is ground from the dried insects.' } },
    ],
  },
];

export function speciesById(id) {
  return ETHNOBOTANY_SPECIES.find((s) => s.id === id) || null;
}

export function methodById(id) {
  return METHODS.find((m) => m.id === id) || null;
}

export default { METHODS, USE_CATEGORIES, ETHNOBOTANY_SPECIES, speciesById, methodById };
