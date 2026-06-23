// Shared data for the habitat-fit diorama (Ecology Ch + Salt River biome). Each
// placement is an OBSERVE→PREDICT→RESULT site: pick the species/material that
// fits the conditions. Sourced from the in-game act1 ecology + biome datasets.
import { act1EcologyPlacements } from '../../game/data/act1/act1Ecology.js';
import { act1Biomes } from '../../game/data/act1/act1Biomes.js';

// Visual catalog: colour + form for the 3D diorama, plus a one-line trait.
export const SPECIES_VIS = {
  mesquite: { color: '#5b7d3a', form: 'tree', trait: 'shade maker · deep roots' },
  creosote: { color: '#8a9a4e', form: 'shrub', trait: 'spaced leaves · dry-tough' },
  saguaro: { color: '#3f7d52', form: 'cactus', trait: 'stores water · slow' },
  saltbush: { color: '#9fb0a0', form: 'shrub', trait: 'sheds salt · brackish' },
  cottonwood: { color: '#7cc05f', form: 'tree', trait: 'leafy shade · fresh bank' },
  // engineering options (biome salt crossing)
  steel: { color: '#c1c7d0', form: 'post', trait: 'strong · rusts in salt' },
  copper_brace: { color: '#c87a3a', form: 'post', trait: 'corrosion-resistant' },
  weak_scrap: { color: '#7a6a55', form: 'post', trait: 'fails under load' },
};

function optLabel(id) {
  return id.split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
}

// Normalize a placement to a common shape the lab + diorama consume.
function normalize(p) {
  return {
    id: p.id,
    kind: p.kind || 'ecology',
    site: p.site,
    conditions: p.conditions,
    options: p.options.map((id) => ({ id, label: optLabel(id), vis: SPECIES_VIS[id] || { color: '#888', form: 'shrub', trait: '' } })),
    correct: p.correct,
    why: p.why,
    wrongWhy: p.wrongWhy || {},
  };
}

export const ECOLOGY_PLACEMENTS = act1EcologyPlacements.map(normalize);
export const BIOME_PLACEMENTS = (act1Biomes[0]?.placements || []).map(normalize);

export const DATASETS = {
  ecology: { title: 'Plant the Desert', theme: 'wash', doneEvent: 'ecology:done', placements: ECOLOGY_PLACEMENTS,
    summary: 'Each plant fits a place: deep-rooted shade for the wash edge, dry-tough survivors for the open flat.' },
  biome: { title: 'Salt River — New Rules', theme: 'salt_river', doneEvent: 'biome:done', completeEvent: 'biome:complete', placements: BIOME_PLACEMENTS,
    summary: 'A new biome has new rules: salt-tolerant life on the banks, corrosion-proof metal in the water.' },
};
