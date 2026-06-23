// Heat-shield materials for the vacuum/re-entry chamber (Ch 7).
export const THERMAL_MATERIALS = [
  { id: 'pica', name: 'PICA Ablator', color: '#2a1a0a', density: 270, k: 0.4, cp: 1260, ablationRate: 0.08, outgassing: 'low', maxServiceTemp: 1700, meltingPoint: 3600 },
  { id: 'carbon-carbon', name: 'Carbon-Carbon', color: '#1a1a1a', density: 1600, k: 6.3, cp: 711, ablationRate: 0.03, outgassing: 'low', maxServiceTemp: 1800, meltingPoint: 3500 },
  { id: 'aluminum-6061', name: 'Aluminum 6061-T6', color: '#b0b8c0', density: 2700, k: 167, cp: 896, ablationRate: 2.4, outgassing: 'medium', maxServiceTemp: 300, meltingPoint: 652 },
  { id: 'ceramic-tile', name: 'HRSI Ceramic Tile', color: '#e8e8e8', density: 144, k: 0.059, cp: 628, ablationRate: 0.0, outgassing: 'high', maxServiceTemp: 1260, meltingPoint: 1650 },
];
export const getThermalById = (id) => THERMAL_MATERIALS.find((m) => m.id === id) || THERMAL_MATERIALS[0];
