import { ASSET_MANIFEST } from './assetManifest.js';

function assetExists(scene, key) {
  return scene.textures?.exists?.(key) || scene.cache?.json?.exists?.(key) || scene.cache?.tilemap?.exists?.(key);
}

/**
 * The keys this manifest approves, for the acceptance tests.
 *
 * MUST 0.15's spec needs the approved list, and it used to pull it with
 * `import('/src/game/assets/assetManifest.js')` inside the page. That
 * path only exists on the dev server, so the same spec could not run
 * against a built bundle — which is exactly where MUST 0.16 lived. The
 * list is composed at runtime (Act 1 art is spread in from the
 * registry), so it cannot be read off disk either; it has to come from
 * the app.
 *
 * @returns {string[]}
 */
export function approvedTextureKeys() {
  const m = ASSET_MANIFEST;
  return [
    ...(m.atlases || []).map((a) => a.key),
    ...(m.images || []).map((a) => a.key),
    ...(m.tilesets || []).map((a) => a.key),
    ...(m.spritesheets || []).map((a) => a.key),
  ];
}

export function preloadGameAssets(scene) {
  for (const atlas of ASSET_MANIFEST.atlases) {
    if (!assetExists(scene, atlas.key)) {
      scene.load.atlas(atlas.key, atlas.image, atlas.json);
    }
  }

  for (const image of ASSET_MANIFEST.images) {
    if (!scene.textures.exists(image.key)) {
      scene.load.image(image.key, image.path);
    }
  }

  for (const tilemap of ASSET_MANIFEST.tilemaps) {
    if (!scene.cache.tilemap.exists(tilemap.key)) {
      scene.load.tilemapTiledJSON(tilemap.key, tilemap.path);
    }
  }

  // Tilesets load as spritesheets so individual tiles are addressable by
  // frame index as well as usable as a tilemap tileset image.
  for (const tileset of ASSET_MANIFEST.tilesets || []) {
    if (!scene.textures.exists(tileset.key)) {
      scene.load.spritesheet(tileset.key, tileset.path, {
        frameWidth: tileset.tileWidth,
        frameHeight: tileset.tileHeight,
        margin: tileset.margin || 0,
        spacing: tileset.spacing || 0,
      });
    }
  }

  for (const sheet of ASSET_MANIFEST.spritesheets || []) {
    if (!scene.textures.exists(sheet.key)) {
      scene.load.spritesheet(sheet.key, sheet.path, {
        frameWidth: sheet.frameWidth,
        frameHeight: sheet.frameHeight,
        margin: sheet.margin || 0,
        spacing: sheet.spacing || 0,
      });
    }
  }
}
