/**
 * NPC entity — a non-player character that stands in the world
 * and can be interacted with when the player is close.
 *
 * Placeholder art: colored circle with label.
 */

const NPC_RADIUS = 24;
const INTERACT_DISTANCE = 90;
const NPC_COLOR = 0xf59e0b; // amber-500

export default class Npc {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} config
   * @param {string} config.id          - unique key (matches quest giver id)
   * @param {string} config.name        - display name
   * @param {number} config.x
   * @param {number} config.y
   * @param {number} [config.color]     - fill color override
   * @param {function} [config.onInteract] - called when player presses action nearby
   */
  constructor(scene, config) {
    this.scene = scene;
    this.id = config.id;
    this.name = config.name;
    this.onInteract = config.onInteract || (() => {});

    // Visual — depth set high so NPCs are always visible above ecology
    this.circle = scene.add.circle(config.x, config.y, NPC_RADIUS, config.color || NPC_COLOR);
    this.circle.setDepth(40);
    this.circle.setStrokeStyle(3, 0xffffff); // white outline for visibility
    scene.physics.add.existing(this.circle, true); // static body
    this.circle.body.setCircle(NPC_RADIUS);

    this.label = scene.add.text(config.x, config.y + NPC_RADIUS + 8, config.name, {
      fontSize: '14px',
      fontFamily: 'sans-serif',
      color: '#78350f',
      backgroundColor: 'rgba(255,255,255,0.8)',
      padding: { x: 4, y: 2 },
      align: 'center',
    }).setOrigin(0.5).setDepth(41);

    // Floating prompt (hidden by default)
    this.prompt = scene.add.text(config.x, config.y - NPC_RADIUS - 16, '💬 Talk', {
      fontSize: '15px',
      fontFamily: 'sans-serif',
      color: '#ffffff',
      backgroundColor: '#1e293b',
      padding: { x: 6, y: 3 },
    }).setOrigin(0.5).setDepth(42).setVisible(false);

    this._nearby = false;
  }

  /** Call from scene update(). Pass the player sprite so distance is checked. */
  update(playerSprite) {
    const dx = playerSprite.x - this.circle.x;
    const dy = playerSprite.y - this.circle.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    this._nearby = dist < INTERACT_DISTANCE;
    this.prompt.setVisible(this._nearby);
  }

  /** Returns true if the player is close enough to interact. */
  isNearby() {
    return this._nearby;
  }

  /** Trigger the interaction callback. */
  interact() {
    if (this._nearby) {
      this.onInteract();
    }
  }

  destroy() {
    this.circle.destroy();
    this.label.destroy();
    this.prompt.destroy();
  }
}
