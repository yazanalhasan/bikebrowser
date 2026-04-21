/**
 * Interaction Manager — focused interaction system for micro-layer gameplay.
 *
 * Handles overlay/modal-style interactions that pause the parent scene
 * and render a focused experience:
 *   - Bike repair bench (step-by-step repair with tools)
 *   - NPC dialogue with choices
 *   - Item pickup / inspection
 *   - Puzzle interaction
 *   - Race or movement challenge
 *
 * Architecture:
 *   The interaction manager works through the React dialog overlay
 *   (GameContainer.jsx already renders dialogs via registry events).
 *   For more complex interactions, it can launch a Phaser overlay scene.
 *
 * Usage from a local scene:
 *   import { startInteraction } from '../systems/interactionManager.js';
 *   startInteraction(this, {
 *     type: 'inspect',
 *     title: 'Workbench',
 *     text: 'Your trusty workbench...',
 *     icon: '🔧',
 *   });
 */

/**
 * Start a focused interaction.
 *
 * For simple interactions (inspect, dialogue), this uses the existing
 * React dialog overlay via registry. For complex interactions (repair,
 * puzzle, combat), this will launch overlay scenes in the future.
 *
 * @param {Phaser.Scene} scene — the parent scene
 * @param {object} config
 * @param {string} config.type — 'inspect' | 'dialogue' | 'repair' | 'puzzle' | 'race' | 'craft'
 * @param {string} config.title — interaction title
 * @param {string} config.text — description/dialog text
 * @param {string} [config.speaker='Zuzu'] — who is speaking
 * @param {string} [config.icon] — emoji icon
 * @param {Array} [config.choices] — quiz/dialogue choices
 * @param {object} [config.step] — quest step reference
 * @param {function} [config.onComplete] — called when interaction ends
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
    onComplete = null,
  } = config;

  const audioMgr = scene.registry.get('audioManager');

  switch (type) {
    case 'inspect':
    case 'dialogue':
      // Simple: use the React dialog overlay
      audioMgr?.playSfx('interaction_ping');
      scene.registry.set('dialogEvent', {
        speaker,
        text: icon ? `${icon} ${title}\n\n${text}` : text,
        choices,
        step,
      });
      break;

    case 'repair':
      // Future: launch repair overlay scene
      audioMgr?.playSfx('toolbox_open');
      scene.registry.set('dialogEvent', {
        speaker: 'Zuzu',
        text: `🔧 ${title}\n\n${text}\n\n(Detailed repair mini-game coming soon!)`,
        choices: null,
        step: null,
      });
      break;

    case 'puzzle':
      // Future: launch puzzle overlay scene
      audioMgr?.playSfx('interaction_ping');
      scene.registry.set('dialogEvent', {
        speaker: 'Zuzu',
        text: `🧩 ${title}\n\n${text}\n\n(Puzzle interaction coming soon!)`,
        choices: null,
        step: null,
      });
      break;

    case 'race':
      // Future: launch race/movement challenge
      audioMgr?.playSfx('interaction_ping');
      scene.registry.set('dialogEvent', {
        speaker: 'Zuzu',
        text: `🏁 ${title}\n\n${text}\n\n(Race challenge coming soon!)`,
        choices: null,
        step: null,
      });
      break;

    case 'craft':
      // Future: launch crafting/upgrade overlay
      audioMgr?.playSfx('interaction_ping');
      scene.registry.set('dialogEvent', {
        speaker: 'Zuzu',
        text: `⚒️ ${title}\n\n${text}\n\n(Crafting system coming soon!)`,
        choices: null,
        step: null,
      });
      break;

    default:
      // Fallback to simple dialog
      scene.registry.set('dialogEvent', {
        speaker,
        text,
        choices,
        step,
      });
  }
}

/**
 * Close the current interaction.
 * @param {Phaser.Scene} scene
 */
export function endInteraction(scene) {
  scene.registry.set('dialogEvent', null);
}
