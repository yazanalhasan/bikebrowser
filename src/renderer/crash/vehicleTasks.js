// Pass/fail thresholds for the Chapter 4 vehicle tests.
export const VEHICLE_TASKS = {
  passenger_safety: {
    id: 'passenger_safety', name: 'Passenger Safety', testType: 'crash',
    suitable: { maxPeakGForce: 50, maxIntrusionMm: 150, minEnergyAbsorptionPct: 70 },
    marginal: { maxPeakGForce: 100, maxIntrusionMm: 300, minEnergyAbsorptionPct: 50 },
  },
  frame_integrity: {
    id: 'frame_integrity', name: 'Frame Integrity', testType: 'load',
    suitable: { minUltimateLoadKN: 80, maxDeflectionMm: 15 },
    marginal: { minUltimateLoadKN: 50, maxDeflectionMm: 25 },
  },
};
