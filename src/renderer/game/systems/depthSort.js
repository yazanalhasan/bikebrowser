/**
 * Depth Sort System — Y-based depth sorting for Phaser scenes.
 *
 * Fixes the occlusion bug where objects render in wrong order.
 * Uses each object's base Y position as its depth value,
 * producing natural top-down (Zelda-like) layering.
 *
 * Depth layers:
 *   0    — ground / world map
 *   1-9  — static scene labels, markers
 *   10+  — dynamic objects sorted by Y (base point)
 *   50+  — floating UI labels
 *   100+ — celebration/overlay effects
 *   900+ — debug overlays
 *
 * Usage:
 *   In scene.create(): initDepthSort(this)
 *   In scene.update(): updateDepthSort(this, dynamicObjects)
 */

/** Depth offset to separate dynamic objects from static layers. */
const DYNAMIC_DEPTH_BASE = 10;

/** Maximum depth for dynamic objects before UI layers. */
const DYNAMIC_DEPTH_MAX = 49;

/**
 * Initialize depth sorting for a scene.
 * Call once in create() after all objects are added.
 *
 * @param {Phaser.Scene} scene
 */
export function initDepthSort(scene) {
  // Store reference for the sorting system
  scene._depthSortEnabled = true;
  scene._depthSortDebug = false;
  scene._depthDebugTexts = [];
}

/**
 * Compute the depth value for an object based on its base Y position.
 *
 * Tall objects (trees, NPCs) use baseY = y + heightOffset so their
 * "feet" determine occlusion, not their top.
 *
 * @param {object} obj - must have { y } and optionally { heightOffset, baseY }
 * @returns {number} depth value (higher = rendered on top)
 */
export function computeDepth(obj) {
  const baseY = obj.baseY ?? (obj.y + (obj.heightOffset || 0));
  // Normalize to the dynamic depth range (10–49)
  // World height is 1024, so divide by ~26 to fit in range
  return DYNAMIC_DEPTH_BASE + Math.min(DYNAMIC_DEPTH_MAX - DYNAMIC_DEPTH_BASE, baseY / 26);
}

/**
 * Update depth for all dynamic objects in the scene.
 *
 * Call every frame from scene.update(). Sets each object's Phaser depth
 * based on its current Y position.
 *
 * @param {Phaser.Scene} scene
 * @param {object[]} dynamicObjects - array of { gameObject, heightOffset? }
 *   Each entry must have a `.gameObject` with `.y` and `.setDepth()`
 */
export function updateDepthSort(scene, dynamicObjects) {
  if (!scene._depthSortEnabled) return;

  for (const entry of dynamicObjects) {
    const obj = entry.gameObject || entry;
    if (!obj || typeof obj.setDepth !== 'function') continue;

    const heightOffset = entry.heightOffset || 0;
    const baseY = obj.y + heightOffset;
    const depth = DYNAMIC_DEPTH_BASE + baseY / 26;
    obj.setDepth(depth);

    // If this entry has associated children (label, prompt), set their depth too
    if (entry.children) {
      for (const child of entry.children) {
        if (child && typeof child.setDepth === 'function') {
          child.setDepth(depth + 0.1);
        }
      }
    }
  }

  // Debug overlay
  if (scene._depthSortDebug) {
    _renderDebugDepths(scene, dynamicObjects);
  }
}

/**
 * Apply depth to a single Phaser game object based on its Y position.
 * Convenience function for one-off depth assignments.
 *
 * @param {Phaser.GameObjects.GameObject} gameObject
 * @param {number} [heightOffset=0]
 */
export function applyDepth(gameObject, heightOffset = 0) {
  if (!gameObject || typeof gameObject.setDepth !== 'function') return;
  const baseY = gameObject.y + heightOffset;
  gameObject.setDepth(DYNAMIC_DEPTH_BASE + baseY / 26);
}

/**
 * Toggle debug depth display.
 *
 * @param {Phaser.Scene} scene
 * @param {boolean} enabled
 */
export function setDepthDebug(scene, enabled) {
  scene._depthSortDebug = enabled;
  if (!enabled) {
    // Clean up debug texts
    for (const t of scene._depthDebugTexts || []) {
      t.destroy();
    }
    scene._depthDebugTexts = [];
  }
}

function _renderDebugDepths(scene, dynamicObjects) {
  // Clear previous debug texts
  for (const t of scene._depthDebugTexts) {
    t.destroy();
  }
  scene._depthDebugTexts = [];

  for (const entry of dynamicObjects) {
    const obj = entry.gameObject || entry;
    if (!obj || obj.depth === undefined) continue;

    const text = scene.add.text(obj.x, obj.y - 20, `d:${obj.depth.toFixed(1)}`, {
      fontSize: '9px',
      fontFamily: 'monospace',
      color: '#ffff00',
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: { x: 2, y: 1 },
    }).setOrigin(0.5).setDepth(999);

    scene._depthDebugTexts.push(text);
  }
}
