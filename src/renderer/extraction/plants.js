// Desert plants + solvents for the ethnobotany extraction bench (Ch 2 biology).
export const PLANTS = [
  { id: 'desert_marigold', name: 'Desert Marigold', color: '#E8C84A', polarity: 'polar', yield: { water: 2.1, ethanol_95: 6.4, hexane: 0.8, ethyl_acetate: 4.2 }, profile: [
    { e: 3.2, i: 0.85, name: 'Quercetin', color: '#F5C518', target: true }, { e: 4.8, i: 0.62, name: 'Luteolin', color: '#E8A020', target: true },
    { e: 1.1, i: 0.30, name: 'Solvent Front', color: '#AAAAAA' }, { e: 6.5, i: 0.18, name: 'Chlorophyll', color: '#55AA55' }] },
  { id: 'mesquite_bark', name: 'Mesquite Bark', color: '#8B4513', polarity: 'polar', yield: { water: 8.3, ethanol_95: 9.1, hexane: 0.3, ethyl_acetate: 3.5 }, profile: [
    { e: 2.4, i: 0.91, name: 'Condensed Tannins', color: '#8B3A0F', target: true }, { e: 3.7, i: 0.74, name: 'Proanthocyanidins', color: '#A0522D', target: true },
    { e: 1.0, i: 0.25, name: 'Solvent Front', color: '#AAAAAA' }, { e: 5.2, i: 0.12, name: 'Gallic Acid', color: '#C09060' }] },
  { id: 'prickly_pear', name: 'Prickly Pear', color: '#CC2244', polarity: 'polar', yield: { water: 7.8, ethanol_95: 5.9, hexane: 0.1, ethyl_acetate: 1.4 }, profile: [
    { e: 2.1, i: 0.95, name: 'Betanin', color: '#CC1133', target: true }, { e: 3.0, i: 0.58, name: 'Indicaxanthin', color: '#FFD700', target: true },
    { e: 1.0, i: 0.40, name: 'Solvent Front', color: '#AAAAAA' }, { e: 4.5, i: 0.10, name: 'Mucilage', color: '#DDBBAA' }] },
  { id: 'chaparral', name: 'Chaparral', color: '#6B8E23', polarity: 'nonpolar', yield: { water: 0.5, ethanol_95: 3.8, hexane: 11.2, ethyl_acetate: 8.6 }, profile: [
    { e: 7.4, i: 0.88, name: 'NDGA', color: '#4A7C20', target: true }, { e: 8.1, i: 0.45, name: 'NDGA isomer', color: '#6AAF30', target: true },
    { e: 1.2, i: 0.20, name: 'Solvent Front', color: '#AAAAAA' }, { e: 5.8, i: 0.30, name: 'Resin wax', color: '#C8B860' }] },
];
export const SOLVENTS = [
  { id: 'water', name: 'Water', color: '#A8D8F0', polarity: 'polar', safety: 5 },
  { id: 'ethanol_95', name: 'Ethanol 95%', color: '#F5F0D8', polarity: 'polar', safety: 3 },
  { id: 'hexane', name: 'Hexane', color: '#E8E8D0', polarity: 'nonpolar', safety: 1 },
  { id: 'ethyl_acetate', name: 'Ethyl Acetate', color: '#DFF0CC', polarity: 'mixed', safety: 2 },
];
export const getPlantById = (id) => PLANTS.find((p) => p.id === id) || PLANTS[0];
export const getSolventById = (id) => SOLVENTS.find((s) => s.id === id) || SOLVENTS[0];
