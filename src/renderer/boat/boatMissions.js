export const BOAT_MISSIONS = [
  { id: 'river_crossing', name: 'River Crossing', description: 'Calm freshwater crossing, loaded with supplies.', requirements: { GM_min: 0.4, draft_max: 0.5, stability_min: ['STABLE', 'MARGINAL'], maxSpeed_min: 5 } },
  { id: 'coastal_patrol', name: 'Coastal Patrol', description: 'Near-shore patrol in moderate chop.', requirements: { GM_min: 0.6, draft_max: 0.45, stability_min: ['STABLE'], maxSpeed_min: 10 } },
  { id: 'race', name: 'Speed Race', description: 'Flat-water sprint — speed over everything.', requirements: { GM_min: 0.2, draft_max: 0.5, stability_min: ['STABLE', 'MARGINAL'], maxSpeed_min: 18 } },
];
export const DEFAULT_BOAT_MISSION = BOAT_MISSIONS[0];
export const getBoatMissionById = (id) => BOAT_MISSIONS.find((m) => m.id === id) || DEFAULT_BOAT_MISSION;
