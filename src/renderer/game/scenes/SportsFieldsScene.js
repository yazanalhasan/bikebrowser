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
import { startInteraction } from '../systems/interactionManager.js';
import { registerSceneHmr } from '../dev/phaserHmr.js';
import { loadLayout } from '../utils/loadLayout.js';
import { ART } from '../../../game/assets/act1ArtRegistry.js';
import { groundDepth } from '../../../game/assets/act1Art.js';

export default class SportsFieldsScene extends LocalSceneBase {
  static layoutEditorConfig = {
    layoutAssetKey: 'sportsFieldsLayout',
    layoutPath: 'layouts/sports-fields.layout.json',
  };

  constructor() {
    super('SportsFieldsScene');
  }

  getWorldSize() {
    return { width: 1000, height: 700 };
  }

  preload() {
    super.preload?.();
    this.load.json('sportsFieldsLayout', 'layouts/sports-fields.layout.json');
  }

  createWorld() {
    this.layout = loadLayout(this, 'sportsFieldsLayout');

    // === GROUND ===
    // Mown-grass texture over the whole park.
    {
      const o = this.layout.ground;
      this.addGroundTexture(ART.sportsfields_grass, o.x - o.w / 2, o.y - o.h / 2, o.w, o.h);
    }

    // === SOCCER FIELD (left-center) ===
    const sfx = this.layout.soccer_field.x, sfy = this.layout.soccer_field.y, sfw = this.layout.soccer_field.w, sfh = this.layout.soccer_field.h;
    // Field background (darker grass)
    {
      const o = this.layout.soccer_field_bg;
      this.addGroundTexture(ART.sportsfields_grass, o.x - o.w / 2, o.y - o.h / 2, o.w, o.h, { depth: 1 })
        ?.setTint(0xd8f0d8);
    }

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
    this.add.rectangle(this.layout.goal_left.x, this.layout.goal_left.y, this.layout.goal_left.w, this.layout.goal_left.h, 0xffffff).setStrokeStyle(2, 0xbdbdbd);
    this.add.rectangle(this.layout.goal_right.x, this.layout.goal_right.y, this.layout.goal_right.w, this.layout.goal_right.h, 0xffffff).setStrokeStyle(2, 0xbdbdbd);

    // === BASKETBALL COURT (east side) ===
    const bcx = this.layout.basketball_court.x, bcy = this.layout.basketball_court.y, bcw = this.layout.basketball_court.w, bch = this.layout.basketball_court.h;
    // Court surface (hardcourt)
    {
      const o = this.layout.basketball_court_bg;
      this.addGroundTexture(ART.sportsfields_court, o.x - o.w / 2, o.y - o.h / 2, o.w, o.h, { depth: 1 });
    }

    const courtGfx = this.add.graphics();
    courtGfx.lineStyle(2, 0xffffff, 0.8);
    courtGfx.strokeRect(bcx, bcy, bcw, bch);
    // Center circle
    courtGfx.strokeCircle(bcx + bcw / 2, bcy + bch / 2, 35);
    // Center line
    courtGfx.strokeRect(bcx, bcy + bch / 2 - 1, bcw, 2);
    // Hoops (top and bottom)
    this.addProp(ART.hoop, this.layout.hoop_top.x, this.layout.hoop_top.y + 36, { maxPx: 76, depth: 3 });
    this.addProp(ART.hoop, this.layout.hoop_bottom.x, this.layout.hoop_bottom.y + 36, { maxPx: 76, depth: 3 });
    // Backboards
    this.addVisibleWall(this.layout.backboard_top.x, this.layout.backboard_top.y, this.layout.backboard_top.w, this.layout.backboard_top.h, 0x616161, 0x424242);
    this.addVisibleWall(this.layout.backboard_bottom.x, this.layout.backboard_bottom.y, this.layout.backboard_bottom.w, this.layout.backboard_bottom.h, 0x616161, 0x424242);

    // === BLEACHERS (collision) ===
    const bleacherColor = 0x78909c;
    // North bleachers
    this.addVisibleWall(this.layout.bleachers_north.x, this.layout.bleachers_north.y, this.layout.bleachers_north.w, this.layout.bleachers_north.h, bleacherColor, 0x546e7a);
    this.addProp(ART.bleachers, this.layout.bleachers_north.x, this.layout.bleachers_north.y + 22, { depth: 2 });
    // East bleachers
    this.addVisibleWall(this.layout.bleachers_east.x, this.layout.bleachers_east.y, this.layout.bleachers_east.w, this.layout.bleachers_east.h, bleacherColor, 0x546e7a);

    // === BENCHES ===
    for (const [bx, by] of this.layout.bench_spots.map(s => [s.x, s.y])) {
      this.add.rectangle(bx, by, 50, 18, 0x8d6e63).setStrokeStyle(1, 0x6d4c41).setDepth(1);
      this.addWall(bx, by, 50, 18);
    }

    // === TREES (decorative) ===
    for (const [tx, ty] of this.layout.trees.map(s => [s.x, s.y])) {
      this.addProp(ART.shade_tree, tx, ty + 20, { maxPx: 92, depth: groundDepth(ty) });
      this.addWall(tx, ty, 20, 20);
    }

    // === BOUNDARY WALLS ===
    this.addWall(this.layout.wall_north.x, this.layout.wall_north.y, this.layout.wall_north.w, this.layout.wall_north.h);
    this.addWall(this.layout.wall_west.x, this.layout.wall_west.y, this.layout.wall_west.w, this.layout.wall_west.h);
    this.addWall(this.layout.wall_east.x, this.layout.wall_east.y, this.layout.wall_east.w, this.layout.wall_east.h);

    // === INTERACTABLES ===

    // Soccer ball
    this.addInteractable({
      x: this.layout.interact_soccer_ball.x, y: this.layout.interact_soccer_ball.y,
      label: 'Soccer Ball',
      icon: ART.soccer_ball,
      radius: this.layout.interact_soccer_ball.radius,
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
      x: this.layout.interact_race_start.x, y: this.layout.interact_race_start.y,
      label: 'Race Track Start',
      icon: ART.race_start,
      radius: this.layout.interact_race_start.radius,
      onInteract: () => {
        startInteraction(this, { type: 'race', title: 'Starting line' });
      },
    });

    // Water fountain
    this.addInteractable({
      x: this.layout.interact_water_fountain.x, y: this.layout.interact_water_fountain.y,
      label: 'Water Fountain',
      icon: ART.fountain,
      radius: this.layout.interact_water_fountain.radius,
      onInteract: () => {
        this.registry.set('dialogEvent', {
          speaker: 'Zuzu',
          text: "A refreshing water fountain. Nothing beats cold water after running around!\n\nStay hydrated, everyone.",
          choices: null, step: null,
        });
      },
    });

    // === SCENE TITLE ===
    this.add.text(this.layout.scene_title.x, this.layout.scene_title.y, '🏟️ Sports Fields', {
      fontSize: '20px', fontFamily: 'sans-serif', color: '#1b5e20',
      fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5);

    // === EXIT (south → overworld) ===
    this.addExit({
      x: this.layout.exit_south.x, y: this.layout.exit_south.y,
      width: this.layout.exit_south.w, height: this.layout.exit_south.h,
      targetScene: 'OverworldScene',
      targetSpawn: 'fromSportsFields',
      label: '🗺️ Leave Fields ⬇',
    });
  }
}

// ── HMR ──────────────────────────────────────────────────────────────
registerSceneHmr('SportsFieldsScene', import.meta.hot, SportsFieldsScene);
