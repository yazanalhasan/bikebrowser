export const WORLD_TILE_SIZE = 64;

export const DEPTHS = {
  ground: 0,
  groundDecor: 10,
  road: 20,
  sidewalk: 30,
  shadows: 40,
  buildings: 100,
  plantsBack: 120,
  props: 160,
  characters: 200,
  plantsFront: 260,
  interaction: 500,
  labels: 700,
  ui: 1000,
};

/**
 * On-screen scale for the 96 px character sheets (Zuzu's atlas, Mariam, Lina).
 *
 * The sheets are authored at 96x96 per frame with the figure 72–84 px tall and
 * its feet on a y=91 baseline. Drawing them all at this one scale keeps
 * relative heights exactly as drawn — an adult reads taller than a kid because
 * the art says so, not because a scene picked a number — and lands Zuzu at
 * roughly the 92 px he occupied as vector art, so camera framing and the
 * collision box tuned for that avatar still hold.
 *
 * Changing this rescales every character together. Do not scale characters
 * per scene.
 */
export const CHARACTER_PIXEL_SCALE = 1.1;

export const SCALE = {
  zuzu: 1,
  child: 1,
  adultNpc: 1,
  bike: 1,
  smallProp: 1,
  shrubSmall: 1,
  shrubLarge: 1,
  mesquiteTree: 1,
  house: 1,
};

export const PALETTE = {
  grassBase: 0x7fb13d,
  grassHighlight: 0xa8cf62,
  grassShadow: 0x5d8e32,
  roadBase: 0x3f4548,
  roadEdge: 0xe8e2d6,
  sidewalkBase: 0xd7d3ca,
  sidewalkShadow: 0xa9a39a,
  desertSand: 0xc9a76a,
  cactusGreen: 0x3e8f48,
  mesquiteGreen: 0x5f9d35,
  uiCream: 0xfff7e8,
  uiTextDark: 0x1f2937,
  uiAccentGold: 0xf7b733,
  uiAccentBlue: 0x2563eb,
  dangerRed: 0xdc2626,
  successGreen: 0x16a34a,
};

export const PALETTE_HEX = {
  grassBase: '#7FB13D',
  grassHighlight: '#A8CF62',
  grassShadow: '#5D8E32',
  roadBase: '#3F4548',
  roadEdge: '#E8E2D6',
  sidewalkBase: '#D7D3CA',
  sidewalkShadow: '#A9A39A',
  desertSand: '#C9A76A',
  cactusGreen: '#3E8F48',
  mesquiteGreen: '#5F9D35',
  uiCream: '#FFF7E8',
  uiTextDark: '#1F2937',
  uiAccentGold: '#F7B733',
  uiAccentBlue: '#2563EB',
  dangerRed: '#DC2626',
  successGreen: '#16A34A',
};

export const LABEL_STYLE = {
  backgroundColor: PALETTE.uiCream,
  textColor: PALETTE_HEX.uiTextDark,
  borderColor: 0xe8dcc7,
  shadowColor: 0x1f2937,
  fontFamily: 'sans-serif',
  fontSize: 11,
  fontStyle: 'bold',
  paddingX: 9,
  paddingY: 5,
  radius: 7,
  alpha: 0.96,
};
