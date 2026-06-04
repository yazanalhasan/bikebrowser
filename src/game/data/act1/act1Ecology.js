export const act1Ecology = [
  { id: 'mesquite', displayName: 'Mesquite', heat: 'shade maker', water: 'deep roots', habitat: 'wash edge', harvestEthic: 'take little; leave habitat' },
  { id: 'creosote', displayName: 'Creosote', heat: 'spaced leaves', water: 'survives dry soil', habitat: 'open desert', harvestEthic: 'observe only in Act 1' },
  { id: 'saguaro', displayName: 'Saguaro Landmark', heat: 'stored water', water: 'slow growth', habitat: 'desert landmark', harvestEthic: 'landmark, never harvest' },
  { id: 'wash_marker', displayName: 'Wash Ecology Marker', heat: 'monsoon channel', water: 'flash flood path', habitat: 'dry wash', harvestEthic: 'do not block animal paths' },
  { id: 'saltbush', displayName: 'Saltbush', heat: 'silver leaves', water: 'sheds salt', habitat: 'brackish flat', harvestEthic: 'observe; leave cover for small wildlife' },
  { id: 'cottonwood', displayName: 'Cottonwood', heat: 'leafy shade', water: 'fresh riverbank roots', habitat: 'higher river bank', harvestEthic: 'protect young trees and bank shade' },
];

// Phase 1.95 — Ecology Reachability. Each placement is a small predict loop:
// the player OBSERVES a site, PREDICTS which desert plant will thrive there,
// SEES the outcome (thrives / struggles), and gets the PAYOFF (why it fits, plus
// a notebook entry). Being wrong still teaches — the explanation names the plant
// that actually fits and why, mirroring the reasoning grader's philosophy.
export const act1EcologyPlacements = [
  {
    id: 'wash_edge_shade',
    site: 'A bare, sun-blasted bank right at the wash edge. You want shade and roots that hold the soil.',
    conditions: ['full sun', 'wash-edge soil', 'needs shade + deep roots'],
    options: ['creosote', 'mesquite', 'saguaro'],
    correct: 'mesquite',
    why: 'Mesquite is a shade maker with deep roots that reach the wash water and hold the bank.',
    wrongWhy: {
      creosote: 'Creosote spaces its leaves for the open desert — little shade, shallow hold for a bank.',
      saguaro: 'A saguaro is a slow-growing landmark, not a bank-stabiliser.',
    },
    notebookEntry: 'mesquite',
  },
  {
    id: 'open_dry_flat',
    site: 'An open, dry desert flat. Runoff rarely reaches here — the plant must survive on its own.',
    conditions: ['open desert', 'very dry soil', 'no extra water'],
    options: ['mesquite', 'creosote', 'saguaro'],
    correct: 'creosote',
    why: 'Creosote survives dry soil with spaced leaves and needs no wash water — it owns the open desert.',
    wrongWhy: {
      mesquite: 'Mesquite wants wash water its deep roots can reach — this flat is too dry for it to thrive.',
      saguaro: 'A saguaro is a rare landmark, not a quick coloniser of an open flat.',
    },
    notebookEntry: 'creosote',
  },
];
