// Phase 2.4 — Multi-Biome. A biome is a reachable region that carries the full
// loop (observe -> predict -> outcome -> payoff), NOT an empty area. Salt River
// is the first: it unlocks once the bridge is repaired (the wider map opens) and
// teaches that a new place has new rules (salt-tolerant life, corrosion).
export const act1Biomes = [
  {
    id: 'salt_river',
    name: 'Salt River',
    unlockedBy: 'widerMap',
    intro: 'The Salt River runs wide and brackish. Cottonwoods crowd the far bank; the near bank is bare, crusted salt flat. New place, new rules.',
    landmark: { id: 'landmark_salt_river', title: 'Salt River', detail: 'A wide brackish river — salt-tolerant life on the banks, fast corrosion for the wrong metal.' },
    placements: [
      {
        id: 'salt_bank_plant',
        kind: 'ecology',
        site: 'The bare salt flat right at the river edge — crusted white, soaked with brackish water.',
        conditions: ['salty soil', 'wet edge', 'full sun'],
        options: ['cottonwood', 'saltbush', 'mesquite'],
        correct: 'saltbush',
        why: 'Saltbush is built for this — it sheds salt through its leaves and thrives on the brackish flat.',
        wrongWhy: {
          cottonwood: 'Cottonwood wants fresh water; the salt would burn its roots — it belongs on the far bank.',
          mesquite: 'Mesquite likes a dry wash with deep fresh water, not a salt-soaked edge.',
        },
        discovery: { id: 'plant_saltbush', category: 'plant', title: 'Saltbush', detail: 'A salt-shedding shrub that thrives on brackish flats.' },
      },
      {
        id: 'salt_crossing_material',
        kind: 'engineering',
        site: 'A crossing must stand in the brackish current. Salt water eats the wrong metal in a season.',
        conditions: ['salt water', 'constant wet', 'load-bearing'],
        options: ['steel', 'copper_brace', 'weak_scrap'],
        correct: 'copper_brace',
        why: 'Copper resists salt-water corrosion — it lasts in the river where steel would rust away.',
        wrongWhy: {
          steel: 'Steel is strong but rusts fast in salt water — the crossing would fail within a season.',
          weak_scrap: 'Weak scrap fails under load anywhere, and salt water only speeds its end.',
        },
        discovery: { id: 'concept_corrosion', category: 'engineering', title: 'Corrosion resistance', detail: 'In salt water, choose corrosion-resistant materials (copper) over strong-but-rusting ones (steel).' },
      },
    ],
  },
];
