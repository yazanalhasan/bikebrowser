import {
  ACT1_CHARACTER_SHEETS,
  ACT1_IMAGE_LOADS,
  ACT1_TILESETS,
} from './act1ArtRegistry.js';

export const ASSET_MANIFEST = {
  atlases: [
    {
      key: 'neighborhood_atlas',
      image: '/assets/game/atlases/neighborhood.png',
      json: '/assets/game/atlases/neighborhood.json',
    },
    {
      key: 'zuzu_atlas',
      image: '/assets/game/atlases/zuzu.png',
      json: '/assets/game/atlases/zuzu.json',
    },
  ],
  images: [
    { key: 'shadow_soft_small', path: '/assets/game/ui/shadow_soft_small.png' },
    { key: 'shadow_soft_medium', path: '/assets/game/ui/shadow_soft_medium.png' },
    { key: 'shadow_soft_large', path: '/assets/game/ui/shadow_soft_large.png' },
    // Act 1 production art — props, plants, animals, items, challenge markers,
    // map icons, UI badges, scene grounds and ecology sprites. Generated from
    // docs/act1-art-manifest.json (see act1ArtRegistry.js).
    ...ACT1_IMAGE_LOADS.map((r) => ({ key: r.key, path: `/${r.path}` })),
  ],
  tilemaps: [
    {
      key: 'neighborhood_map',
      path: '/assets/game/maps/neighborhood.json',
    },
  ],
  tilesets: ACT1_TILESETS.map((t) => ({
    key: t.key,
    path: `/${t.path}`,
    tileWidth: t.tileWidth,
    tileHeight: t.tileHeight,
  })),
  // Mariam and Lina ship as 4x4 sheets of 96px frames (feet baseline y=91),
  // the same spec as Zuzu's Native96 sheets.
  spritesheets: Object.values(ACT1_CHARACTER_SHEETS).map((s) => ({
    key: s.key,
    path: `/${s.path}`,
    frameWidth: s.frameWidth,
    frameHeight: s.frameHeight,
  })),
};
