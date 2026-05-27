import { act1Materials } from '../../data/act1/index.js';

export const items = [
  { id: 'bike', name: 'Bike', kind: 'vehicle' },
  { id: 'patch_kit', name: 'Patch Kit', kind: 'tool' },
  { id: 'tire_lever', name: 'Tire Lever', kind: 'tool' },
  ...act1Materials.map((material) => ({
    id: material.id,
    name: material.displayName,
    kind: 'material',
  })),
];
