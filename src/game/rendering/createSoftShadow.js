import { DEPTHS } from '../art/artConfig.js';

const SHADOW_SIZE = {
  small: { w: 34, h: 10, alpha: 0.24 },
  medium: { w: 72, h: 18, alpha: 0.22 },
  large: { w: 150, h: 34, alpha: 0.18 },
};

export function createSoftShadow(scene, x, y, size = 'medium', options = {}) {
  const config = { ...SHADOW_SIZE[size], ...options };
  const key = `shadow_soft_${size}`;
  let shadow;

  if (scene.textures?.exists?.(key)) {
    shadow = scene.add.image(x, y, key);
    shadow.setDisplaySize(config.w, config.h);
    shadow.setAlpha(config.alpha);
  } else {
    shadow = scene.add.ellipse(x, y, config.w, config.h, 0x111827, config.alpha);
  }

  shadow.setDepth(options.depth ?? DEPTHS.shadows);
  return shadow;
}

export function attachShadow(scene, sprite, size = 'small', offsetY = 24, options = {}) {
  const shadow = createSoftShadow(scene, sprite.x, sprite.y + offsetY, size, options);

  const update = () => {
    if (!shadow.active || !sprite.active) return;
    shadow.setPosition(sprite.x, sprite.y + offsetY);
    if (sprite.scaleX !== undefined) shadow.setScale(Math.abs(sprite.scaleX), Math.max(Math.abs(sprite.scaleY || 1), 0.75));
  };

  scene.events.on('update', update);
  shadow.once('destroy', () => scene.events.off('update', update));

  return { shadow, update };
}
