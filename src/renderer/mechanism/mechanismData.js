// Molecular Mechanism Bench (Ch6 biology): enzymes, substrates, cofactors.
// The player assembles a catalytic pathway and reads Michaelis–Menten kinetics.
export const ENZYMES = [
  { id: 'amylase', name: 'Amylase', substrateId: 'starch', cofactorId: 'water', Km: 1.5, Vmax: 42.0, product: 'Glucose', color: '#6366F1', activeSite: '#818CF8', reaction: 'hydrolysis', summary: 'Cleaves α-1,4 glycosidic bonds in starch via acid-base catalysis.' },
  { id: 'catalase', name: 'Catalase', substrateId: 'h2o2', cofactorId: 'heme', Km: 3.2, Vmax: 88.0, product: 'H₂O + O₂', color: '#7C3AED', activeSite: '#A78BFA', reaction: 'oxidation', summary: 'Dismutates H₂O₂ into water and oxygen using a heme iron cofactor.' },
  { id: 'hexokinase', name: 'Hexokinase', substrateId: 'glucose', cofactorId: 'atp', Km: 0.1, Vmax: 55.0, product: 'Glucose-6-P', color: '#4F46E5', activeSite: '#818CF8', reaction: 'phosphorylation', summary: 'Transfers ATP’s γ-phosphate to glucose C6, priming glycolysis.' },
  { id: 'dna_pol', name: 'DNA Polymerase', substrateId: 'nucleotide', cofactorId: 'mg2plus', Km: 0.05, Vmax: 120.0, product: 'Extended DNA', color: '#3730A3', activeSite: '#6366F1', reaction: 'phosphorylation', summary: 'Extends a primer via 3′-OH nucleophilic attack on dNTP, using Mg²⁺.' },
];

export const SUBSTRATES = [
  { id: 'starch', name: 'Starch fragment', conc: 2.0, color: '#22C55E', atomCount: 6, formula: '(C₆H₁₀O₅)ₙ', bonds: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]] },
  { id: 'h2o2', name: 'Hydrogen Peroxide', conc: 5.0, color: '#F87171', atomCount: 2, formula: 'H₂O₂', bonds: [[0, 1]] },
  { id: 'glucose', name: 'Glucose', conc: 1.0, color: '#4ADE80', atomCount: 6, formula: 'C₆H₁₂O₆', bonds: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0]] },
  { id: 'nucleotide', name: 'dNTP', conc: 0.2, color: '#60A5FA', atomCount: 5, formula: 'dNTP', bonds: [[0, 1], [1, 2], [2, 3], [3, 4]] },
];

export const COFACTORS = [
  { id: 'water', name: 'Water (H₂O)', color: '#38BDF8' },
  { id: 'heme', name: 'Heme (Fe)', color: '#B91C1C' },
  { id: 'atp', name: 'ATP', color: '#F59E0B' },
  { id: 'mg2plus', name: 'Mg²⁺', color: '#A3E635' },
];

export const getEnzymeById = (id) => ENZYMES.find((e) => e.id === id) || ENZYMES[0];
export const getSubstrateById = (id) => SUBSTRATES.find((s) => s.id === id);
