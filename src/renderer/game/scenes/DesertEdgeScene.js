/**
 * DesertEdgeScene — the open desert just south of Zuzu's street.
 *
 * Split out of `StreetBlockScene` on 2026-11-26 at the owner's request: the
 * Sonoran flora, the fauna and every foraging interaction used to share one
 * 1000x700 screen with five houses, four neighbours, two bikes and the road,
 * and it was too busy for a young child to read. Home Street keeps the
 * people and the buildings; this scene keeps the living desert.
 *
 * Local playable scene with:
 *   - Desert floor and a sandy trail back to the gate
 *   - Eleven forageable Sonoran plants
 *   - Javelina, jackrabbit and coyote (the food-chain trio)
 *   - The wilted-plant puzzle
 *   - Exit north back to Home Street
 *
 * Nothing about the plants, animals or foraging behaviour is implemented
 * here: it all comes from `systems/foragingScenery.js` driven by
 * `public/layouts/desert-edge.layout.json`. Adding or moving a plant is a
 * layout edit, and no quest in `data/quests.js` names this scene — quests
 * ask for items and observations, which this scene grants exactly as the
 * street used to (arc.md §4).
 *
 * World size: 1000x700, matching Home Street so the camera behaves the same.
 */

import LocalSceneBase from './LocalSceneBase.js';
import { registerSceneHmr } from '../dev/phaserHmr.js';
import { loadLayout } from '../utils/loadLayout.js';
import { preloadGameAssets } from '../../../game/assets/preloadGameAssets.js';
import { registerZuzuAnimations } from '../../../game/characters/registerCharacterAnimations.js';
import { createWorldLabel } from '../../../game/ui/WorldLabel.js';
import {
  preloadEcologyAssets,
  ECOLOGY_ASSET_KEYS,
} from '../systems/ecology/ecologyAssetManifest.js';
import { mountLayoutFlora, mountLayoutFauna } from '../systems/foragingScenery.js';
import { ART } from '../../../game/assets/act1ArtRegistry.js';
import { groundDepth } from '../../../game/assets/act1Art.js';

const SCENE_KEY = 'DesertEdgeScene';

export default class DesertEdgeScene extends LocalSceneBase {
  static layoutEditorConfig = {
    layoutAssetKey: 'desertEdgeLayout',
    layoutPath: 'layouts/desert-edge.layout.json',
  };

  constructor() {
    super(SCENE_KEY);
  }

  getWorldSize() {
    return { width: 1000, height: 700 };
  }

  preload() {
    super.preload?.();
    preloadGameAssets(this);
    this.load.json('desertEdgeLayout', 'layouts/desert-edge.layout.json');
    preloadEcologyAssets(this);
  }

  createWorld() {
    this.layout = loadLayout(this, 'desertEdgeLayout');
    registerZuzuAnimations(this);

    // === GROUND ===
    {
      const o = this.layout.ground;
      this.addGroundTexture(
        ART.desertforaging_ground, o.x - o.w / 2, o.y - o.h / 2, o.w, o.h, { depth: -10 },
      );
    }

    // Sandy trail down from the gate, so the way home is visible from
    // anywhere in the scene.
    {
      const o = this.layout.trail;
      const key = ECOLOGY_ASSET_KEYS.terrain?.sand;
      if (key && this.hasArtTexture(key)) {
        this.addGroundTexture(key, o.x - o.w / 2, o.y - o.h / 2, o.w, o.h, { depth: -8 });
      } else {
        this.add.rectangle(o.x, o.y, o.w, o.h, 0xe2c99a, 0.45).setDepth(-8);
      }
    }

    // === DECOR (non-interactive scenery) ===
    for (const d of this.layout.decor || []) {
      const key = ECOLOGY_ASSET_KEYS.plants[d.key];
      if (!key || !this.hasArtTexture(key)) continue;
      this.addProp(key, d.x, d.y, {
        displayHeight: d.height || 140,
        depth: groundDepth(d.y),
      });
    }

    // === FLORA + FAUNA (layout-driven, shared system) =========================
    // Every plant, its interaction zone, its proximity label and its
    // EcologyEntity; then the animals. Identical behaviour to the street's
    // old inline implementation, so quest forage and observe steps are
    // unaffected.
    this._flora = mountLayoutFlora(this, this.layout.plants, { sceneKey: SCENE_KEY });
    this._ecologyPlants = this._flora.plants;
    this._ecologyEntities = this._flora.entities;
    this._ecologyAnimalEntities = mountLayoutFauna(this, this.layout.animals, {
      sceneKey: SCENE_KEY,
    });

    // === SIGNS ===
    {
      const o = this.layout.scene_label;
      createWorldLabel(this, o.x, o.y, 'Desert Edge', { depth: 20, fontSize: 13 });
    }
    {
      const o = this.layout.street_sign;
      this._drawWaySign(o.x, o.y, 'Home Street', 'up');
    }

    // === EXIT: north back to Home Street ===
    {
      const o = this.layout.exit_zone_north;
      this.addExit({
        x: o.x, y: o.y,
        width: o.w, height: o.h,
        targetScene: 'StreetBlockScene',
        targetSpawn: 'fromDesertEdge',
        label: null,
      });
    }

    // === WORLD BOUNDS ===
    for (const key of ['wall_south', 'wall_west', 'wall_east', 'wall_north_west', 'wall_north_east']) {
      const o = this.layout[key];
      if (o) this.addWall(o.x, o.y, o.w, o.h);
    }
  }

  /**
   * A signed arrow a young child can read: a board with the destination and
   * a big triangle pointing the way out.
   *
   * @param {'up'|'down'} direction which way the arrow points
   */
  _drawWaySign(x, y, text, direction = 'up') {
    const gfx = this.add.graphics().setDepth(20);
    gfx.fillStyle(0x8a5a2b, 1);
    gfx.fillRoundedRect(x - 92, y - 20, 184, 40, 8);
    gfx.lineStyle(3, 0xf0d9a8, 0.95);
    gfx.strokeRoundedRect(x - 92, y - 20, 184, 40, 8);

    this.add.text(x + 14, y, text, {
      fontFamily: 'sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(21);

    // Arrow
    const tip = direction === 'up' ? y - 13 : y + 13;
    const base = direction === 'up' ? y + 11 : y - 11;
    this.add.triangle(x - 56, 0, 0, base - y, 22, base - y, 11, tip - y, 0xfacc15, 1)
      .setPosition(x - 56, y)
      .setDepth(21);
    return gfx;
  }
}

// ── HMR ──────────────────────────────────
registerSceneHmr('DesertEdgeScene', import.meta.hot, DesertEdgeScene);
