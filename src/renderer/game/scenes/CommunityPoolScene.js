/**
 * CommunityPoolScene — fenced community pool with deck and amenities.
 *
 * Local playable scene with:
 *   - Pool in center (water collision, blue rectangle)
 *   - Pool deck (lighter concrete) around it
 *   - Lounge chairs, lifeguard chair, slide
 *   - Pool rules sign interactable, diving board interactable (future)
 *   - Fence around perimeter
 *   - Exit south to overworld
 *
 * World size: 800x600
 */

import LocalSceneBase from './LocalSceneBase.js';
import { registerSceneHmr } from '../dev/phaserHmr.js';

export default class CommunityPoolScene extends LocalSceneBase {
  constructor() {
    super('CommunityPoolScene');
  }

  getWorldSize() {
    return { width: 800, height: 600 };
  }

  createWorld() {
    const { width, height } = this.getWorldSize();

    // === GROUND ===
    // Concrete deck (full background)
    this.add.rectangle(width / 2, height / 2, width, height, 0xd6d2c4);

    // Grass border outside the fence
    const grassGfx = this.add.graphics();
    grassGfx.fillStyle(0x7cb342, 1);
    grassGfx.fillRect(0, 0, width, 25);
    grassGfx.fillRect(0, height - 25, width, 25);
    grassGfx.fillRect(0, 0, 25, height);
    grassGfx.fillRect(width - 25, 0, 25, height);

    // Pool deck (lighter area around pool)
    this.add.rectangle(width / 2, height / 2 - 10, 500, 280, 0xe8e0d0);

    // === POOL (water collision) ===
    const poolX = width / 2, poolY = height / 2 - 10;
    const poolW = 340, poolH = 180;
    // Pool water
    this.add.rectangle(poolX, poolY, poolW, poolH, 0x42a5f5);
    // Pool border
    const poolGfx = this.add.graphics();
    poolGfx.lineStyle(4, 0x90caf9, 1);
    poolGfx.strokeRect(poolX - poolW / 2, poolY - poolH / 2, poolW, poolH);
    // Lane lines
    poolGfx.lineStyle(1, 0xbbdefb, 0.5);
    for (let ly = poolY - poolH / 2 + 36; ly < poolY + poolH / 2; ly += 36) {
      poolGfx.strokeRect(poolX - poolW / 2 + 10, ly, poolW - 20, 0);
    }
    // Pool water collision
    this.addWall(poolX, poolY, poolW - 10, poolH - 10);

    // === FENCE (perimeter) ===
    const fenceColor = 0x9e9e9e;
    // Top
    this.addVisibleWall(width / 2, 35, width - 60, 8, fenceColor, 0x757575);
    // Left
    this.addVisibleWall(35, height / 2, 8, height - 60, fenceColor, 0x757575);
    // Right
    this.addVisibleWall(width - 35, height / 2, 8, height - 60, fenceColor, 0x757575);
    // Bottom (gap for entrance)
    this.addVisibleWall(180, height - 35, 300, 8, fenceColor, 0x757575);
    this.addVisibleWall(620, height - 35, 300, 8, fenceColor, 0x757575);

    // Fence posts
    for (let x = 50; x < width; x += 60) {
      this.add.rectangle(x, 35, 4, 12, 0x757575).setDepth(1);
      if (x < 330 || x > 470) {
        this.add.rectangle(x, height - 35, 4, 12, 0x757575).setDepth(1);
      }
    }

    // === LOUNGE CHAIRS ===
    const loungeSpots = [[140, 180], [140, 260], [140, 340], [660, 180], [660, 260], [660, 340]];
    for (const [lx, ly] of loungeSpots) {
      this.add.rectangle(lx, ly, 36, 14, 0xf5f5f5).setStrokeStyle(1, 0xbdbdbd).setDepth(1);
      this.addWall(lx, ly, 36, 14);
    }

    // === LIFEGUARD CHAIR (east side) ===
    this.add.rectangle(720, 160, 24, 30, 0xffa726).setStrokeStyle(2, 0xf57c00).setDepth(2);
    this.add.text(720, 150, '🏖️', { fontSize: '18px' }).setOrigin(0.5).setDepth(3);
    this.addWall(720, 160, 24, 30);

    // === SLIDE (north side of pool) ===
    this.add.rectangle(poolX + 100, poolY - poolH / 2 - 20, 30, 30, 0x42a5f5).setStrokeStyle(2, 0x1e88e5).setDepth(2);
    this.add.text(poolX + 100, poolY - poolH / 2 - 20, '🛝', { fontSize: '22px' }).setOrigin(0.5).setDepth(3);
    this.addWall(poolX + 100, poolY - poolH / 2 - 20, 30, 30);

    // === UMBRELLA (decorative) ===
    this.add.text(140, 140, '⛱️', { fontSize: '28px' }).setOrigin(0.5).setDepth(3);
    this.add.text(660, 140, '⛱️', { fontSize: '28px' }).setOrigin(0.5).setDepth(3);

    // === INTERACTABLES ===

    // Pool rules sign
    this.addInteractable({
      x: 100, y: 80,
      label: 'Pool Rules',
      icon: '📋',
      radius: 55,
      onInteract: () => {
        this.registry.set('dialogEvent', {
          speaker: 'Zuzu',
          text: "POOL RULES:\n1. No running on deck\n2. No diving in shallow end\n3. Shower before entering\n4. Have fun!\n\nSeems fair to me!",
          choices: null, step: null,
        });
      },
    });

    // Diving board
    this.addInteractable({
      x: poolX - 100, y: poolY - poolH / 2 - 15,
      label: 'Diving Board',
      icon: '🤿',
      radius: 55,
      onInteract: () => {
        this.registry.set('dialogEvent', {
          speaker: 'Zuzu',
          text: "The diving board bounces when I step on it. Looks like it goes over the deep end!\n\n(Diving mini-game coming soon!)",
          choices: null, step: null,
        });
      },
    });

    // Towel rack
    this.addInteractable({
      x: 700, y: 420,
      label: 'Towel Rack',
      icon: '🧴',
      radius: 50,
      onInteract: () => {
        this.registry.set('dialogEvent', {
          speaker: 'Zuzu',
          text: "Sunscreen and towels! Always important to protect your skin. SPF 50 or bust!",
          choices: null, step: null,
        });
      },
    });

    // === SCENE TITLE ===
    this.add.text(width / 2, 55, '🏊 Community Pool', {
      fontSize: '20px', fontFamily: 'sans-serif', color: '#0d47a1',
      fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5);

    // === EXIT (south gate → overworld) ===
    this.addExit({
      x: width / 2, y: height - 14,
      width: 140, height: 28,
      targetScene: 'OverworldScene',
      targetSpawn: 'fromCommunityPool',
      label: '🗺️ Leave Pool ⬇',
    });
  }
}

// ── HMR ──────────────────────────────────────────────────────────────
registerSceneHmr('CommunityPoolScene', import.meta.hot, CommunityPoolScene);
