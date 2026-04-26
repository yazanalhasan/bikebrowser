/**
 * NPC entity — procedurally-drawn humanoid that stands in the world
 * and can be interacted with when the player is close.
 *
 * Body parts are Phaser Graphics in a Container, matching Zuzu's art style
 * (Player.js). Appearance (skin, hair, clothes, accessory) is driven by a
 * profile looked up in ../data/npcAppearances.js by the NPC id, so each
 * quest-giver is visually distinct and reads as their personality at a
 * glance.
 *
 * Depth: NPC participates in the scene's Y-based depth sort via
 * `this.circle` (an alias to the body container) so background objects
 * south of the NPC layer in front and objects north layer behind — no
 * more getting clipped by trees.
 */

import { getNpcAppearance, DEFAULT_APPEARANCE } from '../data/npcAppearances.js';

const INTERACT_DISTANCE = 90;
const BODY_SCALE = 1.8;      // matches Player
const FEET_OFFSET = 22;      // pixels from container y to feet (post-scale)

export default class Npc {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} config
   * @param {string} config.id          - unique key (matches quest giver id)
   * @param {string} config.name        - display name
   * @param {number} config.x
   * @param {number} config.y
   * @param {object} [config.appearance] - appearance override; otherwise looked up by id
   * @param {function} [config.onInteract] - called when player presses action nearby
   */
  constructor(scene, config) {
    this.scene = scene;
    this.id = config.id;
    this.name = config.name;
    this.onInteract = config.onInteract || (() => {});

    const appearance = config.appearance || getNpcAppearance(this.id) || DEFAULT_APPEARANCE;

    // Shadow under feet (drawn first so it renders below)
    this.shadow = scene.add.ellipse(config.x, config.y + FEET_OFFSET, 34, 9, 0x000000, 0.22);

    // Body container
    this.container = scene.add.container(config.x, config.y);
    this._buildHumanoid(appearance);
    this.container.setScale(BODY_SCALE);

    // Name label (below feet)
    this.label = scene.add.text(config.x, config.y + FEET_OFFSET + 10, config.name, {
      fontSize: '13px',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
      color: '#1e293b',
      backgroundColor: 'rgba(255,255,255,0.85)',
      padding: { x: 5, y: 2 },
      align: 'center',
    }).setOrigin(0.5);

    // Floating interaction prompt (above head, hidden by default)
    this.prompt = scene.add.text(config.x, config.y - 46, '💬 Talk', {
      fontSize: '14px',
      fontFamily: 'sans-serif',
      color: '#ffffff',
      backgroundColor: '#1e293b',
      padding: { x: 6, y: 3 },
    }).setOrigin(0.5).setVisible(false);

    // Backward-compatible alias — existing scene code reads `npc.circle.x`
    // and registers `npc.circle` with the depth-sort system.
    this.circle = this.container;

    this._nearby = false;
    this._applyDepth();
  }

  // ── Humanoid construction ────────────────────────────────────────────────

  _buildHumanoid(a) {
    // Bottom-up draw order: legs → torso → arms → accessory → head + headgear
    this._drawLegs(a);
    this._drawTorso(a);
    this._drawArms(a);
    this._drawAccessory(a);
    this._drawHead(a);
  }

  _drawLegs(a) {
    const g = this.scene.add.graphics();
    g.fillStyle(a.pants);
    g.fillRoundedRect(-8, 8, 7, 13, 2);
    g.fillRoundedRect(1, 8, 7, 13, 2);
    g.fillStyle(a.shoes);
    g.fillRoundedRect(-9, 20, 9, 5, 2);
    g.fillRoundedRect(0, 20, 9, 5, 2);
    this.container.add(g);
  }

  _drawTorso(a) {
    const g = this.scene.add.graphics();
    const shirt = a.shirt.color;
    const style = a.shirt.style;

    if (style === 'labcoat') {
      // Navy shirt underneath
      g.fillStyle(0x1e3a5f);
      g.fillRoundedRect(-10, -10, 20, 22, 3);
      // White coat over it
      g.fillStyle(0xffffff);
      g.fillRoundedRect(-12, -9, 24, 22, 3);
      // Coat center seam
      g.lineStyle(0.8, 0xc0c0c0);
      g.lineBetween(0, -9, 0, 12);
      // Lapel V-notch
      g.fillStyle(0x1e3a5f);
      g.fillTriangle(-3, -10, 3, -10, 0, -5);
      // Pocket hint
      g.fillStyle(0xe8e8e8);
      g.fillRect(-10, 4, 4, 3);
    } else if (style === 'overalls') {
      // T-shirt peeking under overalls
      g.fillStyle(0xe5e5e5);
      g.fillRoundedRect(-11, -10, 22, 6, 3);
      // Overalls body
      g.fillStyle(shirt);
      g.fillRoundedRect(-11, -5, 22, 18, 3);
      // Bib
      g.fillRect(-6, -9, 12, 6);
      // Straps
      g.lineStyle(2.2, shirt);
      g.lineBetween(-5, -10, -6, -4);
      g.lineBetween(5, -10, 6, -4);
      // Buckles
      g.fillStyle(0xffd700);
      g.fillRect(-7, -3, 3, 2);
      g.fillRect(4, -3, 3, 2);
    } else if (style === 'sweater') {
      g.fillStyle(shirt);
      g.fillRoundedRect(-12, -10, 24, 22, 5);
      // Ribbed hem
      g.lineStyle(0.6, 0x000000, 0.18);
      g.lineBetween(-11, 10, 11, 10);
      // Neckline
      g.fillStyle(0xffffff, 0.15);
      g.fillRoundedRect(-5, -11, 10, 3, 1);
    } else if (style === 'cardigan') {
      g.fillStyle(shirt);
      g.fillRoundedRect(-11, -10, 22, 22, 4);
      // Center button line
      g.lineStyle(0.8, 0x3a2a1a, 0.6);
      g.lineBetween(0, -8, 0, 10);
      g.fillStyle(0x3a2a1a);
      g.fillCircle(0, -4, 0.9);
      g.fillCircle(0, 2, 0.9);
      g.fillCircle(0, 8, 0.9);
      // Pocket
      g.lineStyle(0.6, 0x3a2a1a, 0.4);
      g.strokeRect(-9, 2, 5, 5);
    } else if (style === 'rangershirt') {
      // Khaki shirt base
      g.fillStyle(shirt);
      g.fillRoundedRect(-11, -10, 22, 22, 3);
      // Olive vest over shirt
      if (a.vest) {
        g.fillStyle(a.vest.color);
        g.fillRect(-12, -9, 5, 21);
        g.fillRect(7, -9, 5, 21);
        // Vest pockets
        g.fillStyle(0x000000, 0.25);
        g.fillRect(-11, -5, 3, 4);
        g.fillRect(8, -5, 3, 4);
      }
      // Shirt collar triangles
      g.fillStyle(shirt);
      g.fillTriangle(-5, -10, -2, -10, -3, -6);
      g.fillTriangle(2, -10, 5, -10, 3, -6);
    } else {
      // Basic shirt
      g.fillStyle(shirt);
      g.fillRoundedRect(-11, -10, 22, 22, 3);
    }
    this.container.add(g);
  }

  _drawArms(a) {
    const g = this.scene.add.graphics();
    const skin = a.skin;
    const sleeve = a.shirt.style === 'labcoat' ? 0xffffff
      : a.shirt.style === 'overalls' ? 0xe5e5e5
      : a.shirt.color;

    // Left arm: sleeve + hand
    g.fillStyle(sleeve);
    g.fillRoundedRect(-15, -6, 5, 10, 2);
    g.fillStyle(skin);
    g.fillRoundedRect(-15, 3, 5, 5, 2);

    // Right arm
    g.fillStyle(sleeve);
    g.fillRoundedRect(10, -6, 5, 10, 2);
    g.fillStyle(skin);
    g.fillRoundedRect(10, 3, 5, 5, 2);

    this.container.add(g);
  }

  _drawAccessory(a) {
    if (!a.accessory) return;
    const g = this.scene.add.graphics();

    switch (a.accessory) {
      case 'tire_pump':
        // Floor pump held by right hand
        g.fillStyle(0x1e3a5f);
        g.fillRect(15, -6, 3, 14);
        g.fillStyle(0xc0392b);
        g.fillRoundedRect(13, -9, 7, 3, 1);
        g.fillStyle(0x4b5563);
        g.fillRect(12, 8, 9, 2);
        break;
      case 'wrench':
        g.fillStyle(0x9ca3af);
        g.fillRect(15, 0, 2, 9);
        g.fillStyle(0xd1d5db);
        g.fillRect(14, -3, 4, 4);
        break;
      case 'pickaxe':
        // Wooden handle
        g.lineStyle(2.2, 0x6b4423);
        g.lineBetween(15, -4, 21, 10);
        // Iron head
        g.fillStyle(0x4a5568);
        g.fillTriangle(17, -9, 25, -4, 19, -2);
        g.fillTriangle(17, -9, 14, -4, 20, -6);
        break;
      case 'binoculars':
        g.fillStyle(0x1a1a2e);
        g.fillRoundedRect(13, -2, 4, 4, 1);
        g.fillRoundedRect(18, -2, 4, 4, 1);
        g.fillRect(17, -1, 1, 2);
        // Neck strap
        g.lineStyle(1, 0x3a2a1a);
        g.lineBetween(14, -3, 13, -11);
        g.lineBetween(21, -3, 22, -11);
        break;
      case 'clipboard':
        g.fillStyle(0xb08050);
        g.fillRoundedRect(13, -3, 9, 13, 1);
        g.fillStyle(0xffffff);
        g.fillRect(14, 0, 7, 9);
        // Metal clip
        g.fillStyle(0x9ca3af);
        g.fillRoundedRect(15, -4, 5, 3, 1);
        // Paper lines
        g.lineStyle(0.4, 0x9ca3af);
        g.lineBetween(15, 3, 20, 3);
        g.lineBetween(15, 5, 19, 5);
        g.lineBetween(15, 7, 20, 7);
        break;
    }
    this.container.add(g);
  }

  _drawHead(a) {
    const g = this.scene.add.graphics();

    // Neck
    g.fillStyle(a.skin);
    g.fillRect(-3, -13, 6, 4);

    // Face
    g.fillCircle(0, -19, 9);

    // Ears
    g.fillStyle(a.skin);
    g.fillCircle(-9, -19, 2);
    g.fillCircle(9, -19, 2);

    // Hair base (behind headgear)
    const hair = a.hair;
    if (hair && hair.style !== 'bald') {
      g.fillStyle(hair.color);
      switch (hair.style) {
        case 'short':
          g.fillRoundedRect(-9, -28, 18, 11, 5);
          // Side fade
          g.fillRect(-10, -22, 3, 6);
          g.fillRect(7, -22, 3, 6);
          break;
        case 'bun':
          g.fillRoundedRect(-9, -26, 18, 9, 4);
          g.fillCircle(0, -31, 5.5);
          if (hair.grayStreak) {
            g.fillStyle(0xcfc3b0);
            g.fillRect(-8, -25, 2, 6);
            g.fillRect(6, -25, 2, 6);
          }
          break;
        case 'ponytail':
          g.fillRoundedRect(-9, -28, 18, 10, 4);
          // Ponytail hanging behind neck
          g.fillRoundedRect(-3, -18, 6, 14, 3);
          break;
        case 'bob':
          g.fillRoundedRect(-10, -27, 20, 14, 5);
          // Chin-length cut
          g.fillRect(-10, -15, 3, 3);
          g.fillRect(7, -15, 3, 3);
          break;
      }
    }

    // Facial hair
    if (a.facialHair) {
      g.fillStyle(a.facialHair.color);
      if (a.facialHair.style === 'bushy_beard') {
        g.fillRoundedRect(-8, -16, 16, 10, 4);
        g.fillRect(-6, -17, 12, 3); // mustache
      } else if (a.facialHair.style === 'mustache') {
        g.fillRect(-5, -17, 10, 2);
      }
    }

    // Headgear (on top of hair)
    if (a.headgear) {
      const hg = a.headgear;
      if (hg.type === 'flatcap') {
        g.fillStyle(hg.color);
        g.fillRoundedRect(-10, -29, 20, 7, 3);
        g.fillRoundedRect(-12, -25, 24, 3, 1); // brim
        // Highlight
        g.fillStyle(0xffffff, 0.12);
        g.fillRoundedRect(-9, -28, 10, 2, 1);
      } else if (hg.type === 'hardhat') {
        g.fillStyle(hg.color);
        g.fillCircle(0, -25, 11);
        g.fillRect(-11, -25, 22, 4);       // brim
        g.fillStyle(0xb9791f);              // ridge
        g.fillRect(-1.5, -35, 3, 10);
        // Shadow under brim
        g.fillStyle(0x000000, 0.2);
        g.fillRect(-10, -22, 20, 1);
      } else if (hg.type === 'rangerhat') {
        // Wide brim (rounded rect as flattened ellipse)
        g.fillStyle(hg.color);
        g.fillRoundedRect(-14, -26, 28, 5, 2.5);
        // Crown
        g.fillRoundedRect(-7, -32, 14, 8, 2);
        // Hat band
        g.fillStyle(0x3a2a1a);
        g.fillRect(-7, -26, 14, 1.5);
        // Pinch at top
        g.fillStyle(hg.color);
        g.fillTriangle(-2, -32, 2, -32, 0, -35);
      }
    }

    // Glasses (drawn after headgear so they sit on the face)
    if (a.glasses) {
      g.lineStyle(1.1, 0x1a1a2e, 0.9);
      g.strokeCircle(-4, -18, 3.2);
      g.strokeCircle(4, -18, 3.2);
      g.lineBetween(-1, -18, 1, -18); // bridge
      // Frame temples
      g.lineBetween(-7, -18, -9, -18);
      g.lineBetween(7, -18, 9, -18);
      // Lens glint
      g.fillStyle(0xffffff, 0.25);
      g.fillCircle(-5, -19, 0.9);
      g.fillCircle(3, -19, 0.9);
    }

    // Eyes
    g.fillStyle(0xffffff);
    g.fillCircle(-3.5, -18, 1.9);
    g.fillCircle(3.5, -18, 1.9);
    g.fillStyle(0x1a1a2e);
    g.fillCircle(-3.5, -18, 1.0);
    g.fillCircle(3.5, -18, 1.0);
    // Tiny shine
    g.fillStyle(0xffffff);
    g.fillCircle(-3, -18.6, 0.4);
    g.fillCircle(4, -18.6, 0.4);

    // Mouth: if bearded, just a hint; otherwise a small smile
    if (!a.facialHair) {
      g.lineStyle(1, 0x6b3410);
      g.beginPath();
      g.arc(0, -15, 2.8, 0.25, Math.PI - 0.25, false);
      g.strokePath();
    }

    this.container.add(g);
  }

  // ── Depth + lifecycle ────────────────────────────────────────────────────

  /**
   * Set depth from the NPC's feet position, matching the scene's Y-based
   * depth sort. Called once in constructor and overridden per-frame by
   * `updateDepthSort` in scenes that use it — but this keeps sub-scenes
   * without depth sort looking correct too.
   */
  _applyDepth() {
    const feetY = this.container.y + FEET_OFFSET;
    const depth = 10 + feetY / 26;
    this.container.setDepth(depth);
    this.shadow.setDepth(depth - 0.5);
    this.label.setDepth(depth + 0.1);
    this.prompt.setDepth(depth + 0.2);
  }

  /** Call from scene update(). Pass the player sprite so distance is checked. */
  update(playerSprite) {
    const dx = playerSprite.x - this.container.x;
    const dy = playerSprite.y - this.container.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    this._nearby = dist < INTERACT_DISTANCE;
    this.prompt.setVisible(this._nearby);

    // Re-apply depth each frame so label/prompt/shadow track the container
    // even when a scene's depth-sort system rewrites container depth.
    const base = this.container.depth;
    this.shadow.setDepth(base - 0.5);
    this.label.setDepth(base + 0.1);
    this.prompt.setDepth(base + 0.2);
  }

  isNearby() { return this._nearby; }

  interact() {
    if (this._nearby) this.onInteract();
  }

  destroy() {
    this.container.destroy();
    this.shadow.destroy();
    this.label.destroy();
    this.prompt.destroy();
  }
}
