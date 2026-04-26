/**
 * SportsFieldsScene — open athletic fields with soccer and basketball areas.
 *
 * Local playable scene with:
 *   - Soccer field with markings (center area)
 *   - Basketball court (east side)
 *   - Bleachers (collision), goals, benches
 *   - Race challenge interactable (future), ball interactable
 *   - Exit south to overworld
 *
 * World size: 1000x700
 */

import LocalSceneBase from './LocalSceneBase.js';
import { registerSceneHmr } from '../dev/phaserHmr.js';

export default class SportsFieldsScene extends LocalSceneBase {
  constructor() {
    super('SportsFieldsScene');
  }

  getWorldSize() {
    return { width: 1000, height: 700 };
  }

  createWorld() {
    const { width, height } = this.getWorldSize();

    // === GROUND ===
    // Main grass
    this.add.rectangle(width / 2, height / 2, width, height, 0x66bb6a);

    // === SOCCER FIELD (left-center) ===
    const sfx = 280, sfy = 200, sfw = 380, sfh = 280;
    // Field background (darker grass)
    this.add.rectangle(sfx + sfw / 2, sfy + sfh / 2, sfw, sfh, 0x4caf50);

    const fieldGfx = this.add.graphics();
    fieldGfx.lineStyle(2, 0xffffff, 0.9);
    // Outer boundary
    fieldGfx.strokeRect(sfx, sfy, sfw, sfh);
    // Center line
    fieldGfx.strokeRect(sfx + sfw / 2 - 1, sfy, 2, sfh);
    // Center circle
    fieldGfx.strokeCircle(sfx + sfw / 2, sfy + sfh / 2, 45);
    // Center dot
    fieldGfx.fillStyle(0xffffff, 1);
    fieldGfx.fillCircle(sfx + sfw / 2, sfy + sfh / 2, 4);
    // Penalty areas
    fieldGfx.strokeRect(sfx, sfy + sfh / 2 - 50, 60, 100);
    fieldGfx.strokeRect(sfx + sfw - 60, sfy + sfh / 2 - 50, 60, 100);

    // Goals
    this.add.rectangle(sfx - 5, sfy + sfh / 2, 10, 60, 0xffffff).setStrokeStyle(2, 0xbdbdbd);
    this.add.rectangle(sfx + sfw + 5, sfy + sfh / 2, 10, 60, 0xffffff).setStrokeStyle(2, 0xbdbdbd);

    // === BASKETBALL COURT (east side) ===
    const bcx = 720, bcy = 220, bcw = 200, bch = 260;
    // Court surface (hardcourt)
    this.add.rectangle(bcx + bcw / 2, bcy + bch / 2, bcw, bch, 0xd4955a);

    const courtGfx = this.add.graphics();
    courtGfx.lineStyle(2, 0xffffff, 0.8);
    courtGfx.strokeRect(bcx, bcy, bcw, bch);
    // Center circle
    courtGfx.strokeCircle(bcx + bcw / 2, bcy + bch / 2, 35);
    // Center line
    courtGfx.strokeRect(bcx, bcy + bch / 2 - 1, bcw, 2);
    // Hoops (top and bottom)
    this.add.text(bcx + bcw / 2, bcy + 15, '🏀', { fontSize: '20px' }).setOrigin(0.5).setDepth(3);
    this.add.text(bcx + bcw / 2, bcy + bch - 15, '🏀', { fontSize: '20px' }).setOrigin(0.5).setDepth(3);
    // Backboards
    this.addVisibleWall(bcx + bcw / 2, bcy + 5, 40, 6, 0x616161, 0x424242);
    this.addVisibleWall(bcx + bcw / 2, bcy + bch - 5, 40, 6, 0x616161, 0x424242);

    // === BLEACHERS (collision) ===
    const bleacherColor = 0x78909c;
    // North bleachers
    this.addVisibleWall(300, 120, 250, 40, bleacherColor, 0x546e7a);
    this.add.text(300, 120, '🪑🪑🪑🪑🪑', { fontSize: '14px' }).setOrigin(0.5).setDepth(2);
    // East bleachers
    this.addVisibleWall(950, 350, 40, 200, bleacherColor, 0x546e7a);

    // === BENCHES ===
    const benchSpots = [[100, 340], [100, 460], [580, 550]];
    for (const [bx, by] of benchSpots) {
      this.add.rectangle(bx, by, 50, 18, 0x8d6e63).setStrokeStyle(1, 0x6d4c41).setDepth(1);
      this.addWall(bx, by, 50, 18);
    }

    // === TREES (decorative) ===
    const trees = [[50, 80], [50, 600], [500, 80], [950, 80], [950, 600]];
    for (const [tx, ty] of trees) {
      this.add.text(tx, ty, '🌳', { fontSize: '30px' }).setOrigin(0.5).setDepth(3);
      this.addWall(tx, ty, 20, 20);
    }

    // === BOUNDARY WALLS ===
    this.addWall(width / 2, 0, width, 20);
    this.addWall(0, height / 2, 20, height);
    this.addWall(width, height / 2, 20, height);

    // === INTERACTABLES ===

    // Soccer ball
    this.addInteractable({
      x: 470, y: 340,
      label: 'Soccer Ball',
      icon: '⚽',
      radius: 55,
      onInteract: () => {
        this.registry.set('dialogEvent', {
          speaker: 'Zuzu',
          text: "A soccer ball just sitting in the field! I could practice my dribbling.\n\nMaybe I should challenge someone to a match sometime.",
          choices: null, step: null,
        });
      },
    });

    // Race starting line
    this.addInteractable({
      x: 300, y: 560,
      label: 'Race Track Start',
      icon: '🏁',
      radius: 55,
      onInteract: () => {
        this.registry.set('dialogEvent', {
          speaker: 'Zuzu',
          text: "A starting line painted on the grass. Looks like someone set up a sprint track!\n\n(Race challenge coming soon!)",
          choices: null, step: null,
        });
      },
    });

    // Water fountain
    this.addInteractable({
      x: 580, y: 160,
      label: 'Water Fountain',
      icon: '🚰',
      radius: 50,
      onInteract: () => {
        this.registry.set('dialogEvent', {
          speaker: 'Zuzu',
          text: "A refreshing water fountain. Nothing beats cold water after running around!\n\nStay hydrated, everyone.",
          choices: null, step: null,
        });
      },
    });

    // === SCENE TITLE ===
    this.add.text(width / 2, 50, '🏟️ Sports Fields', {
      fontSize: '20px', fontFamily: 'sans-serif', color: '#1b5e20',
      fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5);

    // === EXIT (south → overworld) ===
    this.addExit({
      x: width / 2, y: height - 14,
      width: 160, height: 28,
      targetScene: 'OverworldScene',
      targetSpawn: 'fromSportsFields',
      label: '🗺️ Leave Fields ⬇',
    });
  }
}

// ── HMR ──────────────────────────────────────────────────────────────
registerSceneHmr('SportsFieldsScene', import.meta.hot, SportsFieldsScene);
