/**
 * StreetBlockScene — the street outside Zuzu's house.
 *
 * Local playable scene with:
 *   - Sidewalks, road, driveways
 *   - Zuzu's house exterior
 *   - Mrs. Ramirez + flat tire quest
 *   - Neighbor houses
 *   - Exit to garage (west)
 *   - Exit to overworld (north)
 *
 * World size: 1000×700 (slightly larger than viewport for scrolling)
 */

import LocalSceneBase from './LocalSceneBase.js';
import { startQuest, getCurrentStep, advanceQuest } from '../systems/questSystem.js';
import { saveGame } from '../systems/saveSystem.js';
import { NPC_PLACEMENTS } from '../data/neighborhoodLayout.js';
import { getQuestBoard, getNextQuestForNPC } from '../data/questBoard.js';
import QUESTS from '../data/quests.js';
import { drawPlant } from '../utils/plantRenderer.js';
import { registerSceneHmr } from '../dev/phaserHmr.js';
import { loadLayout } from '../utils/loadLayout.js';
import { startInteractiveExplainer } from '../systems/interactiveExplainerSystem.js';
import {
  registerEntities,
  attachEcologyTicker,
  emitObservation,
  emitForage,
} from '../systems/ecology/index.js';
import {
  preloadEcologyAssets,
  ECOLOGY_ASSET_KEYS,
} from '../systems/ecology/ecologyAssetManifest.js';

const PLANT_GRANTS = {
  mesquite: ['mesquite_pods', 'mesquite_wood_sample', 'bio_sample_bacteria'],
  creosote: ['creosote_leaves'],
  prickly_pear: ['prickly_pear_fruit'],
  barrel_cactus: ['barrel_cactus_pulp'],
  jojoba: ['jojoba_seeds'],
  agave: ['agave_fiber', 'bio_sample_agave'],
  yucca: ['yucca_root'],
  desert_lavender: ['desert_lavender_flowers'],
  ephedra: ['ephedra_stems'],
  yerba_mansa: ['yerba_mansa_root'],
};
const INTERACTIVE_PLANT_SCALE = 1.65;

export default class StreetBlockScene extends LocalSceneBase {
  static layoutEditorConfig = {
    layoutAssetKey: 'streetBlockLayout',
    layoutPath: 'layouts/street-block.layout.json',
  };

  constructor() {
    super('StreetBlockScene');
  }

  getWorldSize() {
    return { width: 1000, height: 700 };
  }

  preload() {
    super.preload?.();
    this.load.json('streetBlockLayout', 'layouts/street-block.layout.json');
    // ECOLOGY (additive — Phase 4 animals): preload animal sprite textures.
    // Plant textures are unused visually (plants use drawPlant graphics), but
    // animal sprites are rendered via this.add.image using ecology texture keys.
    preloadEcologyAssets(this);
  }

  createWorld() {
    this.layout = loadLayout(this, 'streetBlockLayout');
    const { width } = this.getWorldSize();
    const state = this.registry.get('gameState');

    // === GROUND ===
    // Grass
    {
      const o = this.layout.grass;
      this._drawGrassField(o);
    }

    // Road (horizontal, center)
    {
      const o = this.layout.road;
      this._drawRoadway(o, width);
    }
    // Sidewalks
    {
      const o = this.layout.sidewalk_top;
      this._drawSidewalk(o);
    }
    {
      const o = this.layout.sidewalk_bottom;
      this._drawSidewalk(o);
    }

    // === ZUZU'S HOUSE (left side, north of road) ===
    // House body
    {
      const o = this.layout.zuzu_house_body;
      this.add.rectangle(o.x, o.y, o.w, o.h, 0xd4a574).setStrokeStyle(3, 0xc4945e).setDepth(1);
    }
    // Roof
    const roofGfx = this.add.graphics();
    roofGfx.fillStyle(0x8d6e63);
    {
      const o = this.layout.zuzu_house_roof;
      roofGfx.fillTriangle(o.x1, o.y1, o.x2, o.y2, o.x3, o.y3);
    }
    roofGfx.setDepth(2);
    // Door
    {
      const o = this.layout.zuzu_house_door;
      this.add.rectangle(o.x, o.y, o.w, o.h, 0x5d4037).setDepth(2);
    }
    {
      const o = this.layout.zuzu_house_doorknob;
      this.add.circle(o.x, o.y, o.r, 0xfdd835).setDepth(3);
    }
    // Windows
    {
      const o = this.layout.zuzu_house_window_left;
      this.add.rectangle(o.x, o.y, o.w, o.h, 0x87ceeb, 0.7).setStrokeStyle(2, 0x795548).setDepth(2);
    }
    {
      const o = this.layout.zuzu_house_window_right;
      this.add.rectangle(o.x, o.y, o.w, o.h, 0x87ceeb, 0.7).setStrokeStyle(2, 0x795548).setDepth(2);
    }
    // Label
    {
      const o = this.layout.zuzu_house_label;
      this._drawMapLabel(o.x, o.y, "Zuzu's House", { icon: '🏠', depth: 9 });
    }
    // House collision
    {
      const o = this.layout.zuzu_house_collision;
      this.addWall(o.x, o.y, o.w, o.h);
    }

    // Driveway
    {
      const o = this.layout.zuzu_driveway;
      this.add.rectangle(o.x, o.y, o.w, o.h, 0x9e9e9e);
    }

    // === NEIGHBOR HOUSE — Mrs. Ramirez (center-right, north of road) ===
    {
      const o = this.layout.ramirez_house_body;
      this.add.rectangle(o.x, o.y, o.w, o.h, 0xef9a9a).setStrokeStyle(3, 0xe57373).setDepth(1);
    }
    const roofGfx2 = this.add.graphics();
    roofGfx2.fillStyle(0xc62828);
    {
      const o = this.layout.ramirez_house_roof;
      roofGfx2.fillTriangle(o.x1, o.y1, o.x2, o.y2, o.x3, o.y3);
    }
    roofGfx2.setDepth(2);
    {
      const o = this.layout.ramirez_house_door;
      this.add.rectangle(o.x, o.y, o.w, o.h, 0x5d4037).setDepth(2);
    }
    {
      const o = this.layout.ramirez_house_doorknob;
      this.add.circle(o.x, o.y, o.r, 0xfdd835).setDepth(3);
    }
    {
      const o = this.layout.ramirez_house_window_left;
      this.add.rectangle(o.x, o.y, o.w, o.h, 0x87ceeb, 0.7).setStrokeStyle(2, 0x795548).setDepth(2);
    }
    {
      const o = this.layout.ramirez_house_window_right;
      this.add.rectangle(o.x, o.y, o.w, o.h, 0x87ceeb, 0.7).setStrokeStyle(2, 0x795548).setDepth(2);
    }
    {
      const o = this.layout.ramirez_house_label;
      this._drawMapLabel(o.x, o.y, 'Ramirez House', { icon: '🏠', depth: 9 });
    }
    {
      const o = this.layout.ramirez_house_collision;
      this.addWall(o.x, o.y, o.w, o.h);
    }

    // === NEIGHBOR HOUSE — far right (decorative) ===
    {
      const o = this.layout.blue_house_body;
      this.add.rectangle(o.x, o.y, o.w, o.h, 0x90caf9).setStrokeStyle(3, 0x64b5f6).setDepth(1);
    }
    const roofGfx3 = this.add.graphics();
    roofGfx3.fillStyle(0x1565c0);
    {
      const o = this.layout.blue_house_roof;
      roofGfx3.fillTriangle(o.x1, o.y1, o.x2, o.y2, o.x3, o.y3);
    }
    roofGfx3.setDepth(2);
    {
      const o = this.layout.blue_house_door;
      this.add.rectangle(o.x, o.y, o.w, o.h, 0x5d4037).setDepth(2);
    }
    {
      const o = this.layout.blue_house_collision;
      this.addWall(o.x, o.y, o.w, o.h);
    }

    // === SOUTH SIDE — more houses ===
    {
      const o = this.layout.green_house_body;
      this.add.rectangle(o.x, o.y, o.w, o.h, 0xc8e6c9).setStrokeStyle(3, 0xa5d6a7).setDepth(1);
    }
    const roofGfx4 = this.add.graphics();
    roofGfx4.fillStyle(0x2e7d32);
    {
      const o = this.layout.green_house_roof;
      roofGfx4.fillTriangle(o.x1, o.y1, o.x2, o.y2, o.x3, o.y3);
    }
    roofGfx4.setDepth(2);
    {
      const o = this.layout.green_house_door;
      this.add.rectangle(o.x, o.y, o.w, o.h, 0x5d4037).setDepth(2);
    }
    {
      const o = this.layout.green_house_collision;
      this.addWall(o.x, o.y, o.w, o.h);
    }

    {
      const o = this.layout.yellow_house_body;
      this.add.rectangle(o.x, o.y, o.w, o.h, 0xfff9c4).setStrokeStyle(3, 0xfff176).setDepth(1);
    }
    const roofGfx5 = this.add.graphics();
    roofGfx5.fillStyle(0xf9a825);
    {
      const o = this.layout.yellow_house_roof;
      roofGfx5.fillTriangle(o.x1, o.y1, o.x2, o.y2, o.x3, o.y3);
    }
    roofGfx5.setDepth(2);
    {
      const o = this.layout.yellow_house_door;
      this.add.rectangle(o.x, o.y, o.w, o.h, 0x5d4037).setDepth(2);
    }
    {
      const o = this.layout.yellow_house_collision;
      this.addWall(o.x, o.y, o.w, o.h);
    }

    this._skinNeighborhoodHouses();

    // === TREES / DECORATIONS ===
    for (const t of this.layout.trees) {
      this._drawTree(t.x, t.y, t.scale || 1);
    }

    // === ECOLOGY PLANTS (drawn with graphics + interactable) ===
    this._ecologyPlants = [];

    for (const p of this.layout.plants) {
      // Draw visual plant (graphics-based, not emoji)
      const plantContainer = drawPlant(this, p.species, p.x, p.y, {
        scale: p.visualScale || INTERACTIVE_PLANT_SCALE,
      });
      plantContainer.setDepth(4); // background decoration, below player (depth 6)

      // Add invisible interaction zone (uses existing addInteractable for prompt/hitbox)
      this.addInteractable({
        x: p.x, y: p.y, label: p.label, icon: '', // no emoji — visual is drawn above
        radius: p.radius,
        grantsItems: PLANT_GRANTS[p.species] || [],
        metadata: { type: 'plant', species: p.species },
        onInteract: () => this._handlePlantInteract(p.species, p.label, p.x, p.y),
      });
      this._ecologyPlants.push({ species: p.species, x: p.x, y: p.y });
      this._drawMapLabel(p.x, p.y + (p.labelOffsetY || 31), p.label, {
        depth: 14,
        fontSize: 10,
        maxWidth: 142,
      });
    }

    // === ECOLOGY SUBSTRATE WIRING (additive — Phase 4) ===========================
    // Register each layout-driven plant as an EcologyEntity so the ecology
    // substrate can track observations and forage events alongside the
    // existing plant-interaction flow. The original `_handlePlantInteract`
    // path (forage gate, item grant, dialog) is preserved unchanged below;
    // ecology emission is layered on top.
    const SCENE_KEY = 'StreetBlockScene';
    const ecologyConfigs = this.layout.plants.map((p, i) => ({
      id: `${SCENE_KEY}_plant_${i}_${p.species}`,
      speciesId: p.species,
      sceneKey: SCENE_KEY,
      x: p.x,
      y: p.y,
      spawnedBy: 'static',
      interactionRadius: p.radius,
    }));
    /** @type {import('../systems/ecology/index.js').EcologyEntity[]} */
    this._ecologyEntities = registerEntities(this, ecologyConfigs);
    // Index by `${species}|${x}|${y}` so `_handlePlantInteract` can find
    // the registered entity for the specific plant the player interacted with.
    this._ecologyEntityIndex = new Map();
    for (const ent of this._ecologyEntities) {
      this._ecologyEntityIndex.set(`${ent.speciesId}|${ent.x}|${ent.y}`, ent);
    }
    attachEcologyTicker(this);

    // === ECOLOGY ANIMALS (additive — Phase 4 animals) ========================
    // Render layout-driven animal sprites and register them as EcologyEntity
    // instances. The existing plant rendering/registration above is unchanged.
    // `attachEcologyTicker` above is type-agnostic and already covers fauna.
    for (const a of this.layout.animals) {
      const key = ECOLOGY_ASSET_KEYS.animals[a.speciesId];
      if (!key) continue;
      this.add.image(a.x, a.y, key).setOrigin(0.5).setDepth(4).setDisplaySize(48, 48);
      this._drawMapLabel(a.x, a.y + 34, a.label || a.speciesId, {
        depth: 14,
        fontSize: 10,
        maxWidth: 118,
      });
    }

    const animalConfigs = this.layout.animals.map((a, i) => ({
      id: `${SCENE_KEY}_animal_${i}_${a.speciesId}`,
      speciesId: a.speciesId,
      sceneKey: SCENE_KEY,
      x: a.x,
      y: a.y,
      spawnedBy: 'static',
      interactionRadius: a.interactionRadius,
      observable: true,
      forageable: false,
    }));
    this._ecologyAnimalEntities = registerEntities(this, animalConfigs);
    for (const ent of this._ecologyAnimalEntities) {
      // eslint-disable-next-line no-console
      console.log(`[ecology-debug] registered animal: ${ent.speciesId} at ${ent.x}, ${ent.y}`);
    }
    // =========================================================================

    // Fire hydrant
    {
      const o = this.layout.fire_hydrant;
      this._drawFireHydrant(o.x, o.y);
    }

    // Mailboxes
    {
      const o = this.layout.mailbox_left;
      this._drawMailbox(o.x, o.y);
    }
    {
      const o = this.layout.mailbox_right;
      this._drawMailbox(o.x, o.y);
    }

    // Street sign
    {
      const o = this.layout.street_sign;
      this._drawStreetSign(o.x, o.y, 'E Trailside');
    }

    // === MRS. RAMIREZ NPC ===
    const ramirezData = NPC_PLACEMENTS.find(n => n.id === 'mrs_ramirez');
    this.addNpc({
      id: 'mrs_ramirez',
      name: 'Mrs. Ramirez',
      x: this.layout.npc_mrs_ramirez.x,
      y: this.layout.npc_mrs_ramirez.y,
      color: ramirezData?.color || 0xb45309,
      onInteract: () => this._handleNpcInteract('mrs_ramirez', 'flat_tire_repair'),
    });

    // Mrs. Ramirez's bike
    const questDone = state.completedQuests?.includes('flat_tire_repair');
    {
      const o = this.layout.ramirez_bike_icon;
      this._drawBike(o.x, o.y, { color: 0x2563eb, accent: 0xef4444, flat: !questDone, depth: 38 });
      this._ramirezBike = this._drawBikeBadge(o.x + 48, o.y - 8, questDone ? '✓' : '', questDone);
    }

    const ramirezBikeInteract = this.layout.ramirez_bike_icon;
    this.addInteractable({
      x: ramirezBikeInteract.x,
      y: ramirezBikeInteract.y,
      label: 'Flat Tire',
      icon: '!',
      radius: ramirezBikeInteract.interactionRadius || 75,
      onInteract: () => this._handleRamirezBikeInteract(),
    });

    // === MR. CHEN NPC ===
    const chenData = NPC_PLACEMENTS.find(n => n.id === 'mr_chen');
    this.addNpc({
      id: 'mr_chen',
      name: 'Mr. Chen',
      x: this.layout.npc_mr_chen.x,
      y: this.layout.npc_mr_chen.y,
      color: chenData?.color || 0x2563eb,
      onInteract: () => this._handleNpcInteract('mr_chen', 'chain_repair'),
    });

    // Mr. Chen's bike
    const chenQuestDone = state.completedQuests?.includes('chain_repair');
    const chenMotorCleaningActive =
      state.activeQuest?.id === 'engine_cleaning'
      && getCurrentStep(state)?.id === 'clean_motor';
    const chenBikeIcon = chenMotorCleaningActive
      ? '⚙'
      : chenQuestDone
        ? '✓'
        : '⛓';
    {
      const o = this.layout.chen_bike_icon;
      this._drawBike(o.x, o.y, { color: 0xef4444, accent: 0x111827, depth: 38 });
      this._chenBike = this._drawBikeBadge(o.x + 44, o.y - 7, chenBikeIcon, chenQuestDone);
      this.addInteractable({
        x: o.x,
        y: o.y,
        label: 'Mr. Chen Bike',
        icon: '',
        radius: o.interactionRadius || 85,
        metadata: { questObservation: 'motor_cleaned' },
        onInteract: () => this._handleChenBikeInteract(),
      });
    }

    // === EXITS ===
    // West exit → Garage
    {
      const o = this.layout.exit_zone_west;
      this.addExit({
        x: o.x, y: o.y,
        width: o.w, height: o.h,
        targetScene: 'ZuzuGarageScene',
        targetSpawn: 'fromStreet',
        label: '🏠 Garage ⬅',
      });
    }

    // North exit → Overworld
    {
      const o = this.layout.exit_zone_north;
      this._drawTopNeighborhoodSign(o.x, 24);
      this.addExit({
        x: o.x, y: o.y,
        width: o.w, height: o.h,
        targetScene: 'OverworldScene',
        targetSpawn: 'fromStreet',
        label: '🗺️ Neighborhood ⬆',
      });
    }

    // === WORLD MAP ACCESS: Bike GPS ===
    this.addInteractable({
      x: this.layout.interact_gps.x, y: this.layout.interact_gps.y,
      icon: '📡',
      label: 'Bike GPS',
      radius: 70,
      metadata: { questObservation: 'memory_zone_entered' },
      onInteract: () => {
        let state = this.registry.get('gameState');
        const step = getCurrentStep(state);
        const audioMgr = this.registry.get('audioManager');
        if (state?.activeQuest?.id === 'invisible_map' && step?.id === 'enter_dead_zone') {
          if (!state.observations?.includes('memory_zone_entered')) {
            state = {
              ...state,
              observations: [...(state.observations || []), 'memory_zone_entered'],
            };
            this.registry.set('gameState', state);
            saveGame(state);
          }
          audioMgr?.playSfx('ui_success');
          this.registry.set('dialogEvent', {
            speaker: 'Zuzu',
            text:
              'Bike GPS is off. No route arrow for this challenge — I need to remember where water is. The lake is north on the map, at Lake Edge.',
            choices: null,
            step,
          });
          return;
        }

        audioMgr?.playSfx('ui_panel_open');
        this._transitioning = true;
        this.cameras.main.fadeOut(350, 0, 0, 0, (_cam, progress) => {
          if (progress >= 1) {
            this.scene.start('WorldMapScene', {
              origin: 'StreetBlockScene',
              originSpawn: 'default',
            });
          }
        });
      },
    });
    // GPS post (visual)
    {
      const o = this.layout.gps_post;
      this._drawGpsPost(o.x, o.y);
    }

    // === WORLD BOUNDS ===
    {
      const o = this.layout.wall_south;
      this.addWall(o.x, o.y, o.w, o.h); // south
    }
  }

  _drawGrassField(o) {
    this.add.rectangle(o.x, o.y, o.w, o.h, 0x7fb13d).setDepth(-10);

    const gfx = this.add.graphics().setDepth(-9);
    for (let i = 0; i < 210; i++) {
      const x = (i * 67) % o.w;
      const y = (i * 43) % o.h;
      const color = i % 3 === 0 ? 0x96c65a : i % 3 === 1 ? 0x6c9c31 : 0xb4d36a;
      const alpha = i % 5 === 0 ? 0.5 : 0.28;
      gfx.fillStyle(color, alpha);
      gfx.fillEllipse(x, y, 10 + (i % 4) * 2, 4 + (i % 3));
    }

    gfx.lineStyle(1, 0x5f8f28, 0.14);
    for (let y = 12; y < o.h; y += 28) {
      gfx.lineBetween(0, y, o.w, y + ((y / 28) % 2 ? 3 : -3));
    }
  }

  _drawRoadway(o, width) {
    this.add.rectangle(o.x, o.y, o.w, o.h, 0x3f4548).setDepth(-5);
    const gfx = this.add.graphics().setDepth(-4);

    gfx.fillStyle(0x2f3437, 0.22);
    for (let i = 0; i < 180; i++) {
      const x = (i * 53) % width;
      const y = o.y - o.h / 2 + ((i * 29) % o.h);
      gfx.fillCircle(x, y, i % 4 === 0 ? 1.4 : 0.8);
    }

    gfx.lineStyle(3, 0xe8e2d6, 0.65);
    gfx.lineBetween(0, o.y - o.h / 2, width, o.y - o.h / 2);
    gfx.lineBetween(0, o.y + o.h / 2, width, o.y + o.h / 2);

    gfx.lineStyle(3, 0xf7c948, 0.85);
    for (let x = 24; x < width; x += 60) {
      gfx.lineBetween(x, o.y, x + 28, o.y);
    }
  }

  _drawSidewalk(o) {
    this.add.rectangle(o.x, o.y, o.w, o.h, 0xd7d3ca).setDepth(-2);
    const gfx = this.add.graphics().setDepth(-1);
    gfx.lineStyle(1, 0xa9a39a, 0.45);
    gfx.strokeRect(o.x - o.w / 2, o.y - o.h / 2, o.w, o.h);
    for (let x = o.x - o.w / 2; x <= o.x + o.w / 2; x += 42) {
      gfx.lineBetween(x, o.y - o.h / 2, x + 7, o.y + o.h / 2);
    }
  }

  _skinNeighborhoodHouses() {
    this._drawHouseSkin({
      body: this.layout.zuzu_house_body,
      roof: this.layout.zuzu_house_roof,
      door: this.layout.zuzu_house_door,
      knob: this.layout.zuzu_house_doorknob,
      windows: [this.layout.zuzu_house_window_left, this.layout.zuzu_house_window_right],
      bodyColor: 0xe7c98d,
      trimColor: 0xfff4d6,
      roofColor: 0x6d4c41,
      shutterColor: 0x8b5e34,
    });
    this._drawHouseSkin({
      body: this.layout.ramirez_house_body,
      roof: this.layout.ramirez_house_roof,
      door: this.layout.ramirez_house_door,
      knob: this.layout.ramirez_house_doorknob,
      windows: [this.layout.ramirez_house_window_left, this.layout.ramirez_house_window_right],
      bodyColor: 0xf79c8f,
      trimColor: 0xfff5f0,
      roofColor: 0xc93a2b,
      shutterColor: 0xc2412f,
    });
    this._drawHouseSkin({
      body: this.layout.blue_house_body,
      roof: this.layout.blue_house_roof,
      door: this.layout.blue_house_door,
      windows: [],
      bodyColor: 0x9dccf1,
      trimColor: 0xf0f7ff,
      roofColor: 0x1557a8,
      shutterColor: 0x1d4f91,
      garage: true,
      label: { text: 'Workshop', x: this.layout.blue_house_body.x - 34, y: this.layout.blue_house_body.y + 76, icon: '🔒' },
    });
    this._drawHouseSkin({
      body: this.layout.green_house_body,
      roof: this.layout.green_house_roof,
      door: this.layout.green_house_door,
      windows: [],
      bodyColor: 0xbed8aa,
      trimColor: 0xf3ffe9,
      roofColor: 0x2d7533,
      shutterColor: 0x2e6b34,
    });
    this._drawHouseSkin({
      body: this.layout.yellow_house_body,
      roof: this.layout.yellow_house_roof,
      door: this.layout.yellow_house_door,
      windows: [],
      bodyColor: 0xffd878,
      trimColor: 0xfff7d1,
      roofColor: 0xe77d1b,
      shutterColor: 0xc96b14,
    });
  }

  _drawHouseSkin({
    body,
    roof,
    door,
    knob,
    windows = [],
    bodyColor,
    trimColor,
    roofColor,
    shutterColor,
    garage = false,
    label = null,
  }) {
    this.add.ellipse(body.x + 8, body.y + body.h / 2 + 10, body.w * 0.9, 24, 0x1f2937, 0.18).setDepth(1.4);

    const house = this.add.graphics().setDepth(2.6);
    house.fillStyle(bodyColor, 1);
    house.fillRoundedRect(body.x - body.w / 2, body.y - body.h / 2, body.w, body.h, 3);
    house.lineStyle(2, trimColor, 1);
    house.strokeRoundedRect(body.x - body.w / 2, body.y - body.h / 2, body.w, body.h, 3);
    house.lineStyle(1, 0xffffff, 0.26);
    for (let y = body.y - body.h / 2 + 14; y < body.y + body.h / 2 - 8; y += 10) {
      house.lineBetween(body.x - body.w / 2 + 8, y, body.x + body.w / 2 - 8, y);
    }

    const roofGfx = this.add.graphics().setDepth(3.2);
    roofGfx.fillStyle(roofColor, 1);
    roofGfx.lineStyle(5, trimColor, 1);
    roofGfx.fillTriangle(roof.x1, roof.y1, roof.x2, roof.y2, roof.x3, roof.y3);
    roofGfx.strokeTriangle(roof.x1, roof.y1, roof.x2, roof.y2, roof.x3, roof.y3);
    roofGfx.lineStyle(1, 0x2f201a, 0.25);
    const baseY = Math.max(roof.y1, roof.y3);
    const peakX = roof.x2;
    const peakY = roof.y2;
    const halfBase = Math.abs(roof.x3 - roof.x1) / 2;
    for (let i = 1; i <= 6; i++) {
      const y = peakY + ((baseY - peakY) * i) / 7;
      const half = (halfBase * (y - peakY)) / (baseY - peakY);
      roofGfx.lineBetween(peakX - half, y, peakX + half, y);
    }
    for (let i = 1; i <= 8; i++) {
      const x = roof.x1 + ((roof.x3 - roof.x1) * i) / 9;
      roofGfx.lineBetween(x, baseY, peakX, peakY + 7);
    }

    if (garage) {
      const g = this.add.graphics().setDepth(3.5);
      const garageW = body.w * 0.55;
      g.fillStyle(0xe9edf0, 1);
      g.fillRoundedRect(body.x - garageW / 2, body.y - 4, garageW, body.h * 0.55, 3);
      g.lineStyle(2, 0x94a3b8, 0.9);
      g.strokeRoundedRect(body.x - garageW / 2, body.y - 4, garageW, body.h * 0.55, 3);
      for (let y = body.y + 8; y < body.y + body.h / 2 - 6; y += 8) {
        g.lineBetween(body.x - garageW / 2 + 4, y, body.x + garageW / 2 - 4, y);
      }
    }

    this._drawDoor(door, knob);
    for (const win of windows) this._drawWindow(win, shutterColor);
    this._drawFoundationShrubs(body);
    if (label) this._drawMapLabel(label.x, label.y, label.text, { icon: label.icon, depth: 10 });
  }

  _drawDoor(door, knob) {
    const gfx = this.add.graphics().setDepth(4);
    gfx.fillStyle(0x5b321f, 1);
    gfx.fillRoundedRect(door.x - door.w / 2, door.y - door.h / 2, door.w, door.h, 2);
    gfx.lineStyle(2, 0x32180f, 0.85);
    gfx.strokeRoundedRect(door.x - door.w / 2, door.y - door.h / 2, door.w, door.h, 2);
    gfx.lineStyle(1, 0x8b5e34, 0.65);
    gfx.strokeRect(door.x - door.w / 2 + 6, door.y - door.h / 2 + 8, door.w - 12, door.h - 16);
    if (knob) this.add.circle(knob.x, knob.y, knob.r + 1, 0xfacc15).setDepth(5);
  }

  _drawWindow(win, shutterColor) {
    const gfx = this.add.graphics().setDepth(4);
    gfx.fillStyle(shutterColor, 1);
    gfx.fillRect(win.x - win.w / 2 - 7, win.y - win.h / 2, 5, win.h);
    gfx.fillRect(win.x + win.w / 2 + 2, win.y - win.h / 2, 5, win.h);
    gfx.fillStyle(0xbbe5ff, 0.95);
    gfx.fillRoundedRect(win.x - win.w / 2, win.y - win.h / 2, win.w, win.h, 2);
    gfx.lineStyle(2, 0xf8fafc, 0.95);
    gfx.strokeRoundedRect(win.x - win.w / 2, win.y - win.h / 2, win.w, win.h, 2);
    gfx.lineStyle(1, 0x5087a6, 0.75);
    gfx.lineBetween(win.x, win.y - win.h / 2 + 2, win.x, win.y + win.h / 2 - 2);
    gfx.lineBetween(win.x - win.w / 2 + 2, win.y, win.x + win.w / 2 - 2, win.y);
    gfx.fillStyle(0x7aa33a, 1);
    gfx.fillRoundedRect(win.x - win.w / 2 - 4, win.y + win.h / 2 + 2, win.w + 8, 7, 3);
    gfx.fillStyle(0xf97316, 1);
    gfx.fillCircle(win.x - 8, win.y + win.h / 2 + 4, 2.3);
    gfx.fillCircle(win.x + 6, win.y + win.h / 2 + 4, 2.3);
  }

  _drawFoundationShrubs(body) {
    const gfx = this.add.graphics().setDepth(4.5);
    const y = body.y + body.h / 2 - 7;
    for (let i = 0; i < 8; i++) {
      const x = body.x - body.w / 2 + 18 + i * (body.w - 36) / 7;
      gfx.fillStyle(i % 2 ? 0x4f8f32 : 0x6aa33b, 1);
      gfx.fillCircle(x, y + (i % 2) * 3, 8 + (i % 3));
      gfx.fillStyle(0xf472b6, 0.75);
      if (i % 3 === 0) gfx.fillCircle(x + 3, y - 3, 2);
    }
  }

  _drawTree(x, y, scale = 1) {
    this.add.ellipse(x + 4, y + 20 * scale, 58 * scale, 18 * scale, 0x1f2937, 0.18).setDepth(2);
    const gfx = this.add.graphics().setDepth(4);
    gfx.fillStyle(0x6b3d1f, 1);
    gfx.fillRoundedRect(x - 5 * scale, y + 4 * scale, 10 * scale, 31 * scale, 4 * scale);
    gfx.lineStyle(2 * scale, 0x442412, 0.6);
    gfx.lineBetween(x, y + 10 * scale, x - 16 * scale, y + 24 * scale);
    gfx.lineBetween(x + 2 * scale, y + 13 * scale, x + 18 * scale, y + 25 * scale);
    const blobs = [
      [-19, -3, 16, 0x4f8d2e], [0, -12, 20, 0x6dac39], [18, -3, 17, 0x4f8d2e],
      [-9, 9, 19, 0x79b84a], [12, 10, 19, 0x5f9d35], [0, 1, 23, 0x72b343],
    ];
    for (const [dx, dy, r, color] of blobs) {
      gfx.fillStyle(color, 1);
      gfx.fillCircle(x + dx * scale, y + dy * scale, r * scale);
    }
    gfx.fillStyle(0xc7df72, 0.75);
    for (let i = 0; i < 9; i++) {
      gfx.fillCircle(x - 20 * scale + i * 5 * scale, y - 10 * scale + ((i * 7) % 24) * scale, 2 * scale);
    }
  }

  _drawMapLabel(x, y, text, { icon = '', depth = 12, fontSize = 11, maxWidth = 150 } = {}) {
    const display = icon ? `${icon}  ${text}` : text;
    const width = Math.min(maxWidth, Math.max(48, display.length * (fontSize * 0.58) + 18));
    const height = fontSize + 12;
    const gfx = this.add.graphics().setDepth(depth);
    gfx.fillStyle(0xffffff, 0.94);
    gfx.fillRoundedRect(x - width / 2, y - height / 2, width, height, 6);
    gfx.lineStyle(1, 0xd7dce3, 0.9);
    gfx.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 6);
    this.add.text(x, y, display, {
      fontFamily: 'sans-serif',
      fontSize: `${fontSize}px`,
      fontStyle: 'bold',
      color: '#1f2937',
      align: 'center',
      fixedWidth: width - 10,
    }).setOrigin(0.5).setDepth(depth + 0.1);
  }

  _drawStreetSign(x, y, text) {
    const gfx = this.add.graphics().setDepth(8);
    gfx.lineStyle(4, 0xe5e7eb, 0.9);
    gfx.lineBetween(x, y + 12, x, y + 70);
    gfx.fillStyle(0x1f7a42, 1);
    gfx.fillRoundedRect(x - 48, y - 15, 96, 30, 5);
    gfx.lineStyle(2, 0xf5f1c8, 0.9);
    gfx.strokeRoundedRect(x - 48, y - 15, 96, 30, 5);
    this.add.text(x, y, text, {
      fontFamily: 'sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(9);
  }

  _drawTopNeighborhoodSign(x, y) {
    const gfx = this.add.graphics().setScrollFactor(1).setDepth(20);
    gfx.fillStyle(0x406b1b, 0.95);
    gfx.fillRoundedRect(x - 112, y - 21, 224, 42, 10);
    gfx.lineStyle(3, 0x9fb64c, 0.95);
    gfx.strokeRoundedRect(x - 112, y - 21, 224, 42, 10);
    this.add.text(x, y, '🏘 Neighborhood ↑', {
      fontFamily: 'sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(21);
  }

  _drawBike(x, y, { color = 0x2563eb, accent = 0xef4444, flat = false, depth = 38 } = {}) {
    const gfx = this.add.graphics().setDepth(depth);
    gfx.lineStyle(4, 0x111827, 0.9);
    gfx.strokeCircle(x - 22, y + 12, 18);
    gfx.strokeCircle(x + 24, y + 12, 18);
    gfx.lineStyle(4, color, 1);
    gfx.lineBetween(x - 22, y + 12, x - 1, y - 11);
    gfx.lineBetween(x - 1, y - 11, x + 24, y + 12);
    gfx.lineBetween(x - 22, y + 12, x + 4, y + 12);
    gfx.lineBetween(x + 4, y + 12, x - 1, y - 11);
    gfx.lineBetween(x + 4, y + 12, x + 24, y + 12);
    gfx.lineStyle(3, accent, 1);
    gfx.lineBetween(x - 4, y - 17, x + 9, y - 17);
    gfx.lineStyle(3, 0x111827, 1);
    gfx.lineBetween(x + 22, y - 5, x + 35, y - 14);
    gfx.lineBetween(x + 35, y - 14, x + 43, y - 11);
    gfx.lineBetween(x - 6, y - 10, x - 11, y - 24);
    gfx.fillStyle(0x111827, 1);
    gfx.fillRoundedRect(x - 21, y - 28, 22, 6, 3);
    if (flat) {
      gfx.lineStyle(7, 0xef4444, 0.96);
      gfx.lineBetween(x + 55, y - 20, x + 82, y + 7);
      gfx.lineBetween(x + 82, y - 20, x + 55, y + 7);
      gfx.lineStyle(2, 0xffffff, 0.8);
      gfx.strokeCircle(x + 69, y - 7, 19);
    }
  }

  _drawBikeBadge(x, y, text, complete = false) {
    const color = complete ? '#16a34a' : '#dc2626';
    return this.add.text(x, y, text, {
      fontFamily: 'sans-serif',
      fontSize: '31px',
      fontStyle: 'bold',
      color,
      stroke: '#ffffff',
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(45);
  }

  _drawFireHydrant(x, y) {
    const gfx = this.add.graphics().setDepth(6);
    gfx.fillStyle(0xdc2626, 1);
    gfx.fillRoundedRect(x - 7, y - 14, 14, 24, 4);
    gfx.fillCircle(x, y - 17, 8);
    gfx.fillRoundedRect(x - 14, y - 5, 28, 8, 4);
    gfx.fillStyle(0xfacc15, 1);
    gfx.fillCircle(x + 14, y - 1, 3);
    gfx.fillCircle(x - 14, y - 1, 3);
  }

  _drawMailbox(x, y) {
    const gfx = this.add.graphics().setDepth(6);
    gfx.lineStyle(3, 0x6b7280, 1);
    gfx.lineBetween(x, y + 8, x, y + 27);
    gfx.fillStyle(0x64748b, 1);
    gfx.fillRoundedRect(x - 13, y - 8, 26, 16, 8);
    gfx.fillStyle(0xef4444, 1);
    gfx.fillRect(x + 10, y - 13, 3, 10);
  }

  _drawGpsPost(x, y) {
    const gfx = this.add.graphics().setDepth(7);
    gfx.lineStyle(5, 0x64748b, 1);
    gfx.lineBetween(x, y + 10, x, y + 60);
    gfx.fillStyle(0x172033, 1);
    gfx.fillRoundedRect(x - 13, y - 24, 26, 44, 6);
    gfx.fillStyle(0x8ec5ff, 1);
    gfx.fillRoundedRect(x - 9, y - 19, 18, 31, 3);
    gfx.lineStyle(2, 0xfacc15, 1);
    gfx.lineBetween(x - 5, y + 4, x + 5, y - 6);
    gfx.lineStyle(2, 0x2563eb, 1);
    gfx.lineBetween(x - 4, y - 12, x + 4, y - 16);
  }

  // ── Plant Interaction ────────────────────────────────────────────────────────

  _handlePlantInteract(species, label, plantX, plantY) {
    const state = this.registry.get('gameState');
    const audioMgr = this.registry.get('audioManager');
    audioMgr?.playSfx('interaction_ping');

    // Notify MCP about plant interaction
    const mcp = this.registry.get('mcp');
    if (mcp) {
      mcp.emit('FORAGE_AVAILABLE', { species, x: 0, y: 0 });
    }

    // Resolve the registered ecology entity for this exact plant (by
    // species + world position). Used after the existing flow completes
    // to fire ecology observation/forage events alongside, without
    // disturbing the canonical dialog/inventory path below.
    const ecologyEntity = (typeof plantX === 'number' && typeof plantY === 'number')
      ? this._ecologyEntityIndex?.get(`${species}|${plantX}|${plantY}`) ?? null
      : null;

    // Plant info from flora data
    const PLANT_INFO = {
      mesquite: { desc: 'A mesquite tree! Its pods are nutritious and its wood makes excellent charcoal. Animals gather here to eat the pods. The soil around its roots is full of desert microbes.', items: ['mesquite_pods', 'mesquite_wood_sample', 'bio_sample_bacteria'] },
      creosote: { desc: 'Creosote bush — its resin is antimicrobial and anti-inflammatory. Careful: toxic in large doses!', items: ['creosote_leaves'] },
      prickly_pear: { desc: 'Prickly pear cactus! The fruit is sweet and hydrating. The pads are edible too.', items: ['prickly_pear_fruit'] },
      barrel_cactus: { desc: 'Barrel cactus — it has moisture inside but the pulp is bitter and can cause nausea.', items: ['barrel_cactus_pulp'] },
      jojoba: { desc: 'Jojoba shrub — its seeds produce a stable liquid wax. Natural sunscreen and lubricant!', items: ['jojoba_seeds'] },
      agave: { desc: 'Agave plant — strong fibers for rope and bandages. The sap has healing properties.', items: ['agave_fiber', 'bio_sample_agave'] },
      yucca: { desc: 'Yucca — the root contains natural soap (saponins). Used for cleaning and surfactants for thousands of years.', items: ['yucca_root'] },
      desert_lavender: { desc: 'Desert lavender — purple flowers with a calming scent. Makes a soothing tea that improves focus.', items: ['desert_lavender_flowers'] },
      ephedra: { desc: 'Ephedra (Mormon Tea) — a powerful natural stimulant. Boosts energy but stresses the heart. Use with caution!', items: ['ephedra_stems'] },
      yerba_mansa: { desc: 'Yerba mansa — powerful antimicrobial root found near water. The desert\'s natural antibiotic.', items: ['yerba_mansa_root'] },
    };

    const info = PLANT_INFO[species] || { desc: `A ${label}.`, items: [] };

    // Decide whether this plant grants an item to the player. Two gates:
    //   (a) Canonical flow — current step is a forage step whose
    //       requiredItem matches this plant's outputs.
    //   (b) Recovery flow — the active quest has SOME forage step that
    //       requires an item this plant produces, and the player
    //       doesn't already have it. Catches the case where a quest
    //       advanced past the gather step without the item (e.g. pre-
    //       C3-fix saves where observe steps auto-advanced and pulled
    //       the player past forage steps too aggressively).
    let grantedItem = null;
    const step = state.activeQuest ? this._getCurrentStepIfForage(state) : null;
    if (step && info.items.includes(step.requiredItem)) {
      grantedItem = step.requiredItem;
    }
    if (!grantedItem && state.activeQuest) {
      const quest = QUESTS[state.activeQuest.id];
      if (quest) {
        grantedItem = info.items.find((item) =>
          !state.inventory.includes(item)
          && quest.steps.some(
            (s) => s.type === 'forage' && s.requiredItem === item,
          ),
        ) || null;
      }
    }

    if (grantedItem) {
      const advancesCurrentStep = step?.requiredItem === grantedItem;
      const updated = {
        ...state,
        inventory: [...state.inventory, grantedItem],
      };
      this.registry.set('gameState', updated);
      // saveGame already imported at top of file
      saveGame(updated);

      audioMgr?.playSfx('item_pickup');

      this.registry.set('dialogEvent', {
        speaker: 'Zuzu',
        text: advancesCurrentStep
          ? `Found ${grantedItem.replace(/_/g, ' ')}! ${info.desc}\n\nBring this back to Mrs. Ramirez.`
          : `Found ${grantedItem.replace(/_/g, ' ')}! ${info.desc}`,
        choices: null,
        step: advancesCurrentStep ? step : null,
      });

      // ECOLOGY (additive): fire observation + forage events alongside the
      // existing dialog/inventory grant. Existing flow above is unchanged.
      if (ecologyEntity) {
        try { emitObservation(ecologyEntity, 'interact'); } catch { /* swallow */ }
        try { emitForage(ecologyEntity, 'interact'); } catch { /* swallow */ }
      }
      return;
    }

    // Otherwise just show plant info
    this.registry.set('dialogEvent', {
      speaker: 'Zuzu',
      text: info.desc,
      choices: null, step: null,
    });

    // ECOLOGY (additive): record the inspect-style interaction so
    // observation state advances even when no item is granted.
    if (ecologyEntity) {
      try { emitObservation(ecologyEntity, 'interact'); } catch { /* swallow */ }
    }
  }

  _getCurrentStepIfForage(state) {
    if (!state.activeQuest) return null;
    const quest = QUESTS[state.activeQuest.id];
    if (!quest) return null;
    const step = quest.steps[state.activeQuest.stepIndex];
    if (step?.type === 'forage') return step;
    return null;
  }

  // ── NPC Interaction ─────────────────────────────────────────────────────────

  /**
   * Find the next available quest for an NPC from the quest tree.
   */
  _findNextQuestForNPC(npcId, state) {
    return getNextQuestForNPC(npcId, state);
  }

  _handleNpcInteract(npcId, primaryQuestId) {
    let state = this.registry.get('gameState');
    const audioMgr = this.registry.get('audioManager');

    audioMgr?.playSfx('interaction_ping');

    const NPC_NAMES = { mrs_ramirez: 'Mrs. Ramirez', mr_chen: 'Mr. Chen' };
    const npcName = NPC_NAMES[npcId] || npcId;

    // If there's an active quest with this NPC, continue it
    if (state.activeQuest) {
      const activeQuest = QUESTS[state.activeQuest.id];
      if (activeQuest?.giver === npcId) {
        // This NPC owns the active quest — show current step
        const step = getCurrentStep(state);
        if (step) {
          if (step.type === 'explainer' && step.explainerId) {
            startInteractiveExplainer(this, step.explainerId);
            return;
          }
          this.registry.set('dialogEvent', {
            speaker: step.type === 'quiz' ? 'Zuzu (thinking)' : npcName,
            text: step.text,
            choices: step.type === 'quiz' ? step.choices : null,
            step,
          });
          return;
        }
      }
      // Different NPC's quest is active
      this.registry.set('dialogEvent', {
        speaker: npcName,
        text: "Looks like you're busy with another job right now. Come back when you're free!",
        choices: null, step: null,
      });
      return;
    }

    // No active quest — find the best quest to offer
    let questToStart = null;

    // 1. Try primary quest first (if not completed)
    if (!state.completedQuests?.includes(primaryQuestId)) {
      questToStart = primaryQuestId;
    } else {
      // 2. Find next available quest from the quest board for this NPC
      questToStart = this._findNextQuestForNPC(npcId, state);
    }

    // 3. If no quest available, give a contextual idle message
    if (!questToStart) {
      const completedCount = state.completedQuests?.length || 0;
      const idleMessages = [
        `Great work so far, Zuzu! You've completed ${completedCount} quests. Keep exploring!`,
        'Check the quest board — new quests unlock as you complete more adventures!',
        "I don't have a new quest right now, but keep exploring. There's always more to learn!",
      ];
      this.registry.set('dialogEvent', {
        speaker: npcName,
        text: idleMessages[completedCount % idleMessages.length],
        choices: null, step: null,
      });
      return;
    }

    // Start the quest
    const started = startQuest(state, questToStart);
    if (started) {
      state = started;
      this.registry.set('gameState', state);
      saveGame(state);
      audioMgr?.playSfx('ui_quest_accept');
    }

    const step = getCurrentStep(state);
    if (!step) return;

    if (step.type === 'explainer' && step.explainerId) {
      startInteractiveExplainer(this, step.explainerId);
      return;
    }

    this.registry.set('dialogEvent', {
      speaker: step.type === 'quiz' ? 'Zuzu (thinking)' : npcName,
      text: step.text,
      choices: step.type === 'quiz' ? step.choices : null,
      step,
    });
  }

  _handleRamirezBikeInteract() {
    let state = this.registry.get('gameState');
    const audioMgr = this.registry.get('audioManager');
    audioMgr?.playSfx('interaction_ping');

    if (state?.completedQuests?.includes('flat_tire_repair')) {
      this.registry.set('dialogEvent', {
        speaker: 'Zuzu',
        text: "Mrs. Ramirez's tire is fixed and holding air.",
        choices: null,
        step: null,
      });
      return;
    }

    if (!state?.activeQuest) {
      this.registry.set('dialogEvent', {
        speaker: 'Zuzu',
        text: "Mrs. Ramirez's tire is completely flat. I should ask her what happened first.",
        choices: null,
        step: null,
      });
      return;
    }

    if (state.activeQuest.id !== 'flat_tire_repair') {
      this.registry.set('dialogEvent', {
        speaker: 'Zuzu',
        text: "I should finish my current job before inspecting Mrs. Ramirez's tire.",
        choices: null,
        step: null,
      });
      return;
    }

    let step = getCurrentStep(state);
    if (step?.id === 'talk') {
      const advanced = advanceQuest(state);
      if (advanced.ok) {
        state = advanced.state;
        this.registry.set('gameState', state);
        saveGame(state);
        step = getCurrentStep(state);
        this.registry.set('dialogEvent', {
          speaker: 'Zuzu',
          text: step.text,
          choices: null,
          step,
        });
        return;
      }
    }

    if (step?.type === 'explainer' && step.explainerId) {
      startInteractiveExplainer(this, step.explainerId);
      return;
    }

    if (step?.id === 'inspect') {
      const advanced = advanceQuest(state);
      if (advanced.ok) {
        state = advanced.state;
        this.registry.set('gameState', state);
        saveGame(state);
        step = getCurrentStep(state);
        if (step?.type === 'explainer' && step.explainerId) {
          startInteractiveExplainer(this, step.explainerId);
          return;
        }
      }

      this.registry.set('dialogEvent', {
        speaker: 'Zuzu',
        text: "I found the nail. Now let's zoom in and work through the repair.",
        choices: null,
        step,
      });
      return;
    }

    if (step?.type === 'use_item' && ['use_lever', 'use_patch'].includes(step.id)) {
      const advanced = advanceQuest(state);
      if (!advanced.ok) {
        audioMgr?.playSfx('ui_error');
        this.registry.set('dialogEvent', {
          speaker: 'Zuzu',
          text: advanced.message,
          choices: null,
          step,
        });
        return;
      }

      state = advanced.state;
      this.registry.set('gameState', state);
      saveGame(state);

      if (step.id === 'use_lever') {
        audioMgr?.playSfx('wrench_turn', { vary: true });
      } else {
        audioMgr?.playSfx('patch_apply', { vary: true });
      }

      const nextStep = getCurrentStep(state);
      this.registry.set('dialogEvent', {
        speaker: nextStep?.type === 'quiz' ? 'Zuzu (thinking)' : 'Mrs. Ramirez',
        text: step.id === 'use_lever'
          ? 'The tire lever slips under the bead and pops the tire loose from the rim.'
          : 'The patch seals the puncture. The tube can hold air again.',
        choices: null,
        step: null,
      });

      this.time.delayedCall(650, () => {
        if (!nextStep) {
          this.registry.set('dialogEvent', null);
          return;
        }
        this.registry.set('dialogEvent', {
          speaker: nextStep.type === 'quiz' ? 'Zuzu (thinking)' : 'Mrs. Ramirez',
          text: nextStep.text,
          choices: nextStep.type === 'quiz' ? nextStep.choices : null,
          step: nextStep,
        });
      });
      return;
    }

    this.registry.set('dialogEvent', {
      speaker: 'Zuzu',
      text: step?.text || "I've learned what happened to the tire. Now I should keep following the repair steps.",
      choices: step?.type === 'quiz' ? step.choices : null,
      step: step || null,
    });
  }

  _handleChenBikeInteract() {
    let state = this.registry.get('gameState');
    const audioMgr = this.registry.get('audioManager');
    audioMgr?.playSfx('interaction_ping');

    const step = getCurrentStep(state);
    const hasYucca = state?.inventory?.includes('yucca_root');

    if (
      state?.activeQuest?.id === 'engine_cleaning'
      && step?.id === 'clean_motor'
    ) {
      if (!hasYucca) {
        this.registry.set('dialogEvent', {
          speaker: 'Zuzu',
          text: 'This is the clogged motor, but I need yucca root first. The saponins in the root act like natural soap.',
          choices: null,
          step,
        });
        return;
      }

      if (!state.observations?.includes('motor_cleaned')) {
        state = {
          ...state,
          observations: [...(state.observations || []), 'motor_cleaned'],
        };
        this.registry.set('gameState', state);
        saveGame(state);
      }

      audioMgr?.playSfx('ui_success');
      if (this._chenBike) this._chenBike.setText('✨').setColor('#16a34a');
      this.registry.set('dialogEvent', {
        speaker: 'Zuzu',
        text:
          'The yucca surfactant foams into the oily grime and lifts it off the motor. The contamination drops and the motor can spin smoothly again.',
        choices: null,
        step,
      });
      return;
    }

    if (state?.completedQuests?.includes('engine_cleaning')) {
      this.registry.set('dialogEvent', {
        speaker: 'Zuzu',
        text: "Mr. Chen's motor is clean now. The yucca surfactant did the job.",
        choices: null,
        step: null,
      });
      return;
    }

    this.registry.set('dialogEvent', {
      speaker: 'Zuzu',
      text: "This is Mr. Chen's bike. If his motor needs cleaning, this is where I should apply the yucca surfactant.",
      choices: null,
      step: null,
    });
  }

  advanceFromDialog(choiceIndex) {
    let state = this.registry.get('gameState');
    const audioMgr = this.registry.get('audioManager');
    const result = advanceQuest(state, choiceIndex);

    if (!result.ok) {
      audioMgr?.playSfx('ui_error');
      this.registry.set('dialogEvent', {
        speaker: 'System',
        text: result.message,
        choices: null,
        step: getCurrentStep(state),
      });
      return;
    }

    state = result.state;
    this.registry.set('gameState', state);
    saveGame(state);

    const step = getCurrentStep(state);
    if (step?.type === 'use_item') {
      if (step.id === 'use_lever') audioMgr?.playSfx('wrench_turn', { vary: true });
      else if (step.id === 'use_patch') audioMgr?.playSfx('patch_apply', { vary: true });
      else audioMgr?.playSfx('item_pickup');
    } else if (!step) {
      audioMgr?.playStinger('reward_stinger');
      this._showRewardCelebration(state);
    } else {
      audioMgr?.playSfx('ui_success');
    }

    // Update bike icons
    if (state.completedQuests?.includes('flat_tire_repair') && this._ramirezBike) {
      this._ramirezBike.setText('✓').setColor('#16a34a');
    }
    if (state.completedQuests?.includes('chain_repair') && this._chenBike) {
      this._chenBike.setText('✓').setColor('#16a34a');
    }

    const nextStep = getCurrentStep(state);
    if (nextStep) {
      if (nextStep.type === 'explainer' && nextStep.explainerId) {
        startInteractiveExplainer(this, nextStep.explainerId);
        return;
      }
      // Get speaker from quest giver
      const NPC_NAMES = { mrs_ramirez: 'Mrs. Ramirez', mr_chen: 'Mr. Chen' };
      const activeQuest = QUESTS[state.activeQuest?.id];
      const speaker = nextStep.type === 'quiz'
        ? 'Zuzu (thinking)'
        : NPC_NAMES[activeQuest?.giver] || 'NPC';
      this.registry.set('dialogEvent', {
        speaker,
        text: nextStep.text,
        choices: nextStep.type === 'quiz' ? nextStep.choices : null,
        step: nextStep,
      });
    } else {
      this.registry.set('dialogEvent', null);
    }
  }

  _showRewardCelebration(state) {
    // Guard: scene may be mid-shutdown when a quest-completion celebration is
    // triggered (e.g. final dialog handler runs after a scene transition has
    // started tearing down cameras). Without this guard, cam.scrollX throws
    // into the React error boundary and the renderer fails. Skip silently —
    // reward state itself is already saved by the caller.
    const cam = this.cameras?.main;
    if (!cam) {
      // eslint-disable-next-line no-console
      console.warn('[StreetBlockScene] _showRewardCelebration: cameras.main unavailable; skipping celebration FX (state still saved).');
      return;
    }
    const cx = cam.scrollX + cam.width / 2;
    const cy = cam.scrollY + cam.height / 2 - 40;

    const rewardText = this.add.text(cx, cy, '🎉 Quest Complete! 🎉', {
      fontSize: '28px', fontFamily: 'sans-serif', fontStyle: 'bold',
      color: '#ffffff', stroke: '#1e40af', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(100);

    const bucks = state.zuzubucks || 0;
    const bucksText = this.add.text(cx, cy + 40, `💰 +25 Zuzubucks! (Total: ${bucks})`, {
      fontSize: '18px', fontFamily: 'sans-serif', fontStyle: 'bold',
      color: '#fbbf24', stroke: '#78350f', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(100);

    rewardText.setScale(0);
    this.tweens.add({ targets: rewardText, scale: 1, duration: 500, ease: 'Back.easeOut' });
    bucksText.setAlpha(0);
    this.tweens.add({ targets: bucksText, alpha: 1, duration: 400, delay: 400 });

    this.time.delayedCall(4000, () => {
      this.tweens.add({
        targets: [rewardText, bucksText], alpha: 0, duration: 500,
        onComplete: () => { rewardText.destroy(); bucksText.destroy(); },
      });
    });
  }
}

// ── HMR ──────────────────────────────────────────────────────────────
registerSceneHmr('StreetBlockScene', import.meta.hot, StreetBlockScene);
