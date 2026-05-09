import { hasAtlasFrame } from '../assets/createAtlasSprite.js';

function framesExist(scene, atlasKey, frames) {
  return scene.textures.exists(atlasKey) && frames.every((frame) => hasAtlasFrame(scene, atlasKey, frame));
}

export function registerZuzuAnimations(scene) {
  const atlas = 'zuzu_atlas';
  const walkDirections = ['down', 'up', 'left', 'right'];

  for (const direction of walkDirections) {
    const frames = [1, 2, 3, 4].map((i) => `zuzu_walk_${direction}_${String(i).padStart(2, '0')}`);
    const key = `zuzu-walk-${direction}`;
    if (!scene.anims.exists(key) && framesExist(scene, atlas, frames)) {
      scene.anims.create({
        key,
        frames: frames.map((frame) => ({ key: atlas, frame })),
        frameRate: 8,
        repeat: -1,
      });
    }
  }

  const idleFrame = 'zuzu_idle_down';
  if (!scene.anims.exists('zuzu-idle-down') && hasAtlasFrame(scene, atlas, idleFrame)) {
    scene.anims.create({
      key: 'zuzu-idle-down',
      frames: [{ key: atlas, frame: idleFrame }],
      frameRate: 1,
      repeat: 0,
    });
  }

  if (!scene.anims.exists('zuzu-bike') && hasAtlasFrame(scene, atlas, 'zuzu_bike_idle')) {
    scene.anims.create({
      key: 'zuzu-bike',
      frames: [{ key: atlas, frame: 'zuzu_bike_idle' }],
      frameRate: 1,
      repeat: 0,
    });
  }
}

export function registerNPCAnimations(scene) {
  const atlas = 'neighborhood_atlas';
  if (!scene.anims.exists('npc-idle') && hasAtlasFrame(scene, atlas, 'npc_mr_chen_idle')) {
    scene.anims.create({
      key: 'npc-idle',
      frames: [{ key: atlas, frame: 'npc_mr_chen_idle' }],
      frameRate: 1,
      repeat: 0,
    });
  }
}
