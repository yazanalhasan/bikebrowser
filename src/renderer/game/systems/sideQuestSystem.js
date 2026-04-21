/**
 * Side Quest System — manages optional quests from sub-scenes.
 *
 * Side quests:
 *   - Never block main progression
 *   - Offer unique rewards (materials, knowledge, skills)
 *   - Stack naturally with gameplay
 *   - Persist across sessions via gameState.sideQuests
 *
 * Integration: Sub-scenes register their quests on create().
 * GameContainer reads sideQuests from gameState for HUD display.
 */

// ── Side Quest Definitions ──────────────────────────────────────────────────

const SIDE_QUESTS = {
  // Desert Foraging
  collect_desert_fibers: {
    id: 'collect_desert_fibers',
    title: 'Desert Fibers',
    description: 'Collect 3 types of plant fibers from the Sonoran desert.',
    location: 'desert_foraging',
    optional: true,
    steps: [
      { id: 'gather_yucca', type: 'forage', text: 'Find and harvest yucca fibers.', target: 'yucca_fiber' },
      { id: 'gather_agave', type: 'forage', text: 'Find and harvest agave fibers.', target: 'agave_fiber' },
      { id: 'gather_jojoba', type: 'forage', text: 'Collect jojoba plant material.', target: 'jojoba_extract' },
      { id: 'done', type: 'complete', text: 'You gathered rare desert fibers! These can be used in crafting.' },
    ],
    reward: { items: ['desert_fiber_bundle'], zuzubucks: 30, reputation: 10, knowledge: 'ethnobotany_basics' },
    learningGoal: 'Learn about desert plant fibers and their traditional uses.',
  },

  water_management_101: {
    id: 'water_management_101',
    title: 'Water Wise',
    description: 'Manage your water supply across a desert foraging run.',
    location: 'desert_foraging',
    optional: true,
    steps: [
      { id: 'check_supply', type: 'dialogue', text: 'Check your water bottle. How much do you have?' },
      { id: 'calculate', type: 'quiz', text: 'If you have 2 liters and drink 250ml per hour, how many hours can you last?',
        choices: [
          { label: '8 hours', correct: true },
          { label: '6 hours', correct: false },
          { label: '10 hours', correct: false },
          { label: '4 hours', correct: false },
        ],
        explanation: '2000ml / 250ml = 8 hours. Always plan your water!',
      },
      { id: 'done', type: 'complete', text: 'Water management is survival skill #1 in the desert.' },
    ],
    reward: { items: ['water_filter'], zuzubucks: 20, reputation: 5 },
    learningGoal: 'Division and resource management in desert survival.',
  },

  // Copper Mine
  collect_copper_samples: {
    id: 'collect_copper_samples',
    title: 'Copper Prospector',
    description: 'Collect copper ore samples from different mine levels.',
    location: 'copper_mine',
    optional: true,
    steps: [
      { id: 'find_surface', type: 'forage', text: 'Collect surface copper ore from the mine entrance.', target: 'surface_copper' },
      { id: 'find_deep', type: 'forage', text: 'Mine deeper copper from the main shaft.', target: 'deep_copper' },
      { id: 'test_conductivity', type: 'quiz',
        text: 'Copper conducts electricity well because its electrons move freely. Which material conducts BETTER than copper?',
        choices: [
          { label: 'Silver', correct: true },
          { label: 'Iron', correct: false },
          { label: 'Aluminum', correct: false },
          { label: 'Rubber', correct: false },
        ],
        explanation: 'Silver has the highest electrical conductivity, but copper is much cheaper!',
      },
      { id: 'done', type: 'complete', text: 'Your copper samples can be refined into wiring for battery systems!' },
    ],
    reward: { items: ['copper_ore_refined', 'wire_spool'], zuzubucks: 40, reputation: 15, knowledge: 'conductivity_basics' },
    learningGoal: 'Materials science — conductivity and why copper is used in electronics.',
  },

  mine_stability_check: {
    id: 'mine_stability_check',
    title: 'Structural Inspector',
    description: 'Check the mine supports and learn about structural physics.',
    location: 'copper_mine',
    optional: true,
    steps: [
      { id: 'inspect_beam', type: 'inspect', text: 'Examine the wooden support beam. Does it look safe?' },
      { id: 'calculate_load', type: 'quiz',
        text: 'A support beam holds 500 kg. The rock above weighs 450 kg. What percentage of capacity is being used?',
        choices: [
          { label: '90%', correct: true },
          { label: '50%', correct: false },
          { label: '110%', correct: false },
          { label: '45%', correct: false },
        ],
        explanation: '450 / 500 = 0.9 = 90%. That\'s close to the limit — be careful!',
      },
      { id: 'done', type: 'complete', text: 'Understanding load capacity keeps miners (and bikers) safe.' },
    ],
    reward: { items: ['safety_helmet'], zuzubucks: 25, reputation: 10, knowledge: 'structural_basics' },
    learningGoal: 'Percentages applied to structural load and safety margins.',
  },

  // Salt River
  river_ecosystem_survey: {
    id: 'river_ecosystem_survey',
    title: 'Ecosystem Survey',
    description: 'Study the Salt River ecosystem and collect biological samples.',
    location: 'salt_river',
    optional: true,
    steps: [
      { id: 'observe_fish', type: 'observe', text: 'Watch the fish in the shallow pool. What patterns do you see?' },
      { id: 'collect_algae', type: 'forage', text: 'Collect an algae sample from the riverbank.', target: 'algae_sample' },
      { id: 'water_quiz', type: 'quiz',
        text: 'If the river flows at 3 meters per second and the fish swims upstream at 1 meter per second, how fast is the fish moving relative to the ground?',
        choices: [
          { label: '2 m/s upstream', correct: true },
          { label: '4 m/s upstream', correct: false },
          { label: '3 m/s downstream', correct: false },
          { label: '1 m/s upstream', correct: false },
        ],
        explanation: '3 - 1 = 2 m/s. The fish swims against the current, so subtract its speed from the river speed.',
      },
      { id: 'done', type: 'complete', text: 'Your biological samples could help with crafting organic compounds!' },
    ],
    reward: { items: ['organic_compound', 'microbial_sample'], zuzubucks: 35, reputation: 15, knowledge: 'river_ecology' },
    learningGoal: 'Relative velocity and river ecosystem observation.',
  },

  balance_the_flow: {
    id: 'balance_the_flow',
    title: 'Flow Controller',
    description: 'Balance the irrigation channels to water desert crops.',
    location: 'salt_river',
    optional: true,
    steps: [
      { id: 'inspect_channels', type: 'inspect', text: 'Look at the three irrigation channels. One is blocked.' },
      { id: 'ratio_quiz', type: 'quiz',
        text: 'Channel A gets 2/5 of the water, Channel B gets 1/5. What fraction goes to Channel C?',
        choices: [
          { label: '2/5', correct: true },
          { label: '3/5', correct: false },
          { label: '1/5', correct: false },
          { label: '4/5', correct: false },
        ],
        explanation: '2/5 + 1/5 = 3/5 used. 5/5 - 3/5 = 2/5 remains for Channel C.',
      },
      { id: 'done', type: 'complete', text: 'Balanced water distribution keeps the ecosystem healthy.' },
    ],
    reward: { items: ['irrigation_valve'], zuzubucks: 30, reputation: 10, knowledge: 'fluid_distribution' },
    learningGoal: 'Fraction operations applied to real water management.',
  },
};

// ── Public API ──────────────────────────────────────────────────────────────

/** Get all side quests for a given location. */
export function getSideQuestsForLocation(locationId) {
  return Object.values(SIDE_QUESTS).filter(q => q.location === locationId);
}

/** Get a specific side quest by ID. */
export function getSideQuest(questId) {
  return SIDE_QUESTS[questId] || null;
}

/**
 * Start a side quest. Returns updated state.
 * @param {object} state - gameState
 * @param {string} questId
 * @returns {{ state, ok, message }}
 */
export function startSideQuest(state, questId) {
  const quest = SIDE_QUESTS[questId];
  if (!quest) return { state, ok: false, message: 'Quest not found.' };

  const sideQuests = state.sideQuests || {};
  if (sideQuests[questId]?.completed) {
    return { state, ok: false, message: 'Already completed this quest.' };
  }

  const updated = {
    ...state,
    sideQuests: {
      ...sideQuests,
      [questId]: { id: questId, stepIndex: 0, completed: false },
    },
  };
  return { state: updated, ok: true, message: `Side quest started: ${quest.title}` };
}

/**
 * Get the current step of an active side quest.
 * @param {object} state
 * @param {string} questId
 * @returns {object|null} step object
 */
export function getCurrentSideStep(state, questId) {
  const progress = state.sideQuests?.[questId];
  if (!progress || progress.completed) return null;
  const quest = SIDE_QUESTS[questId];
  if (!quest) return null;
  return quest.steps[progress.stepIndex] || null;
}

/**
 * Advance a side quest step. Returns updated state + result.
 * @param {object} state
 * @param {string} questId
 * @param {number} [choiceIndex] - for quiz steps
 * @returns {{ state, ok, message, completed }}
 */
export function advanceSideQuest(state, questId, choiceIndex) {
  const quest = SIDE_QUESTS[questId];
  if (!quest) return { state, ok: false, message: 'Quest not found.', completed: false };

  const progress = state.sideQuests?.[questId];
  if (!progress || progress.completed) return { state, ok: false, message: 'Quest not active.', completed: false };

  const step = quest.steps[progress.stepIndex];
  if (!step) return { state, ok: false, message: 'No current step.', completed: false };

  // Quiz validation
  if (step.type === 'quiz') {
    if (choiceIndex == null) return { state, ok: false, message: 'Pick an answer first.' };
    const choice = step.choices?.[choiceIndex];
    if (!choice?.correct) return { state, ok: false, message: 'Not quite — try again!', completed: false };
  }

  // Forage validation
  if (step.type === 'forage' && step.target) {
    if (!state.inventory?.includes(step.target)) {
      return { state, ok: false, message: `You need to find: ${step.target}`, completed: false };
    }
  }

  // Advance to next step
  const nextIndex = progress.stepIndex + 1;
  const isComplete = nextIndex >= quest.steps.length;

  let updated = {
    ...state,
    sideQuests: {
      ...state.sideQuests,
      [questId]: { ...progress, stepIndex: nextIndex, completed: isComplete },
    },
  };

  // Apply rewards on completion
  if (isComplete && quest.reward) {
    const r = quest.reward;
    if (r.items) {
      updated = { ...updated, inventory: [...(updated.inventory || []), ...r.items] };
    }
    if (r.zuzubucks) {
      updated = { ...updated, zuzubucks: (updated.zuzubucks || 0) + r.zuzubucks };
    }
    if (r.reputation) {
      updated = { ...updated, reputation: (updated.reputation || 0) + r.reputation };
    }
    if (r.knowledge) {
      const knowledge = updated.knowledge || { unlocked: [], discoveries: [] };
      if (!knowledge.unlocked.includes(r.knowledge)) {
        updated = { ...updated, knowledge: { ...knowledge, unlocked: [...knowledge.unlocked, r.knowledge] } };
      }
    }
  }

  return {
    state: updated,
    ok: true,
    message: isComplete ? `Quest complete: ${quest.title}!` : quest.steps[nextIndex]?.text || 'Continue...',
    completed: isComplete,
  };
}

/** Get completed side quests count. */
export function getCompletedSideQuestCount(state) {
  if (!state.sideQuests) return 0;
  return Object.values(state.sideQuests).filter(q => q.completed).length;
}

/** Get all side quests with status for a location. */
export function getSideQuestStatus(locationId, state) {
  return getSideQuestsForLocation(locationId).map(quest => {
    const progress = state.sideQuests?.[quest.id];
    return {
      ...quest,
      started: !!progress,
      completed: progress?.completed || false,
      stepIndex: progress?.stepIndex || 0,
      totalSteps: quest.steps.length,
    };
  });
}
