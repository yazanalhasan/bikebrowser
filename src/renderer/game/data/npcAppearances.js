/**
 * NPC appearance profiles — drawn procedurally by Npc.js using the same
 * style as Zuzu (Player.js). Each profile encodes the features that make
 * the character read as a specific person from across the map:
 *
 *   skin      — face + neck + hand tone
 *   hair      — { color, style, grayStreak? }
 *                 styles: 'short' | 'bun' | 'ponytail' | 'bob' | 'bald'
 *   facialHair — { color, style } — 'bushy_beard' | 'mustache'
 *   headgear  — { type, color } — 'flatcap' | 'hardhat' | 'rangerhat'
 *   glasses   — boolean
 *   shirt     — { color, style }
 *                 styles: 'basic' | 'sweater' | 'cardigan' | 'labcoat'
 *                       | 'overalls' | 'rangershirt'
 *   vest      — { color } — optional layer over shirt
 *   pants     — hex color
 *   shoes     — hex color
 *   accessory — 'tire_pump' | 'wrench' | 'pickaxe' | 'binoculars' | 'clipboard'
 */

export const NPC_APPEARANCES = {
  // Friendly middle-aged neighbor, experienced cyclist, warm aunt energy.
  mrs_ramirez: {
    skin: 0xd9a47a,
    hair: { color: 0x6b4e3a, style: 'bun', grayStreak: true },
    headgear: null,
    glasses: false,
    shirt: { color: 0xe5675b, style: 'sweater' }, // warm coral
    pants: 0x3a5673,                              // denim blue
    shoes: 0x3a2a1a,
    accessory: 'tire_pump',
  },

  // Retired engineer, patient grandpa who loves machines.
  mr_chen: {
    skin: 0xe0b893,
    hair: { color: 0x555555, style: 'short' },
    headgear: { type: 'flatcap', color: 0x6b5330 },
    glasses: true,
    shirt: { color: 0xc9a87d, style: 'cardigan' }, // beige cardigan
    pants: 0x4b5563,                               // gray slacks
    shoes: 0x2b2b2b,
    accessory: 'wrench',
  },

  // Grizzled miner, weathered, hardhat + beard.
  old_miner: {
    skin: 0xc69969,
    hair: { color: 0x9a8a7a, style: 'short' },
    facialHair: { color: 0x9a8a7a, style: 'bushy_beard' },
    headgear: { type: 'hardhat', color: 0xf9a825 },
    glasses: false,
    shirt: { color: 0x3e5671, style: 'overalls' },
    pants: 0x3e5671,
    shoes: 0x1f2937,
    accessory: 'pickaxe',
  },

  // Desert ranger / naturalist, outdoor gear, confident.
  desert_guide: {
    skin: 0xc8966a,
    hair: { color: 0x5c3a1e, style: 'ponytail' },
    headgear: { type: 'rangerhat', color: 0x7a5a3a },
    glasses: false,
    shirt: { color: 0x9b8f6e, style: 'rangershirt' }, // khaki
    vest: { color: 0x556b2f },                        // olive vest
    pants: 0x8b7c5a,                                  // khaki pants
    shoes: 0x3a2a1a,
    accessory: 'binoculars',
  },

  // River biologist, scientific, lab coat + clipboard.
  river_biologist: {
    skin: 0xd4a87a,
    hair: { color: 0x3b2f2f, style: 'bob' },
    headgear: null,
    glasses: true,
    shirt: { color: 0xf5f5f5, style: 'labcoat' },
    pants: 0x1e3a5f, // navy
    shoes: 0x2b2b2b,
    accessory: 'clipboard',
  },
};

/** Fallback when an NPC id has no declared appearance. */
export const DEFAULT_APPEARANCE = {
  skin: 0xd4956a,
  hair: { color: 0x3b2f2f, style: 'short' },
  headgear: null,
  glasses: false,
  shirt: { color: 0x3b82f6, style: 'basic' },
  pants: 0x4b5563,
  shoes: 0x1f2937,
  accessory: null,
};

export function getNpcAppearance(id) {
  return NPC_APPEARANCES[id] || null;
}
