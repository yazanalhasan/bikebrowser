// Riding missions the engine is rated against (parallels the UTM build tasks).
export const BIKE_MISSIONS = [
  { id: 'hill_climb', name: 'Hill Climb', description: 'Sustained uphill run — needs strong low-end torque and adequate power.', minPowerKw: 35, minTorqueNm: 60, minPeakTorqueRPM: 6000 },
  { id: 'track_sprint', name: 'Track Sprint', description: 'Short, high-speed sprint — peak power is critical.', minPowerKw: 80, minTorqueNm: 70, minPeakTorqueRPM: null },
  { id: 'enduro', name: 'Enduro Off-Road', description: 'Technical trail riding — controllable power delivery, low weight.', minPowerKw: 25, minTorqueNm: 40, minPeakTorqueRPM: 7000 },
  { id: 'touring', name: 'Long Distance Touring', description: 'Highway cruising — broad torque band, fuel efficiency.', minPowerKw: 30, minTorqueNm: 75, minPeakTorqueRPM: 5000 },
];

export const DEFAULT_MISSION = BIKE_MISSIONS[0];
export const getMissionById = (id) => BIKE_MISSIONS.find((m) => m.id === id) || DEFAULT_MISSION;
