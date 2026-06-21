import Phaser from 'phaser';
import { obstacleById } from '../../data/act1/skateparkObstacles.js';
import { SkateParkSystem } from '../systems/skatepark/SkateParkSystem.js';

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
const MAX_SPEED = 360;
const JUMP = 430;
const GROUND_DRAG = 380;
const LAUNCH_MIN_SPEED = 150;   // need momentum to get air off a ramp
const FAIL_VY = 560;            // slam this hard on landing -> bail (safe)
const MAT_COLOR = {
  pine: 0xd2a062, concrete: 0xb3ac9c, steel: 0xc1c7d0, carbon_fiber: 0x33373d,
  balsa: 0xe7d6a2, brick: 0xb15538, iron: 0x8a8c92, bamboo: 0xc4cf72,
};

export default class SkateScene extends Phaser.Scene {
  constructor() { super('SkateScene'); }

  create() {
    this.running = false;
    this.goggles = false;
    this.wasInAir = false;
    this.lastSafeX = 120;
    this.bailUntil = 0;
    this.airFrames = 0;
    this.worldWidth = 1600;

    this.physics.world.gravity.y = GRAVITY;
    this.physics.world.setBounds(0, 0, this.worldWidth, 720);

    // Opaque sky so the top-down neighborhood behind is fully hidden when riding.
    this.sky = this.add.rectangle(0, 0, 1280, 720, 0x9fd6e6, 1).setOrigin(0, 0).setScrollFactor(0).setDepth(0).setVisible(false);
    this.glow = this.add.rectangle(0, 330, 1280, 390, 0xe9c98a, 0.22).setOrigin(0, 0).setScrollFactor(0).setDepth(0).setVisible(false);

    this.worldLayer = this.add.container(0, 0).setVisible(false);
    this.gogglesGfx = this.add.graphics().setDepth(900).setVisible(false);

    this.platforms = this.physics.add.staticGroup();

    // HUD (screen-fixed)
    this.hud = this.add.container(0, 0).setScrollFactor(0).setDepth(1000).setVisible(false);
    this.title = this.add.text(640, 22, 'Neighborhood Skate Park', { fontFamily: 'Georgia, serif', fontSize: '20px', color: '#2c2119', fontStyle: 'bold' }).setOrigin(0.5, 0);
    this.readout = this.add.text(18, 18, '', { fontFamily: 'Arial', fontSize: '15px', color: '#1d2a30' });
    this.hint = this.add.text(640, 694, 'D ride · A brake · Space jump · G Physics Goggles · Esc leave', { fontFamily: 'Arial', fontSize: '13px', color: '#234' }).setOrigin(0.5, 1);
    this.feedback = this.add.text(640, 120, '', { fontFamily: 'Georgia, serif', fontSize: '22px', color: '#2f6b2a', fontStyle: 'bold' }).setOrigin(0.5);
    // Reasoning quest banner + live Flow meter (Phase 4).
    this.questText = this.add.text(640, 52, '', { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#234', align: 'center', wordWrap: { width: 980 } }).setOrigin(0.5, 0);
    this.flowLabel = this.add.text(1262, 18, '', { fontFamily: 'Arial', fontSize: '14px', color: '#1d2a30', fontStyle: 'bold' }).setOrigin(1, 0);
    this.flowBarBg = this.add.rectangle(1262, 42, 160, 10, 0x000000, 0.18).setOrigin(1, 0);
    this.flowBar = this.add.rectangle(1262 - 160, 42, 2, 10, 0x2f8b3a, 1).setOrigin(0, 0);
    this.hud.add([this.title, this.readout, this.hint, this.feedback, this.questText, this.flowLabel, this.flowBarBg, this.flowBar]);

    this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE,G,LEFT,RIGHT,UP');

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
    this.bailUntil = 0;
    this.feedback.setText('');
    // Per-run telemetry (Phase 4) — drives flow_score + reasoning-quest checks.
    this.run = {
      maxSpeed: 0, avgAccum: 0, samples: 0, bails: 0, progress: 0, reachedFlag: false,
      usedRamp: false, usedQuarter: false, rodeSteel: false, rodeConcrete: false,
      rampDist: 0, quarterDist: 0, launchX: null, launchType: null, recorded: false,
    };
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
    this.materialZones = []; // ride-over obstacles, tagged by material (friction experiment)

    const layout = this.cache.json.get('skateparkLevel1') || { obstacles: [], ground: { friction: 0.6 } };
    this.worldWidth = Math.max(1600, ...(layout.obstacles || []).map((o) => o.x + 240));
    this.physics.world.setBounds(0, 0, this.worldWidth, 720);
    this.groundFriction = layout.ground?.friction ?? 0.6;

    // ground
    const ground = this.add.rectangle(this.worldWidth / 2, GROUND_Y + 60, this.worldWidth, 120, 0x8a6a44).setDepth(2);
    this.add.rectangle(this.worldWidth / 2, GROUND_Y + 2, this.worldWidth, 6, 0x6b4a2a).setDepth(3);
    this.worldLayer.add([ground]);
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
        // a launch ramp: a triangle + a launch zone. Speed -> trajectory.
        const w = 96; const h = 56; const x = inst.x; const baseY = GROUND_Y;
        const tri = this.add.triangle(x, baseY, 0, 0, w, 0, w, -h, color, alpha).setOrigin(0, 1).setDepth(4);
        if (temp) tri.setStrokeStyle(2, 0x6b4a2a, 0.8);
        this.worldLayer.add(tri);
        this.ramps.push({ x: x + w * 0.5, x2: x + w, angle: def.angle, friction: def.surfaceFriction, name: def.displayName });
      } else if (def.type === 'transition') {
        // quarter pipe: a curved wall that launches mostly vertical at its lip.
        const x = inst.x; const r = 70;
        const g = this.add.graphics().setDepth(4);
        g.fillStyle(color, alpha); g.slice(x, GROUND_Y, r, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(270), true); g.fillPath();
        if (cracked) { g.lineStyle(2, 0x9a2f1a, 0.9); g.lineBetween(x - 8, GROUND_Y - 30, x - 2, GROUND_Y - 10); }
        this.worldLayer.add(g);
        this.ramps.push({ x: x - r * 0.5, x2: x, angle: 80, friction: def.surfaceFriction, name: def.displayName, vertical: true });
      } else if (def.type === 'pump') {
        const x = inst.x; const w = 120; const h = 26;
        const g = this.add.graphics().setDepth(4); g.fillStyle(color, alpha);
        g.fillEllipse(x, GROUND_Y - h / 2, w, h * 2);
        this.worldLayer.add(g);
        this.pumps.push({ x, x2: x + w, boost: 60 });
      } else {
        // rail / box / pad: a platform you can ride on top of.
        const w = def.width; const h = Math.max(10, def.height); const x = inst.x; const topY = GROUND_Y - 26;
        const rect = this.add.rectangle(x + w / 2, topY, w, h, color, alpha).setDepth(4);
        rect.setStrokeStyle(2, 0x2a2118, 0.6);
        this.worldLayer.add(rect);
        const plat = this.add.rectangle(x + w / 2, topY - h / 2, w, 10, 0x000000, 0);
        this.platforms.add(plat);
        this.materialZones.push({ material: def.material, x1: x, x2: x + w });
      }
      // material label (small, educational: see the material you tested at the UTM)
      this.worldLayer.add(this.add.text(inst.x + 4, GROUND_Y + 16, def.material, { fontFamily: 'Arial', fontSize: '10px', color: '#3a2a18' }).setDepth(5).setAlpha(0.7));
    }
    // a finish flag
    this.worldLayer.add(this.add.rectangle(this.worldWidth - 80, GROUND_Y - 40, 6, 80, 0x333).setDepth(4));
    this.worldLayer.add(this.add.triangle(this.worldWidth - 80, GROUND_Y - 76, 0, 0, 36, 10, 0, 20, 0xe05a3a).setOrigin(0, 0).setDepth(4));
  }

  _drawMissing(x) {
    // a "missing rail" footprint — Level-1 damage storytelling.
    this.worldLayer.add(this.add.rectangle(x + 60, GROUND_Y - 1, 120, 4, 0x5a3d22, 0.5).setDepth(3));
    this.worldLayer.add(this.add.text(x + 18, GROUND_Y - 18, '(missing rail)', { fontFamily: 'Arial', fontSize: '10px', color: '#7a5a32', fontStyle: 'italic' }).setDepth(5));
  }

  _spawnPlayer() {
    if (this.player) this.player.destroy();
    this.player = this.add.rectangle(120, GROUND_Y - 40, 22, 28, 0x49c6c0).setDepth(8);
    this.player.setStrokeStyle(2, 0x1d2a30, 1);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    this.player.body.setMaxVelocity(MAX_SPEED, 2000);
    this.player.body.setDragX(GROUND_DRAG);
    this.worldLayer.add(this.player);
    this.physics.add.collider(this.player, this.platforms);
    this.lastSafeX = 120;
    this.wasInAir = false;
  }

  onKey(event) {
    if (!this.running) return;
    if (event.key === 'Escape') { this._finish(); return; }
    const k = (event.key || '').toLowerCase();
    if (k === 'g') { this.goggles = !this.goggles; this.gogglesGfx.setVisible(this.goggles); this._publish(); }
    if ((event.code === 'Space' || k === 'arrowup' || k === 'w')) this._tryJump();
    // Prediction quest: ◀ ramp / ▶ quarter (one-time, before testing by riding).
    if ((k === 'arrowleft' || k === 'arrowright') && !this.prediction) {
      const q = this.registry.get('act1Runtime')?.skateParkSystem?.getActiveQuest?.();
      if (q?.type === 'prediction') { this.prediction = k === 'arrowleft' ? 'ramp' : 'quarter'; this._refreshQuestBanner(); }
    }
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

  _tryJump() {
    const b = this.player?.body;
    if (!b) return;
    if ((b.blocked.down || b.touching.down) && this.time.now > this.bailUntil) {
      b.setVelocityY(-JUMP);
    }
  }

  update(_t, _dt) {
    if (!this.running || !this.player?.body) return;
    const b = this.player.body;
    const onGround = b.blocked.down || b.touching.down;
    const bailing = this.time.now < this.bailUntil;

    // input (held). D rides, A brakes; ◀ ▶ are reserved for the prediction choice.
    let ax = 0;
    if (!bailing) {
      if (this.keys.D.isDown) ax = ACCEL;
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
          b.setVelocityX(Math.min(MAX_SPEED, b.velocity.x + p.boost * (_dt / 1000)));
        }
      }
    }

    // air / landing
    if (!onGround) { this.wasInAir = true; this.airFrames += 1; this.player.rotation += (b.velocity.x > 0 ? 1 : -1) * 0.01; }
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
    this._setFlow(flow);

    // reached the finish flag -> the run counts (records flow + reasoning quests)
    if (this.player.x > this.worldWidth - 96 && !this.run.reachedFlag) {
      this.run.reachedFlag = true;
      this._recordRun('Nice run!');
    }

    this._drawGoggles(b, onGround);
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

  _onLand(b) {
    // record the jump distance, tagged by the launch used (prediction quest).
    if (this.run?.launchX != null) {
      const dist = Math.max(0, Math.round(this.player.x - this.run.launchX));
      if (this.run.launchType === 'quarter') this.run.quarterDist = Math.max(this.run.quarterDist, dist);
      else this.run.rampDist = Math.max(this.run.rampDist, dist);
      this.run.launchX = null; this.run.launchType = null;
    }
    const impact = Math.abs(b.velocity.y);
    if (impact > FAIL_VY || Math.abs(this.player.rotation) > 1.2) {
      // bail — safe: brief tumble, respawn at last safe spot. Never a death.
      if (this.run) this.run.bails += 1;
      this.bailUntil = this.time.now + 700;
      this.feedback.setText('Bail! Shake it off…').setColor('#9a4a2a');
      this.tweens.add({ targets: this.player, angle: this.player.angle + 240, duration: 500 });
      this.time.delayedCall(700, () => {
        if (!this.running) return;
        this.player.setPosition(this.lastSafeX, GROUND_Y - 60).setAngle(0).setRotation(0);
        this.player.body.setVelocity(0, 0);
        this.feedback.setText('');
      });
    } else if (this.airFrames > 14) {
      this.feedback.setText('Clean landing! ✓').setColor('#2f6b2a');
      this.time.delayedCall(900, () => { if (this.feedback.text.startsWith('Clean')) this.feedback.setText(''); });
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
    const speed = Math.round(Math.hypot(b.velocity.x, b.velocity.y));
    const momentum = Math.round(speed * 1.0); // mass ~1 (understandable, not realistic)
    this.readout.setText([
      `speed: ${speed}`,
      `velocity: x ${Math.round(b.velocity.x)}  y ${Math.round(b.velocity.y)}`,
      `momentum: ${momentum}`,
      `${onGround ? `grip (friction): ${this.groundFriction.toFixed(2)}` : 'in air — gravity only'}`,
      `goggles: ${this.goggles ? 'ON (G)' : 'off (G)'}`,
    ].join('\n'));
  }

  _finish() {
    // Leaving also counts the run, so a friction experiment / prediction completes
    // even without reaching the flag.
    if (this.run && !this.run.recorded && (this.run.samples > 0)) this._recordRun('Run ended.');
    this.running = false;
    if (this.player) this.player.body.setAcceleration(0, 0);
    this.cameras.main.stopFollow();
    this.cameras.main.setScroll(0, 0);
    [this.sky, this.glow, this.worldLayer, this.hud, this.gogglesGfx].forEach((o) => o.setVisible(false));
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
