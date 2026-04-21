/**
 * Language Progression System — mastery tracking, XP, spaced repetition.
 *
 * Tracks per-term mastery through 6 stages:
 *   unseen → introduced → familiar → practiced → reliable → mastered
 *
 * Mastery advances through weighted evidence from gameplay:
 *   - seeing a term in context (low)
 *   - hearing it spoken (low-medium)
 *   - selecting correct meaning (medium)
 *   - recalling from memory (high)
 *   - using in dialogue (highest)
 *
 * Spaced repetition: terms due for review reappear naturally in
 * inspection, crafting, signs, NPC hints — not in a flashcard screen.
 *
 * Per-region XP with rank unlocks:
 *   Rank 1: dual-language labels
 *   Rank 2: NPC greetings in local language
 *   Rank 3: ecology/crafting hints in local terms
 *   Rank 4: trust-based side quests
 *   Rank 5: native-first dialogue
 *
 * Pure functions operating on serializable state.
 */

import { getRegionVocabulary, getVocabItem } from '../data/languages.js';

// ── Mastery Stages ───────────────────────────────────────────────────────────

export const MASTERY_STAGES = [
  { id: 'unseen',     label: 'Unseen',     level: 0, xpRequired: 0 },
  { id: 'introduced', label: 'Introduced', level: 1, xpRequired: 1 },
  { id: 'familiar',   label: 'Familiar',   level: 2, xpRequired: 5 },
  { id: 'practiced',  label: 'Practiced',  level: 3, xpRequired: 15 },
  { id: 'reliable',   label: 'Reliable',   level: 4, xpRequired: 30 },
  { id: 'mastered',   label: 'Mastered',   level: 5, xpRequired: 50 },
];

/** Evidence weights for different learning activities. */
const EVIDENCE_WEIGHTS = {
  seen: 1,
  heard: 2,
  recognized: 3,     // selected correct meaning from choices
  recalled: 5,        // produced term from memory
  spoken: 4,          // pronounced successfully
  used_in_dialogue: 6, // used correctly in NPC conversation
  used_in_crafting: 4, // used correctly in crafting context
  used_in_quest: 5,   // used correctly in quest context
};

// ── Region Rank System ───────────────────────────────────────────────────────

export const RANK_THRESHOLDS = [
  { rank: 1, xp: 0,    label: 'Newcomer',     displayMode: 'english',  unlocks: 'Dual-language labels' },
  { rank: 2, xp: 50,   label: 'Listener',     displayMode: 'dual',     unlocks: 'NPC greetings in local language' },
  { rank: 3, xp: 150,  label: 'Learner',       displayMode: 'dual',     unlocks: 'Ecology/crafting hints in local terms' },
  { rank: 4, xp: 350,  label: 'Speaker',       displayMode: 'dual',     unlocks: 'Trust-based side quests' },
  { rank: 5, xp: 700,  label: 'Fluent',        displayMode: 'native',   unlocks: 'Native-first dialogue' },
];

// ── Default State ────────────────────────────────────────────────────────────

/**
 * Default language progress state (stored in save data).
 */
export function defaultLanguageState() {
  return {
    regions: {},  // { [regionId]: { xp, rank, terms: { [termId]: TermProgress } } }
    activeRegion: null,
    settings: {
      transliterationVisible: true,
      pronunciationHints: true,
      autoAudioPlayback: false,
      microphoneEnabled: false,
      displayMode: 'dual', // 'english' | 'dual' | 'native' | 'full'
    },
  };
}

/**
 * Default per-term progress.
 */
function defaultTermProgress() {
  return {
    stage: 'unseen',
    xp: 0,
    encounters: 0,
    correctRecalls: 0,
    lastSeen: 0,
    lastReviewed: 0,
    nextReviewDue: 0,
    evidenceLog: [],  // last 10 evidence entries
  };
}

// ── State Operations ─────────────────────────────────────────────────────────

/**
 * Initialize region progress if not present.
 */
export function ensureRegion(state, regionId) {
  if (state.regions[regionId]) return state;
  return {
    ...state,
    regions: {
      ...state.regions,
      [regionId]: { xp: 0, rank: 1, terms: {} },
    },
  };
}

/**
 * Record a learning event for a term.
 *
 * @param {object} state - language progress state
 * @param {string} termId - vocabulary item id
 * @param {string} evidenceType - key from EVIDENCE_WEIGHTS
 * @param {number} now - current timestamp
 * @returns {{ state, leveledUp, newStage, xpGained, message }}
 */
export function recordEvidence(state, termId, evidenceType, now) {
  const vocab = getVocabItem(termId);
  if (!vocab) return { state, leveledUp: false, newStage: null, xpGained: 0, message: null };

  const regionId = vocab.regionId;
  let updated = ensureRegion(state, regionId);
  const region = { ...updated.regions[regionId] };
  const terms = { ...region.terms };
  const progress = terms[termId] ? { ...terms[termId] } : defaultTermProgress();

  // Add evidence XP
  const weight = EVIDENCE_WEIGHTS[evidenceType] || 1;
  const xpGained = Math.round(weight * vocab.frequencyWeight);
  progress.xp += xpGained;
  progress.encounters += 1;
  progress.lastSeen = now;

  if (evidenceType === 'recognized' || evidenceType === 'recalled' || evidenceType === 'used_in_dialogue') {
    progress.correctRecalls += 1;
  }

  // Log evidence (keep last 10)
  progress.evidenceLog = [
    ...progress.evidenceLog.slice(-9),
    { type: evidenceType, at: now, xp: xpGained },
  ];

  // Check for stage advancement
  const prevStage = progress.stage;
  const newStage = computeStage(progress.xp);
  progress.stage = newStage;
  const leveledUp = newStage !== prevStage;

  // Schedule next review (spaced repetition)
  progress.lastReviewed = now;
  progress.nextReviewDue = computeNextReview(now, newStage);

  // Update region XP
  region.xp += xpGained;
  region.rank = computeRank(region.xp);
  region.terms = { ...terms, [termId]: progress };

  updated = {
    ...updated,
    regions: { ...updated.regions, [regionId]: region },
  };

  let message = null;
  if (leveledUp) {
    message = `"${vocab.script}" (${vocab.englishGloss}) → ${MASTERY_STAGES.find((s) => s.id === newStage)?.label}!`;
  }

  return { state: updated, leveledUp, newStage, xpGained, message };
}

// ── Mastery Computation ──────────────────────────────────────────────────────

function computeStage(xp) {
  for (let i = MASTERY_STAGES.length - 1; i >= 0; i--) {
    if (xp >= MASTERY_STAGES[i].xpRequired) return MASTERY_STAGES[i].id;
  }
  return 'unseen';
}

function computeRank(regionXp) {
  for (let i = RANK_THRESHOLDS.length - 1; i >= 0; i--) {
    if (regionXp >= RANK_THRESHOLDS[i].xp) return RANK_THRESHOLDS[i].rank;
  }
  return 1;
}

// ── Spaced Repetition ────────────────────────────────────────────────────────

/**
 * Compute next review time based on mastery stage.
 * Higher mastery = longer intervals.
 */
function computeNextReview(now, stage) {
  const intervals = {
    unseen: 0,
    introduced: 60 * 1000,         // 1 minute
    familiar: 5 * 60 * 1000,       // 5 minutes
    practiced: 30 * 60 * 1000,     // 30 minutes
    reliable: 4 * 60 * 60 * 1000,  // 4 hours
    mastered: 24 * 60 * 60 * 1000, // 24 hours
  };
  return now + (intervals[stage] || 60 * 1000);
}

/**
 * Get terms due for review in a region.
 */
export function getReviewQueue(state, regionId, now, limit = 10) {
  const region = state.regions[regionId];
  if (!region) return [];

  return Object.entries(region.terms)
    .filter(([, prog]) => prog.stage !== 'unseen' && prog.stage !== 'mastered' && now >= prog.nextReviewDue)
    .sort(([, a], [, b]) => a.nextReviewDue - b.nextReviewDue)
    .slice(0, limit)
    .map(([termId, prog]) => ({
      termId,
      vocab: getVocabItem(termId),
      progress: prog,
      overdue: now - prog.nextReviewDue,
    }));
}

// ── Queries ──────────────────────────────────────────────────────────────────

/**
 * Get the display mode for a region based on player rank.
 */
export function getDisplayMode(state, regionId) {
  const region = state.regions[regionId];
  if (!region) return 'english';
  const rankInfo = RANK_THRESHOLDS.find((r) => r.rank === region.rank);
  return state.settings.displayMode !== 'dual' ? state.settings.displayMode : (rankInfo?.displayMode || 'english');
}

/**
 * Get a term's mastery stage for a player.
 */
export function getTermMastery(state, termId) {
  const vocab = getVocabItem(termId);
  if (!vocab) return 'unseen';
  const region = state.regions[vocab.regionId];
  if (!region) return 'unseen';
  return region.terms[termId]?.stage || 'unseen';
}

/**
 * Get region progress summary.
 */
export function getRegionProgress(state, regionId) {
  const region = state.regions[regionId];
  if (!region) return { xp: 0, rank: 1, label: 'Newcomer', totalTerms: 0, masteredTerms: 0, percentage: 0 };

  const vocab = getRegionVocabulary(regionId);
  const totalTerms = vocab.length;
  const masteredTerms = Object.values(region.terms).filter((t) => t.stage === 'mastered').length;
  const rankInfo = RANK_THRESHOLDS.find((r) => r.rank === region.rank) || RANK_THRESHOLDS[0];
  const nextRank = RANK_THRESHOLDS.find((r) => r.rank === region.rank + 1);

  return {
    xp: region.xp,
    rank: region.rank,
    label: rankInfo.label,
    unlocks: rankInfo.unlocks,
    totalTerms,
    masteredTerms,
    percentage: totalTerms > 0 ? Math.round((masteredTerms / totalTerms) * 100) : 0,
    xpToNextRank: nextRank ? nextRank.xp - region.xp : 0,
    nextRankLabel: nextRank?.label || 'Max',
  };
}

/**
 * Get vocabulary journal: all terms the player has encountered, with progress.
 */
export function getVocabularyJournal(state, regionId) {
  const region = state.regions[regionId];
  if (!region) return [];

  const vocab = getRegionVocabulary(regionId);
  return vocab.map((v) => {
    const prog = region.terms[v.id] || defaultTermProgress();
    return {
      ...v,
      mastery: prog.stage,
      xp: prog.xp,
      encounters: prog.encounters,
      correctRecalls: prog.correctRecalls,
      lastSeen: prog.lastSeen,
    };
  }).filter((v) => v.mastery !== 'unseen');
}

/**
 * Get terms that the player should encounter next (not yet introduced).
 */
export function getNextTermsToIntroduce(state, regionId, count = 3) {
  const region = state.regions[regionId];
  const vocab = getRegionVocabulary(regionId);

  return vocab
    .filter((v) => {
      const prog = region?.terms[v.id];
      return !prog || prog.stage === 'unseen';
    })
    .sort((a, b) => {
      // Prioritize: lower tier first, higher frequency first
      if (a.difficultyTier !== b.difficultyTier) return a.difficultyTier - b.difficultyTier;
      return b.frequencyWeight - a.frequencyWeight;
    })
    .slice(0, count);
}
