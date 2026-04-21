/**
 * Language Database — 6 regional language tracks with core vocabulary.
 *
 * Language is a gameplay system, not cosmetic text.
 * Learning terms unlocks NPC trust, hidden quests, better prices,
 * and ecological knowledge.
 *
 * Each term has:
 *   - native script + transliteration + pronunciation hint
 *   - category (plant, animal, material, action, environment, greeting)
 *   - difficulty tier (1–5)
 *   - mastery thresholds for progression tracking
 *   - gameplay context links
 *
 * First 20 terms per region are survival-relevant and immediately useful.
 *
 * Source rules:
 *   - Arabic terms: Arabic dictionaries and Levantine references only
 *   - All terms: common, regionally relevant, simple
 */

// ── Region Definitions ───────────────────────────────────────────────────────

export const REGIONS = {
  andes: {
    id: 'andes',
    label: 'Central Andes',
    languages: ['quechua', 'spanish'],
    primaryLanguage: 'quechua',
    biome: 'highland',
    icon: '🏔️',
  },
  levant: {
    id: 'levant',
    label: 'Arabian Desert – Levant',
    languages: ['arabic'],
    primaryLanguage: 'arabic',
    biome: 'desert',
    icon: '🏜️',
  },
  anatolia: {
    id: 'anatolia',
    label: 'Anatolian Plateau',
    languages: ['turkish'],
    primaryLanguage: 'turkish',
    biome: 'steppe',
    icon: '🌾',
  },
  zagros: {
    id: 'zagros',
    label: 'Zagros – Iranian Plateau',
    languages: ['kurdish', 'persian'],
    primaryLanguage: 'kurdish',
    biome: 'mountain_steppe',
    icon: '⛰️',
  },
  swahili_coast: {
    id: 'swahili_coast',
    label: 'East African Savanna – Swahili Coast',
    languages: ['swahili'],
    primaryLanguage: 'swahili',
    biome: 'savanna',
    icon: '🌍',
  },
  yunnan: {
    id: 'yunnan',
    label: 'Yunnan / Xishuangbanna',
    languages: ['mandarin'],
    primaryLanguage: 'mandarin',
    biome: 'subtropical_highland',
    icon: '🎋',
  },
};

// ── Vocabulary Database ──────────────────────────────────────────────────────

/**
 * All vocabulary items across all regions.
 * Each item is self-contained with all needed metadata.
 */
export const VOCABULARY = [

  // ════════════════════════════════════════════════════════════════════════════
  // LEVANT — Arabic (Levantine + Classical)
  // ════════════════════════════════════════════════════════════════════════════

  // Environment
  { id: 'ar_water', regionId: 'levant', languageCode: 'ar', script: 'ماء', transliteration: "maa'", englishGloss: 'water', category: 'environment', difficultyTier: 1, pronunciation: 'mah-ah', frequencyWeight: 1.0 },
  { id: 'ar_desert', regionId: 'levant', languageCode: 'ar', script: 'صحراء', transliteration: "sahraa'", englishGloss: 'desert', category: 'environment', difficultyTier: 1, pronunciation: 'sah-rah', frequencyWeight: 0.9 },
  { id: 'ar_sun', regionId: 'levant', languageCode: 'ar', script: 'شمس', transliteration: 'shams', englishGloss: 'sun', category: 'environment', difficultyTier: 1, pronunciation: 'shams', frequencyWeight: 0.9 },
  { id: 'ar_shade', regionId: 'levant', languageCode: 'ar', script: 'ظل', transliteration: 'zill', englishGloss: 'shade', category: 'environment', difficultyTier: 1, pronunciation: 'zill', frequencyWeight: 0.85 },
  { id: 'ar_sand', regionId: 'levant', languageCode: 'ar', script: 'رمل', transliteration: 'raml', englishGloss: 'sand', category: 'environment', difficultyTier: 1, pronunciation: 'raml', frequencyWeight: 0.8 },
  { id: 'ar_stone', regionId: 'levant', languageCode: 'ar', script: 'حجر', transliteration: 'hajar', englishGloss: 'stone', category: 'environment', difficultyTier: 1, pronunciation: 'ha-jar', frequencyWeight: 0.75 },
  { id: 'ar_wind', regionId: 'levant', languageCode: 'ar', script: 'ريح', transliteration: 'riih', englishGloss: 'wind', category: 'environment', difficultyTier: 2, pronunciation: 'reeh', frequencyWeight: 0.7 },
  { id: 'ar_heat', regionId: 'levant', languageCode: 'ar', script: 'حرارة', transliteration: 'haraara', englishGloss: 'heat', category: 'environment', difficultyTier: 2, pronunciation: 'ha-rah-ra', frequencyWeight: 0.8 },

  // Materials
  { id: 'ar_resin', regionId: 'levant', languageCode: 'ar', script: 'راتنج', transliteration: 'raatinj', englishGloss: 'resin', category: 'material', difficultyTier: 2, pronunciation: 'rah-tinj', frequencyWeight: 0.7 },
  { id: 'ar_clay', regionId: 'levant', languageCode: 'ar', script: 'طين', transliteration: 'tiin', englishGloss: 'clay', category: 'material', difficultyTier: 1, pronunciation: 'teen', frequencyWeight: 0.75 },
  { id: 'ar_iron', regionId: 'levant', languageCode: 'ar', script: 'حديد', transliteration: 'hadiid', englishGloss: 'iron', category: 'material', difficultyTier: 2, pronunciation: 'ha-deed', frequencyWeight: 0.65 },
  { id: 'ar_wood', regionId: 'levant', languageCode: 'ar', script: 'خشب', transliteration: 'khashab', englishGloss: 'wood', category: 'material', difficultyTier: 1, pronunciation: 'kha-shab', frequencyWeight: 0.8 },
  { id: 'ar_fiber', regionId: 'levant', languageCode: 'ar', script: 'ليف', transliteration: 'liif', englishGloss: 'fiber', category: 'material', difficultyTier: 2, pronunciation: 'leef', frequencyWeight: 0.6 },
  { id: 'ar_salt', regionId: 'levant', languageCode: 'ar', script: 'ملح', transliteration: 'milh', englishGloss: 'salt', category: 'material', difficultyTier: 1, pronunciation: 'milh', frequencyWeight: 0.7 },

  // Plants & Animals
  { id: 'ar_plant', regionId: 'levant', languageCode: 'ar', script: 'نبات', transliteration: 'nabaat', englishGloss: 'plant', category: 'plant', difficultyTier: 1, pronunciation: 'na-baht', frequencyWeight: 0.85 },
  { id: 'ar_tree', regionId: 'levant', languageCode: 'ar', script: 'شجرة', transliteration: 'shajara', englishGloss: 'tree', category: 'plant', difficultyTier: 1, pronunciation: 'sha-ja-ra', frequencyWeight: 0.8 },
  { id: 'ar_acacia', regionId: 'levant', languageCode: 'ar', script: 'سمر', transliteration: 'samar', englishGloss: 'acacia / mesquite', category: 'plant', difficultyTier: 2, pronunciation: 'sa-mar', frequencyWeight: 0.6 },
  { id: 'ar_camel', regionId: 'levant', languageCode: 'ar', script: 'جمل', transliteration: 'jamal', englishGloss: 'camel', category: 'animal', difficultyTier: 1, pronunciation: 'ja-mal', frequencyWeight: 0.75 },

  // Actions & Greetings
  { id: 'ar_hello', regionId: 'levant', languageCode: 'ar', script: 'مرحبا', transliteration: 'marhaba', englishGloss: 'hello', category: 'greeting', difficultyTier: 1, pronunciation: 'mar-ha-ba', frequencyWeight: 1.0 },
  { id: 'ar_thanks', regionId: 'levant', languageCode: 'ar', script: 'شكرا', transliteration: 'shukran', englishGloss: 'thank you', category: 'greeting', difficultyTier: 1, pronunciation: 'shuk-ran', frequencyWeight: 0.95 },
  { id: 'ar_peace', regionId: 'levant', languageCode: 'ar', script: 'سلام', transliteration: 'salaam', englishGloss: 'peace', category: 'greeting', difficultyTier: 1, pronunciation: 'sa-lahm', frequencyWeight: 0.9 },
  { id: 'ar_build', regionId: 'levant', languageCode: 'ar', script: 'بناء', transliteration: "binaa'", englishGloss: 'build / construct', category: 'action', difficultyTier: 2, pronunciation: 'bi-nah', frequencyWeight: 0.6 },
  { id: 'ar_fix', regionId: 'levant', languageCode: 'ar', script: 'إصلاح', transliteration: 'islaah', englishGloss: 'repair / fix', category: 'action', difficultyTier: 2, pronunciation: 'is-lahh', frequencyWeight: 0.65 },
  // Starter pack additions
  { id: 'ar_oil', regionId: 'levant', languageCode: 'ar', script: 'زيت', transliteration: 'zayt', englishGloss: 'oil', category: 'material', difficultyTier: 1, pronunciation: 'zay-t', frequencyWeight: 0.7 },
  { id: 'ar_path', regionId: 'levant', languageCode: 'ar', script: 'طريق', transliteration: 'tariiq', englishGloss: 'path', category: 'environment', difficultyTier: 1, pronunciation: 'ta-reek', frequencyWeight: 0.7 },
  { id: 'ar_walk', regionId: 'levant', languageCode: 'ar', script: 'مشي', transliteration: 'mashi', englishGloss: 'walk', category: 'action', difficultyTier: 1, pronunciation: 'ma-shee', frequencyWeight: 0.65 },
  { id: 'ar_drink', regionId: 'levant', languageCode: 'ar', script: 'اشرب', transliteration: 'ishrab', englishGloss: 'drink', category: 'action', difficultyTier: 1, pronunciation: 'ish-rab', frequencyWeight: 0.75 },
  { id: 'ar_come', regionId: 'levant', languageCode: 'ar', script: 'تعال', transliteration: "ta'aal", englishGloss: 'come', category: 'action', difficultyTier: 1, pronunciation: 'ta-ahl', frequencyWeight: 0.75 },
  { id: 'ar_take', regionId: 'levant', languageCode: 'ar', script: 'خذ', transliteration: 'khudh', englishGloss: 'take', category: 'action', difficultyTier: 1, pronunciation: 'khoodh', frequencyWeight: 0.7 },
  { id: 'ar_here', regionId: 'levant', languageCode: 'ar', script: 'هنا', transliteration: 'huna', englishGloss: 'here', category: 'direction', difficultyTier: 1, pronunciation: 'hoo-na', frequencyWeight: 0.8 },

  // ════════════════════════════════════════════════════════════════════════════
  // ANDES — Quechua-inspired
  // ════════════════════════════════════════════════════════════════════════════

  { id: 'qu_water', regionId: 'andes', languageCode: 'qu', script: 'yaku', transliteration: 'yaku', englishGloss: 'water', category: 'environment', difficultyTier: 1, pronunciation: 'yah-koo', frequencyWeight: 1.0 },
  { id: 'qu_earth', regionId: 'andes', languageCode: 'qu', script: 'allpa', transliteration: 'allpa', englishGloss: 'earth / soil', category: 'environment', difficultyTier: 1, pronunciation: 'all-pa', frequencyWeight: 0.9 },
  { id: 'qu_sun', regionId: 'andes', languageCode: 'qu', script: 'inti', transliteration: 'inti', englishGloss: 'sun', category: 'environment', difficultyTier: 1, pronunciation: 'in-tee', frequencyWeight: 0.95 },
  { id: 'qu_life', regionId: 'andes', languageCode: 'qu', script: 'kawsay', transliteration: 'kawsay', englishGloss: 'life / living', category: 'environment', difficultyTier: 2, pronunciation: 'kow-sigh', frequencyWeight: 0.7 },
  { id: 'qu_stone', regionId: 'andes', languageCode: 'qu', script: 'rumi', transliteration: 'rumi', englishGloss: 'stone', category: 'material', difficultyTier: 1, pronunciation: 'roo-mee', frequencyWeight: 0.8 },
  { id: 'qu_mountain', regionId: 'andes', languageCode: 'qu', script: 'urqu', transliteration: 'urqu', englishGloss: 'mountain', category: 'environment', difficultyTier: 1, pronunciation: 'oor-koo', frequencyWeight: 0.85 },
  { id: 'qu_fire', regionId: 'andes', languageCode: 'qu', script: 'nina', transliteration: 'nina', englishGloss: 'fire', category: 'environment', difficultyTier: 1, pronunciation: 'nee-na', frequencyWeight: 0.8 },
  { id: 'qu_wind', regionId: 'andes', languageCode: 'qu', script: 'wayra', transliteration: 'wayra', englishGloss: 'wind', category: 'environment', difficultyTier: 2, pronunciation: 'why-ra', frequencyWeight: 0.7 },
  { id: 'qu_tree', regionId: 'andes', languageCode: 'qu', script: "sach'a", transliteration: "sach'a", englishGloss: 'tree', category: 'plant', difficultyTier: 2, pronunciation: 'sah-cha', frequencyWeight: 0.7 },
  { id: 'qu_llama', regionId: 'andes', languageCode: 'qu', script: 'llama', transliteration: 'llama', englishGloss: 'llama', category: 'animal', difficultyTier: 1, pronunciation: 'yah-ma', frequencyWeight: 0.75 },
  { id: 'qu_condor', regionId: 'andes', languageCode: 'qu', script: 'kuntur', transliteration: 'kuntur', englishGloss: 'condor', category: 'animal', difficultyTier: 2, pronunciation: 'koon-toor', frequencyWeight: 0.6 },
  { id: 'qu_hello', regionId: 'andes', languageCode: 'qu', script: 'allillanchu', transliteration: 'allillanchu', englishGloss: 'hello / how are you', category: 'greeting', difficultyTier: 1, pronunciation: 'ah-yee-yan-choo', frequencyWeight: 1.0 },
  { id: 'qu_thanks', regionId: 'andes', languageCode: 'qu', script: 'sulpayki', transliteration: 'sulpayki', englishGloss: 'thank you', category: 'greeting', difficultyTier: 1, pronunciation: 'sul-pie-kee', frequencyWeight: 0.9 },
  // Starter pack additions
  { id: 'qu_forest', regionId: 'andes', languageCode: 'qu', script: 'sacha', transliteration: 'sacha', englishGloss: 'forest', category: 'environment', difficultyTier: 2, pronunciation: 'sah-cha', frequencyWeight: 0.65 },
  { id: 'qu_farm', regionId: 'andes', languageCode: 'qu', script: 'chakra', transliteration: 'chakra', englishGloss: 'farm / field', category: 'environment', difficultyTier: 2, pronunciation: 'chah-kra', frequencyWeight: 0.6 },
  { id: 'qu_potato', regionId: 'andes', languageCode: 'qu', script: 'papa', transliteration: 'papa', englishGloss: 'potato', category: 'plant', difficultyTier: 1, pronunciation: 'pah-pa', frequencyWeight: 0.75 },
  { id: 'qu_quinoa', regionId: 'andes', languageCode: 'qu', script: 'kinwa', transliteration: 'kinwa', englishGloss: 'quinoa', category: 'plant', difficultyTier: 2, pronunciation: 'keen-wa', frequencyWeight: 0.65 },
  { id: 'qu_alpaca', regionId: 'andes', languageCode: 'qu', script: 'alpaka', transliteration: 'alpaka', englishGloss: 'alpaca', category: 'animal', difficultyTier: 1, pronunciation: 'al-pa-ka', frequencyWeight: 0.7 },
  { id: 'qu_house', regionId: 'andes', languageCode: 'qu', script: 'wasicha', transliteration: 'wasicha', englishGloss: 'house', category: 'structure', difficultyTier: 2, pronunciation: 'wah-see-cha', frequencyWeight: 0.6 },
  { id: 'qu_cold', regionId: 'andes', languageCode: 'qu', script: 'chiri', transliteration: 'chiri', englishGloss: 'cold', category: 'environment', difficultyTier: 1, pronunciation: 'chee-ree', frequencyWeight: 0.7 },
  { id: 'qu_heat', regionId: 'andes', languageCode: 'qu', script: 'ruphay', transliteration: 'ruphay', englishGloss: 'heat', category: 'environment', difficultyTier: 2, pronunciation: 'roo-fay', frequencyWeight: 0.65 },
  { id: 'qu_eat', regionId: 'andes', languageCode: 'qu', script: 'mikhuy', transliteration: 'mikhuy', englishGloss: 'eat', category: 'action', difficultyTier: 1, pronunciation: 'mee-khoo-ee', frequencyWeight: 0.7 },
  { id: 'qu_drink', regionId: 'andes', languageCode: 'qu', script: 'upyay', transliteration: 'upyay', englishGloss: 'drink', category: 'action', difficultyTier: 1, pronunciation: 'oop-yay', frequencyWeight: 0.7 },
  { id: 'qu_see', regionId: 'andes', languageCode: 'qu', script: 'rikuy', transliteration: 'rikuy', englishGloss: 'see / look', category: 'action', difficultyTier: 1, pronunciation: 'ree-koo-ee', frequencyWeight: 0.65 },
  { id: 'qu_big', regionId: 'andes', languageCode: 'qu', script: 'hatun', transliteration: 'hatun', englishGloss: 'big', category: 'descriptor', difficultyTier: 1, pronunciation: 'ha-toon', frequencyWeight: 0.6 },
  { id: 'qu_small', regionId: 'andes', languageCode: 'qu', script: 'huchuy', transliteration: 'huchuy', englishGloss: 'small', category: 'descriptor', difficultyTier: 1, pronunciation: 'hoo-choo-ee', frequencyWeight: 0.6 },

  // ════════════════════════════════════════════════════════════════════════════
  // SWAHILI COAST — Swahili
  // ════════════════════════════════════════════════════════════════════════════

  { id: 'sw_water', regionId: 'swahili_coast', languageCode: 'sw', script: 'maji', transliteration: 'maji', englishGloss: 'water', category: 'environment', difficultyTier: 1, pronunciation: 'mah-jee', frequencyWeight: 1.0 },
  { id: 'sw_fire', regionId: 'swahili_coast', languageCode: 'sw', script: 'moto', transliteration: 'moto', englishGloss: 'fire', category: 'environment', difficultyTier: 1, pronunciation: 'moh-toh', frequencyWeight: 0.9 },
  { id: 'sw_tree', regionId: 'swahili_coast', languageCode: 'sw', script: 'mti', transliteration: 'mti', englishGloss: 'tree', category: 'plant', difficultyTier: 1, pronunciation: 'mm-tee', frequencyWeight: 0.85 },
  { id: 'sw_soil', regionId: 'swahili_coast', languageCode: 'sw', script: 'udongo', transliteration: 'udongo', englishGloss: 'soil / clay', category: 'material', difficultyTier: 1, pronunciation: 'oo-dong-oh', frequencyWeight: 0.8 },
  { id: 'sw_stone', regionId: 'swahili_coast', languageCode: 'sw', script: 'jiwe', transliteration: 'jiwe', englishGloss: 'stone', category: 'material', difficultyTier: 1, pronunciation: 'jee-weh', frequencyWeight: 0.75 },
  { id: 'sw_iron', regionId: 'swahili_coast', languageCode: 'sw', script: 'chuma', transliteration: 'chuma', englishGloss: 'iron / metal', category: 'material', difficultyTier: 2, pronunciation: 'choo-ma', frequencyWeight: 0.7 },
  { id: 'sw_rain', regionId: 'swahili_coast', languageCode: 'sw', script: 'mvua', transliteration: 'mvua', englishGloss: 'rain', category: 'environment', difficultyTier: 1, pronunciation: 'mm-voo-ah', frequencyWeight: 0.8 },
  { id: 'sw_wind', regionId: 'swahili_coast', languageCode: 'sw', script: 'upepo', transliteration: 'upepo', englishGloss: 'wind', category: 'environment', difficultyTier: 2, pronunciation: 'oo-peh-poh', frequencyWeight: 0.7 },
  { id: 'sw_lion', regionId: 'swahili_coast', languageCode: 'sw', script: 'simba', transliteration: 'simba', englishGloss: 'lion', category: 'animal', difficultyTier: 1, pronunciation: 'sim-ba', frequencyWeight: 0.8 },
  { id: 'sw_elephant', regionId: 'swahili_coast', languageCode: 'sw', script: 'tembo', transliteration: 'tembo', englishGloss: 'elephant', category: 'animal', difficultyTier: 1, pronunciation: 'tem-boh', frequencyWeight: 0.75 },
  { id: 'sw_hello', regionId: 'swahili_coast', languageCode: 'sw', script: 'jambo', transliteration: 'jambo', englishGloss: 'hello', category: 'greeting', difficultyTier: 1, pronunciation: 'jahm-boh', frequencyWeight: 1.0 },
  { id: 'sw_thanks', regionId: 'swahili_coast', languageCode: 'sw', script: 'asante', transliteration: 'asante', englishGloss: 'thank you', category: 'greeting', difficultyTier: 1, pronunciation: 'ah-sahn-teh', frequencyWeight: 0.95 },
  { id: 'sw_build', regionId: 'swahili_coast', languageCode: 'sw', script: 'jenga', transliteration: 'jenga', englishGloss: 'build', category: 'action', difficultyTier: 1, pronunciation: 'jen-ga', frequencyWeight: 0.7 },
  { id: 'sw_fix', regionId: 'swahili_coast', languageCode: 'sw', script: 'tengeneza', transliteration: 'tengeneza', englishGloss: 'fix / repair', category: 'action', difficultyTier: 3, pronunciation: 'ten-geh-neh-za', frequencyWeight: 0.6 },
  // Starter pack additions
  { id: 'sw_earth', regionId: 'swahili_coast', languageCode: 'sw', script: 'ardhi', transliteration: 'ardhi', englishGloss: 'earth', category: 'material', difficultyTier: 1, pronunciation: 'ar-dee', frequencyWeight: 0.75 },
  { id: 'sw_heat', regionId: 'swahili_coast', languageCode: 'sw', script: 'joto', transliteration: 'joto', englishGloss: 'heat', category: 'environment', difficultyTier: 1, pronunciation: 'joh-toh', frequencyWeight: 0.75 },
  { id: 'sw_sun', regionId: 'swahili_coast', languageCode: 'sw', script: 'jua', transliteration: 'jua', englishGloss: 'sun', category: 'environment', difficultyTier: 1, pronunciation: 'joo-ah', frequencyWeight: 0.8 },
  { id: 'sw_meat', regionId: 'swahili_coast', languageCode: 'sw', script: 'nyama', transliteration: 'nyama', englishGloss: 'animal / meat', category: 'animal', difficultyTier: 1, pronunciation: 'nyah-ma', frequencyWeight: 0.7 },
  { id: 'sw_cow', regionId: 'swahili_coast', languageCode: 'sw', script: "ng'ombe", transliteration: 'ngombe', englishGloss: 'cow', category: 'animal', difficultyTier: 2, pronunciation: 'ng-ohm-beh', frequencyWeight: 0.65 },
  { id: 'sw_goat', regionId: 'swahili_coast', languageCode: 'sw', script: 'mbuzi', transliteration: 'mbuzi', englishGloss: 'goat', category: 'animal', difficultyTier: 1, pronunciation: 'mm-boo-zee', frequencyWeight: 0.65 },
  { id: 'sw_house', regionId: 'swahili_coast', languageCode: 'sw', script: 'nyumba', transliteration: 'nyumba', englishGloss: 'house', category: 'structure', difficultyTier: 1, pronunciation: 'nyoom-ba', frequencyWeight: 0.7 },
  { id: 'sw_path', regionId: 'swahili_coast', languageCode: 'sw', script: 'njia', transliteration: 'njia', englishGloss: 'path', category: 'environment', difficultyTier: 1, pronunciation: 'nn-jee-ah', frequencyWeight: 0.7 },
  { id: 'sw_eat', regionId: 'swahili_coast', languageCode: 'sw', script: 'kula', transliteration: 'kula', englishGloss: 'eat', category: 'action', difficultyTier: 1, pronunciation: 'koo-la', frequencyWeight: 0.7 },
  { id: 'sw_drink', regionId: 'swahili_coast', languageCode: 'sw', script: 'kunywa', transliteration: 'kunywa', englishGloss: 'drink', category: 'action', difficultyTier: 2, pronunciation: 'koo-nywa', frequencyWeight: 0.65 },
  { id: 'sw_bring', regionId: 'swahili_coast', languageCode: 'sw', script: 'leta', transliteration: 'leta', englishGloss: 'bring', category: 'action', difficultyTier: 1, pronunciation: 'leh-ta', frequencyWeight: 0.65 },
  { id: 'sw_take', regionId: 'swahili_coast', languageCode: 'sw', script: 'chukua', transliteration: 'chukua', englishGloss: 'take', category: 'action', difficultyTier: 2, pronunciation: 'choo-koo-ah', frequencyWeight: 0.6 },
  { id: 'sw_give', regionId: 'swahili_coast', languageCode: 'sw', script: 'toa', transliteration: 'toa', englishGloss: 'give', category: 'action', difficultyTier: 1, pronunciation: 'toh-ah', frequencyWeight: 0.6 },
  { id: 'sw_big', regionId: 'swahili_coast', languageCode: 'sw', script: 'kubwa', transliteration: 'kubwa', englishGloss: 'big', category: 'descriptor', difficultyTier: 1, pronunciation: 'koob-wa', frequencyWeight: 0.55 },
  { id: 'sw_small', regionId: 'swahili_coast', languageCode: 'sw', script: 'ndogo', transliteration: 'ndogo', englishGloss: 'small', category: 'descriptor', difficultyTier: 1, pronunciation: 'nn-doh-goh', frequencyWeight: 0.55 },

  // ════════════════════════════════════════════════════════════════════════════
  // ANATOLIA — Turkish
  // ════════════════════════════════════════════════════════════════════════════

  { id: 'tr_water', regionId: 'anatolia', languageCode: 'tr', script: 'su', transliteration: 'su', englishGloss: 'water', category: 'environment', difficultyTier: 1, pronunciation: 'soo', frequencyWeight: 1.0 },
  { id: 'tr_fire', regionId: 'anatolia', languageCode: 'tr', script: 'ateş', transliteration: 'ateş', englishGloss: 'fire', category: 'environment', difficultyTier: 1, pronunciation: 'ah-tesh', frequencyWeight: 0.9 },
  { id: 'tr_stone', regionId: 'anatolia', languageCode: 'tr', script: 'taş', transliteration: 'taş', englishGloss: 'stone', category: 'material', difficultyTier: 1, pronunciation: 'tahsh', frequencyWeight: 0.8 },
  { id: 'tr_iron', regionId: 'anatolia', languageCode: 'tr', script: 'demir', transliteration: 'demir', englishGloss: 'iron', category: 'material', difficultyTier: 1, pronunciation: 'deh-mir', frequencyWeight: 0.75 },
  { id: 'tr_wood', regionId: 'anatolia', languageCode: 'tr', script: 'odun', transliteration: 'odun', englishGloss: 'wood / firewood', category: 'material', difficultyTier: 1, pronunciation: 'oh-doon', frequencyWeight: 0.8 },
  { id: 'tr_earth', regionId: 'anatolia', languageCode: 'tr', script: 'toprak', transliteration: 'toprak', englishGloss: 'earth / soil', category: 'environment', difficultyTier: 1, pronunciation: 'top-rahk', frequencyWeight: 0.75 },
  { id: 'tr_wind', regionId: 'anatolia', languageCode: 'tr', script: 'rüzgar', transliteration: 'rüzgar', englishGloss: 'wind', category: 'environment', difficultyTier: 2, pronunciation: 'rooz-gar', frequencyWeight: 0.65 },
  { id: 'tr_tree', regionId: 'anatolia', languageCode: 'tr', script: 'ağaç', transliteration: 'ağaç', englishGloss: 'tree', category: 'plant', difficultyTier: 1, pronunciation: 'ah-ahch', frequencyWeight: 0.8 },
  { id: 'tr_horse', regionId: 'anatolia', languageCode: 'tr', script: 'at', transliteration: 'at', englishGloss: 'horse', category: 'animal', difficultyTier: 1, pronunciation: 'aht', frequencyWeight: 0.7 },
  { id: 'tr_hello', regionId: 'anatolia', languageCode: 'tr', script: 'merhaba', transliteration: 'merhaba', englishGloss: 'hello', category: 'greeting', difficultyTier: 1, pronunciation: 'mer-ha-ba', frequencyWeight: 1.0 },
  { id: 'tr_thanks', regionId: 'anatolia', languageCode: 'tr', script: 'teşekkürler', transliteration: 'teşekkürler', englishGloss: 'thank you', category: 'greeting', difficultyTier: 2, pronunciation: 'teh-shek-kur-ler', frequencyWeight: 0.9 },
  { id: 'tr_build', regionId: 'anatolia', languageCode: 'tr', script: 'inşa', transliteration: 'inşa', englishGloss: 'build', category: 'action', difficultyTier: 2, pronunciation: 'in-sha', frequencyWeight: 0.6 },
  // Starter pack additions
  { id: 'tr_sun', regionId: 'anatolia', languageCode: 'tr', script: 'güneş', transliteration: 'güneş', englishGloss: 'sun', category: 'environment', difficultyTier: 1, pronunciation: 'goo-nesh', frequencyWeight: 0.8 },
  { id: 'tr_house', regionId: 'anatolia', languageCode: 'tr', script: 'ev', transliteration: 'ev', englishGloss: 'house', category: 'structure', difficultyTier: 1, pronunciation: 'ev', frequencyWeight: 0.75 },
  { id: 'tr_road', regionId: 'anatolia', languageCode: 'tr', script: 'yol', transliteration: 'yol', englishGloss: 'road / path', category: 'environment', difficultyTier: 1, pronunciation: 'yol', frequencyWeight: 0.7 },
  { id: 'tr_eat', regionId: 'anatolia', languageCode: 'tr', script: 'yemek', transliteration: 'yemek', englishGloss: 'food / eat', category: 'action', difficultyTier: 1, pronunciation: 'yeh-mek', frequencyWeight: 0.7 },
  { id: 'tr_drink', regionId: 'anatolia', languageCode: 'tr', script: 'içmek', transliteration: 'içmek', englishGloss: 'drink', category: 'action', difficultyTier: 1, pronunciation: 'ich-mek', frequencyWeight: 0.65 },
  { id: 'tr_bring', regionId: 'anatolia', languageCode: 'tr', script: 'getir', transliteration: 'getir', englishGloss: 'bring', category: 'action', difficultyTier: 1, pronunciation: 'geh-tir', frequencyWeight: 0.6 },
  { id: 'tr_take', regionId: 'anatolia', languageCode: 'tr', script: 'al', transliteration: 'al', englishGloss: 'take', category: 'action', difficultyTier: 1, pronunciation: 'ahl', frequencyWeight: 0.65 },
  { id: 'tr_give', regionId: 'anatolia', languageCode: 'tr', script: 'ver', transliteration: 'ver', englishGloss: 'give', category: 'action', difficultyTier: 1, pronunciation: 'ver', frequencyWeight: 0.6 },
  { id: 'tr_big', regionId: 'anatolia', languageCode: 'tr', script: 'büyük', transliteration: 'büyük', englishGloss: 'big', category: 'descriptor', difficultyTier: 1, pronunciation: 'boo-yook', frequencyWeight: 0.55 },
  { id: 'tr_small', regionId: 'anatolia', languageCode: 'tr', script: 'küçük', transliteration: 'küçük', englishGloss: 'small', category: 'descriptor', difficultyTier: 1, pronunciation: 'koo-chook', frequencyWeight: 0.55 },
  { id: 'tr_wool', regionId: 'anatolia', languageCode: 'tr', script: 'yün', transliteration: 'yün', englishGloss: 'wool', category: 'material', difficultyTier: 2, pronunciation: 'yoon', frequencyWeight: 0.5 },
  { id: 'tr_clay', regionId: 'anatolia', languageCode: 'tr', script: 'kil', transliteration: 'kil', englishGloss: 'clay', category: 'material', difficultyTier: 1, pronunciation: 'kil', frequencyWeight: 0.6 },
  { id: 'tr_farm', regionId: 'anatolia', languageCode: 'tr', script: 'çiftlik', transliteration: 'çiftlik', englishGloss: 'farm', category: 'environment', difficultyTier: 2, pronunciation: 'chift-lik', frequencyWeight: 0.5 },

  // ════════════════════════════════════════════════════════════════════════════
  // ZAGROS — Kurdish (Kurmanji primary) + Persian (Farsi)
  // ════════════════════════════════════════════════════════════════════════════

  { id: 'ku_water', regionId: 'zagros', languageCode: 'ku', script: 'av', transliteration: 'av', englishGloss: 'water', category: 'environment', difficultyTier: 1, pronunciation: 'ahv', frequencyWeight: 1.0 },
  { id: 'ku_fire', regionId: 'zagros', languageCode: 'ku', script: 'agir', transliteration: 'agir', englishGloss: 'fire', category: 'environment', difficultyTier: 1, pronunciation: 'ah-gir', frequencyWeight: 0.9 },
  { id: 'ku_stone', regionId: 'zagros', languageCode: 'ku', script: 'kevir', transliteration: 'kevir', englishGloss: 'stone', category: 'material', difficultyTier: 1, pronunciation: 'keh-vir', frequencyWeight: 0.8 },
  { id: 'ku_mountain', regionId: 'zagros', languageCode: 'ku', script: 'çiya', transliteration: 'çiya', englishGloss: 'mountain', category: 'environment', difficultyTier: 1, pronunciation: 'chee-ya', frequencyWeight: 0.85 },
  { id: 'ku_tree', regionId: 'zagros', languageCode: 'ku', script: 'dar', transliteration: 'dar', englishGloss: 'tree / wood', category: 'plant', difficultyTier: 1, pronunciation: 'dahr', frequencyWeight: 0.8 },
  { id: 'ku_earth', regionId: 'zagros', languageCode: 'ku', script: 'ax', transliteration: 'ax', englishGloss: 'earth / soil', category: 'environment', difficultyTier: 1, pronunciation: 'ahkh', frequencyWeight: 0.75 },
  { id: 'ku_sun', regionId: 'zagros', languageCode: 'ku', script: 'roj', transliteration: 'roj', englishGloss: 'sun / day', category: 'environment', difficultyTier: 1, pronunciation: 'rozh', frequencyWeight: 0.85 },
  { id: 'ku_hello', regionId: 'zagros', languageCode: 'ku', script: 'silav', transliteration: 'silav', englishGloss: 'hello', category: 'greeting', difficultyTier: 1, pronunciation: 'si-lahv', frequencyWeight: 1.0 },
  { id: 'ku_thanks', regionId: 'zagros', languageCode: 'ku', script: 'spas', transliteration: 'spas', englishGloss: 'thank you', category: 'greeting', difficultyTier: 1, pronunciation: 'spahs', frequencyWeight: 0.95 },
  { id: 'ku_iron', regionId: 'zagros', languageCode: 'ku', script: 'hesin', transliteration: 'hesin', englishGloss: 'iron', category: 'material', difficultyTier: 2, pronunciation: 'heh-sin', frequencyWeight: 0.65 },
  // Persian starter pack (secondary language for Zagros)
  { id: 'fa_water', regionId: 'zagros', languageCode: 'fa', script: 'آب', transliteration: 'aab', englishGloss: 'water', category: 'environment', difficultyTier: 1, pronunciation: 'ahb', frequencyWeight: 0.95 },
  { id: 'fa_soil', regionId: 'zagros', languageCode: 'fa', script: 'خاک', transliteration: 'khaak', englishGloss: 'soil', category: 'material', difficultyTier: 1, pronunciation: 'khahk', frequencyWeight: 0.8 },
  { id: 'fa_stone', regionId: 'zagros', languageCode: 'fa', script: 'سنگ', transliteration: 'sang', englishGloss: 'stone', category: 'material', difficultyTier: 1, pronunciation: 'sang', frequencyWeight: 0.75 },
  { id: 'fa_tree', regionId: 'zagros', languageCode: 'fa', script: 'درخت', transliteration: 'derakht', englishGloss: 'tree', category: 'plant', difficultyTier: 1, pronunciation: 'deh-rakht', frequencyWeight: 0.75 },
  { id: 'fa_heat', regionId: 'zagros', languageCode: 'fa', script: 'گرما', transliteration: 'garma', englishGloss: 'heat', category: 'environment', difficultyTier: 1, pronunciation: 'gar-mah', frequencyWeight: 0.7 },
  { id: 'fa_wind', regionId: 'zagros', languageCode: 'fa', script: 'باد', transliteration: 'baad', englishGloss: 'wind', category: 'environment', difficultyTier: 1, pronunciation: 'bahd', frequencyWeight: 0.65 },
  { id: 'fa_sun', regionId: 'zagros', languageCode: 'fa', script: 'خورشید', transliteration: 'khorshid', englishGloss: 'sun', category: 'environment', difficultyTier: 2, pronunciation: 'khor-sheed', frequencyWeight: 0.7 },
  { id: 'fa_wood', regionId: 'zagros', languageCode: 'fa', script: 'چوب', transliteration: 'choob', englishGloss: 'wood', category: 'material', difficultyTier: 1, pronunciation: 'choob', frequencyWeight: 0.7 },
  { id: 'fa_salt', regionId: 'zagros', languageCode: 'fa', script: 'نمک', transliteration: 'namak', englishGloss: 'salt', category: 'material', difficultyTier: 1, pronunciation: 'na-mak', frequencyWeight: 0.6 },
  { id: 'fa_goat', regionId: 'zagros', languageCode: 'fa', script: 'بز', transliteration: 'boz', englishGloss: 'goat', category: 'animal', difficultyTier: 1, pronunciation: 'bohz', frequencyWeight: 0.6 },
  { id: 'fa_sheep', regionId: 'zagros', languageCode: 'fa', script: 'گوسفند', transliteration: 'goosfand', englishGloss: 'sheep', category: 'animal', difficultyTier: 2, pronunciation: 'goos-fand', frequencyWeight: 0.55 },
  { id: 'fa_house', regionId: 'zagros', languageCode: 'fa', script: 'خانه', transliteration: 'khaaneh', englishGloss: 'house', category: 'structure', difficultyTier: 1, pronunciation: 'khah-neh', frequencyWeight: 0.65 },
  { id: 'fa_path', regionId: 'zagros', languageCode: 'fa', script: 'راه', transliteration: 'raah', englishGloss: 'path', category: 'environment', difficultyTier: 1, pronunciation: 'rahh', frequencyWeight: 0.65 },
  { id: 'fa_eat', regionId: 'zagros', languageCode: 'fa', script: 'بخور', transliteration: 'bokhor', englishGloss: 'eat', category: 'action', difficultyTier: 1, pronunciation: 'bo-khor', frequencyWeight: 0.65 },
  { id: 'fa_come', regionId: 'zagros', languageCode: 'fa', script: 'بیا', transliteration: 'bia', englishGloss: 'come', category: 'action', difficultyTier: 1, pronunciation: 'bee-yah', frequencyWeight: 0.7 },
  { id: 'fa_take', regionId: 'zagros', languageCode: 'fa', script: 'بگیر', transliteration: 'begir', englishGloss: 'take', category: 'action', difficultyTier: 1, pronunciation: 'beh-geer', frequencyWeight: 0.6 },
  { id: 'fa_give', regionId: 'zagros', languageCode: 'fa', script: 'بده', transliteration: 'bedeh', englishGloss: 'give', category: 'action', difficultyTier: 1, pronunciation: 'beh-deh', frequencyWeight: 0.6 },
  { id: 'fa_big', regionId: 'zagros', languageCode: 'fa', script: 'بزرگ', transliteration: 'bozorg', englishGloss: 'big', category: 'descriptor', difficultyTier: 1, pronunciation: 'bo-zorg', frequencyWeight: 0.55 },
  { id: 'fa_small', regionId: 'zagros', languageCode: 'fa', script: 'کوچک', transliteration: 'kuchak', englishGloss: 'small', category: 'descriptor', difficultyTier: 1, pronunciation: 'koo-chak', frequencyWeight: 0.55 },
  { id: 'fa_oil', regionId: 'zagros', languageCode: 'fa', script: 'روغن', transliteration: 'roghan', englishGloss: 'oil', category: 'material', difficultyTier: 2, pronunciation: 'ro-ghan', frequencyWeight: 0.5 },

  // ════════════════════════════════════════════════════════════════════════════
  // YUNNAN — Mandarin (simplified)
  // ════════════════════════════════════════════════════════════════════════════

  { id: 'zh_water', regionId: 'yunnan', languageCode: 'zh', script: '水', transliteration: 'shuǐ', englishGloss: 'water', category: 'environment', difficultyTier: 1, pronunciation: 'shway', frequencyWeight: 1.0 },
  { id: 'zh_fire', regionId: 'yunnan', languageCode: 'zh', script: '火', transliteration: 'huǒ', englishGloss: 'fire', category: 'environment', difficultyTier: 1, pronunciation: 'hwoh', frequencyWeight: 0.9 },
  { id: 'zh_wood', regionId: 'yunnan', languageCode: 'zh', script: '木', transliteration: 'mù', englishGloss: 'wood', category: 'material', difficultyTier: 1, pronunciation: 'moo', frequencyWeight: 0.85 },
  { id: 'zh_earth', regionId: 'yunnan', languageCode: 'zh', script: '土', transliteration: 'tǔ', englishGloss: 'earth / soil', category: 'environment', difficultyTier: 1, pronunciation: 'too', frequencyWeight: 0.85 },
  { id: 'zh_stone', regionId: 'yunnan', languageCode: 'zh', script: '石', transliteration: 'shí', englishGloss: 'stone', category: 'material', difficultyTier: 1, pronunciation: 'shih', frequencyWeight: 0.8 },
  { id: 'zh_iron', regionId: 'yunnan', languageCode: 'zh', script: '铁', transliteration: 'tiě', englishGloss: 'iron', category: 'material', difficultyTier: 2, pronunciation: 'tyeh', frequencyWeight: 0.7 },
  { id: 'zh_bamboo', regionId: 'yunnan', languageCode: 'zh', script: '竹', transliteration: 'zhú', englishGloss: 'bamboo', category: 'plant', difficultyTier: 1, pronunciation: 'joo', frequencyWeight: 0.85 },
  { id: 'zh_tea', regionId: 'yunnan', languageCode: 'zh', script: '茶', transliteration: 'chá', englishGloss: 'tea', category: 'plant', difficultyTier: 1, pronunciation: 'chah', frequencyWeight: 0.8 },
  { id: 'zh_mountain', regionId: 'yunnan', languageCode: 'zh', script: '山', transliteration: 'shān', englishGloss: 'mountain', category: 'environment', difficultyTier: 1, pronunciation: 'shahn', frequencyWeight: 0.8 },
  { id: 'zh_rain', regionId: 'yunnan', languageCode: 'zh', script: '雨', transliteration: 'yǔ', englishGloss: 'rain', category: 'environment', difficultyTier: 1, pronunciation: 'yoo', frequencyWeight: 0.75 },
  { id: 'zh_hello', regionId: 'yunnan', languageCode: 'zh', script: '你好', transliteration: 'nǐ hǎo', englishGloss: 'hello', category: 'greeting', difficultyTier: 1, pronunciation: 'nee how', frequencyWeight: 1.0 },
  { id: 'zh_thanks', regionId: 'yunnan', languageCode: 'zh', script: '谢谢', transliteration: 'xiè xie', englishGloss: 'thank you', category: 'greeting', difficultyTier: 1, pronunciation: 'syeh syeh', frequencyWeight: 0.95 },
  { id: 'zh_build', regionId: 'yunnan', languageCode: 'zh', script: '建', transliteration: 'jiàn', englishGloss: 'build', category: 'action', difficultyTier: 2, pronunciation: 'jyen', frequencyWeight: 0.6 },
  { id: 'zh_fix', regionId: 'yunnan', languageCode: 'zh', script: '修', transliteration: 'xiū', englishGloss: 'fix / repair', category: 'action', difficultyTier: 2, pronunciation: 'syoh', frequencyWeight: 0.65 },
  // Starter pack additions
  { id: 'zh_heat', regionId: 'yunnan', languageCode: 'zh', script: '热', transliteration: 'rè', englishGloss: 'heat', category: 'environment', difficultyTier: 1, pronunciation: 'ruh', frequencyWeight: 0.75 },
  { id: 'zh_wind', regionId: 'yunnan', languageCode: 'zh', script: '风', transliteration: 'fēng', englishGloss: 'wind', category: 'environment', difficultyTier: 1, pronunciation: 'fung', frequencyWeight: 0.7 },
  { id: 'zh_sun', regionId: 'yunnan', languageCode: 'zh', script: '太阳', transliteration: 'tàiyáng', englishGloss: 'sun', category: 'environment', difficultyTier: 2, pronunciation: 'tie-yahng', frequencyWeight: 0.75 },
  { id: 'zh_tree', regionId: 'yunnan', languageCode: 'zh', script: '树', transliteration: 'shù', englishGloss: 'tree', category: 'plant', difficultyTier: 1, pronunciation: 'shoo', frequencyWeight: 0.75 },
  { id: 'zh_animal', regionId: 'yunnan', languageCode: 'zh', script: '动物', transliteration: 'dòngwù', englishGloss: 'animal', category: 'animal', difficultyTier: 2, pronunciation: 'dong-woo', frequencyWeight: 0.6 },
  { id: 'zh_house', regionId: 'yunnan', languageCode: 'zh', script: '房子', transliteration: 'fángzi', englishGloss: 'house', category: 'structure', difficultyTier: 1, pronunciation: 'fahng-zuh', frequencyWeight: 0.65 },
  { id: 'zh_road', regionId: 'yunnan', languageCode: 'zh', script: '路', transliteration: 'lù', englishGloss: 'road / path', category: 'environment', difficultyTier: 1, pronunciation: 'loo', frequencyWeight: 0.7 },
  { id: 'zh_eat', regionId: 'yunnan', languageCode: 'zh', script: '吃', transliteration: 'chī', englishGloss: 'eat', category: 'action', difficultyTier: 1, pronunciation: 'chih', frequencyWeight: 0.7 },
  { id: 'zh_drink', regionId: 'yunnan', languageCode: 'zh', script: '喝', transliteration: 'hē', englishGloss: 'drink', category: 'action', difficultyTier: 1, pronunciation: 'huh', frequencyWeight: 0.65 },
  { id: 'zh_come', regionId: 'yunnan', languageCode: 'zh', script: '来', transliteration: 'lái', englishGloss: 'come', category: 'action', difficultyTier: 1, pronunciation: 'lie', frequencyWeight: 0.65 },
  { id: 'zh_take', regionId: 'yunnan', languageCode: 'zh', script: '拿', transliteration: 'ná', englishGloss: 'take', category: 'action', difficultyTier: 1, pronunciation: 'nah', frequencyWeight: 0.6 },
  { id: 'zh_give', regionId: 'yunnan', languageCode: 'zh', script: '给', transliteration: 'gěi', englishGloss: 'give', category: 'action', difficultyTier: 1, pronunciation: 'gay', frequencyWeight: 0.6 },
  { id: 'zh_big', regionId: 'yunnan', languageCode: 'zh', script: '大', transliteration: 'dà', englishGloss: 'big', category: 'descriptor', difficultyTier: 1, pronunciation: 'dah', frequencyWeight: 0.6 },
  { id: 'zh_small', regionId: 'yunnan', languageCode: 'zh', script: '小', transliteration: 'xiǎo', englishGloss: 'small', category: 'descriptor', difficultyTier: 1, pronunciation: 'syow', frequencyWeight: 0.6 },
  { id: 'zh_forest', regionId: 'yunnan', languageCode: 'zh', script: '森林', transliteration: 'sēnlín', englishGloss: 'forest', category: 'environment', difficultyTier: 2, pronunciation: 'sen-lin', frequencyWeight: 0.55 },
];

// ── Lookup Helpers ───────────────────────────────────────────────────────────

/** Get all vocabulary for a region. */
export function getRegionVocabulary(regionId) {
  return VOCABULARY.filter((v) => v.regionId === regionId);
}

/** Get vocabulary by category within a region. */
export function getVocabularyByCategory(regionId, category) {
  return VOCABULARY.filter((v) => v.regionId === regionId && v.category === category);
}

/** Get vocabulary by difficulty tier. */
export function getVocabularyByTier(regionId, tier) {
  return VOCABULARY.filter((v) => v.regionId === regionId && v.difficultyTier <= tier);
}

/** Get a single vocabulary item by ID. */
export function getVocabItem(id) {
  return VOCABULARY.find((v) => v.id === id) || null;
}

/** Get the local name for an English term in a region. */
export function getLocalTerm(regionId, englishGloss) {
  return VOCABULARY.find((v) =>
    v.regionId === regionId && v.englishGloss.toLowerCase().includes(englishGloss.toLowerCase())
  ) || null;
}

/** Format a term for display: "English (script) [transliteration]" */
export function formatTerm(vocabItem, displayMode = 'dual') {
  if (!vocabItem) return '';
  switch (displayMode) {
    case 'english': return vocabItem.englishGloss;
    case 'native': return vocabItem.script;
    case 'dual': return `${vocabItem.englishGloss} (${vocabItem.script})`;
    case 'full': return `${vocabItem.englishGloss} (${vocabItem.script}) [${vocabItem.transliteration}]`;
    default: return vocabItem.englishGloss;
  }
}
