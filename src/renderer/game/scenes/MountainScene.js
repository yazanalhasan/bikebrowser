/**
 * MountainScene — foothills and mountain terrain with climbing paths.
 *
 * Local playable scene with:
 *   - Foothills at bottom, steeper terrain going up
 *   - Rocky collision areas, a climb path
 *   - Cave entrance interactable (future boss/puzzle)
 *   - Rare materials interactable
 *   - Exit south to overworld
 *
 * World size: 1000x900
 */

import LocalSceneBase from './LocalSceneBase.js';
import { saveGame } from '../systems/saveSystem.js';
import QUESTS from '../data/quests.js';
import { registerSceneHmr } from '../dev/phaserHmr.js';

export default class MountainScene extends LocalSceneBase {
  constructor() {
    super('MountainScene');
  }

  getWorldSize() {
    return { width: 1000, height: 900 };
  }

  createWorld() {
    const { width, height } = this.getWorldSize();

    // === GROUND (terrain zones, top to bottom) ===
    // Snow-capped peak (very top)
    this.add.rectangle(width / 2, 60, width, 120, 0xeceff1);
    // Rocky upper mountain
    this.add.rectangle(width / 2, 200, width, 160, 0x9e9e9e);
    // Mid-mountain (brown/grey rock)
    this.add.rectangle(width / 2, 380, width, 200, 0x8d6e63);
    // Foothills (green-brown transition)
    this.add.rectangle(width / 2, 560, width, 160, 0xa5956b);
    // Grassy base
    this.add.rectangle(width / 2, 740, width, 320, 0x7cb342);

    // Terrain blending
    const blendGfx = this.add.graphics();
    blendGfx.fillStyle(0xbcaaa4, 0.3);
    for (let x = 0; x < width; x += 40) {
      blendGfx.fillTriangle(x, 480, x + 40, 480, x + 20, 480 + 30 + Math.random() * 20);
    }
    blendGfx.fillStyle(0x8bc34a, 0.3);
    for (let x = 0; x < width; x += 50) {
      blendGfx.fillTriangle(x, 660, x + 50, 660, x + 25, 660 + 25 + Math.random() * 20);
    }

    // === CLIMB PATH (winding upward) ===
    const pathGfx = this.add.graphics();
    pathGfx.fillStyle(0xc9a85c, 0.7);
    // Lower path
    pathGfx.fillRoundedRect(350, 750, 300, 35, 8);
    // Switchback up
    pathGfx.fillRoundedRect(600, 600, 35, 180, 8);
    pathGfx.fillRoundedRect(350, 580, 280, 35, 8);
    pathGfx.fillRoundedRect(340, 430, 35, 180, 8);
    pathGfx.fillRoundedRect(340, 420, 250, 35, 8);
    pathGfx.fillRoundedRect(560, 300, 35, 150, 8);
    pathGfx.fillRoundedRect(400, 290, 190, 30, 8);
    // Upper path to peak
    pathGfx.fillRoundedRect(390, 160, 30, 150, 8);
    pathGfx.fillRoundedRect(390, 150, 200, 28, 8);

    // === BOUNDARY WALLS ===
    this.addWall(width / 2, 0, width, 20);       // top
    this.addWall(0, height / 2, 20, height);      // left
    this.addWall(width, height / 2, 20, height);  // right

    // === ROCKY CLIFFS (collision walls representing impassable rock) ===
    // Upper mountain barriers (force player to use switchback path)
    this.addVisibleWall(170, 250, 280, 30, 0x757575, 0x616161);
    this.addVisibleWall(750, 300, 300, 30, 0x757575, 0x616161);
    this.addVisibleWall(170, 420, 200, 25, 0x6d4c41, 0x5d4037);
    this.addVisibleWall(750, 480, 250, 25, 0x6d4c41, 0x5d4037);
    // Peak barriers
    this.addVisibleWall(250, 130, 180, 25, 0xbdbdbd, 0x9e9e9e);
    this.addVisibleWall(700, 170, 200, 25, 0xbdbdbd, 0x9e9e9e);

    // === BOULDERS ===
    const boulders = [
      [100, 350, 50], [850, 380, 45], [500, 500, 40],
      [200, 600, 35], [750, 650, 40], [900, 250, 35],
      [450, 200, 30], [650, 220, 30],
    ];
    for (const [bx, by, size] of boulders) {
      this.add.text(bx, by, '🪨', { fontSize: `${size}px` }).setOrigin(0.5).setDepth(3);
      this.addWall(bx, by, size * 0.7, size * 0.6);
    }

    // === TREES (foothills only) ===
    const trees = [
      [80, 700], [250, 750], [700, 780], [900, 720],
      [150, 820], [500, 850], [800, 840],
    ];
    for (const [tx, ty] of trees) {
      this.add.text(tx, ty, '🌲', { fontSize: '32px' }).setOrigin(0.5).setDepth(3);
      this.addWall(tx, ty, 18, 18);
    }

    // === SNOW (decorative, upper region) ===
    const snowGfx = this.add.graphics();
    snowGfx.fillStyle(0xffffff, 0.3);
    for (let i = 0; i < 15; i++) {
      snowGfx.fillCircle(100 + Math.random() * 800, 40 + Math.random() * 80, 5 + Math.random() * 10);
    }

    // === EAGLE (decorative, soaring) ===
    const eagle = this.add.text(500, 100, '🦅', { fontSize: '26px' }).setOrigin(0.5).setDepth(5);
    this.tweens.add({
      targets: eagle,
      x: 800, y: 80,
      duration: 6000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    // === MOUNTAIN GOAT (decorative) ===
    const goat = this.add.text(300, 350, '🐐', { fontSize: '22px' }).setOrigin(0.5).setDepth(4);
    this.tweens.add({
      targets: goat,
      x: 250, y: 330,
      duration: 3500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    // === INTERACTABLES ===

    // Cave entrance (upper mountain)
    this.addInteractable({
      x: 560, y: 170,
      label: 'Cave Entrance',
      icon: '🕳️',
      radius: 60,
      onInteract: () => {
        this.registry.set('dialogEvent', {
          speaker: 'Zuzu',
          text: "A massive cave carved into the mountainside... Strange echoes come from deep within.\n\nThis feels important. I should prepare before going in.\n\n(Mountain dungeon coming soon!)",
          choices: null, step: null,
        });
      },
    });

    // Rare minerals / copper ore
    this.addInteractable({
      x: 380, y: 350,
      label: 'Rare Minerals',
      icon: '💎',
      radius: 55,
      onInteract: () => {
        const state = this.registry.get('gameState');
        const step = state?.activeQuest?.id === 'bridge_collapse'
          ? this._getQuestStep(state, 'forage')
          : null;

        if (step?.requiredItem === 'copper_ore_sample' && !(state.inventory || []).includes('copper_ore_sample')) {
          const updated = { ...state, inventory: [...state.inventory, 'copper_ore_sample'] };
          this.registry.set('gameState', updated);
          saveGame(updated);
          const audioMgr = this.registry.get('audioManager');
          audioMgr?.playSfx('item_pickup');
          this.registry.set('dialogEvent', {
            speaker: 'Zuzu',
            text: "Copper ore! The greenish-brown vein is unmistakable.\n\n🟤 Got: Copper Ore Sample\n\nCopper is Arizona's signature metal — high conductivity, soft enough to shape.",
            choices: null, step: null,
          });
          return;
        }

        this.registry.set('dialogEvent', {
          speaker: 'Zuzu',
          text: "Whoa, there are crystals and copper veins embedded in this rock face! They shimmer purple and blue.\n\nThese could be really valuable for upgrades!",
          choices: null, step: null,
        });
      },
    });

    // Summit viewpoint
    this.addInteractable({
      x: 500, y: 55,
      label: 'Summit View',
      icon: '🔭',
      radius: 55,
      onInteract: () => {
        this.registry.set('dialogEvent', {
          speaker: 'Zuzu',
          text: "I can see the whole world from up here! The town, the lake, the desert trail...\n\nAll that climbing was worth it. What an amazing view!",
          choices: null, step: null,
        });
      },
    });

    // Mountain spring
    this.addInteractable({
      x: 650, y: 550,
      label: 'Mountain Spring',
      icon: '💧',
      radius: 50,
      onInteract: () => {
        this.registry.set('dialogEvent', {
          speaker: 'Zuzu',
          text: "A fresh mountain spring! The water is ice cold and crystal clear.\n\nNature's water fountain, straight from the mountain.",
          choices: null, step: null,
        });
      },
    });

    // === SCENE TITLE ===
    this.add.text(width / 2, 30, '🏔️ Mountain Trail', {
      fontSize: '20px', fontFamily: 'sans-serif', color: '#37474f',
      fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5);

    // === EXIT (south → overworld) ===
    this.addExit({
      x: width / 2, y: height - 14,
      width: 160, height: 28,
      targetScene: 'OverworldScene',
      targetSpawn: 'fromMountain',
      label: '🗺️ Descend ⬇',
    });
  }

  _getQuestStep(state, stepType) {
    if (!state?.activeQuest) return null;
    const quest = QUESTS[state.activeQuest.id];
    if (!quest) return null;
    const step = quest.steps[state.activeQuest.stepIndex];
    if (step?.type === stepType) return step;
    return null;
  }
}

// ── HMR ──────────────────────────────────────────────────────────────
registerSceneHmr('MountainScene', import.meta.hot, MountainScene);
