export const TRICK_INPUTS = {
  Space: { id: 'ollie', label: 'Ollie', pop: 1, spin: 0, flow: 4 },
  KeyC: { id: 'kickflip', label: 'Kickflip', pop: 0.94, spin: 1.35, flow: 9 },
  KeyE: { id: 'shuvit', label: 'Shuv-it', pop: 0.88, spin: -1.15, flow: 8 },
  KeyF: { id: 'grab', label: 'Tuck grab', pop: 0.72, spin: 0.32, flow: 7 },
};

const DEFAULT_STATE = {
  crouch: 0,
  pumpCooldownMs: 0,
  trick: null,
  trickTimerMs: 0,
  trickSpin: 0,
  combo: 0,
  grind: null,
  grindMs: 0,
  landingStability: 1,
  style: 0,
};

export class SkateFeelSystem {
  constructor() {
    this.state = { ...DEFAULT_STATE };
  }

  reset() {
    this.state = { ...DEFAULT_STATE };
    return this.snapshot();
  }

  snapshot() {
    return { ...this.state, grind: this.state.grind ? { ...this.state.grind } : null };
  }

  update({ dtMs, onGround, holdingCrouch, speed, nearPump }) {
    const dt = Math.max(0, dtMs || 0);
    if (holdingCrouch && onGround) this.state.crouch = Math.min(1, this.state.crouch + dt / 620);
    else this.state.crouch = Math.max(0, this.state.crouch - dt / 360);

    this.state.pumpCooldownMs = Math.max(0, this.state.pumpCooldownMs - dt);
    this.state.trickTimerMs = Math.max(0, this.state.trickTimerMs - dt);
    if (this.state.trickTimerMs === 0 && !this.state.grind) {
      this.state.trick = null;
      this.state.trickSpin = 0;
    }
    if (nearPump && onGround && speed > 80) this.state.style = Math.min(100, this.state.style + dt * 0.012);
    else this.state.style = Math.max(0, this.state.style - dt * 0.004);
    return this.snapshot();
  }

  pump({ onGround, speed }) {
    if (!onGround || speed < 55 || this.state.pumpCooldownMs > 0) return { boost: 0, accepted: false };
    this.state.pumpCooldownMs = 320;
    this.state.style = Math.min(100, this.state.style + 8);
    return { boost: Math.min(125, 40 + speed * 0.18), accepted: true };
  }

  pop(code, { onGround, speed }) {
    const trick = TRICK_INPUTS[code] || TRICK_INPUTS.Space;
    if (!onGround) return { accepted: false, label: trick.label, vxBoost: 0, vy: 0, spin: 0 };
    const crouchBonus = 1 + this.state.crouch * 0.38;
    const speedBonus = Math.min(1.2, Math.max(0.75, speed / 300));
    const vy = -430 * trick.pop * crouchBonus;
    const vxBoost = trick.id === 'ollie' ? 10 * this.state.crouch : 24 * speedBonus;
    this.state.trick = trick.id;
    this.state.trickTimerMs = 920;
    this.state.trickSpin = trick.spin;
    this.state.combo = Math.min(9, this.state.combo + 1);
    this.state.style = Math.min(100, this.state.style + trick.flow);
    this.state.crouch = 0;
    return { accepted: true, label: trick.label, vxBoost, vy, spin: trick.spin };
  }

  tryStartGrind({ rail, speed, y, railY }) {
    if (!rail || Math.abs(y - railY) > 44 || speed < 120) return { accepted: false };
    this.state.grind = { id: rail.id, label: rail.label, material: rail.material };
    this.state.grindMs = 0;
    this.state.trick = 'grind';
    this.state.trickTimerMs = 999999;
    this.state.combo = Math.min(9, this.state.combo + 1);
    this.state.style = Math.min(100, this.state.style + 12);
    return { accepted: true, label: rail.label };
  }

  updateGrind(dtMs) {
    if (!this.state.grind) return this.snapshot();
    this.state.grindMs += Math.max(0, dtMs || 0);
    this.state.style = Math.min(100, this.state.style + Math.max(0, dtMs || 0) * 0.018);
    return this.snapshot();
  }

  endGrind() {
    const grind = this.state.grind;
    const ms = this.state.grindMs;
    this.state.grind = null;
    this.state.grindMs = 0;
    this.state.trick = null;
    this.state.trickTimerMs = 0;
    this.state.trickSpin = 0;
    return { grind, ms };
  }

  land({ impact, rotation }) {
    const stability = Math.max(0, 1 - impact / 720 - Math.abs(rotation) / 2.8);
    this.state.landingStability = stability;
    if (stability > 0.46) this.state.style = Math.min(100, this.state.style + 7 + this.state.combo * 2);
    else {
      this.state.combo = 0;
      this.state.style = Math.max(0, this.state.style - 18);
    }
    return { stability, clean: stability > 0.46 };
  }
}
