/**
 * Dynamic Quest Generator — creates quests from player state, failures,
 * and knowledge gaps using MCP data + AI.
 *
 * Quests are generated when:
 *   - Player repeats the same failure 2+ times
 *   - Player enters a new biome
 *   - Player unlocks a new system/knowledge
 *   - Player is missing a key resource
 *   - Player reaches a language milestone
 *
 * Generated quests use ONLY existing mechanics:
 *   step types: dialogue, forage, craft, observe, quiz, use_item
 *   items: from items.js
 *   NPCs: mrs_ramirez, mr_chen
 *
 * Two modes:
 *   DETERMINISTIC — template-based, instant, always works
 *   AI-ENHANCED — richer quest text via AI provider (async, fallback)
 */

import { FLORA_MAP } from '../../data/flora.js';
import { MATERIAL_MAP } from '../../data/materials.js';

// ── Trigger Tracking ─────────────────────────────────────────────────────────

const _failureCounts = new Map();  // causeType → count
const _seenBiomes = new Set();
const _generatedQuests = new Set(); // prevent duplicates
let _lastGeneratedAt = 0;
const GENERATION_COOLDOWN = 30000; // 30 seconds between quest generations

/**
 * Check if a dynamic quest should be generated based on current state.
 * Called from MCP event handlers.
 *
 * @param {string} trigger - 'failure' | 'biome' | 'knowledge' | 'resource' | 'language'
 * @param {object} mcpState - full MCP state
 * @param {object} [eventPayload] - the event that triggered this
 * @returns {{ shouldGenerate: boolean, questType: string, context: object } | null}
 */
export function checkTrigger(trigger, mcpState, eventPayload = {}) {
  const now = Date.now();
  if (now - _lastGeneratedAt < GENERATION_COOLDOWN) return null;

  switch (trigger) {
    case 'failure': {
      const cause = eventPayload.cause || eventPayload.causeType || 'unknown';
      const count = (_failureCounts.get(cause) || 0) + 1;
      _failureCounts.set(cause, count);
      if (count >= 2 && !_generatedQuests.has(`fix_${cause}`)) {
        return { shouldGenerate: true, questType: 'repair', context: { cause, count, ...eventPayload } };
      }
      return null;
    }

    case 'biome': {
      const biome = mcpState.environment?.biome;
      if (biome && !_seenBiomes.has(biome)) {
        _seenBiomes.add(biome);
        if (!_generatedQuests.has(`explore_${biome}`)) {
          return { shouldGenerate: true, questType: 'discovery', context: { biome } };
        }
      }
      return null;
    }

    case 'knowledge': {
      const conceptId = eventPayload.conceptId;
      if (conceptId && !_generatedQuests.has(`learn_${conceptId}`)) {
        return { shouldGenerate: true, questType: 'optimization', context: { conceptId, ...eventPayload } };
      }
      return null;
    }

    case 'resource': {
      // Check if player lacks a key resource for their current quest/build
      const inventory = mcpState.quest?.inventory || [];
      if (mcpState.player?.health < 0.3 && !_generatedQuests.has('survival_heal')) {
        return { shouldGenerate: true, questType: 'survival', context: { need: 'healing' } };
      }
      if (mcpState.player?.hydration < 0.25 && !_generatedQuests.has('survival_water')) {
        return { shouldGenerate: true, questType: 'survival', context: { need: 'water' } };
      }
      return null;
    }

    case 'language': {
      const rank = eventPayload.rank;
      if (rank && rank >= 2 && !_generatedQuests.has(`language_${rank}`)) {
        return { shouldGenerate: true, questType: 'language', context: { rank, ...eventPayload } };
      }
      return null;
    }

    default:
      return null;
  }
}

// ── Deterministic Quest Templates ────────────────────────────────────────────

/**
 * Generate a quest from templates. Always works, no AI needed.
 *
 * @param {string} questType - 'repair' | 'optimization' | 'discovery' | 'survival' | 'language'
 * @param {object} context - trigger-specific data
 * @param {object} mcpState - full game state
 * @returns {object} quest definition compatible with quests.js schema
 */
export function generateDeterministicQuest(questType, context, mcpState) {
  _lastGeneratedAt = Date.now();
  const questId = `dynamic_${questType}_${Date.now()}`;

  switch (questType) {
    case 'repair':
      return generateRepairQuest(questId, context, mcpState);
    case 'optimization':
      return generateOptimizationQuest(questId, context, mcpState);
    case 'discovery':
      return generateDiscoveryQuest(questId, context, mcpState);
    case 'survival':
      return generateSurvivalQuest(questId, context, mcpState);
    case 'language':
      return generateLanguageQuest(questId, context, mcpState);
    default:
      return generateDiscoveryQuest(questId, context, mcpState);
  }
}

function generateRepairQuest(questId, context, mcpState) {
  const cause = context.cause || 'overload';
  const failCount = context.count || 2;

  const causeInfo = {
    overload: {
      title: 'Reinforce the Weak Point',
      objective: 'Your structure failed from overload. Build a stronger version.',
      quiz: { q: 'What happens when force exceeds material strength?', a: 'The material deforms permanently or breaks' },
      fix: 'Use a stronger material or increase the cross-section.',
    },
    fatigue: {
      title: 'Beat the Fatigue',
      objective: 'Repeated stress caused failure. Find a fatigue-resistant solution.',
      quiz: { q: 'What causes fatigue failure?', a: 'Microscopic cracks grow with each stress cycle until the material snaps' },
      fix: 'Use a material with higher fatigue resistance, or add damping.',
    },
    thermal: {
      title: 'Survive the Heat',
      objective: 'Heat weakened your materials. Find a heat-resistant design.',
      quiz: { q: 'Why does heat weaken materials?', a: 'Heat gives atoms energy to move, weakening the bonds that hold the structure together' },
      fix: 'Use materials with higher melting points or add thermal coating.',
    },
    resonance: {
      title: 'Stop the Vibration',
      objective: 'Vibrations amplified and destroyed your build. Solve the resonance problem.',
      quiz: { q: 'What is resonance?', a: 'When forcing frequency matches natural frequency, vibration amplitude grows dangerously' },
      fix: 'Change mass distribution or add damping material.',
    },
  };

  const info = causeInfo[cause] || causeInfo.overload;
  _generatedQuests.add(`fix_${cause}`);

  return {
    id: questId,
    title: info.title,
    description: `${info.objective} (Failed ${failCount} times)`,
    giver: 'mr_chen',
    category: 'dynamic',
    dynamic: true,
    steps: [
      { id: 'explain', type: 'dialogue', text: `Zuzu, your build failed ${failCount} times from ${cause}. Let me explain why. ${info.fix}` },
      { id: 'quiz', type: 'quiz', text: info.quiz.q, choices: [
        { label: info.quiz.a, correct: true },
        { label: 'The material was too expensive', correct: false },
        { label: 'Random chance — nothing can be done', correct: false },
      ]},
      { id: 'complete', type: 'complete', text: `You understand ${cause} failure now! Apply this knowledge to your next build.` },
    ],
    reward: { items: [], xp: 40, zuzubucks: 20, reputation: 10 },
    learningGoal: `Understand ${cause} failure and how to prevent it.`,
    systemsUsed: ['materials', 'simulation'],
  };
}

function generateOptimizationQuest(questId, context, mcpState) {
  const concept = context.conceptId || 'general';
  _generatedQuests.add(`learn_${concept}`);

  return {
    id: questId,
    title: 'Apply New Knowledge',
    description: `You unlocked "${concept}". Use this knowledge to improve your builds.`,
    giver: 'mr_chen',
    category: 'dynamic',
    dynamic: true,
    steps: [
      { id: 'explain', type: 'dialogue', text: `Zuzu, you just learned about ${concept.replace(/_/g, ' ')}. Let's put it to use!` },
      { id: 'observe', type: 'observe', text: `Find an opportunity to apply ${concept.replace(/_/g, ' ')} in the world.`, requiredObservation: 'knowledge_applied', hint: 'Look for materials, structures, or plants where this concept matters.' },
      { id: 'complete', type: 'complete', text: `Great! You applied ${concept.replace(/_/g, ' ')} successfully.` },
    ],
    reward: { items: [], xp: 30, zuzubucks: 15, reputation: 8 },
    learningGoal: `Practical application of ${concept.replace(/_/g, ' ')}.`,
    systemsUsed: ['knowledge'],
  };
}

function generateDiscoveryQuest(questId, context, mcpState) {
  const biome = context.biome || 'desert_scrub';
  _generatedQuests.add(`explore_${biome}`);

  const biomeNames = {
    desert_scrub: 'Desert Scrub',
    sonoran_desert: 'Sonoran Desert',
    chaparral: 'Chaparral',
    riparian: 'Riparian Zone',
    woodland: 'Mountain Woodland',
  };

  const biomePlants = Object.values(FLORA_MAP)
    .filter(() => true) // all plants are available
    .slice(0, 3)
    .map((f) => f.label);

  return {
    id: questId,
    title: `Explore the ${biomeNames[biome] || biome}`,
    description: `You entered a new biome. Discover what grows here and what survives.`,
    giver: 'mrs_ramirez',
    category: 'dynamic',
    dynamic: true,
    steps: [
      { id: 'explain', type: 'dialogue', text: `Zuzu, this is ${biomeNames[biome] || biome} territory! Different plants grow in different conditions. Let's see what we can find.` },
      { id: 'observe', type: 'observe', text: `Explore and find plants in this biome. Look for ${biomePlants.join(', ')}.`, requiredObservation: 'biome_explored', hint: 'Walk around and observe the ecology.' },
      { id: 'quiz', type: 'quiz', text: 'Why do different plants grow in different places?', choices: [
        { label: 'Each species needs specific elevation, moisture, and temperature conditions', correct: true },
        { label: 'Plants are placed randomly by the game', correct: false },
        { label: 'All plants can grow anywhere', correct: false },
      ]},
      { id: 'complete', type: 'complete', text: `You explored the ${biomeNames[biome] || biome}! Each biome has its own ecology — plants adapted to specific conditions.` },
    ],
    reward: { items: [], xp: 35, zuzubucks: 18, reputation: 10 },
    learningGoal: 'Understand biome-specific ecology.',
    systemsUsed: ['ecology'],
  };
}

function generateSurvivalQuest(questId, context, mcpState) {
  const need = context.need || 'healing';
  _generatedQuests.add(`survival_${need}`);

  if (need === 'water') {
    return {
      id: questId,
      title: 'Find Water Now',
      description: 'You are dangerously dehydrated. Find a water source or hydrating plant immediately.',
      giver: 'mrs_ramirez',
      category: 'dynamic',
      dynamic: true,
      steps: [
        { id: 'warn', type: 'dialogue', text: 'Zuzu! You need water NOW. Prickly pear fruit has water inside. Find one quickly!' },
        { id: 'forage', type: 'forage', text: 'Find and harvest a prickly pear fruit for hydration.', requiredItem: 'prickly_pear_fruit', hint: 'Prickly pear grows in dry, low-elevation areas.' },
        { id: 'complete', type: 'complete', text: 'You found water from a plant! In the desert, knowing which plants hold water saves lives.' },
      ],
      reward: { items: [], xp: 25, zuzubucks: 12, reputation: 5 },
      learningGoal: 'Emergency hydration from desert plants.',
      systemsUsed: ['ecology', 'foraging'],
    };
  }

  return {
    id: questId,
    title: 'Heal Yourself',
    description: 'Your health is critical. Craft or find something to heal.',
    giver: 'mrs_ramirez',
    category: 'dynamic',
    dynamic: true,
    steps: [
      { id: 'warn', type: 'dialogue', text: 'Zuzu, you\'re hurt! Creosote has anti-inflammatory properties. Find some and make a salve.' },
      { id: 'forage', type: 'forage', text: 'Find creosote leaves for healing.', requiredItem: 'creosote_leaves', hint: 'Creosote bushes grow in dry desert areas.' },
      { id: 'complete', type: 'complete', text: 'Good — creosote resin fights inflammation. But remember: too much is toxic to the liver!' },
    ],
    reward: { items: [], xp: 25, zuzubucks: 12, reputation: 5 },
    learningGoal: 'Emergency healing from desert plants.',
    systemsUsed: ['ecology', 'foraging', 'pharmacology'],
  };
}

function generateLanguageQuest(questId, context, mcpState) {
  const rank = context.rank || 2;
  const regionId = context.regionId || 'levant';
  _generatedQuests.add(`language_${rank}`);

  return {
    id: questId,
    title: `Language Rank ${rank}: Practice`,
    description: `You reached language rank ${rank}! Test your vocabulary with an NPC.`,
    giver: 'mrs_ramirez',
    category: 'dynamic',
    dynamic: true,
    steps: [
      { id: 'explain', type: 'dialogue', text: `Zuzu, your vocabulary is growing! Let's see if you can recognize some words now.` },
      { id: 'observe', type: 'observe', text: 'Talk to an NPC and try using a local term correctly.', requiredObservation: 'language_used', hint: 'Greet an NPC or ask about a plant using a word you learned.' },
      { id: 'complete', type: 'complete', text: `Great communication! Using local language builds trust and unlocks deeper knowledge.` },
    ],
    reward: { items: [], xp: 30, zuzubucks: 15, reputation: 10 },
    learningGoal: 'Practice regional vocabulary in context.',
    systemsUsed: ['language'],
  };
}

// ── AI-Enhanced Quest Prompt ─────────────────────────────────────────────────

/**
 * Build a prompt for AI-enhanced quest generation.
 * The AI enriches the deterministic template with better text.
 */
export function buildQuestGenerationPrompt(questType, context, mcpState) {
  const p = mcpState.player || {};
  const env = mcpState.environment || {};
  const quest = mcpState.quest || {};

  return `You are a game designer creating a short educational quest for a children's desert ecology game.

TRIGGER: ${questType}
CONTEXT: ${JSON.stringify(context).slice(0, 200)}

PLAYER STATE:
- health: ${p.health != null ? Math.round(p.health * 100) + '%' : 'unknown'}
- hydration: ${p.hydration != null ? Math.round(p.hydration * 100) + '%' : 'unknown'}
- completed quests: ${quest.completedCount || 0}
- biome: ${env.biome || 'desert'}

RULES:
- Quest must use ONLY existing mechanics: dialogue, forage, craft, observe, quiz, use_item
- Quest must be completable immediately (no new systems)
- Quest must teach one specific concept
- Max 4 steps
- Age-appropriate for children

Return ONLY valid JSON:
{"title":"short quest title","objective":"1 sentence goal","steps":[{"type":"dialogue|forage|quiz|observe","text":"step instruction"}],"systemsUsed":["ecology"],"reward":"what player earns","learningGoal":"what player learns"}

No narrative padding. No new mechanics. Actionable and educational.`;
}

// ── Reset (for new game) ─────────────────────────────────────────────────────

export function resetGeneratorState() {
  _failureCounts.clear();
  _seenBiomes.clear();
  _generatedQuests.clear();
  _lastGeneratedAt = 0;
}
