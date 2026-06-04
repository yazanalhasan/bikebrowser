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
        notebookEntry: { id: 'saltbush', title: 'Saltbush', body: 'Saltbush tolerates brackish soil by shedding salt through its leaves, so it fits wet, sunny salt flats better than freshwater bank trees.' },
      },
      {
        id: 'fresh_bank_tree',
        kind: 'ecology',
        site: 'A raised bend above the salty crust. The soil stays moist after floods, but fresh seep water reaches the roots.',
        conditions: ['moist fresh bank', 'low salinity', 'afternoon sun'],
        options: ['saltbush', 'cottonwood', 'mesquite'],
        correct: 'cottonwood',
        why: 'Cottonwood can grow tall on a moist fresh bank, where roots reach river seep water without sitting in salty crust.',
        wrongWhy: {
          saltbush: 'Saltbush handles salty flats, but this higher fresh bank has enough moisture for a taller shade tree.',
          mesquite: 'Mesquite can follow deep dry-wash water, but this site is a moist riverbank where cottonwood shade is the better fit.',
        },
        discovery: { id: 'plant_cottonwood', category: 'plant', title: 'Cottonwood', detail: 'A riverbank tree that needs moist, lower-salinity soil and gives broad shade.' },
        notebookEntry: { id: 'cottonwood', title: 'Cottonwood', body: 'Cottonwood belongs on moist riverbanks with fresher water. It gives shade and stabilizes banks, but salty crust can burn its roots.' },
      },
      {
        id: 'dry_terrace_mesquite',
        kind: 'ecology',
        site: 'A sandy terrace set back from the river. Salt spray is light, the surface dries fast, and deep moisture lingers below.',
        conditions: ['dry surface', 'deep moisture', 'full sun'],
        options: ['cottonwood', 'saltbush', 'mesquite'],
        correct: 'mesquite',
        why: 'Mesquite reaches deep water and handles exposed sun, so it fits the dry terrace better than wet-bank or salt-flat plants.',
        wrongWhy: {
          cottonwood: 'Cottonwood needs steady moist bank soil; this terrace dries too fast at the surface.',
          saltbush: 'Saltbush is best on salty brackish flats, but this terrace is drier with deeper fresh moisture.',
        },
        discovery: { id: 'concept_river_terrace_roots', category: 'plant', title: 'River terrace roots', detail: 'Set back from the river, deep-rooted mesquite can use buried moisture while the surface stays dry.' },
        notebookEntry: { id: 'river_mesquite', title: 'River Terrace Mesquite', body: 'Mesquite fits dry terraces near washes and rivers because its deep roots can reach buried moisture while its canopy tolerates full sun.' },
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
