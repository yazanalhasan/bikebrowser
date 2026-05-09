export function hasAtlasFrame(scene, atlasKey, frameName) {
  if (!scene.textures.exists(atlasKey)) return false;
  const texture = scene.textures.get(atlasKey);
  return Boolean(texture?.has?.(frameName));
}

export function createAtlasSprite(scene, atlasKey, frameName, x, y, fallbackFactory) {
  if (hasAtlasFrame(scene, atlasKey, frameName)) {
    return scene.add.image(x, y, atlasKey, frameName);
  }
  return fallbackFactory(scene, x, y);
}
