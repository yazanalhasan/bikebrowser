export const STANDARD_STORIES = {
  boost_148: {
    title: 'Why Boost 148 Exists',
    summary: 'Boost 148 widened rear hub spacing to improve wheel stiffness, tire clearance, and modern drivetrain chainline.',
    reasons: ['Wider spoke bracing angle', 'More tire and chainring clearance', 'Better chainline for wider-range drivetrains'],
  },
  shimano_linkglide: {
    title: 'Why LINKGLIDE Exists',
    summary: 'LINKGLIDE prioritizes durability and smoother loaded shifts for utility, trail, and e-bike style riding.',
    reasons: ['Stronger shift ramps', 'Durability under load', 'Longer cassette and chain wear life'],
  },
};

export const MECHANICAL_EVOLUTION_MAPS = {
  drivetrain: [
    { id: 'hyperglide', label: 'Hyperglide', tradeoff: 'Fast, light shifting for traditional drivetrains.' },
    { id: 'linkglide', label: 'LINKGLIDE', tradeoff: 'More durable shifting under load.' },
    { id: 'transmission', label: 'Transmission', tradeoff: 'Frame-interface integrated shifting with hangerless architecture.' },
  ],
};

export function getStandardStory(id: string) {
  return STANDARD_STORIES[id as keyof typeof STANDARD_STORIES] || null;
}

export function getEvolutionMap(id = 'drivetrain') {
  return MECHANICAL_EVOLUTION_MAPS[id as keyof typeof MECHANICAL_EVOLUTION_MAPS] || [];
}

export default {
  STANDARD_STORIES,
  MECHANICAL_EVOLUTION_MAPS,
  getStandardStory,
  getEvolutionMap,
};
