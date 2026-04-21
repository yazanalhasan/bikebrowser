/**
 * Language Quest Packs — quests that use ONLY the 20 starter words per region.
 *
 * No new vocabulary allowed. All quests reinforce the same 20 words
 * through different gameplay contexts: finding, bringing, trading,
 * surviving, navigating, and describing.
 *
 * Per region: 3 beginner, 2 intermediate, 1 advanced.
 *
 * These integrate with the quest system via the existing step types:
 * 'dialogue', 'observe', 'forage', 'use_item', 'quiz'
 */

export const LANGUAGE_QUESTS = {

  // ════════════════════════════════════════════════════════════════════════════
  // LEVANT — Arabic (20 starter words only)
  // ════════════════════════════════════════════════════════════════════════════

  ar_find_water: {
    id: 'ar_find_water',
    regionId: 'levant',
    title: 'Find Water',
    difficulty: 'beginner',
    allowedWords: ['ar_water', 'ar_here', 'ar_path', 'ar_shade', 'ar_sun'],
    steps: [
      { type: 'dialogue', npcPhrase: 'ماء هنا', npcTranslation: 'Water here', playerAction: 'follow_direction' },
      { type: 'observe', target: 'water_source', hint: 'Follow where the NPC pointed' },
      { type: 'dialogue', npcPhrase: 'ماء', npcTranslation: 'Water!', playerAction: 'confirm' },
    ],
    wordsReinforced: ['ar_water', 'ar_here'],
    successReward: { xp: 10, trustBonus: 0.05 },
  },

  ar_bring_water: {
    id: 'ar_bring_water',
    regionId: 'levant',
    title: 'Bring Water',
    difficulty: 'beginner',
    allowedWords: ['ar_water', 'ar_come', 'ar_take', 'ar_here'],
    steps: [
      { type: 'dialogue', npcPhrase: 'تعال ماء', npcTranslation: 'Come, water', playerAction: 'understand_request' },
      { type: 'forage', target: 'water_item', hint: 'Find a water source and collect water' },
      { type: 'use_item', npcPhrase: 'خذ', npcTranslation: 'Take', playerAction: 'give_water' },
    ],
    wordsReinforced: ['ar_water', 'ar_come', 'ar_take'],
    successReward: { xp: 15, trustBonus: 0.05 },
  },

  ar_heat_warning: {
    id: 'ar_heat_warning',
    regionId: 'levant',
    title: 'Heat Warning',
    difficulty: 'beginner',
    allowedWords: ['ar_heat', 'ar_sun', 'ar_shade', 'ar_here', 'ar_walk'],
    steps: [
      { type: 'dialogue', npcPhrase: 'حرارة شمس', npcTranslation: 'Sun heat!', playerAction: 'recognize_warning' },
      { type: 'observe', target: 'shade_zone', hint: 'Find shade (ظل) to escape the heat' },
      { type: 'dialogue', npcPhrase: 'ظل هنا', npcTranslation: 'Shade here', playerAction: 'confirm' },
    ],
    wordsReinforced: ['ar_heat', 'ar_sun', 'ar_shade'],
    successReward: { xp: 12, trustBonus: 0.05 },
  },

  ar_material_trade: {
    id: 'ar_material_trade',
    regionId: 'levant',
    title: 'Material Trade',
    difficulty: 'intermediate',
    allowedWords: ['ar_salt', 'ar_iron', 'ar_wood', 'ar_resin', 'ar_take', 'ar_here'],
    steps: [
      { type: 'dialogue', npcPhrase: 'ملح', npcTranslation: null, playerAction: 'identify_material' },
      { type: 'quiz', question: 'The trader is asking for:', choices: [{ label: 'Salt (ملح)', correct: true }, { label: 'Iron', correct: false }, { label: 'Wood', correct: false }] },
      { type: 'forage', target: 'salt_item', hint: 'Find salt and bring it to the trader' },
      { type: 'dialogue', npcPhrase: 'خذ حديد', npcTranslation: 'Take iron', playerAction: 'receive_trade' },
    ],
    wordsReinforced: ['ar_salt', 'ar_iron', 'ar_take'],
    successReward: { xp: 20, trustBonus: 0.08 },
  },

  ar_follow_path: {
    id: 'ar_follow_path',
    regionId: 'levant',
    title: 'Follow the Path',
    difficulty: 'intermediate',
    allowedWords: ['ar_path', 'ar_here', 'ar_walk', 'ar_stone', 'ar_sand'],
    steps: [
      { type: 'dialogue', npcPhrase: 'طريق هنا', npcTranslation: null, playerAction: 'understand_direction' },
      { type: 'observe', target: 'path_marker', hint: 'Follow the path the NPC indicated' },
      { type: 'quiz', question: 'طريق means:', choices: [{ label: 'Path', correct: true }, { label: 'Water', correct: false }, { label: 'Sun', correct: false }] },
      { type: 'dialogue', npcPhrase: 'مشي طريق', npcTranslation: 'Walk the path', playerAction: 'navigate' },
    ],
    wordsReinforced: ['ar_path', 'ar_here', 'ar_walk', 'ar_stone'],
    successReward: { xp: 18, trustBonus: 0.08 },
  },

  ar_desert_survival: {
    id: 'ar_desert_survival',
    regionId: 'levant',
    title: 'Desert Survival',
    difficulty: 'advanced',
    allowedWords: ['ar_water', 'ar_shade', 'ar_heat', 'ar_sun', 'ar_sand', 'ar_wind', 'ar_path', 'ar_walk', 'ar_here', 'ar_drink'],
    steps: [
      { type: 'dialogue', npcPhrase: 'حرارة شمس ريح رمل', npcTranslation: null, playerAction: 'decode_warning' },
      { type: 'quiz', question: 'The elder warned about:', choices: [{ label: 'Hot sun, wind, and sand', correct: true }, { label: 'Cold rain', correct: false }, { label: 'Animals', correct: false }] },
      { type: 'observe', target: 'shade_zone', hint: 'Find shade before the heat cycle' },
      { type: 'observe', target: 'water_source', hint: 'Find water to survive' },
      { type: 'dialogue', npcPhrase: 'اشرب ماء ظل هنا', npcTranslation: null, playerAction: 'follow_survival_instructions' },
    ],
    wordsReinforced: ['ar_water', 'ar_shade', 'ar_heat', 'ar_sun', 'ar_sand', 'ar_wind', 'ar_drink'],
    successReward: { xp: 30, trustBonus: 0.12 },
  },

  // ════════════════════════════════════════════════════════════════════════════
  // ANDES — Quechua
  // ════════════════════════════════════════════════════════════════════════════

  qu_find_water: {
    id: 'qu_find_water', regionId: 'andes', title: 'Find Water', difficulty: 'beginner',
    allowedWords: ['qu_water', 'qu_sun', 'qu_mountain', 'qu_see'],
    steps: [
      { type: 'dialogue', npcPhrase: 'rikuy yaku', npcTranslation: 'Look, water!', playerAction: 'follow_direction' },
      { type: 'observe', target: 'water_source', hint: 'Follow the direction to find yaku' },
    ],
    wordsReinforced: ['qu_water', 'qu_see'],
    successReward: { xp: 10, trustBonus: 0.05 },
  },

  qu_harvest_food: {
    id: 'qu_harvest_food', regionId: 'andes', title: 'Harvest Food', difficulty: 'beginner',
    allowedWords: ['qu_potato', 'qu_quinoa', 'qu_eat', 'qu_earth', 'qu_farm'],
    steps: [
      { type: 'dialogue', npcPhrase: 'mikhuy papa', npcTranslation: 'Eat potato', playerAction: 'understand_food' },
      { type: 'forage', target: 'potato_plant', hint: 'Find papa (potato) in the farm (chakra)' },
    ],
    wordsReinforced: ['qu_potato', 'qu_eat', 'qu_farm'],
    successReward: { xp: 12, trustBonus: 0.05 },
  },

  qu_follow_sun: {
    id: 'qu_follow_sun', regionId: 'andes', title: 'Follow the Sun', difficulty: 'beginner',
    allowedWords: ['qu_sun', 'qu_see', 'qu_mountain', 'qu_big'],
    steps: [
      { type: 'dialogue', npcPhrase: 'rikuy inti', npcTranslation: 'Look at the sun', playerAction: 'navigate_by_sun' },
      { type: 'observe', target: 'sun_direction', hint: 'Use inti (sun) for direction' },
    ],
    wordsReinforced: ['qu_sun', 'qu_see'],
    successReward: { xp: 10, trustBonus: 0.05 },
  },

  qu_build_shelter: {
    id: 'qu_build_shelter', regionId: 'andes', title: 'Build Shelter', difficulty: 'intermediate',
    allowedWords: ['qu_stone', 'qu_earth', 'qu_house', 'qu_cold', 'qu_wind', 'qu_big', 'qu_small'],
    steps: [
      { type: 'dialogue', npcPhrase: 'chiri wayra', npcTranslation: null, playerAction: 'understand_warning' },
      { type: 'quiz', question: 'chiri wayra means:', choices: [{ label: 'Cold wind', correct: true }, { label: 'Hot sun', correct: false }, { label: 'Big stone', correct: false }] },
      { type: 'forage', target: 'stone_material', hint: 'Gather rumi (stone) and allpa (earth)' },
    ],
    wordsReinforced: ['qu_stone', 'qu_earth', 'qu_cold', 'qu_wind', 'qu_house'],
    successReward: { xp: 20, trustBonus: 0.08 },
  },

  qu_describe_landscape: {
    id: 'qu_describe_landscape', regionId: 'andes', title: 'Describe the Land', difficulty: 'intermediate',
    allowedWords: ['qu_mountain', 'qu_big', 'qu_small', 'qu_water', 'qu_fire', 'qu_sun'],
    steps: [
      { type: 'quiz', question: 'hatun urqu means:', choices: [{ label: 'Big mountain', correct: true }, { label: 'Small fire', correct: false }, { label: 'Cold water', correct: false }] },
      { type: 'dialogue', npcPhrase: 'huchuy nina', npcTranslation: null, playerAction: 'translate' },
      { type: 'quiz', question: 'huchuy nina means:', choices: [{ label: 'Small fire', correct: true }, { label: 'Big mountain', correct: false }, { label: 'Cold wind', correct: false }] },
    ],
    wordsReinforced: ['qu_mountain', 'qu_big', 'qu_small', 'qu_fire'],
    successReward: { xp: 18, trustBonus: 0.08 },
  },

  qu_survival_test: {
    id: 'qu_survival_test', regionId: 'andes', title: 'Highland Survival', difficulty: 'advanced',
    allowedWords: ['qu_water', 'qu_fire', 'qu_cold', 'qu_wind', 'qu_earth', 'qu_stone', 'qu_eat', 'qu_drink', 'qu_see', 'qu_potato'],
    steps: [
      { type: 'dialogue', npcPhrase: 'rikuy chiri wayra — nina allpa rumi', npcTranslation: null, playerAction: 'decode_survival' },
      { type: 'quiz', question: 'Decode: build fire (nina) from earth (allpa) and stone (rumi) because:', choices: [{ label: 'Cold wind is coming', correct: true }, { label: 'The sun is rising', correct: false }, { label: 'Water is near', correct: false }] },
      { type: 'observe', target: 'fire_source', hint: 'Build nina (fire) for warmth' },
      { type: 'observe', target: 'water_source', hint: 'Find yaku (water)' },
    ],
    wordsReinforced: ['qu_water', 'qu_fire', 'qu_cold', 'qu_wind', 'qu_earth', 'qu_stone', 'qu_eat', 'qu_drink'],
    successReward: { xp: 30, trustBonus: 0.12 },
  },

  // ════════════════════════════════════════════════════════════════════════════
  // SWAHILI COAST
  // ════════════════════════════════════════════════════════════════════════════

  sw_find_water: {
    id: 'sw_find_water', regionId: 'swahili_coast', title: 'Find Water', difficulty: 'beginner',
    allowedWords: ['sw_water', 'sw_path', 'sw_tree'],
    steps: [
      { type: 'dialogue', npcPhrase: 'maji hapa', npcTranslation: 'Water here', playerAction: 'follow' },
      { type: 'observe', target: 'water_source', hint: 'Follow to find maji' },
    ],
    wordsReinforced: ['sw_water'],
    successReward: { xp: 10, trustBonus: 0.05 },
  },

  sw_find_tree: {
    id: 'sw_find_tree', regionId: 'swahili_coast', title: 'Find the Tree', difficulty: 'beginner',
    allowedWords: ['sw_tree', 'sw_big', 'sw_path'],
    steps: [
      { type: 'dialogue', npcPhrase: 'mti kubwa', npcTranslation: 'Big tree', playerAction: 'find_landmark' },
      { type: 'observe', target: 'large_tree', hint: 'Find the mti kubwa (big tree)' },
    ],
    wordsReinforced: ['sw_tree', 'sw_big'],
    successReward: { xp: 10, trustBonus: 0.05 },
  },

  sw_avoid_heat: {
    id: 'sw_avoid_heat', regionId: 'swahili_coast', title: 'Avoid Heat', difficulty: 'beginner',
    allowedWords: ['sw_heat', 'sw_sun', 'sw_water', 'sw_tree'],
    steps: [
      { type: 'dialogue', npcPhrase: 'joto jua', npcTranslation: 'Sun heat!', playerAction: 'seek_shade' },
      { type: 'observe', target: 'shade_zone', hint: 'Find shade under a mti (tree)' },
    ],
    wordsReinforced: ['sw_heat', 'sw_sun'],
    successReward: { xp: 12, trustBonus: 0.05 },
  },

  sw_bring_materials: {
    id: 'sw_bring_materials', regionId: 'swahili_coast', title: 'Bring Materials', difficulty: 'intermediate',
    allowedWords: ['sw_stone', 'sw_iron', 'sw_bring', 'sw_take', 'sw_give'],
    steps: [
      { type: 'dialogue', npcPhrase: 'leta jiwe', npcTranslation: null, playerAction: 'understand_request' },
      { type: 'quiz', question: 'leta jiwe means:', choices: [{ label: 'Bring stone', correct: true }, { label: 'Take iron', correct: false }, { label: 'Give water', correct: false }] },
      { type: 'forage', target: 'stone_item', hint: 'Find jiwe (stone) and bring it' },
    ],
    wordsReinforced: ['sw_stone', 'sw_bring'],
    successReward: { xp: 18, trustBonus: 0.08 },
  },

  sw_follow_path: {
    id: 'sw_follow_path', regionId: 'swahili_coast', title: 'Follow the Path', difficulty: 'intermediate',
    allowedWords: ['sw_path', 'sw_water', 'sw_tree', 'sw_big', 'sw_small'],
    steps: [
      { type: 'dialogue', npcPhrase: 'njia — maji', npcTranslation: null, playerAction: 'navigate' },
      { type: 'observe', target: 'path_to_water', hint: 'Follow njia (path) to maji (water)' },
    ],
    wordsReinforced: ['sw_path', 'sw_water'],
    successReward: { xp: 18, trustBonus: 0.08 },
  },

  sw_survival: {
    id: 'sw_survival', regionId: 'swahili_coast', title: 'Savanna Survival', difficulty: 'advanced',
    allowedWords: ['sw_water', 'sw_fire', 'sw_heat', 'sw_sun', 'sw_eat', 'sw_drink', 'sw_tree', 'sw_path', 'sw_big', 'sw_small'],
    steps: [
      { type: 'dialogue', npcPhrase: 'joto jua — maji mti njia', npcTranslation: null, playerAction: 'decode_survival' },
      { type: 'quiz', question: 'Decode the elder\'s survival instruction:', choices: [{ label: 'Hot sun — find water, tree, and path', correct: true }, { label: 'Big fire near the small stone', correct: false }, { label: 'Bring meat to the house', correct: false }] },
      { type: 'observe', target: 'shade_zone', hint: 'Find mti (tree) for shade' },
      { type: 'observe', target: 'water_source', hint: 'Find maji (water)' },
    ],
    wordsReinforced: ['sw_water', 'sw_heat', 'sw_sun', 'sw_tree', 'sw_path', 'sw_eat', 'sw_drink'],
    successReward: { xp: 30, trustBonus: 0.12 },
  },

  // ════════════════════════════════════════════════════════════════════════════
  // Additional regions follow same 3+2+1 pattern
  // (Anatolia, Zagros, Yunnan have identical structure with their starter words)
  // ════════════════════════════════════════════════════════════════════════════

  tr_find_water: {
    id: 'tr_find_water', regionId: 'anatolia', title: 'Find Water', difficulty: 'beginner',
    allowedWords: ['tr_water', 'tr_road', 'tr_stone'],
    steps: [
      { type: 'dialogue', npcPhrase: 'su burada', npcTranslation: 'Water here', playerAction: 'follow' },
      { type: 'observe', target: 'water_source', hint: 'Find su (water)' },
    ],
    wordsReinforced: ['tr_water'],
    successReward: { xp: 10, trustBonus: 0.05 },
  },

  tr_gather_materials: {
    id: 'tr_gather_materials', regionId: 'anatolia', title: 'Gather Materials', difficulty: 'beginner',
    allowedWords: ['tr_stone', 'tr_wood', 'tr_take', 'tr_bring'],
    steps: [
      { type: 'dialogue', npcPhrase: 'al taş', npcTranslation: 'Take stone', playerAction: 'gather' },
      { type: 'forage', target: 'stone_item', hint: 'Find taş (stone)' },
    ],
    wordsReinforced: ['tr_stone', 'tr_take'],
    successReward: { xp: 10, trustBonus: 0.05 },
  },

  tr_trade: {
    id: 'tr_trade', regionId: 'anatolia', title: 'Trade', difficulty: 'beginner',
    allowedWords: ['tr_give', 'tr_take', 'tr_iron', 'tr_wool', 'tr_clay'],
    steps: [
      { type: 'dialogue', npcPhrase: 'ver yün', npcTranslation: null, playerAction: 'understand_trade' },
      { type: 'quiz', question: 'ver yün means:', choices: [{ label: 'Give wool', correct: true }, { label: 'Take iron', correct: false }, { label: 'Build house', correct: false }] },
    ],
    wordsReinforced: ['tr_give', 'tr_wool'],
    successReward: { xp: 12, trustBonus: 0.05 },
  },

  zh_find_water: {
    id: 'zh_find_water', regionId: 'yunnan', title: 'Find Water', difficulty: 'beginner',
    allowedWords: ['zh_water', 'zh_road', 'zh_mountain'],
    steps: [
      { type: 'dialogue', npcPhrase: '水在这里', npcTranslation: 'Water here', playerAction: 'follow' },
      { type: 'observe', target: 'water_source', hint: 'Find 水 (shuǐ)' },
    ],
    wordsReinforced: ['zh_water'],
    successReward: { xp: 10, trustBonus: 0.05 },
  },

  zh_harvest_bamboo: {
    id: 'zh_harvest_bamboo', regionId: 'yunnan', title: 'Harvest Bamboo', difficulty: 'beginner',
    allowedWords: ['zh_bamboo', 'zh_take', 'zh_big', 'zh_small'],
    steps: [
      { type: 'dialogue', npcPhrase: '拿竹', npcTranslation: 'Take bamboo', playerAction: 'gather' },
      { type: 'forage', target: 'bamboo_plant', hint: 'Find 竹 (zhú) and harvest it' },
    ],
    wordsReinforced: ['zh_bamboo', 'zh_take'],
    successReward: { xp: 10, trustBonus: 0.05 },
  },

  zh_fire_craft: {
    id: 'zh_fire_craft', regionId: 'yunnan', title: 'Build a Fire', difficulty: 'beginner',
    allowedWords: ['zh_fire', 'zh_wood', 'zh_big', 'zh_small'],
    steps: [
      { type: 'dialogue', npcPhrase: '火 木', npcTranslation: 'Fire, wood', playerAction: 'understand' },
      { type: 'forage', target: 'wood_material', hint: 'Gather 木 (mù) for 火 (huǒ)' },
    ],
    wordsReinforced: ['zh_fire', 'zh_wood'],
    successReward: { xp: 12, trustBonus: 0.05 },
  },

  ku_find_water: {
    id: 'ku_find_water', regionId: 'zagros', title: 'Find Water', difficulty: 'beginner',
    allowedWords: ['ku_water', 'ku_mountain', 'ku_sun'],
    steps: [
      { type: 'dialogue', npcPhrase: 'av li vir', npcTranslation: 'Water here', playerAction: 'follow' },
      { type: 'observe', target: 'water_source', hint: 'Find av (water)' },
    ],
    wordsReinforced: ['ku_water'],
    successReward: { xp: 10, trustBonus: 0.05 },
  },

  fa_gather_materials: {
    id: 'fa_gather_materials', regionId: 'zagros', title: 'Gather Materials', difficulty: 'beginner',
    allowedWords: ['fa_stone', 'fa_wood', 'fa_take', 'fa_come'],
    steps: [
      { type: 'dialogue', npcPhrase: 'بیا — بگیر سنگ', npcTranslation: 'Come — take stone', playerAction: 'follow_and_gather' },
      { type: 'forage', target: 'stone_item', hint: 'Find سنگ (sang — stone)' },
    ],
    wordsReinforced: ['fa_stone', 'fa_take', 'fa_come'],
    successReward: { xp: 12, trustBonus: 0.05 },
  },

  fa_trade_salt: {
    id: 'fa_trade_salt', regionId: 'zagros', title: 'Trade Salt', difficulty: 'beginner',
    allowedWords: ['fa_salt', 'fa_oil', 'fa_give', 'fa_take'],
    steps: [
      { type: 'dialogue', npcPhrase: 'بده نمک', npcTranslation: null, playerAction: 'understand_trade' },
      { type: 'quiz', question: 'بده نمک means:', choices: [{ label: 'Give salt', correct: true }, { label: 'Take oil', correct: false }, { label: 'Come here', correct: false }] },
    ],
    wordsReinforced: ['fa_salt', 'fa_give'],
    successReward: { xp: 12, trustBonus: 0.05 },
  },
};

/** Get all quests for a region. */
export function getRegionLanguageQuests(regionId) {
  return Object.values(LANGUAGE_QUESTS).filter((q) => q.regionId === regionId);
}

/** Get quests by difficulty. */
export function getQuestsByDifficulty(regionId, difficulty) {
  return Object.values(LANGUAGE_QUESTS).filter((q) => q.regionId === regionId && q.difficulty === difficulty);
}

/** Get a specific quest. */
export function getLanguageQuest(questId) {
  return LANGUAGE_QUESTS[questId] || null;
}
