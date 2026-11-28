/**
 * ZuzuGarageScene — fully playable local garage scene.
 *
 * Zoomed-in, intimate garage space with:
 *   - Collision walls (adobe stucco)
 *   - Interactable workbench, bike rack, notebook desk
 *   - State-dependent upgrades (tool rack, work light, repair stand)
 *   - Exit to StreetBlockScene (south door)
 *   - Onboarding dialog
 *   - Save system integration
 *
 * World size: 800×600 (viewport-scale, no scrolling needed)
 */

import Phaser from 'phaser';

import LocalSceneBase from './LocalSceneBase.js';
import { saveGame } from '../systems/saveSystem.js';
import QUESTS from '../data/quests.js';
import { registerSceneHmr } from '../dev/phaserHmr.js';
import { loadLayout } from '../utils/loadLayout.js';
import { advanceQuest, getCurrentStep } from '../systems/questSystem.js';
import { dialogForStep, NARRATOR } from '../systems/questDialog.js';
import {
  formatMissingWorkbenchIngredients,
  formatWorkbenchMemoryLine,
  formatWorkbenchRecipeNote,
  getKnownWorkbenchRecipes,
  getWorkbenchRecipe,
} from '../data/workbenchRecipes.js';
import { ART } from '../../../game/assets/act1ArtRegistry.js';
import { groundDepth } from '../../../game/assets/act1Art.js';
import { WORLD_SIGN_DEPTH } from '../systems/labelLayout.js';
import { addSceneTitle } from '../ui/sceneTitle.js';

/**
 * Ambient lift for the garage interior (see `_liftInteriorLight`).
 *
 * Warm cream, added not multiplied. At alpha 0.18 this adds roughly +45 to
 * red, +41 to green and +31 to blue wherever it covers, which takes the
 * room's mean luma from about 81 into the low 120s while keeping the
 * colour warm rather than grey.
 */
const GARAGE_AMBIENT_TINT = 0xffe1ac;
const GARAGE_AMBIENT_ALPHA = 0.18;

/** Daylight spilling through the open south door. */
const GARAGE_DAYLIGHT_TINT = 0xfff2cc;
const GARAGE_DAYLIGHT_ALPHA = 0.3;

function saveStateToRegistry(scene, state) {
  scene.registry.set('gameState', state);
  saveGame(state);
}

function appendJournalOnce(state, entry) {
  const journal = state?.journal || [];
  if (journal.includes(entry)) return state;
  return { ...state, journal: [...journal, entry] };
}

function rememberWorkbenchRecipe(state, recipeId) {
  const recipe = getWorkbenchRecipe(recipeId);
  if (!recipe) return state;

  const known = state?.knownWorkbenchRecipes || [];
  let next = known.includes(recipeId)
    ? state
    : { ...state, knownWorkbenchRecipes: [...known, recipeId] };

  next = appendJournalOnce(next, formatWorkbenchRecipeNote(recipe));
  return next;
}

function consumeIngredients(inventory, ingredients) {
  const next = [...inventory];
  for (const ingredient of ingredients) {
    const index = next.indexOf(ingredient);
    if (index !== -1) next.splice(index, 1);
  }
  return next;
}

function advanceSatisfiedBridgeMaterialSteps(state) {
  let next = state;
  for (let guard = 0; guard < 3; guard += 1) {
    if (next?.activeQuest?.id !== 'bridge_collapse') break;
    const step = getCurrentStep(next);
    const waitsForMaterial =
      (step?.type === 'forage' || step?.type === 'use_item') && step.requiredItem;
    if (!waitsForMaterial || !(next.inventory || []).includes(step.requiredItem)) break;

    const advanced = advanceQuest(next);
    if (!advanced.ok) break;
    next = advanced.state;
  }
  return next;
}

export default class ZuzuGarageScene extends LocalSceneBase {
  static layoutEditorConfig = {
    layoutAssetKey: 'zuzuGarageLayout',
    layoutPath: 'layouts/zuzu-garage.layout.json',
  };

  constructor() {
    super('ZuzuGarageScene');
  }

  getWorldSize() {
    return { width: 800, height: 600 };
  }

  preload() {
    super.preload?.();
    this.load.json('zuzuGarageLayout', 'layouts/zuzu-garage.layout.json');
  }

  /**
   * A perimeter wall: invisible collision body plus a band of the painted
   * wall plate. `o` is a layout rect given as centre x/y with w/h.
   * @private
   */
  _wallBand(o) {
    if (!o) return;
    this.addWall(o.x, o.y, o.w, o.h);
    // tileSprite (not a stretched image) so the plate is sampled at native
    // resolution and the stucco grain keeps its scale in a thin band.
    this.addGroundTexture(
      ART.zuzugarage_wall_backdrop,
      o.x - o.w / 2, o.y - o.h / 2, o.w, o.h,
      { depth: 1 },
    );
  }

  /**
   * Warm the room up without touching the art.
   *
   * Phaser's tint multiplies, so it can only darken a texture — brightening
   * has to be additive. Two ADD-blended washes do the work:
   *
   *   1. An even warm wash over the whole room, which lifts the floor and
   *      the stucco walls (most of the pixels on screen).
   *   2. A stronger pool inside the south doorway, so the lift reads as
   *      daylight coming in through the open door rather than as a flat
   *      filter over everything.
   *
   * Both sit above the floor (depth 0) and the wall bands (depth 1) but
   * below the props (depth 2+), so the workbench, bike and tools keep their
   * own contrast and the room does not look washed out.
   *
   * @param {number} width world width
   * @param {number} height world height
   * @private
   */
  _liftInteriorLight(width, height) {
    const ambient = this.add.graphics().setDepth(1.6);
    ambient.fillStyle(GARAGE_AMBIENT_TINT, 1);
    ambient.fillRect(0, 0, width, height);
    ambient.setAlpha(GARAGE_AMBIENT_ALPHA);
    ambient.setBlendMode(Phaser.BlendModes.ADD);

    // Daylight pool at the door. Drawn as a few stacked, inset bands so the
    // edge falls off instead of ending on a hard line.
    const doorway = this.layout.sun_glow;
    if (doorway) {
      const pool = this.add.graphics().setDepth(1.65);
      pool.setBlendMode(Phaser.BlendModes.ADD);
      const bands = 4;
      for (let i = 0; i < bands; i += 1) {
        const inset = i * 26;
        pool.fillStyle(GARAGE_DAYLIGHT_TINT, GARAGE_DAYLIGHT_ALPHA / bands);
        pool.fillRect(
          doorway.x - inset,
          doorway.y - inset * 1.6,
          doorway.w + inset * 2,
          doorway.h + inset * 1.6,
        );
      }
    }
    return ambient;
  }

  createWorld() {
    this.layout = loadLayout(this, 'zuzuGarageLayout');
    const { width, height } = this.getWorldSize();
    const state = this.registry.get('gameState');

    // === FLOOR ===
    // Painted concrete floor. The slab seams are in the texture, so the
    // graphics grid that stood in for them is gone.
    this.addGroundTexture(ART.zuzugarage_floor, 0, 0, width, height);

    // === WALLS (collision + painted surface) ===
    // The wall backdrop plate supplies the stucco surface; each perimeter
    // band samples it, so the walls are art rather than a flat 0xd4a574 fill.
    for (const key of ['wall_top', 'wall_left', 'wall_right', 'wall_bottom_left', 'wall_bottom_right']) {
      this._wallBand(this.layout[key]);
    }

    // === AMBIENT LIGHT LIFT ===
    // The painted floor and wall plates read too dark for the very first
    // room a child sees (measured mean luma ~81 on the 01-zuzu-garage
    // capture). Brightened here in code rather than by regenerating the
    // art, so the plates stay exactly as delivered.
    this._liftInteriorLight(width, height);

    // === STRING LIGHTS (ceiling ambience) ===
    // Ambience art from the bundle (slot `garage_lights`) — strung along the
    // top wall so the garage reads as somewhere a kid actually works.
    for (let i = 0; i < Math.ceil(width / 128); i += 1) {
      this.addProp(ART.garage_lights, i * 128 + 64, 46, { depth: 4 });
    }

    // === WINDOWS (right wall decorative) ===
    {
      const o = this.layout.window_top;
      this.add.rectangle(o.x, o.y, o.w, o.h, 0x87ceeb, 0.6).setDepth(1);
    }
    {
      const o = this.layout.window_top_frame;
      this.add.rectangle(o.x, o.y, o.w, o.h).setStrokeStyle(3, 0x8b7355).setDepth(1);
    }
    {
      const o = this.layout.window_bottom;
      this.add.rectangle(o.x, o.y, o.w, o.h, 0x87ceeb, 0.6).setDepth(1);
    }
    {
      const o = this.layout.window_bottom_frame;
      this.add.rectangle(o.x, o.y, o.w, o.h).setStrokeStyle(3, 0x8b7355).setDepth(1);
    }

    // === PEG BOARD (top wall) ===
    // One painted pegboard replaces the brown rectangle plus its row of
    // tool glyphs — the hanging tools are in the art.
    {
      const o = this.layout.peg_board;
      this.addProp(ART.tool_wall, o.x, o.y + o.h / 2, { displayWidth: o.w, depth: 2 });
    }

    // === WORKBENCH (left side) ===
    this._workbenchX = this.layout.workbench.x;
    this._workbenchY = this.layout.workbench.y;
    {
      // The workbench sprite carries the top, the legs and the clutter, so
      // the three rectangles that stood in for them are gone.
      const o = this.layout.workbench;
      const legs = this.layout.workbench_leg_left;
      const baseY = legs ? legs.y + legs.h / 2 : o.y + o.h / 2;
      this.addProp(ART.workbench, o.x, baseY, { displayWidth: o.w, depth: 2 });
    }
    {
      const o = this.layout.workbench_wrench;
      this.addProp(ART.wrench, o.x, o.y + 10, { maxPx: 34, depth: 3 });
    }
    {
      const o = this.layout.workbench_screwdriver;
      this.addProp(ART.screwdriver, o.x, o.y + 10, { maxPx: 34, depth: 3 });
    }
    {
      const o = this.layout.workbench_toolbox;
      this.addProp(ART.toolbox, o.x, o.y + 12, { maxPx: 38, depth: 3 });
    }
    {
      const o = this.layout.workbench_steel_sample;
      this.addProp(ART.bolts, o.x, o.y + 10, { maxPx: 28, depth: 3 });
    }
    // Workbench collision body
    {
      const o = this.layout.workbench_collision;
      this.addWall(o.x, o.y, o.w, o.h);
    }

    this.addInteractable({
      x: this.layout.interact_workbench.x, y: this.layout.interact_workbench.y,
      label: 'Workbench',
      icon: null, // the workbench sprite is already drawn above; no second copy
      radius: 70,
      metadata: { questObservation: 'composite_created' },
      onInteract: () => {
        let state = this.registry.get('gameState');

        // Desert-coating quest: combine creosote_leaves + jojoba_seeds
        // → protective_coating. Emits 'coating_applied' for
        // desert_coating.apply_coating (quests.js:1611). The quest's
        // hint text talks about "resin + wax" — those are the
        // *concepts* the plants produce; the actual inventory item
        // ids are creosote_leaves (resin source) and jojoba_seeds
        // (wax source). Both are foraged in StreetBlockScene
        // (creosote bushes + jojoba shrubs) and DogParkScene (creosote
        // bushes). Earlier quest steps (gather_resin, gather_wax) gate
        // on these same item ids.
        if (state?.activeQuest?.id === 'desert_coating') {
          const remembered = rememberWorkbenchRecipe(state, 'protective_coating');
          if (remembered !== state) {
            state = remembered;
            saveStateToRegistry(this, state);
          }

          const coatingRecipe = getWorkbenchRecipe('protective_coating');
          const inv = state.inventory || [];
          const obs = state.observations || [];
          const quest = QUESTS.desert_coating;
          const step = quest?.steps?.[state.activeQuest.stepIndex];
          const isApplyStep = step?.id === 'apply_coating';
          const hasIngredients =
            inv.includes('creosote_leaves') && inv.includes('jojoba_seeds');
          const hasCoating = inv.includes('protective_coating');

          if (step?.type === 'quiz') {
            this.registry.set('dialogEvent', {
              speaker: 'Zuzu (thinking)',
              text: step.text,
              choices: step.choices,
              step,
            });
            return;
          }

          if (isApplyStep && (obs.includes('coating_applied') || hasCoating)) {
            const updated = obs.includes('coating_applied')
              ? state
              : { ...state, observations: [...obs, 'coating_applied'] };
            if (updated !== state) {
              saveStateToRegistry(this, updated);
            }
            this.registry.set('dialogEvent', {
              speaker: 'Zuzu',
              text:
                "The protective coating is ready.\n\n" +
                "Creosote resin gives it a tough UV-resistant seal, and jojoba wax helps it repel moisture.\n\n" +
                "Now I can apply it to the bike parts.",
              choices: null,
              step,
            });
            return;
          }

          if (hasIngredients && !obs.includes('coating_applied')) {
            const newInv = consumeIngredients(inv, coatingRecipe.ingredients)
              .concat(coatingRecipe.result);
            let updated = {
              ...state,
              inventory: newInv,
              observations: obs.includes(coatingRecipe.outcomeObservationId)
                ? obs
                : [...obs, coatingRecipe.outcomeObservationId],
            };
            updated = appendJournalOnce(
              updated,
              `Made ${coatingRecipe.name} at the workbench.`,
            );
            const advanced = advanceQuest(updated);
            if (advanced.ok) {
              updated = advanced.state;
            }
            const nextStep = getCurrentStep(updated);
            saveStateToRegistry(this, updated);
            this.registry.get('audioManager')?.playSfx?.('item_pickup');
            this.registry.set('dialogEvent', {
              speaker: nextStep?.type === 'quiz' ? 'Zuzu (thinking)' : 'Zuzu',
              text:
                "Mixed creosote resin with jojoba wax - got a protective coating!\n\n" +
                "Got: Protective Coating\n\n" +
                "The bench saved this recipe in my notebook so I can make it again later." +
                (nextStep?.type === 'quiz' ? `\n\n${nextStep.text}` : ''),
              choices: nextStep?.type === 'quiz' ? nextStep.choices : null,
              step: nextStep || null,
            });
            return;
          }
          if (!hasIngredients) {
            const missing = formatMissingWorkbenchIngredients(coatingRecipe, inv);
            this.registry.set('dialogEvent', {
              speaker: 'Zuzu',
              text:
                "Workbench memory:\n" +
                `${formatWorkbenchMemoryLine(coatingRecipe)}\n\n` +
                `Missing: ${missing.join(', ')}\n\n` +
                "Forage from creosote bushes and jojoba shrubs outside.",
              choices: null, step: null,
            });
            return;
          }
        }

        // Perfect Composite quest: combine agave_fiber + creosote_leaves
        // into plant_composite at the same garage workbench where recipe
        // notes are saved.
        if (state?.activeQuest?.id === 'perfect_composite') {
          const remembered = rememberWorkbenchRecipe(state, 'plant_composite');
          if (remembered !== state) {
            state = remembered;
            saveStateToRegistry(this, state);
          }

          const compositeRecipe = getWorkbenchRecipe('plant_composite');
          const inv = state.inventory || [];
          const obs = state.observations || [];
          const step = getCurrentStep(state);
          const hasIngredients =
            inv.includes('agave_fiber') && inv.includes('creosote_leaves');
          const hasComposite = inv.includes('plant_composite');

          if (step?.type === 'quiz') {
            this.registry.set('dialogEvent', {
              speaker: 'Zuzu (thinking)',
              text: step.text,
              choices: step.choices,
              step,
            });
            return;
          }

          if (obs.includes('composite_created') || hasComposite) {
            const updated = obs.includes('composite_created')
              ? state
              : { ...state, observations: [...obs, 'composite_created'] };
            if (updated !== state) {
              saveStateToRegistry(this, updated);
            }
            this.registry.set('dialogEvent', {
              speaker: 'Zuzu',
              text:
                "The plant composite is ready.\n\n" +
                "Agave fibers carry the load, and creosote resin holds the fibers together so stress spreads through the whole piece.",
              choices: null,
              step,
            });
            return;
          }

          if (hasIngredients && !obs.includes('composite_created')) {
            const newInv = consumeIngredients(inv, compositeRecipe.ingredients)
              .concat(compositeRecipe.result);
            let updated = {
              ...state,
              inventory: newInv,
              observations: obs.includes(compositeRecipe.outcomeObservationId)
                ? obs
                : [...obs, compositeRecipe.outcomeObservationId],
            };
            updated = appendJournalOnce(
              updated,
              `Made ${compositeRecipe.name} at the workbench.`,
            );
            const advanced = advanceQuest(updated);
            if (advanced.ok) {
              updated = advanced.state;
            }
            const nextStep = getCurrentStep(updated);
            saveStateToRegistry(this, updated);
            this.registry.get('audioManager')?.playSfx?.('item_pickup');
            this.registry.set('dialogEvent', {
              speaker: nextStep?.type === 'quiz' ? 'Zuzu (thinking)' : 'Zuzu',
              text:
                "Aligned agave fibers, infused them with creosote resin, and pressed the layers into a plant composite!\n\n" +
                "Got: Plant Composite\n\n" +
                "Agave carries tension; creosote resin binds the fibers and spreads the load." +
                (nextStep?.type === 'quiz' ? `\n\n${nextStep.text}` : ''),
              choices: nextStep?.type === 'quiz' ? nextStep.choices : null,
              step: nextStep || null,
            });
            return;
          }

          if (!hasIngredients) {
            const missing = formatMissingWorkbenchIngredients(compositeRecipe, inv);
            this.registry.set('dialogEvent', {
              speaker: 'Zuzu',
              text:
                "Workbench memory:\n" +
                `${formatWorkbenchMemoryLine(compositeRecipe)}\n\n` +
                `Missing: ${missing.join(', ')}\n\n` +
                "Forage agave and creosote outside, then bring them back to this workbench.",
              choices: null,
              step: null,
            });
            return;
          }
        }

        // Bridge quest: grant steel_sample from workbench
        if (state?.activeQuest?.id === 'bridge_collapse') {
          state = advanceSatisfiedBridgeMaterialSteps(state);
          if (state !== this.registry.get('gameState')) {
            saveStateToRegistry(this, state);
          }
          const step = getCurrentStep(state);
          if (step?.requiredItem === 'steel_sample' && !(state.inventory || []).includes('steel_sample')) {
            let updated = { ...state, inventory: [...state.inventory, 'steel_sample'] };
            const advanced = advanceQuest(updated);
            if (advanced.ok) {
              updated = advanced.state;
            }
            const nextStep = getCurrentStep(updated);
            saveStateToRegistry(this, updated);
            const audioMgr = this.registry.get('audioManager');
            audioMgr?.playSfx('item_pickup');
            // Mr. Chen is not in the garage. This used to hard-code him as
            // the speaker and chain straight into his next step, so the
            // weigh instruction and the weigh quiz both ran without him.
            // Route it through the shared rules with `giverPresent: false`:
            // a conversation step becomes a "go back and tell him" objective
            // that carries no step, and anything else is narrated.
            const bracketLine = nextStep
              ? dialogForStep(nextStep, updated, this._activeQuestGiverName(updated),
                { giverPresent: false })
              : null;
            this.registry.set('dialogEvent', bracketLine || {
              speaker: 'Zuzu',
              text:
                "Found a steel bracket on the workbench!\n\n🔩 Got: Steel Bracket\n\nHeavy but really strong. Let's see how it compares to the other materials.",
              choices: null,
              step: null,
            });
            return;
          }
        }

        const knownWorkbenchRecipes = getKnownWorkbenchRecipes(state);
        if (knownWorkbenchRecipes.length > 0) {
          this.registry.set('dialogEvent', {
            speaker: 'Zuzu',
            text:
              "Workbench memory:\n" +
              knownWorkbenchRecipes.map(formatWorkbenchMemoryLine).join('\n') +
              "\n\nThese recipe notes are also saved in the notebook.",
            choices: null, step: null,
          });
          return;
        }

        this.registry.set('dialogEvent', {
          speaker: 'Zuzu',
          text: "My workbench! All my tools are here.\n\nTire levers, patch kits, wrenches...\n\nWhen I learn a recipe here, the bench remembers it and writes it in my notebook.",
          choices: null, step: null,
        });
      },
    });

    // === MATERIALS LAB DOORWAY (left wall, near workbench) ===
    // Visible prop the player can interact with — gates on having all 3
    // material samples in inventory and being on (or past) the
    // weigh_instruction step of bridge_collapse.
    {
      const o = this.layout.lab_door;
      this.add.rectangle(o.x, o.y, o.w, o.h, 0x1c1d22).setStrokeStyle(2, 0x4a4d55).setDepth(1);
    }
    {
      const o = this.layout.lab_door_glyph;
      this.addProp(ART.materials_lab_marker, o.x, o.y + 10, { maxPx: 36, depth: 3 });
    }

    this.addInteractable({
      x: this.layout.interact_lab.x, y: this.layout.interact_lab.y,
      label: 'Materials Lab',
      icon: null, // the beaker is already drawn above; no second copy
      radius: 70,
      onInteract: () => {
        const s = this.registry.get('gameState') || {};
        const inv = s.inventory || [];

        // Generalized gate: open when (a) the active quest has any step
        // that targets MaterialLabScene via `step.scene`, or (b) the
        // player holds any item the lab can test. Aliases mirror
        // MaterialLabScene.SAMPLE_ITEM_IDS plus the canonical
        // mesquite_wood_sample id granted by bridge_collapse.
        const LAB_TESTABLE_ITEMS = [
          'mesquite_wood_sample', 'mesquite_sample', 'mesquite_branch',
          'copper_ore_sample', 'surface_copper', 'deep_copper',
          'steel_sample', 'steel_bracket',
        ];
        const aq = s.activeQuest;
        const activeQuestData = aq?.id ? QUESTS[aq.id] : null;
        const labStepInActiveQuest = !!activeQuestData?.steps?.some(
          (step) => step.scene === 'MaterialLabScene',
        );
        const haveLabSample = inv.some((item) => LAB_TESTABLE_ITEMS.includes(item));

        if (labStepInActiveQuest || haveLabSample) {
          this.scene.start('MaterialLabScene', { spawn: 'fromGarage' });
          return;
        }

        // Otherwise — friendly nudge so the player knows where to go.
        // The nudge is bridge-flavored because that's the canonical first-time
        // entry path; generalizing the message is out of scope for this fix.
        const missing = [];
        if (!inv.includes('mesquite_wood_sample')) missing.push('🪵 mesquite');
        if (!inv.includes('copper_ore_sample')) missing.push('🟠 copper');
        if (!inv.includes('steel_sample')) missing.push('⚙️ steel');
        const list = missing.length ? `\n\nMissing: ${missing.join(', ')}` : '';
        // The door is not Mr. Chen. He is on the street.
        this.registry.set('dialogEvent', {
          speaker: NARRATOR,
          text: `The materials lab is through here.\n\n` +
            `Bring me all three samples first — wood, copper, and steel — ` +
            `and I'll show you the testing machine.${list}`,
          choices: null, step: null,
        });
      },
    });

    // === THERMAL LAB DOORWAY (left wall, below Materials Lab) ===
    // Gates on heat_failure being active and at/past the observe_expansion
    // step (index 3 — see quests.js heat_failure.steps).
    {
      const o = this.layout.thermal_door;
      this.add.rectangle(o.x, o.y, o.w, o.h, 0x1c1d22)
        .setStrokeStyle(2, 0x4a4d55).setDepth(1);
    }
    {
      const o = this.layout.thermal_door_glyph;
      this.addProp(ART.ch_heat_math, o.x, o.y, { maxPx: 36, depth: 3 })
        .setOrigin(0.5).setDepth(2);
    }

    this.addInteractable({
      x: this.layout.interact_thermal.x, y: this.layout.interact_thermal.y,
      label: 'Thermal Lab',
      icon: null, // the thermometer is already drawn above; no second copy
      radius: 70,
      onInteract: () => {
        const s = this.registry.get('gameState') || {};
        const aq = s.activeQuest;

        // Generalized gate (mirror of the Materials Lab gate): open when
        // any active quest has a step targeting ThermalRigScene. The
        // legacy heat_failure stepIndex >= 3 check is preserved as a
        // fallback so older saves whose step.scene field hasn't been
        // backfilled still open the door.
        const activeQuestData = aq?.id ? QUESTS[aq.id] : null;
        const thermalStepInActiveQuest = !!activeQuestData?.steps?.some(
          (step) => step.scene === 'ThermalRigScene',
        );
        const onTrack = aq?.id === 'heat_failure' && (aq.stepIndex || 0) >= 3;

        if (thermalStepInActiveQuest || onTrack) {
          this.scene.start('ThermalRigScene', { spawn: 'fromGarage' });
          return;
        }

        // Likewise: this is the thermal lab door, not Mrs. Ramirez.
        this.registry.set('dialogEvent', {
          speaker: NARRATOR,
          text:
            "Come back when you've talked through the heat failure problem. " +
            "Once you understand why hot materials fail, I'll let you run the " +
            "expansion test on the rods.",
          choices: null, step: null,
        });
      },
    });

    // === HERO BIKE (center) ===
    const matGfx = this.add.graphics();
    matGfx.fillStyle(0x6b7280, 0.15);
    {
      const o = this.layout.bike_mat;
      matGfx.fillRoundedRect(o.x, o.y, o.w, o.h, 8);
    }
    // Rack
    {
      const o = this.layout.bike_rack_post_left;
      this.add.rectangle(o.x, o.y, o.w, o.h, 0x6b7280).setDepth(1);
    }
    {
      const o = this.layout.bike_rack_post_right;
      this.add.rectangle(o.x, o.y, o.w, o.h, 0x6b7280).setDepth(1);
    }
    {
      const o = this.layout.bike_rack_top_bar;
      this.add.rectangle(o.x, o.y, o.w, o.h, 0x6b7280).setDepth(1);
    }
    {
      const o = this.layout.bike_rack_bottom_bar;
      this.add.rectangle(o.x, o.y, o.w, o.h, 0x6b7280).setDepth(1);
    }
    // Bike
    {
      const o = this.layout.bike_glyph;
      this.addProp(ART.zuzu_bike, o.x, o.y + 40, { depth: 3 });
    }
    // Glow
    const bikeGlow = this.add.graphics();
    bikeGlow.fillStyle(0x3b82f6, 0.06);
    {
      const o = this.layout.bike_glow;
      bikeGlow.fillCircle(o.x, o.y, o.r);
    }
    {
      const o = this.layout.bike_label;
      this.add.text(o.x, o.y, "⭐ Zuzu's Bike ⭐", {
        fontSize: '16px', fontFamily: 'sans-serif', color: '#1e40af', fontStyle: 'bold',
        stroke: '#dbeafe', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(WORLD_SIGN_DEPTH);
    }
    // Bike rack collision
    {
      const o = this.layout.bike_collision;
      this.addWall(o.x, o.y, o.w, o.h);
    }

    this.addInteractable({
      x: this.layout.interact_bike.x, y: this.layout.interact_bike.y,
      label: "Zuzu's Bike",
      icon: null, // Zuzu's bike is already drawn above; no second copy
      // The scene draws "⭐ Zuzu's Bike ⭐" above the rack, and the player
      // spawns just below it — so the hotspot's own caption landed on
      // Zuzu's torso as a second, half-hidden "Zuzu's Bike".
      showNameLabel: false,
      // Below Zuzu's feet, not above the rack. The bike sits against the
      // top wall, so the child stands in front of it: everything between
      // the bike art and their soles is covered by their own sprite. The
      // sign stays where it was drawn and the prompt clears the child.
      promptOffset: 52,
      radius: 80,
      onInteract: () => {
        const s = this.registry.get('gameState');
        const upgrades = s?.upgrades || [];
        const bikeStatus = upgrades.length > 0
          ? `Upgrades installed: ${upgrades.join(', ')}`
          : 'No upgrades yet — earn Zuzubucks to improve it!';
        this.registry.set('dialogEvent', {
          speaker: 'Zuzu',
          text: `My bike! It's my pride and joy. 🚲\n\n${bikeStatus}`,
          choices: null, step: null,
        });
      },
    });

    // === NOTEBOOK DESK (right side) ===
    {
      const o = this.layout.notebook_desk;
      this.add.rectangle(o.x, o.y, o.w, o.h, 0x8b6f47).setStrokeStyle(3, 0x6b5430).setDepth(1);
    }
    {
      const o = this.layout.notebook_glyph;
      this.addProp(ART.notebook, o.x, o.y, { maxPx: 40, depth: 3 });
    }
    {
      const o = this.layout.notebook_pencil;
      this.addProp(ART.pencil, o.x, o.y, { maxPx: 26, depth: 3 });
    }
    {
      const o = this.layout.notebook_collision;
      this.addWall(o.x, o.y, o.w, o.h);
    }

    this.addInteractable({
      x: this.layout.interact_notebook.x, y: this.layout.interact_notebook.y,
      label: 'Notebook',
      icon: null, // the notebook is already drawn above; no second copy
      radius: 70,
      onInteract: () => {
        this.registry.set('dialogEvent', {
          speaker: 'Zuzu',
          text: "My repair notebook! 📓\n\nI write down everything I learn about fixing bikes.\n\nCheck the 📓 button in the top bar to read my notes!",
          choices: null, step: null,
        });
      },
    });

    // === CENTER AREA DECORATIONS ===
    // Oil stain
    const oilGfx = this.add.graphics();
    oilGfx.fillStyle(0x8b8070, 0.2);
    {
      const o = this.layout.oil_stain_main;
      oilGfx.fillCircle(o.x, o.y, o.r);
    }
    {
      const o = this.layout.oil_stain_drip;
      oilGfx.fillCircle(o.x, o.y, o.r);
    }

    // Tires against left wall
    {
      // Spare wheels leaning on the wall — the bundle's wheel art (cut from
      // the same bike sprite) stands in for a dedicated spare-tyre asset.
      const o = this.layout.tire_left_top;
      this.addProp(ART.map_travel_bike, o.x, o.y + 17, { maxPx: 44, depth: 2 });
    }
    {
      const o = this.layout.tire_left_bottom;
      this.addProp(ART.map_travel_bike, o.x, o.y + 14, { maxPx: 36, depth: 2 });
    }

    // Tools on left wall
    {
      const o = this.layout.wall_tool_top;
      this.addProp(ART.bolts, o.x, o.y + 11, { maxPx: 28, depth: 2 });
    }
    {
      const o = this.layout.wall_tool_bottom;
      this.addProp(ART.screwdriver, o.x, o.y + 11, { maxPx: 30, depth: 2 });
    }

    // Water bottle
    {
      const o = this.layout.water_bottle;
      this.addProp(ART.water_bottle, o.x, o.y, { maxPx: 30, depth: 2 });
    }

    // === STATE-DEPENDENT UPGRADES ===
    const upgrades = new Set(state?.upgrades || []);
    if (upgrades.has('tool_rack')) {
      {
        const o = this.layout.upgrade_tool_rack_glyph;
        this.addProp(ART.cabinet, o.x, o.y + 14, { maxPx: 46, depth: 2 });
      }
      {
        const o = this.layout.upgrade_tool_rack_tools;
        this.addProp(ART.tool_wall, o.x, o.y + 8, { maxPx: 44, depth: 3 });
      }
      {
        const o = this.layout.upgrade_tool_rack_label;
        this.add.text(o.x, o.y, 'Tool Rack', {
          fontSize: '10px', fontFamily: 'sans-serif', color: '#5a3e28', fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(2);
      }
    }
    if (upgrades.has('work_light')) {
      {
        const o = this.layout.upgrade_work_light_glyph;
        this.addProp(ART.lightbulb, o.x, o.y + 10, { maxPx: 34, depth: 3 });
      }
      const glowGfx = this.add.graphics();
      glowGfx.fillStyle(0xfef3c7, 0.18);
      {
        const o = this.layout.upgrade_work_light_glow;
        glowGfx.fillCircle(o.x, o.y, o.r);
      }
    }
    if (upgrades.has('repair_stand')) {
      {
        const o = this.layout.upgrade_repair_stand_post;
        this.add.rectangle(o.x, o.y, o.w, o.h, 0x6b7280).setDepth(1);
      }
      {
        const o = this.layout.upgrade_repair_stand_arm;
        this.add.rectangle(o.x, o.y, o.w, o.h, 0x6b7280).setDepth(1);
      }
      {
        const o = this.layout.upgrade_repair_stand_label;
        this.add.text(o.x, o.y, 'Repair Stand', {
          fontSize: '10px', fontFamily: 'sans-serif', color: '#4b5563', fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(2);
      }
    }

    // === SCENE TITLE ===
    addSceneTitle(this, "Zuzu's Garage", { color: '#78350f', stroke: '#fef3c7' });

    // === EXIT (south door → street) ===
    // Sunlight glow at door
    const sunGfx = this.add.graphics();
    sunGfx.fillStyle(0xfbbf24, 0.2);
    {
      const o = this.layout.sun_glow;
      sunGfx.fillRect(o.x, o.y, o.w, o.h);
    }

    {
      const o = this.layout.exit_zone_south;
      this.addExit({
        x: o.x, y: o.y,
        width: o.w, height: o.h,
        targetScene: 'StreetBlockScene',
        targetSpawn: 'fromGarage',
        label: '☀️ Go Outside ⬇',
      });
    }

    // === ONBOARDING ===
    if (!state.hasSeenOnboarding) {
      this.time.delayedCall(600, () => {
        this.registry.set('dialogEvent', {
          speaker: 'Zuzu',
          text: "Welcome to my garage! 🏠\n\nI'm Zuzu, and I love fixing bikes!\n\nLook around — there's my workbench, my toolkit, and my bike on the rack.\n\nPress E or tap 💬 to interact with things.\n\nHead outside through the door at the bottom to explore!",
          choices: null, step: null,
        });
        const s = this.registry.get('gameState');
        const updated = { ...s, hasSeenOnboarding: true };
        this.registry.set('gameState', updated);
        saveGame(updated);
      });
    }
  }
}

// -- HMR -------------------------------------------------------------
registerSceneHmr('ZuzuGarageScene', import.meta.hot, ZuzuGarageScene);
