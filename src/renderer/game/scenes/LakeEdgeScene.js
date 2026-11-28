/**
 * LakeEdgeScene — peaceful lakeside area with a dock and shoreline.
 *
 * Local playable scene with:
 *   - Shoreline on the north, water collision
 *   - Dock/pier extending into the water
 *   - Reeds, rocks, trees along the shore
 *   - Fishing spot interactable, cave entrance interactable (future)
 *   - Sandy ground near water, grass further south
 *   - Exit south to overworld
 *
 * World size: 900x700
 */

import LocalSceneBase from './LocalSceneBase.js';
import { startInteraction } from '../systems/interactionManager.js';
import { registerSceneHmr } from '../dev/phaserHmr.js';
import { loadLayout } from '../utils/loadLayout.js';
import { advanceQuest, getCurrentStep } from '../systems/questSystem.js';
import { saveGame } from '../systems/saveSystem.js';
import { ART } from '../../../game/assets/act1ArtRegistry.js';
import { groundDepth } from '../../../game/assets/act1Art.js';
import { addSceneTitle } from '../ui/sceneTitle.js';

function isBoatPuzzleDockMode(state, step) {
  if (state?.activeQuest?.id !== 'boat_puzzle') return false;
  if ((state.observations || []).includes('buoyancy_test_passed')) return false;
  return ['learn_buoyancy', 'quiz_buoyancy', 'test_raft'].includes(step?.id);
}

export default class LakeEdgeScene extends LocalSceneBase {
  static layoutEditorConfig = {
    layoutAssetKey: 'lakeEdgeLayout',
    layoutPath: 'layouts/lake-edge.layout.json',
  };

  constructor() {
    super('LakeEdgeScene');
  }

  preload() {
    super.preload?.();
    this.load.json('lakeEdgeLayout', 'layouts/lake-edge.layout.json');
  }

  getWorldSize() {
    return { width: 900, height: 700 };
  }

  createWorld() {
    const { width, height } = this.getWorldSize();
    this.layout = loadLayout(this, 'lakeEdgeLayout');
    const state = this.registry.get('gameState');
    const currentStep = getCurrentStep(state);
    const isRaftDockMode = isBoatPuzzleDockMode(state, currentStep);

    // === GROUND ===
    // Grass, shoreline sand and the painted lake plate. The ripple and
    // shoreline graphics are gone — that detail is in the art.
    {
      const o = this.layout.ground_grass;
      this.addGroundTexture(ART.lakeedge_grass, o.x - o.w / 2, o.y - o.h / 2, o.w, o.h);
    }
    {
      const o = this.layout.ground_sand;
      this.addGroundTexture('ecology.terrain.sand', o.x - o.w / 2, o.y - o.h / 2, o.w, o.h);
    }
    {
      // The lake plate is a horizon painting (open water receding to a far
      // shore), so it is stretched across the water band rather than tiled —
      // tiling would repeat its sky corner over the whole lake.
      const o = this.layout.water;
      this.addBackdropTexture(ART.lakeedge_water_backdrop, o.x - o.w / 2, o.y - o.h / 2, o.w, o.h);
    }

    // === WATER COLLISION (top zone) ===
    this.addWall(this.layout.wall_water.x, this.layout.wall_water.y, this.layout.wall_water.w, this.layout.wall_water.h);

    // === BOUNDARY WALLS ===
    this.addWall(this.layout.wall_top.x, this.layout.wall_top.y, this.layout.wall_top.w, this.layout.wall_top.h);       // top
    this.addWall(this.layout.wall_left.x, this.layout.wall_left.y, this.layout.wall_left.w, this.layout.wall_left.h);   // left
    this.addWall(this.layout.wall_right.x, this.layout.wall_right.y, this.layout.wall_right.w, this.layout.wall_right.h); // right

    // === DOCK / PIER ===
    const dockX = this.layout.interact_fishing_spot.x;
    const dockGfx = this.add.graphics();
    dockGfx.fillStyle(0x8d6e63, 1);
    dockGfx.fillRect(this.layout.dock.x, this.layout.dock.y, this.layout.dock.w, this.layout.dock.h);
    // Dock planks
    dockGfx.lineStyle(1, 0x6d4c41, 0.6);
    for (let py = 150; py < 340; py += 15) {
      dockGfx.strokeRect(dockX - 24, py, 48, 14);
    }
    // Dock posts
    this.add.rectangle(this.layout.dock_post_left.x, this.layout.dock_post_left.y, this.layout.dock_post_left.w, this.layout.dock_post_left.h, 0x5d4037).setDepth(2);
    this.add.rectangle(this.layout.dock_post_right.x, this.layout.dock_post_right.y, this.layout.dock_post_right.w, this.layout.dock_post_right.h, 0x5d4037).setDepth(2);
    // Dock walls (sides only so player can walk on it)
    this.addWall(this.layout.dock_wall_left.x, this.layout.dock_wall_left.y, this.layout.dock_wall_left.w, this.layout.dock_wall_left.h);
    this.addWall(this.layout.dock_wall_right.x, this.layout.dock_wall_right.y, this.layout.dock_wall_right.w, this.layout.dock_wall_right.h);

    if (isRaftDockMode) {
      this.addProp(
        ART.rowboat,
        this.layout.interact_fishing_spot.x,
        this.layout.interact_fishing_spot.y - 10,
        { depth: 4 },
      );
      this.add.text(this.layout.interact_fishing_spot.x, this.layout.interact_fishing_spot.y + 28, 'Raft Test Dock', {
        fontSize: '15px',
        fontFamily: 'sans-serif',
        color: '#0d47a1',
        fontStyle: 'bold',
        stroke: '#ffffff',
        strokeThickness: 4,
      }).setOrigin(0.5).setDepth(5);
    }

    // === ROCKS ===
    for (const { x: rx, y: ry } of this.layout.rocks) {
      this.addProp(ART.rock_boulder, rx, ry + 12, { maxPx: 36, depth: groundDepth(ry) });
      this.addWall(rx, ry, 22, 18);
    }

    // === REEDS ===
    for (const { x: rx, y: ry } of this.layout.reeds) {
      this.addProp(ART.reeds, rx, ry + 12, { maxPx: 40, depth: groundDepth(ry) });
    }

    // === TREES ===
    for (const { x: tx, y: ty } of this.layout.trees) {
      this.addProp(ART.shade_tree, tx, ty + 20, { maxPx: 96, depth: groundDepth(ty) });
      this.addWall(tx, ty, 20, 20);
    }

    // === PATH along shore ===
    const pathGfx = this.add.graphics();
    pathGfx.fillStyle(0xd7ccc8, 0.7);
    pathGfx.fillRoundedRect(this.layout.path.x, this.layout.path.y, this.layout.path.w, this.layout.path.h, 8);

    // === INTERACTABLES ===

    // Fishing spot (end of dock)
    this.addInteractable({
      x: this.layout.interact_fishing_spot.x, y: this.layout.interact_fishing_spot.y,
      label: isRaftDockMode ? 'Raft Test Dock' : 'Fishing Spot',
      icon: isRaftDockMode ? ART.rowboat : ART.fishing_spot,
      radius: isRaftDockMode ? 95 : 55,
      metadata: { questObservation: 'buoyancy_test_passed' },
      onInteract: () => {
        let state = this.registry.get('gameState');
        const step = getCurrentStep(state);
        if (state?.activeQuest?.id === 'boat_puzzle' && step?.id !== 'test_raft') {
          this.registry.set('dialogEvent', {
            speaker: step?.type === 'quiz' ? 'Mr. Chen' : 'Zuzu',
            text:
              "This dock is where we'll test the raft once the density lesson is done.\n\n" +
              (step?.text || 'Talk with Mr. Chen to continue the boat challenge.'),
            choices: step?.type === 'quiz' ? step.choices : null,
            step: step || null,
          });
          return;
        }

        if (state?.activeQuest?.id === 'boat_puzzle' && step?.id === 'test_raft') {
          const inventory = state.inventory || [];
          const hasHullMaterial =
            inventory.includes('mesquite_wood_sample') || inventory.includes('mesquite_pods');

          if (!hasHullMaterial) {
            this.registry.set('dialogEvent', {
              speaker: 'Zuzu',
              text:
                "This is the right place to test the raft, but I still need a floating hull material.\n\n" +
                "Mesquite wood is less dense than water, so it is the right choice for the hull.",
              choices: null,
              step,
            });
            return;
          }

          if (!state.observations?.includes('buoyancy_test_passed')) {
            let updated = {
              ...state,
              observations: [...(state.observations || []), 'buoyancy_test_passed'],
              journal: [
                ...(state.journal || []),
                'Tested the raft at Lake Edge: mesquite hull floated and even cargo loading stayed stable.',
              ],
            };
            const advanced = advanceQuest(updated);
            if (advanced.ok) {
              updated = advanced.state;
            }
            state = updated;
            this.registry.set('gameState', state);
            saveGame(state);
          }

          const nextStep = getCurrentStep(state);
          const audioMgr = this.registry.get('audioManager');
          audioMgr?.playSfx?.('ui_success');
          this.registry.set('dialogEvent', {
            speaker: nextStep ? 'Mr. Chen' : 'Zuzu',
            text:
              "The raft test worked!\n\n" +
              "Mesquite wood stayed below water's density, so the hull floated. When the cargo was centered, the raft stayed level instead of tipping." +
              (nextStep?.text ? `\n\n${nextStep.text}` : ''),
            choices: nextStep?.type === 'quiz' ? nextStep.choices : null,
            step: nextStep || null,
          });
          return;
        }

        if (state?.activeQuest?.id === 'invisible_map' && step?.id === 'find_water_blind') {
          if (!state.observations?.includes('water_found_blind')) {
            state = {
              ...state,
              observations: [...(state.observations || []), 'water_found_blind'],
            };
            this.registry.set('gameState', state);
            saveGame(state);
          }
          const audioMgr = this.registry.get('audioManager');
          audioMgr?.playSfx?.('ui_success');
          this.registry.set('dialogEvent', {
            speaker: 'Zuzu',
            text:
              'Found water from memory! The lake dock was right where I remembered it. I did not need the GPS route to get here.',
            choices: null,
            step,
          });
          return;
        }

        startInteraction(this, {
          type: 'ecology',
          lessonId: 'dock_shade',
          knowledgeId: 'concept:shade',
          prompt: 'Fish are holding in the shadow of the dock. Why does shade matter here?',
          choices: [
            { label: 'Shade is cooler water, so animals wait out the desert heat', correct: true },
            { label: 'Shade makes the water disappear', correct: false },
            { label: 'Fish only swim where there is no light at all', correct: false },
          ],
          success: 'Shade is a desert tool. Plants, people, and fish all use it to beat the heat.',
        });
      },
    });

    // Cave entrance (east side)
    this.addInteractable({
      x: this.layout.interact_cave_entrance.x, y: this.layout.interact_cave_entrance.y,
      label: 'Cave Entrance',
      icon: ART.cave_entrance,
      radius: 55,
      onInteract: () => {
        startInteraction(this, {
          type: 'ecology',
          lessonId: 'cave_mouth_seen',
          knowledgeId: 'concept:thermal_mass',
          prompt: 'The cave mouth is cooler than the sunny rocks. Why?',
          choices: [
            { label: 'Rock is slow to heat, so the inside stays cool', correct: true },
            { label: 'Caves make their own ice', correct: false },
            { label: 'The sun cannot shine anywhere in the desert', correct: false },
          ],
          success: 'Rock holds heat slowly. That is the same idea the thermal rig tests on metal.',
        });
      },
    });

    // Interesting shell on the beach
    this.addInteractable({
      x: this.layout.interact_seashell.x, y: this.layout.interact_seashell.y,
      label: 'Seashell',
      icon: ART.seashell,
      radius: 50,
      onInteract: () => {
        this.registry.set('dialogEvent', {
          speaker: 'Zuzu',
          text: "A pretty spiral shell washed up on the shore. If I hold it up to my ear, I can almost hear the ocean!",
          choices: null, step: null,
        });
      },
    });

    // === SCENE TITLE ===
    addSceneTitle(this, '🏞️ Lake Edge', { color: '#1b5e20', stroke: '#ffffff' });

    // === EXIT (south → overworld) ===
    this.addExit({
      x: this.layout.exit_south.x, y: this.layout.exit_south.y,
      width: this.layout.exit_south.w, height: this.layout.exit_south.h,
      targetScene: 'OverworldScene',
      targetSpawn: 'fromLakeEdge',
      label: '🗺️ Leave Lake ⬇',
    });
  }
}

// ── HMR ──────────────────────────────────────────────────────────────
registerSceneHmr('LakeEdgeScene', import.meta.hot, LakeEdgeScene);
