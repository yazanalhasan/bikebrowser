/**
 * Phrase Templates — grammar-lite pattern system using ONLY the 20 starter words.
 *
 * NOT grammar lessons. Patterns learned through repetition and context:
 *   "[object] here" = pointing to something
 *   "take [object]" = giving an instruction
 *   "[object] big" = describing
 *
 * Templates are region-specific because word order varies:
 *   Arabic: "ماء هنا" (water here)
 *   Mandarin: "水 大" (water big)
 *   Swahili: "maji hapa" (water here)
 *
 * Each template uses only starter-pack word IDs.
 */

// ── Template Type Definitions ────────────────────────────────────────────────

export const TEMPLATE_TYPES = {
  identification: { id: 'identification', label: 'This is [X]', pattern: '[object]', difficulty: 1 },
  location: { id: 'location', label: '[X] here', pattern: '[object] [here]', difficulty: 1 },
  request: { id: 'request', label: 'Give [X]', pattern: '[give] [object]', difficulty: 2 },
  action: { id: 'action', label: '[Action] [X]', pattern: '[action] [object]', difficulty: 2 },
  description: { id: 'description', label: '[X] big/small', pattern: '[object] [descriptor]', difficulty: 2 },
  warning: { id: 'warning', label: '[X] danger!', pattern: '[danger] [object]', difficulty: 3 },
  need: { id: 'need', label: 'I need [X]', pattern: '[need] [object]', difficulty: 3 },
};

// ── Per-Region Phrase Examples ────────────────────────────────────────────────

/**
 * Each phrase uses ONLY starter pack word IDs from languages.js.
 */
export const PHRASES = [

  // ════════════════════════════════════════════════════════════════════════════
  // LEVANT — Arabic
  // ════════════════════════════════════════════════════════════════════════════

  // Location
  { id: 'ar_water_here', regionId: 'levant', templateType: 'location', wordIds: ['ar_water', 'ar_here'], nativePhrase: 'ماء هنا', transliteration: "maa' huna", meaning: 'Water here', difficulty: 1, usageContext: 'pointing_to_water' },
  { id: 'ar_shade_here', regionId: 'levant', templateType: 'location', wordIds: ['ar_shade', 'ar_here'], nativePhrase: 'ظل هنا', transliteration: 'zill huna', meaning: 'Shade here', difficulty: 1, usageContext: 'finding_shelter' },
  { id: 'ar_path_here', regionId: 'levant', templateType: 'location', wordIds: ['ar_path', 'ar_here'], nativePhrase: 'طريق هنا', transliteration: 'tariiq huna', meaning: 'Path here', difficulty: 1, usageContext: 'navigation' },

  // Action
  { id: 'ar_take_water', regionId: 'levant', templateType: 'action', wordIds: ['ar_take', 'ar_water'], nativePhrase: 'خذ ماء', transliteration: "khudh maa'", meaning: 'Take water', difficulty: 2, usageContext: 'offering_water' },
  { id: 'ar_drink_water', regionId: 'levant', templateType: 'action', wordIds: ['ar_drink', 'ar_water'], nativePhrase: 'اشرب ماء', transliteration: "ishrab maa'", meaning: 'Drink water', difficulty: 2, usageContext: 'survival' },
  { id: 'ar_come_here', regionId: 'levant', templateType: 'action', wordIds: ['ar_come', 'ar_here'], nativePhrase: 'تعال هنا', transliteration: "ta'aal huna", meaning: 'Come here', difficulty: 2, usageContext: 'calling' },
  { id: 'ar_walk_path', regionId: 'levant', templateType: 'action', wordIds: ['ar_walk', 'ar_path'], nativePhrase: 'مشي طريق', transliteration: 'mashi tariiq', meaning: 'Walk the path', difficulty: 2, usageContext: 'navigation' },

  // Warning
  { id: 'ar_heat_sun', regionId: 'levant', templateType: 'warning', wordIds: ['ar_heat', 'ar_sun'], nativePhrase: 'حرارة شمس', transliteration: 'haraara shams', meaning: 'Sun heat! (danger)', difficulty: 3, usageContext: 'heat_warning' },

  // Request
  { id: 'ar_take_salt', regionId: 'levant', templateType: 'request', wordIds: ['ar_take', 'ar_salt'], nativePhrase: 'خذ ملح', transliteration: 'khudh milh', meaning: 'Take salt', difficulty: 2, usageContext: 'trading' },

  // ════════════════════════════════════════════════════════════════════════════
  // ANDES — Quechua
  // ════════════════════════════════════════════════════════════════════════════

  { id: 'qu_water_here', regionId: 'andes', templateType: 'identification', wordIds: ['qu_water'], nativePhrase: 'yaku', transliteration: 'yaku', meaning: 'Water!', difficulty: 1, usageContext: 'pointing_to_water' },
  { id: 'qu_see_sun', regionId: 'andes', templateType: 'action', wordIds: ['qu_see', 'qu_sun'], nativePhrase: 'rikuy inti', transliteration: 'rikuy inti', meaning: 'Look at the sun (for direction)', difficulty: 2, usageContext: 'navigation' },
  { id: 'qu_eat_potato', regionId: 'andes', templateType: 'action', wordIds: ['qu_eat', 'qu_potato'], nativePhrase: 'mikhuy papa', transliteration: 'mikhuy papa', meaning: 'Eat potato', difficulty: 2, usageContext: 'food' },
  { id: 'qu_drink_water', regionId: 'andes', templateType: 'action', wordIds: ['qu_drink', 'qu_water'], nativePhrase: 'upyay yaku', transliteration: 'upyay yaku', meaning: 'Drink water', difficulty: 2, usageContext: 'survival' },
  { id: 'qu_big_mountain', regionId: 'andes', templateType: 'description', wordIds: ['qu_big', 'qu_mountain'], nativePhrase: 'hatun urqu', transliteration: 'hatun urqu', meaning: 'Big mountain', difficulty: 2, usageContext: 'describing_landscape' },
  { id: 'qu_cold_wind', regionId: 'andes', templateType: 'warning', wordIds: ['qu_cold', 'qu_wind'], nativePhrase: 'chiri wayra', transliteration: 'chiri wayra', meaning: 'Cold wind! (warning)', difficulty: 3, usageContext: 'weather_warning' },

  // ════════════════════════════════════════════════════════════════════════════
  // SWAHILI COAST — Swahili
  // ════════════════════════════════════════════════════════════════════════════

  { id: 'sw_water_here', regionId: 'swahili_coast', templateType: 'location', wordIds: ['sw_water'], nativePhrase: 'maji hapa', transliteration: 'maji hapa', meaning: 'Water here', difficulty: 1, usageContext: 'pointing_to_water' },
  { id: 'sw_eat_food', regionId: 'swahili_coast', templateType: 'action', wordIds: ['sw_eat'], nativePhrase: 'kula', transliteration: 'kula', meaning: 'Eat', difficulty: 1, usageContext: 'food' },
  { id: 'sw_bring_water', regionId: 'swahili_coast', templateType: 'action', wordIds: ['sw_bring', 'sw_water'], nativePhrase: 'leta maji', transliteration: 'leta maji', meaning: 'Bring water', difficulty: 2, usageContext: 'requesting' },
  { id: 'sw_big_tree', regionId: 'swahili_coast', templateType: 'description', wordIds: ['sw_big', 'sw_tree'], nativePhrase: 'mti kubwa', transliteration: 'mti kubwa', meaning: 'Big tree', difficulty: 2, usageContext: 'describing' },
  { id: 'sw_heat_sun', regionId: 'swahili_coast', templateType: 'warning', wordIds: ['sw_heat', 'sw_sun'], nativePhrase: 'joto jua', transliteration: 'joto jua', meaning: 'Sun heat! (danger)', difficulty: 3, usageContext: 'heat_warning' },
  { id: 'sw_follow_path', regionId: 'swahili_coast', templateType: 'action', wordIds: ['sw_path'], nativePhrase: 'njia', transliteration: 'njia', meaning: 'The path (follow it)', difficulty: 1, usageContext: 'navigation' },

  // ════════════════════════════════════════════════════════════════════════════
  // ANATOLIA — Turkish
  // ════════════════════════════════════════════════════════════════════════════

  { id: 'tr_water_here', regionId: 'anatolia', templateType: 'location', wordIds: ['tr_water'], nativePhrase: 'su burada', transliteration: 'su burada', meaning: 'Water here', difficulty: 1, usageContext: 'pointing_to_water' },
  { id: 'tr_take_stone', regionId: 'anatolia', templateType: 'action', wordIds: ['tr_take', 'tr_stone'], nativePhrase: 'al taş', transliteration: 'al tash', meaning: 'Take stone', difficulty: 2, usageContext: 'gathering' },
  { id: 'tr_give_water', regionId: 'anatolia', templateType: 'request', wordIds: ['tr_give', 'tr_water'], nativePhrase: 'ver su', transliteration: 'ver su', meaning: 'Give water', difficulty: 2, usageContext: 'requesting' },
  { id: 'tr_big_house', regionId: 'anatolia', templateType: 'description', wordIds: ['tr_big', 'tr_house'], nativePhrase: 'büyük ev', transliteration: 'buyuk ev', meaning: 'Big house', difficulty: 2, usageContext: 'describing' },
  { id: 'tr_eat_food', regionId: 'anatolia', templateType: 'action', wordIds: ['tr_eat'], nativePhrase: 'yemek', transliteration: 'yemek', meaning: 'Eat / food', difficulty: 1, usageContext: 'food' },
  { id: 'tr_follow_road', regionId: 'anatolia', templateType: 'action', wordIds: ['tr_road'], nativePhrase: 'yol', transliteration: 'yol', meaning: 'The road (follow it)', difficulty: 1, usageContext: 'navigation' },

  // ════════════════════════════════════════════════════════════════════════════
  // ZAGROS — Kurdish + Persian
  // ════════════════════════════════════════════════════════════════════════════

  { id: 'ku_water_here', regionId: 'zagros', templateType: 'location', wordIds: ['ku_water'], nativePhrase: 'av li vir', transliteration: 'av li vir', meaning: 'Water here', difficulty: 1, usageContext: 'pointing_to_water' },
  { id: 'fa_come_here', regionId: 'zagros', templateType: 'action', wordIds: ['fa_come'], nativePhrase: 'بیا', transliteration: 'bia', meaning: 'Come!', difficulty: 1, usageContext: 'calling' },
  { id: 'fa_take_water', regionId: 'zagros', templateType: 'action', wordIds: ['fa_take', 'fa_water'], nativePhrase: 'بگیر آب', transliteration: 'begir aab', meaning: 'Take water', difficulty: 2, usageContext: 'offering' },
  { id: 'fa_big_stone', regionId: 'zagros', templateType: 'description', wordIds: ['fa_big', 'fa_stone'], nativePhrase: 'سنگ بزرگ', transliteration: 'sang bozorg', meaning: 'Big stone', difficulty: 2, usageContext: 'describing' },
  { id: 'ku_sun_hot', regionId: 'zagros', templateType: 'warning', wordIds: ['ku_sun', 'fa_heat'], nativePhrase: 'roj garma', transliteration: 'roj garma', meaning: 'Hot sun (warning)', difficulty: 3, usageContext: 'heat_warning' },

  // ════════════════════════════════════════════════════════════════════════════
  // YUNNAN — Mandarin
  // ════════════════════════════════════════════════════════════════════════════

  { id: 'zh_water_here', regionId: 'yunnan', templateType: 'location', wordIds: ['zh_water'], nativePhrase: '水在这里', transliteration: 'shuǐ zài zhèlǐ', meaning: 'Water here', difficulty: 1, usageContext: 'pointing_to_water' },
  { id: 'zh_drink_water', regionId: 'yunnan', templateType: 'action', wordIds: ['zh_drink', 'zh_water'], nativePhrase: '喝水', transliteration: 'hē shuǐ', meaning: 'Drink water', difficulty: 2, usageContext: 'survival' },
  { id: 'zh_eat_food', regionId: 'yunnan', templateType: 'action', wordIds: ['zh_eat'], nativePhrase: '吃', transliteration: 'chī', meaning: 'Eat', difficulty: 1, usageContext: 'food' },
  { id: 'zh_big_mountain', regionId: 'yunnan', templateType: 'description', wordIds: ['zh_big', 'zh_mountain'], nativePhrase: '大山', transliteration: 'dà shān', meaning: 'Big mountain', difficulty: 2, usageContext: 'describing' },
  { id: 'zh_take_bamboo', regionId: 'yunnan', templateType: 'action', wordIds: ['zh_take', 'zh_bamboo'], nativePhrase: '拿竹', transliteration: 'ná zhú', meaning: 'Take bamboo', difficulty: 2, usageContext: 'gathering' },
  { id: 'zh_follow_road', regionId: 'yunnan', templateType: 'action', wordIds: ['zh_road'], nativePhrase: '路', transliteration: 'lù', meaning: 'The road (follow it)', difficulty: 1, usageContext: 'navigation' },
  { id: 'zh_hot_sun', regionId: 'yunnan', templateType: 'warning', wordIds: ['zh_heat', 'zh_sun'], nativePhrase: '热 太阳', transliteration: 'rè tàiyáng', meaning: 'Hot sun (warning)', difficulty: 3, usageContext: 'heat_warning' },
];

// ── Lookup Helpers ───────────────────────────────────────────────────────────

/** Get all phrases for a region. */
export function getRegionPhrases(regionId) {
  return PHRASES.filter((p) => p.regionId === regionId);
}

/** Get phrases by template type. */
export function getPhrasesByType(regionId, templateType) {
  return PHRASES.filter((p) => p.regionId === regionId && p.templateType === templateType);
}

/** Get phrases by usage context. */
export function getPhrasesByContext(regionId, context) {
  return PHRASES.filter((p) => p.regionId === regionId && p.usageContext === context);
}

/** Get a specific phrase by ID. */
export function getPhrase(phraseId) {
  return PHRASES.find((p) => p.id === phraseId) || null;
}
