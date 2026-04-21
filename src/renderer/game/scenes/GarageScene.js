/**
 * GarageScene — Zuzu's home garage (Arizona desert home style).
 *
 * CUSTOM GAME LOGIC ONLY.
 *
 * Layout and static composition are defined in editor-scenes/GarageSceneBase.js
 * (the editor-owned boundary). This file extends it with:
 *   - Player spawning
 *   - Physics overlaps (exit zone)
 *   - Scene transitions
 *   - Onboarding dialog
 *   - State-dependent upgrades (tool rack, work light, repair stand)
 *   - Save system integration
 *   - Audio transitions
 *   - Action key input
 *
 * When Phaser Editor regenerates the base class, this file is untouched.
 */

import Phaser from 'phaser';
import GarageSceneBase from '../editor-scenes/GarageSceneBase.js';
import Player from '../entities/Player.js';
import { saveGame } from '../systems/saveSystem.js';
import { getSafeZone } from '../ui/safeZones.js';
import { SPAWNS } from '../data/neighborhoodLayout.js';

const SCENE_KEY = 'GarageScene';
const EXIT_ZONE_HEIGHT = 48;

export default class GarageScene extends GarageSceneBase {
  // Note: constructor is inherited from GarageSceneBase (key: 'GarageScene')

  create() {
    this._transitioning = false;
    const { width, height } = this.scale;
    const state = this.registry.get('gameState');
    const safe = getSafeZone(width, height);
    const { playArea } = safe;

    // --- Editor-generated layout ---
    this.editorCreate(width, height, safe);

    // --- State-dependent upgrades (code-owned: depends on game state) ---
    this._createUpgrades(state, width, playArea);

    // --- Exit zone physics ---
    this.physics.add.existing(this.exitZone, true);

    // --- Player ---
    const spawnX = state?.player?.scene === SCENE_KEY ? state.player.x : playArea.centerX;
    const spawnY = state?.player?.scene === SCENE_KEY ? state.player.y : playArea.centerY;
    this.player = new Player(this, spawnX, spawnY);

    // --- Collisions ---
    this.physics.add.overlap(this.player.sprite, this.exitZone, () => {
      this._goToNeighborhood();
    });

    // --- Action key ---
    this.actionKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // --- Audio ---
    const audioMgr = this.registry.get('audioManager');
    if (audioMgr) audioMgr.transitionToScene(SCENE_KEY);

    // --- Fade in ---
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // --- Onboarding (first time) ---
    if (!state.hasSeenOnboarding) {
      this.time.delayedCall(600, () => {
        this.registry.set('dialogEvent', {
          speaker: 'Zuzu',
          text: "Welcome to my garage! \uD83C\uDFE0\n\nI'm Zuzu, and I love fixing bikes!\n\nLook around \u2014 there's my workbench, my toolkit, and my bike on the rack.\n\nHead outside through the door at the bottom to explore the neighborhood. Maybe someone needs help!",
          choices: null,
          step: null,
        });
        const s = this.registry.get('gameState');
        const updated = { ...s, hasSeenOnboarding: true };
        this.registry.set('gameState', updated);
        saveGame(updated);
      });
    }
  }

  /** Create upgrade visuals based on current game state. */
  _createUpgrades(state, width, playArea) {
    const upgrades = new Set(state?.upgrades || []);

    if (upgrades.has('tool_rack')) {
      this.add.rectangle(width - 58, playArea.centerY - 20, 28, 70, 0x6b5430).setStrokeStyle(2, 0x4a3520);
      this.add.text(width - 58, playArea.centerY - 40, '\uD83D\uDDC4\uFE0F', { fontSize: '18px' }).setOrigin(0.5);
      this.add.text(width - 58, playArea.centerY - 20, '\uD83D\uDD27\uD83E\uDE9B', { fontSize: '11px' }).setOrigin(0.5);
      this.add.text(width - 58, playArea.centerY + 5, 'Tool Rack', {
        fontSize: '9px', fontFamily: 'sans-serif', color: '#5a3e28', fontStyle: 'bold',
      }).setOrigin(0.5);
    }
    if (upgrades.has('work_light')) {
      this.add.text(this.workbenchX + 55, this.workbenchY - 25, '\uD83D\uDCA1', { fontSize: '18px' }).setOrigin(0.5);
      const glowGfx = this.add.graphics();
      glowGfx.fillStyle(0xfef3c7, 0.12);
      glowGfx.fillCircle(this.workbenchX, this.workbenchY, 50);
    }
    if (upgrades.has('repair_stand')) {
      const rsX = playArea.centerX - 50, rsY = playArea.centerY + 10;
      this.add.rectangle(rsX, rsY, 7, 45, 0x6b7280);
      this.add.rectangle(rsX, rsY - 22, 28, 5, 0x6b7280);
      this.add.text(rsX, rsY + 28, 'Repair Stand', {
        fontSize: '9px', fontFamily: 'sans-serif', color: '#4b5563', fontStyle: 'bold',
      }).setOrigin(0.5);
    }
  }

  update() {
    if (!this.player) return;
    const pos = this.player.update();
    if (this.game.getFrame() % 120 === 0) this._savePosition(pos);
  }

  _savePosition(pos) {
    const state = this.registry.get('gameState');
    if (!state) return;
    const updated = {
      ...state,
      player: { x: Math.round(pos.x), y: Math.round(pos.y), scene: SCENE_KEY },
    };
    this.registry.set('gameState', updated);
    saveGame(updated);
  }

  _goToNeighborhood() {
    if (this._transitioning) return;
    this._transitioning = true;
    const audioMgr = this.registry.get('audioManager');
    audioMgr?.playSfx('door_interact');
    const state = this.registry.get('gameState');
    const updated = { ...state, player: { x: SPAWNS.fromGarage.x, y: SPAWNS.fromGarage.y, scene: 'NeighborhoodScene' } };
    this.registry.set('gameState', updated);
    saveGame(updated);
    this.cameras.main.fadeOut(300, 0, 0, 0, (_cam, progress) => {
      if (progress >= 1) this.scene.start('NeighborhoodScene');
    });
  }
}
