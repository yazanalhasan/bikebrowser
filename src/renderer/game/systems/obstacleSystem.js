/**
 * Obstacle System — Zelda-style progression gates integrated into scenes.
 *
 * Flow per obstacle:
 *   1. Player discovers obstacle (visual indicator in scene)
 *   2. Player tries to cross/interact → FAILS (damage or bounce-back)
 *   3. After N failures, MCP AI hints at the solution system
 *   4. Player learns the system (quest, crafting, foraging, NPC)
 *   5. Player returns with the capability and SUCCEEDS
 *   6. Obstacle removed/bypassed permanently (saved to state)
 *
 * The key design: NO instructions upfront. Player must fail first.
 * AI only guides AFTER failure, and only after a delay.
 *
 * Integrates with:
 *   - LocalSceneBase (scene spawning)
 *   - MCP (event emission for AI hints)
 *   - Save state (solved obstacles persist)
 *   - Player stats (damage from hazards)
 */

import { getSceneObstacles, checkObstacleCondition } from '../data/obstacles.js';
import { saveGame } from './saveSystem.js';

// ── Per-session failure tracking (resets on app restart) ─────────────────────
const _failureCounts = new Map();

/**
 * Spawn all obstacles and puzzles for a scene.
 * Called from LocalSceneBase.create() after createWorld().
 *
 * @param {Phaser.Scene} scene - the scene instance
 * @returns {{ obstacles: object[], puzzles: object[] }}
 */
export function spawnObstacles(scene) {
  const sceneKey = scene.getSceneKey?.() || scene.scene?.key || '';
  const state = scene.registry.get('gameState') || {};
  const solvedIds = new Set(state.solvedObstacles || []);
  const data = getSceneObstacles(sceneKey);
  const spawned = { obstacles: [], puzzles: [] };

  // Spawn obstacles
  for (const obs of data.obstacles || []) {
    if (solvedIds.has(obs.id)) continue; // already solved

    const check = checkObstacleCondition(obs, state);

    if (obs.type === 'barrier') {
      // Physical wall — blocks until condition met
      if (!check.passed) {
        const wall = scene.addVisibleWall(obs.x, obs.y, obs.width, obs.height, 0xb45309, 0x92400e);
        wall._obstacleId = obs.id;

        // Label
        scene.add.text(obs.x, obs.y - obs.height / 2 - 16, `${obs.icon} ${obs.label}`, {
          fontSize: '11px', fontFamily: 'sans-serif', color: '#92400e',
          fontStyle: 'bold', stroke: '#fef3c7', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(5);

        spawned.obstacles.push({ def: obs, wall, solved: false });
      }
      // If passed, don't spawn the wall — path is open
    }

    if (obs.type === 'hazard') {
      // Damage zone — hurts player on contact, passable with protection
      const zone = scene.add.rectangle(obs.x, obs.y, obs.width, obs.height, 0xff4444, 0.15);
      zone.setDepth(1);
      scene.physics.add.existing(zone, true);

      // Pulsing effect
      scene.tweens.add({
        targets: zone,
        alpha: { from: 0.1, to: 0.25 },
        duration: 800,
        yoyo: true,
        repeat: -1,
      });

      // Label
      scene.add.text(obs.x, obs.y - obs.height / 2 - 14, `${obs.icon} ${obs.label}`, {
        fontSize: '10px', fontFamily: 'sans-serif', color: '#dc2626',
        fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(5);

      // Overlap detection
      scene.physics.add.overlap(scene.player.sprite, zone, () => {
        _handleHazardContact(scene, obs, state);
      });

      spawned.obstacles.push({ def: obs, zone, solved: check.passed });
    }

    if (obs.type === 'gate') {
      // Locked gate — interactable, opens with condition
      const interactable = scene.addInteractable({
        x: obs.x,
        y: obs.y,
        label: obs.label,
        icon: obs.icon,
        radius: 70,
        onInteract: () => _handleGateInteract(scene, obs),
      });
      spawned.obstacles.push({ def: obs, interactable, solved: check.passed });
    }
  }

  // Spawn puzzles (interactable objects)
  for (const puzzle of data.puzzles || []) {
    if (solvedIds.has(puzzle.id)) continue;

    const interactable = scene.addInteractable({
      x: puzzle.x,
      y: puzzle.y,
      label: puzzle.label,
      icon: puzzle.icon,
      radius: 60,
      onInteract: () => _handlePuzzleInteract(scene, puzzle),
    });

    spawned.puzzles.push({ def: puzzle, interactable, solved: false });
  }

  return spawned;
}

// ── Hazard Contact Handler ───────────────────────────────────────────────────

let _lastHazardDamage = 0;

function _handleHazardContact(scene, obstacle, state) {
  const now = Date.now();
  if (now - _lastHazardDamage < (obstacle.damage?.interval || 500)) return;
  _lastHazardDamage = now;

  // Check if player has the protection
  const currentState = scene.registry.get('gameState') || {};
  const check = checkObstacleCondition(obstacle, currentState);

  if (check.passed) {
    // Player has protection — no damage, show success once
    if (!_failureCounts.has(`success_${obstacle.id}`)) {
      _failureCounts.set(`success_${obstacle.id}`, true);
      scene.registry.set('dialogEvent', {
        speaker: 'System',
        text: obstacle.successMessage,
        choices: null, step: null,
      });
      _markSolved(scene, obstacle.id);
    }
    return;
  }

  // Player does NOT have protection — take damage
  const count = (_failureCounts.get(obstacle.id) || 0) + 1;
  _failureCounts.set(obstacle.id, count);

  // Visual feedback — flash red
  scene.cameras.main.flash(200, 255, 100, 100, false);

  // Show fail message on first contact
  if (count === 1) {
    scene.registry.set('dialogEvent', {
      speaker: 'System',
      text: obstacle.failMessage,
      choices: null, step: null,
    });
  }

  // After N failures, trigger MCP hint (AI guides AFTER failure, not before)
  if (count === (obstacle.hintDelay || 2)) {
    const mcp = scene.registry.get('mcp');
    if (mcp) {
      mcp.emit('OBSTACLE_FAILED_REPEATEDLY', {
        obstacleId: obstacle.id,
        obstacleLabel: obstacle.label,
        failCount: count,
        learnSystem: obstacle.learnSystem,
        hint: obstacle.passCondition?.message || 'Explore and learn more.',
      });
    }
  }
}

// ── Gate Interaction Handler ─────────────────────────────────────────────────

function _handleGateInteract(scene, obstacle) {
  const state = scene.registry.get('gameState') || {};
  const check = checkObstacleCondition(obstacle, state);

  if (check.passed) {
    scene.registry.set('dialogEvent', {
      speaker: 'System',
      text: obstacle.successMessage,
      choices: null, step: null,
    });
    _markSolved(scene, obstacle.id);
  } else {
    const count = (_failureCounts.get(obstacle.id) || 0) + 1;
    _failureCounts.set(obstacle.id, count);

    scene.registry.set('dialogEvent', {
      speaker: 'System',
      text: obstacle.failMessage,
      choices: null, step: null,
    });

    if (count >= (obstacle.hintDelay || 1)) {
      const mcp = scene.registry.get('mcp');
      if (mcp) {
        mcp.emit('OBSTACLE_FAILED_REPEATEDLY', {
          obstacleId: obstacle.id,
          obstacleLabel: obstacle.label,
          failCount: count,
          learnSystem: obstacle.learnSystem,
          hint: check.reason,
        });
      }
    }
  }
}

// ── Puzzle Interaction Handler ────────────────────────────────────────────────

function _handlePuzzleInteract(scene, puzzle) {
  const state = scene.registry.get('gameState') || {};
  const check = checkObstacleCondition(puzzle, state);

  if (check.passed) {
    scene.registry.set('dialogEvent', {
      speaker: 'System',
      text: puzzle.successMessage,
      choices: null, step: null,
    });
    _markSolved(scene, puzzle.id);

    // Grant rewards
    if (puzzle.reward) {
      const updated = { ...state };
      if (puzzle.reward.xp) updated.reputation = (updated.reputation || 0) + (puzzle.reward.reputation || 0);
      if (puzzle.reward.zuzubucks) updated.zuzubucks = (updated.zuzubucks || 0) + puzzle.reward.zuzubucks;
      scene.registry.set('gameState', updated);

      saveGame(updated);
    }
  } else {
    const count = (_failureCounts.get(puzzle.id) || 0) + 1;
    _failureCounts.set(puzzle.id, count);

    scene.registry.set('dialogEvent', {
      speaker: 'System',
      text: puzzle.failMessage,
      choices: null, step: null,
    });

    // Hint after failures
    if (count >= 2) {
      const mcp = scene.registry.get('mcp');
      if (mcp) {
        mcp.emit('OBSTACLE_FAILED_REPEATEDLY', {
          obstacleId: puzzle.id,
          obstacleLabel: puzzle.label,
          failCount: count,
          learnSystem: puzzle.learnSystem,
          hint: check.reason,
        });
      }
    }
  }
}

// ── Solve Persistence ────────────────────────────────────────────────────────

function _markSolved(scene, obstacleId) {
  const state = scene.registry.get('gameState') || {};
  const solved = new Set(state.solvedObstacles || []);
  solved.add(obstacleId);
  const updated = { ...state, solvedObstacles: [...solved] };
  scene.registry.set('gameState', updated);

  // Dynamic import to avoid circular dependency
  saveGame(updated);
}
