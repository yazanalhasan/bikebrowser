/**
 * Player Stats System — health, stamina, focus, toxicity, and effect application.
 *
 * Pure functions that operate on a stats object stored in game state.
 * The Phaser scene or React HUD reads/writes this via the registry.
 *
 * Stats:
 *   health      (0–1)  — damage tolerance, 0 = incapacitated
 *   stamina     (0–1)  — energy for running/actions, regenerates slowly
 *   hydration   (0–1)  — water level, drains in heat
 *   focus       (0–1)  — mental clarity, affects quiz/crafting quality
 *   toxicity    (0–1)  — accumulated poison, causes debuffs above 0.5
 *
 * Active effects are tracked with timers and removed when expired.
 */

// ── Default stats ────────────────────────────────────────────────────────────

export function defaultStats() {
  return {
    health: 1.0,
    stamina: 1.0,
    hydration: 0.8,
    focus: 1.0,
    toxicity: 0,
    activeEffects: [],  // { id, source, effects, risk, expiresAt, appliedAt }
  };
}

// ── Stat manipulation (pure functions, return new state) ─────────────────────

export function clamp01(v) { return Math.max(0, Math.min(1, v)); }

export function modifyStat(stats, stat, delta) {
  if (!(stat in stats) || stat === 'activeEffects') return stats;
  return { ...stats, [stat]: clamp01(stats[stat] + delta) };
}

export function setStats(stats, changes) {
  const next = { ...stats };
  for (const [key, value] of Object.entries(changes)) {
    if (key === 'activeEffects') continue;
    if (key in next) next[key] = clamp01(value);
  }
  return next;
}

// ── Effect application ───────────────────────────────────────────────────────

/**
 * Apply a plant effect to player stats.
 *
 * @param {object} stats - current player stats
 * @param {object} plantEffect - from plantEffects.js
 * @param {string} source - plant name (for tracking)
 * @param {number} now - current game time (seconds or Date.now())
 * @param {number} [qualityMultiplier=1] - harvest quality (0–1) scales effect
 * @returns {{ stats: object, message: string }}
 */
export function applyPlantEffect(stats, plantEffect, source, now, qualityMultiplier = 1) {
  let next = { ...stats, activeEffects: [...stats.activeEffects] };
  const messages = [];
  const q = qualityMultiplier;

  // Apply instant effects
  const fx = plantEffect.effect || {};

  if (fx.restoreHealth)     { next = modifyStat(next, 'health',    fx.restoreHealth * q); messages.push(`+${Math.round(fx.restoreHealth * q * 100)}% health`); }
  if (fx.restoreStamina)    { next = modifyStat(next, 'stamina',   fx.restoreStamina * q); messages.push(`+${Math.round(fx.restoreStamina * q * 100)}% stamina`); }
  if (fx.restoreHydration)  { next = modifyStat(next, 'hydration', fx.restoreHydration * q); messages.push(`+${Math.round(fx.restoreHydration * q * 100)}% hydration`); }
  if (fx.improveFocus)      { next = modifyStat(next, 'focus',     fx.improveFocus * q); messages.push(`+${Math.round(fx.improveFocus * q * 100)}% focus`); }
  if (fx.reduceFatigue)     { next = modifyStat(next, 'stamina',   fx.reduceFatigue * q); }
  if (fx.reducePain)        { next = modifyStat(next, 'health',    fx.reducePain * q * 0.5); }
  if (fx.reduceAnxiety)     { next = modifyStat(next, 'focus',     fx.reduceAnxiety * q); }

  // Apply risk (toxicity or side effects)
  if (plantEffect.risk && plantEffect.riskAmount > 0) {
    const riskDelta = plantEffect.riskAmount;

    switch (plantEffect.risk) {
      case 'liver_toxicity':
        next = modifyStat(next, 'toxicity', riskDelta);
        messages.push(`⚠️ Toxicity +${Math.round(riskDelta * 100)}%`);
        break;
      case 'cardiac_stress':
        next = modifyStat(next, 'toxicity', riskDelta * 0.8);
        next = modifyStat(next, 'health', -riskDelta * 0.1);
        messages.push(`⚠️ Heart strain — use sparingly`);
        break;
      case 'gastrointestinal':
        next = modifyStat(next, 'stamina', -riskDelta);
        messages.push(`⚠️ Stomach upset`);
        break;
      case 'allergic':
        if (Math.random() < riskDelta) {
          next = modifyStat(next, 'health', -0.1);
          messages.push(`⚠️ Allergic reaction!`);
        }
        break;
      case 'photosensitivity':
        messages.push(`⚠️ Increased sun sensitivity`);
        break;
    }
  }

  // Register timed effects (heal-over-time, speed boost, etc.)
  const timedEffects = {};
  if (fx.healOverTime)       timedEffects.healOverTime = fx.healOverTime * q;
  if (fx.increaseSpeed)      timedEffects.increaseSpeed = fx.increaseSpeed * q;
  if (fx.increaseAlertness)  timedEffects.increaseAlertness = fx.increaseAlertness * q;
  if (fx.reduceInfection)    timedEffects.reduceInfection = fx.reduceInfection * q;
  if (fx.reduceSunDamage)    timedEffects.reduceSunDamage = fx.reduceSunDamage * q;

  if (Object.keys(timedEffects).length > 0) {
    next.activeEffects.push({
      id: `${source}_${now}`,
      source,
      type: plantEffect.type,
      effects: timedEffects,
      risk: plantEffect.risk,
      appliedAt: now,
      expiresAt: now + (plantEffect.duration || 30) * 1000,
    });
  }

  return {
    stats: next,
    message: messages.length > 0 ? messages.join(', ') : `Used ${plantEffect.label}`,
  };
}

// ── Timed effect tick ────────────────────────────────────────────────────────

/**
 * Process active timed effects. Call every few seconds from game update.
 *
 * @param {object} stats
 * @param {number} now
 * @param {number} deltaSec - seconds since last tick
 * @returns {object} updated stats with expired effects removed
 */
export function tickEffects(stats, now, deltaSec) {
  let next = { ...stats };
  const alive = [];

  for (const effect of stats.activeEffects) {
    if (now >= effect.expiresAt) continue; // expired, drop it

    // Apply per-tick effects
    const fx = effect.effects;
    if (fx.healOverTime) {
      next = modifyStat(next, 'health', fx.healOverTime * deltaSec * 0.1);
    }

    alive.push(effect);
  }

  next.activeEffects = alive;
  return next;
}

// ── Environmental stat drain ─────────────────────────────────────────────────

/**
 * Apply environmental stat drain (heat, exertion).
 * Call periodically from the game loop.
 *
 * @param {object} stats
 * @param {number} deltaSec
 * @param {object} [env] - { temperature }
 * @param {boolean} [isMoving]
 * @returns {object}
 */
export function tickEnvironment(stats, deltaSec, env = {}, isMoving = false) {
  let next = { ...stats };

  // Hydration drains in heat
  const heatDrain = (env.temperature || 0.5) * 0.002 * deltaSec;
  next = modifyStat(next, 'hydration', -heatDrain);

  // Stamina drains while moving, regenerates while still
  if (isMoving) {
    next = modifyStat(next, 'stamina', -0.003 * deltaSec);
  } else {
    next = modifyStat(next, 'stamina', 0.005 * deltaSec);
  }

  // Toxicity decays slowly over time
  if (next.toxicity > 0) {
    next = modifyStat(next, 'toxicity', -0.001 * deltaSec);
  }

  // High toxicity causes health drain
  if (next.toxicity > 0.5) {
    const toxDrain = (next.toxicity - 0.5) * 0.005 * deltaSec;
    next = modifyStat(next, 'health', -toxDrain);
  }

  // Low hydration causes stamina drain
  if (next.hydration < 0.2) {
    next = modifyStat(next, 'stamina', -0.004 * deltaSec);
  }

  return next;
}

// ── Queries ──────────────────────────────────────────────────────────────────

/** Check if player has a specific active effect type. */
export function hasActiveEffect(stats, effectType) {
  return stats.activeEffects.some((e) => e.type === effectType);
}

/** Get current speed multiplier from active effects. */
export function getSpeedMultiplier(stats) {
  let mult = 1.0;
  for (const effect of stats.activeEffects) {
    if (effect.effects.increaseSpeed) mult += effect.effects.increaseSpeed;
  }
  // Low stamina slows you down
  if (stats.stamina < 0.2) mult *= 0.6;
  return mult;
}

/** Get toxicity warning level: 'safe' | 'caution' | 'danger' */
export function getToxicityLevel(stats) {
  if (stats.toxicity < 0.3) return 'safe';
  if (stats.toxicity < 0.6) return 'caution';
  return 'danger';
}
