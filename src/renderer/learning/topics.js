/**
 * Learning Topics — the structured knowledge map for BikeBrowser.
 *
 * Each topic represents a skill or concept a child can learn through
 * videos, projects, or game quests. Topics are grouped into categories
 * and have difficulty bands so the app can suggest what to learn next.
 *
 * Progress states:
 *   'new'       — never touched
 *   'started'   — opened a related video/quest/project
 *   'practiced' — completed at least one activity
 *   'completed' — achieved the topic goal
 *
 * To add a new topic:
 *   1. Add an entry to TOPICS below
 *   2. Add keyword patterns to videoTopicMatcher.js if needed
 *   3. Optionally link it to a game quest in QUEST_TOPIC_MAP
 */

export const CATEGORIES = {
  bike_basics: { id: 'bike_basics', label: 'Bike Basics', icon: '🚲', color: 'blue' },
  repair: { id: 'repair', label: 'Repair & Maintenance', icon: '🔧', color: 'amber' },
  building: { id: 'building', label: 'Building & Upgrades', icon: '🏗️', color: 'purple' },
  science: { id: 'science', label: 'Science & Engineering', icon: '🔬', color: 'green' },
  life_skills: { id: 'life_skills', label: 'Life Skills', icon: '📚', color: 'rose' },
};

const TOPICS = [
  // ── Bike Basics ──────────────────────────────────────────────
  {
    id: 'bike_parts',
    title: 'Parts of a Bike',
    description: 'Learn the names of every part — wheels, frame, handlebars, pedals, chain, and more.',
    category: 'bike_basics',
    difficulty: 'beginner',
    icon: '🚲',
    goalText: 'Name 5 bike parts correctly',
    relatedQuests: [],
    suggestedSearches: ['parts of a bicycle', 'bike parts for kids'],
  },
  {
    id: 'flat_tires',
    title: 'Flat Tires',
    description: 'Understand why tires go flat and how to patch or replace an inner tube.',
    category: 'repair',
    difficulty: 'beginner',
    icon: '🩹',
    goalText: 'Fix a flat tire (in-game or in real life!)',
    relatedQuests: ['flat_tire_repair'],
    suggestedSearches: ['how to fix a flat tire', 'bike tire patch tutorial'],
  },
  {
    id: 'brakes',
    title: 'Brakes & Stopping',
    description: 'Learn how rim brakes and disc brakes work, and how to adjust them safely.',
    category: 'repair',
    difficulty: 'beginner',
    icon: '🛑',
    goalText: 'Understand how brakes slow a wheel',
    relatedQuests: [],
    suggestedSearches: ['bike brakes explained', 'how to adjust bike brakes'],
  },
  {
    id: 'chains',
    title: 'Chains & Drivetrain',
    description: 'How the chain, pedals, and gears work together to make a bike move.',
    category: 'repair',
    difficulty: 'intermediate',
    icon: '⛓️',
    goalText: 'Clean and lubricate a chain',
    relatedQuests: [],
    suggestedSearches: ['bike chain repair', 'how bike gears work'],
  },
  {
    id: 'tools',
    title: 'Tools of the Trade',
    description: 'Know which tools to use — wrenches, tire levers, pumps, hex keys, and more.',
    category: 'repair',
    difficulty: 'beginner',
    icon: '🧰',
    goalText: 'Identify 4 bike repair tools',
    relatedQuests: ['flat_tire_repair'],
    suggestedSearches: ['bike repair tools for beginners', 'essential bike tool kit'],
  },
  {
    id: 'bike_safety',
    title: 'Riding Safety',
    description: 'Helmets, hand signals, checking your bike before riding, and road rules.',
    category: 'bike_basics',
    difficulty: 'beginner',
    icon: '⛑️',
    goalText: 'Know the pre-ride safety checklist',
    relatedQuests: [],
    suggestedSearches: ['bike safety for kids', 'bicycle helmet safety'],
  },

  // ── Building & Upgrades ──────────────────────────────────────
  {
    id: 'wheels',
    title: 'Wheels & Tires',
    description: 'How wheels are built — spokes, rims, hubs — and how to pick the right tire.',
    category: 'building',
    difficulty: 'intermediate',
    icon: '🎡',
    goalText: 'Understand wheel size and tire width',
    relatedQuests: [],
    suggestedSearches: ['how bike wheels work', 'bike wheel sizes explained'],
  },
  {
    id: 'ebike_basics',
    title: 'E-Bike Basics',
    description: 'What makes an electric bike different — motors, batteries, controllers.',
    category: 'building',
    difficulty: 'intermediate',
    icon: '⚡',
    goalText: 'Name the 3 main e-bike components',
    relatedQuests: [],
    suggestedSearches: ['how e-bikes work', 'electric bike conversion basics'],
  },

  // ── Science & Engineering ────────────────────────────────────
  {
    id: 'forces_friction',
    title: 'Forces & Friction',
    description: 'Why brakes work, why tires grip the road, and what makes hills hard to climb.',
    category: 'science',
    difficulty: 'intermediate',
    icon: '🧲',
    goalText: 'Explain why braking creates friction',
    relatedQuests: [],
    suggestedSearches: ['friction for kids', 'forces on a bicycle science'],
  },
  {
    id: 'energy_motion',
    title: 'Energy & Motion',
    description: 'How pedaling converts your energy into forward motion through gears and wheels.',
    category: 'science',
    difficulty: 'intermediate',
    icon: '💡',
    goalText: 'Explain how gears change speed vs effort',
    relatedQuests: [],
    suggestedSearches: ['energy transfer bicycle', 'how gears work simple machines'],
  },
  {
    id: 'simple_machines',
    title: 'Simple Machines',
    description: 'Levers, wheels and axles, pulleys — the building blocks inside every bike.',
    category: 'science',
    difficulty: 'beginner',
    icon: '⚙️',
    goalText: 'Find 3 simple machines on a bicycle',
    relatedQuests: [],
    suggestedSearches: ['simple machines on a bike', 'levers and wheels for kids'],
  },

  // ── Life Skills ──────────────────────────────────────────────
  {
    id: 'reading_instructions',
    title: 'Reading Instructions',
    description: 'Follow step-by-step repair guides and build manuals carefully.',
    category: 'life_skills',
    difficulty: 'beginner',
    icon: '📖',
    goalText: 'Follow a 5-step repair guide',
    relatedQuests: ['flat_tire_repair'],
    suggestedSearches: ['how to read repair manuals', 'following instructions for kids'],
  },
  {
    id: 'measurements',
    title: 'Math for Measurements',
    description: 'Use rulers, calipers, and math to measure frame size, tire width, and spoke length.',
    category: 'life_skills',
    difficulty: 'intermediate',
    icon: '📏',
    goalText: 'Measure a bike frame in cm and inches',
    relatedQuests: [],
    suggestedSearches: ['how to measure bike frame', 'measurement math for kids'],
  },
];

export default TOPICS;

/** Map: topicId → topic object */
export const TOPIC_MAP = Object.fromEntries(TOPICS.map((t) => [t.id, t]));

/** Map: questId → topicIds that completing the quest advances */
export const QUEST_TOPIC_MAP = {
  flat_tire_repair: ['flat_tires', 'tools', 'reading_instructions'],
  chain_repair: ['chains', 'tools', 'reading_instructions'],
  desert_healer: ['bike_safety', 'reading_instructions'],
  food_chain_tracker: ['forces_friction', 'simple_machines'],
  desert_survival: ['bike_safety', 'reading_instructions'],
  medicine_balance: ['reading_instructions'],
  extract_dna: ['reading_instructions', 'simple_machines'],
  understand_expression: ['reading_instructions', 'energy_motion'],
  engineer_bacteria: ['reading_instructions', 'simple_machines'],
  bio_battery_integration: ['energy_motion', 'reading_instructions'],
  the_living_fluid: ['forces_friction', 'energy_motion'],
  desert_infection: ['bike_safety', 'reading_instructions'],
  one_sided_forest: ['simple_machines', 'reading_instructions'],
  toxic_knowledge: ['bike_safety', 'reading_instructions'],
  invisible_map: ['reading_instructions'],
  bridge_collapse: ['forces_friction', 'simple_machines'],
  heat_failure: ['forces_friction', 'energy_motion'],
  perfect_composite: ['simple_machines', 'reading_instructions'],
  boat_puzzle: ['forces_friction', 'energy_motion'],
  engine_cleaning: ['forces_friction', 'reading_instructions'],
  desert_coating: ['bike_safety', 'reading_instructions'],
};

/** Get topics for a specific category */
export function getTopicsByCategory(categoryId) {
  return TOPICS.filter((t) => t.category === categoryId);
}

/** Get topics linked to a specific quest */
export function getTopicsForQuest(questId) {
  const ids = QUEST_TOPIC_MAP[questId] || [];
  return ids.map((id) => TOPIC_MAP[id]).filter(Boolean);
}
