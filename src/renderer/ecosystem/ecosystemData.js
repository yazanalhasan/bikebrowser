// Ecosystem capstone (Ch7 biology): a 4-trophic-level food web tuned by the
// player, then run through an extended Lotka–Volterra model.
export const SPECIES = [
  { id: 'plants', name: 'Desert Plants', trophic: 'producer', color: '#3A7D44', initialPop: 500, cap: 1000, max: 1000, step: 10 },
  { id: 'herbivores', name: 'Mule Deer', trophic: 'herbivore', color: '#4A90D9', initialPop: 80, cap: 200, max: 200, step: 1 },
  { id: 'predators', name: 'Coyote', trophic: 'predator', color: '#E67E22', initialPop: 20, cap: 60, max: 200, step: 1 },
  { id: 'decomposers', name: 'Fungi / Bacteria', trophic: 'decomposer', color: '#8B5E3C', initialPop: 100, cap: 500, max: 200, step: 1 },
];

// Interaction + vital-rate constants from the spec.
export const PARAMS = {
  r_P: 0.8, a_PH: 0.004, b_PH: 0.0008, d_H: 0.15, a_HC: 0.002, b_HC: 0.0016, d_C: 0.20, k_D: 0.30,
};
export const CAPS = { plants: 1000, herbivores: 200, predators: 60, decomposers: 500 };
export const getSpeciesById = (id) => SPECIES.find((s) => s.id === id);
