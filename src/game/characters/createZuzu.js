import { DEPTHS } from '../art/artConfig.js';
import { hasAtlasFrame } from '../assets/createAtlasSprite.js';
import { createSoftShadow } from '../rendering/createSoftShadow.js';

const ZUZU_FRAMES = {
  down: 'zuzu_idle_down',
  up: 'zuzu_idle_up',
  left: 'zuzu_idle_left',
  right: 'zuzu_idle_right',
};

export function createZuzu(scene, x, y, options = {}) {
  const {
    outfit = 'default_adventure',
    helmet = true,
    scale = 1,
    interactive = false,
    label = false,
    useAtlas = true,
    shadow = true,
  } = options;

  if (useAtlas && scene.textures.exists('zuzu_atlas') && hasAtlasFrame(scene, 'zuzu_atlas', ZUZU_FRAMES.down)) {
    const sprite = scene.add.sprite(x, y, 'zuzu_atlas', ZUZU_FRAMES.down)
      .setOrigin(0.5, 1)
      .setDepth(DEPTHS.characters)
      .setScale(scale);
    if (interactive) sprite.setInteractive({ useHandCursor: true });
    const shadowObject = shadow ? createSoftShadow(scene, x, y + 4, 'small') : null;
    return {
      container: sprite,
      sprite,
      shadow: shadowObject,
      setFacing(direction) {
        const frame = ZUZU_FRAMES[direction] || ZUZU_FRAMES.down;
        if (hasAtlasFrame(scene, 'zuzu_atlas', frame)) sprite.setFrame(frame);
      },
      playWalk(direction) {
        const key = `zuzu-walk-${direction}`;
        if (scene.anims.exists(key)) sprite.play(key, true);
      },
      stop() {
        sprite.stop();
      },
      label,
    };
  }

  return createZuzuVector(scene, x, y, { outfit, helmet, scale, interactive, label, shadow });
}

function createZuzuVector(scene, x, y, { outfit, helmet, scale, interactive, shadow }) {
  const root = scene.add.container(x, y).setDepth(DEPTHS.characters).setScale(scale);
  if (interactive) root.setSize(36, 72).setInteractive({ useHandCursor: true });

  const parts = {
    leftLeg: createLeftLeg(scene, outfit),
    rightLeg: createRightLeg(scene, outfit),
    torso: createTorso(scene, outfit),
    leftArm: createLeftArm(scene),
    rightArm: createRightArm(scene),
    head: createHead(scene, helmet),
  };

  root.add([parts.leftLeg, parts.rightLeg, parts.torso, parts.leftArm, parts.rightArm, parts.head]);
  const shadowObject = shadow ? createSoftShadow(scene, x, y + 26 * scale, 'small') : null;

  return {
    container: root,
    sprite: root,
    parts,
    shadow: shadowObject,
    setFacing(direction) {
      root.setScale((direction === 'left' ? -1 : 1) * scale, scale);
    },
    playWalk() {},
    stop() {},
  };
}

function createLeftLeg(scene, outfit) {
  const g = scene.add.graphics();
  const shorts = outfit === 'school_navy' ? 0x111827 : 0x0b4f8f;
  g.fillStyle(shorts, 1);
  g.fillRoundedRect(-8, 7, 7, 13, 2);
  if (outfit !== 'school_navy') {
    g.fillStyle(0x22d3ee, 0.9);
    g.fillTriangle(-7, 10, -2, 12, -7, 15);
    g.fillStyle(0xf97316, 0.85);
    g.fillRect(-7, 16, 4, 2);
  }
  g.fillStyle(0x1e3a5f, 1);
  g.fillRoundedRect(-10, 19, 11, 6, 3);
  g.fillStyle(0x22d3ee, 0.95);
  g.fillRoundedRect(-9, 19, 7, 3, 2);
  g.lineStyle(1, 0xffffff, 0.75);
  g.lineBetween(-8, 22, 0, 22);
  return g;
}

function createRightLeg(scene, outfit) {
  const g = scene.add.graphics();
  const shorts = outfit === 'school_navy' ? 0x111827 : 0x0b4f8f;
  g.fillStyle(shorts, 1);
  g.fillRoundedRect(1, 7, 7, 13, 2);
  if (outfit !== 'school_navy') {
    g.fillStyle(0x22d3ee, 0.9);
    g.fillTriangle(2, 10, 7, 9, 5, 15);
    g.fillStyle(0xf97316, 0.85);
    g.fillRect(3, 16, 4, 2);
  }
  g.fillStyle(0x1e3a5f, 1);
  g.fillRoundedRect(0, 19, 11, 6, 3);
  g.fillStyle(0x22d3ee, 0.95);
  g.fillRoundedRect(3, 19, 7, 3, 2);
  g.lineStyle(1, 0xffffff, 0.75);
  g.lineBetween(1, 22, 9, 22);
  return g;
}

function createTorso(scene, outfit) {
  const g = scene.add.graphics();
  const school = outfit === 'school_navy';
  const bike = outfit === 'bike_mode';
  g.fillStyle(school || bike ? 0x1f3a5f : 0xfff2bd, 1);
  g.fillRoundedRect(-10, -10, 20, 20, 4);
  if (!school && !bike) {
    g.fillStyle(0xf6b425, 0.82);
    g.fillEllipse(-4, -4, 10, 5);
    g.fillEllipse(5, 2, 11, 5);
    g.fillStyle(0xf59e0b, 0.55);
    g.fillCircle(-1, 6, 3);
  }
  g.lineStyle(1.4, school || bike ? 0x0f172a : 0xd97706, 0.75);
  g.strokeRoundedRect(-10, -10, 20, 20, 4);
  g.fillStyle(school || bike ? 0x324f7a : 0xffdf7a);
  g.fillRoundedRect(-4, -11, 8, 3, 1);
  g.fillStyle(school ? 0x111827 : 0x0b4f8f);
  g.fillRoundedRect(-9, 10, 18, 5, 2);
  return g;
}

function createLeftArm(scene) {
  const g = scene.add.graphics();
  g.fillStyle(0xf0a77b, 1);
  g.fillRoundedRect(-15, -5, 5, 13, 3);
  g.fillStyle(0xfacc15, 1);
  g.fillRoundedRect(-15, 3, 5, 3, 1);
  g.fillStyle(0xf0abfc, 1);
  g.fillRoundedRect(-15, 6, 5, 2, 1);
  g.fillStyle(0xf0a77b, 1);
  g.fillCircle(-12.5, 9, 2.5);
  return g;
}

function createRightArm(scene) {
  const g = scene.add.graphics();
  g.fillStyle(0xf0a77b, 1);
  g.fillRoundedRect(10, -5, 5, 13, 3);
  g.fillStyle(0x22d3ee, 1);
  g.fillRoundedRect(10, 3, 5, 3, 1);
  g.fillStyle(0xf0abfc, 1);
  g.fillRoundedRect(10, 6, 5, 2, 1);
  g.fillStyle(0xf0a77b, 1);
  g.fillCircle(12.5, 9, 2.5);
  return g;
}

function createHead(scene, helmet) {
  const g = scene.add.graphics();
  g.fillStyle(0xf0a77b, 1);
  g.fillCircle(0, -18, 9.2);
  g.fillStyle(0x5b2c18, 1);
  g.fillRoundedRect(-8, -23, 16, 7, 4);
  g.fillTriangle(-6, -22, -9, -16, -2, -18);
  g.fillTriangle(0, -23, -3, -16, 4, -18);
  g.fillTriangle(6, -22, 2, -17, 8, -17);
  if (helmet) {
    g.fillStyle(0x111827, 1);
    g.fillRoundedRect(-12, -24, 24, 5, 3);
    g.fillStyle(0xef2f2f, 1);
    g.beginPath();
    g.arc(0, -23, 12, Math.PI, 0, false);
    g.closePath();
    g.fillPath();
    g.fillStyle(0xff5252, 1);
    g.beginPath();
    g.arc(-2, -25, 9, Math.PI, Math.PI * 1.92, false);
    g.lineTo(-2, -23);
    g.closePath();
    g.fillPath();
    g.fillStyle(0x1f2937, 1);
    g.fillRoundedRect(-8, -29, 3, 7, 2);
    g.fillRoundedRect(-1.5, -31, 3, 8, 2);
    g.fillRoundedRect(5, -29, 3, 7, 2);
    g.fillStyle(0xb91c1c, 1);
    g.fillRoundedRect(-12, -23, 24, 4, 2);
  }
  g.fillStyle(0x2b160c, 1);
  g.fillCircle(-3.6, -18, 2.3);
  g.fillCircle(3.6, -18, 2.3);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(-2.8, -18.7, 0.65);
  g.fillCircle(4.4, -18.7, 0.65);
  g.lineStyle(1.6, 0x7c2d12, 1);
  g.beginPath();
  g.arc(0, -15, 4, 0.2, Math.PI - 0.2, false);
  g.strokePath();
  if (helmet) {
    g.lineStyle(1.4, 0x111827, 1);
    g.lineBetween(-10, -20, -7, -12);
    g.lineBetween(10, -20, 7, -12);
    g.fillStyle(0x111827, 1);
    g.fillRoundedRect(-4, -12, 8, 3, 1);
  }
  return g;
}
