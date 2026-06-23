export const SPACE_MISSIONS = [
  { id: 'leo-return', name: 'LEO Return', requirements: { maxPeakTemp: 1700, maxAblationLoss: 30, vacuumIntegrity: ['PASS', 'MARGINAL'], maxGForce: 10 } },
  { id: 'lunar-return', name: 'Lunar Return', requirements: { maxPeakTemp: 1700, maxAblationLoss: 25, vacuumIntegrity: ['PASS'], maxGForce: 12 } },
  { id: 'mars-return', name: 'Mars Return', requirements: { maxPeakTemp: 1800, maxAblationLoss: 20, vacuumIntegrity: ['PASS'], maxGForce: 15 } },
  { id: 'suborbital', name: 'Suborbital Hop', requirements: { maxPeakTemp: 800, maxAblationLoss: 10, vacuumIntegrity: ['PASS', 'MARGINAL'], maxGForce: 6 } },
];
export const DEFAULT_SPACE_MISSION = SPACE_MISSIONS[0];
export const getSpaceMissionById = (id) => SPACE_MISSIONS.find((m) => m.id === id) || DEFAULT_SPACE_MISSION;
