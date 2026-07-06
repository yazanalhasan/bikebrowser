import Phaser from 'phaser';
import { obstacleById } from '../../data/act1/skateparkObstacles.js';
import { SkateParkSystem } from '../systems/skatepark/SkateParkSystem.js';
import { SkateFeelSystem, TRICK_INPUTS } from '../systems/skatepark/SkateFeelSystem.js';

// SkateScene — Phase 3 BMX riding prototype (side-view arcade physics). The
// neighborhood is top-down; the skate park RIDE is its own scene, mounted modally
// via `skate:start` (the same pattern as Prediction/Bridge/Crossing). Physics are
// understandable, not realistic: flat ground + ride/accelerate/brake/jump, and
// ramps that convert your SPEED into a launch (a trajectory the Physics Goggles
// predict). Fail is safe — a bail + respawn, never a death.
//
// Built from the data-driven `skateparkLevel1` layout (public/layouts/), reusing
// each obstacle's `material` + `surfaceFriction` from the catalog. Production art is
// human-gated (visual bible); shapes here are procedural placeholders.

const GROUND_Y = 520;
const GRAVITY = 900;
const ACCEL = 620;
const MAX_SPEED = 520;
const JUMP = 430;
const GROUND_DRAG = 380;
const LAUNCH_MIN_SPEED = 150;   // need momentum to get air off a ramp
const FAIL_VY = 560;            // slam this hard on landing -> bail (safe)
const PARK_SURFACE = 0x4c5560;
const PARK_SURFACE_DARK = 0x26313b;
const PARK_MARKING = 0xf0c45c;
const COPING = 0xe8eef2;
const SKY_TOP = 0xbadfed;
const SKY_MID = 0xe8f0de;
const SKY_HORIZON = 0xf2d49c;
const LABEL_BG = 0x1a2630;
const LABEL_TEXT = '#eef5f2';
const WARNING = 0xd78b2f;
const RIDER_SCALE = 2;
const PLAYER_BODY = { w: 68, h: 64, y: GROUND_Y - 32 };
const RIDER_SPRITES = {
  bike: {
    idle: 'skate_rider_bmx_idle',
    crouch: 'skate_rider_bmx_crouch',
    air: 'skate_rider_bmx_air',
  },
  skateboard: {
    idle: 'skate_rider_skate_idle',
    crouch: 'skate_rider_skate_crouch',
    air: 'skate_rider_skate_air',
  },
};
const MAT_COLOR = {
  pine: 0xd2a062, concrete: 0xb3ac9c, steel: 0xc1c7d0, carbon_fiber: 0x33373d,
  balsa: 0xe7d6a2, brick: 0xb15538, iron: 0x8a8c92, bamboo: 0xc4cf72,
};

export default class SkateScene extends Phaser.Scene {
  constructor() { super('SkateScene'); }

  preload() {
    this.load.image('skate_rider_bmx_idle', '/assets/skatepark/rider_bmx_idle.png');
    this.load.image('skate_rider_bmx_crouch', '/assets/skatepark/rider_bmx_crouch.png');
    this.load.image('skate_rider_bmx_air', '/assets/skatepark/rider_bmx_air.png');
    this.load.image('skate_rider_skate_idle', '/assets/skatepark/rider_skate_idle.png');
    this.load.image('skate_rider_skate_crouch', '/assets/skatepark/rider_skate_crouch.png');
    this.load.image('skate_rider_skate_air', '/assets/skatepark/rider_skate_air.png');
  }

  create() {
    this.running = false;
    this.goggles = false;
    this.wasInAir = false;
    this.lastSafeX = 120;
    this.bailUntil = 0;
    this.airFrames = 0;
    this.worldWidth = 1600;
    this.feel = new SkateFeelSystem();
    this.vehicleMode = 'bike';

    this.physics.world.gravity.y = GRAVITY;
    this.physics.world.setBounds(0, 0, this.worldWidth, 720);

    // Flat illustrated backdrop: the skate park reads as an annotated diagram,
    // not as vector props pasted onto painterly concept art.
    this.sky = this.add.graphics().setScrollFactor(0).setDepth(0).setVisible(false);
    this.glow = this.add.graphics().setScrollFactor(0).setDepth(1).setVisible(false);

    this.worldLayer = this.add.container(0, 0).setVisible(false);
    this.gogglesGfx = this.add.graphics().setDepth(900).setVisible(false);

    this.platforms = this.physics.add.staticGroup();

    // HUD (screen-fixed)
    this.hud = this.add.container(0, 0).setScrollFactor(0).setDepth(1000).setVisible(false);
    this.readoutPanel = this.add.rectangle(16, 14, 214, 120, 0x16232d, 0.88).setOrigin(0, 0).setStrokeStyle(2, 0x7fb1bc, 0.72);
    this.questPanel = this.add.rectangle(640, 20, 820, 74, 0xf4ead7, 0.88).setOrigin(0.5, 0).setStrokeStyle(2, 0x39515a, 0.22);
    this.flowPanel = this.add.rectangle(1274, 14, 188, 82, 0xf4ead7, 0.9).setOrigin(1, 0).setStrokeStyle(2, 0x39515a, 0.22);
    this.hintPanel = this.add.rectangle(640, 676, 820, 34, 0x17242e, 0.78).setOrigin(0.5, 0).setStrokeStyle(1, 0xffffff, 0.12);
    this.title = this.add.text(640, 22, 'Neighborhood Skate Park', { fontFamily: 'Georgia, serif', fontSize: '20px', color: '#25313a', fontStyle: 'bold' }).setOrigin(0.5, 0);
    this.readout = this.add.text(28, 24, '', { fontFamily: 'Arial', fontSize: '13px', color: '#e7f1f2' });
    this.hint = this.add.text(640, 694, 'D ride · A brake · S crouch/pump · Space ollie · C kickflip · E shuv · F grab · V bike/skateboard · G goggles · Esc leave', { fontFamily: 'Arial', fontSize: '13px', color: '#dceaf1' }).setOrigin(0.5, 1);
    this.feedback = this.add.text(640, 120, '', { fontFamily: 'Georgia, serif', fontSize: '22px', color: '#2f6b2a', fontStyle: 'bold' }).setOrigin(0.5);
    // Reasoning quest banner + live Flow meter (Phase 4).
    this.questText = this.add.text(640, 52, '', { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#33424b', align: 'center', wordWrap: { width: 760 } }).setOrigin(0.5, 0);
    this.flowLabel = this.add.text(1262, 18, '', { fontFamily: 'Arial', fontSize: '14px', color: '#25313a', fontStyle: 'bold' }).setOrigin(1, 0);
    this.flowBarBg = this.add.rectangle(1262, 42, 160, 10, 0x000000, 0.18).setOrigin(1, 0);
    this.flowBar = this.add.rectangle(1262 - 160, 42, 2, 10, 0x2f8b3a, 1).setOrigin(0, 0);
    this.styleLabel = this.add.text(1262, 56, '', { fontFamily: 'Arial', fontSize: '13px', color: '#25313a', fontStyle: 'bold' }).setOrigin(1, 0);
    this.styleBarBg = this.add.rectangle(1262, 78, 160, 8, 0x000000, 0.2).setOrigin(1, 0);
    this.styleBar = this.add.rectangle(1262 - 160, 78, 2, 8, 0x49c6c0, 1).setOrigin(0, 0);
    this.hud.add([this.readoutPanel, this.questPanel, this.flowPanel, this.hintPanel, this.title, this.readout, this.hint, this.feedback, this.questText, this.flowLabel, this.flowBarBg, this.flowBar, this.styleLabel, this.styleBarBg, this.styleBar]);
    this.readoutPanel.setVisible(false);
    this.readout.setVisible(false);

    this.keys = this.input.keyboard.addKeys('W,A,S,D,C,E,F,V,SPACE,G,LEFT,RIGHT,UP,DOWN');

    this.registry.events.on('skate:start', () => this.startFlow());
    this.keyHandler = (event) => this.onKey(event);
    window.addEventListener('keydown', this.keyHandler);
    this.events.once('shutdown', () => window.removeEventListener('keydown', this.keyHandler));
    this._publish();
  }

  startFlow() {
    if (this.running) return;
    this.registry.set('modalActive', true);
    this.running = true;
    this._hiddenSceneKeys = this.scene.manager.getScenes(true)
      .filter((scene) => scene.scene.key !== 'SkateScene' && scene.scene.settings.visible)
      .map((scene) => scene.scene.key);
    this._hiddenSceneKeys.forEach((key) => this.scene.manager.getScene(key)?.scene.setVisible(false));
    this.scene.bringToTop();
    this.bailUntil = 0;
    this.feedback.setText('');
    // Per-run telemetry (Phase 4) — drives flow_score + reasoning-quest checks.
    this.run = {
      maxSpeed: 0, avgAccum: 0, samples: 0, bails: 0, progress: 0, reachedFlag: false,
      usedRamp: false, usedQuarter: false, rodeSteel: false, rodeConcrete: false,
      rampDist: 0, quarterDist: 0, launchX: null, launchType: null, recorded: false,
      tricks: [], grinds: 0, bestCombo: 0, style: 0,
    };
    this.feel.reset();
    this.prediction = null; // prediction quest: 'ramp' | 'quarter'
    this._refreshQuestBanner();
    this._buildLevel();
    this._spawnPlayer();
    [this.sky, this.glow, this.worldLayer, this.hud].forEach((o) => o.setVisible(true));
    this.gogglesGfx.setVisible(this.goggles);
    this.cameras.main.setBounds(0, 0, this.worldWidth, 720);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this._publish();
  }

  _buildLevel() {
    this.worldLayer.removeAll(true);
    this.platforms.clear(true, true);
    this.ramps = [];
    this.pumps = [];
    this.rails = [];
    this.materialZones = []; // ride-over obstacles, tagged by material (friction experiment)
    if (this.playerArt) this.playerArt.clear();
    if (this.fxLayer) this.fxLayer.clear();

    const layout = this.cache.json.get('skateparkLevel1') || { obstacles: [], ground: { friction: 0.6 } };
    this.worldWidth = Math.max(1740, ...(layout.obstacles || []).map((o) => o.x + 360));
    this.physics.world.setBounds(0, 0, this.worldWidth, 720);
    this.groundFriction = layout.ground?.friction ?? 0.6;

    this._drawFlatSky();
    this._drawGroundDiagram();
    this._drawSkateboardRack(220, GROUND_Y - 10);
    this.platforms.add(this.add.rectangle(this.worldWidth / 2, GROUND_Y + 8, this.worldWidth, 16, 0x000000, 0));

    for (const inst of layout.obstacles || []) {
      if (inst.condition === 'missing') { this._drawMissing(inst.x); continue; }
      const def = obstacleById(inst.obstacle);
      if (!def) continue;
      const color = MAT_COLOR[def.material] ?? 0xb98a4a;
      const cracked = inst.condition === 'cracked';
      const temp = inst.condition === 'temporary';
      const alpha = temp ? 0.7 : 1;

      if (def.type === 'ramp') {
        this._drawLaunchRamp(inst, def, color, alpha, temp);
      } else if (def.type === 'transition') {
        this._drawQuarterPipe(inst, def, color, alpha, cracked);
      } else if (def.type === 'pump') {
        this._drawPumpSegment(inst, def, color, alpha);
      } else {
        this._drawRidePlatform(inst, def, color, alpha);
      }
      this._addMaterialLabel(inst.x, def, layout.obstacles.indexOf(inst));
    }
    // a finish flag
    this.worldLayer.add(this.add.rectangle(this.worldWidth - 80, GROUND_Y - 40, 6, 80, 0x333).setDepth(4));
    this.worldLayer.add(this.add.triangle(this.worldWidth - 80, GROUND_Y - 76, 0, 0, 36, 10, 0, 20, 0xe05a3a).setOrigin(0, 0).setDepth(4));
  }

  _drawFlatSky() {
    const sky = this.sky;
    const glow = this.glow;
    if (!sky || !glow) return;
    sky.clear();
    sky.fillStyle(SKY_TOP, 1).fillRect(0, 0, 1280, 230);
    sky.fillStyle(SKY_MID, 1).fillRect(0, 230, 1280, 190);
    sky.fillStyle(SKY_HORIZON, 1).fillRect(0, 420, 1280, 300);
    sky.fillStyle(0xffe083, 1).fillCircle(1130, 118, 38);
    sky.fillStyle(0xffffff, 0.9)
      .fillEllipse(170, 154, 110, 22)
      .fillEllipse(220, 146, 70, 18)
      .fillEllipse(824, 118, 134, 24)
      .fillEllipse(892, 126, 76, 16);
    sky.fillStyle(0x9ebed0, 0.34).fillRect(0, 418, 1280, 5);
    glow.clear();
    glow.fillStyle(0xd0e7ea, 0.26).fillRect(0, 340, 1280, 110);
  }

  _drawGroundDiagram() {
    const deck = this.add.graphics().setDepth(2);
    deck.fillStyle(0x5a6670, 1).fillRect(0, GROUND_Y + 8, this.worldWidth, 130);
    deck.fillStyle(0x34414a, 1).fillRect(0, GROUND_Y - 3, this.worldWidth, 17);
    deck.fillStyle(0x1d2730, 0.38).fillRect(0, GROUND_Y + 128, this.worldWidth, 28);
    deck.fillStyle(PARK_MARKING, 0.84).fillRect(0, GROUND_Y - 3, this.worldWidth, 4);
    deck.lineStyle(1, 0x7f8b93, 0.42);
    for (let x = 56; x < this.worldWidth; x += 96) {
      deck.lineBetween(x, GROUND_Y + 28, x + 54, GROUND_Y + 28);
      deck.lineBetween(x + 14, GROUND_Y + 66, x + 92, GROUND_Y + 66);
    }
    deck.lineStyle(1, 0x2d3942, 0.34);
    for (let x = 120; x < this.worldWidth; x += 260) {
      deck.lineBetween(x, GROUND_Y + 52, x + 36, GROUND_Y + 47);
      deck.lineBetween(x + 36, GROUND_Y + 47, x + 74, GROUND_Y + 56);
    }
    this.worldLayer.add(deck);
  }

  _materialPalette(material, base) {
    if (material === 'pine') return { base, edge: 0x8f6235, light: 0xf1cc84, dark: 0x6d4928 };
    if (material === 'steel') return { base: 0xbfc9d1, edge: 0x44515b, light: 0xf5fbff, dark: 0x6b7780 };
    if (material === 'concrete') return { base: 0xb7b3a8, edge: 0x6e6f6a, light: 0xd7d3c7, dark: 0x89877f };
    return { base, edge: 0x2a2118, light: 0xffffff, dark: 0x2a2118 };
  }

  _strokeMaterialTexture(g, material, x, y, w, h, alpha = 1) {
    if (material === 'pine') {
      g.lineStyle(1, 0x7b542f, 0.38 * alpha);
      for (let yy = y + 8; yy < y + h - 2; yy += 9) g.lineBetween(x + 8, yy, x + w - 8, yy + Phaser.Math.Between(-1, 1));
      g.lineStyle(2, 0xf4d18a, 0.32 * alpha).lineBetween(x + 14, y + 7, x + w - 18, y + 4);
      return;
    }
    if (material === 'steel') {
      g.lineStyle(2, 0xf5fbff, 0.56 * alpha).lineBetween(x + 8, y + 5, x + w - 8, y + 5);
      g.lineStyle(1, 0x74828c, 0.55 * alpha);
      for (let xx = x + 22; xx < x + w; xx += 28) g.lineBetween(xx, y + 3, xx - 14, y + h - 3);
      return;
    }
    if (material === 'concrete') {
      g.lineStyle(1, 0x7f817c, 0.42 * alpha);
      for (let xx = x + 16; xx < x + w - 6; xx += 34) {
        g.lineBetween(xx, y + 7, xx + 12, y + 4);
        g.lineBetween(xx + 12, y + 4, xx + 20, y + 9);
      }
      g.fillStyle(0x7c807d, 0.22 * alpha);
      for (let i = 0; i < Math.max(3, w / 40); i += 1) g.fillCircle(x + 12 + i * 36, y + h - 6 - (i % 2) * 5, 1.4);
    }
  }

  _drawLaunchRamp(inst, def, color, alpha, temporary) {
    const x = inst.x; const w = def.width + 34; const h = def.height + 22;
    const p = this._materialPalette(def.material, color);
    const g = this.add.graphics().setDepth(4);
    g.fillStyle(0x22303a, 0.18).fillEllipse(x + w * 0.5, GROUND_Y + 8, w + 28, 16);
    g.fillStyle(p.base, alpha).fillTriangle(x, GROUND_Y, x + w, GROUND_Y, x + w - 10, GROUND_Y - h);
    g.lineStyle(5, p.edge, 0.8).lineBetween(x + 10, GROUND_Y - 3, x + w - 12, GROUND_Y - h + 5);
    g.lineStyle(3, temporary ? 0xf2c15d : COPING, 0.96).lineBetween(x + 18, GROUND_Y - 9, x + w - 16, GROUND_Y - h + 10);
    g.fillStyle(p.dark, 0.72).fillRect(x + 12, GROUND_Y - 6, w - 20, 7);
    this._strokeMaterialTexture(g, def.material, x + 14, GROUND_Y - h + 12, w - 34, h - 14, alpha);
    g.lineStyle(3, PARK_MARKING, 0.95).lineBetween(x + w - 38, GROUND_Y - h + 18, x + w - 14, GROUND_Y - h + 4);
    g.lineStyle(2, 0xffffff, 0.75).strokeTriangle(x + w - 28, GROUND_Y - h + 2, x + w - 6, GROUND_Y - h - 8, x + w - 16, GROUND_Y - h + 15);
    this.worldLayer.add(g);
    this.ramps.push({ x: x + w - 34, x2: x + w + 10, angle: def.angle, friction: def.surfaceFriction, name: def.displayName });
  }

  _drawQuarterPipe(inst, def, color, alpha, cracked) {
    const x = inst.x; const r = def.radius || 82; const centerX = x - r; const centerY = GROUND_Y - r;
    const p = this._materialPalette(def.material, color);
    const g = this.add.graphics().setDepth(4);
    g.fillStyle(0x22303a, 0.18).fillEllipse(x - r * 0.5, GROUND_Y + 9, r + 52, 18);
    g.lineStyle(34, p.base, alpha);
    g.beginPath();
    g.arc(centerX, centerY, r, 0, Math.PI / 2, false);
    g.strokePath();
    g.lineStyle(4, p.edge, 0.65);
    g.beginPath();
    g.arc(centerX, centerY, r + 17, 0, Math.PI / 2, false);
    g.strokePath();
    g.lineStyle(1, p.dark, 0.36);
    for (let i = 0; i < 5; i += 1) {
      const a = Phaser.Math.DegToRad(12 + i * 14);
      g.lineBetween(centerX + Math.cos(a) * (r - 18), centerY + Math.sin(a) * (r - 18), centerX + Math.cos(a) * (r + 18), centerY + Math.sin(a) * (r + 18));
    }
    g.lineStyle(7, COPING, 1).lineBetween(x - 24, GROUND_Y - r, x + 34, GROUND_Y - r);
    g.lineStyle(2, 0xffffff, 0.88).lineBetween(x - 22, GROUND_Y - r - 4, x + 33, GROUND_Y - r - 4);
    g.fillStyle(PARK_MARKING, 0.85).fillCircle(x + 5, GROUND_Y - r, 6);
    g.lineStyle(3, PARK_MARKING, 0.95).lineBetween(x - 46, GROUND_Y - 26, x - 20, GROUND_Y - 55);
    if (cracked) {
      g.lineStyle(2, 0x9a2f1a, 0.95);
      g.lineBetween(x - 50, GROUND_Y - 54, x - 42, GROUND_Y - 37);
      g.lineBetween(x - 42, GROUND_Y - 37, x - 52, GROUND_Y - 20);
    }
    this.worldLayer.add(g);
    this.ramps.push({ x: x - 52, x2: x + 8, angle: 80, friction: def.surfaceFriction, name: def.displayName, vertical: true });
  }

  _drawPumpSegment(inst, def, color, alpha) {
    const x = inst.x; const w = def.width; const h = def.height;
    const p = this._materialPalette(def.material, color);
    const g = this.add.graphics().setDepth(4);
    const crest = [];
    for (let i = 0; i <= 18; i += 1) {
      const t = i / 18;
      const yLift = Math.sin(t * Math.PI * 2.2) * 0.34 + Math.sin(t * Math.PI) * 0.58;
      crest.push({ x: x + t * w, y: GROUND_Y - Math.max(0.12, yLift) * h });
    }
    g.fillStyle(0x22303a, 0.18).fillEllipse(x + w / 2, GROUND_Y + 8, w + 32, 16);
    g.fillStyle(p.base, alpha);
    g.beginPath();
    g.moveTo(x, GROUND_Y);
    crest.forEach((pt) => g.lineTo(pt.x, pt.y));
    g.lineTo(x + w, GROUND_Y);
    g.closePath();
    g.fillPath();
    g.lineStyle(4, p.edge, 0.72);
    g.beginPath();
    g.moveTo(crest[1].x, crest[1].y);
    crest.slice(2, -1).forEach((pt) => g.lineTo(pt.x, pt.y));
    g.strokePath();
    this._strokeMaterialTexture(g, def.material, x + 8, GROUND_Y - h, w - 16, h, alpha);
    g.lineStyle(3, PARK_MARKING, 0.9).lineBetween(x + 36, GROUND_Y - 29, x + 74, GROUND_Y - 29);
    this.worldLayer.add(g);
    this.pumps.push({ x, x2: x + w, boost: 82 });
  }

  _drawRidePlatform(inst, def, color, alpha) {
    const w = def.width; const h = Math.max(10, def.height); const x = inst.x; const topY = GROUND_Y - 28;
    const p = this._materialPalette(def.material, color);
    if (def.type === 'rail') {
      const rail = this.add.graphics().setDepth(4);
      rail.lineStyle(8, p.dark, 0.48).lineBetween(x + 11, topY - 16, x + w - 9, topY - 16);
      rail.lineStyle(7, p.base, alpha).lineBetween(x + 10, topY - 20, x + w - 10, topY - 20);
      rail.lineStyle(2, p.light, 0.9).lineBetween(x + 14, topY - 23, x + w - 14, topY - 23);
      rail.lineStyle(5, p.edge, 0.72).lineBetween(x + 24, topY - 18, x + 24, GROUND_Y - 2);
      rail.lineBetween(x + w - 24, topY - 18, x + w - 24, GROUND_Y - 2);
      this.worldLayer.add(rail);
      this.rails.push({ id: def.id, label: def.displayName, material: def.material, x1: x + 8, x2: x + w - 8, y: topY - 20 });
      this.materialZones.push({ material: def.material, x1: x, x2: x + w });
      return;
    }
    const box = this.add.graphics().setDepth(4);
    box.fillStyle(0x22303a, 0.16).fillEllipse(x + w / 2, GROUND_Y + 8, w + 30, 14);
    box.fillStyle(p.base, alpha).fillRoundedRect(x, topY - h / 2, w, h, 3);
    box.fillStyle(p.dark, 0.24).fillRect(x, topY + h * 0.12, w, h * 0.38);
    box.lineStyle(3, p.edge, 0.78).strokeRoundedRect(x, topY - h / 2, w, h, 3);
    box.fillStyle(COPING, def.material === 'steel' ? 1 : 0.9).fillRoundedRect(x - 4, topY - h / 2 - 7, w + 8, 8, 2);
    box.lineStyle(1, 0xffffff, 0.72).lineBetween(x + 5, topY - h / 2 - 9, x + w - 5, topY - h / 2 - 9);
    this._strokeMaterialTexture(box, def.material, x + 6, topY - h / 2 + 4, w - 12, h - 8, alpha);
    this.worldLayer.add(box);
    const plat = this.add.rectangle(x + w / 2, topY - h / 2, w, 10, 0x000000, 0);
    this.platforms.add(plat);
    this.materialZones.push({ material: def.material, x1: x, x2: x + w });
    if (def.material === 'steel') this.rails.push({ id: def.id, label: def.displayName, material: def.material, x1: x + 8, x2: x + w - 8, y: topY - h / 2 - 3 });
  }

  _addMaterialLabel(x, def, index = 0) {
    const shortName = def.displayName
      .replace('Small Launch Ramp', 'Launch Ramp')
      .replace('Pump Track Segment', 'Pump')
      .replace('Manual Pad', 'Manual')
      .replace('Quarter Pipe', 'Quarter');
    const label = this.add.text(x + 4, GROUND_Y + 20 + (index % 2) * 18, `${shortName} · ${def.material}`, {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: LABEL_TEXT,
      backgroundColor: 'rgba(26, 38, 48, 0.82)',
      padding: { x: 4, y: 2 },
    }).setDepth(5).setAlpha(0.86);
    this.worldLayer.add(label);
  }

  _drawMissing(x) {
    // a "missing rail" footprint — Level-1 damage storytelling.
    const g = this.add.graphics().setDepth(4);
    g.fillStyle(0x22303a, 0.18).fillEllipse(x + 72, GROUND_Y + 8, 150, 14);
    g.lineStyle(3, WARNING, 0.9);
    for (let sx = x + 4; sx < x + 130; sx += 24) g.lineBetween(sx, GROUND_Y - 30, sx + 12, GROUND_Y - 30);
    g.lineStyle(5, 0x6d4a35, 0.9).lineBetween(x + 30, GROUND_Y - 19, x + 30, GROUND_Y - 2);
    g.lineBetween(x + 110, GROUND_Y - 19, x + 110, GROUND_Y - 2);
    g.lineStyle(2, 0xf3c15d, 0.95).strokeCircle(x + 30, GROUND_Y - 30, 7).strokeCircle(x + 110, GROUND_Y - 30, 7);
    g.lineStyle(2, WARNING, 0.95).lineBetween(x + 48, GROUND_Y - 42, x + 96, GROUND_Y - 18);
    g.lineBetween(x + 96, GROUND_Y - 42, x + 48, GROUND_Y - 18);
    this.worldLayer.add(g);
    this.worldLayer.add(this.add.text(x + 18, GROUND_Y + 38, 'missing rail', {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: '#ffe6a6',
      backgroundColor: 'rgba(83, 53, 24, 0.82)',
      padding: { x: 4, y: 2 },
      fontStyle: 'bold',
    }).setDepth(5));
  }

  _drawSkateboardRack(x, y) {
    const g = this.add.graphics().setDepth(5);
    g.fillStyle(0x111820, 0.28).fillEllipse(x + 34, y + 22, 92, 13);
    g.lineStyle(4, 0x1d2a30, 0.78).lineBetween(x + 4, y + 20, x + 74, y + 20);
    g.lineStyle(4, 0x1d2a30, 0.78).lineBetween(x + 18, y + 20, x + 18, y - 18);
    g.lineBetween(x + 60, y + 20, x + 60, y - 18);
    g.fillStyle(0xf0c45c, 0.95).fillRoundedRect(x + 14, y - 32, 58, 13, 7);
    g.lineStyle(2, 0x7b5f3b, 0.9).strokeRoundedRect(x + 14, y - 32, 58, 13, 7);
    g.fillStyle(0x1d2a30, 0.95).fillCircle(x + 25, y - 14, 4).fillCircle(x + 61, y - 14, 4);
    g.fillStyle(0x49c6c0, 0.9).fillRect(x + 34, y - 30, 18, 9);
    this.worldLayer.add(g);
    this.worldLayer.add(this.add.text(x + 5, y + 30, 'skateboard', {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: '#e7edf2',
      backgroundColor: 'rgba(22, 31, 39, 0.62)',
      padding: { x: 4, y: 2 },
    }).setDepth(5).setAlpha(0.86));
  }

  _spawnPlayer() {
    if (this.player) this.player.destroy();
    if (this.playerArt) this.playerArt.destroy();
    if (this.playerSprite) this.playerSprite.destroy();
    this.player = this.add.rectangle(120, PLAYER_BODY.y, PLAYER_BODY.w, PLAYER_BODY.h, 0x49c6c0, 0.08).setDepth(8);
    this.player.setVisible(false);
    this.playerArt = this.add.graphics().setDepth(9);
    this.playerSprite = this.add.image(120, GROUND_Y + 8, RIDER_SPRITES.bike.idle)
      .setOrigin(0.5, 1)
      .setDepth(10)
      .setScale(0.54)
      .setVisible(this.textures.exists(RIDER_SPRITES.bike.idle));
    this.fxLayer = this.add.graphics().setDepth(7);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    this.player.body.setMaxVelocity(MAX_SPEED, 2000);
    this.player.body.setDragX(GROUND_DRAG);
    this.worldLayer.add([this.fxLayer, this.player, this.playerArt, this.playerSprite]);
    this.physics.add.collider(this.player, this.platforms);
    this.lastSafeX = 120;
    this.wasInAir = false;
    this._drawPlayerArt(this.player.body);
  }

  onKey(event) {
    if (!this.running) return;
    if (event.key === 'Escape') { this._finish(); return; }
    const k = (event.key || '').toLowerCase();
    if (k === 'g') { this.goggles = !this.goggles; this.gogglesGfx.setVisible(this.goggles); this._publish(); }
    if (k === 'v') { this._toggleVehicleMode(); return; }
    if (TRICK_INPUTS[event.code] || k === 'arrowup' || k === 'w') this._tryJump(event.code === 'ArrowUp' || event.code === 'KeyW' ? 'Space' : event.code);
    // Prediction quest: ◀ ramp / ▶ quarter (one-time, before testing by riding).
    if ((k === 'arrowleft' || k === 'arrowright') && !this.prediction) {
      const q = this.registry.get('act1Runtime')?.skateParkSystem?.getActiveQuest?.();
      if (q?.type === 'prediction') { this.prediction = k === 'arrowleft' ? 'ramp' : 'quarter'; this._refreshQuestBanner(); }
    }
  }

  _toggleVehicleMode() {
    const b = this.player?.body;
    const onGround = b ? (b.blocked.down || b.touching.down) : false;
    if (!onGround || this.time.now < this.bailUntil) return;
    this.vehicleMode = this.vehicleMode === 'bike' ? 'skateboard' : 'bike';
    if (b) {
      b.setDragX(this.vehicleMode === 'skateboard' ? GROUND_DRAG * 1.05 : GROUND_DRAG);
      b.setMaxVelocity(this.vehicleMode === 'skateboard' ? MAX_SPEED * 0.94 : MAX_SPEED, 2000);
    }
    this.feedback.setText(this.vehicleMode === 'skateboard' ? 'Skateboard mode' : 'BMX mode').setColor('#1d6f86');
    this._burst(this.player.x, this.player.y + PLAYER_BODY.h / 2 - 6, this.vehicleMode === 'skateboard' ? 0xf0c45c : 0x49c6c0, 12);
    this._drawPlayerArt(b);
    this._publish();
  }

  _refreshQuestBanner() {
    const sp = this.registry.get('act1Runtime')?.skateParkSystem;
    const q = sp?.getActiveQuest?.();
    if (!this.questText) return;
    if (!q) { this.questText.setText('All reasoning quests complete — free ride.'); return; }
    const predNote = q.type === 'prediction'
      ? `   [predict: ◀ ramp / ▶ quarter${this.prediction ? ` — you said ${this.prediction}` : ''}]`
      : '';
    this.questText.setText(`${q.level} · ${q.title}\n${q.prompt}${predNote}`);
  }

  // Record the finished run: flow + reasoning-quest evaluation, with evidence shown.
  _recordRun(headline) {
    if (!this.run || this.run.recorded) return;
    this.run.recorded = true;
    const sp = this.registry.get('act1Runtime')?.skateParkSystem;
    const summary = {
      flowScore: this._flow ?? 0,
      maxSpeed: Math.round(this.run.maxSpeed),
      avgSpeed: Math.round(this.run.avgAccum / Math.max(1, this.run.samples)),
      progress: this.run.progress, bails: this.run.bails, reachedFlag: this.run.reachedFlag,
      usedRamp: this.run.usedRamp, usedQuarter: this.run.usedQuarter,
      rampDist: this.run.rampDist, quarterDist: this.run.quarterDist,
      rodeSteel: this.run.rodeSteel, rodeConcrete: this.run.rodeConcrete,
      prediction: this.prediction,
      tricks: [...this.run.tricks],
      grinds: this.run.grinds,
      bestCombo: this.run.bestCombo,
      style: this.run.style,
    };
    const res = sp?.recordRun?.(summary) || { completed: [] };
    const bits = [headline];
    if (this.run.usedRamp && this.run.usedQuarter) {
      const farther = this.run.rampDist >= this.run.quarterDist ? 'angled ramp' : 'quarter pipe';
      bits.push(`Evidence: the ${farther} went farther.${this.prediction ? `  (you predicted: ${this.prediction})` : ''}`);
    }
    if (res.completed?.length) {
      const teach = sp.quests.find((q) => q.id === res.completed[0])?.teach;
      bits.push(`Quest complete! ${teach || ''}`);
      this.registry.events.emit('quest:changed');
    }
    this.feedback.setText(bits.join('\n')).setColor('#2f6b2a');
    this._refreshQuestBanner();
    this._publish();
  }

  _tryJump(code = 'Space') {
    const b = this.player?.body;
    if (!b) return;
    const onGround = b.blocked.down || b.touching.down;
    if (onGround && this.time.now > this.bailUntil) {
      const pop = this.feel.pop(code, { onGround, speed: Math.abs(b.velocity.x) });
      if (!pop.accepted) return;
      b.setVelocityY(pop.vy || -JUMP);
      b.setVelocityX(Math.min(MAX_SPEED, b.velocity.x + pop.vxBoost));
      this.player.rotation += pop.spin * 0.1;
      this.feedback.setText(pop.label).setColor('#1d6f86');
      this._burst(this.player.x, this.player.y + 10, 0x49c6c0, 8);
      if (this.run) {
        this.run.tricks.push(pop.label);
        this.run.bestCombo = Math.max(this.run.bestCombo, this.feel.state.combo);
      }
    }
  }

  update(_t, _dt) {
    if (!this.running || !this.player?.body) return;
    const b = this.player.body;
    const onGround = b.blocked.down || b.touching.down;
    const bailing = this.time.now < this.bailUntil;
    const dt = Math.max(1, _dt || 16);
    const holdingCrouch = this.keys.S.isDown || this.keys.DOWN.isDown;
    const speedAbs = Math.abs(b.velocity.x);
    const nearPump = this.pumps?.some((p) => this.player.x >= p.x - 10 && this.player.x <= p.x2 + 10) || false;
    const feel = this.feel.update({ dtMs: dt, onGround, holdingCrouch, speed: speedAbs, nearPump });

    // input (held). D rides, A brakes; ◀ ▶ are reserved for the prediction choice.
    let ax = 0;
    if (!bailing) {
      if (this.keys.D.isDown) ax = ACCEL * (holdingCrouch ? 0.65 : 1);
      else if (this.keys.A.isDown) ax = -ACCEL * 0.9;
    }
    b.setAccelerationX(ax);
    // ground friction scales with the surface you're on (data-driven feel)
    b.setDragX(onGround ? GROUND_DRAG * (0.6 + this.groundFriction) : 40);

    // ramp launch: enough forward speed over a ramp -> convert speed to air (trajectory)
    if (onGround && !bailing && b.velocity.x > LAUNCH_MIN_SPEED) {
      for (const r of this.ramps) {
        if (this.player.x >= r.x && this.player.x <= r.x2 + 6) {
          const a = Phaser.Math.DegToRad(r.angle);
          const speed = b.velocity.x;
          b.setVelocityY(-speed * Math.sin(a) * (r.vertical ? 1.5 : 1.15));
          if (r.vertical) b.setVelocityX(speed * 0.45);
          // telemetry for the prediction quest (which launch goes farther)
          this.run.launchX = this.player.x;
          this.run.launchType = r.vertical ? 'quarter' : 'ramp';
          if (r.vertical) this.run.usedQuarter = true; else this.run.usedRamp = true;
          break;
        }
      }
    }
    // pump segment: a small momentum boost (energy in)
    if (onGround && !bailing) {
      for (const p of this.pumps) {
        if (this.player.x >= p.x && this.player.x <= p.x2 && b.velocity.x > 40) {
          const pump = holdingCrouch ? this.feel.pump({ onGround, speed: b.velocity.x }) : { boost: p.boost * (dt / 1000) };
          b.setVelocityX(Math.min(MAX_SPEED, b.velocity.x + (pump.boost || p.boost * (dt / 1000))));
          if (pump.accepted) {
            this.feedback.setText('Pump boost').setColor('#1d6f86');
            this._burst(this.player.x, GROUND_Y - 8, 0xf0c45c, 6);
          }
        }
      }
    }
    this._updateGrind(b, dt, onGround, bailing);

    // air / landing
    if (!onGround) { this.wasInAir = true; this.airFrames += 1; this.player.rotation += (feel.trickSpin || (b.velocity.x > 0 ? 1 : -1) * 0.18) * (dt / 1000); }
    else {
      if (this.wasInAir) this._onLand(b);
      this.wasInAir = false; this.airFrames = 0; this.player.rotation = 0;
      if (this.time.now > this.bailUntil) this.lastSafeX = this.player.x;
    }

    // telemetry: speed, progress, and which materials you rode (friction experiment)
    const speed = Math.hypot(b.velocity.x, b.velocity.y);
    this.run.maxSpeed = Math.max(this.run.maxSpeed, speed);
    this.run.avgAccum += speed; this.run.samples += 1;
    this.run.progress = Math.max(this.run.progress, this.player.x / this.worldWidth);
    if (onGround && b.velocity.x > 30) {
      for (const z of this.materialZones || []) {
        if (this.player.x >= z.x1 && this.player.x <= z.x2) {
          if (z.material === 'steel') this.run.rodeSteel = true;
          else if (z.material === 'concrete') this.run.rodeConcrete = true;
        }
      }
    }
    // live Flow meter
    const flow = SkateParkSystem.flowFrom({ avgSpeed: this.run.avgAccum / Math.max(1, this.run.samples), progress: this.run.progress, bails: this.run.bails });
    this.run.style = Math.round(this.feel.state.style);
    this._setFlow(Math.min(100, flow + Math.round(this.feel.state.style * 0.08)));
    this._setStyle(this.feel.state.style, this.feel.state.combo, this.feel.state.trick);

    // reached the finish flag -> the run counts (records flow + reasoning quests)
    if (this.player.x > this.worldWidth - 96 && !this.run.reachedFlag) {
      this.run.reachedFlag = true;
      this._recordRun('Nice run!');
    }

    this._drawGoggles(b, onGround);
    this._drawFx(b, onGround);
    this._drawPlayerArt(b);
    this._updateReadout(b, onGround);
    this._publish();
  }

  _setFlow(flow) {
    this._flow = flow;
    if (this.flowLabel) this.flowLabel.setText(`Flow ${flow}`);
    if (this.flowBar) {
      this.flowBar.width = Math.max(2, 160 * Math.min(1, flow / 100));
      this.flowBar.fillColor = flow >= 60 ? 0x2f8b3a : flow >= 35 ? 0xb0892a : 0x9a4a2a;
    }
  }

  _setStyle(style, combo, trick) {
    const s = Math.round(style || 0);
    if (this.styleLabel) this.styleLabel.setText(`${trick ? `${trick} · ` : ''}Style ${s}${combo ? `  x${combo}` : ''}`);
    if (this.styleBar) {
      this.styleBar.width = Math.max(2, 160 * Math.min(1, s / 100));
      this.styleBar.fillColor = s >= 70 ? 0x49c6c0 : s >= 35 ? 0xf0c45c : 0x7aa0b2;
    }
  }

  _updateGrind(b, dt, onGround, bailing) {
    if (!b || bailing) return;
    const current = this.feel.state.grind;
    if (current) {
      const rail = this.rails.find((r) => r.id === current.id && this.player.x >= r.x1 && this.player.x <= r.x2);
      if (!rail) {
        const ended = this.feel.endGrind();
        b.setAllowGravity(true);
        b.setVelocityY(-90);
        if (ended.ms > 180 && this.run) {
          this.run.grinds += 1;
          this.run.bestCombo = Math.max(this.run.bestCombo, this.feel.state.combo);
        }
        return;
      }
      b.setAllowGravity(false);
      b.setVelocityY(0);
      this.player.y = rail.y - PLAYER_BODY.h / 2 + 2;
      b.setVelocityX(Math.max(150, Math.min(MAX_SPEED, b.velocity.x + 10 * (dt / 1000))));
      this.feel.updateGrind(dt);
      this.run.rodeSteel = this.run.rodeSteel || rail.material === 'steel';
      this.run.rodeConcrete = this.run.rodeConcrete || rail.material === 'concrete';
      if (Math.random() < 0.45) this._burst(this.player.x - 12, rail.y + 3, 0xf0c45c, 2);
      return;
    }

    if (onGround || b.velocity.y < -10) return;
    const contactY = this.player.y + PLAYER_BODY.h / 2;
    const rail = this.rails.find((r) => this.player.x >= r.x1 - 8 && this.player.x <= r.x2 + 8 && Math.abs(contactY - r.y) < 42);
    const start = this.feel.tryStartGrind({ rail, speed: Math.abs(b.velocity.x), y: contactY, railY: rail?.y });
    if (start.accepted) {
      b.setAllowGravity(false);
      b.setVelocityY(0);
      this.player.y = rail.y - PLAYER_BODY.h / 2 + 2;
      this.feedback.setText(`${start.label} grind`).setColor('#1d6f86');
      this._burst(this.player.x, rail.y + 4, 0xf0c45c, 12);
    }
  }

  _onLand(b) {
    // record the jump distance, tagged by the launch used (prediction quest).
    if (this.run?.launchX != null) {
      const dist = Math.max(0, Math.round(this.player.x - this.run.launchX));
      if (this.run.launchType === 'quarter') this.run.quarterDist = Math.max(this.run.quarterDist, dist);
      else this.run.rampDist = Math.max(this.run.rampDist, dist);
      this.run.launchX = null; this.run.launchType = null;
    }
    const impact = Math.abs(b.velocity.y);
    const landed = this.feel.land({ impact, rotation: this.player.rotation });
    if (impact > FAIL_VY || Math.abs(this.player.rotation) > 1.2 || !landed.clean) {
      // bail — safe: brief tumble, respawn at last safe spot. Never a death.
      if (this.run) this.run.bails += 1;
      this.bailUntil = this.time.now + 700;
      this.feedback.setText('Bail! Shake it off…').setColor('#9a4a2a');
      this.tweens.add({ targets: this.player, angle: this.player.angle + 240, duration: 500 });
      this.time.delayedCall(700, () => {
        if (!this.running) return;
        this.player.setPosition(this.lastSafeX, PLAYER_BODY.y).setAngle(0).setRotation(0);
        this.player.body.setAllowGravity(true);
        this.player.body.setVelocity(0, 0);
        this.feedback.setText('');
      });
    } else if (this.airFrames > 14) {
      const last = this.run?.tricks?.at?.(-1);
      this.feedback.setText(last && last !== 'Ollie' ? `${last} landed clean! ✓` : 'Clean landing! ✓').setColor('#2f6b2a');
      this._burst(this.player.x, GROUND_Y - 6, 0x49c6c0, 10);
      this.time.delayedCall(900, () => { if (this.feedback.text.includes('landing') || this.feedback.text.includes('landed')) this.feedback.setText(''); });
    }
  }

  _burst(x, y, color, count = 6) {
    if (!this.fxLayer) return;
    for (let i = 0; i < count; i += 1) {
      const dot = this.add.circle(x, y, Phaser.Math.Between(2, 4), color, Phaser.Math.FloatBetween(0.55, 0.95)).setDepth(7);
      this.worldLayer.add(dot);
      this.tweens.add({
        targets: dot,
        x: x + Phaser.Math.Between(-34, 28),
        y: y + Phaser.Math.Between(-28, 16),
        alpha: 0,
        scale: 0.25,
        duration: Phaser.Math.Between(260, 520),
        ease: 'Quad.easeOut',
        onComplete: () => dot.destroy(),
      });
    }
  }

  _drawFx(b, onGround) {
    if (!this.fxLayer || !this.player) return;
    const g = this.fxLayer;
    g.clear();
    const speed = Math.abs(b.velocity.x);
    if (speed > 80) {
      g.lineStyle(2, 0x9ddce5, Math.min(0.42, speed / 1100));
      g.lineBetween(this.player.x - 42, this.player.y + 16, this.player.x - 15, this.player.y + 16);
      if (speed > 280) g.lineBetween(this.player.x - 70, this.player.y + 23, this.player.x - 26, this.player.y + 23);
    }
    if (onGround && this.feel.state.crouch > 0.1) {
      g.lineStyle(3, 0xf0c45c, 0.5 + this.feel.state.crouch * 0.35);
      g.strokeCircle(this.player.x, GROUND_Y - 5, 16 + 10 * this.feel.state.crouch);
    }
    if (this.feel.state.grind) {
      g.lineStyle(2, 0xf0c45c, 0.85);
      g.lineBetween(this.player.x - 22, this.player.y + 16, this.player.x - 3, this.player.y + 19);
    }
  }

  // Physics Goggles: see the concepts before reading them.
  _drawGoggles(b, onGround) {
    const g = this.gogglesGfx;
    g.clear();
    if (!this.goggles) return;
    const px = this.player.x; const py = this.player.y;
    // velocity vector
    g.lineStyle(3, 0x1166cc, 0.9);
    g.lineBetween(px, py, px + b.velocity.x * 0.18, py + b.velocity.y * 0.18);
    g.fillStyle(0x1166cc, 1).fillCircle(px + b.velocity.x * 0.18, py + b.velocity.y * 0.18, 4);
    // predicted trajectory (projectile under gravity), landing marker
    g.lineStyle(2, 0xe0a93a, 0.9);
    let sx = px; let sy = py; let vx = b.velocity.x; let vy = b.velocity.y; const dt = 1 / 60;
    g.beginPath(); g.moveTo(sx, sy);
    for (let i = 0; i < 120; i += 1) {
      vy += GRAVITY * dt; sx += vx * dt; sy += vy * dt;
      g.lineTo(sx, sy);
      if (sy >= GROUND_Y - 14 && vy > 0) { g.strokePath(); g.fillStyle(0xe0a93a, 0.9).fillCircle(sx, GROUND_Y - 12, 6); g.lineStyle(2, 0xe0a93a, 0.5); g.strokeCircle(sx, GROUND_Y - 12, 10); break; }
      if (sx > this.worldWidth || i === 119) { g.strokePath(); break; }
    }
    // friction loss bar under the player (longer = more grip slowing you)
    if (onGround) {
      g.fillStyle(0x9a2f1a, 0.7).fillRect(px - 18, py + 20, 36 * Math.min(1, this.groundFriction), 4);
    }
  }

  _updateReadout(b, onGround) {
    const showDebug = Boolean(this.goggles);
    this.readoutPanel?.setVisible(showDebug);
    this.readout?.setVisible(showDebug);
    if (!showDebug) return;
    const speed = Math.round(Math.hypot(b.velocity.x, b.velocity.y));
    const momentum = Math.round(speed * 1.0); // mass ~1 (understandable, not realistic)
    this.readout.setText([
      `mode: ${this.vehicleMode === 'skateboard' ? 'skateboard' : 'BMX'}`,
      `speed: ${speed}`,
      `velocity: x ${Math.round(b.velocity.x)}  y ${Math.round(b.velocity.y)}`,
      `momentum: ${momentum}`,
      `${onGround ? `grip (friction): ${this.groundFriction.toFixed(2)}` : 'in air — gravity only'}`,
      `goggles: ${this.goggles ? 'ON (G)' : 'off (G)'}`,
    ].join('\n'));
  }

  _drawPlayerArt(b) {
    if (!this.playerArt || !this.player) return;
    const g = this.playerArt;
    const x = this.player.x;
    const speedRatio = Phaser.Math.Clamp((b?.velocity.x || 0) / MAX_SPEED, -1, 1);
    const onGround = b ? (b.blocked.down || b.touching.down) : true;
    const isTrickAir = this.feel?.state?.trick && this.feel.state.trick !== 'grind';
    const pose = !onGround || isTrickAir ? 'air' : this.feel?.state?.crouch > 0.2 ? 'crouch' : 'idle';
    const spriteKey = RIDER_SPRITES[this.vehicleMode]?.[pose] || RIDER_SPRITES.bike.idle;

    g.clear();
    g.fillStyle(0x071018, onGround ? 0.28 : 0.16).fillEllipse(x + 2, GROUND_Y + 8, 176, 18);

    if (this.playerSprite?.active && this.textures.exists(spriteKey)) {
      if (this.playerSprite.texture?.key !== spriteKey) this.playerSprite.setTexture(spriteKey);
      const scaleBoost = this.vehicleMode === 'skateboard' ? 0.50 : 0.54;
      this.playerSprite
        .setVisible(true)
        .setScale(scaleBoost)
        .setPosition(x + 8, this.player.y + PLAYER_BODY.h / 2 + 10)
        .setRotation(this.player.rotation * 0.82)
        .setFlipX(speedRatio < -0.08)
        .setAlpha(this.time.now < this.bailUntil ? 0.68 : 1);
      return;
    }

    const s = RIDER_SCALE;
    const y = this.player.y - 22;
    const lean = speedRatio * 8 * s;
    const crouch = this.feel?.state?.crouch || 0;
    const tuck = this.feel?.state?.trick && this.feel.state.trick !== 'grind' ? 4 * s : 0;
    const wheelSpin = (this.time?.now || 0) * 0.018 * Math.max(0.25, Math.abs(speedRatio));
    g.fillStyle(0x071018, 0.34).fillEllipse(x + 2 * s, y + 30 * s, 74 * s, 12 * s);

    if (this.vehicleMode === 'bike') {
      // BMX wheels: tires, rims, hubs, and rotating spokes for motion.
      for (const [wx, wy] of [[x - 18 * s, y + 14 * s], [x + 18 * s, y + 14 * s]]) {
        g.lineStyle(5 * s, 0x0b1016, 0.96).strokeCircle(wx, wy, 12 * s);
        g.lineStyle(2 * s, 0xdceaf1, 0.92).strokeCircle(wx, wy, 8 * s);
        g.fillStyle(0xf0c45c, 1).fillCircle(wx, wy, 2.5 * s);
        g.lineStyle(Math.max(1, 1.2 * s), 0x9ddce5, 0.75);
        for (let i = 0; i < 6; i += 1) {
          const a = wheelSpin + i * Math.PI / 3;
          g.lineBetween(wx, wy, wx + Math.cos(a) * 8 * s, wy + Math.sin(a) * 8 * s);
        }
      }

      // Bike frame and fork.
      g.lineStyle(4 * s, 0x49c6c0, 0.98);
      g.lineBetween(x - 18 * s, y + 14 * s, x - 3 * s, y - 1 * s);
      g.lineBetween(x - 3 * s, y - 1 * s, x + 18 * s, y + 14 * s);
      g.lineBetween(x - 18 * s, y + 14 * s, x + 2 * s, y + 13 * s);
      g.lineBetween(x + 2 * s, y + 13 * s, x + 18 * s, y + 14 * s);
      g.lineBetween(x - 3 * s, y - 1 * s, x + 2 * s, y + 13 * s);
      g.lineStyle(3 * s, 0xdceaf1, 0.92);
      g.lineBetween(x + 14 * s, y + 11 * s, x + 25 * s, y - 6 * s);
      g.lineBetween(x + 25 * s, y - 6 * s, x + 34 * s, y - 7 * s);
      g.lineStyle(3 * s, 0xf0c45c, 0.94);
      g.lineBetween(x - 6 * s, y - 4 * s, x - 13 * s, y - 10 * s);
      g.lineBetween(x - 16 * s, y - 10 * s, x - 8 * s, y - 10 * s);
    } else {
      // Skateboard mode: board is the ridden vehicle, not a carried prop.
      const boardY = y + 26 * s;
      g.fillStyle(0xf0c45c, 0.98).fillRoundedRect(x - 26 * s, boardY, 52 * s, 8 * s, 6 * s);
      g.lineStyle(2 * s, 0x7b5f3b, 0.9).strokeRoundedRect(x - 26 * s, boardY, 52 * s, 8 * s, 6 * s);
      g.fillStyle(0x49c6c0, 0.9).fillRoundedRect(x - 9 * s, boardY + 1 * s, 18 * s, 5 * s, 2 * s);
      g.fillStyle(0x101820, 0.98)
        .fillCircle(x - 17 * s, boardY + 10 * s, 3.4 * s)
        .fillCircle(x + 17 * s, boardY + 10 * s, 3.4 * s);
      g.lineStyle(2 * s, 0xdceaf1, 0.9).lineBetween(x - 14 * s, boardY + 3 * s, x + 14 * s, boardY + 3 * s);
    }

    // Rider body, helmet, limbs.
    const shoulderX = x + 6 * s + lean;
    const shoulderY = y - 18 * s + crouch * 5 * s - tuck;
    const hipX = x - 1 * s + lean * 0.45;
    const hipY = y - 2 * s + crouch * 4 * s;
    const footBack = this.vehicleMode === 'skateboard' ? [x - 18 * s, y + 27 * s] : [x - 12 * s, y + 13 * s];
    const footFront = this.vehicleMode === 'skateboard' ? [x + 15 * s, y + 27 * s] : [x + 11 * s, y + 13 * s];
    g.lineStyle(6 * s, 0x1f9a95, 0.98).lineBetween(hipX, hipY, shoulderX, shoulderY);
    g.fillStyle(0x1f9a95, 1).fillRoundedRect(hipX - 5 * s, hipY - 11 * s, 12 * s, 17 * s, 4 * s);
    g.fillStyle(0xf0c45c, 1).fillCircle(shoulderX - 1 * s, shoulderY - 11 * s, 7.5 * s);
    g.fillStyle(0x49c6c0, 1).fillEllipse(shoulderX - 1 * s, shoulderY - 16 * s, 18 * s, 10 * s);
    g.fillStyle(0x49c6c0, 1).fillRect(shoulderX - 10 * s, shoulderY - 15 * s, 18 * s, 5 * s);
    g.lineStyle(2 * s, 0x0b1016, 0.75).lineBetween(shoulderX - 9 * s, shoulderY - 13 * s, shoulderX + 7 * s, shoulderY - 13 * s);
    g.lineStyle(3 * s, 0xe7edf2, 0.96).lineBetween(shoulderX + 3 * s, shoulderY - 1 * s, x + 25 * s, y - 7 * s);
    g.lineBetween(shoulderX - 2 * s, shoulderY, x - 8 * s, y - 7 * s);
    g.lineStyle(3 * s, 0x1d2a30, 0.96).lineBetween(hipX - 1 * s, hipY + 2 * s, footBack[0], footBack[1]);
    g.lineBetween(hipX + 3 * s, hipY + 2 * s, footFront[0], footFront[1]);
  }

  _finish() {
    // Leaving also counts the run, so a friction experiment / prediction completes
    // even without reaching the flag.
    if (this.run && !this.run.recorded && (this.run.samples > 0)) this._recordRun('Run ended.');
    this.running = false;
    if (this.player?.body) this.player.body.setAllowGravity(true);
    if (this.player) this.player.body.setAcceleration(0, 0);
    this.cameras.main.stopFollow();
    this.cameras.main.setScroll(0, 0);
    [this.sky, this.glow, this.worldLayer, this.hud, this.gogglesGfx].forEach((o) => o.setVisible(false));
    (this._hiddenSceneKeys || []).forEach((key) => this.scene.manager.getScene(key)?.scene.setVisible(true));
    this._hiddenSceneKeys = [];
    this.registry.set('modalActive', false);
    this.registry.events.emit('quest:changed');
    this.registry.events.emit('skate:done');
    this._publish();
  }

  _publish() {
    if (typeof window === 'undefined') return;
    const b = this.player?.body;
    window.__SKATE__ = {
      active: this.running,
      goggles: this.goggles,
      x: this.player ? Math.round(this.player.x) : 0,
      speed: b ? Math.round(Math.hypot(b.velocity.x, b.velocity.y)) : 0,
      vx: b ? Math.round(b.velocity.x) : 0,
      vy: b ? Math.round(b.velocity.y) : 0,
      inAir: b ? !(b.blocked.down || b.touching.down) : false,
      worldWidth: this.worldWidth,
      flow: this._flow ?? 0,
      prediction: this.prediction ?? null,
      reachedFlag: Boolean(this.run?.reachedFlag),
    };
  }
}
