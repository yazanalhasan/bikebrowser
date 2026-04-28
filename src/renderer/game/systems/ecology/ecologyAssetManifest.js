/**
 * Ecology Asset Manifest — centralized registry for the ecology asset
 * pack at `public/assets/ecology/`.
 *
 * Logical names map to stable Phaser texture keys. Scenes opt in by
 * calling `preloadEcologyAssets(this)` in `preload()`. Once loaded,
 * sprites can be created with the keys exposed by `ECOLOGY_ASSET_KEYS`.
 *
 * Asset paths are loaded relative to the public folder so they work
 * with Phaser's loader (e.g. 'assets/ecology/plants/creosote.png').
 *
 * NOTE: This module is wired but not yet consumed by any scene. A
 * later dispatch (Phase 4 — EcologyEntity) will start using these
 * keys. Until then, calling `preloadEcologyAssets` is safe but
 * unnecessary.
 */

// Base path under `public/`. Phaser's loader resolves paths relative
// to the served root, which is `public/` in this project.
const ECOLOGY_ASSET_BASE = 'assets/ecology';

// ── Logical name -> file path (relative to public/) ─────────────────────────
//
// Source of truth for files actually on disk. Keep this in sync with
// `public/assets/ecology/manifest.json`. The manifest.json carries the
// human/data metadata; this file carries the runtime file paths and
// texture keys used by Phaser.

const ECOLOGY_ASSET_FILES = Object.freeze({
  plants: Object.freeze({
    creosote:        `${ECOLOGY_ASSET_BASE}/plants/creosote.png`,
    saguaro:         `${ECOLOGY_ASSET_BASE}/plants/saguaro.png`,
    mesquite:        `${ECOLOGY_ASSET_BASE}/plants/mesquite.png`,
    prickly_pear:    `${ECOLOGY_ASSET_BASE}/plants/prickly_pear.png`,
    barrel_cactus:   `${ECOLOGY_ASSET_BASE}/plants/barrel_cactus.png`,
    jojoba:          `${ECOLOGY_ASSET_BASE}/plants/jojoba.png`,
    agave:           `${ECOLOGY_ASSET_BASE}/plants/agave.png`,
    yucca:           `${ECOLOGY_ASSET_BASE}/plants/yucca.png`,
    desert_lavender: `${ECOLOGY_ASSET_BASE}/plants/desert_lavender.png`,
    ephedra:         `${ECOLOGY_ASSET_BASE}/plants/ephedra.png`,
  }),
  animals: Object.freeze({
    javelina:        `${ECOLOGY_ASSET_BASE}/animals/javelina.png`,
    rabbit:          `${ECOLOGY_ASSET_BASE}/animals/rabbit.png`,
    kangaroo_rat:    `${ECOLOGY_ASSET_BASE}/animals/kangaroo_rat.png`,
    coyote:          `${ECOLOGY_ASSET_BASE}/animals/coyote.png`,
    roadrunner:      `${ECOLOGY_ASSET_BASE}/animals/roadrunner.png`,
    quail:           `${ECOLOGY_ASSET_BASE}/animals/quail.png`,
    gila_monster:    `${ECOLOGY_ASSET_BASE}/animals/gila_monster.png`,
    hawk:            `${ECOLOGY_ASSET_BASE}/animals/hawk.png`,
  }),
  terrain: Object.freeze({
    sand:            `${ECOLOGY_ASSET_BASE}/terrain/sand.png`,
    dry_wash:        `${ECOLOGY_ASSET_BASE}/terrain/dry_wash.png`,
    rock:            `${ECOLOGY_ASSET_BASE}/terrain/rock.png`,
    desert_ground:   `${ECOLOGY_ASSET_BASE}/terrain/desert_ground.png`,
  }),
});

/**
 * Build the texture key for a given category + logical name.
 * Keys use the `ecology.<category-singular>.<name>` form so they are
 * easy to spot in Phaser debug overlays and won't collide with
 * existing texture keys.
 */
function buildKey(categoryPlural, name) {
  const singular = categoryPlural === 'plants'
    ? 'plant'
    : categoryPlural === 'animals'
      ? 'animal'
      : 'terrain';
  return `ecology.${singular}.${name}`;
}

function buildKeysFor(categoryPlural) {
  const out = {};
  for (const name of Object.keys(ECOLOGY_ASSET_FILES[categoryPlural])) {
    out[name] = buildKey(categoryPlural, name);
  }
  return Object.freeze(out);
}

/**
 * Frozen map of logical names -> Phaser texture keys.
 *
 * Example:
 *   ECOLOGY_ASSET_KEYS.plants.creosote        -> 'ecology.plant.creosote'
 *   ECOLOGY_ASSET_KEYS.animals.coyote         -> 'ecology.animal.coyote'
 *   ECOLOGY_ASSET_KEYS.terrain.sand           -> 'ecology.terrain.sand'
 */
export const ECOLOGY_ASSET_KEYS = Object.freeze({
  plants: buildKeysFor('plants'),
  animals: buildKeysFor('animals'),
  terrain: buildKeysFor('terrain'),
});

/**
 * Phaser texture-key -> public-relative file path.
 *
 * Useful for debugging / logging or for systems that need the URL
 * after the texture has been loaded.
 */
export const ECOLOGY_ASSET_PATHS = (() => {
  const out = {};
  for (const cat of Object.keys(ECOLOGY_ASSET_FILES)) {
    for (const name of Object.keys(ECOLOGY_ASSET_FILES[cat])) {
      out[buildKey(cat, name)] = ECOLOGY_ASSET_FILES[cat][name];
    }
  }
  return Object.freeze(out);
})();

/**
 * Preload every ecology asset into the given scene. Idempotent: if a
 * texture key is already loaded, the call is skipped (mirrors the
 * pattern used elsewhere in this codebase).
 *
 * Call from a scene's `preload()` method. No-op for scenes that don't
 * need ecology assets.
 *
 * @param {Phaser.Scene} scene
 */
export function preloadEcologyAssets(scene) {
  if (!scene || !scene.load || !scene.textures) {
    console.warn('[ecologyAssetManifest] preloadEcologyAssets called without a valid scene');
    return;
  }
  for (const [key, filePath] of Object.entries(ECOLOGY_ASSET_PATHS)) {
    if (scene.textures.exists(key)) continue;
    scene.load.image(key, filePath);
  }
}

/**
 * Look up the Phaser texture key for a given logical name.
 *
 * @param {'plants'|'animals'|'terrain'} category
 * @param {string} name - logical name (e.g. 'creosote')
 * @returns {string|null}
 */
export function getEcologyTextureKey(category, name) {
  const bucket = ECOLOGY_ASSET_KEYS[category];
  if (!bucket) return null;
  return bucket[name] ?? null;
}

/**
 * Total asset count, exposed for diagnostics / sanity checks.
 */
export const ECOLOGY_ASSET_COUNT =
  Object.keys(ECOLOGY_ASSET_FILES.plants).length +
  Object.keys(ECOLOGY_ASSET_FILES.animals).length +
  Object.keys(ECOLOGY_ASSET_FILES.terrain).length;

export default ECOLOGY_ASSET_KEYS;
