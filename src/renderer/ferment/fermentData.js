// Fermentation bench (Ch5 biology): microbes + substrates + growth kinetics.
export const ORGANISMS = [
  { id: 'saccharomyces', name: "Brewer's Yeast", binomial: 'Saccharomyces cerevisiae', type: 'yeast', color: '#d4a017', optimalTempC: 30, optimalPH: 5.0, lagPhase_h: 2, doublingTime_h: 1.5, maxOD: 8.0, yield: 0.51, product: 'Ethanol', pHDrop: 0.1, aerobe: 'facultative' },
  { id: 'lactobacillus', name: 'Lactic Acid Bacteria', binomial: 'Lactobacillus acidophilus', type: 'bacteria', color: '#f0e68c', optimalTempC: 37, optimalPH: 6.0, lagPhase_h: 1.5, doublingTime_h: 1.0, maxOD: 5.5, yield: 0.90, product: 'Lactic Acid', pHDrop: 0.25, aerobe: 'anaerobe' },
  { id: 'ecoli', name: 'E. coli K-12', binomial: 'Escherichia coli K-12', type: 'bacteria', color: '#90ee90', optimalTempC: 37, optimalPH: 7.0, lagPhase_h: 1.0, doublingTime_h: 0.5, maxOD: 10.0, yield: 0.40, product: 'Recombinant Protein', pHDrop: 0.05, aerobe: 'aerobe' },
  { id: 'aspergillus', name: 'Black Mold (citric)', binomial: 'Aspergillus niger', type: 'mold', color: '#8a6d3b', optimalTempC: 33, optimalPH: 3.5, lagPhase_h: 6, doublingTime_h: 4.0, maxOD: 6.0, yield: 0.70, product: 'Citric Acid', pHDrop: 0.30, aerobe: 'aerobe' },
];

export const SUBSTRATES = [
  { id: 'glucose', name: 'Glucose Solution', sugar: 200, color: '#f5f0dc', compatibility: ['saccharomyces', 'ecoli', 'lactobacillus'] },
  { id: 'molasses', name: 'Cane Molasses', sugar: 480, color: '#3b1f0a', compatibility: ['saccharomyces', 'aspergillus'] },
  { id: 'corn_steep', name: 'Corn Steep Liquor', sugar: 150, color: '#c8a84b', compatibility: ['ecoli', 'lactobacillus'] },
  { id: 'hydrolysate', name: 'Plant Hydrolysate', sugar: 120, color: '#8fbc8f', compatibility: ['saccharomyces', 'aspergillus', 'lactobacillus'] },
];

export const getOrganismById = (id) => ORGANISMS.find((o) => o.id === id) || ORGANISMS[0];
export const getSubstrateById = (id) => SUBSTRATES.find((s) => s.id === id) || SUBSTRATES[0];
