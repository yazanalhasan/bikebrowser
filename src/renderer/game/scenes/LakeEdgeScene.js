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
import { registerSceneHmr } from '../dev/phaserHmr.js';
import { loadLayout } from '../utils/loadLayout.js';
import { advanceQuest, getCurrentStep } from '../systems/questSystem.js';
import { saveGame } from '../systems/saveSystem.js';

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
    // Grass (southern half)
    this.add.rectangle(this.layout.ground_grass.x, this.layout.ground_grass.y, this.layout.ground_grass.w, this.layout.ground_grass.h, 0x7cb342);
    // Sand/tan strip (middle)
    this.add.rectangle(this.layout.ground_sand.x, this.layout.ground_sand.y, this.layout.ground_sand.w, this.layout.ground_sand.h, 0xe8d5a3);
    // Water (northern portion)
    this.add.rectangle(this.layout.water.x, this.layout.water.y, this.layout.water.w, this.layout.water.h, 0x42a5f5);

    // Shoreline edge detail
    const shoreGfx = this.add.graphics();
    shoreGfx.fillStyle(0xc8b88a, 0.5);
    for (let x = 0; x < width; x += 60) {
      shoreGfx.fillEllipse(x + 30, this.layout.shore_ripple_y.y, 70, 20);
    }

    // Water ripples (decorative)
    const waterGfx = this.add.graphics();
    waterGfx.lineStyle(1, 0x90caf9, 0.4);
    for (let y = 40; y < 190; y += 30) {
      for (let x = 50; x < width; x += 120) {
        waterGfx.strokeEllipse(x, y, 40, 8);
      }
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
      this.add.text(this.layout.interact_fishing_spot.x, this.layout.interact_fishing_spot.y - 34, '🚣', {
        fontSize: '34px',
        stroke: '#ffffff',
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(4);
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
      this.add.text(rx, ry, '🪨', { fontSize: '24px' }).setOrigin(0.5).setDepth(3);
      this.addWall(rx, ry, 22, 18);
    }

    // === REEDS ===
    for (const { x: rx, y: ry } of this.layout.reeds) {
      this.add.text(rx, ry, '🌾', { fontSize: '20px' }).setOrigin(0.5).setDepth(3);
    }

    // === TREES ===
    for (const { x: tx, y: ty } of this.layout.trees) {
      this.add.text(tx, ty, '🌳', { fontSize: '32px' }).setOrigin(0.5).setDepth(3);
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
      icon: isRaftDockMode ? '🚣' : '🎣',
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

        this.registry.set('dialogEvent', {
          speaker: 'Zuzu',
          text: "The water is calm here at the end of the dock. I can see fish swimming below!\n\n(Fishing mini-game coming soon!)",
          choices: null, step: null,
        });
      },
    });

    // Cave entrance (east side)
    this.addInteractable({
      x: this.layout.interact_cave_entrance.x, y: this.layout.interact_cave_entrance.y,
      label: 'Cave Entrance',
      icon: '🕳️',
      radius: 55,
      onInteract: () => {
        this.registry.set('dialogEvent', {
          speaker: 'Zuzu',
          text: "A dark cave opening in the rocks... I can feel cool air coming from inside.\n\nI should come back with a flashlight.\n\n(Cave exploration coming soon!)",
          choices: null, step: null,
        });
      },
    });

    // Interesting shell on the beach
    this.addInteractable({
      x: this.layout.interact_seashell.x, y: this.layout.interact_seashell.y,
      label: 'Seashell',
      icon: '🐚',
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
    this.add.text(this.layout.scene_title.x, this.layout.scene_title.y, '🏞️ Lake Edge', {
      fontSize: '20px', fontFamily: 'sans-serif', color: '#1b5e20',
      fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5);

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
