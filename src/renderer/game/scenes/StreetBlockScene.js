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
      this.add.rectangle(o.x, o.y, o.w, o.h, 0x7cb342);
    }

    // Road (horizontal, center)
    {
      const o = this.layout.road;
      this.add.rectangle(o.x, o.y, o.w, o.h, 0x616161);
    }
    // Road lines
    const roadGfx = this.add.graphics();
    roadGfx.lineStyle(2, 0xfdd835, 0.6);
    for (let x = 0; x < width; x += 50) {
      roadGfx.lineBetween(x, 350, x + 25, 350);
    }
    // Sidewalks
    {
      const o = this.layout.sidewalk_top;
      this.add.rectangle(o.x, o.y, o.w, o.h, 0xbdbdbd);
    }
    {
      const o = this.layout.sidewalk_bottom;
      this.add.rectangle(o.x, o.y, o.w, o.h, 0xbdbdbd);
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
      this.add.text(o.x, o.y, "🏠 Zuzu's House", {
        fontSize: '11px', fontFamily: 'sans-serif', color: '#4e342e',
        fontStyle: 'bold', stroke: '#fff', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(3);
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
      this.add.text(o.x, o.y, "🏡 Ramirez House", {
        fontSize: '11px', fontFamily: 'sans-serif', color: '#b71c1c',
        fontStyle: 'bold', stroke: '#fff', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(3);
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

    // === TREES / DECORATIONS ===
    for (const t of this.layout.trees) {
      this.add.text(t.x, t.y, '🌳', { fontSize: '28px' }).setOrigin(0.5).setDepth(3);
    }

    // === ECOLOGY PLANTS (drawn with graphics + interactable) ===
    this._ecologyPlants = [];

    for (const p of this.layout.plants) {
      // Draw visual plant (graphics-based, not emoji)
      const plantContainer = drawPlant(this, p.species, p.x, p.y);
      plantContainer.setDepth(4); // background decoration, below player (depth 6)

      // Add invisible interaction zone (uses existing addInteractable for prompt/hitbox)
      this.addInteractable({
        x: p.x, y: p.y, label: p.label, icon: '', // no emoji — visual is drawn above
        radius: p.radius,
        onInteract: () => this._handlePlantInteract(p.species, p.label, p.x, p.y),
      });
      this._ecologyPlants.push({ species: p.species, x: p.x, y: p.y });
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
      this.add.text(o.x, o.y, '🧯', { fontSize: '18px' }).setOrigin(0.5).setDepth(3);
    }

    // Mailboxes
    {
      const o = this.layout.mailbox_left;
      this.add.text(o.x, o.y, '📫', { fontSize: '16px' }).setOrigin(0.5).setDepth(3);
    }
    {
      const o = this.layout.mailbox_right;
      this.add.text(o.x, o.y, '📫', { fontSize: '16px' }).setOrigin(0.5).setDepth(3);
    }

    // Street sign
    {
      const o = this.layout.street_sign;
      this.add.text(o.x, o.y, '🛣️ E Trailside View', {
        fontSize: '12px', fontFamily: 'sans-serif', color: '#fff',
        backgroundColor: '#2e7d32', padding: { x: 6, y: 2 },
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(5);
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
      this._ramirezBike = this.add.text(
        o.x, o.y,
        questDone ? '🚲✅' : '🚲❌',
        { fontSize: '28px' },
      ).setOrigin(0.5).setDepth(40);
    }

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
    {
      const o = this.layout.chen_bike_icon;
      this._chenBike = this.add.text(
        o.x, o.y,
        chenQuestDone ? '🚲✅' : '🚲⛓️',
        { fontSize: '28px' },
      ).setOrigin(0.5).setDepth(40);
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
      onInteract: () => {
        const audioMgr = this.registry.get('audioManager');
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
      this.add.rectangle(o.x, o.y, o.w, o.h, 0x475569);
    }
    {
      const o = this.layout.gps_top;
      this.add.rectangle(o.x, o.y, o.w, o.h, 0x475569);
    }

    // === WORLD BOUNDS ===
    {
      const o = this.layout.wall_south;
      this.addWall(o.x, o.y, o.w, o.h); // south
    }
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
      mesquite: { desc: 'A mesquite tree! Its pods are nutritious and its wood makes excellent charcoal. Animals gather here to eat the pods.', items: ['mesquite_pods', 'mesquite_wood_sample'] },
      creosote: { desc: 'Creosote bush — its resin is antimicrobial and anti-inflammatory. Careful: toxic in large doses!', items: ['creosote_leaves'] },
      prickly_pear: { desc: 'Prickly pear cactus! The fruit is sweet and hydrating. The pads are edible too.', items: ['prickly_pear_fruit'] },
      barrel_cactus: { desc: 'Barrel cactus — it has moisture inside but the pulp is bitter and can cause nausea.', items: ['barrel_cactus_pulp'] },
      jojoba: { desc: 'Jojoba shrub — its seeds produce a stable liquid wax. Natural sunscreen and lubricant!', items: ['jojoba_seeds'] },
      agave: { desc: 'Agave plant — strong fibers for rope and bandages. The sap has healing properties.', items: ['agave_fiber'] },
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
        text: `Found ${grantedItem.replace(/_/g, ' ')}! ${info.desc}`,
        choices: null, step: null,
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

    this.registry.set('dialogEvent', {
      speaker: step.type === 'quiz' ? 'Zuzu (thinking)' : npcName,
      text: step.text,
      choices: step.type === 'quiz' ? step.choices : null,
      step,
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
      this._ramirezBike.setText('🚲✅');
    }
    if (state.completedQuests?.includes('chain_repair') && this._chenBike) {
      this._chenBike.setText('🚲✅');
    }

    const nextStep = getCurrentStep(state);
    if (nextStep) {
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
