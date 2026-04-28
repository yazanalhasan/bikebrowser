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

import LocalSceneBase from './LocalSceneBase.js';
import { saveGame } from '../systems/saveSystem.js';
import QUESTS from '../data/quests.js';
import { registerSceneHmr } from '../dev/phaserHmr.js';
import { loadLayout } from '../utils/loadLayout.js';

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

  createWorld() {
    this.layout = loadLayout(this, 'zuzuGarageLayout');
    const { width, height } = this.getWorldSize();
    const state = this.registry.get('gameState');

    // === FLOOR ===
    {
      const o = this.layout.floor;
      this.add.rectangle(o.x, o.y, o.w, o.h, 0xbfb8a8);
    }
    const floorGfx = this.add.graphics();
    floorGfx.lineStyle(1, 0xa8a090, 0.3);
    for (let x = 0; x < width; x += 60) floorGfx.lineBetween(x, 0, x, height);
    for (let y = 0; y < height; y += 60) floorGfx.lineBetween(0, y, width, y);

    // === WALLS (collision) ===
    // Top wall
    {
      const o = this.layout.wall_top;
      this.addVisibleWall(o.x, o.y, o.w, o.h, 0xd4a574, 0xc4945e);
    }
    // Left wall
    {
      const o = this.layout.wall_left;
      this.addVisibleWall(o.x, o.y, o.w, o.h, 0xd4a574, 0xc4945e);
    }
    // Right wall
    {
      const o = this.layout.wall_right;
      this.addVisibleWall(o.x, o.y, o.w, o.h, 0xd4a574, 0xc4945e);
    }
    // Bottom wall (with door gap)
    {
      const o = this.layout.wall_bottom_left;
      this.addVisibleWall(o.x, o.y, o.w, o.h, 0xd4a574, 0xc4945e);
    }
    {
      const o = this.layout.wall_bottom_right;
      this.addVisibleWall(o.x, o.y, o.w, o.h, 0xd4a574, 0xc4945e);
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
    {
      const o = this.layout.peg_board;
      this.add.rectangle(o.x, o.y, o.w, o.h, 0x8b7355).setDepth(1);
    }
    {
      const o = this.layout.peg_board_tools;
      this.add.text(o.x, o.y, '⚙️  🪚  📏  🔩  🪛', { fontSize: '16px' }).setOrigin(0.5).setDepth(2);
    }

    // === WORKBENCH (left side) ===
    this._workbenchX = this.layout.workbench.x;
    this._workbenchY = this.layout.workbench.y;
    {
      const o = this.layout.workbench;
      this.add.rectangle(o.x, o.y, o.w, o.h, 0x7c5c3c).setStrokeStyle(3, 0x5a3e28).setDepth(1);
    }
    {
      const o = this.layout.workbench_leg_left;
      this.add.rectangle(o.x, o.y, o.w, o.h, 0x5a3e28).setDepth(1);
    }
    {
      const o = this.layout.workbench_leg_right;
      this.add.rectangle(o.x, o.y, o.w, o.h, 0x5a3e28).setDepth(1);
    }
    {
      const o = this.layout.workbench_wrench;
      this.add.text(o.x, o.y, '🔧', { fontSize: '24px' }).setOrigin(0.5).setDepth(2);
    }
    {
      const o = this.layout.workbench_screwdriver;
      this.add.text(o.x, o.y, '🪛', { fontSize: '24px' }).setOrigin(0.5).setDepth(2);
    }
    {
      const o = this.layout.workbench_toolbox;
      this.add.text(o.x, o.y, '🧰', { fontSize: '24px' }).setOrigin(0.5).setDepth(2);
    }
    // Workbench collision body
    {
      const o = this.layout.workbench_collision;
      this.addWall(o.x, o.y, o.w, o.h);
    }

    this.addInteractable({
      x: this.layout.interact_workbench.x, y: this.layout.interact_workbench.y,
      label: 'Workbench',
      icon: '🔧',
      radius: 70,
      onInteract: () => {
        const state = this.registry.get('gameState');

        // Bridge quest: grant steel_sample from workbench
        if (state?.activeQuest?.id === 'bridge_collapse') {
          const quest = QUESTS['bridge_collapse'];
          const step = quest?.steps[state.activeQuest.stepIndex];
          if (step?.requiredItem === 'steel_sample' && !(state.inventory || []).includes('steel_sample')) {
            const updated = { ...state, inventory: [...state.inventory, 'steel_sample'] };
            this.registry.set('gameState', updated);
            saveGame(updated);
            const audioMgr = this.registry.get('audioManager');
            audioMgr?.playSfx('item_pickup');
            this.registry.set('dialogEvent', {
              speaker: 'Zuzu',
              text: "Found a steel bracket on the workbench!\n\n🔩 Got: Steel Bracket\n\nHeavy but really strong. Let's see how it compares to the other materials.",
              choices: null, step: null,
            });
            return;
          }
        }

        this.registry.set('dialogEvent', {
          speaker: 'Zuzu',
          text: "My workbench! All my tools are here.\n\n🔧 Tire levers, patch kits, wrenches...\n\nWhen I get a repair job, this is where the magic happens!",
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
      this.add.text(o.x, o.y, '🧪', { fontSize: '20px' }).setOrigin(0.5).setDepth(2);
    }

    this.addInteractable({
      x: this.layout.interact_lab.x, y: this.layout.interact_lab.y,
      label: 'Materials Lab',
      icon: '🧪',
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
        this.registry.set('dialogEvent', {
          speaker: 'Mr. Chen',
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
      this.add.text(o.x, o.y, '🌡️', { fontSize: '20px' })
        .setOrigin(0.5).setDepth(2);
    }

    this.addInteractable({
      x: this.layout.interact_thermal.x, y: this.layout.interact_thermal.y,
      label: 'Thermal Lab',
      icon: '🌡️',
      radius: 70,
      onInteract: () => {
        const s = this.registry.get('gameState') || {};
        const aq = s.activeQuest;
        // Open to anyone on the heat_failure quest at the observe step or
        // beyond. This means whichever step has id 'observe_expansion' or
        // later — index 3 in the new step list.
        const onTrack = aq?.id === 'heat_failure' && (aq.stepIndex || 0) >= 3;

        if (onTrack) {
          this.scene.start('ThermalRigScene', { spawn: 'fromGarage' });
          return;
        }

        this.registry.set('dialogEvent', {
          speaker: 'Mrs. Ramirez',
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
      this.add.text(o.x, o.y, '🚲', { fontSize: '72px' }).setOrigin(0.5).setDepth(2);
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
      }).setOrigin(0.5).setDepth(2);
    }
    // Bike rack collision
    {
      const o = this.layout.bike_collision;
      this.addWall(o.x, o.y, o.w, o.h);
    }

    this.addInteractable({
      x: this.layout.interact_bike.x, y: this.layout.interact_bike.y,
      label: "Zuzu's Bike",
      icon: '🚲',
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
      this.add.text(o.x, o.y, '📓', { fontSize: '30px' }).setOrigin(0.5).setDepth(2);
    }
    {
      const o = this.layout.notebook_pencil;
      this.add.text(o.x, o.y, '✏️', { fontSize: '22px' }).setOrigin(0.5).setDepth(2);
    }
    {
      const o = this.layout.notebook_collision;
      this.addWall(o.x, o.y, o.w, o.h);
    }

    this.addInteractable({
      x: this.layout.interact_notebook.x, y: this.layout.interact_notebook.y,
      label: 'Notebook',
      icon: '📓',
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
      const o = this.layout.tire_left_top;
      this.add.text(o.x, o.y, '⭕', { fontSize: '34px' }).setOrigin(0.5).setDepth(1);
    }
    {
      const o = this.layout.tire_left_bottom;
      this.add.text(o.x, o.y, '⭕', { fontSize: '28px' }).setOrigin(0.5).setDepth(1);
    }

    // Tools on left wall
    {
      const o = this.layout.wall_tool_top;
      this.add.text(o.x, o.y, '🔩', { fontSize: '22px' }).setOrigin(0.5).setDepth(1);
    }
    {
      const o = this.layout.wall_tool_bottom;
      this.add.text(o.x, o.y, '🪛', { fontSize: '22px' }).setOrigin(0.5).setDepth(1);
    }

    // Water bottle
    {
      const o = this.layout.water_bottle;
      this.add.text(o.x, o.y, '🧃', { fontSize: '22px' }).setOrigin(0.5).setDepth(1);
    }

    // === STATE-DEPENDENT UPGRADES ===
    const upgrades = new Set(state?.upgrades || []);
    if (upgrades.has('tool_rack')) {
      {
        const o = this.layout.upgrade_tool_rack_shelf;
        this.add.rectangle(o.x, o.y, o.w, o.h, 0x6b5430).setStrokeStyle(2, 0x4a3520).setDepth(1);
      }
      {
        const o = this.layout.upgrade_tool_rack_glyph;
        this.add.text(o.x, o.y, '🗄️', { fontSize: '20px' }).setOrigin(0.5).setDepth(2);
      }
      {
        const o = this.layout.upgrade_tool_rack_tools;
        this.add.text(o.x, o.y, '🔧🪛', { fontSize: '12px' }).setOrigin(0.5).setDepth(2);
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
        this.add.text(o.x, o.y, '💡', { fontSize: '20px' }).setOrigin(0.5).setDepth(2);
      }
      const glowGfx = this.add.graphics();
      glowGfx.fillStyle(0xfef3c7, 0.12);
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
    {
      const o = this.layout.scene_title;
      this.add.text(o.x, o.y, "Zuzu's Garage", {
        fontSize: '20px', fontFamily: 'sans-serif', color: '#78350f',
        fontStyle: 'bold', stroke: '#fef3c7', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(5);
    }

    // === EXIT (south door → street) ===
    // Sunlight glow at door
    const sunGfx = this.add.graphics();
    sunGfx.fillStyle(0xfbbf24, 0.12);
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

// ── HMR ──────────────────────────────────────────────────────────────
registerSceneHmr('ZuzuGarageScene', import.meta.hot, ZuzuGarageScene);
