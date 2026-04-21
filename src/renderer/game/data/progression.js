/**
 * Progression Data — defines the era/chapter structure for the full game.
 *
 * This file is the data backbone for long-term progression from
 * "Neighborhood Bike Hero" through to "Space Explorer".
 *
 * For now only Era 1 is active. Future eras are defined as scaffolding
 * so the save system, quest system, and UI can reference them without
 * needing a rewrite when the game expands.
 *
 * Each era defines:
 *   id          — unique key
 *   title       — display name
 *   description — short narrative summary
 *   icon        — emoji for UI
 *   vehicles    — vehicle types unlocked in this era
 *   zones       — world zones available
 *   skills      — skills that can level up
 *   unlockReq   — what the player needs to enter this era
 *   status      — 'active' | 'planned'
 */

const ERAS = [
  {
    id: 'era_1_bikes',
    title: 'Neighborhood Bike Hero',
    description: 'Help neighbors, learn bike repair, earn trust in the neighborhood.',
    icon: '🚲',
    vehicles: ['bicycle'],
    zones: ['garage', 'neighborhood'],
    skills: ['mechanic', 'reading', 'tools'],
    unlockReq: null,
    status: 'active',
  },
  {
    id: 'era_2_boats',
    title: 'Water & Boat Repair',
    description: 'Fix boats, learn about flotation and propulsion, explore waterways.',
    icon: '⛵',
    vehicles: ['bicycle', 'boat'],
    zones: ['garage', 'neighborhood', 'docks', 'lake'],
    skills: ['mechanic', 'reading', 'tools', 'water_craft'],
    unlockReq: { reputation: 50, completedQuests: 5 },
    status: 'planned',
  },
  {
    id: 'era_3_ebikes',
    title: 'E-Bike Engineer',
    description: 'Master batteries, motors, and electrical systems.',
    icon: '⚡',
    vehicles: ['bicycle', 'ebike'],
    zones: ['garage', 'neighborhood', 'trails', 'hills'],
    skills: ['mechanic', 'reading', 'tools', 'electrical'],
    unlockReq: { reputation: 100, era: 'era_2_boats' },
    status: 'planned',
  },
  {
    id: 'era_4_motorcycles',
    title: 'Motorcycle Builder',
    description: 'Engines, fuel systems, suspension — bigger machines, bigger adventures.',
    icon: '🏍️',
    vehicles: ['bicycle', 'ebike', 'motorcycle'],
    zones: ['garage', 'neighborhood', 'desert', 'highways'],
    skills: ['mechanic', 'reading', 'tools', 'electrical', 'engines'],
    unlockReq: { reputation: 200, era: 'era_3_ebikes' },
    status: 'planned',
  },
  {
    id: 'era_5_cars',
    title: 'Car Builder',
    description: 'Systems integration, logistics, long-distance missions.',
    icon: '🚗',
    vehicles: ['bicycle', 'ebike', 'motorcycle', 'car'],
    zones: ['garage', 'neighborhood', 'desert', 'highways', 'towns'],
    skills: ['mechanic', 'reading', 'tools', 'electrical', 'engines', 'logistics'],
    unlockReq: { reputation: 400, era: 'era_4_motorcycles' },
    status: 'planned',
  },
  {
    id: 'era_6_planes',
    title: 'Plane Builder',
    description: 'Lift, flight, navigation — take to the skies.',
    icon: '✈️',
    vehicles: ['bicycle', 'ebike', 'motorcycle', 'car', 'plane'],
    zones: ['garage', 'neighborhood', 'desert', 'airways', 'islands'],
    skills: ['mechanic', 'reading', 'tools', 'electrical', 'engines', 'flight'],
    unlockReq: { reputation: 800, era: 'era_5_cars' },
    status: 'planned',
  },
  {
    id: 'era_7_space',
    title: 'Space Explorer',
    description: 'Spacecraft, off-world travel, frontier building.',
    icon: '🚀',
    vehicles: ['bicycle', 'ebike', 'motorcycle', 'car', 'plane', 'spacecraft'],
    zones: ['garage', 'neighborhood', 'desert', 'space', 'planets'],
    skills: ['mechanic', 'reading', 'tools', 'electrical', 'engines', 'flight', 'space_systems'],
    unlockReq: { reputation: 1500, era: 'era_6_planes' },
    status: 'planned',
  },
];

export default ERAS;

export const ERA_MAP = Object.fromEntries(ERAS.map((e) => [e.id, e]));

/**
 * Get the current active era based on game state.
 * Uses milestones to determine which eras have been unlocked via rewards.
 */
export function getCurrentEra(state) {
  const unlocked = state?.milestones?.unlocked || [];

  // Walk eras in reverse — highest unlocked era is current
  for (let i = ERAS.length - 1; i >= 0; i--) {
    const era = ERAS[i];
    // Era 1 is always active
    if (!era.unlockReq) return era;
    // Check if a milestone reward unlocked this era
    if (unlocked.includes(era.id)) return era;
  }

  return ERAS[0];
}

/**
 * Get the next era the player is working toward.
 */
export function getNextEra(state) {
  const current = getCurrentEra(state);
  const idx = ERAS.indexOf(current);
  return idx < ERAS.length - 1 ? ERAS[idx + 1] : null;
}

/**
 * Skill definitions — tracks what the player can improve.
 * Skills level up through quest completion and practice.
 */
export const SKILLS = {
  mechanic: { id: 'mechanic', title: 'Mechanic', icon: '🔧', description: 'Repair and maintain machines' },
  reading: { id: 'reading', title: 'Reading', icon: '📖', description: 'Follow instructions and manuals' },
  tools: { id: 'tools', title: 'Tool Mastery', icon: '🧰', description: 'Know which tool to use and when' },
  electrical: { id: 'electrical', title: 'Electrical', icon: '⚡', description: 'Work with batteries, motors, wiring' },
  engines: { id: 'engines', title: 'Engines', icon: '🔩', description: 'Understand fuel, combustion, power' },
  water_craft: { id: 'water_craft', title: 'Watercraft', icon: '⛵', description: 'Build and repair boats' },
  flight: { id: 'flight', title: 'Flight', icon: '✈️', description: 'Understand aerodynamics and navigation' },
  space_systems: { id: 'space_systems', title: 'Space Systems', icon: '🚀', description: 'Life support, orbital mechanics' },
  logistics: { id: 'logistics', title: 'Logistics', icon: '📦', description: 'Plan routes, manage cargo, coordinate' },
};
