/**
 * Foraging scenery — mount layout-driven desert plants and animals into any
 * local scene, and run the forage interaction.
 *
 * This is the carry-forward half of what used to be ~160 lines private to
 * `scenes/StreetBlockScene.js`. Splitting the neighborhood into Home Street
 * and Desert Edge needed the same flora/fauna behaviour in a second scene,
 * and copying it would have forked the foraging system per scene.
 *
 * Takes a scene as an argument; imports no scene (arc.md §4). Same shape as
 * `systems/obstacleSystem.js`, which already does this.
 *
 * Primitive declarations (arc.md §8.1):
 * - Environmental primitives consulted: none directly. Plant and animal
 *   placement comes from the scene's layout JSON, which is authored per
 *   scene; this module does not read biome or terrain and does not classify
 *   them. A terrain-aware spawn rule would belong in the ecology substrate,
 *   not here.
 * - Progression primitives updated: inventory (item grants), quest step
 *   advancement via the returned dialog `step`, and ecology observation /
 *   forage events through `systems/ecology`. No knowledge-state writes
 *   (§8.5 gating respected — this module never queries that API) and no
 *   discovery-state writes.
 * - Act 1 -> Act 3 scaling: one code path for every act and every scene. A
 *   new foraging scene is a layout file plus a `FORAGE_PLANTS` row, not a
 *   new branch (§8.2).
 */

import QUESTS from '../data/quests.js';
import { getForageItems, getForageDescription } from '../data/foragePlants.js';
import { getSceneObstacles } from '../data/obstacles.js';
import { getNpcProfile } from '../data/npcProfiles.js';
import { saveGame } from './saveSystem.js';
import {
  registerEntities,
  attachEcologyTicker,
  emitObservation,
  emitForage,
} from './ecology/index.js';
import { ECOLOGY_ASSET_KEYS } from './ecology/ecologyAssetManifest.js';
import { createWorldLabel } from '../../../game/ui/WorldLabel.js';
import { drawPlant } from '../utils/plantRenderer.js';
import { groundDepth } from '../../../game/assets/act1Art.js';

/** Default visual scale for an interactive plant. */
export const INTERACTIVE_PLANT_SCALE = 1.65;

/**
 * How close Zuzu has to be before a plant or animal names itself. Tuned to
 * sit just outside the interaction radius, so the name arrives slightly
 * before the "press E" prompt does.
 */
export const NEARBY_LABEL_RADIUS = 110;

/** Tidy display name for an animal row. */
export function formatAnimalLabel(animal) {
  const bySpecies = {
    rabbit: 'Jackrabbit',
    jackrabbit: 'Jackrabbit',
    javelina: 'Javelina',
    coyote: 'Coyote',
  };
  const labelKey = animal.label?.toLowerCase?.().replace(/^desert\s+/, '');
  return bySpecies[animal.speciesId] || bySpecies[labelKey] || animal.label || animal.speciesId;
}

/**
 * Draw one plant: painted sprite if the ecology pack has art for the
 * species, else the vector fallback. Keyed by species so a species added to
 * `data/ecology.js` picks up its art with no code change.
 */
function drawPlantVisual(scene, p) {
  const plantKey = ECOLOGY_ASSET_KEYS.plants[p.species];
  const scale = p.visualScale || INTERACTIVE_PLANT_SCALE;
  if (plantKey && scene.hasArtTexture?.(plantKey)) {
    return scene.addProp(plantKey, p.x, p.y + 14, {
      displayHeight: 96 * (scale / INTERACTIVE_PLANT_SCALE),
      depth: groundDepth(p.y),
    });
  }
  const container = drawPlant(scene, p.species, p.x, p.y, { scale });
  container.setDepth(4); // background decoration, below the player (depth 6)
  return null;
}

/**
 * Mount every plant in a layout's `plants` array: visual, interaction zone
 * (which carries the proximity-gated name label), and an EcologyEntity.
 *
 * @returns {{ entities: object[], index: Map<string, object>, plants: object[] }}
 *   `index` is keyed `${species}|${x}|${y}` so the interaction handler can
 *   find the entity for the exact plant the player touched.
 */
export function mountLayoutFlora(scene, plants = [], options = {}) {
  const sceneKey = options.sceneKey || scene.getSceneKey?.() || scene.scene?.key || '';
  const mounted = [];

  for (const p of plants) {
    drawPlantVisual(scene, p);

    scene.addInteractable({
      x: p.x,
      y: p.y,
      label: p.label,
      icon: '', // no emoji — the plant art is the visual
      radius: p.radius,
      grantsItems: getForageItems(p.species),
      metadata: { type: 'plant', species: p.species },
      onInteract: () => handlePlantInteract(scene, p.species, p.label, p.x, p.y),
    });

    // No separate caption here. `addInteractable` already draws the plant's
    // name and only shows it when Zuzu is close (LocalSceneBase). The old
    // street code drew BOTH, so every plant was labelled twice — that
    // doubling is half of why the scene read as cluttered.

    mounted.push({ species: p.species, x: p.x, y: p.y });
  }

  const configs = plants.map((p, i) => ({
    id: `${sceneKey}_plant_${i}_${p.species}`,
    speciesId: p.species,
    sceneKey,
    x: p.x,
    y: p.y,
    spawnedBy: 'static',
    interactionRadius: p.radius,
  }));
  const entities = registerEntities(scene, configs);
  const index = new Map();
  for (const ent of entities) index.set(`${ent.speciesId}|${ent.x}|${ent.y}`, ent);

  scene._ecologyEntityIndex = index;
  attachEcologyTicker(scene);

  return { entities, index, plants: mounted };
}

/**
 * Mount every animal in a layout's `animals` array: sprite, proximity
 * label, and an observable (non-forageable) EcologyEntity per animal.
 */
export function mountLayoutFauna(scene, animals = [], options = {}) {
  const sceneKey = options.sceneKey || scene.getSceneKey?.() || scene.scene?.key || '';
  const labelRadius = options.labelRadius ?? NEARBY_LABEL_RADIUS;

  for (const a of animals) {
    const key = ECOLOGY_ASSET_KEYS.animals[a.speciesId];
    if (!key) continue;
    scene.addProp(key, a.x, a.y + 12, { displayHeight: 52, depth: groundDepth(a.y) });
    createWorldLabel(scene, a.x, a.y + 34, formatAnimalLabel(a), {
      depth: 14,
      fontSize: 10,
      maxWidth: 118,
      minZoom: 0.2,
      nearRadius: labelRadius,
    });
  }

  const configs = animals.map((a, i) => ({
    id: `${sceneKey}_animal_${i}_${a.speciesId}`,
    speciesId: a.speciesId,
    sceneKey,
    x: a.x,
    y: a.y,
    spawnedBy: 'static',
    interactionRadius: a.interactionRadius,
    observable: true,
    forageable: false,
  }));
  return registerEntities(scene, configs);
}

/**
 * Display name of whoever gave the active quest, for "bring this back to X".
 * Returns null when there is no giver, so the caller can drop the sentence
 * rather than name the wrong neighbour.
 */
function activeQuestGiverName(state) {
  const quest = QUESTS[state?.activeQuest?.id];
  if (!quest?.giver) return null;
  return getNpcProfile(quest.giver)?.name || null;
}

/**
 * Items an unsolved puzzle in this scene still needs.
 *
 * Without this a plant only ever yields what an active quest asked for, and
 * the wilted plant sits in Desert Edge unsolvable: the only quest granting
 * prickly-pear fruit arrives several quests later. A child who picks the
 * fruit because the plant obviously wants water should be able to do that.
 */
function unsolvedPuzzleItems(scene, state) {
  const sceneKey = scene.getSceneKey?.() || scene.scene?.key || '';
  const solved = new Set(state?.solvedObstacles || []);
  const wanted = new Set();
  for (const puzzle of getSceneObstacles(sceneKey).puzzles || []) {
    if (solved.has(puzzle.id)) continue;
    if (puzzle.solveCondition?.type === 'item' && puzzle.solveCondition.item) {
      wanted.add(puzzle.solveCondition.item);
    }
  }
  return wanted;
}

/** The active quest's current step, but only if it is a forage step. */
function currentForageStep(state) {
  if (!state.activeQuest) return null;
  const quest = QUESTS[state.activeQuest.id];
  if (!quest) return null;
  const step = quest.steps[state.activeQuest.stepIndex];
  return step?.type === 'forage' ? step : null;
}

/**
 * Run a plant interaction: grant an item if a quest wants one, otherwise
 * just tell the player about the plant. Either way the ecology substrate
 * records the interaction.
 *
 * Item-grant gates, unchanged from the original street implementation:
 *   (a) Canonical — the current step is a forage step whose `requiredItem`
 *       this plant produces.
 *   (b) Recovery — the active quest has SOME forage step wanting an item
 *       this plant produces and the player does not have it yet. Catches
 *       saves where an observe step auto-advanced past a gather step.
 */
export function handlePlantInteract(scene, species, label, plantX, plantY) {
  const state = scene.registry.get('gameState');
  const audioMgr = scene.registry.get('audioManager');
  audioMgr?.playSfx('interaction_ping');

  scene.registry.get('mcp')?.emit('FORAGE_AVAILABLE', { species, x: 0, y: 0 });

  const ecologyEntity = (typeof plantX === 'number' && typeof plantY === 'number')
    ? scene._ecologyEntityIndex?.get(`${species}|${plantX}|${plantY}`) ?? null
    : null;

  const items = getForageItems(species);
  const desc = getForageDescription(species, label);

  let grantedItem = null;
  const step = state.activeQuest ? currentForageStep(state) : null;
  if (step && items.includes(step.requiredItem)) {
    grantedItem = step.requiredItem;
  }
  if (!grantedItem && state.activeQuest) {
    const quest = QUESTS[state.activeQuest.id];
    if (quest) {
      grantedItem = items.find((item) =>
        !state.inventory.includes(item)
        && quest.steps.some((s) => s.type === 'forage' && s.requiredItem === item),
      ) || null;
    }
  }

  // (c) Puzzle flow — an unsolved puzzle in this scene needs an item this
  //     plant produces. Independent of any quest, so the wilted plant is
  //     solvable the moment a child thinks to bring it a juicy fruit.
  if (!grantedItem) {
    const puzzleWants = unsolvedPuzzleItems(scene, state);
    grantedItem = items.find(
      (item) => puzzleWants.has(item) && !state.inventory.includes(item),
    ) || null;
  }

  if (grantedItem) {
    const advancesCurrentStep = step?.requiredItem === grantedItem;
    const updated = { ...state, inventory: [...state.inventory, grantedItem] };
    scene.registry.set('gameState', updated);
    saveGame(updated);
    audioMgr?.playSfx('item_pickup');

    // Name whoever actually asked for it. This used to say "Mrs. Ramirez"
    // for every plant in the game, which is wrong for all of Mr. Chen's
    // quests. With no giver we leave the sentence out entirely.
    const giver = advancesCurrentStep ? activeQuestGiverName(state) : null;
    const found = `Found ${grantedItem.replace(/_/g, ' ')}! ${desc}`;

    scene.registry.set('dialogEvent', {
      speaker: 'Zuzu',
      text: giver ? `${found}\n\nBring this back to ${giver}.` : found,
      choices: null,
      step: advancesCurrentStep ? step : null,
    });

    if (ecologyEntity) {
      try { emitObservation(ecologyEntity, 'interact'); } catch { /* swallow */ }
      try { emitForage(ecologyEntity, 'interact'); } catch { /* swallow */ }
    }
    return;
  }

  scene.registry.set('dialogEvent', {
    speaker: 'Zuzu',
    text: desc,
    choices: null,
    step: null,
  });

  if (ecologyEntity) {
    try { emitObservation(ecologyEntity, 'interact'); } catch { /* swallow */ }
  }
}
