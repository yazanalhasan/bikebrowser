/**
 * Fauna Definitions — Arizona desert animal species for the ecology engine.
 *
 * Each entry defines:
 *   - elevation range where the animal can appear
 *   - activity period (day/night/both)
 *   - dietary requirements (plants for herbivores, prey for predators)
 *   - water dependency
 *   - movement behavior
 */

export const FAUNA = [
  {
    name: 'javelina',
    label: 'Javelina',
    elevation: [0, 5000],
    requiresPlants: ['mesquite', 'prickly_pear'],
    activity: 'day',
    waterNeed: 0.5,
    speed: 40,
    emoji: '🐗',
    color: 0x6b5b4f,
    isPrey: true,
  },
  {
    name: 'coyote',
    label: 'Coyote',
    elevation: [0, 7000],
    diet: ['javelina', 'rabbit', 'kangaroo_rat'],
    activity: 'night',
    waterNeed: 0.3,
    speed: 80,
    emoji: '🐺',
    color: 0xa0825a,
    isPredator: true,
  },
  {
    name: 'rabbit',
    label: 'Desert Cottontail',
    elevation: [0, 6000],
    requiresPlants: ['creosote', 'jojoba', 'mesquite'],
    activity: 'day',
    waterNeed: 0.2,
    speed: 100,
    emoji: '🐇',
    color: 0xc4a882,
    isPrey: true,
  },
  {
    name: 'kangaroo_rat',
    label: 'Kangaroo Rat',
    elevation: [0, 5000],
    activity: 'night',
    waterNeed: 0,
    speed: 60,
    emoji: '🐀',
    color: 0xd4a76a,
    isPrey: true,
  },
  {
    name: 'roadrunner',
    label: 'Roadrunner',
    elevation: [0, 6000],
    activity: 'day',
    waterNeed: 0.1,
    speed: 120,
    emoji: '🐦',
    color: 0x5c4a3a,
    isPredator: true,
    diet: ['kangaroo_rat'],
  },
  {
    name: 'quail',
    label: 'Gambel\'s Quail',
    elevation: [0, 5500],
    requiresPlants: ['creosote', 'mesquite'],
    activity: 'day',
    waterNeed: 0.3,
    speed: 50,
    emoji: '🐦',
    color: 0x7a6b5a,
    isPrey: true,
  },
  {
    name: 'gila_monster',
    label: 'Gila Monster',
    elevation: [0, 5000],
    activity: 'day',
    waterNeed: 0.1,
    speed: 15,
    emoji: '🦎',
    color: 0xd4622a,
  },
  {
    name: 'hawk',
    label: 'Red-tailed Hawk',
    elevation: [0, 8000],
    diet: ['rabbit', 'kangaroo_rat'],
    activity: 'day',
    waterNeed: 0.2,
    speed: 0, // circles overhead
    emoji: '🦅',
    color: 0x6b4423,
    isPredator: true,
    aerial: true,
  },
  {
    name: 'elk',
    label: 'Elk',
    elevation: [5000, 9500],
    waterNeed: 0.9,
    activity: 'day',
    speed: 60,
    emoji: '🦌',
    color: 0x8b6914,
    isPrey: true,
  },
];

/** Lookup fauna definition by name. */
export const FAUNA_MAP = Object.fromEntries(FAUNA.map((f) => [f.name, f]));
