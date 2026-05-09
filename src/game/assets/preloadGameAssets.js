import { ASSET_MANIFEST } from './assetManifest.js';

function assetExists(scene, key) {
  return scene.textures?.exists?.(key) || scene.cache?.json?.exists?.(key) || scene.cache?.tilemap?.exists?.(key);
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
