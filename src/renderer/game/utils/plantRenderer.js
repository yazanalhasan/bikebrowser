/**
 * Plant Renderer — draws stylized plants using Phaser Graphics API.
 *
 * Replaces emoji text with actual drawn sprites:
 *   - Trees with trunks and canopies
 *   - Bushes with layered circles
 *   - Cacti with distinct shapes
 *   - Flowers with petals
 *   - Shadows under every plant
 *   - Scale/rotation/tint variation for natural look
 *
 * Does NOT change: plant IDs, interaction handlers, quest logic.
 * Only changes visual representation.
 */

/**
 * Draw a plant at a position. Returns the container for depth sorting.
 *
 * @param {Phaser.Scene} scene
 * @param {string} species
 * @param {number} x
 * @param {number} y
 * @param {object} [options] - { scale?, interactive? }
 * @returns {Phaser.GameObjects.Container}
 */
export function drawPlant(scene, species, x, y, options = {}) {
  const renderer = PLANT_RENDERERS[species] || PLANT_RENDERERS._default;
  const variation = {
    scale: (options.scale || 1) * (0.85 + Math.random() * 0.3),
    rotation: (Math.random() - 0.5) * 0.06,
    tintShift: Math.floor(Math.random() * 20) - 10,
  };

  const container = scene.add.container(x, y);

  // Shadow
  const shadowW = renderer.shadowSize?.[0] || 24;
  const shadowH = renderer.shadowSize?.[1] || 10;
  const shadow = scene.add.ellipse(0, renderer.baseOffset || 8, shadowW, shadowH, 0x000000, 0.15);
  shadow.setDepth(0);
  container.add(shadow);

  // Plant graphic
  const g = scene.add.graphics();
  renderer.draw(g, variation);
  container.add(g);

  container.setScale(variation.scale);
  container.setAngle(variation.rotation * (180 / Math.PI));
  container.setDepth(10 + y / 26); // depth sort by Y

  return container;
}

// ── Per-Species Renderers ────────────────────────────────────────────────────

const PLANT_RENDERERS = {

  mesquite: {
    shadowSize: [40, 14],
    baseOffset: 12,
    draw(g, v) {
      // Trunk
      g.fillStyle(0x6b4423);
      g.fillRect(-3, -8, 6, 20);
      // Main canopy
      g.fillStyle(shiftColor(0x4a7c3f, v.tintShift));
      g.fillCircle(0, -16, 16);
      g.fillStyle(shiftColor(0x3d6b33, v.tintShift));
      g.fillCircle(-8, -12, 10);
      g.fillCircle(8, -10, 11);
      // Highlights
      g.fillStyle(shiftColor(0x5a9c4f, v.tintShift), 0.5);
      g.fillCircle(4, -20, 7);
    },
  },

  creosote: {
    shadowSize: [20, 8],
    baseOffset: 6,
    draw(g, v) {
      // Small bush - layered circles
      g.fillStyle(shiftColor(0x6b8e23, v.tintShift));
      g.fillCircle(0, -6, 10);
      g.fillStyle(shiftColor(0x5a7d1a, v.tintShift));
      g.fillCircle(-5, -4, 7);
      g.fillCircle(5, -3, 8);
      // Twigs
      g.lineStyle(1, 0x5d4037, 0.6);
      g.lineBetween(-2, 0, -8, -10);
      g.lineBetween(2, 0, 7, -8);
    },
  },

  prickly_pear: {
    shadowSize: [22, 8],
    baseOffset: 6,
    draw(g, v) {
      // Pads (flat oval shapes)
      g.fillStyle(shiftColor(0x3a7d44, v.tintShift));
      g.fillEllipse(0, -4, 16, 12);
      g.fillStyle(shiftColor(0x2d6b36, v.tintShift));
      g.fillEllipse(-6, -12, 12, 10);
      g.fillEllipse(6, -10, 12, 10);
      // Spines (dots)
      g.fillStyle(0xeeeeee, 0.7);
      for (let i = 0; i < 6; i++) {
        const sx = (Math.random() - 0.5) * 14;
        const sy = -4 + (Math.random() - 0.5) * 12;
        g.fillCircle(sx, sy, 0.8);
      }
      // Fruit on top
      g.fillStyle(0xdc2626);
      g.fillCircle(-4, -16, 3);
      g.fillCircle(4, -14, 2.5);
    },
  },

  barrel_cactus: {
    shadowSize: [16, 6],
    baseOffset: 4,
    draw(g, v) {
      // Round barrel shape
      g.fillStyle(shiftColor(0x2e6b34, v.tintShift));
      g.fillEllipse(0, -6, 14, 16);
      // Ribs
      g.lineStyle(1, 0x1e5a24, 0.4);
      g.lineBetween(-3, -14, -3, 2);
      g.lineBetween(0, -15, 0, 2);
      g.lineBetween(3, -14, 3, 2);
      // Top flower
      g.fillStyle(0xfbbf24);
      g.fillCircle(0, -14, 3);
    },
  },

  agave: {
    shadowSize: [24, 10],
    baseOffset: 6,
    draw(g, v) {
      // Pointed leaves radiating out
      g.fillStyle(shiftColor(0x4a8c5c, v.tintShift));
      // Center
      g.fillEllipse(0, -6, 8, 14);
      // Left leaves
      g.beginPath();
      g.moveTo(-2, 0);
      g.lineTo(-14, -8);
      g.lineTo(-12, -12);
      g.lineTo(-2, -6);
      g.closePath();
      g.fillPath();
      // Right leaves
      g.beginPath();
      g.moveTo(2, 0);
      g.lineTo(14, -8);
      g.lineTo(12, -12);
      g.lineTo(2, -6);
      g.closePath();
      g.fillPath();
      // Darker center
      g.fillStyle(shiftColor(0x3a7c4c, v.tintShift));
      g.fillEllipse(0, -8, 5, 8);
      // Spine tips
      g.fillStyle(0xd4a574);
      g.fillCircle(-14, -10, 1.5);
      g.fillCircle(14, -10, 1.5);
      g.fillCircle(0, -14, 1.5);
    },
  },

  yucca: {
    shadowSize: [20, 8],
    baseOffset: 8,
    draw(g, v) {
      // Trunk
      g.fillStyle(0x8b7355);
      g.fillRect(-2, -4, 4, 14);
      // Spiky leaves on top
      g.fillStyle(shiftColor(0x5d8a3c, v.tintShift));
      for (let i = 0; i < 7; i++) {
        const angle = (i / 7) * Math.PI * 2 - Math.PI / 2;
        const len = 12 + Math.random() * 4;
        g.beginPath();
        g.moveTo(0, -10);
        g.lineTo(Math.cos(angle) * len, -10 + Math.sin(angle) * len);
        g.lineTo(Math.cos(angle) * (len - 3), -10 + Math.sin(angle) * (len - 2));
        g.closePath();
        g.fillPath();
      }
    },
  },

  desert_lavender: {
    shadowSize: [16, 6],
    baseOffset: 5,
    draw(g, v) {
      // Stems
      g.lineStyle(1.5, 0x6b5b4f);
      g.lineBetween(0, 2, 0, -10);
      g.lineBetween(-3, 2, -5, -8);
      g.lineBetween(3, 2, 5, -8);
      // Purple flower clusters
      g.fillStyle(shiftColor(0x8b5e9b, v.tintShift));
      g.fillCircle(0, -12, 4);
      g.fillCircle(-5, -10, 3);
      g.fillCircle(5, -10, 3);
      // Smaller buds
      g.fillStyle(shiftColor(0x9b6eab, v.tintShift));
      g.fillCircle(-2, -14, 2);
      g.fillCircle(2, -13, 2);
      // Leaves
      g.fillStyle(0x6b8e5a);
      g.fillEllipse(-4, -2, 6, 3);
      g.fillEllipse(4, -2, 6, 3);
    },
  },

  jojoba: {
    shadowSize: [18, 7],
    baseOffset: 5,
    draw(g, v) {
      // Small shrub
      g.fillStyle(shiftColor(0x5d8a3c, v.tintShift));
      g.fillCircle(0, -6, 9);
      g.fillStyle(shiftColor(0x4d7a2c, v.tintShift));
      g.fillCircle(-4, -4, 6);
      g.fillCircle(5, -5, 7);
      // Seeds (small brown dots)
      g.fillStyle(0x8b6914);
      g.fillCircle(-2, -3, 2);
      g.fillCircle(3, -5, 1.8);
    },
  },

  ephedra: {
    shadowSize: [14, 6],
    baseOffset: 5,
    draw(g, v) {
      // Thin vertical stems (broom-like)
      g.lineStyle(2, shiftColor(0x6b8e23, v.tintShift));
      g.lineBetween(0, 4, 0, -14);
      g.lineBetween(-3, 4, -5, -12);
      g.lineBetween(3, 4, 5, -12);
      g.lineBetween(-1, 4, -7, -10);
      g.lineBetween(1, 4, 7, -10);
      // Joints
      g.fillStyle(0x5a7d1a);
      g.fillCircle(0, -6, 2);
      g.fillCircle(-4, -5, 1.5);
      g.fillCircle(4, -5, 1.5);
    },
  },

  yerba_mansa: {
    shadowSize: [18, 7],
    baseOffset: 5,
    draw(g, v) {
      // Low spreading plant with white flowers
      g.fillStyle(shiftColor(0x4a8c3c, v.tintShift));
      g.fillEllipse(0, -3, 20, 10);
      // White cone-shaped flowers
      g.fillStyle(0xffffff);
      g.fillCircle(-4, -6, 3);
      g.fillCircle(3, -5, 2.5);
      // Yellow centers
      g.fillStyle(0xfbbf24);
      g.fillCircle(-4, -6, 1.2);
      g.fillCircle(3, -5, 1);
    },
  },

  _default: {
    shadowSize: [16, 6],
    baseOffset: 5,
    draw(g, v) {
      g.fillStyle(0x4a7c3f);
      g.fillCircle(0, -6, 8);
    },
  },
};

// ── Helper ───────────────────────────────────────────────────────────────────

function shiftColor(baseColor, shift) {
  const r = Math.min(255, Math.max(0, ((baseColor >> 16) & 0xff) + shift));
  const gVal = Math.min(255, Math.max(0, ((baseColor >> 8) & 0xff) + shift));
  const b = Math.min(255, Math.max(0, (baseColor & 0xff) + shift));
  return (r << 16) | (gVal << 8) | b;
}

/** Get list of all supported species for validation. */
export function getSupportedSpecies() {
  return Object.keys(PLANT_RENDERERS).filter((k) => k !== '_default');
}
