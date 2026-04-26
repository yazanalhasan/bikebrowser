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

export default class ZuzuGarageScene extends LocalSceneBase {
  constructor() {
    super('ZuzuGarageScene');
  }

  getWorldSize() {
    return { width: 800, height: 600 };
  }

  createWorld() {
    const { width, height } = this.getWorldSize();
    const state = this.registry.get('gameState');

    // === FLOOR ===
    this.add.rectangle(width / 2, height / 2, width, height, 0xbfb8a8);
    const floorGfx = this.add.graphics();
    floorGfx.lineStyle(1, 0xa8a090, 0.3);
    for (let x = 0; x < width; x += 60) floorGfx.lineBetween(x, 0, x, height);
    for (let y = 0; y < height; y += 60) floorGfx.lineBetween(0, y, width, y);

    // === WALLS (collision) ===
    // Top wall
    this.addVisibleWall(width / 2, 20, width, 40, 0xd4a574, 0xc4945e);
    // Left wall
    this.addVisibleWall(20, height / 2, 40, height, 0xd4a574, 0xc4945e);
    // Right wall
    this.addVisibleWall(width - 20, height / 2, 40, height, 0xd4a574, 0xc4945e);
    // Bottom wall (with door gap)
    this.addVisibleWall(150, height - 20, 300, 40, 0xd4a574, 0xc4945e);
    this.addVisibleWall(width - 150, height - 20, 300, 40, 0xd4a574, 0xc4945e);

    // === WINDOWS (right wall decorative) ===
    this.add.rectangle(width - 20, 200, 24, 50, 0x87ceeb, 0.6).setDepth(1);
    this.add.rectangle(width - 20, 200, 24, 50).setStrokeStyle(3, 0x8b7355).setDepth(1);
    this.add.rectangle(width - 20, 320, 24, 50, 0x87ceeb, 0.6).setDepth(1);
    this.add.rectangle(width - 20, 320, 24, 50).setStrokeStyle(3, 0x8b7355).setDepth(1);

    // === PEG BOARD (top wall) ===
    this.add.rectangle(width / 2, 50, 240, 28, 0x8b7355).setDepth(1);
    this.add.text(width / 2, 50, '⚙️  🪚  📏  🔩  🪛', { fontSize: '16px' }).setOrigin(0.5).setDepth(2);

    // === WORKBENCH (left side) ===
    this._workbenchX = 140;
    this._workbenchY = 160;
    this.add.rectangle(140, 160, 180, 70, 0x7c5c3c).setStrokeStyle(3, 0x5a3e28).setDepth(1);
    this.add.rectangle(60, 200, 10, 26, 0x5a3e28).setDepth(1);
    this.add.rectangle(220, 200, 10, 26, 0x5a3e28).setDepth(1);
    this.add.text(110, 152, '🔧', { fontSize: '24px' }).setOrigin(0.5).setDepth(2);
    this.add.text(140, 152, '🪛', { fontSize: '24px' }).setOrigin(0.5).setDepth(2);
    this.add.text(170, 152, '🧰', { fontSize: '24px' }).setOrigin(0.5).setDepth(2);
    // Workbench collision body
    this.addWall(140, 160, 180, 70);

    this.addInteractable({
      x: 140, y: 220,
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

    // === HERO BIKE (center) ===
    const bikeX = width / 2;
    const bikeY = 170;
    const matGfx = this.add.graphics();
    matGfx.fillStyle(0x6b7280, 0.15);
    matGfx.fillRoundedRect(bikeX - 70, bikeY - 20, 140, 90, 8);
    // Rack
    this.add.rectangle(bikeX - 50, bikeY - 30, 6, 70, 0x6b7280).setDepth(1);
    this.add.rectangle(bikeX + 50, bikeY - 30, 6, 70, 0x6b7280).setDepth(1);
    this.add.rectangle(bikeX, bikeY - 60, 106, 5, 0x6b7280).setDepth(1);
    this.add.rectangle(bikeX, bikeY + 40, 106, 4, 0x6b7280).setDepth(1);
    // Bike
    this.add.text(bikeX, bikeY + 5, '🚲', { fontSize: '72px' }).setOrigin(0.5).setDepth(2);
    // Glow
    const bikeGlow = this.add.graphics();
    bikeGlow.fillStyle(0x3b82f6, 0.06);
    bikeGlow.fillCircle(bikeX, bikeY + 5, 60);
    this.add.text(bikeX, bikeY + 60, "⭐ Zuzu's Bike ⭐", {
      fontSize: '16px', fontFamily: 'sans-serif', color: '#1e40af', fontStyle: 'bold',
      stroke: '#dbeafe', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(2);
    // Bike rack collision
    this.addWall(bikeX, bikeY, 120, 80);

    this.addInteractable({
      x: bikeX, y: bikeY + 80,
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
    this.add.rectangle(660, 160, 140, 65, 0x8b6f47).setStrokeStyle(3, 0x6b5430).setDepth(1);
    this.add.text(640, 152, '📓', { fontSize: '30px' }).setOrigin(0.5).setDepth(2);
    this.add.text(680, 152, '✏️', { fontSize: '22px' }).setOrigin(0.5).setDepth(2);
    this.addWall(660, 160, 140, 65);

    this.addInteractable({
      x: 660, y: 210,
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
    oilGfx.fillCircle(480, 380, 30);
    oilGfx.fillCircle(460, 410, 18);

    // Tires against left wall
    this.add.text(52, 320, '⭕', { fontSize: '34px' }).setOrigin(0.5).setDepth(1);
    this.add.text(52, 380, '⭕', { fontSize: '28px' }).setOrigin(0.5).setDepth(1);

    // Tools on left wall
    this.add.text(52, 260, '🔩', { fontSize: '22px' }).setOrigin(0.5).setDepth(1);
    this.add.text(52, 430, '🪛', { fontSize: '22px' }).setOrigin(0.5).setDepth(1);

    // Water bottle
    this.add.text(width - 52, 420, '🧃', { fontSize: '22px' }).setOrigin(0.5).setDepth(1);

    // === STATE-DEPENDENT UPGRADES ===
    const upgrades = new Set(state?.upgrades || []);
    if (upgrades.has('tool_rack')) {
      this.add.rectangle(width - 52, 260, 32, 80, 0x6b5430).setStrokeStyle(2, 0x4a3520).setDepth(1);
      this.add.text(width - 52, 240, '🗄️', { fontSize: '20px' }).setOrigin(0.5).setDepth(2);
      this.add.text(width - 52, 260, '🔧🪛', { fontSize: '12px' }).setOrigin(0.5).setDepth(2);
      this.add.text(width - 52, 290, 'Tool Rack', {
        fontSize: '10px', fontFamily: 'sans-serif', color: '#5a3e28', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(2);
    }
    if (upgrades.has('work_light')) {
      this.add.text(200, 130, '💡', { fontSize: '20px' }).setOrigin(0.5).setDepth(2);
      const glowGfx = this.add.graphics();
      glowGfx.fillStyle(0xfef3c7, 0.12);
      glowGfx.fillCircle(140, 160, 60);
    }
    if (upgrades.has('repair_stand')) {
      this.add.rectangle(340, 360, 8, 55, 0x6b7280).setDepth(1);
      this.add.rectangle(340, 335, 32, 6, 0x6b7280).setDepth(1);
      this.add.text(340, 395, 'Repair Stand', {
        fontSize: '10px', fontFamily: 'sans-serif', color: '#4b5563', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(2);
    }

    // === SCENE TITLE ===
    this.add.text(width / 2, 70, "Zuzu's Garage", {
      fontSize: '20px', fontFamily: 'sans-serif', color: '#78350f',
      fontStyle: 'bold', stroke: '#fef3c7', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5);

    // === EXIT (south door → street) ===
    // Sunlight glow at door
    const sunGfx = this.add.graphics();
    sunGfx.fillStyle(0xfbbf24, 0.12);
    sunGfx.fillRect(300, height - 55, 200, 55);

    this.addExit({
      x: width / 2, y: height - 14,
      width: 200, height: 28,
      targetScene: 'StreetBlockScene',
      targetSpawn: 'fromGarage',
      label: '☀️ Go Outside ⬇',
    });

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
