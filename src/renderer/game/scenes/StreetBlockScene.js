/**
 * StreetBlockScene — Home Street, the street outside Zuzu's house.
 *
 * Local playable scene with:
 *   - Sidewalks, road, driveways
 *   - Zuzu's house exterior
 *   - Mrs. Ramirez + flat tire quest
 *   - Neighbor houses, Mr. Chen, Mariam, Lina
 *   - Exit to garage (west)
 *   - Exit to overworld (north)
 *   - Exit to Desert Edge (south)
 *
 * The Sonoran plants, the animals and the foraging interactions used to be
 * here too. On 2026-11-26 the owner asked for the neighborhood to be split
 * in two because one screen with five houses, four neighbours, two bikes,
 * eleven plants and three animals was too busy for a young child: the
 * desert now lives in `DesertEdgeScene`, reached through the signed gap in
 * the south fence. Nothing moved by hard-coding — the plants are rows in
 * `public/layouts/desert-edge.layout.json` and the behaviour is the shared
 * `systems/foragingScenery.js`.
 *
 * World size: 1000×700 (slightly larger than viewport for scrolling)
 */

import LocalSceneBase from './LocalSceneBase.js';
import { startQuest, getCurrentStep, advanceQuest } from '../systems/questSystem.js';
import { questOfferDialog, resumeParkedQuest, dialogForStep } from '../systems/questDialog.js';
import { saveGame } from '../systems/saveSystem.js';
import { NPC_PLACEMENTS } from '../data/neighborhoodLayout.js';
import { getNextQuestForNPC } from '../data/questBoard.js';
import QUESTS from '../data/quests.js';
import { registerSceneHmr } from '../dev/phaserHmr.js';
import { loadLayout } from '../utils/loadLayout.js';
import { startInteractiveExplainer } from '../systems/interactiveExplainerSystem.js';
import { preloadGameAssets } from '../../../game/assets/preloadGameAssets.js';
import { registerZuzuAnimations } from '../../../game/characters/registerCharacterAnimations.js';
import { createWorldLabel } from '../../../game/ui/WorldLabel.js';
import { createInteractionMarker } from '../../../game/ui/InteractionMarker.js';
import { createGarageLeftSignPlaceholder } from '../../../game/art/placeholderFactories.js';
import {
  LANGUAGE_CARDS,
  practiceLanguageTerm,
  getMentorLine,
} from '../systems/languageLayer.js';
import { ART } from '../../../game/assets/act1ArtRegistry.js';
import { groundDepth } from '../../../game/assets/act1Art.js';
import { hasAtlasFrame } from '../../../game/assets/createAtlasSprite.js';

const NEIGHBORHOOD_ATLAS = 'neighborhood_atlas';

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
    preloadGameAssets(this);
    this.load.json('streetBlockLayout', 'layouts/street-block.layout.json');
  }

  createWorld() {
    this.layout = loadLayout(this, 'streetBlockLayout');
    const { width } = this.getWorldSize();
    const state = this.registry.get('gameState');
    registerZuzuAnimations(this);

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
    // The facade is a painted neighborhood-atlas frame, drawn by
    // _skinNeighborhoodHouses() below. Only the label, the collision body
    // and the driveway are built here.
    // Label
    {
      const o = this.layout.zuzu_house_label;
      this._drawMapLabel(o.x, o.y, "Zuzu's House", { depth: 9 });
    }
    // House collision
    {
      const o = this.layout.zuzu_house_collision;
      this.addWall(o.x, o.y, o.w, o.h);
    }

    // Driveway — same concrete as the sidewalk.
    {
      const o = this.layout.zuzu_driveway;
      this.addGroundTexture(ART.streetblock_sidewalk, o.x - o.w / 2, o.y - o.h / 2, o.w, o.h,
        { depth: -1 });
    }

    // === NEIGHBOR HOUSE — Mrs. Ramirez (center-right, north of road) ===
    {
      const o = this.layout.ramirez_house_label;
      this._drawMapLabel(o.x, o.y, 'Ramirez House', { depth: 9 });
    }
    {
      const o = this.layout.ramirez_house_collision;
      this.addWall(o.x, o.y, o.w, o.h);
    }

    // === NEIGHBOR HOUSE — far right (the workshop) ===
    {
      const o = this.layout.blue_house_collision;
      this.addWall(o.x, o.y, o.w, o.h);
    }

    // === SOUTH SIDE — more houses ===
    {
      const o = this.layout.green_house_collision;
      this.addWall(o.x, o.y, o.w, o.h);
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

    // No plants or animals on Home Street: the desert moved to
    // DesertEdgeScene. The layout still carries empty `plants` and
    // `animals` arrays, so putting a plant back on the street is a data
    // edit and this scene needs no new code for it.
    this._ecologyPlants = [];

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
      atlasFrame: 'npc_mrs_ramirez_idle',
      onInteract: () => this._handleNpcInteract('mrs_ramirez', 'flat_tire_repair'),
    });

    // Mrs. Ramirez's bike
    const questDone = state.completedQuests?.includes('flat_tire_repair');
    {
      const o = this.layout.ramirez_bike_icon;
      this._drawBike(o.x, o.y, { color: 0x2563eb, accent: 0xef4444, flat: !questDone, depth: groundDepth(o.y) });
      // Only the open quest gets a floating marker. The "OK" badge that used
      // to sit here once the tyre was fixed told the child nothing and added
      // to the clutter, so a finished bike now simply looks fixed.
      // Above the bike, not beside it: at x+58 the marker landed inside the
      // "E Trailside" street sign board (which spans x 452-548).
      this._ramirezMarker = questDone
        ? null
        : createInteractionMarker(this, o.x, o.y - 56, 'blocked', { pulse: true });
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

    // === MARIAM NPC (Act 1 Arabic mentor) ===
    // A grown-up neighbor in her own front yard, same placement pattern as
    // Mrs. Ramirez. She is a mentor, not a quest-giver: talking to her
    // teaches one of the three briefed Arabic words and nothing else.
    this.addNpc({
      id: 'mariam',
      name: 'Mariam',
      x: this.layout.npc_mariam.x,
      y: this.layout.npc_mariam.y,
      sheet: 'mariam_idle',
      onInteract: () => this._handleMariamInteract(),
    });

    // === MR. CHEN NPC ===
    const chenData = NPC_PLACEMENTS.find(n => n.id === 'mr_chen');
    this.addNpc({
      id: 'mr_chen',
      name: 'Mr. Chen',
      x: this.layout.npc_mr_chen.x,
      y: this.layout.npc_mr_chen.y,
      color: chenData?.color || 0x2563eb,
      atlasFrame: 'npc_mr_chen_idle',
      onInteract: () => this._handleNpcInteract('mr_chen', 'chain_repair'),
    });

    // Mr. Chen's bike
    const chenQuestDone = state.completedQuests?.includes('chain_repair');
    const chenMotorCleaningActive =
      state.activeQuest?.id === 'engine_cleaning'
      && getCurrentStep(state)?.id === 'clean_motor';
    // A badge only when a quest needs one: OIL during the motor-cleaning
    // step, FIX while the chain job is open, and nothing at all once it is
    // done (the old "OK" badge was decoration).
    const chenBikeIcon = chenMotorCleaningActive
      ? 'OIL'
      : chenQuestDone
        ? ''
        : 'FIX';
    {
      const o = this.layout.chen_bike_icon;
      this._drawBike(o.x, o.y, { color: 0xef4444, accent: 0x111827, depth: groundDepth(o.y) });
      this._chenBike = chenBikeIcon
        // Further out to the side: at x+44 the badge clipped the right
        // edge of the interact prompt, and dropping it instead put it on
        // Zuzu's name tag.
        ? this._drawBikeBadge(o.x + 62, o.y - 7, chenBikeIcon, chenQuestDone)
        : null;
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
      createGarageLeftSignPlaceholder(this, o.x + 35, o.y);
      this.addExit({
        x: o.x, y: o.y,
        width: o.w, height: o.h,
        targetScene: 'ZuzuGarageScene',
        targetSpawn: 'fromStreet',
        label: null,
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
        // The carved sign above already says "Neighborhood ↑"; an exit
        // label here printed a second one across it.
        label: null,
      });
    }

    // === WORLD MAP ACCESS: Bike GPS ===
    this.addInteractable({
      x: this.layout.interact_gps.x, y: this.layout.interact_gps.y,
      icon: '',
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

    // === SOUTH EXIT → Desert Edge ===
    // The one way out to the plants and animals. A signed arrow sits above
    // the gap so a young child can see where the opening in the fence goes.
    {
      const sign = this.layout.desert_edge_sign;
      this._drawDesertEdgeSign(sign.x, sign.y);
      const o = this.layout.exit_zone_south;
      this.addExit({
        x: o.x, y: o.y,
        width: o.w, height: o.h,
        targetScene: 'DesertEdgeScene',
        targetSpawn: 'fromStreet',
        label: null,
      });
    }

    // === WORLD BOUNDS ===
    // The south bound is two bodies with a gap between them — that gap is
    // the Desert Edge gate.
    for (const key of ['wall_south_west', 'wall_south_east']) {
      const o = this.layout[key];
      if (o) this.addWall(o.x, o.y, o.w, o.h);
    }
  }

  /**
   * Signed arrow over the south gap: a board reading "Desert Edge" and a
   * big triangle pointing down out of the neighborhood.
   */
  _drawDesertEdgeSign(x, y) {
    const gfx = this.add.graphics().setDepth(20);
    gfx.fillStyle(0x8a5a2b, 1);
    gfx.fillRoundedRect(x - 94, y - 20, 188, 40, 8);
    gfx.lineStyle(3, 0xf0d9a8, 0.95);
    gfx.strokeRoundedRect(x - 94, y - 20, 188, 40, 8);
    this.add.text(x + 14, y, 'Desert Edge', {
      fontFamily: 'sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(21);
    this.add.triangle(x - 58, y, 0, -11, 22, -11, 11, 13, 0xfacc15, 1).setDepth(21);
    return gfx;
  }

  _drawGrassField(o) {
    // Painted lawn texture. The 210 hand-scattered grass ellipses and the
    // mower stripes are gone — that variation lives in the art.
    this.addGroundTexture(ART.lakeedge_grass, o.x - o.w / 2, o.y - o.h / 2, o.w, o.h,
      { depth: -10 });
  }

  _drawRoadway(o, width) {
    // Painted asphalt. Lane markings stay as graphics: they are road
    // *information* a child reads, and they have to line up with the layout.
    this.addGroundTexture(ART.streetblock_road, o.x - o.w / 2, o.y - o.h / 2, o.w, o.h,
      { depth: -5 });
    const gfx = this.add.graphics().setDepth(-4);

    gfx.lineStyle(3, 0xe8e2d6, 0.65);
    gfx.lineBetween(0, o.y - o.h / 2, width, o.y - o.h / 2);
    gfx.lineBetween(0, o.y + o.h / 2, width, o.y + o.h / 2);

    gfx.lineStyle(3, 0xf7c948, 0.85);
    for (let x = 24; x < width; x += 60) {
      gfx.lineBetween(x, o.y, x + 28, o.y);
    }
  }

  _drawSidewalk(o) {
    // Painted concrete; the slab joints are in the texture.
    this.addGroundTexture(ART.streetblock_sidewalk, o.x - o.w / 2, o.y - o.h / 2, o.w, o.h,
      { depth: -2 });
  }

  _skinNeighborhoodHouses() {
    this._drawHouseSkin({
      body: this.layout.zuzu_house_body,
      atlasFrame: 'house_zuzu',
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
      atlasFrame: 'house_ramirez',
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
      atlasFrame: 'building_workshop',
      roof: this.layout.blue_house_roof,
      door: this.layout.blue_house_door,
      windows: [],
      bodyColor: 0x9dccf1,
      trimColor: 0xf0f7ff,
      roofColor: 0x1557a8,
      shutterColor: 0x1d4f91,
      garage: true,
      // Centred below the building. The old offset put it 7px from the
      // workshop-door gate's own caption, so the two names collided.
      label: { text: 'Workshop', x: this.layout.blue_house_body.x, y: this.layout.blue_house_body.y + 102 },
    });
    this._drawHouseSkin({
      body: this.layout.green_house_body,
      atlasFrame: 'house_ramirez',
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
      atlasFrame: 'house_zuzu',
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
    atlasFrame = null,
  }) {
    this.add.ellipse(body.x + 8, body.y + body.h / 2 + 10, body.w * 0.9, 24, 0x1f2937, 0.18).setDepth(1.4);

    // Painted facade from the neighborhood atlas. The frame already carries
    // the walls, roof, door and windows, so the vector skin below is skipped
    // entirely; only the ground shadow and the map label stay.
    if (atlasFrame && hasAtlasFrame(this, NEIGHBORHOOD_ATLAS, atlasFrame)) {
      const facadeH = body.h + Math.abs(body.y - roof.y2);
      this.add.image(body.x, body.y + body.h / 2, NEIGHBORHOOD_ATLAS, atlasFrame)
        .setOrigin(0.5, 1)
        .setDisplaySize(body.w, facadeH)
        .setDepth(3);
      if (label) this._drawMapLabel(label.x, label.y, label.text, { icon: label.icon, depth: 10 });
      return;
    }

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
    // Painted cottonwood. The ground shadow stays so the tree still sits on
    // the lawn; the vector trunk and the six canopy blobs are gone.
    this.add.ellipse(x + 4, y + 20 * scale, 58 * scale, 18 * scale, 0x1f2937, 0.18).setDepth(2);
    this.addProp(ART.shade_tree, x, y + 24 * scale, {
      displayHeight: Math.round(110 * scale),
      depth: groundDepth(y),
    });
  }

  _drawMapLabel(x, y, text, { icon = '', depth = 12, fontSize = 11, maxWidth = 150 } = {}) {
    return createWorldLabel(this, x, y, text, {
      icon,
      depth,
      fontSize,
      maxWidth,
      minZoom: 0.2,
    });
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
    this.add.text(x, y, 'Neighborhood ↑', {
      fontFamily: 'sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(21);
  }

  _drawBike(x, y, { color = 0x2563eb, accent = 0xef4444, flat = false, depth = 38 } = {}) {
    // Painted bike from the neighborhood atlas. The flat-tyre and
    // on-the-stand frames are separate art, so `flat` picks the frame
    // instead of stroking a red ring over a vector drawing.
    const frame = flat ? 'prop_flat_tire_bike' : 'prop_mr_chen_bike';
    if (hasAtlasFrame(this, NEIGHBORHOOD_ATLAS, frame)) {
      this.add.image(x, y + 30, NEIGHBORHOOD_ATLAS, frame)
        .setOrigin(0.5, 1)
        .setDepth(depth);
      return;
    }
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
      gfx.lineStyle(4, 0xef4444, 0.96);
      gfx.strokeCircle(x + 24, y + 12, 12);
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
    if (hasAtlasFrame(this, NEIGHBORHOOD_ATLAS, 'prop_bike_gps')) {
      this.add.image(x, y + 60, NEIGHBORHOOD_ATLAS, 'prop_bike_gps')
        .setOrigin(0.5, 1)
        .setDepth(7);
      return;
    }
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

  // ── Mariam: Arabic mentor ────────────────────────────────────────────────────

  /**
   * Teach the next of Mariam's three briefed words.
   *
   * Order is fixed (hello, then water, then repair) and each word is taught
   * until the child has practised it, so she never races ahead. Once all
   * three are known she greets and offers a refresher. Content comes from
   * `systems/languageLayer.js`, which derives every word from the canonical
   * `ar_*` rows in `data/languages.js` — this method must not author Arabic
   * of its own.
   * @private
   */
  _handleMariamInteract() {
    let state = this.registry.get('gameState') || {};
    const audioMgr = this.registry.get('audioManager');

    const practice = state.languagePractice || {};
    const next = LANGUAGE_CARDS.find((card) => !practice[card.id]?.practiced)
      || LANGUAGE_CARDS[(Object.values(practice).reduce((n, r) => n + (r.practiced || 0), 0))
        % LANGUAGE_CARDS.length];

    const result = practiceLanguageTerm(state, next.id);
    if (!result.ok) return;

    state = result.state;
    this.registry.set('gameState', state);
    saveGame(state);
    audioMgr?.playSfx?.('interaction_ping');

    const line = getMentorLine(next.id);
    this.registry.set('dialogEvent', {
      speaker: 'Mariam',
      // Script first, then the kid transliteration, then the English
      // caption — rank 1 never hides the script.
      text: `${line.script}
${line.transliteration}

${line.caption}`,
      choices: null,
      step: null,
    });
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
          // Through the shared rules, so a step whose text names this NPC
          // goes to the notebook and template tokens are interpolated. This
          // path printed `step.text` raw with the NPC as speaker.
          this.registry.set('dialogEvent',
            dialogForStep(step, state, npcName, { giverPresent: true }));
          return;
        }
      }
      // Someone else's quest is running.
      //
      // This used to be a flat refusal — "busy with another job" — which is
      // how an auto-started side quest from Mrs. Ramirez locked Mr. Chen's
      // main quest out entirely. Now this NPC may still offer, and accepting
      // parks the other quest at the step it reached.
      // `ignoreActive` so this asks what the NPC *would* offer if the child
      // were free. The plain call returns null whenever anything is running,
      // which is why the switch path never fired.
      const offer = getNextQuestForNPC(npcId, state, { ignoreActive: true })
        || (!state.completedQuests?.includes(primaryQuestId) ? primaryQuestId : null);
      const offered = offer && offer !== state.activeQuest.id ? QUESTS[offer] : null;
      if (offered) {
        this.registry.set('dialogEvent', questOfferDialog(
          { id: offer, title: offered.title },
          npcName,
          { id: state.activeQuest.id, title: activeQuest?.title || state.activeQuest.id },
        ));
        return;
      }

      this.registry.set('dialogEvent', {
        speaker: npcName,
        text: "I don't have anything new for you yet — finish what you're on and come back!",
        choices: null, step: null,
      });
      return;
    }

    // A quest of this NPC's was parked for another. Pick it back up where it
    // was left rather than starting it over.
    const parkedId = Object.keys(state.pausedQuests || {})
      .find((id) => QUESTS[id]?.giver === npcId);
    if (parkedId) {
      state = resumeParkedQuest(state, parkedId);
      this.registry.set('gameState', state);
      saveGame(state);
      const resumed = getCurrentStep(state);
      if (resumed) {
        const resumedLine = dialogForStep(resumed, state, npcName, { giverPresent: true });
        this.registry.set('dialogEvent', {
          ...resumedLine,
          text: `Back to it, then.\n\n${resumedLine.text}`,
        });
        return;
      }
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

    // Ask first. Quests used to begin the moment the child said hello, which
    // is how `toxic_knowledge` started itself and then blocked Mr. Chen.
    const offeredQuest = QUESTS[questToStart];
    if (offeredQuest) {
      this.registry.set('dialogEvent', questOfferDialog(
        { id: questToStart, title: offeredQuest.title }, npcName, null,
      ));
      return;
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
      // The OIL badge has done its job; the motor is clean. No "OK" badge
      // replaces it — a finished bike just looks finished.
      if (this._chenBike) {
        this._chenBike.destroy();
        this._chenBike = null;
      }
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

  /**
   * Street-only follow-up after a quest step advances.
   *
   * This scene used to carry a full copy of `advanceFromDialog`, which meant
   * it never got the base class's fixes: a wrong quiz answer offered only
   * "Continue", which then looped "Pick an answer first." forever; quiz text
   * was emitted raw so the bridge quest showed the literal token
   * "{strengthTable}"; and the no-active-quest and scene-active guards were
   * missing (arc.md §8.6 — primitive fragmentation).
   *
   * The fork is gone. Its three real extras — use_item sounds, explainer
   * routing and naming the quest giver — now live in LocalSceneBase, so every
   * scene gets them. All that is left here is the bike art, which is genuinely
   * street-only.
   */
  advanceFromDialog(choiceIndex) {
    super.advanceFromDialog(choiceIndex);
    this._refreshBikeBadges();
  }

  /**
   * Keep the bikes in step with quest state.
   *
   * No "OK" badge: a finished bike simply looks fixed (owner request,
   * 2026-11-26). Only an open job is badged, and the fork used to re-add the
   * OK text here after the drawing code had stopped creating it.
   * @private
   */
  _refreshBikeBadges() {
    const state = this.registry.get('gameState') || {};
    // The blocked marker used to sit on a fixed bike until the scene
    // reloaded, still telling the child something was wrong.
    if (state.completedQuests?.includes('flat_tire_repair') && this._ramirezMarker) {
      this._ramirezMarker.destroy?.();
      this._ramirezMarker = null;
    }
    if (state.completedQuests?.includes('chain_repair') && this._chenBike) {
      this._chenBike.destroy();
      this._chenBike = null;
    }
  }

  _showRewardCelebration(state, earned = {}) {
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

    const rewardText = this.add.text(cx, cy, 'Quest Complete!', {
      fontSize: '28px', fontFamily: 'sans-serif', fontStyle: 'bold',
      color: '#ffffff', stroke: '#1e40af', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(100);

    // What this quest actually paid, not a hard-coded 25. The bridge pays
    // 60 and the chain job 35, and both used to announce "+25".
    const bucks = state.zuzubucks || 0;
    const gained = earned.zuzubucks || 0;
    const line = gained > 0
      ? `+${gained} Zuzubucks! (Total: ${bucks})`
      : `Total: ${bucks} Zuzubucks`;
    const bucksText = this.add.text(cx, cy + 40, line, {
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
