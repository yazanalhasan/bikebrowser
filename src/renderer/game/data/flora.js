/**
 * Flora Definitions — Arizona desert plant species.
 *
 * UNIFIED plant model: each entry is simultaneously an ecological object,
 * a pharmacological resource, AND a scientific variable.
 *
 * Properties:
 *   ecology       — elevation, moisture, density, clustering
 *   pharmacology  — anti-inflammatory, antimicrobial, toxicity, etc.
 *   science       — contamination resistance, chemical reactivity
 *   foraging      — maturity rate, potency window, time-of-day effects
 */

export const FLORA = [
  {
    name: 'creosote',
    label: 'Creosote Bush',
    elevation: [0, 5000],
    moistureMax: 0.2,
    density: 0.8,
    cluster: true,
    clusterRadius: 40,
    clusterCount: 4,
    size: 'small',
    color: 0x6b8e23,
    emoji: '🌿',
    pharmacology: {
      antiInflammatory: 0.3,
      antimicrobial: 0.5,
      toxicity: 0.3,
      painRelief: 0.2,
    },
    scienceInteractions: {
      contaminationResistance: 0.7,  // resin repels microbes
      chemicalReactivity: 0.6,      // resinous compounds are reactive
      fluidContribution: 0,         // doesn't create fluid zones
      topologyAffinity: 0,
    },
    foraging: {
      maturityDays: 3,             // game-days to reach full potency
      potencyWindow: 'dawn',       // best harvest time
      nightBonus: 0,
      nightDanger: 0.1,            // slight scorpion risk
      contaminationRate: 0.02,     // low — resin protects
      shelfLife: 0.9,              // lasts a long time dried
    },
  },
  {
    name: 'saguaro',
    label: 'Saguaro Cactus',
    elevation: [0, 4000],
    moistureMax: 0.15,
    density: 0.15,
    cluster: false,
    size: 'large',
    color: 0x2d5a27,
    emoji: '🌵',
    heightOffset: 30,
    pharmacology: {
      nutritive: 0.3,
      hydrating: 0.2,
      toxicity: 0,
    },
    scienceInteractions: {
      contaminationResistance: 0.5,
      chemicalReactivity: 0.2,
      fluidContribution: 0,
      topologyAffinity: 0,
    },
    foraging: {
      maturityDays: 7,
      potencyWindow: 'day',
      nightBonus: 0,
      nightDanger: 0.2,
      contaminationRate: 0.05,
      shelfLife: 0.4,              // fruit spoils fast
    },
  },
  {
    name: 'mesquite',
    label: 'Mesquite Tree',
    elevation: [0, 5500],
    moistureMax: 0.5,
    density: 0.4,
    cluster: true,
    clusterRadius: 50,
    clusterCount: 3,
    size: 'medium',
    color: 0x4a7c3f,
    emoji: '🌳',
    heightOffset: 20,
    pharmacology: {
      nutritive: 0.5,
      antiInflammatory: 0.1,
      toxicity: 0,
    },
    scienceInteractions: {
      contaminationResistance: 0.4,
      chemicalReactivity: 0.5,     // wood burns to useful ash
      fluidContribution: 0.3,     // decay creates organic fluid zones
      topologyAffinity: 0.4,      // deep root systems = topology
    },
    foraging: {
      maturityDays: 5,
      potencyWindow: 'any',
      nightBonus: 0,
      nightDanger: 0.15,
      contaminationRate: 0.08,     // pods on ground = contamination
      shelfLife: 0.85,
    },
  },
  {
    name: 'palo_verde',
    label: 'Palo Verde',
    elevation: [0, 4000],
    moistureMax: 0.4,
    density: 0.3,
    cluster: true,
    clusterRadius: 45,
    clusterCount: 2,
    size: 'medium',
    color: 0x7db33a,
    emoji: '🌲',
    heightOffset: 18,
    pharmacology: {
      antiInflammatory: 0.1,
      toxicity: 0,
    },
    scienceInteractions: {
      contaminationResistance: 0.3,
      chemicalReactivity: 0.3,
      fluidContribution: 0.1,
      topologyAffinity: 0,
    },
    foraging: {
      maturityDays: 4,
      potencyWindow: 'any',
      nightBonus: 0,
      nightDanger: 0.1,
      contaminationRate: 0.05,
      shelfLife: 0.7,
    },
  },
  {
    name: 'jojoba',
    label: 'Jojoba Shrub',
    elevation: [1000, 4500],
    moistureMax: 0.3,
    density: 0.5,
    cluster: false,
    size: 'small',
    color: 0x5d8a3c,
    emoji: '🪴',
    pharmacology: {
      sunProtection: 0.4,
      antiInflammatory: 0.05,
      toxicity: 0,
    },
    scienceInteractions: {
      contaminationResistance: 0.6,  // waxy coating
      chemicalReactivity: 0.4,
      fluidContribution: 0,
      topologyAffinity: 0,
    },
    foraging: {
      maturityDays: 6,
      potencyWindow: 'any',
      nightBonus: 0,
      nightDanger: 0.05,
      contaminationRate: 0.03,
      shelfLife: 0.95,             // oil lasts very long
    },
  },
  {
    name: 'prickly_pear',
    label: 'Prickly Pear',
    elevation: [0, 5000],
    moistureMax: 0.25,
    density: 0.6,
    cluster: true,
    clusterRadius: 25,
    clusterCount: 3,
    size: 'small',
    color: 0x3a7d44,
    emoji: '🌵',
    pharmacology: {
      hydrating: 0.3,
      nutritive: 0.25,
      metabolic: 0.2,
      toxicity: 0,
    },
    scienceInteractions: {
      contaminationResistance: 0.35,
      chemicalReactivity: 0.3,
      fluidContribution: 0.2,     // mucilage creates sticky zones
      topologyAffinity: 0,
    },
    foraging: {
      maturityDays: 4,
      potencyWindow: 'day',
      nightBonus: 0,
      nightDanger: 0.25,          // scorpions hide under pads
      contaminationRate: 0.06,
      shelfLife: 0.5,
    },
  },
  {
    name: 'agave',
    label: 'Agave',
    elevation: [1000, 5500],
    moistureMax: 0.25,
    density: 0.3,
    cluster: false,
    size: 'medium',
    color: 0x8fa05c,
    emoji: '🌱',
    pharmacology: {
      antiInflammatory: 0.2,
      antimicrobial: 0.25,
      nutritive: 0.15,
      toxicity: 0.05,            // raw sap can irritate skin
    },
    scienceInteractions: {
      contaminationResistance: 0.5,  // saponins repel microbes
      chemicalReactivity: 0.4,
      fluidContribution: 0.1,        // sap creates small fluid zones
      topologyAffinity: 0.1,
    },
    foraging: {
      maturityDays: 8,            // slow-growing succulent
      potencyWindow: 'any',
      nightBonus: 0,
      nightDanger: 0.15,
      contaminationRate: 0.04,
      shelfLife: 0.85,            // dried fiber lasts a long time
    },
  },
  {
    name: 'yucca',
    label: 'Yucca',
    elevation: [1500, 6500],
    moistureMax: 0.3,
    density: 0.25,
    cluster: false,
    size: 'medium',
    color: 0x6f8e4a,
    emoji: '🌿',
    heightOffset: 18,
    pharmacology: {
      antiInflammatory: 0.15,
      antimicrobial: 0.3,         // saponins are mild antimicrobials
      toxicity: 0.05,
    },
    scienceInteractions: {
      contaminationResistance: 0.55,
      chemicalReactivity: 0.5,    // saponins are surfactants
      fluidContribution: 0.3,     // soaproot foams in water
      topologyAffinity: 0.1,
    },
    foraging: {
      maturityDays: 7,
      potencyWindow: 'any',
      nightBonus: 0,
      nightDanger: 0.1,
      contaminationRate: 0.04,
      shelfLife: 0.9,             // dried root stores well
    },
  },
  {
    name: 'barrel_cactus',
    label: 'Barrel Cactus',
    elevation: [0, 4500],
    moistureMax: 0.15,
    density: 0.25,
    cluster: false,
    size: 'small',
    color: 0x2e6b34,
    emoji: '🌵',
    pharmacology: {
      hydrating: 0.5,
      gastrointestinalRisk: 0.15,
      toxicity: 0.1,
    },
    scienceInteractions: {
      contaminationResistance: 0.4,
      chemicalReactivity: 0.25,
      fluidContribution: 0.15,
      topologyAffinity: 0,
    },
    foraging: {
      maturityDays: 5,
      potencyWindow: 'any',
      nightBonus: 0,
      nightDanger: 0.2,
      contaminationRate: 0.04,
      shelfLife: 0.3,             // pulp spoils fast
    },
  },
  {
    name: 'desert_lavender',
    label: 'Desert Lavender',
    elevation: [500, 4000],
    moistureMax: 0.35,
    density: 0.2,
    cluster: true,
    clusterRadius: 30,
    clusterCount: 2,
    size: 'small',
    color: 0x8b5e9b,
    emoji: '💜',
    pharmacology: {
      calming: 0.4,
      focusBoost: 0.3,
      antimicrobial: 0.15,
      toxicity: 0,
    },
    scienceInteractions: {
      contaminationResistance: 0.5,
      chemicalReactivity: 0.3,
      fluidContribution: 0,
      topologyAffinity: 0.2,      // grows in unusual crevices
    },
    foraging: {
      maturityDays: 3,
      potencyWindow: 'night',      // MORE potent at night
      nightBonus: 0.4,             // 40% potency boost at night
      nightDanger: 0.3,            // but scorpions are active
      contaminationRate: 0.03,
      shelfLife: 0.8,
    },
  },
  {
    name: 'juniper',
    label: 'Juniper',
    elevation: [3000, 7000],
    moistureMax: 0.6,
    density: 0.4,
    cluster: true,
    clusterRadius: 35,
    clusterCount: 3,
    size: 'medium',
    color: 0x2f5233,
    emoji: '🌲',
    heightOffset: 15,
    pharmacology: {
      antimicrobial: 0.3,
      antiInflammatory: 0.15,
      toxicity: 0.05,
    },
    scienceInteractions: {
      contaminationResistance: 0.55,
      chemicalReactivity: 0.35,
      fluidContribution: 0,
      topologyAffinity: 0.1,
    },
    foraging: {
      maturityDays: 4,
      potencyWindow: 'any',
      nightBonus: 0,
      nightDanger: 0.1,
      contaminationRate: 0.04,
      shelfLife: 0.85,
    },
  },
  {
    name: 'pinyon',
    label: 'Pinyon Pine',
    elevation: [4000, 7500],
    moistureMax: 0.6,
    density: 0.3,
    cluster: true,
    clusterRadius: 40,
    clusterCount: 2,
    size: 'medium',
    color: 0x1e4d2b,
    emoji: '🌲',
    heightOffset: 22,
    pharmacology: {
      nutritive: 0.4,
      toxicity: 0,
    },
    scienceInteractions: {
      contaminationResistance: 0.45,
      chemicalReactivity: 0.4,
      fluidContribution: 0,
      topologyAffinity: 0,
    },
    foraging: {
      maturityDays: 6,
      potencyWindow: 'any',
      nightBonus: 0,
      nightDanger: 0.05,
      contaminationRate: 0.03,
      shelfLife: 0.9,
    },
  },
];

/** Lookup flora definition by name. */
export const FLORA_MAP = Object.fromEntries(FLORA.map((f) => [f.name, f]));
