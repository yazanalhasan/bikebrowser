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
import { createWorldLabel } from '../../../game/ui/WorldLabel.js';
import { createInteractionMarker } from '../../../game/ui/InteractionMarker.js';
import { createScorchingPavementPlaceholder } from '../../../game/art/placeholderFactories.js';
import { NARRATOR } from './questDialog.js';

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
      // Damage zone — hurts player on contact, passable with protection.
      // Visuals are subtle; the gameplay hit area remains explicit.
      const zone = scene.add.rectangle(obs.x, obs.y, obs.width, obs.height, 0xff8a3d, 0.08);
      zone.setDepth(1);
      scene.physics.add.existing(zone, true);

      if (obs.id === 'heat_zone') {
        createScorchingPavementPlaceholder(scene, obs.x, obs.y);
      }

      // Pulsing effect
      scene.tweens.add({
        targets: zone,
        alpha: { from: 0.1, to: 0.25 },
        duration: 800,
        yoyo: true,
        repeat: -1,
      });

      // Below the hazard, not above it. Above, the Scorching Pavement's
      // name reached into the band where Mrs. Ramirez stands and the two
      // names touched at 1024x484 and on a phone. The road below it is
      // empty.
      createWorldLabel(scene, obs.x, obs.y + obs.height / 2 + 14, obs.label, {
        fontSize: 10,
        maxWidth: 140,
        depth: 700,
        minZoom: 0.4,
      });

      // Overlap detection
      scene.physics.add.overlap(scene.player.sprite, zone, () => {
        _handleHazardContact(scene, obs);
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
      createInteractionMarker(scene, obs.x, obs.y - 30, 'inspect', { pulse: true });
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
      onInteract: () => _handlePuzzleInteract(scene, puzzle, interactable),
    });

    spawned.puzzles.push({ def: puzzle, interactable, solved: false });
  }

  return spawned;
}

// ── Hazard Contact Handler ───────────────────────────────────────────────────

let _lastHazardDamage = 0;

function _handleHazardContact(scene, obstacle) {
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
        speaker: NARRATOR,
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

  // A shimmer over the hazard itself, not a full-screen red flash. The
  // Scorching Pavement sits on the natural route to the Workshop and the
  // GPS, so a child walking that way got the whole screen flashed red
  // over and over. This marks the thing that stopped them instead.
  _shimmerHazard(scene, obstacle);

  // Show fail message on first contact
  if (count === 1) {
    scene.registry.set('dialogEvent', {
      speaker: NARRATOR,
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
      speaker: NARRATOR,
      text: obstacle.successMessage,
      choices: null, step: null,
    });
    _markSolved(scene, obstacle.id);
  } else {
    const count = (_failureCounts.get(obstacle.id) || 0) + 1;
    _failureCounts.set(obstacle.id, count);

    scene.registry.set('dialogEvent', {
      speaker: NARRATOR,
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

function _handlePuzzleInteract(scene, puzzle, interactable = null) {
  const state = scene.registry.get('gameState') || {};

  // Already solved. `spawnObstacles` skips solved puzzles on entry, but
  // within a single visit the hotspot stayed live after a solve: pressing E
  // again with a second fruit re-solved it, paid the reward a second time and
  // ate the fruit. The solve removes the hotspot now; this guard covers a
  // press that was already queued, and gives the child a sensible line.
  if ((state.solvedObstacles || []).includes(puzzle.id)) {
    scene.registry.set('dialogEvent', {
      speaker: 'Zuzu',
      text: puzzle.solvedMessage || 'Already done — nothing more to do here.',
      choices: null, step: null,
    });
    return;
  }

  const check = checkObstacleCondition(puzzle, state);

  if (check.passed) {
    scene.registry.set('dialogEvent', {
      speaker: NARRATOR,
      text: puzzle.successMessage,
      choices: null, step: null,
    });
    _solvePuzzle(scene, puzzle, state);
    // Spent: take the hotspot away so the prompt stops inviting a press.
    scene.removeInteractable?.(interactable);
  } else {
    const count = (_failureCounts.get(puzzle.id) || 0) + 1;
    _failureCounts.set(puzzle.id, count);

    scene.registry.set('dialogEvent', {
      speaker: NARRATOR,
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

/**
 * Solve a puzzle: record it, spend whatever solved it, and pay the reward —
 * in ONE state write.
 *
 * This used to be two writes. `_markSolved` saved `solvedObstacles`, then the
 * reward block rebuilt the state from the *pre-solve* copy captured at the top
 * of the handler and saved that over the top, wiping `solvedObstacles` in
 * memory and on disk. The puzzle therefore never persisted: every return to
 * the scene re-spawned it and paid the reward again, so the wilted plant was a
 * Zuzubucks tap a child could hold down.
 *
 * @returns {object} the state that was written
 */
function _solvePuzzle(scene, puzzle, state) {
  const solved = new Set(state.solvedObstacles || []);
  solved.add(puzzle.id);
  const updated = { ...state, solvedObstacles: [...solved] };

  // Spend the thing that solved it. Only for puzzles (`solveCondition`), not
  // for obstacles you merely need to be carrying something to pass
  // (`passCondition`) — sun balm is protection you keep, not a key you burn.
  const cond = puzzle.solveCondition;
  if (cond?.type === 'item' && cond.item) {
    const inventory = [...(updated.inventory || [])];
    const at = inventory.indexOf(cond.item);
    if (at !== -1) {
      inventory.splice(at, 1);
      updated.inventory = inventory;
    }
  }

  // Each reward field is guarded on itself. The old code tested `reward.xp`
  // and then added `reward.reputation`, so a reward of `{ xp, zuzubucks }`
  // added `undefined || 0` reputation and granted nothing for the xp.
  //
  // `reward.xp` has no home in the save (gameState carries `reputation` and
  // `zuzubucks`; the xp counters belong to the physics and language systems).
  // It is deliberately not granted here rather than being quietly mapped onto
  // reputation — see the review reply in bikebrowser-handoff.
  const reward = puzzle.reward || {};
  if (reward.reputation) {
    updated.reputation = (updated.reputation || 0) + reward.reputation;
  }
  if (reward.zuzubucks) {
    updated.zuzubucks = (updated.zuzubucks || 0) + reward.zuzubucks;
  }

  scene.registry.set('gameState', updated);
  saveGame(updated);
  return updated;
}

/**
 * A short warm pulse over the obstacle, replacing a camera-wide flash.
 *
 * @param {object} scene
 * @param {{x?: number, y?: number, width?: number, height?: number}} obstacle
 */
function _shimmerHazard(scene, obstacle) {
  const cam = scene.cameras?.main;
  if (!cam || !scene.add) return;

  const x = Number.isFinite(obstacle?.x) ? obstacle.x : cam.scrollX + cam.width / 2;
  const y = Number.isFinite(obstacle?.y) ? obstacle.y : cam.scrollY + cam.height / 2;
  const w = Number.isFinite(obstacle?.width) ? obstacle.width : 120;
  const h = Number.isFinite(obstacle?.height) ? obstacle.height : 80;

  const pulse = scene.add.rectangle(x, y, w + 16, h + 16, 0xf97316, 0.42).setDepth(14);
  scene.tweens?.add({
    targets: pulse,
    alpha: 0,
    scaleX: 1.08,
    scaleY: 1.08,
    duration: 420,
    ease: 'Quad.easeOut',
    onComplete: () => pulse.destroy(),
  });
}

function _markSolved(scene, obstacleId) {
  const state = scene.registry.get('gameState') || {};
  const solved = new Set(state.solvedObstacles || []);
  solved.add(obstacleId);
  const updated = { ...state, solvedObstacles: [...solved] };
  scene.registry.set('gameState', updated);

  // Dynamic import to avoid circular dependency
  saveGame(updated);
}
