const CHARACTER_NAMES = {
  zuzu: 'Zuzu',
  mr_chen: 'Mr. Chen',
  neighbor: 'Mrs. Ramirez',
  auntie_mariam: 'Auntie Mariam',
};

function frameIndexFor(displayObject) {
  const frameName = displayObject?.frame?.name;
  if (typeof frameName === 'number') return frameName;
  const parsed = Number.parseInt(String(frameName ?? ''), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function colorValue(value) {
  return typeof value === 'number' ? value : null;
}

function boundsFor(displayObject) {
  const bounds = displayObject.getBounds();
  return {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    left: bounds.left,
    right: bounds.right,
    top: bounds.top,
    bottom: bounds.bottom,
  };
}

function textureSourceFor(displayObject) {
  const source = displayObject?.texture?.source?.[0];
  return {
    sourceImageWidth: source?.width ?? null,
    sourceImageHeight: source?.height ?? null,
    imageUrl: source?.image?.currentSrc || source?.image?.src || null,
  };
}

function stateFor(scene, displayObject, characterId) {
  const camera = scene.cameras.main;
  const frame = displayObject.frame;
  return {
    characterId,
    displayName: CHARACTER_NAMES[characterId] || characterId,
    textureKey: displayObject.texture?.key || null,
    currentAnimationKey: displayObject.anims?.currentAnim?.key || null,
    currentFrameIndex: frameIndexFor(displayObject),
    currentFrameName: frame?.name ?? null,
    frameWidth: frame?.width ?? null,
    frameHeight: frame?.height ?? null,
    ...textureSourceFor(displayObject),
    cutX: frame?.cutX ?? null,
    cutY: frame?.cutY ?? null,
    cutWidth: frame?.cutWidth ?? null,
    cutHeight: frame?.cutHeight ?? null,
    x: displayObject.x,
    y: displayObject.y,
    scaleX: displayObject.scaleX,
    scaleY: displayObject.scaleY,
    displayWidth: displayObject.displayWidth,
    displayHeight: displayObject.displayHeight,
    alpha: displayObject.alpha,
    tintTopLeft: colorValue(displayObject.tintTopLeft),
    tintTopRight: colorValue(displayObject.tintTopRight),
    tintBottomLeft: colorValue(displayObject.tintBottomLeft),
    tintBottomRight: colorValue(displayObject.tintBottomRight),
    flipX: Boolean(displayObject.flipX),
    flipY: Boolean(displayObject.flipY),
    rotation: displayObject.rotation,
    angle: displayObject.angle,
    originX: displayObject.originX,
    originY: displayObject.originY,
    depth: displayObject.depth,
    visible: displayObject.visible,
    bounds: boundsFor(displayObject),
    cameraScroll: {
      x: camera.scrollX,
      y: camera.scrollY,
    },
    cameraZoom: camera.zoom,
  };
}

export function installCharacterArtAuditBridge(scene) {
  if (typeof window === 'undefined') return;

  window.__GAME_ART_AUDIT__ = {
    captureCharacterRuntimeState() {
      const characters = [];
      if (scene.player) {
        characters.push(stateFor(scene, scene.player, 'zuzu'));
      }
      for (const object of scene.children.list) {
        const characterId = object?.getData?.('characterId');
        if (!characterId) continue;
        characters.push(stateFor(scene, object, characterId));
      }
      return {
        sceneName: scene.scene.key,
        timestamp: new Date().toISOString(),
        canvas: {
          width: scene.game.canvas.width,
          height: scene.game.canvas.height,
          clientWidth: scene.game.canvas.clientWidth,
          clientHeight: scene.game.canvas.clientHeight,
          devicePixelRatio: window.devicePixelRatio || 1,
        },
        characters,
      };
    },
  };
}
