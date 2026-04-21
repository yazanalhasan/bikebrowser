/**
 * Plant Effects — ethnobotanical effect system.
 *
 * Defines real-world-inspired medicinal/practical effects for desert plants.
 * Each plant can have therapeutic effects AND risks (realistic pharmacology).
 *
 * Effect categories:
 *   anti_inflammatory — reduces pain/swelling
 *   metabolic         — affects stamina/energy
 *   stimulant         — speed/alertness boost with cardiac risk
 *   antimicrobial     — fights infection, heals over time
 *   calming           — reduces anxiety, improves focus
 *   hydrating         — restores water/stamina in desert heat
 *   nutritive         — provides food energy
 *   protective        — reduces environmental damage
 *
 * Risk types:
 *   liver_toxicity    — cumulative organ damage from overuse
 *   cardiac_stress    — heart strain from stimulants
 *   allergic          — chance of negative reaction
 *   gastrointestinal  — stomach upset, temporary debuff
 *   photosensitivity  — increased sun damage after use
 *
 * Application methods:
 *   consumed  — eaten raw or cooked
 *   topical   — applied to skin
 *   brewed    — made into tea/tincture
 *   inhaled   — aromatherapy (calming effects)
 */

export const PLANT_EFFECTS = {
  creosote: {
    label: 'Creosote Resin',
    type: 'anti_inflammatory',
    effect: {
      reducePain: 0.3,
      reduceInfection: 0.5,
      healOverTime: 0.1,
    },
    application: ['topical', 'brewed'],
    risk: 'liver_toxicity',
    riskAmount: 0.2,
    duration: 30, // seconds of game time
    description: 'Anti-inflammatory resin — powerful but toxic if overused.',
    lore: 'Desert peoples used creosote tea for colds, but too much harms the liver.',
  },

  prickly_pear: {
    label: 'Prickly Pear Fruit',
    type: 'metabolic',
    effect: {
      restoreStamina: 0.25,
      restoreHydration: 0.3,
      reduceFatigue: 0.2,
    },
    application: ['consumed'],
    risk: null,
    riskAmount: 0,
    duration: 20,
    description: 'Sweet fruit that restores energy and water.',
    lore: 'The fruit and pads have fed desert communities for thousands of years.',
  },

  mesquite: {
    label: 'Mesquite Pods',
    type: 'nutritive',
    effect: {
      restoreStamina: 0.35,
      restoreHealth: 0.1,
    },
    application: ['consumed', 'brewed'],
    risk: null,
    riskAmount: 0,
    duration: 15,
    description: 'Protein-rich pods that provide sustained energy.',
    lore: 'Mesquite flour was a staple food in the Sonoran Desert.',
  },

  barrel_cactus: {
    label: 'Barrel Cactus Pulp',
    type: 'hydrating',
    effect: {
      restoreHydration: 0.5,
      reduceFatigue: 0.1,
    },
    application: ['consumed'],
    risk: 'gastrointestinal',
    riskAmount: 0.15,
    duration: 10,
    description: 'Emergency water source — bitter and can cause nausea.',
    lore: 'Only in true emergencies — the sap is acidic and can cause cramps.',
  },

  saguaro: {
    label: 'Saguaro Fruit',
    type: 'nutritive',
    effect: {
      restoreStamina: 0.2,
      restoreHealth: 0.05,
      improveFocus: 0.1,
    },
    application: ['consumed'],
    risk: null,
    riskAmount: 0,
    duration: 15,
    description: 'Sweet red fruit — rare and valuable.',
    lore: 'The Tohono O\'odham harvest saguaro fruit every summer for ceremony and food.',
  },

  jojoba: {
    label: 'Jojoba Oil',
    type: 'protective',
    effect: {
      reduceSunDamage: 0.4,
      healOverTime: 0.05,
    },
    application: ['topical'],
    risk: null,
    riskAmount: 0,
    duration: 45,
    description: 'Natural sunscreen and skin protectant.',
    lore: 'Jojoba oil is almost identical to human skin oil — nature\'s moisturizer.',
  },

  // ── Additional medicinal plants (not in current flora spawner but forageable) ──

  ephedra: {
    label: 'Mormon Tea (Ephedra)',
    type: 'stimulant',
    effect: {
      increaseSpeed: 0.4,
      increaseAlertness: 0.5,
      reduceFatigue: 0.3,
    },
    application: ['brewed'],
    risk: 'cardiac_stress',
    riskAmount: 0.25,
    duration: 25,
    description: 'Powerful stimulant — boosts speed but stresses the heart.',
    lore: 'Used for centuries as a decongestant and energy source. Modern ephedrine comes from this plant.',
  },

  yerba_mansa: {
    label: 'Yerba Mansa Root',
    type: 'antimicrobial',
    effect: {
      reduceInfection: 0.6,
      healOverTime: 0.2,
      reducePain: 0.15,
    },
    application: ['topical', 'brewed'],
    risk: null,
    riskAmount: 0,
    duration: 35,
    description: 'Powerful wound healer — the "aspirin of the desert."',
    lore: 'Grows near water. Used as a poultice for wounds and infections by many Southwestern peoples.',
  },

  desert_lavender: {
    label: 'Desert Lavender',
    type: 'calming',
    effect: {
      reduceAnxiety: 0.4,
      improveFocus: 0.3,
      healOverTime: 0.05,
    },
    application: ['brewed', 'inhaled'],
    risk: null,
    riskAmount: 0,
    duration: 40,
    description: 'Calming aroma that sharpens the mind.',
    lore: 'Desert lavender tea was a traditional remedy for headaches and nervousness.',
  },

  agave: {
    label: 'Agave Fiber & Sap',
    type: 'anti_inflammatory',
    effect: {
      healOverTime: 0.3,
      reducePain: 0.2,
    },
    application: ['topical'],
    risk: 'allergic',
    riskAmount: 0.1,
    duration: 30,
    description: 'Wound-binding fiber and healing sap.',
    lore: 'Agave fibers made rope, and the sap heals burns and cuts.',
  },

  ocotillo: {
    label: 'Ocotillo Bark Tea',
    type: 'metabolic',
    effect: {
      restoreStamina: 0.15,
      reduceFatigue: 0.25,
      reducePain: 0.1,
    },
    application: ['brewed'],
    risk: null,
    riskAmount: 0,
    duration: 20,
    description: 'Bark tea for fatigue and sore muscles.',
    lore: 'Soaked in baths for tired muscles after long desert treks.',
  },
};

/** Quick lookup. */
export const EFFECT_MAP = PLANT_EFFECTS;

/**
 * Get all plants that produce a given effect type.
 */
export function getPlantsByEffectType(effectType) {
  return Object.entries(PLANT_EFFECTS)
    .filter(([, data]) => data.type === effectType)
    .map(([name, data]) => ({ name, ...data }));
}

/**
 * Get all plants with a risk.
 */
export function getRiskyPlants() {
  return Object.entries(PLANT_EFFECTS)
    .filter(([, data]) => data.risk)
    .map(([name, data]) => ({ name, risk: data.risk, riskAmount: data.riskAmount }));
}

/**
 * Get all plants safe for a given application method.
 */
export function getPlantsByApplication(method) {
  return Object.entries(PLANT_EFFECTS)
    .filter(([, data]) => data.application?.includes(method))
    .map(([name, data]) => ({ name, ...data }));
}
