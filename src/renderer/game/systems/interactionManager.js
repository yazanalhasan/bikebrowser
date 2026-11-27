/**
 * Interaction Manager — focused interactions that stay in the dialog overlay.
 *
 * Primitive declarations (arc.md §8.1):
 * - Consults: inventory and recipe data. Repair checks a named tool.
 *   Craft uses the shared crafting system. Lessons do not read biome strings.
 * - Updates: observations (low-level log) and knowledgeState (Seen/Interacted).
 * - Scales: the same repair/craft/lesson types work in later acts.
 *
 * No scene imports.
 */

import { craft } from './craftingSystem.js';
import { saveGame } from './saveSystem.js';
import { practiceLanguageTerm } from './languageLayer.js';
import { markKnowledge } from './knowledgeState/index.js';

/**
 * @param {Phaser.Scene} scene
 * @param {object} config
 */
export function startInteraction(scene, config) {
  const {
    type = 'inspect',
    title,
    text,
    speaker = 'Zuzu',
    icon = '',
    choices = null,
    step = null,
  } = config;

  const audioMgr = scene.registry.get('audioManager');

  switch (type) {
    case 'inspect':
    case 'dialogue':
      audioMgr?.playSfx('interaction_ping');
      scene.registry.set('dialogEvent', {
        speaker,
        text: icon ? `${icon} ${title}\n\n${text}` : text,
        choices,
        step,
      });
      break;

    case 'repair':
      audioMgr?.playSfx('toolbox_open');
      runToolCheck(scene, config);
      break;

    case 'puzzle':
    case 'pace':
    case 'buoyancy':
    case 'ecology':
      audioMgr?.playSfx('interaction_ping');
      runLesson(scene, config);
      break;

    case 'race':
      audioMgr?.playSfx('interaction_ping');
      runLesson(scene, {
        ...config,
        lessonId: config.lessonId || 'pace_practiced',
        prompt: config.prompt || 'A fair ride is about steady pedals, not a secret trick.',
        choices: config.choices || [
          { label: 'Keep a steady pedal so the tires keep their grip', correct: true },
          { label: 'Lock the brakes the whole way', correct: false },
          { label: 'Take the chain off to go faster', correct: false },
        ],
        success: 'Grip comes from the tire meeting the ground. Steady pedals keep that grip.',
        knowledgeId: 'concept:friction',
      });
      break;

    case 'craft':
      audioMgr?.playSfx('toolbox_open');
      runCraft(scene, config);
      break;

    case 'language':
      audioMgr?.playSfx('interaction_ping');
      runLanguagePractice(scene, config);
      break;

    default:
      scene.registry.set('dialogEvent', {
        speaker,
        text,
        choices,
        step,
      });
  }
}

export function endInteraction(scene) {
  scene.registry.set('dialogEvent', null);
}

function persist(scene, state) {
  scene.registry.set('gameState', state);
  saveGame(state);
  return state;
}

function runToolCheck(scene, config) {
  const toolId = config.requiredItem || 'tire_lever';
  const state = scene.registry.get('gameState') || {};
  const hasTool = (state.inventory || []).includes(toolId);
  const pretty = toolId.replace(/_/g, ' ');
  if (!hasTool) {
    scene.registry.set('dialogEvent', {
      speaker: 'Zuzu',
      text: `I need a ${pretty} before I can do this repair.`,
      choices: null,
      step: null,
    });
    return;
  }
  const observation = config.lessonId || `repair_${toolId}`;
  const next = remember(state, observation, `Used ${pretty} on a repair.`);
  const withKnowledge = markKnowledge(next, `concept:tool.${toolId}`, 'interacted', 'repair');
  persist(scene, withKnowledge);
  scene.registry.set('dialogEvent', {
    speaker: 'Zuzu',
    text: config.success || `The ${pretty} does the job. I can feel the part move the way it should.`,
    choices: null,
    step: null,
  });
}

function runCraft(scene, config) {
  const state = scene.registry.get('gameState') || {};
  const recipeId = config.recipeId || 'healing_salve';
  const result = craft(recipeId, state.inventory || []);
  if (!result?.success) {
    scene.registry.set('dialogEvent', {
      speaker: 'Zuzu',
      text: result?.message || 'I do not have the ingredients for that recipe yet.',
      choices: null,
      step: null,
    });
    return;
  }
  const next = {
    ...state,
    inventory: result.inventory,
  };
  const remembered = remember(next, `crafted_${recipeId}`, result.message || `Crafted ${recipeId}.`);
  persist(scene, markKnowledge(remembered, `recipe:${recipeId}`, 'interacted', 'craft'));
  scene.registry.set('dialogEvent', {
    speaker: 'Zuzu',
    text: result.message || 'The recipe worked.',
    choices: null,
    step: null,
  });
}

function runLesson(scene, config) {
  const choices = config.choices || [];
  scene.registry.set('dialogEvent', {
    speaker: 'Zuzu',
    text: config.prompt || config.text || 'Think about how this works.',
    choices,
    step: {
      type: 'quiz',
      id: config.lessonId || 'field_lesson',
      lesson: true,
      success: config.success || 'That matches how the world works.',
      observation: config.lessonId || 'field_lesson',
      knowledgeId: config.knowledgeId || null,
    },
  });
}

function runLanguagePractice(scene, config) {
  const state = scene.registry.get('gameState') || {};
  const result = practiceLanguageTerm(state, config.termId || 'ar_fix');
  if (!result.ok) {
    scene.registry.set('dialogEvent', {
      speaker: 'Zuzu',
      text: result.message,
      choices: null,
      step: null,
    });
    return;
  }
  const withKnowledge = markKnowledge(
    result.state,
    `language.term:${result.card.id}`,
    'interacted',
    'language-practice',
  );
  persist(scene, withKnowledge);
  scene.registry.set('dialogEvent', {
    speaker: 'Zuzu',
    text: result.message,
    choices: null,
    step: null,
  });
}

function remember(state, observationId, journalLine) {
  const observations = state.observations || [];
  const journal = state.journal || [];
  return {
    ...state,
    observations: observations.includes(observationId) ? observations : [...observations, observationId],
    journal: journal.includes(journalLine) ? journal : [...journal, journalLine],
  };
}

/**
 * Field lessons are quizzes that are not quest steps. LocalSceneBase skips
 * them unless the scene calls this after a correct answer.
 */
export function completeFieldLesson(state, step) {
  if (!step?.lesson) return state;
  const remembered = remember(state, step.observation || step.id, step.success || 'Lesson learned.');
  if (!step.knowledgeId) return remembered;
  return markKnowledge(remembered, step.knowledgeId, 'understood', 'field-lesson');
}
