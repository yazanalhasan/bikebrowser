/**
 * Player entity — Zuzu character with procedural walk animation.
 *
 * Body parts are separate Graphics objects so limbs can move independently.
 * A simple state machine drives idle/walk states with velocity-synced
 * stride frequency, arm swing, body bob, and foot-contact dust particles.
 *
 * Desktop: arrow keys / WASD.  Mobile: virtual joystick.
 */

import Phaser from 'phaser';

const SPEED = 300;

// ── Walk animation constants ────────────────────────────────────────────────
const BASE_WALK_SPEED = 300;   // reference speed for 1× animation playback
const STRIDE_FREQ = 0.012;     // base stride frequency (radians per ms)
const LEG_AMPLITUDE = 4;       // max leg Y offset in pixels
const ARM_AMPLITUDE = 3;       // max arm Y offset
const BOB_AMPLITUDE = 1.5;     // torso vertical bob
const ANIM_SPEED_MIN = 0.5;    // slowest animation multiplier
const ANIM_SPEED_MAX = 2.0;    // fastest animation multiplier
const IDLE_LERP = 0.15;        // how fast limbs return to rest (0–1)
const DUST_INTERVAL = 260;     // ms between dust puffs

export default class Player {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x - spawn x
   * @param {number} y - spawn y
   */
  constructor(scene, x, y) {
    this.scene = scene;
    this.facing = 'down';

    // Animation state
    this._state = 'idle';        // 'idle' | 'walk'
    this._stridePhase = 0;       // current walk cycle phase (radians)
    this._limbOffsets = { leftLeg: 0, rightLeg: 0, leftArm: 0, rightArm: 0, bob: 0 };
    this._lastDustTime = 0;
    this._lastFootDown = false;  // tracks foot-contact edge for dust trigger
    this._currentSpeed = 0;      // smoothed speed for animation

    // Container holds all body parts
    this.container = scene.add.container(x, y);
    this._buildCharacter();
    this.container.setScale(1.8);
    this.container.setDepth(6);

    // Shadow under character for grounding
    this._shadow = scene.add.ellipse(x, y + 24, 28, 8, 0x000000, 0.18);
    this._shadow.setDepth(5);

    // Invisible physics hitbox
    this.sprite = scene.add.rectangle(x, y, 36, 50, 0x000000, 0);
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCollideWorldBounds(true);
    this.sprite.setDepth(6);

    // Name label
    this.label = scene.add.text(x, y + 42, 'Zuzu', {
      fontSize: '13px',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
      color: '#1e3a5f',
      align: 'center',
      stroke: '#ffffff',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(7);

    // --- Input ----------------------------------------------------------------
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    this.joystick = { x: 0, y: 0 };
  }

  // ── Build character from separate limb Graphics ───────────────────────────

  _buildCharacter() {
    // Each limb is its own Graphics so it can be offset independently.
    // Draw order (bottom to top): shadow, legs, torso+backpack, arms, head

    this._leftLeg = this._createLeftLeg();
    this._rightLeg = this._createRightLeg();
    this._torso = this._createTorso();
    this._leftArm = this._createLeftArm();
    this._rightArm = this._createRightArm();
    this._head = this._createHead();

    // Store rest positions so animation offsets are relative
    this._restY = {
      leftLeg: this._leftLeg.y,
      rightLeg: this._rightLeg.y,
      leftArm: this._leftArm.y,
      rightArm: this._rightArm.y,
      torso: this._torso.y,
      head: this._head.y,
    };
  }

  _createLeftLeg() {
    const g = this.scene.add.graphics();
    // Khaki shorts
    g.fillStyle(0xc2a87d);
    g.fillRoundedRect(-8, 8, 7, 12, 1);
    // Cargo pocket
    g.fillStyle(0xb89c6e);
    g.fillRect(-7, 12, 5, 4);
    // Sneaker
    g.fillStyle(0x4b5563);
    g.fillRoundedRect(-9, 19, 9, 5, 2);
    g.fillStyle(0x3b82f6);
    g.fillRect(-8, 19, 3, 2);
    this.container.add(g);
    return g;
  }

  _createRightLeg() {
    const g = this.scene.add.graphics();
    g.fillStyle(0xc2a87d);
    g.fillRoundedRect(1, 8, 7, 12, 1);
    g.fillStyle(0xb89c6e);
    g.fillRect(2, 12, 5, 4);
    g.fillStyle(0x4b5563);
    g.fillRoundedRect(0, 19, 9, 5, 2);
    g.fillStyle(0x3b82f6);
    g.fillRect(5, 19, 3, 2);
    this.container.add(g);
    return g;
  }

  _createTorso() {
    const g = this.scene.add.graphics();
    // Backpack (behind body)
    g.fillStyle(0x2d6a4f);
    g.fillRoundedRect(-14, -8, 6, 16, 2);
    g.fillStyle(0x4b5563);
    g.fillRect(-12, -6, 2, 8);
    // Blue t-shirt
    g.fillStyle(0x3b82f6);
    g.fillRoundedRect(-11, -10, 22, 20, 3);
    // Collar
    g.fillStyle(0x2563eb);
    g.fillRoundedRect(-5, -11, 10, 3, 1);
    this.container.add(g);
    return g;
  }

  _createLeftArm() {
    const g = this.scene.add.graphics();
    // Skin
    g.fillStyle(0xd4956a);
    g.fillRoundedRect(-15, -4, 5, 10, 2);
    // Glove
    g.fillStyle(0x374151);
    g.fillRoundedRect(-15, 4, 5, 4, 1);
    this.container.add(g);
    return g;
  }

  _createRightArm() {
    const g = this.scene.add.graphics();
    // Skin
    g.fillStyle(0xd4956a);
    g.fillRoundedRect(10, -4, 5, 10, 2);
    // Glove
    g.fillStyle(0x374151);
    g.fillRoundedRect(10, 4, 5, 4, 1);
    // Wrench
    g.fillStyle(0x9ca3af);
    g.fillRect(12, -2, 2, 8);
    g.fillStyle(0xd1d5db);
    g.fillRect(11, -4, 4, 3);
    this.container.add(g);
    return g;
  }

  _createHead() {
    const g = this.scene.add.graphics();

    // Face
    g.fillStyle(0xd4956a);
    g.fillCircle(0, -18, 10);

    // Hair tufts
    g.fillStyle(0x1a1a2e);
    g.fillTriangle(-9, -20, -13, -16, -7, -16);
    g.fillTriangle(9, -20, 13, -16, 7, -16);
    g.fillTriangle(-4, -27, -8, -20, 0, -20);
    g.fillTriangle(4, -27, 8, -20, 0, -20);
    g.fillRoundedRect(-11, -22, 4, 8, 1);
    g.fillRoundedRect(7, -22, 4, 8, 1);

    // Helmet
    g.fillStyle(0xdc2626);
    g.beginPath();
    g.arc(0, -22, 11, Math.PI, 0, false);
    g.closePath();
    g.fillPath();
    g.fillStyle(0xb91c1c);
    g.fillRect(-6, -31, 3, 6);
    g.fillRect(-1, -32, 3, 7);
    g.fillRect(4, -31, 3, 6);
    g.fillStyle(0xdc2626);
    g.fillRoundedRect(-12, -22, 24, 3, 1);

    // Eyes
    g.fillStyle(0xffffff);
    g.fillCircle(-4, -18, 3);
    g.fillCircle(4, -18, 3);
    g.fillStyle(0x3b2507);
    g.fillCircle(-4, -18, 1.5);
    g.fillCircle(4, -18, 1.5);
    g.fillStyle(0xffffff);
    g.fillCircle(-3, -19, 0.7);
    g.fillCircle(5, -19, 0.7);

    // Smile
    g.lineStyle(1.5, 0x8b4513);
    g.beginPath();
    g.arc(0, -15, 4, 0.2, Math.PI - 0.2, false);
    g.strokePath();

    // Chin strap
    g.lineStyle(1, 0x1f2937);
    g.beginPath();
    g.moveTo(-8, -18);
    g.lineTo(-8, -12);
    g.strokePath();
    g.beginPath();
    g.moveTo(8, -18);
    g.lineTo(8, -12);
    g.strokePath();

    this.container.add(g);
    return g;
  }

  // ── Animation state machine ───────────────────────────────────────────────

  /**
   * Transition animation state. Only switches when state actually changes.
   * @param {'idle'|'walk'} newState
   */
  _setState(newState) {
    if (this._state === newState) return;
    this._state = newState;
    if (newState === 'idle') {
      // Reset phase so next walk starts cleanly
      this._stridePhase = 0;
    }
  }

  // ── Procedural walk cycle ─────────────────────────────────────────────────

  /**
   * Advance the walk cycle and apply offsets to limbs.
   * @param {number} dt - delta time in ms
   * @param {number} speed - current movement speed (px/s)
   */
  _animateWalk(dt, speed) {
    if (this._state === 'walk') {
      // Sync animation speed to movement velocity
      const animSpeed = Phaser.Math.Clamp(speed / BASE_WALK_SPEED, ANIM_SPEED_MIN, ANIM_SPEED_MAX);
      this._stridePhase += STRIDE_FREQ * dt * animSpeed;

      const phase = this._stridePhase;

      // Legs alternate: one forward, one back (in top-down, this is Y offset)
      this._limbOffsets.leftLeg = Math.sin(phase) * LEG_AMPLITUDE;
      this._limbOffsets.rightLeg = Math.sin(phase + Math.PI) * LEG_AMPLITUDE; // opposite

      // Arms swing opposite to legs
      this._limbOffsets.leftArm = Math.sin(phase + Math.PI) * ARM_AMPLITUDE;
      this._limbOffsets.rightArm = Math.sin(phase) * ARM_AMPLITUDE;

      // Body bobs at double frequency (once per footstep)
      this._limbOffsets.bob = -Math.abs(Math.sin(phase)) * BOB_AMPLITUDE;

      // Smooth speed tracking for consistent feel
      this._currentSpeed = Phaser.Math.Linear(this._currentSpeed, speed, 0.2);

    } else {
      // Idle: lerp limbs back to rest positions smoothly
      this._limbOffsets.leftLeg = Phaser.Math.Linear(this._limbOffsets.leftLeg, 0, IDLE_LERP);
      this._limbOffsets.rightLeg = Phaser.Math.Linear(this._limbOffsets.rightLeg, 0, IDLE_LERP);
      this._limbOffsets.leftArm = Phaser.Math.Linear(this._limbOffsets.leftArm, 0, IDLE_LERP);
      this._limbOffsets.rightArm = Phaser.Math.Linear(this._limbOffsets.rightArm, 0, IDLE_LERP);
      this._limbOffsets.bob = Phaser.Math.Linear(this._limbOffsets.bob, 0, IDLE_LERP);
      this._currentSpeed = Phaser.Math.Linear(this._currentSpeed, 0, 0.15);
    }

    // Apply offsets to each limb Graphics
    this._leftLeg.y = this._restY.leftLeg + this._limbOffsets.leftLeg;
    this._rightLeg.y = this._restY.rightLeg + this._limbOffsets.rightLeg;
    this._leftArm.y = this._restY.leftArm + this._limbOffsets.leftArm;
    this._rightArm.y = this._restY.rightArm + this._limbOffsets.rightArm;
    this._torso.y = this._restY.torso + this._limbOffsets.bob;
    this._head.y = this._restY.head + this._limbOffsets.bob;
  }

  // ── Foot-contact dust particles ───────────────────────────────────────────

  _emitDust() {
    const now = this.scene.time.now;
    if (now - this._lastDustTime < DUST_INTERVAL) return;

    // Emit on foot-down edge (stride phase crossing zero downward)
    const footDown = Math.sin(this._stridePhase) < -0.7;
    if (footDown && !this._lastFootDown) {
      this._lastDustTime = now;
      this._spawnDustPuff(this.sprite.x, this.sprite.y + 20);
    }
    this._lastFootDown = footDown;
  }

  _spawnDustPuff(wx, wy) {
    // 2–3 small tan circles that fade and rise
    const count = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      const dx = (Math.random() - 0.5) * 12;
      const puff = this.scene.add.circle(wx + dx, wy, 2 + Math.random() * 2, 0xc9b896, 0.5);
      puff.setDepth(5);
      this.scene.tweens.add({
        targets: puff,
        y: wy - 6 - Math.random() * 4,
        alpha: 0,
        scaleX: 1.5,
        scaleY: 1.5,
        duration: 300 + Math.random() * 150,
        ease: 'Quad.easeOut',
        onComplete: () => puff.destroy(),
      });
    }
  }

  // ── Main update (called from scene) ───────────────────────────────────────

  /** Call from scene update(). Returns { x, y } of current position. */
  update() {
    // Guard against the React-unmount race: Phaser can tear down the
    // sprite's physics body mid-frame while an in-flight requestAnimationFrame
    // callback still calls update(). When the user pauses/leaves and re-enters
    // /play, this can fire one or two frames where sprite is technically alive
    // but its body has already been freed. Return a safe stale position.
    if (!this.sprite || !this.sprite.body || !this.sprite.active) {
      return { x: this.sprite?.x ?? 0, y: this.sprite?.y ?? 0 };
    }
    const body = this.sprite.body;
    let vx = 0;
    let vy = 0;

    // Keyboard
    if (this.cursors.left.isDown || this.wasd.left.isDown) vx = -1;
    else if (this.cursors.right.isDown || this.wasd.right.isDown) vx = 1;
    if (this.cursors.up.isDown || this.wasd.up.isDown) vy = -1;
    else if (this.cursors.down.isDown || this.wasd.down.isDown) vy = 1;

    // Virtual joystick overrides when active
    if (this.joystick.x !== 0 || this.joystick.y !== 0) {
      vx = this.joystick.x;
      vy = this.joystick.y;
    }

    // Track facing and flip character visually
    if (vx < 0) this.facing = 'left';
    else if (vx > 0) this.facing = 'right';
    if (vy < 0) this.facing = 'up';
    else if (vy > 0) this.facing = 'down';

    if (vx < 0) this.container.setScale(-1.8, 1.8);
    else if (vx > 0) this.container.setScale(1.8, 1.8);

    // Normalize diagonal speed
    const len = Math.sqrt(vx * vx + vy * vy) || 1;
    body.setVelocity((vx / len) * SPEED, (vy / len) * SPEED);

    // Current movement speed for animation sync
    const speed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
    const isMoving = speed > 10;

    // ── Animation state machine ──
    this._setState(isMoving ? 'walk' : 'idle');

    // ── Advance walk cycle ──
    // Use ~16ms as fallback dt if scene doesn't provide delta
    const dt = this.scene.game.loop.delta || 16;
    this._animateWalk(dt, speed);

    // ── Foot-contact dust ──
    if (isMoving) this._emitDust();

    // ── Position sync ──
    // Container (visual) follows physics sprite, with walk bob applied
    this.container.setPosition(this.sprite.x, this.sprite.y + this._limbOffsets.bob);
    this.label.setPosition(this.sprite.x, this.sprite.y + 42);

    // Shadow stays flat on ground under character
    this._shadow.setPosition(this.sprite.x, this.sprite.y + 24);
    // Shadow scales subtly with bob to reinforce grounding
    const shadowScale = 1.0 + this._limbOffsets.bob * 0.03;
    this._shadow.setScale(shadowScale, 1);

    return { x: this.sprite.x, y: this.sprite.y };
  }

  setPosition(x, y) {
    this.sprite.setPosition(x, y);
    this.container.setPosition(x, y);
    this.label.setPosition(x, y + 42);
    this._shadow.setPosition(x, y + 24);
  }

  destroy() {
    this.sprite.destroy();
    this.container.destroy();
    this.label.destroy();
    this._shadow.destroy();
  }
}
