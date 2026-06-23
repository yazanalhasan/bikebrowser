// Phytochemistry lab (Ch3 biology): plant extracts + colorimetric/TLC assays.
// A test reads "positive" when its target compound class is present in the
// extract — the player learns to fingerprint a plant's chemistry.
export const TESTS = [
  { id: 'folin', name: 'Folin–Ciocalteu', reagent: 'Folin reagent + Na₂CO₃', target: 'polyphenols', positiveColor: '#1e40af', negativeColor: '#eef2f6', lambdaMax: 765, epsilon: 4200, rf: 0.20, spotColor: '#1e40af', reactionMs: 1800 },
  { id: 'flavonoid', name: 'Flavonoid (AlCl₃)', reagent: 'Aluminium chloride', target: 'flavonoids', positiveColor: '#ca8a04', negativeColor: '#eef2f6', lambdaMax: 420, epsilon: 3900, rf: 0.55, spotColor: '#eab308', reactionMs: 2200 },
  { id: 'tannin', name: 'Tannin (FeCl₃)', reagent: 'Ferric chloride', target: 'tannins', positiveColor: '#1c1917', negativeColor: '#eef2f6', lambdaMax: 560, epsilon: 5800, rf: 0.30, spotColor: '#44403c', reactionMs: 1500 },
  { id: 'alkaloid', name: 'Alkaloid (Dragendorff)', reagent: 'Dragendorff reagent', target: 'alkaloids', positiveColor: '#ea580c', negativeColor: '#eef2f6', lambdaMax: 520, epsilon: 3100, rf: 0.70, spotColor: '#ea580c', reactionMs: 2000 },
  { id: 'anthocyanin', name: 'Anthocyanin pH', reagent: 'pH 1 → pH 13', target: 'anthocyanins', positiveColor: '#dc2626', negativeColor: '#16a34a', lambdaMax: 530, epsilon: 26900, rf: 0.45, spotColor: '#dc2626', reactionMs: 2600 },
  { id: 'saponin', name: 'Saponin (Foam)', reagent: 'Vigorous shaking', target: 'saponins', positiveColor: '#f8fafc', negativeColor: '#eef2f6', lambdaMax: 270, epsilon: 1800, rf: 0.85, spotColor: '#cbd5e1', reactionMs: 3000 },
];

export const EXTRACTS = [
  { id: 'hypericum', name: "St. John's Wort", binomial: 'Hypericum perforatum', color: '#C9A227', solvent: 'ethanol', conc: 80, compounds: ['polyphenols', 'flavonoids', 'tannins', 'anthocyanins'] },
  { id: 'willow', name: 'White Willow Bark', binomial: 'Salix alba', color: '#9C7A4A', solvent: 'water', conc: 95, compounds: ['polyphenols', 'tannins'] },
  { id: 'echinacea', name: 'Echinacea', binomial: 'Echinacea purpurea', color: '#B5497B', solvent: 'ethanol', conc: 70, compounds: ['polyphenols', 'flavonoids', 'alkaloids'] },
  { id: 'soapwort', name: 'Soapwort', binomial: 'Saponaria officinalis', color: '#7FA86B', solvent: 'water', conc: 60, compounds: ['saponins', 'flavonoids'] },
];

export const getExtractById = (id) => EXTRACTS.find((e) => e.id === id) || EXTRACTS[0];
