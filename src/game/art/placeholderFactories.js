import { DEPTHS, PALETTE } from './artConfig.js';
import { createSoftShadow } from '../rendering/createSoftShadow.js';

function container(scene, x, y, depth = DEPTHS.props) {
  return scene.add.container(x, y).setDepth(depth);
}

function graphics(scene) {
  return scene.add.graphics();
}

function drawHouse(scene, x, y, {
  body = PALETTE.desertSand,
  roof = 0x8b5e34,
  trim = 0xfff7e8,
  workshop = false,
} = {}) {
  createSoftShadow(scene, x + 9, y + 54, 'large', { w: 210, h: 28, alpha: 0.16 });
  const c = container(scene, x, y, DEPTHS.buildings);
  const g = graphics(scene);

  g.fillStyle(body, 1);
  g.fillRoundedRect(-88, -18, 176, 92, 4);
  g.lineStyle(3, trim, 0.95);
  g.strokeRoundedRect(-88, -18, 176, 92, 4);
  g.lineStyle(1, 0xffffff, 0.28);
  for (let yy = -4; yy < 65; yy += 10) g.lineBetween(-78, yy, 78, yy);

  g.fillStyle(roof, 1);
  g.lineStyle(6, trim, 0.95);
  g.fillTriangle(-100, -18, 0, -86, 100, -18);
  g.strokeTriangle(-100, -18, 0, -86, 100, -18);
  g.lineStyle(1, 0x1f2937, 0.22);
  for (let i = 1; i < 7; i++) {
    const yy = -86 + i * 10;
    const half = (yy + 86) * 1.42;
    g.lineBetween(-half, yy, half, yy);
  }

  if (workshop) {
    g.fillStyle(0xe9edf0, 1);
    g.fillRoundedRect(-48, 9, 96, 56, 4);
    g.lineStyle(2, 0x94a3b8, 0.9);
    g.strokeRoundedRect(-48, 9, 96, 56, 4);
    for (let yy = 20; yy < 59; yy += 9) g.lineBetween(-42, yy, 42, yy);
  } else {
    g.fillStyle(0x5b321f, 1);
    g.fillRoundedRect(-15, 21, 30, 53, 3);
    g.fillStyle(0xfacc15, 1);
    g.fillCircle(9, 47, 3);
    drawWindow(g, -52, 12);
    drawWindow(g, 52, 12);
  }

  drawShrubs(g, -77, 72, 9);
  drawShrubs(g, 77, 72, 9);
  c.add(g);
  return c;
}

function drawWindow(g, x, y) {
  g.fillStyle(0xbbe5ff, 0.96);
  g.fillRoundedRect(x - 15, y - 13, 30, 26, 2);
  g.lineStyle(2, 0xf8fafc, 0.95);
  g.strokeRoundedRect(x - 15, y - 13, 30, 26, 2);
  g.lineStyle(1, 0x5087a6, 0.75);
  g.lineBetween(x, y - 11, x, y + 11);
  g.lineBetween(x - 13, y, x + 13, y);
  g.fillStyle(0x6aa33b, 1);
  g.fillRoundedRect(x - 18, y + 16, 36, 7, 3);
  g.fillStyle(0xf97316, 0.9);
  g.fillCircle(x - 8, y + 18, 2);
  g.fillCircle(x + 9, y + 18, 2);
}

function drawShrubs(g, x, y, count = 5) {
  for (let i = 0; i < count; i++) {
    const dx = x + (i - count / 2) * 13;
    g.fillStyle(i % 2 ? 0x4f8f32 : 0x6aa33b, 1);
    g.fillCircle(dx, y + (i % 2) * 3, 10);
  }
}

export function createZuzuPlaceholder(scene, x, y, options = {}) {
  const scale = options.scale ?? 1;
  createSoftShadow(scene, x, y + 28 * scale, 'small', { w: 34 * scale, h: 11 * scale });
  const c = container(scene, x, y, DEPTHS.characters).setScale(scale);
  const g = graphics(scene);
  const helmet = options.helmet !== false;
  const outfit = options.outfit || 'default_adventure';
  const shirt = outfit === 'school_navy' ? 0x1f3a5f : outfit === 'bike_mode' ? 0x2563eb : 0xfff2bd;
  const shorts = outfit === 'school_navy' ? 0x111827 : 0x0b4f8f;

  g.fillStyle(shorts, 1);
  g.fillRoundedRect(-9, 8, 8, 15, 2);
  g.fillRoundedRect(1, 8, 8, 15, 2);
  if (outfit !== 'school_navy') {
    g.fillStyle(0x22d3ee, 0.9);
    g.fillTriangle(-8, 11, -2, 13, -7, 16);
    g.fillTriangle(2, 11, 8, 10, 5, 16);
  }
  g.fillStyle(0x1e3a5f, 1);
  g.fillRoundedRect(-10, 22, 11, 6, 3);
  g.fillRoundedRect(0, 22, 11, 6, 3);
  g.fillStyle(0x22d3ee, 0.95);
  g.fillRoundedRect(-9, 22, 7, 3, 2);
  g.fillRoundedRect(3, 22, 7, 3, 2);

  g.fillStyle(0xf0a77b, 1);
  g.fillRoundedRect(-16, -4, 6, 16, 3);
  g.fillRoundedRect(10, -4, 6, 16, 3);
  g.fillStyle(0xfacc15, 1);
  g.fillRoundedRect(-16, 4, 6, 3, 1);
  g.fillStyle(0x22d3ee, 1);
  g.fillRoundedRect(10, 4, 6, 3, 1);

  g.fillStyle(shirt, 1);
  g.fillRoundedRect(-11, -10, 22, 22, 4);
  if (outfit !== 'school_navy') {
    g.fillStyle(0xf6b425, 0.82);
    g.fillEllipse(-4, -4, 11, 6);
    g.fillEllipse(5, 3, 12, 6);
  }
  g.lineStyle(1.5, outfit === 'school_navy' ? 0x0f172a : 0xd97706, 0.75);
  g.strokeRoundedRect(-11, -10, 22, 22, 4);

  g.fillStyle(0xf0a77b, 1);
  g.fillCircle(0, -20, 10);
  g.fillStyle(0x5b2c18, 1);
  g.fillRoundedRect(-8, -25, 16, 8, 4);
  if (helmet) {
    g.fillStyle(0x111827, 1);
    g.fillRoundedRect(-13, -26, 26, 5, 3);
    g.fillStyle(0xef2f2f, 1);
    g.beginPath();
    g.arc(0, -25, 12, Math.PI, 0, false);
    g.closePath();
    g.fillPath();
    g.fillStyle(0x1f2937, 1);
    g.fillRoundedRect(-8, -31, 3, 7, 2);
    g.fillRoundedRect(-1.5, -32, 3, 8, 2);
    g.fillRoundedRect(5, -31, 3, 7, 2);
  }
  g.fillStyle(0x2b160c, 1);
  g.fillCircle(-3.7, -20, 2.2);
  g.fillCircle(3.7, -20, 2.2);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(-2.8, -20.8, 0.65);
  g.fillCircle(4.5, -20.8, 0.65);
  g.lineStyle(1.5, 0x7c2d12, 1);
  g.beginPath();
  g.arc(0, -16.5, 4, 0.15, Math.PI - 0.15, false);
  g.strokePath();

  c.add(g);
  return c;
}

export function createAdultNpcPlaceholder(scene, x, y, options = {}) {
  const c = container(scene, x, y, DEPTHS.characters);
  createSoftShadow(scene, x, y + 30, 'small', { w: 38, h: 12 });
  const g = graphics(scene);
  const shirt = options.shirt || 0xef8354;
  const skin = options.skin || 0xc98b62;
  g.fillStyle(0x4b5563, 1);
  g.fillRoundedRect(-10, 11, 8, 20, 3);
  g.fillRoundedRect(2, 11, 8, 20, 3);
  g.fillStyle(shirt, 1);
  g.fillRoundedRect(-16, -9, 32, 27, 5);
  g.fillStyle(skin, 1);
  g.fillRoundedRect(-22, -4, 7, 21, 4);
  g.fillRoundedRect(15, -4, 7, 21, 4);
  g.fillCircle(0, -25, 13);
  g.fillStyle(options.hair || 0x5b341f, 1);
  g.fillRoundedRect(-11, -38, 22, 14, 7);
  g.fillStyle(0x1f2937, 1);
  g.fillCircle(-4, -25, 1.7);
  g.fillCircle(4, -25, 1.7);
  g.lineStyle(1.5, 0x7c2d12, 0.9);
  g.beginPath();
  g.arc(0, -21, 5, 0.2, Math.PI - 0.2, false);
  g.strokePath();
  c.add(g);
  return c;
}

export function createZuzuHousePlaceholder(scene, x, y) {
  return drawHouse(scene, x, y, { body: 0xe7c98d, roof: 0x6d4c41 });
}

export function createRamirezHousePlaceholder(scene, x, y) {
  return drawHouse(scene, x, y, { body: 0xf79c8f, roof: 0xc93a2b });
}

export function createWorkshopPlaceholder(scene, x, y) {
  return drawHouse(scene, x, y, { body: 0x9dccf1, roof: 0x1557a8, workshop: true });
}

export function createMesquiteTreePlaceholder(scene, x, y) {
  createSoftShadow(scene, x + 5, y + 42, 'large', { w: 118, h: 28, alpha: 0.18 });
  const c = container(scene, x, y, DEPTHS.plantsBack);
  const g = graphics(scene);
  g.fillStyle(0x6b3d1f, 1);
  g.fillRoundedRect(-8, 6, 16, 54, 7);
  g.lineStyle(4, 0x442412, 0.55);
  g.lineBetween(0, 20, -28, 45);
  g.lineBetween(2, 22, 28, 44);
  const blobs = [[-34, -7, 26], [0, -22, 34], [34, -7, 27], [-17, 18, 30], [19, 18, 30], [0, 4, 38]];
  for (const [dx, dy, r] of blobs) {
    g.fillStyle(dx % 2 ? 0x5f9d35 : 0x6dac39, 1);
    g.fillCircle(dx, dy, r);
  }
  c.add(g);
  return c;
}

export function createCreosoteBushPlaceholder(scene, x, y) {
  createSoftShadow(scene, x, y + 18, 'medium', { w: 56, h: 14, alpha: 0.17 });
  const c = container(scene, x, y, DEPTHS.plantsFront);
  const g = graphics(scene);
  for (let i = 0; i < 7; i++) {
    g.fillStyle(i % 2 ? 0x6f8f2b : 0x789631, 1);
    g.fillCircle(-24 + i * 8, 2 + (i % 3) * 5, 14);
  }
  g.lineStyle(2, 0x49651f, 0.7);
  g.lineBetween(-20, 4, -8, 18);
  g.lineBetween(4, 4, 15, 18);
  c.add(g);
  return c;
}

export function createEphedraPlaceholder(scene, x, y) {
  const c = container(scene, x, y, DEPTHS.plantsFront);
  createSoftShadow(scene, x, y + 22, 'small');
  const g = graphics(scene);
  g.lineStyle(3, 0x7ca13d, 1);
  for (let i = -4; i <= 4; i++) g.lineBetween(0, 22, i * 5, -22 + Math.abs(i) * 2);
  g.fillStyle(0xd8b94f, 0.9);
  for (let i = -2; i <= 2; i++) g.fillCircle(i * 8, -12 + Math.abs(i) * 3, 2.3);
  c.add(g);
  return c;
}

export function createBarrelCactusPlaceholder(scene, x, y) {
  const c = container(scene, x, y, DEPTHS.plantsFront);
  createSoftShadow(scene, x, y + 20, 'small');
  const g = graphics(scene);
  g.fillStyle(0x2f7f45, 1);
  g.fillEllipse(0, 0, 26, 42);
  g.lineStyle(1, 0xb7d87a, 0.75);
  for (let i = -2; i <= 2; i++) g.lineBetween(i * 5, -17, i * 5, 18);
  g.fillStyle(0xfacc15, 1);
  g.fillCircle(0, -22, 4);
  c.add(g);
  return c;
}

export function createYuccaPlaceholder(scene, x, y) {
  return drawRosette(scene, x, y, 0x83a83f, 44, DEPTHS.plantsFront);
}

export function createAgavePlaceholder(scene, x, y) {
  return drawRosette(scene, x, y, 0x7aa8a0, 52, DEPTHS.plantsFront);
}

function drawRosette(scene, x, y, color, radius, depth) {
  const c = container(scene, x, y, depth);
  createSoftShadow(scene, x, y + 18, 'medium', { w: radius * 1.2, h: 16 });
  const g = graphics(scene);
  g.fillStyle(color, 1);
  for (let i = 0; i < 12; i++) {
    const angle = (Math.PI * 2 * i) / 12;
    const x2 = Math.cos(angle) * radius * 0.55;
    const y2 = Math.sin(angle) * radius * 0.34;
    g.fillTriangle(0, 0, x2 - 5, y2, x2 + 5, y2);
  }
  g.fillStyle(0xd6e8ae, 0.85);
  g.fillCircle(0, 0, 5);
  c.add(g);
  return c;
}

export function createDesertLavenderPlaceholder(scene, x, y) {
  const c = container(scene, x, y, DEPTHS.plantsFront);
  createSoftShadow(scene, x, y + 17, 'small');
  const g = graphics(scene);
  g.lineStyle(2, 0x567c35, 1);
  for (let i = -3; i <= 3; i++) {
    g.lineBetween(0, 18, i * 7, -18 + Math.abs(i) * 3);
    g.fillStyle(0x9b5de5, 1);
    g.fillCircle(i * 7, -18 + Math.abs(i) * 3, 4);
  }
  c.add(g);
  return c;
}

export function createPricklyPearPlaceholder(scene, x, y) {
  const c = container(scene, x, y, DEPTHS.plantsFront);
  createSoftShadow(scene, x, y + 24, 'medium');
  const g = graphics(scene);
  g.fillStyle(0x3e8f48, 1);
  g.fillEllipse(0, 2, 24, 36);
  g.fillEllipse(-15, 8, 22, 30);
  g.fillEllipse(16, 6, 22, 30);
  g.fillStyle(0xef4444, 1);
  g.fillCircle(-8, -14, 4);
  g.fillCircle(11, -9, 4);
  c.add(g);
  return c;
}

export function createJojobaPlaceholder(scene, x, y) {
  const c = createCreosoteBushPlaceholder(scene, x, y);
  c.each((child) => child.setAlpha?.(0.92));
  return c;
}

export function createAnimalPlaceholder(scene, x, y, species = 'jackrabbit') {
  const c = container(scene, x, y, DEPTHS.props);
  createSoftShadow(scene, x, y + 18, 'small', { w: species === 'coyote' ? 58 : 38, h: 10 });
  const g = graphics(scene);
  if (species === 'coyote') {
    g.fillStyle(0x8a6a45, 1);
    g.fillEllipse(0, 4, 44, 20);
    g.fillEllipse(24, -2, 18, 15);
    g.fillTriangle(20, -10, 24, -20, 28, -9);
    g.fillTriangle(30, -9, 34, -18, 36, -5);
    g.lineStyle(5, 0x5b432c, 1);
    g.lineBetween(-22, 2, -38, -8);
  } else if (species === 'javelina') {
    g.fillStyle(0x6f6656, 1);
    g.fillEllipse(0, 5, 42, 22);
    g.fillEllipse(22, 1, 17, 15);
    g.fillStyle(0x4a4338, 1);
    g.fillCircle(27, 1, 2);
    g.lineStyle(2, 0x3f382f, 1);
    g.lineBetween(-13, 15, -13, 22);
    g.lineBetween(10, 15, 10, 22);
  } else {
    g.fillStyle(0xaa7f54, 1);
    g.fillEllipse(0, 8, 28, 17);
    g.fillCircle(14, 1, 8);
    g.fillTriangle(12, -6, 9, -23, 17, -7);
    g.fillTriangle(18, -5, 20, -20, 23, -4);
    g.fillStyle(0x3b2a1b, 1);
    g.fillCircle(17, 0, 1.4);
  }
  c.add(g);
  return c;
}

export function createFlatTireBikePlaceholder(scene, x, y, options = {}) {
  const c = container(scene, x, y, DEPTHS.props);
  createSoftShadow(scene, x, y + 17, 'medium', { w: 100, h: 16 });
  const g = graphics(scene);
  const color = options.color || 0x2563eb;
  g.lineStyle(5, 0x111827, 0.85);
  g.strokeCircle(-25, 12, 19);
  g.strokeCircle(25, 12, 19);
  g.lineStyle(4, color, 1);
  g.lineBetween(-25, 12, -2, -12);
  g.lineBetween(-2, -12, 25, 12);
  g.lineBetween(-25, 12, 4, 12);
  g.lineBetween(4, 12, -2, -12);
  g.lineBetween(4, 12, 25, 12);
  g.lineStyle(3, 0x111827, 1);
  g.lineBetween(24, -5, 38, -14);
  g.lineBetween(-10, -16, -17, -28);
  g.fillStyle(0x111827, 1);
  g.fillRoundedRect(-27, -31, 23, 6, 3);
  if (options.flat !== false) {
    g.lineStyle(4, PALETTE.dangerRed, 0.95);
    g.strokeCircle(25, 12, 13);
    g.lineBetween(13, 24, 37, 0);
  }
  c.add(g);
  return c;
}

export function createBikeGpsPlaceholder(scene, x, y) {
  const c = container(scene, x, y, DEPTHS.props);
  createSoftShadow(scene, x, y + 28, 'small');
  const g = graphics(scene);
  g.lineStyle(5, 0x64748b, 1);
  g.lineBetween(0, 7, 0, 43);
  g.fillStyle(0x172033, 1);
  g.fillRoundedRect(-13, -27, 26, 42, 6);
  g.fillStyle(0x8ec5ff, 1);
  g.fillRoundedRect(-9, -22, 18, 30, 3);
  g.lineStyle(2, 0xfacc15, 1);
  g.lineBetween(-5, -1, 5, -11);
  c.add(g);
  return c;
}

export function createScorchingPavementPlaceholder(scene, x, y) {
  const c = container(scene, x, y, DEPTHS.groundDecor);
  const g = graphics(scene);
  for (let i = 0; i < 5; i++) {
    const wave = scene.add.graphics();
    wave.lineStyle(2, 0xff8a3d, 0.36);
    wave.beginPath();
    wave.moveTo(-40 + i * 20, -12);
    wave.lineTo(-34 + i * 20, -5);
    wave.lineTo(-43 + i * 20, 3);
    wave.lineTo(-36 + i * 20, 11);
    wave.strokePath();
    c.add(wave);
    scene.tweens.add({ targets: wave, alpha: 0.08, y: -8, yoyo: true, repeat: -1, duration: 900 + i * 90 });
  }
  g.fillStyle(0xff8a3d, 0.08);
  g.fillRoundedRect(-55, -18, 110, 36, 12);
  c.add(g);
  return c;
}

export function createGarageLeftSignPlaceholder(scene, x, y) {
  const c = container(scene, x, y, DEPTHS.props);
  createSoftShadow(scene, x, y + 18, 'small');
  const g = graphics(scene);
  g.fillStyle(0xfff7e8, 0.98);
  g.fillRoundedRect(-46, -14, 92, 28, 6);
  g.lineStyle(2, 0xc9a76a, 0.95);
  g.strokeRoundedRect(-46, -14, 92, 28, 6);
  c.add(g);
  c.add(scene.add.text(0, 0, '← Garage', {
    fontFamily: 'sans-serif',
    fontSize: '13px',
    fontStyle: 'bold',
    color: '#1F2937',
  }).setOrigin(0.5));
  return c;
}

export const PLACEHOLDERS = {
  createZuzuPlaceholder,
  createAdultNpcPlaceholder,
  createZuzuHousePlaceholder,
  createRamirezHousePlaceholder,
  createWorkshopPlaceholder,
  createMesquiteTreePlaceholder,
  createCreosoteBushPlaceholder,
  createEphedraPlaceholder,
  createBarrelCactusPlaceholder,
  createYuccaPlaceholder,
  createAgavePlaceholder,
  createDesertLavenderPlaceholder,
  createPricklyPearPlaceholder,
  createJojobaPlaceholder,
  createAnimalPlaceholder,
  createFlatTireBikePlaceholder,
  createBikeGpsPlaceholder,
  createScorchingPavementPlaceholder,
  createGarageLeftSignPlaceholder,
};
