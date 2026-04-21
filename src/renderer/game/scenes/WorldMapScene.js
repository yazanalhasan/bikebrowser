/**
 * WorldMapScene — Quest for Glory-style navigable world map.
 *
 * Shows regions as clusters of location nodes. Player selects a location
 * and travels to the corresponding sub-scene.
 *
 * Access: via "Bike GPS" interactable in StreetBlockScene or OverworldScene.
 * Return: sub-scenes exit back here, or directly to the neighborhood.
 *
 * This is a UI-driven map, not a free-roaming overworld.
 */

import Phaser from 'phaser';
import { saveGame } from '../systems/saveSystem.js';
import { WORLD_LOCATIONS, REGIONS, isLocationUnlocked, getLocationsByRegion } from '../data/worldMapData.js';
import { getSideQuestStatus } from '../systems/sideQuestSystem.js';
import { setBusy } from '../systems/gameplayArbiter.js';

const SCENE_KEY = 'WorldMapScene';

export default class WorldMapScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEY });
  }

  init(data) {
    this._origin = data?.origin || 'OverworldScene';
    this._originSpawn = data?.originSpawn || 'default';
  }

  create() {
    const state = this.registry.get('gameState');
    const { width, height } = this.cameras.main;

    // Suppress global education questions while on world map
    setBusy('inMenu', true);

    // ── Background ──
    this.add.rectangle(width / 2, height / 2, width, height, 0x2d1b0e);

    // Parchment/map overlay
    const mapW = width * 0.88;
    const mapH = height * 0.82;
    const mapX = width / 2;
    const mapY = height / 2 + 10;
    this.add.rectangle(mapX, mapY, mapW, mapH, 0xf5e6c8).setStrokeStyle(3, 0x8b6914);

    // Title
    this.add.text(width / 2, 30, '🗺️  WORLD MAP  🗺️', {
      fontSize: '22px', fontFamily: 'sans-serif', fontStyle: 'bold',
      color: '#5c3d10', stroke: '#f5e6c8', strokeThickness: 3,
    }).setOrigin(0.5);

    // ── Subtitle with region ──
    this.add.text(width / 2, 55, 'Tap a location to travel there', {
      fontSize: '12px', fontFamily: 'sans-serif', color: '#8b6914',
    }).setOrigin(0.5);

    // ── Location Markers ──
    this._markers = [];
    const locations = Object.values(WORLD_LOCATIONS);
    const padX = width * 0.1;
    const padY = height * 0.15;
    const usableW = width - padX * 2;
    const usableH = height - padY * 2 - 20;

    for (const loc of locations) {
      const unlocked = isLocationUnlocked(loc.id, state);
      const x = padX + loc.mapPos.x * usableW;
      const y = padY + loc.mapPos.y * usableH + 20;

      // Connection lines to neighborhood center
      const centerX = padX + 0.15 * usableW;
      const centerY = padY + 0.2 * usableH + 20;
      const line = this.add.graphics();
      line.lineStyle(2, unlocked ? 0x8b6914 : 0x999999, unlocked ? 0.5 : 0.2);
      line.lineBetween(centerX, centerY, x, y);

      // Node circle
      const color = unlocked ? this._getTypeColor(loc.type) : 0x666666;
      const circle = this.add.circle(x, y, 22, color, unlocked ? 1 : 0.4);
      circle.setStrokeStyle(3, unlocked ? 0xffffff : 0x888888);
      circle.setInteractive({ useHandCursor: unlocked });

      // Icon
      const icon = this.add.text(x, y, unlocked ? loc.icon : '🔒', {
        fontSize: '20px',
      }).setOrigin(0.5);

      // Name label
      const nameLabel = this.add.text(x, y + 32, loc.name, {
        fontSize: '11px', fontFamily: 'sans-serif', fontStyle: 'bold',
        color: unlocked ? '#3b1e08' : '#888888',
        stroke: '#f5e6c8', strokeThickness: 2,
        align: 'center', wordWrap: { width: 120 },
      }).setOrigin(0.5, 0);

      // Difficulty stars
      if (unlocked) {
        const stars = '⭐'.repeat(loc.difficulty);
        this.add.text(x, y + 48, stars, { fontSize: '10px' }).setOrigin(0.5);
      }

      // Side quest indicators
      if (unlocked) {
        const quests = getSideQuestStatus(loc.id, state);
        const available = quests.filter(q => !q.completed).length;
        const completed = quests.filter(q => q.completed).length;
        if (available > 0) {
          this.add.text(x + 20, y - 20, `📋${available}`, {
            fontSize: '10px', fontFamily: 'sans-serif', color: '#2563eb',
            backgroundColor: '#dbeafe', padding: { x: 2, y: 1 },
          }).setOrigin(0.5);
        }
        if (completed > 0) {
          this.add.text(x - 20, y - 20, `✅${completed}`, {
            fontSize: '10px', fontFamily: 'sans-serif', color: '#16a34a',
          }).setOrigin(0.5);
        }
      }

      // Click handler
      if (unlocked) {
        circle.on('pointerdown', () => this._selectLocation(loc));

        // Hover pulse
        circle.on('pointerover', () => {
          this.tweens.add({ targets: circle, scale: 1.2, duration: 150, ease: 'Back.easeOut' });
        });
        circle.on('pointerout', () => {
          this.tweens.add({ targets: circle, scale: 1, duration: 150 });
        });
      } else {
        // Show unlock hint on tap
        circle.setInteractive({ useHandCursor: false });
        circle.on('pointerdown', () => this._showLockHint(loc, state));
      }

      this._markers.push({ loc, circle, icon, nameLabel });
    }

    // ── Neighborhood marker (home base) ──
    const homeX = padX + 0.15 * usableW;
    const homeY = padY + 0.2 * usableH + 20;
    this.add.circle(homeX, homeY, 18, 0x22c55e).setStrokeStyle(3, 0xffffff);
    this.add.text(homeX, homeY, '🏠', { fontSize: '18px' }).setOrigin(0.5);
    this.add.text(homeX, homeY + 28, 'Neighborhood', {
      fontSize: '11px', fontFamily: 'sans-serif', fontStyle: 'bold',
      color: '#166534', stroke: '#f5e6c8', strokeThickness: 2,
    }).setOrigin(0.5, 0);

    // ── Back button ──
    const backBtn = this.add.text(60, height - 35, '← Back to Neighborhood', {
      fontSize: '14px', fontFamily: 'sans-serif', fontStyle: 'bold',
      color: '#ffffff', backgroundColor: '#475569', padding: { x: 10, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => this._returnToNeighborhood());
    backBtn.on('pointerover', () => backBtn.setBackgroundColor('#334155'));
    backBtn.on('pointerout', () => backBtn.setBackgroundColor('#475569'));

    // ── Legend ──
    const legendY = height - 35;
    const legendX = width - 140;
    this.add.text(legendX, legendY, '🟢 Resource  🔵 Material  🟤 Biology', {
      fontSize: '9px', fontFamily: 'sans-serif', color: '#8b6914',
    }).setOrigin(0.5);

    // Fade in
    this.cameras.main.fadeIn(350, 0, 0, 0);

    // Audio
    const audioMgr = this.registry.get('audioManager');
    audioMgr?.playMusic('desert_discovery');
  }

  // ── Travel to location ──────────────────────────────────────────────────

  _selectLocation(loc) {
    // Check if scene class is registered
    const sceneExists = this.scene.manager.keys[loc.entryScene];
    if (!sceneExists) {
      this.registry.set('dialogEvent', {
        speaker: 'Zuzu',
        text: `${loc.name} is still being explored... Coming soon!`,
        choices: null, step: null,
      });
      return;
    }

    const state = this.registry.get('gameState');
    const updated = {
      ...state,
      player: { x: 400, y: 400, scene: loc.entryScene },
      worldMap: {
        ...(state.worldMap || {}),
        lastVisited: loc.id,
        visitCount: ((state.worldMap?.visitCount || {})[loc.id] || 0) + 1,
      },
    };
    this.registry.set('gameState', updated);
    saveGame(updated);

    // Play travel SFX
    const audioMgr = this.registry.get('audioManager');
    audioMgr?.playSfx('door_interact');

    // Fade out and transition
    this.cameras.main.fadeOut(400, 0, 0, 0, (_cam, progress) => {
      if (progress >= 1) {
        setBusy('inMenu', false);
        this.scene.start(loc.entryScene, {
          origin: SCENE_KEY,
          originSpawn: 'default',
          locationId: loc.id,
        });
      }
    });
  }

  _returnToNeighborhood() {
    const state = this.registry.get('gameState');
    const updated = {
      ...state,
      player: { x: 400, y: 300, scene: this._origin },
    };
    this.registry.set('gameState', updated);
    saveGame(updated);

    setBusy('inMenu', false);

    this.cameras.main.fadeOut(350, 0, 0, 0, (_cam, progress) => {
      if (progress >= 1) {
        this.scene.start(this._origin);
      }
    });
  }

  _showLockHint(loc, state) {
    const req = loc.unlockReq || {};
    const hints = [];
    if (req.reputation) hints.push(`Need ${req.reputation} reputation (you have ${state?.reputation || 0})`);
    if (req.questsAny) hints.push(`Complete a quest: ${req.questsAny.join(' or ')}`);
    this.registry.set('dialogEvent', {
      speaker: 'System',
      text: `${loc.name} is locked. ${hints.join('. ') || 'Keep exploring!'}`,
      choices: null, step: null,
    });
  }

  _getTypeColor(type) {
    switch (type) {
      case 'resource': return 0x22c55e;
      case 'material': return 0x3b82f6;
      case 'biology': return 0x92400e;
      case 'exploration': return 0xf59e0b;
      default: return 0x6b7280;
    }
  }
}
