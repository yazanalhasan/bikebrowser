/**
 * Companion system — a friend who walks with the player.
 *
 * Today: Lina, Zuzu's kid companion in Act 1. She appears beside him in the
 * neighborhood and the desert, comments on what he finds, and can be talked
 * to for a hint. She is NOT a second controllable character, NOT a
 * quest-giver, and she does not fight, fetch, or replace the bike, the lab
 * or the quest engine. Her lines live in `data/companions.js`.
 *
 * Scales to: any later travelling companion. The follow behaviour, the
 * sheet-driven sprite and the save record are companion-agnostic; who is
 * following comes from `data/companions.js`.
 *
 * World-model primitive integration (arc.md §8.1):
 * - Environmental primitives consulted: none. The companion follows the
 *   player in scene-local pixels; she does not read biome or terrain, and
 *   she does not place landmarks (§8.3/§8.6 do not apply).
 * - Progression primitives updated: none. Mounting or talking to a
 *   companion writes no discovery state, no knowledge state (§8.5 gating
 *   respected — this module never queries the knowledge-state API) and no
 *   quest state. Language practice is recorded by `languageLayer.js` when
 *   the player practises a card, not by this module.
 * - Act 1 -> Act 3 scaling: one code path for every act. No act-specific
 *   branch (§8.2); a new companion is a data row, not a new code path.
 *
 * No scene imports.
 */

import { ACT1_CHARACTER_SHEETS, sheetFrame, groundDepth } from '../../../game/assets/act1Art.js';
import { CHARACTER_PIXEL_SCALE } from '../../../game/art/artConfig.js';

/** How far behind the player the companion settles, in pixels. */
const FOLLOW_DISTANCE = 56;
/** Beyond this, she hurries to catch up. */
const CATCH_UP_DISTANCE = 190;
/** Below this player speed she stops walking and idles. */
const MOVING_SPEED = 12;
/** Walk-cycle frames per second. */
const WALK_FPS = 7;

// Sheet row order for the Act 1 companion sheets. lina_walk is in Zuzu's
// walk order (down, left, right, up); lina_idle is in Zuzu's idle order
// (down, right, left, up).
const WALK_ROWS = { down: 0, left: 1, right: 2, up: 3 };
const IDLE_ROWS = { down: 0, right: 1, left: 2, up: 3 };

/**
 * Mount a companion in a scene.
 *
 * Safe to call from any scene's createWorld(); returns null when the
 * companion's art is not loaded, so a scene never half-builds her.
 *
 * @param {Phaser.Scene} scene
 * @param {object} config
 * @param {string} config.id            companion id (e.g. 'lina')
 * @param {string} config.name          display name
 * @param {string} config.walkSheet     character-sheet slot for walking
 * @param {string} config.idleSheet     character-sheet slot for idling
 * @param {number} config.x             spawn x
 * @param {number} config.y             spawn y
 * @param {function} [config.onInteract] called when the player talks to her
 * @returns {object|null} the companion handle, or null if art is missing
 */
export function mountCompanion(scene, config) {
  const walk = ACT1_CHARACTER_SHEETS[config.walkSheet];
  const idle = ACT1_CHARACTER_SHEETS[config.idleSheet];
  if (!walk || !idle) return null;
  if (!scene.textures?.exists?.(walk.key) || !scene.textures.exists(idle.key)) return null;

  const originY = idle.feetY / idle.frameHeight;

  const shadow = scene.add.ellipse(config.x, config.y, 28, 8, 0x000000, 0.2)
    .setDepth(groundDepth(config.y) - 0.5);

  const sprite = scene.add.sprite(config.x, config.y, idle.key, sheetFrame(config.idleSheet, 0))
    .setOrigin(0.5, originY)
    .setScale(CHARACTER_PIXEL_SCALE)
    .setDepth(groundDepth(config.y));

  const label = scene.add.text(config.x, config.y + 12, config.name, {
    fontSize: '12px',
    fontFamily: 'sans-serif',
    fontStyle: 'bold',
    color: '#1e293b',
    backgroundColor: 'rgba(255,255,255,0.85)',
    padding: { x: 5, y: 2 },
  }).setOrigin(0.5, 0).setDepth(60);

  const prompt = scene.add.text(config.x, config.y - 70, 'Talk', {
    fontSize: '12px',
    fontFamily: 'sans-serif',
    color: '#ffffff',
    backgroundColor: '#1e293b',
    padding: { x: 6, y: 3 },
  }).setOrigin(0.5).setDepth(61).setVisible(false);

  const companion = {
    id: config.id,
    name: config.name,
    sprite,
    shadow,
    label,
    prompt,
    onInteract: config.onInteract || (() => {}),
    _facing: 'down',
    _state: 'idle',
    _frameTime: 0,
    _frameIndex: 0,
    _nearby: false,

    /** True when the player is close enough to talk. */
    isNearby() { return this._nearby; },

    /** Called by the scene when the player presses the action key. */
    interact() { if (this._nearby) this.onInteract(); },

    /**
     * Follow the player. Call from the scene's update().
     * @param {{x:number,y:number}} target the player sprite
     * @param {number} delta ms since the last frame
     */
    update(target, delta) {
      if (!target) return;
      const dx = target.x - sprite.x;
      const dy = target.y - sprite.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      this._nearby = dist < 90;
      prompt.setVisible(this._nearby);

      // Close enough: stand still and face the player.
      if (dist <= FOLLOW_DISTANCE) {
        this._setState('idle');
      } else {
        // Hurry when she has fallen a long way behind.
        const speed = dist > CATCH_UP_DISTANCE ? 150 : 95;
        const step = (speed * delta) / 1000;
        const travel = Math.min(step, dist - FOLLOW_DISTANCE);
        sprite.x += (dx / dist) * travel;
        sprite.y += (dy / dist) * travel;
        this._setState(travel > (MOVING_SPEED * delta) / 1000 ? 'walk' : 'idle');
      }

      // Face whichever axis dominates.
      if (Math.abs(dx) > Math.abs(dy)) this._facing = dx < 0 ? 'left' : 'right';
      else this._facing = dy < 0 ? 'up' : 'down';

      this._advanceFrame(delta);

      // Keep the shadow, label and prompt with her, and depth-sort by feet.
      shadow.setPosition(sprite.x, sprite.y);
      label.setPosition(sprite.x, sprite.y + 12);
      prompt.setPosition(sprite.x, sprite.y - 70);
      sprite.setDepth(groundDepth(sprite.y));
      shadow.setDepth(groundDepth(sprite.y) - 0.5);
    },

    _setState(next) {
      if (this._state === next) return;
      this._state = next;
      this._frameIndex = 0;
      this._frameTime = 0;
    },

    _advanceFrame(delta) {
      if (this._state === 'walk') {
        this._frameTime += delta;
        const frameMs = 1000 / WALK_FPS;
        if (this._frameTime >= frameMs) {
          this._frameTime -= frameMs;
          this._frameIndex = (this._frameIndex + 1) % walk.cols;
        }
        const row = WALK_ROWS[this._facing] ?? 0;
        sprite.setTexture(walk.key, row * walk.cols + this._frameIndex);
      } else {
        const row = IDLE_ROWS[this._facing] ?? 0;
        sprite.setTexture(idle.key, row * idle.cols);
      }
    },

    destroy() {
      sprite.destroy();
      shadow.destroy();
      label.destroy();
      prompt.destroy();
    },
  };

  return companion;
}
