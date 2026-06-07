import { ASSET_KEYS, ROUTE_MARKER_FRAME } from '../systems/AssetRegistry.js';
import { InputSystem } from '../systems/InputSystem.js';
import { InteractionSystem } from '../systems/InteractionSystem.js';
import { configureNeighborhoodCamera } from '../systems/CameraSystem.js';
import { installCharacterArtAuditBridge } from '../systems/CharacterArtAuditBridge.js';
import { act1Locations } from '../../data/act1/index.js';
import { loadLayout } from '../../../renderer/game/utils/loadLayout.js';

const USE_PROVENANCED_ENVIRONMENT_ASSETS =
  import.meta.env?.VITE_USE_PROVENANCED_ENVIRONMENT_ASSETS === 'true';

export default class NeighborhoodScene extends Phaser.Scene {
  constructor() {
    super('NeighborhoodScene');
  }

  create() {
    this.layout = loadLayout(this, 'act1NeighborhoodLayout');
    // Larger walkable world so the four regions read as distinct PLACES you walk
    // between — GARAGE (left), HOME (centre), THE WASH (right), ECOLOGY (below).
    this.worldWidth = 2560;
    this.worldHeight = 1600;
    this.inputSystem = new InputSystem(this);
    this.interactions = new InteractionSystem();
    this.runtime = this.registry.get('act1Runtime');
    this.runtime.sceneReady = true;
    this.runtime.audioSystem.transitionMusic('neighborhood');
    this.runtime.audioSystem.setAmbient('neighborhood');
    this.currentVelocity = { x: 0, y: 0 };
    this.lastNearestId = null;
    this.useProvenancedEnvironmentAssets = Boolean(
      USE_PROVENANCED_ENVIRONMENT_ASSETS || window.__USE_PROVENANCED_ENVIRONMENT_ASSETS === true,
    );
    this.forcePlaceholderPropAssets = Boolean(
      new URLSearchParams(window.location.search).has('forcePlaceholderProps') ||
      window.__BIKEBROWSER_FORCE_PLACEHOLDER_PROPS === true,
    );
    this.characterVisuals = {
      playerScale: 1.6,
      npcScale: 1.52,
      runtimeSource: 'aseprite_final_character_sheets',
      animatedSheets: [],
      npcIds: [],
      npcPlacements: [],
    };
    this.visualLanguageState = {
      scope: 'complete_act1',
      palette: 'warm_sonoran_neighborhood',
      authoredBeats: [
        'southwest_house_styles',
        'layered_sonoran_mountains',
        'garage_sanctuary',
        'npc_identity_cluster',
        'dry_wash_bridge_problem',
        'utm_tactile_testing',
        'ecology_living_patch',
        'chemistry_maker_surface',
        'field_notebook_reward',
        'bridge_repaired_payoff',
        'wider_map_tease',
      ],
      generatedRuntimeArt: false,
      unresolvedTensions: [],
    };

    // Walkable area excludes the Sonoran mountain backdrop band along the top
    // (drawn ~y 0–350) — Zuzu could previously walk straight up into the peaks.
    // Camera bounds stay full-world so the mountains remain visible behind play.
    this.WALKABLE_TOP = 360;
    this.physics.world.setBounds(0, this.WALKABLE_TOP, this.worldWidth, this.worldHeight - this.WALKABLE_TOP);
    this.createEnvironment();
    this.createCharacterAnimations();
    this.createPlayer();
    this.createInteractions();
    this.createFeedbackHud();
    this.createWorldMapHud();
    configureNeighborhoodCamera(this, this.player);

    this.helpText = this.add.text(18, 680, 'WASD / arrows move • E or Space explore • G map • N notebook • J discoveries • F2 edit • R replay voice • M quiet', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#ffe8aa',
      backgroundColor: 'rgba(22,32,29,0.6)',
      padding: { x: 8, y: 5 },
    }).setScrollFactor(0).setDepth(950);

    // Scroll the Discovery Registry list (it clips to the panel; arrows scroll it
    // while it is open — movement is frozen then).
    this.input.keyboard.on('keydown-UP', () => this._scrollDiscovery(-44));
    this.input.keyboard.on('keydown-DOWN', () => this._scrollDiscovery(44));
    this.input.keyboard.on('keydown-R', () => this.runtime?.audioSystem.replayLast());
    this.input.keyboard.on('keydown-M', () => {
      const current = this.runtime?.audioSystem.getState().settings.reducedAudio;
      this.runtime?.audioSystem.setSettings({ reducedAudio: !current });
      this.showFeedback({ message: !current ? 'Quiet audio mode on.' : 'Full audio cues on.' });
    });
    // NOTE: the world-map toggle is handled once in update() via
    // gpsJustPressed(); a second keydown-G listener here caused a double-toggle
    // (open+close in one press) that made the G key appear dead. Removed.
    // F2 = Edit Mode (drag objects to rearrange, see names, export to EB).
    this.input.keyboard.on('keydown-F2', () => this.toggleEditMode());
    const unlockAudioOnce = () => this.runtime?.audioSystem.unlockAudio();
    this.input.once('pointerdown', unlockAudioOnce);
    this.input.keyboard.once('keydown', unlockAudioOnce);

    installCharacterArtAuditBridge(this);
    this.publishTestReadiness();
  }

  createCharacterAnimations() {
    this.createDirectionalCharacterAnimations('zuzu', ASSET_KEYS.zuzuWalkSheet, 10);
    this.createSheetAnimation('zuzu.walk', ASSET_KEYS.zuzuWalkSheet, 0, 3, 10);
    this.createSheetAnimation('zuzu.idle', ASSET_KEYS.zuzuWalkSheet, 0, 3, 4);
    this.createSheetAnimation('chen.talk', ASSET_KEYS.npcGarageMentorTalkSheet, 0, 3, 3);
    this.createSheetAnimation('chen.repair', ASSET_KEYS.npcGarageMentorRepairSheet, 0, 15, 7);
    this.createSheetAnimation('ramirez.talk', ASSET_KEYS.npcNeighborTalkSheet, 0, 3, 3);
    this.createSheetAnimation('ramirez.cheer', ASSET_KEYS.npcNeighborCheerSheet, 0, 15, 7);
    this.createSheetAnimation('mariam.talk', ASSET_KEYS.npcArabicMentorTalkSheet, 0, 3, 3);
  }

  createDirectionalCharacterAnimations(prefix, textureKey, frameRate) {
    const rows = [
      ['down', 0, 3],
      ['left', 4, 7],
      ['right', 8, 11],
      ['up', 12, 15],
    ];
    for (const [direction, start, end] of rows) {
      this.createSheetAnimation(`${prefix}.walk.${direction}`, textureKey, start, end, frameRate);
      this.createSheetAnimation(`${prefix}.idle.${direction}`, textureKey, start, start, 1);
    }
  }

  createSheetAnimation(key, textureKey, start, end, frameRate) {
    if (!this.textures.exists(textureKey) || this.anims.exists(key)) return false;
    this.anims.create({
      key,
      frames: this.anims.generateFrameNumbers(textureKey, { start, end }),
      frameRate,
      repeat: -1,
    });
    if (!this.characterVisuals.animatedSheets.includes(textureKey)) {
      this.characterVisuals.animatedSheets.push(textureKey);
    }
    return true;
  }

  // Region-based neighbourhood: a wide world split into four readable PLACES —
  // GARAGE (left), HOME (centre), THE WASH (right), ECOLOGY (below) — connected
  // by paths, under a Sonoran mountain backdrop. (Replaces the old single
  // horizontal desert strip that crammed every activity into one band.)
  createEnvironment() {
    const W = this.worldWidth;
    const H = this.worldHeight;
    this.add.rectangle(W / 2, H / 2, W, H, 0x2e4a3d).setDepth(-30);
    this.add.rectangle(W / 2, H / 2, W, H, 0xcdb389, 0.10).setDepth(-29);

    this.drawMountainBackdrop();
    this.drawRegionGrounds();
    this.drawRegionBanners();

    // HOME — Zuzu's house, above the family of NPCs in the central hub.
    this.drawLegacyPuebloRevivalHome(1130, 470, 300, 150, {
      body: 0xc88457, trim: 0xf0c997, door: 0xf2c46d, label: 'Zuzu home',
    });

    // GARAGE — the workbench structure anchors the tools (layout-driven).
    const garageWorkbenchProp = this.layout.garage_workbench_prop;
    this.add.image(
      garageWorkbenchProp.x,
      garageWorkbenchProp.y,
      this.provenancedTextureOrFallback(ASSET_KEYS.propReplacementGarageWorkbench, ASSET_KEYS.garageWorkbench),
    ).setDisplaySize(garageWorkbenchProp.w, garageWorkbenchProp.h).setDepth(22);
    this.add.text(garageWorkbenchProp.labelX, garageWorkbenchProp.labelY, 'garage / workbench', labelStyle());

    // THE WASH — dry wash bed, the broken bridge, and its repaired payoff.
    const desertWash = this.layout.desert_wash;
    this.add.image(desertWash.x, desertWash.y, ASSET_KEYS.desertWash)
      .setScale(desertWash.scaleX, desertWash.scaleY).setDepth(6);
    // The wash is IMPASSABLE until the bridge is built — you cannot just walk
    // across it (that made the whole repair pointless). An invisible static
    // barrier east of the wash bed blocks crossing; updateEvidencePanel() removes
    // it once the bridge is reconnected. Everything east (salt river, gate) is
    // gated behind repair anyway, so blocking the channel is safe pre-repair.
    this.washBarrier = this.add.rectangle(
      desertWash.x + 80,
      (this.WALKABLE_TOP + this.worldHeight) / 2,
      40,
      this.worldHeight - this.WALKABLE_TOP,
      0x000000,
      0,
    ).setDepth(5);
    this.physics.add.existing(this.washBarrier, true);
    const bridgeDebris = this.layout.bridge_debris;
    this.bridgeSprite = this.add.image(
      bridgeDebris.x,
      bridgeDebris.y,
      this.provenancedTextureOrFallback(ASSET_KEYS.propReplacementBridgeDebris, ASSET_KEYS.bridgeBroken),
    ).setDisplaySize(bridgeDebris.brokenW, bridgeDebris.brokenH).setDepth(20);
    this.bridgePayoffGlow = this.add.ellipse(
      bridgeDebris.x,
      bridgeDebris.y,
      bridgeDebris.payoffGlowW,
      bridgeDebris.payoffGlowH,
      0xf2c46d,
      0,
    ).setDepth(145);
    this.bridgePayoffText = this.add.text(bridgeDebris.payoffTextX, bridgeDebris.payoffTextY, 'repaired crossing', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#fff0c7',
      backgroundColor: 'rgba(32,48,41,0.62)',
      padding: { x: 7, y: 4 },
    }).setDepth(910).setVisible(false);
    this.bridgeBeforeAfterTag = this.add.text(bridgeDebris.x - 60, bridgeDebris.y - 92, 'broken wash', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#fff0c7',
      backgroundColor: 'rgba(32,48,41,0.48)',
      padding: { x: 5, y: 2 },
    }).setDepth(910);

    const dryWashPathLabel = this.layout.dry_wash_path_label;
    this.add.text(dryWashPathLabel.x, dryWashPathLabel.y, 'dry wash path', {
      fontFamily: 'Arial',
      fontSize: '15px',
      color: '#f6e6b4',
    }).setAlpha(0.75);

    this.drawVegetationAccents();
  }

  // Layered Sonoran range marching across the whole top of the world.
  drawMountainBackdrop() {
    const W = this.worldWidth;
    const g = this.add.graphics().setDepth(-25);
    g.fillStyle(0x7db3b8, 0.20).fillRect(0, 0, W, 150);
    g.fillStyle(0x8ed6c9, 0.12).fillRect(0, 150, W, 100);
    const ranges = [
      { base: 300, amp: 150, step: 230, color: 0x3f536f, alpha: 0.58 },
      { base: 322, amp: 112, step: 270, color: 0x9b5b75, alpha: 0.50 },
      { base: 344, amp: 82, step: 320, color: 0xd47b3d, alpha: 0.42 },
    ];
    for (const r of ranges) {
      g.fillStyle(r.color, r.alpha);
      g.beginPath();
      g.moveTo(0, r.base);
      let peak = true;
      for (let x = 0; x <= W; x += r.step) {
        g.lineTo(x, peak ? r.base - r.amp : r.base - r.amp * 0.42);
        peak = !peak;
      }
      g.lineTo(W, r.base);
      g.closePath();
      g.fillPath();
    }
    g.fillStyle(0xffd17a, 0.22).fillEllipse(W * 0.22, 96, 720, 150);
    g.fillStyle(0xfff0c7, 0.15).fillEllipse(W * 0.7, 84, 920, 90);
  }

  // Four tinted ground platforms (one per region) joined by tan paths.
  drawRegionGrounds() {
    const g = this.add.graphics();
    g.setDepth(-22);
    // Connecting paths first, so the platform edges sit over their ends.
    g.fillStyle(0xcfa970, 0.85);
    g.fillRoundedRect(700, 786, 360, 92, 28);   // garage <-> home
    g.fillRoundedRect(1560, 786, 360, 92, 28);  // home <-> wash
    g.fillRoundedRect(1232, 1120, 96, 220, 28); // home <-> ecology
    g.setDepth(-20);
    const regions = [
      { cx: 470, cy: 800, w: 600, h: 580, color: 0x37474a, alpha: 0.55 },  // GARAGE — workshop slate
      { cx: 1280, cy: 860, w: 700, h: 640, color: 0x6b5535, alpha: 0.48 }, // HOME — warm adobe
      { cx: 2120, cy: 800, w: 720, h: 600, color: 0x2f5a55, alpha: 0.55 }, // WASH — riverbed teal
      { cx: 1280, cy: 1350, w: 620, h: 400, color: 0x3a5a3a, alpha: 0.55 }, // ECOLOGY — living green
    ];
    for (const r of regions) {
      g.fillStyle(r.color, r.alpha);
      g.fillRoundedRect(r.cx - r.w / 2, r.cy - r.h / 2, r.w, r.h, 42);
      g.lineStyle(3, 0xfff0c7, 0.12);
      g.strokeRoundedRect(r.cx - r.w / 2, r.cy - r.h / 2, r.w, r.h, 42);
    }
  }

  // Big region signage so each place announces itself.
  drawRegionBanners() {
    const banners = [
      { x: 470, y: 540, t: 'GARAGE', s: 'tools · testing · materials', c: '#bfe2ff' },
      { x: 1280, y: 562, t: 'HOME', s: 'Zuzu · neighbors · mentors', c: '#ffe8aa' },
      { x: 2120, y: 512, t: 'THE WASH', s: 'flood · bridge · the gate', c: '#bff0e8' },
      { x: 1280, y: 1162, t: 'ECOLOGY', s: 'plant · observe · restore', c: '#c8f0b0' },
    ];
    for (const b of banners) {
      this.add.text(b.x, b.y, b.t, {
        fontFamily: 'Arial', fontSize: '26px', fontStyle: 'bold', color: b.c,
      }).setOrigin(0.5, 0.5).setAlpha(0.92).setDepth(12);
      this.add.text(b.x, b.y + 23, b.s, {
        fontFamily: 'Arial', fontSize: '13px', color: b.c,
      }).setOrigin(0.5, 0.5).setAlpha(0.62).setDepth(12);
    }
  }

  // Desert plant life concentrated in the ecology patch and along the wash.
  drawVegetationAccents() {
    const spots = [
      [1180, 1280, 1.0], [1380, 1300, 1.12], [1250, 1438, 0.9], [1430, 1410, 0.86], // ecology
      [1960, 930, 0.95], [2300, 900, 1.0], [2050, 640, 0.8],                          // wash
    ];
    const key = this.canUseFinalPropAsset(ASSET_KEYS.environmentVegetationCluster)
      ? ASSET_KEYS.environmentVegetationCluster
      : (this.canUseWave1Asset(ASSET_KEYS.vegetationSaguaroClusterDraft)
        ? ASSET_KEYS.vegetationSaguaroClusterDraft
        : null);
    if (key) {
      for (const [x, y, s] of spots) this.add.image(x, y, key).setScale(s).setDepth(24);
      return;
    }
    const g = this.add.graphics().setDepth(24);
    for (const [x, y] of spots) {
      g.fillStyle(0x4f9c75, 1);
      g.fillRoundedRect(x, y - 22, 9, 44, 5);
      g.fillRoundedRect(x - 14, y - 4, 14, 7, 4);
      g.fillRoundedRect(x + 9, y - 12, 14, 7, 4);
      g.fillStyle(0x000000, 0.18).fillEllipse(x + 5, y + 25, 34, 8);
    }
  }

  drawNeighborhoodColorLanguage() {
    const g = this.add.graphics();
    g.fillStyle(0xffd17a, 0.09).fillEllipse(290, 96, 520, 94);
    g.fillStyle(0xf2c46d, 0.1).fillEllipse(665, 378, 300, 56);
    g.fillStyle(0x8ed6c9, 0.07).fillEllipse(1238, 670, 390, 120);
    g.lineStyle(5, 0xd9b36a, 0.2);
    g.beginPath();
    g.moveTo(286, 520);
    g.lineTo(650, 430);
    g.lineTo(742, 408);
    g.lineTo(920, 438);
    g.lineTo(1255, 642);
    g.strokePath();
    for (const [x, y, w] of [[310, 226, 150], [640, 224, 240], [1168, 606, 196], [1018, 732, 170]]) {
      g.fillStyle(0xfff0c7, 0.08).fillRoundedRect(x, y, w, 12, 6);
    }
  }

  drawGarageSanctuaryDetails() {
    const g = this.add.graphics();
    g.fillStyle(0x17221f, 0.24).fillEllipse(654, 390, 260, 46);
    g.fillStyle(0xf2c46d, 0.16).fillCircle(612, 226, 26);
    g.lineStyle(2, 0xfff0c7, 0.38);
    for (let x = 566; x <= 724; x += 24) {
      g.lineBetween(x, 234 + ((x / 24) % 2) * 4, x + 10, 244);
      g.fillStyle(0xf2c46d, 0.55).fillCircle(x + 10, 244, 3);
    }
    g.fillStyle(0x8ed6c9, 0.12).fillRoundedRect(604, 352, 116, 24, 10);
    this.add.text(606, 356, 'warm tools, shared proof', {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#ffe8aa',
    }).setAlpha(0.72);
  }

  drawBridgeStoryStage() {
    const g = this.add.graphics();
    g.fillStyle(0x8ed6c9, 0.11).fillRoundedRect(1038, 594, 410, 118, 36);
    g.fillStyle(0xd3a467, 0.12).fillRoundedRect(1198, 606, 302, 42, 18);
    g.lineStyle(3, 0x8ed6c9, 0.38);
    g.lineBetween(1038, 708, 1170, 652);
    g.lineBetween(1336, 646, 1500, 528);
    g.lineStyle(2, 0xfff0c7, 0.26);
    for (const [x, y] of [[1102, 648], [1138, 656], [1346, 618], [1390, 592]]) {
      g.strokeCircle(x, y, 10);
    }
    this.bridgeBeforeAfterTag = this.add.text(1138, 548, 'broken wash', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#fff0c7',
      backgroundColor: 'rgba(32,48,41,0.48)',
      padding: { x: 5, y: 2 },
    }).setDepth(910);
  }

  canUseWave1Asset(key) {
    return this.useProvenancedEnvironmentAssets && this.textures.exists(key);
  }

  wave1QuestMarkerKey() {
    return this.canUseWave1Asset(ASSET_KEYS.questMarkerStoryDraft)
      ? ASSET_KEYS.questMarkerStoryDraft
      : ASSET_KEYS.questMarker;
  }

  // A quest pin using the final route-marker art (gold "quest" diamond), sized to
  // the world. Falls back to the placeholder marker if the sheet failed to load.
  _questMarker(x, y, tint = null) {
    const hasSheet = this.textures.exists(ASSET_KEYS.routeMarkers);
    const marker = hasSheet
      ? this.add.image(x, y, ASSET_KEYS.routeMarkers, ROUTE_MARKER_FRAME.quest).setDisplaySize(32, 32)
      : this.add.image(x, y, this.wave1QuestMarkerKey());
    if (tint != null) marker.setTint(tint);
    return marker;
  }

  provenancedTextureOrFallback(provenancedKey, fallbackKey) {
    if (this.forcePlaceholderPropAssets) return fallbackKey;
    return this.textures.exists(provenancedKey) ? provenancedKey : fallbackKey;
  }

  canUseFinalPropAsset(key) {
    return !this.forcePlaceholderPropAssets && this.textures.exists(key);
  }

  drawLegacySonoranVistaFallback() {
    this.add.rectangle(800, 238, 1600, 286, 0x7fb08f).setAlpha(0.22);
    this.add.rectangle(800, 306, 1600, 178, 0x8a8d57).setAlpha(0.3);
    this.add.rectangle(800, 128, 1600, 160, 0x7db3b8).setAlpha(0.2);
    const vista = this.add.graphics();
    vista.fillStyle(0x8ed6c9, 0.16).fillRect(0, 0, 1600, 230);
    vista.fillStyle(0xffd17a, 0.28).fillEllipse(282, 118, 680, 176);
    vista.fillStyle(0xfff0c7, 0.2).fillEllipse(890, 98, 900, 70);
    vista.fillStyle(0xf28f45, 0.1).fillEllipse(1240, 162, 560, 96);

    // Layered basin-and-range silhouettes, with softer Sonoran colors than the old triangle peaks.
    this.drawLegacyMountainRange(vista, [
      [0, 330], [88, 286], [172, 198], [268, 304], [402, 242], [532, 118],
      [692, 314], [828, 236], [946, 322], [1084, 190], [1242, 98],
      [1396, 276], [1542, 170], [1600, 224], [1600, 358], [0, 358],
    ], 0x3f536f, 0.64);
    this.drawLegacyMountainRange(vista, [
      [0, 344], [122, 300], [254, 230], [390, 328], [520, 266],
      [664, 190], [812, 330], [990, 276], [1130, 172], [1288, 324],
      [1438, 248], [1600, 310], [1600, 372], [0, 372],
    ], 0x9b5b75, 0.54);
    this.drawLegacyMountainRange(vista, [
      [0, 360], [142, 314], [268, 284], [418, 352], [612, 298],
      [792, 266], [964, 348], [1134, 296], [1300, 250], [1468, 338],
      [1600, 306], [1600, 386], [0, 386],
    ], 0xd47b3d, 0.46);

    vista.fillStyle(0xffc76b, 0.34);
    vista.fillTriangle(86, 318, 172, 198, 238, 318);
    vista.fillTriangle(1104, 304, 1242, 98, 1328, 304);
    vista.fillTriangle(1282, 330, 1438, 248, 1502, 330);
    vista.fillStyle(0x704071, 0.28);
    vista.fillTriangle(404, 242, 532, 118, 614, 300);
    vista.fillTriangle(992, 276, 1130, 172, 1218, 318);
    vista.lineStyle(5, 0xffd17a, 0.28);
    for (const [x1, y1, x2, y2] of [
      [158, 226, 94, 330], [182, 220, 242, 322], [1240, 146, 1158, 320],
      [1266, 150, 1340, 318], [664, 202, 728, 316], [536, 126, 466, 288],
    ]) {
      vista.lineBetween(x1, y1, x2, y2);
    }

    vista.lineStyle(3, 0x2f3f58, 0.24);
    vista.lineBetween(0, 330, 1600, 310);
    vista.lineBetween(0, 360, 1600, 338);
    vista.fillStyle(0xa8b86d, 0.36).fillRect(0, 318, 1600, 70);
    vista.fillStyle(0x637d4e, 0.34).fillRoundedRect(0, 350, 1600, 28, 12);
    vista.fillStyle(0xd9b36a, 0.18).fillRoundedRect(0, 372, 1600, 20, 10);
    for (const [x, y, h] of [[138, 362, 68], [226, 348, 84], [1138, 354, 80], [1470, 344, 96]]) {
      vista.fillStyle(0x2f7f5c, 0.88).fillRoundedRect(x, y - h, 10, h, 5);
      vista.fillRoundedRect(x - 18, y - h * 0.46, 18, 8, 4);
      vista.fillRoundedRect(x + 10, y - h * 0.65, 18, 8, 4);
    }
    this.drawLegacyBackgroundHome(vista, 178, 304, 'adobe');
    this.drawLegacyBackgroundHome(vista, 356, 296, 'mission');
    this.drawLegacyBackgroundHome(vista, 1110, 302, 'territorial');
    this.drawLegacyBackgroundHome(vista, 1328, 292, 'adobe');
  }

  drawLegacyRoadSystemFallback() {
    for (let x = 64; x < this.worldWidth; x += 128) {
      for (let y = 0; y < this.worldHeight; y += 96) {
        this.add.image(x, y + 48, ASSET_KEYS.street).setAlpha(y > 380 && y < 590 ? 1 : 0);
      }
    }

    this.add.rectangle(800, 486, 1600, 116, 0x26343b);
    this.add.rectangle(800, 400, 1600, 28, 0x55646d).setAlpha(0.82);
    this.add.rectangle(800, 574, 1600, 28, 0x55646d).setAlpha(0.82);
    for (let x = 80; x < this.worldWidth; x += 120) {
      this.add.rectangle(x, 486, 56, 4, 0xd8c073).setAlpha(0.48);
    }
  }

  drawLegacyMountainRange(graphics, points, color, alpha) {
    graphics.fillStyle(color, alpha);
    graphics.beginPath();
    graphics.moveTo(points[0][0], points[0][1]);
    for (const [x, y] of points.slice(1)) graphics.lineTo(x, y);
    graphics.closePath();
    graphics.fillPath();
  }

  drawLegacyBackgroundHome(graphics, x, y, style) {
    if (style === 'mission') {
      graphics.fillStyle(0xe1c39b, 0.84).fillRoundedRect(x, y + 6, 88, 44, 5);
      graphics.fillStyle(0xb34f2f, 0.9).fillTriangle(x - 8, y + 8, x + 44, y - 16, x + 96, y + 8);
      graphics.fillStyle(0xf5d47c, 0.88).fillRoundedRect(x + 34, y + 24, 18, 26, 9);
      graphics.fillStyle(0x3d5d68, 0.72).fillRoundedRect(x + 12, y + 22, 16, 14, 3);
      graphics.fillRoundedRect(x + 62, y + 22, 16, 14, 3);
      return;
    }
    if (style === 'territorial') {
      graphics.fillStyle(0xc99c70, 0.84).fillRoundedRect(x, y + 2, 92, 46, 4);
      graphics.fillStyle(0xf0d19a, 0.8).fillRect(x - 6, y + 10, 104, 8);
      graphics.fillStyle(0x6b4a33, 0.72).fillRect(x + 10, y + 18, 4, 30);
      graphics.fillRect(x + 78, y + 18, 4, 30);
      graphics.fillStyle(0xffd57a, 0.86).fillRect(x + 40, y + 25, 16, 23);
      return;
    }
    graphics.fillStyle(0xd4a57a, 0.84).fillRoundedRect(x, y + 4, 88, 46, 10);
    graphics.fillStyle(0xb78558, 0.9).fillRect(x - 2, y, 92, 10);
    graphics.fillStyle(0x6b4a33, 0.68);
    for (let i = 10; i < 84; i += 18) graphics.fillRect(x + i, y - 4, 8, 8);
    graphics.fillStyle(0xffd57a, 0.86).fillRect(x + 20, y + 24, 14, 18);
    graphics.fillRect(x + 58, y + 24, 14, 18);
  }

  drawSouthwestHomes() {
    if (this.drawProvenancedSouthwestHomes()) {
      return;
    }
    this.drawLegacySouthwestHomes();
  }

  drawProvenancedSouthwestHomes() {
    const required = [
      ASSET_KEYS.housePueblo01Draft,
      ASSET_KEYS.houseMission01Draft,
      ASSET_KEYS.houseTerritorial01Draft,
      ASSET_KEYS.housePueblo02Draft,
    ];
    if (!this.useProvenancedEnvironmentAssets || required.some((key) => !this.textures.exists(key))) {
      return false;
    }
    this.add.image(202, 280, ASSET_KEYS.housePueblo01Draft).setDisplaySize(312, 152).setDepth(18);
    this.add.text(88, 366, 'Zuzu home', labelStyle()).setDepth(30);
    this.add.image(473, 284, ASSET_KEYS.houseMission01Draft).setDisplaySize(218, 128).setDepth(18);
    this.add.image(1102, 276, ASSET_KEYS.houseTerritorial01Draft).setDisplaySize(260, 136).setDepth(18);
    this.add.image(1364, 267, ASSET_KEYS.housePueblo02Draft).setDisplaySize(232, 126).setDepth(18);
    this.drawLegacyLowDesertWalls();
    return true;
  }

  drawLegacySouthwestHomes() {
    this.drawLegacyPuebloRevivalHome(46, 204, 312, 152, {
      body: 0xc88457,
      trim: 0xf0c997,
      door: 0xf2c46d,
      label: 'Zuzu home',
    });
    this.drawLegacyMissionTileHome(364, 220, 218, 128);
    this.drawLegacyTerritorialPorchHome(972, 208, 260, 136);
    this.drawLegacyPuebloRevivalHome(1248, 204, 232, 126, {
      body: 0xd39a66,
      trim: 0xf3d19d,
      door: 0xf2c46d,
      label: '',
    });
    this.drawLegacyLowDesertWalls();
  }

  drawLegacyPuebloRevivalHome(x, y, w, h, options = {}) {
    const g = this.add.graphics();
    const body = options.body || 0xc78d67;
    const trim = options.trim || 0xe1b783;
    g.fillStyle(0x17221f, 0.18).fillEllipse(x + w * 0.5, y + h + 8, w * 0.48, 12);
    g.fillStyle(body, 1).fillRoundedRect(x, y + 18, w, h - 18, 14);
    g.fillStyle(trim, 0.95).fillRoundedRect(x + 12, y + 8, w - 24, 24, 10);
    g.fillStyle(0x8b5a3e, 1).fillRoundedRect(x - 8, y + 6, w + 16, 16, 8);
    g.fillStyle(0x5e392b, 0.86);
    for (let beamX = x + 18; beamX < x + w - 12; beamX += 28) {
      g.fillRoundedRect(beamX, y, 14, 16, 5);
    }
    g.fillStyle(options.door || 0xf2c46d, 1).fillRoundedRect(x + w * 0.44, y + h - 48, 32, 48, 5);
    g.fillStyle(0x31485a, 0.86).fillRoundedRect(x + 28, y + 48, 36, 26, 5);
    g.fillRoundedRect(x + w - 66, y + 48, 36, 26, 5);
    g.fillStyle(0xf7d48a, 0.72).fillRoundedRect(x + 78, y + 48, 52, 26, 12);
    g.lineStyle(4, 0xe7bd88, 0.92).strokeRoundedRect(x + 75, y + 45, 58, 32, 16);
    g.fillStyle(0xf7d48a, 0.9).fillRoundedRect(x + w * 0.16, y + h - 34, 42, 10, 5);
    g.fillStyle(0x7c4e35, 0.7).fillRoundedRect(x + w * 0.16 + 6, y + h - 42, 30, 8, 4);
    g.lineStyle(2, 0xfff0c7, 0.28).strokeRoundedRect(x + 6, y + 22, w - 12, h - 28, 12);
    if (options.label) this.add.text(x + 42, y + h + 10, options.label, labelStyle());
  }

  drawLegacyMissionTileHome(x, y, w, h) {
    const g = this.add.graphics();
    g.fillStyle(0x17221f, 0.16).fillEllipse(x + w * 0.5, y + h + 8, w * 0.46, 12);
    g.fillStyle(0xd9b28a, 1).fillRoundedRect(x + 14, y + 34, w - 28, h - 34, 7);
    g.fillStyle(0xb44f30, 1).fillTriangle(x, y + 38, x + w * 0.5, y + 2, x + w, y + 38);
    g.fillStyle(0x8e3d2a, 0.72);
    for (let tileX = x + 22; tileX < x + w - 20; tileX += 18) {
      g.fillTriangle(tileX, y + 28, tileX + 9, y + 20, tileX + 18, y + 28);
    }
    for (let tileX = x + 18; tileX < x + w - 18; tileX += 20) {
      g.lineStyle(2, 0xffb166, 0.34).lineBetween(tileX, y + 21, tileX + 14, y + 39);
    }
    g.fillStyle(0x31485a, 0.82).fillRoundedRect(x + 34, y + 58, 28, 22, 4);
    g.fillRoundedRect(x + w - 62, y + 58, 28, 22, 4);
    g.fillStyle(0xf2c46d, 1).fillRoundedRect(x + w * 0.5 - 15, y + 62, 30, 38, 15);
    g.lineStyle(4, 0xf5d6a6, 0.62).strokeRoundedRect(x + w * 0.5 - 19, y + 58, 38, 44, 18);
    g.fillStyle(0x8bbf65, 0.72).fillRoundedRect(x + 22, y + h - 16, w - 44, 12, 6);
    g.fillStyle(0x7fb069, 0.8).fillRoundedRect(x - 12, y + h - 26, 8, 34, 4);
    g.fillRoundedRect(x + w + 6, y + h - 34, 8, 42, 4);
  }

  drawLegacyTerritorialPorchHome(x, y, w, h) {
    const g = this.add.graphics();
    g.fillStyle(0x17221f, 0.16).fillEllipse(x + w * 0.5, y + h + 8, w * 0.46, 12);
    g.fillStyle(0xc79b6f, 1).fillRoundedRect(x, y + 22, w, h - 22, 5);
    g.fillStyle(0xf0d19a, 0.94).fillRoundedRect(x - 10, y + 42, w + 20, 18, 3);
    g.fillStyle(0xf7e0b4, 1).fillRoundedRect(x - 14, y + 58, w + 28, 20, 6);
    g.fillStyle(0x6b4a33, 0.86);
    for (let postX = x + 14; postX < x + w; postX += 46) {
      g.fillRoundedRect(postX, y + 56, 7, h - 56, 3);
    }
    g.fillStyle(0x8f5e3d, 1).fillTriangle(x - 4, y + 24, x + w * 0.5, y, x + w + 4, y + 24);
    g.fillStyle(0x31485a, 0.82).fillRoundedRect(x + 32, y + 66, 28, 24, 4);
    g.fillRoundedRect(x + w - 60, y + 66, 28, 24, 4);
    g.fillStyle(0xf2c46d, 1).fillRoundedRect(x + w * 0.48, y + 68, 28, 42, 4);
    g.lineStyle(2, 0xf0d19a, 0.7).lineBetween(x + 4, y + 58, x + w - 4, y + 58);
  }

  drawLegacyLowDesertWalls() {
    const g = this.add.graphics();
    g.fillStyle(0xd9b28a, 0.78).fillRoundedRect(20, 356, 336, 18, 8);
    g.fillRoundedRect(348, 358, 224, 14, 7);
    g.fillRoundedRect(984, 356, 504, 18, 8);
    g.fillStyle(0x8f623e, 0.64);
    for (const x of [44, 108, 172, 236, 300, 388, 452, 516, 1018, 1084, 1150, 1216, 1282, 1348, 1414]) {
      g.fillRoundedRect(x, 348, 10, 26, 4);
    }
    g.fillStyle(0x4f9c75, 0.9);
    for (const [x, y, h] of [[392, 354, 40], [1190, 350, 52], [1470, 348, 60]]) {
      g.fillRoundedRect(x, y - h, 9, h, 5);
      g.fillRoundedRect(x - 13, y - h * 0.45, 13, 7, 4);
      g.fillRoundedRect(x + 9, y - h * 0.62, 13, 7, 4);
    }
  }

  drawDesertDetails() {
    if (this.canUseFinalPropAsset(ASSET_KEYS.environmentVegetationCluster)) {
      for (const [x, y, scale] of [[1140, 540, 0.9], [1360, 580, 1.0], [980, 705, 1.12], [1420, 728, 0.86]]) {
        this.add.image(x + 5, y, ASSET_KEYS.environmentVegetationCluster).setScale(scale).setDepth(24);
      }
      return;
    }
    if (this.canUseWave1Asset(ASSET_KEYS.vegetationSaguaroClusterDraft)) {
      for (const [x, y, scale] of [[1140, 540, 0.9], [1360, 580, 1.0], [980, 705, 1.12], [1420, 728, 0.86]]) {
        this.add.image(x + 5, y, ASSET_KEYS.vegetationSaguaroClusterDraft).setScale(scale).setDepth(24);
      }
      return;
    }
    this.drawLegacyDesertDetails();
  }

  drawLegacyDesertDetails() {
    const g = this.add.graphics();
    const cactusColor = 0x4f9c75;
    for (const [x, y] of [[1140, 540], [1360, 580], [980, 705], [1420, 728]]) {
      g.fillStyle(cactusColor, 1);
      g.fillRoundedRect(x, y - 22, 9, 44, 5);
      g.fillRoundedRect(x - 14, y - 4, 14, 7, 4);
      g.fillRoundedRect(x + 9, y - 12, 14, 7, 4);
      g.fillStyle(0x000000, 0.18).fillEllipse(x + 5, y + 25, 34, 8);
    }
    g.lineStyle(2, 0xd3a467, 0.45);
    for (const [x, y] of [[780, 610], [860, 365], [650, 598], [1460, 646]]) {
      g.lineBetween(x - 18, y, x + 18, y + 6);
      g.lineBetween(x - 8, y + 8, x + 8, y + 12);
    }
  }

  drawGarageWarmth() {
    const g = this.add.graphics();
    g.fillStyle(0xf2c46d, 0.16).fillRoundedRect(566, 242, 180, 122, 18);
    g.fillStyle(0xfff0c7, 0.1).fillEllipse(670, 376, 260, 42);
    g.lineStyle(2, 0xf2c46d, 0.35).lineBetween(586, 366, 734, 366);
  }

  drawBridgePull() {
    const g = this.add.graphics();
    g.fillStyle(0xf2c46d, 0.09).fillEllipse(1288, 640, 260, 86);
    g.fillStyle(0x8ed6c9, 0.08).fillRoundedRect(1368, 468, 170, 110, 22);
    g.lineStyle(3, 0xd3a467, 0.28).lineBetween(1288, 642, 1442, 532);
    g.lineStyle(2, 0x8ed6c9, 0.32).lineBetween(1398, 536, 1464, 520);
  }

  drawStoryDetails() {
    const g = this.add.graphics();
    if (!this.textures.exists(ASSET_KEYS.propReplacementGarageWorkbench)) {
      g.lineStyle(2, 0xd9b36a, 0.45);
      for (const [x, y] of [[430, 418], [454, 419], [478, 421], [502, 421], [760, 430], [786, 431], [812, 431]]) {
        g.strokeEllipse(x, y, 18, 7);
      }
    }
    g.lineStyle(2, 0x8ed6c9, 0.6);
    g.lineBetween(1188, 600, 1232, 632);
    g.lineBetween(1232, 632, 1280, 604);
    g.fillStyle(0xf2c46d, 0.75).fillCircle(1484, 450, 4);
    g.fillCircle(1506, 468, 3);
    this.add.text(1160, 616, 'flood line', { ...labelStyle(), fontSize: '12px' }).setAlpha(0.72);
    this.add.text(756, 366, 'test first', { ...labelStyle(), fontSize: '12px' }).setAlpha(0.78);
  }

  createPlayer() {
    const animated = this.textures.exists(ASSET_KEYS.zuzuWalkSheet);
    // Spawn in the HOME hub (world centre), among the NPCs.
    this.player = this.physics.add.sprite(1280, 1040, animated ? ASSET_KEYS.zuzuWalkSheet : ASSET_KEYS.zuzu);
    this.player.setScale(this.characterVisuals.playerScale).setDepth(260);
    this.player.setCollideWorldBounds(true);
    if (this.washBarrier) {
      this.washCollider = this.physics.add.collider(this.player, this.washBarrier);
      // Honor a loaded/already-repaired state immediately.
      this._setWashBarrier(!this.runtime?.constructionSystem?.bridgeReconnected);
    }
    this.player.body.setSize(animated ? 22 : 24, animated ? 28 : 30);
    this.player.body.setOffset(animated ? 37 : 8, animated ? 54 : 20);
    this.playerFacing = 'down';
    if (animated) this.player.play('zuzu.idle.down');
    this.playerVisualState = {
      textureKey: this.player.texture.key,
      scale: this.player.scaleX,
      animation: this.player.anims?.currentAnim?.key || null,
      facing: this.playerFacing,
    };
    this.registry.set('playerPosition', { x: this.player.x, y: this.player.y });
  }

  createInteractions() {
    const bikeInspection = this.layout.bike_inspection;
    this.add.image(bikeInspection.x, bikeInspection.y, ASSET_KEYS.bike).setScale(bikeInspection.scale);
    this.add.image(bikeInspection.markerX, bikeInspection.markerY, ASSET_KEYS.interactionMarker);
    const repairStation = this.layout.repair_station;
    this.add.image(repairStation.x, repairStation.y, ASSET_KEYS.repairStation).setScale(repairStation.scale);
    const utmRig = this.layout.utm_rig;
    this.add.image(utmRig.x, utmRig.y, ASSET_KEYS.utmRig).setScale(utmRig.scale);
    this.createUtmVisualizer();
    const chemistryBench = this.layout.chemistry_bench;
    this.add.image(
      chemistryBench.x,
      chemistryBench.y,
      this.provenancedTextureOrFallback(ASSET_KEYS.propReplacementChemistryBench, ASSET_KEYS.chemistryStation),
    ).setDisplaySize(chemistryBench.w, chemistryBench.h);
    this.createChemistryVisualizer();
    const bridgePlanWorkbench = this.layout.bridge_plan_workbench;
    this.add.image(bridgePlanWorkbench.x, bridgePlanWorkbench.y, ASSET_KEYS.workbench).setScale(bridgePlanWorkbench.scale);
    const ecologyPatch = this.layout.ecology_patch;
    this.add.image(ecologyPatch.x, ecologyPatch.y, ASSET_KEYS.ecologyPlant).setScale(ecologyPatch.scale);
    this.createEcologyVisualizer();
    const mapGate = this.layout.map_gate;
    this.add.image(
      mapGate.x,
      mapGate.y,
      this.provenancedTextureOrFallback(ASSET_KEYS.mapGateFinal, ASSET_KEYS.mapGate),
    ).setScale(mapGate.scale);
    const garageWorkbenchProp = this.layout.garage_workbench_prop;
    this._questMarker(garageWorkbenchProp.questMarkerX, garageWorkbenchProp.questMarkerY);

    const mrChen = this.layout.npc_mr_chen;
    this.createAnimatedNpc({
      id: 'mr_chen',
      x: mrChen.x,
      y: mrChen.y,
      sheetKey: ASSET_KEYS.npcGarageMentorTalkSheet,
      fallbackKey: ASSET_KEYS.npcGarageMentor,
      animationKey: 'chen.talk',
      dialogueId: 'mr_chen_bridge_intro',
    });
    this.add.text(mrChen.labelX, mrChen.labelY, 'Mr. Chen', npcLabelStyle());
    this.drawNpcCue(mrChen.cueX, mrChen.cueY, 0xf2c46d, 'wrench');

    const neighbor = this.layout.npc_neighbor;
    this.createAnimatedNpc({
      id: 'neighbor',
      x: neighbor.x,
      y: neighbor.y,
      sheetKey: ASSET_KEYS.npcNeighborTalkSheet,
      fallbackKey: ASSET_KEYS.npcNeighbor,
      animationKey: 'ramirez.talk',
      dialogueId: 'wash_neighbor',
    });
    this.add.text(neighbor.labelX, neighbor.labelY, 'Mrs. Ramirez', npcLabelStyle());
    this.drawNpcCue(neighbor.cueX, neighbor.cueY, 0xf09d72, 'heart');

    const auntieMariam = this.layout.npc_auntie_mariam;
    this.createAnimatedNpc({
      id: 'auntie_mariam',
      x: auntieMariam.x,
      y: auntieMariam.y,
      sheetKey: ASSET_KEYS.npcArabicMentorTalkSheet,
      fallbackKey: ASSET_KEYS.npcArabicMentor,
      animationKey: 'mariam.talk',
      dialogueId: 'arabic_welcome',
    });
    this.add.text(auntieMariam.labelX, auntieMariam.labelY, 'Auntie Mariam', npcLabelStyle());
    this.drawNpcCue(auntieMariam.cueX, auntieMariam.cueY, 0xbec8ff, 'star');

    const materialTable = this.layout.material_table;
    const trader = this.add.image(
      materialTable.x,
      materialTable.y,
      this.provenancedTextureOrFallback(ASSET_KEYS.propReplacementMaterialTable, ASSET_KEYS.materialSamples),
    ).setDisplaySize(materialTable.w, materialTable.h);
    this.add.text(materialTable.labelX, materialTable.labelY, 'materials table', labelStyle());

    const washMarkerLayout = this.layout.wash_marker;
    const washMarker = this._questMarker(washMarkerLayout.x, washMarkerLayout.y, 0x8ed6c9);

    this.interactions.register({
      id: 'mr_chen',
      x: mrChen.x,
      y: mrChen.y,
      label: 'Talk to Mr. Chen',
      dialogueId: 'mr_chen_bridge_intro',
    });
    this.interactions.register({
      id: 'neighbor',
      x: neighbor.x,
      y: neighbor.y,
      label: 'Ask Mrs. Ramirez',
      dialogueId: 'wash_neighbor',
    });
    this.interactions.register({
      id: 'bike',
      x: bikeInspection.interactionX,
      y: bikeInspection.interactionY,
      label: 'Inspect the bike',
      dialogueId: 'bike_check_intro',
      action: 'bike_check',
    });
    this.interactions.register({
      id: 'dry_wash',
      x: washMarkerLayout.x,
      y: washMarkerLayout.y,
      label: 'Read bridge sign',
      dialogueId: 'dry_wash_marker',
      action: 'dry_wash',
    });
    // Phase 1.9.4 — the washout mystery: a player-reachable investigation
    // (observe → hypothesize → gather evidence → conclude). Placed down-channel
    // from the bridge sign so it does not collide with neighbouring zones.
    const washMystery = this.layout.wash_mystery;
    this._questMarker(washMystery.x, washMystery.y, 0xc8a0ff).setDepth(40);
    this.interactions.register({
      id: 'investigate_wash',
      x: washMystery.x,
      y: washMystery.y,
      label: 'Investigate the washout',
      action: 'investigate_wash',
    });
    // Phase 2.1 — Ecology Loop: a player-reachable plant-the-desert spot
    // (observe a site → predict which plant thrives → see it → learn why).
    // Kept clear of the wash/ecology zones so it never shadows them.
    const ecologyGarden = this.layout.ecology_garden;
    this._questMarker(ecologyGarden.x, ecologyGarden.y, 0x9be37a).setDepth(40);
    this.interactions.register({
      id: 'ecology_garden',
      x: ecologyGarden.x,
      y: ecologyGarden.y,
      label: 'Plant the desert',
      action: 'ecology_garden',
    });
    this.interactions.register({
      id: 'materials_table',
      x: materialTable.interactionX,
      y: materialTable.interactionY,
      label: 'Collect candidate materials',
      dialogueId: 'material_trade',
      action: 'collect_materials',
    });
    this.interactions.register({
      id: 'utm',
      x: utmRig.x,
      y: utmRig.y,
      label: 'Run UTM material tests',
      action: 'utm',
    });
    this.interactions.register({
      id: 'bridge_plan',
      x: bridgePlanWorkbench.x,
      y: bridgePlanWorkbench.y,
      label: 'Plan bridge repair',
      action: 'bridge_plan',
    });
    const bridgeDebris = this.layout.bridge_debris;
    this.interactions.register({
      id: 'bridge_repair',
      x: bridgeDebris.x,
      y: bridgeDebris.y,
      label: 'Reconnect the crossing',
      action: 'repair_bridge',
    });
    this.interactions.register({
      id: 'ecology_patch',
      x: ecologyPatch.x,
      y: ecologyPatch.y,
      label: 'Observe desert helpers',
      dialogueId: 'ecology_helper',
      action: 'ecology_patch',
    });
    this.interactions.register({
      id: 'chemistry_station',
      x: chemistryBench.x,
      y: chemistryBench.y,
      label: 'Mix, dry, test',
      action: 'chemistry_station',
    });
    // NOTE: Mrs. Ramirez's "thank you" beat (spanish_trust + spanish_neighbor
    // action) is NOT a separate zone — it was stacked at her exact coords and
    // permanently shadowed. It is now reached through the progression-aware
    // `neighbor` zone (see the interaction handler in update()).
    this.interactions.register({
      id: 'arabic_mentor',
      x: auntieMariam.x,
      y: auntieMariam.y,
      label: 'Check in with Auntie Mariam',
      dialogueId: 'arabic_welcome',
      action: 'arabic_mentor',
    });
    this.interactions.register({
      id: 'wider_gate',
      x: this.layout.map_gate.x,
      y: this.layout.map_gate.y,
      label: 'Open wider map clue',
      dialogueId: 'wider_gate_clue',
      action: 'wider_gate',
    });
    // Phase 2.4 — Salt River biome expedition. Always present (so it is
    // reachable), but the loop is gated behind the wider map: pressing E before
    // the bridge is repaired opens a clear "locked" panel, not silence.
    const saltRiverExpedition = this.layout.salt_river_expedition;
    // Hidden opportunity: the expedition marker is invisible and inert until the
    // player DISCOVERS the City Gate by exploring the map edge (Phase 2.2 Fun).
    this.saltRiverMarker = this._questMarker(saltRiverExpedition.x, saltRiverExpedition.y, 0x7fd1ff).setDepth(40).setVisible(false);
    this.interactions.register({
      id: 'salt_river_expedition',
      x: saltRiverExpedition.x,
      y: saltRiverExpedition.y,
      label: 'Set out for the Salt River',
      action: 'salt_river_expedition',
    });

    this.drawInteractionHalos();

    this.prompt = this.add.text(0, 0, '', {
      fontFamily: 'Arial',
      fontSize: '15px',
      color: '#203029',
      backgroundColor: '#fff0c7',
      padding: { x: 8, y: 5 },
    }).setDepth(900).setVisible(false);

    this.notebookPanel = this.add.container(880, 18).setScrollFactor(0).setDepth(980).setVisible(false);
    const nbBg = this.add.rectangle(0, 0, 390, 318, 0xfff0c7, 0.97).setOrigin(0, 0);
    nbBg.setStrokeStyle(2, 0x6b4a33, 1);
    const spine = this.add.rectangle(30, 0, 7, 318, 0xd9b36a, 0.45).setOrigin(0, 0);
    const tab1 = this.add.rectangle(54, 12, 74, 22, 0xf2c46d, 0.32).setOrigin(0, 0);
    const tab2 = this.add.rectangle(132, 12, 82, 22, 0x8ed6c9, 0.2).setOrigin(0, 0);
    const tab3 = this.add.rectangle(218, 12, 70, 22, 0xd08b62, 0.2).setOrigin(0, 0);
    this.notebookHeader = this.add.text(52, 42, '', {
      fontFamily: 'Arial',
      fontSize: '15px',
      color: '#30251d',
      fontStyle: 'bold',
      wordWrap: { width: 316 },
    });
    this.notebookCategoryText = this.add.text(52, 70, '', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#6b4a33',
      wordWrap: { width: 316 },
    });
    this.notebookCardsText = this.add.text(52, 102, '', {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#30251d',
      wordWrap: { width: 306 },
      lineSpacing: 4,
    });
    this.notebookHint = this.add.text(52, 282, 'N closes  •  New clues wear a star', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#6b4a33',
    });
    this.notebookPanel.add([
      nbBg,
      spine,
      tab1,
      tab2,
      tab3,
      this.add.text(64, 16, 'Clues', tabStyle()),
      this.add.text(144, 16, 'Tests', tabStyle()),
      this.add.text(232, 16, 'Map', tabStyle()),
      this.notebookHeader,
      this.notebookCategoryText,
      this.notebookCardsText,
      this.notebookHint,
    ]);
  }

  createAnimatedNpc({ id, x, y, sheetKey, fallbackKey, animationKey, dialogueId }) {
    const animated = this.textures.exists(sheetKey);
    const npc = animated
      ? this.add.sprite(x, y, sheetKey, 0)
      : this.add.image(x, y, fallbackKey);
    npc.setScale(this.characterVisuals.npcScale).setDepth(245);
    npc.setData('dialogueId', dialogueId);
    npc.setData('characterId', id);
    if (animated && this.anims.exists(animationKey)) {
      npc.play({ key: animationKey, repeat: -1, delay: Phaser.Math.Between(0, 220) });
    }
    npc.setData('usesAsepriteRuntimeSheet', animated);
    npc.setData('runtimeSource', animated ? sheetKey : fallbackKey);
    this.tweens.add({
      targets: npc,
      y: y - 3,
      scaleY: this.characterVisuals.npcScale * 1.018,
      duration: 1450 + Phaser.Math.Between(0, 260),
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
    this.characterVisuals.npcIds.push(id);
    this.characterVisuals.npcPlacements.push({
      id,
      x,
      y,
      texture: animated ? sheetKey : fallbackKey,
      runtimeFinal: animated,
    });
    return npc;
  }

  drawInteractionHalos() {
    for (const zone of this.interactions.zones) {
      const halo = this.add.circle(zone.x, zone.y, 32, 0x8ed6c9, 0.045);
      halo.setStrokeStyle(2, 0x8ed6c9, 0.22);
      halo.setData('zoneId', zone.id);
    }
  }

  createUtmVisualizer() {
    // Positioned relative to the UTM rig prop so it follows wherever the rig is.
    const rig = this.layout.utm_rig;
    this.utmViz = this.add.container(rig.x - 34, rig.y - 56).setDepth(150);
    this.utmVizBase = this.add.rectangle(0, 0, 72, 16, 0x203029, 0.62).setStrokeStyle(1, 0xfff0c7, 0.4);
    this.utmVizSample = this.add.rectangle(0, 0, 44, 7, 0x8ed6c9, 0.95);
    this.utmVizPressure = this.add.rectangle(0, -11, 34, 5, 0xf2c46d, 0.92);
    this.utmVizLabel = this.add.text(-34, 16, 'test load', {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: '#ffe8aa',
    }).setAlpha(0.76);
    this.utmViz.add([this.utmVizBase, this.utmVizSample, this.utmVizPressure, this.utmVizLabel]);
    this.utmComparisonMarks = [
      this.add.rectangle(rig.x - 58, rig.y - 18, 24, 5, 0x8ed6c9, 0.5).setDepth(151),
      this.add.rectangle(rig.x - 28, rig.y - 18, 24, 5, 0xf2c46d, 0.5).setDepth(151),
      this.add.rectangle(rig.x + 2, rig.y - 18, 24, 5, 0xd08b62, 0.5).setDepth(151),
    ];
    this.add.text(rig.x - 68, rig.y - 10, 'compare bend', {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: '#ffe8aa',
    }).setAlpha(0.72).setDepth(151);
  }

  updateUtmVisualizer(latestTest) {
    if (!this.utmVizSample || !latestTest) return;
    const usefulness = latestTest.bridgeUsefulness ?? 0.4;
    const deformation = Phaser.Math.Clamp(latestTest.deformation ?? 0.5, 0, 1.2);
    const color = usefulness >= 0.8 ? 0x8ed6c9 : usefulness >= 0.55 ? 0xf2c46d : 0xd08b62;
    this.utmVizSample.setFillStyle(color, 0.95);
    this.utmVizSample.setScale(1, Phaser.Math.Clamp(1 - deformation * 0.36, 0.48, 1));
    this.utmVizSample.setRotation((deformation - 0.35) * 0.12);
    this.utmVizPressure.setY(-11 + deformation * 5);
    this.utmVizLabel.setText(usefulness >= 0.8 ? 'holds shape' : usefulness >= 0.55 ? 'bends some' : 'fails test');
    this.utmComparisonMarks?.forEach((mark, index) => {
      const active = index === 0 && usefulness >= 0.8
        || index === 1 && usefulness >= 0.55 && usefulness < 0.8
        || index === 2 && usefulness < 0.55;
      mark.setAlpha(active ? 1 : 0.28);
      mark.setScale(1, active ? 1.8 : 1);
    });
  }

  resetUtmVisualizer() {
    if (!this.utmVizSample) return;
    this.utmVizSample.setFillStyle(0x8ed6c9, 0.7);
    this.utmVizSample.setScale(1, 1);
    this.utmVizSample.setRotation(0);
    this.utmVizPressure.setY(-11);
    this.utmVizLabel.setText('test load');
    this.utmComparisonMarks?.forEach((mark) => mark.setAlpha(0.5).setScale(1, 1));
  }

  createChemistryVisualizer() {
    const bench = this.layout.chemistry_bench;
    this.chemistryViz = this.add.container(bench.x, bench.y - 38).setDepth(148);
    this.chemistrySteam = this.add.graphics();
    this.chemistrySteam.lineStyle(2, 0xfff0c7, 0.48);
    this.chemistrySteam.lineBetween(-16, 0, -10, -12);
    this.chemistrySteam.lineBetween(0, 2, 5, -14);
    this.chemistrySteam.lineBetween(14, 0, 20, -10);
    this.chemistryDryingPatch = this.add.rectangle(34, 28, 28, 6, 0xd08b62, 0.9).setStrokeStyle(1, 0xfff0c7, 0.45);
    this.chemistryLabel = this.add.text(-36, 36, 'mix safe', {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: '#ffe8aa',
    }).setAlpha(0.68);
    this.chemistryViz.add([this.chemistrySteam, this.chemistryDryingPatch, this.chemistryLabel]);
    this.chemistryViz.setAlpha(0.45);
  }

  createEcologyVisualizer() {
    const patch = this.layout.ecology_patch;
    this.ecologyViz = this.add.container(patch.x, patch.y).setDepth(130);
    this.ecologyPatch = this.canUseFinalPropAsset(ASSET_KEYS.environmentEcologyPatch)
      ? this.add.image(0, -4, ASSET_KEYS.environmentEcologyPatch).setDisplaySize(148, 100)
      : null;
    this.ecologyWater = this.add.text(-24, 22, 'water', {
      fontFamily: 'Arial',
      fontSize: '9px',
      color: '#8ed6c9',
    }).setAlpha(0.58);
    this.ecologyEthic = this.add.text(-58, 34, 'observe first', {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#ffe8aa',
    }).setAlpha(0.72);
    this.ecologyViz.add([
      ...(this.ecologyPatch ? [this.ecologyPatch] : []),
      this.ecologyWater,
      this.ecologyEthic,
    ]);
    this.ecologyViz.setAlpha(0.45);
  }

  updateEmbodiedWorldFeedback(state) {
    const chemistryDone = (state.chemistry.results || []).length > 0;
    const ecologyCount = (state.ecology.observed || []).length;
    if (this.chemistryViz) {
      this.chemistryViz.setAlpha(chemistryDone ? 1 : 0.45);
      this.chemistryLabel.setText(chemistryDone ? 'dry, then test' : 'mix safe');
      this.chemistryDryingPatch.setFillStyle(chemistryDone ? 0x8ed6c9 : 0xd08b62, 0.9);
    }
    if (this.ecologyViz) {
      this.ecologyViz.setAlpha(ecologyCount > 0 ? 0.95 : 0.45);
      this.ecologyEthic.setText(ecologyCount >= 3 ? 'habitat mapped' : ecologyCount > 0 ? 'shade + water' : 'observe first');
      this.ecologyWater.setText(ecologyCount >= 2 ? 'water + shade' : 'water');
      this.ecologyWater.setScale(ecologyCount >= 2 ? 1.08 : 1);
    }
  }

  drawNpcCue(x, y, color, kind) {
    const cueKey = kind === 'wrench'
      ? ASSET_KEYS.uiNpcCueWrench
      : kind === 'heart'
        ? ASSET_KEYS.uiNpcCueHeart
        : ASSET_KEYS.uiNpcCueStar;
    if (this.canUseFinalPropAsset(cueKey)) {
      this.add.image(x, y, cueKey).setDisplaySize(36, 36).setDepth(246);
    }
  }

  createFeedbackHud() {
    this.feedbackToast = this.add.text(18, 622, '', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#2c2119',
      backgroundColor: '#fff0c7',
      padding: { x: 10, y: 7 },
      wordWrap: { width: 430 },
    }).setScrollFactor(0).setDepth(960).setAlpha(0);

    this.evidencePanel = this.add.text(928, 596, '', {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#f4f1dc',
      backgroundColor: 'rgba(22,32,29,0.5)',
      padding: { x: 10, y: 8 },
      wordWrap: { width: 280 },
      lineSpacing: 3,
    }).setScrollFactor(0).setDepth(940);

    this.registry.events.on('act1:feedback', (entry) => this.showFeedback(entry));

    // ZuzuBucks counter (top-right) — earned on first quest/objective completion,
    // spent on upgrades. Pulses gold when it changes.
    this.zuzuBucksHud = this.add.text(this.scale.width - 16, 14, '', {
      fontFamily: 'Arial', fontSize: '18px', fontStyle: 'bold',
      color: '#2c2119', backgroundColor: '#ffd27a', padding: { x: 12, y: 7 },
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(965);
    this._renderZuzuBucks(this.runtime?.zuzuBucks || 0);
    this.registry.events.on('zuzubucks:changed', ({ total }) => this._renderZuzuBucks(total, true));

    this.createDiscoveryUi();
  }

  _renderZuzuBucks(total, pulse = false) {
    if (!this.zuzuBucksHud) return;
    this.zuzuBucksHud.setText(`◈ ${total} ZuzuBucks`).setPosition(this.scale.width - 16, 14);
    if (pulse) {
      this.zuzuBucksHud.setScale(1);
      this.tweens.add({ targets: this.zuzuBucksHud, scale: { from: 1.25, to: 1 }, duration: 320, ease: 'Back.easeOut' });
    }
  }

  // Phase 2.2 — Discovery Registry UI: a prominent "NEW DISCOVERY" banner on
  // each genuinely-new discovery, and a player-openable registry panel ([J]).
  createDiscoveryUi() {
    // The NEW DISCOVERY banner (center-top, eye-catching, transient).
    this.discoveryBanner = this.add.container(480, 96).setScrollFactor(0).setDepth(1300).setVisible(false);
    const bannerBg = this.add.rectangle(0, 0, 460, 64, 0x1b2a3a, 0.97).setStrokeStyle(3, 0xffd27a, 1);
    this.discoveryBannerTitle = this.add.text(0, -12, '✨ NEW DISCOVERY', { fontFamily: 'Arial', fontSize: '16px', color: '#ffd27a', fontStyle: 'bold' }).setOrigin(0.5);
    this.discoveryBannerText = this.add.text(0, 14, '', { fontFamily: 'Arial', fontSize: '14px', color: '#eaf6ff' }).setOrigin(0.5);
    this.discoveryBanner.add([bannerBg, this.discoveryBannerTitle, this.discoveryBannerText]);

    // The registry panel ([J] to open): discoveries grouped by category.
    this.discoveryPanel = this.add.container(150, 70).setScrollFactor(0).setDepth(985).setVisible(false);
    const panelBg = this.add.rectangle(0, 0, 560, 470, 0x12100a, 0.96).setOrigin(0, 0).setStrokeStyle(3, 0xc7e89a, 1);
    this.discoveryPanelTitle = this.add.text(20, 14, 'Discovery Registry', { fontFamily: 'Arial', fontSize: '20px', color: '#eafbe0', fontStyle: 'bold' });
    this.discoveryPanelSummary = this.add.text(20, 44, '', { fontFamily: 'Arial', fontSize: '13px', color: '#bcd6ac' });
    this.discoveryPanelBody = this.add.text(20, 74, '', { fontFamily: 'Arial', fontSize: '13px', color: '#e6f0d8', wordWrap: { width: 520 }, lineSpacing: 4 });
    this.discoveryPanelHint = this.add.text(20, 444, '[↑↓] scroll   ·   [J] close   ·   discoveries persist', { fontFamily: 'Arial', fontSize: '12px', color: '#9fc27a' });
    this.discoveryPanel.add([panelBg, this.discoveryPanelTitle, this.discoveryPanelSummary, this.discoveryPanelBody, this.discoveryPanelHint]);
    // Clip the growing list to the panel content area (screen space) so a long
    // list can't spill out below the panel into the world; scroll with up/down.
    this._discoveryBodyTop = 74;
    this._discoveryViewH = 435 - 74;        // visible height of the list region
    this._discoveryScroll = 0;
    const maskG = this.make.graphics({ x: 0, y: 0, add: false });
    maskG.fillStyle(0xffffff).fillRect(150 + 12, 70 + this._discoveryBodyTop, 560 - 24, this._discoveryViewH);
    this.discoveryPanelBody.setMask(maskG.createGeometryMask());
    // The panel is screen-fixed (scrollFactor 0) but the mask lives in world
    // space, so it must track the camera each frame to stay aligned.
    this.discoveryBodyMask = maskG;

    // One-time tutorial so the player learns the registry exists by playing
    // (not by knowing the J key in advance).
    this.discoveryTutorial = this.add.text(480, 150, '', {
      fontFamily: 'Arial', fontSize: '14px', color: '#12100a', backgroundColor: '#c7e89a',
      padding: { x: 12, y: 8 }, align: 'center',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(1299).setVisible(false);
    this._firstDiscoveryShown = false;
    this._saltRiverRevealed = false;

    // Exploration-triggered discovery: entering a new area logs a discovery by
    // PROXIMITY (no interaction prompt). The City Gate one matters — it reveals
    // the hidden Salt River expedition.
    this._exploredAreas = new Set();
    this._explorationAreas = [
      { id: 'landmark_city_gate', x: 1484, y: 514, r: 150, category: 'landmark', title: 'The City Gate', detail: 'The road out of the neighborhood — beyond it, the wider map and the Salt River.' },
      { id: 'landmark_desert_vista', x: 1030, y: 760, r: 120, category: 'landmark', title: 'Desert vista', detail: 'Open Sonoran desert south of the wash — creosote flats as far as you can see.' },
    ];

    this.registry.events.on('discovery:new', (entry) => this.onDiscoveryNew(entry));
    this.publishDiscoveryState();
  }

  // Phase 2.2 (Fun) — handle each new discovery: banner, first-time tutorial,
  // and any consequence (City Gate reveals the Salt River expedition).
  onDiscoveryNew(entry) {
    this.showDiscoveryBanner(entry);
    if (!this._firstDiscoveryShown) {
      this._firstDiscoveryShown = true;
      this.discoveryTutorial.setText('You logged a discovery!  Press [J] to open your field discoveries.').setVisible(true).setAlpha(0);
      this.tweens.add({ targets: this.discoveryTutorial, alpha: 1, duration: 200 });
      this.tweens.add({ targets: this.discoveryTutorial, alpha: 0, delay: 5200, duration: 500, onComplete: () => this.discoveryTutorial.setVisible(false) });
    }
    if (entry.id === 'landmark_city_gate') this.revealSaltRiverExpedition();
  }

  revealSaltRiverExpedition() {
    if (this._saltRiverRevealed) return;
    this._saltRiverRevealed = true;
    this.saltRiverMarker?.setVisible(true);
    if (this.saltRiverMarker) {
      this.tweens.add({ targets: this.saltRiverMarker, scale: { from: 0.2, to: this.saltRiverMarker.scale }, duration: 320, ease: 'Back.easeOut' });
    }
    this.showFeedback({ message: 'A new way opens — the Salt River expedition is on your map.' });
  }

  // ---- F2 Edit Mode: drag objects to rearrange, see names, SAVE + send to EB ----
  toggleEditMode() {
    if (this.editMode) this.exitEditMode(); else this.enterEditMode();
  }

  // Images/Sprites in the prop depth band (not background, not HUD), each with a
  // STABLE id (textureKey#n by display order) so saved positions survive reloads.
  // Every editable visual (props, NPCs, decor). Props live at the DEFAULT depth
  // (0) — the same depth as the background terrain grid — so we cannot filter by
  // a depth band (the old `d < 30` filter excluded every prop and left only the
  // depth-245 NPCs / depth-40 markers editable, which is why drag "only worked
  // on the npc"). Instead we exclude the repeated terrain tiles by key and the
  // HUD/overlays by depth, keeping everything else.
  _editableVisuals() {
    const out = [];
    const counts = {};
    // The neighbourhood floor is a grid of ~130 identical street tiles — that's
    // the background, not a movable object. Everything else is fair game.
    const TERRAIN_KEYS = new Set(['placeholder.street']);
    for (const c of this.children.list) {
      const isImg = c instanceof Phaser.GameObjects.Image || c instanceof Phaser.GameObjects.Sprite;
      if (!isImg) continue;
      const d = c.depth || 0;
      if (d >= 900) continue; // HUD / overlays / edit handles
      const key = c.texture?.key || 'sprite';
      if (['__MISSING', '__DEFAULT', '__WHITE'].includes(key)) continue;
      if (TERRAIN_KEYS.has(key)) continue; // background terrain grid
      const n = counts[key] = (counts[key] || 0) + 1;
      out.push({ obj: c, id: `${key}#${n}`, name: key });
    }
    return out;
  }

  // World-anchored name/label text (Mr. Chen, "materials table", …). These are
  // separate Text objects, not Image/Sprites, so they were never linked to a
  // drag group — that's why the character names did not track when dragged. HUD
  // text (scrollFactor 0) and overlays (depth >= 900) are excluded.
  _editableLabels() {
    const out = [];
    for (const c of this.children.list) {
      if (!(c instanceof Phaser.GameObjects.Text)) continue;
      if ((c.scrollFactorX ?? 1) === 0) continue;
      if ((c.depth || 0) >= 900) continue;
      out.push(c);
    }
    return out;
  }

  enterEditMode() {
    this.editMode = true;
    this._editHandles = [];
    this._editChanges = {};
    this.cameras.main.stopFollow(); // let arrows pan the camera

    const visuals = this._editableVisuals();
    // Kill idle (bob) tweens so dragged art actually moves and STAYS where dropped.
    for (const v of visuals) this.tweens.killTweensOf(v.obj);
    const unassigned = new Set(visuals.map((v) => v.obj));

    // One handle per interaction zone, carrying the zone AND the art on top of it
    // (so the visible object moves with the handle, not just the label).
    for (const zone of this.interactions.zones) {
      const linked = visuals.filter((v) => Math.hypot(v.obj.x - zone.x, v.obj.y - zone.y) <= 55);
      linked.forEach((v) => unassigned.delete(v.obj));
      this._makeEditHandle({ id: zone.id, x: zone.x, y: zone.y, zone, visuals: linked.map((v) => v.obj), color: 0x7fd1ff });
    }
    // Remaining (decorative) visuals each get their own handle, named by asset.
    for (const v of visuals) {
      if (!unassigned.has(v.obj)) continue;
      this._makeEditHandle({ id: v.id, x: v.obj.x, y: v.obj.y, zone: null, visuals: [v.obj], color: 0xffd27a });
    }

    // Attach each world-space name/label to the NEAREST group so it travels with
    // its object (fixes "the names of the characters did not track").
    const groups = this._editHandles.map((h) => h.handle.getData('editGroup'));
    for (const t of this._editableLabels()) {
      let best = null, bestD = 140;
      for (const g of groups) {
        const ax = g.zone ? g.zone.x : g.visuals[0]?.x;
        const ay = g.zone ? g.zone.y : g.visuals[0]?.y;
        if (ax == null) continue;
        const d = Math.hypot(t.x - ax, t.y - ay);
        if (d < bestD) { bestD = d; best = g; }
      }
      if (best) best.visuals.push(t);
    }

    this._editDragStart = (pointer, obj) => {
      const g = obj.getData('editGroup');
      if (!g) return;
      g._sx = obj.x; g._sy = obj.y;
      g._mem = (g.visuals || []).map((o) => ({ o, x: o.x, y: o.y }));
      g._zs = g.zone ? { x: g.zone.x, y: g.zone.y } : null;
    };
    this._editDrag = (pointer, obj, dragX, dragY) => {
      if (!this.editMode) return;
      const g = obj.getData('editGroup');
      if (!g) return;
      const dx = dragX - g._sx, dy = dragY - g._sy;
      obj.x = dragX; obj.y = dragY;
      for (const m of g._mem || []) { m.o.x = m.x + dx; m.o.y = m.y + dy; }
      if (g.zone && g._zs) { g.zone.x = g._zs.x + dx; g.zone.y = g._zs.y + dy; }
      g.label?.setText(`${g.id}\n(${Math.round(dragX)}, ${Math.round(dragY)})`).setPosition(dragX + 16, dragY - 12);
      this._editChanges[g.id] = { id: g.id, kind: g.zone ? 'zone' : 'prop', x: Math.round(dragX), y: Math.round(dragY) };
      this._publishEditLayout();
    };
    this.input.on('dragstart', this._editDragStart);
    this.input.on('drag', this._editDrag);

    this.editBanner = this.add.text(this.scale.width / 2, 12,
      '✎ EDIT MODE — drag to move · arrows pan · [S] save · [X] send to EB · [F2] exit',
      { fontFamily: 'Arial', fontSize: '14px', color: '#0a0f14', backgroundColor: '#ffd27a', padding: { x: 10, y: 6 } })
      .setOrigin(0.5, 0).setScrollFactor(0).setDepth(2002);
    this._editSaveKey = () => this.saveEditLayout();
    this._editExportKey = () => this.exportEditLayout();
    this.input.keyboard.on('keydown-S', this._editSaveKey);
    this.input.keyboard.on('keydown-X', this._editExportKey);
    this._publishEditLayout();
    this.showFeedback({ message: `Edit Mode: ${this._editHandles.length} objects. Drag to move · arrows pan · S save · X send to EB.` });
  }

  _makeEditHandle({ id, x, y, zone, visuals, color }) {
    const handle = this.add.rectangle(x, y, 26, 26, color, 0.35).setStrokeStyle(2, color, 1).setDepth(2000);
    const label = this.add.text(x + 16, y - 12, `${id}\n(${Math.round(x)}, ${Math.round(y)})`,
      { fontFamily: 'Arial', fontSize: '10px', color: '#eaf6ff', backgroundColor: 'rgba(8,16,24,0.8)', padding: { x: 3, y: 2 } }).setDepth(2001);
    const group = { id, zone, visuals, label };
    handle.setData('editGroup', group);
    handle.setInteractive({ useHandCursor: true });
    this.input.setDraggable(handle);
    this._editHandles.push({ handle, label });
  }

  exitEditMode() {
    this.editMode = false;
    if (this._editDragStart) this.input.off('dragstart', this._editDragStart);
    if (this._editDrag) this.input.off('drag', this._editDrag);
    if (this._editSaveKey) this.input.keyboard.off('keydown-S', this._editSaveKey);
    if (this._editExportKey) this.input.keyboard.off('keydown-X', this._editExportKey);
    for (const h of this._editHandles || []) { h.label?.destroy(); h.handle?.destroy(); }
    this._editHandles = [];
    this.editBanner?.destroy();
    this.editBanner = null;
    if (this.player) this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.showFeedback({ message: 'Edit Mode off.' });
  }

  _publishEditLayout() {
    if (typeof window === 'undefined') return;
    window.__EDIT_LAYOUT__ = { scene: 'NeighborhoodScene', changes: Object.values(this._editChanges || {}), at: Date.now() };
  }

  // SAVE: persist edits to localStorage (merged with prior saves) so they survive
  // a page reload. Applied on the next load by applyLayoutOverrides().
  saveEditLayout() {
    const merged = {};
    try {
      for (const c of JSON.parse(window.localStorage.getItem('bikebrowser_layout_overrides_v2') || '[]')) merged[c.id] = c;
    } catch { /* noop */ }
    for (const c of Object.values(this._editChanges || {})) merged[c.id] = c;
    const all = Object.values(merged);
    try {
      window.localStorage.setItem('bikebrowser_layout_overrides_v2', JSON.stringify(all));
      this.showFeedback({ message: `Saved ${all.length} placement(s) — they persist across reloads.` });
    } catch {
      this.showFeedback({ message: 'Save failed (localStorage unavailable).' });
    }
    this._publishEditLayout();
  }

  // Apply saved placements once on load: move each zone (and the art on it) and
  // each standalone prop to its saved position.
  applyLayoutOverrides() {
    let changes = [];
    try { changes = JSON.parse(window.localStorage.getItem('bikebrowser_layout_overrides_v2') || '[]'); } catch { return; }
    if (!Array.isArray(changes) || !changes.length) return;
    const visuals = this._editableVisuals();
    const labels = this._editableLabels();
    const byId = {};
    for (const v of visuals) byId[v.id] = v.obj;
    for (const c of changes) {
      if (c.kind === 'zone') {
        const zone = this.interactions.zones.find((z) => z.id === c.id);
        if (!zone) continue;
        const dx = c.x - zone.x, dy = c.y - zone.y;
        const linked = visuals.filter((v) => Math.hypot(v.obj.x - zone.x, v.obj.y - zone.y) <= 55);
        const nearLabels = labels.filter((t) => Math.hypot(t.x - zone.x, t.y - zone.y) <= 140);
        zone.x = c.x; zone.y = c.y;
        for (const v of linked) { this.tweens.killTweensOf(v.obj); v.obj.x += dx; v.obj.y += dy; }
        for (const t of nearLabels) { t.x += dx; t.y += dy; }
      } else {
        const obj = byId[c.id];
        if (obj) {
          const dx = c.x - obj.x, dy = c.y - obj.y;
          const nearLabels = labels.filter((t) => Math.hypot(t.x - obj.x, t.y - obj.y) <= 110);
          this.tweens.killTweensOf(obj); obj.x = c.x; obj.y = c.y;
          for (const t of nearLabels) { t.x += dx; t.y += dy; }
        }
      }
    }
  }

  // SEND TO EB: export the current edits (window mirror + clipboard + download).
  exportEditLayout() {
    const changes = Object.values(this._editChanges || {});
    this._publishEditLayout();
    const json = JSON.stringify({ scene: 'NeighborhoodScene', changes }, null, 2);
    try { navigator.clipboard?.writeText(json); } catch { /* noop */ }
    try {
      const blob = new Blob([json], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'bikebrowser_layout_edits.json';
      a.click();
      URL.revokeObjectURL(a.href);
    } catch { /* noop */ }
    this.showFeedback({ message: `Sent ${changes.length} change(s) to EB — window.__EDIT_LAYOUT__ + clipboard + download.` });
  }

  // Proximity check: log an exploration discovery when the player first enters
  // an area. Runs each frame; cheap (a few distance checks).
  checkExplorationDiscovery() {
    if (!this.player || !this.runtime) return;
    for (const area of this._explorationAreas || []) {
      if (this._exploredAreas.has(area.id)) continue;
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, area.x, area.y) <= area.r) {
        this._exploredAreas.add(area.id);
        this.runtime.registerDiscovery({ id: area.id, category: area.category, title: area.title, detail: area.detail, source: 'exploration' });
      }
    }
  }

  showDiscoveryBanner(entry) {
    if (!this.discoveryBanner) return;
    this.discoveryBannerText.setText(entry.title);
    this.discoveryBanner.setVisible(true).setAlpha(0);
    this.tweens.killTweensOf(this.discoveryBanner);
    this.tweens.add({ targets: this.discoveryBanner, alpha: 1, y: 104, duration: 180, ease: 'Back.easeOut', yoyo: false });
    this.tweens.add({ targets: this.discoveryBanner, alpha: 0, delay: 2200, duration: 400, onComplete: () => this.discoveryBanner.setVisible(false) });
    if (this.discoveryPanel?.visible) this.refreshDiscoveryPanel();
    this.publishDiscoveryState();
  }

  toggleDiscoveryPanel() {
    const next = !this.discoveryPanel.visible;
    this.discoveryPanel.setVisible(next);
    if (next) {
      this.refreshDiscoveryPanel();
      this.runtime?.discoveryRegistry?.markSeen();
    }
    this.publishDiscoveryState();
  }

  refreshDiscoveryPanel() {
    const state = this.runtime?.discoveryRegistry?.getState();
    if (!state) return;
    this.discoveryPanelSummary.setText(`${state.total} discoveries  ·  ` + state.categories.filter((c) => c.count).map((c) => `${c.label} ${c.count}`).join('  ·  '));
    const lines = [];
    for (const cat of state.categories) {
      const items = state.byCategory[cat.category];
      if (!items.length) continue;
      lines.push(`▸ ${cat.label}`);
      for (const it of items) lines.push(`   • ${it.title}${it.isNew ? '  (new)' : ''}`);
    }
    this.discoveryPanelBody.setText(lines.join('\n') || 'Nothing discovered yet. Explore, observe, test, and investigate.');
    this._discoveryScroll = 0;
    this.discoveryPanelBody.y = this._discoveryBodyTop;
  }

  _scrollDiscovery(delta) {
    if (!this.discoveryPanel?.visible || !this.discoveryPanelBody) return;
    const overflow = Math.max(0, this.discoveryPanelBody.height - this._discoveryViewH);
    this._discoveryScroll = Phaser.Math.Clamp(this._discoveryScroll + delta, 0, overflow);
    this.discoveryPanelBody.y = this._discoveryBodyTop - this._discoveryScroll;
  }

  publishDiscoveryState() {
    const state = this.runtime?.discoveryRegistry?.getState() || { total: 0, categories: [], last: null };
    window.__DISCOVERY__ = {
      open: Boolean(this.discoveryPanel?.visible),
      bannerVisible: Boolean(this.discoveryBanner?.visible),
      total: state.total,
      categories: state.categories,
      last: state.last,
    };
  }

  createWorldMapHud() {
    const layout = this.layout.world_map_hud;
    this.worldMapHud = this.add.container(layout.x, layout.y).setScrollFactor(0).setDepth(955);
    this.worldMapHudExpanded = false;
    this.worldMapHudUserPinned = false;
    this.worldMapHudSignature = '';
    this.worldMapAutoCollapseTimer = null;
    this.worldMapHudState = {
      visible: true,
      expanded: false,
      currentLocation: 'street',
      discovered: [],
      lockedDestinations: [],
      unlockedDestinations: [],
      activeQuestMarker: 'dry_wash',
      routeSummary: 'You: Street -> Quest: Dry Wash -> 3 locked later',
    };
    this.worldMapFrame = this.canUseFinalPropAsset(ASSET_KEYS.uiMapFrame)
      ? this.add.image(layout.w / 2, layout.h / 2, ASSET_KEYS.uiMapFrame)
        .setDisplaySize(layout.w, layout.h)
        .setAlpha(0.98)
      : null;
    this.worldMapGraphics = this.createWorldMapRouteVisualization();
    this.worldMapVista = this.canUseFinalPropAsset(ASSET_KEYS.propClarityWorldScaleVista)
      ? this.add.image(layout.vista_backplate.x, layout.vista_backplate.y, ASSET_KEYS.propClarityWorldScaleVista)
        .setDisplaySize(layout.vista_backplate.w, layout.vista_backplate.h)
        .setAlpha(layout.vista_backplate.alpha)
      : null;
    this.worldMapGpsDevice = this.canUseFinalPropAsset(ASSET_KEYS.propClarityGpsPost)
      ? this.add.image(layout.gps_device.x, layout.gps_device.y, ASSET_KEYS.propClarityGpsPost)
        .setDisplaySize(layout.gps_device.w, layout.gps_device.h)
        .setAlpha(layout.gps_device.alpha)
      : null;
    this.worldMapTitle = this.add.text(layout.title.x, layout.title.y, 'Zuzu GPS', {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#ffe8aa',
      fontStyle: 'bold',
    });
    this.worldMapSubtitle = this.add.text(layout.subtitle.x, layout.subtitle.y, 'Arizona city routes', {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#b8d9d0',
      wordWrap: { width: layout.subtitle.w },
      lineSpacing: 1,
    });
    this.worldMapToggleHint = this.add.text(layout.toggle_hint.x, layout.toggle_hint.y, 'G open', {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: '#fff0c7',
      backgroundColor: 'rgba(22,32,29,0.4)',
      padding: { x: 5, y: 3 },
    });
    this.worldMapStatusLabels = layout.status_items.map((item) => this.add.text(item.x, item.y, item.label, {
      fontFamily: 'Arial',
      fontSize: '9px',
      color: '#e4efea',
    }));
    this.worldMapCurrentBadge = this.add.text(0, 0, layout.badges.current.text, {
      fontFamily: 'Arial',
      fontSize: '9px',
      color: '#203029',
      fontStyle: 'bold',
      backgroundColor: '#f2c46d',
      padding: { x: 4, y: 2 },
    }).setVisible(false);
    this.worldMapQuestBadge = this.add.text(0, 0, layout.badges.quest.text, {
      fontFamily: 'Arial',
      fontSize: '9px',
      color: '#203029',
      fontStyle: 'bold',
      backgroundColor: '#fff0c7',
      padding: { x: 4, y: 2 },
    }).setVisible(false);
    this.worldMapLegend = this.add.text(layout.legend.x, layout.legend.y, '', {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#f6e6b4',
      wordWrap: { width: layout.legend.w },
      lineSpacing: 2,
    });
    this.worldMapPointLabels = layout.labels.items.map((item) => this.add.text(item.x, item.y, '', {
      fontFamily: 'Arial',
      fontSize: '9px',
      color: '#f4f1dc',
    }));
    this.worldMapRouteMarkerIcons = {};
    this.worldMapLandmarkIcons = {};
    if (this.canUseFinalPropAsset(ASSET_KEYS.propClarityRouteMarkerSet)) {
      for (const id of Object.keys(layout.points)) {
        this.worldMapRouteMarkerIcons[id] = this.add.image(0, 0, ASSET_KEYS.propClarityRouteMarkerSet)
          .setDisplaySize(layout.route_marker_sheet.displayW, layout.route_marker_sheet.displayH)
          .setVisible(false);
      }
    }
    if (this.canUseFinalPropAsset(ASSET_KEYS.propClaritySonoranLandmarkSet)) {
      for (const id of Object.keys(layout.points)) {
        this.worldMapLandmarkIcons[id] = this.add.image(0, 0, ASSET_KEYS.propClaritySonoranLandmarkSet)
          .setDisplaySize(layout.landmark_sheet.displayW, layout.landmark_sheet.displayH)
          .setVisible(false);
      }
    }
    this.worldMapHud.add([
      ...(this.worldMapFrame ? [this.worldMapFrame] : []),
      this.worldMapGraphics,
      ...(this.worldMapVista ? [this.worldMapVista] : []),
      ...(this.worldMapGpsDevice ? [this.worldMapGpsDevice] : []),
      ...Object.values(this.worldMapLandmarkIcons),
      ...Object.values(this.worldMapRouteMarkerIcons),
      this.worldMapTitle,
      this.worldMapSubtitle,
      this.worldMapToggleHint,
      this.worldMapLegend,
      ...this.worldMapStatusLabels,
      this.worldMapCurrentBadge,
      this.worldMapQuestBadge,
      ...this.worldMapPointLabels,
    ]);
    this.worldMapHitZone = this.add.zone(
      layout.w / 2,
      layout.h / 2,
      layout.w,
      layout.h,
    ).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });
    this.worldMapHud.add(this.worldMapHitZone);
    this.worldMapHitZone.on('pointerdown', () => this.toggleWorldMapHud(true));
    this.setWorldMapHudExpanded(false);
    // Keep the map anchored to the bottom-left if the window resizes.
    this.scale.on('resize', () => this.setWorldMapHudExpanded(this.worldMapHudExpanded));
  }

  createWorldMapRouteVisualization() {
    return this.add.graphics();
  }

  update(_time, delta) {
    // Keep the discovery-list clip mask aligned with the screen-fixed panel.
    if (this.discoveryBodyMask) {
      this.discoveryBodyMask.x = this.cameras.main.scrollX;
      this.discoveryBodyMask.y = this.cameras.main.scrollY;
    }
    // Apply any saved layout placements once, after all objects exist.
    if (!this._overridesApplied) {
      this._overridesApplied = true;
      try { this.applyLayoutOverrides(); } catch { /* noop */ }
    }
    // In edit mode the arrows pan the camera (player is frozen) so every object
    // is reachable for dragging.
    if (this.editMode) {
      const pan = this.inputSystem.getMovementVector();
      const cam = this.cameras.main;
      cam.scrollX += pan.x * 10;
      cam.scrollY += pan.y * 10;
    }
    // Phase 1.9.2: when a modal overlay (prediction) is open, freeze the player
    // and ignore world interactions so its keys drive the overlay, not the scene.
    // Edit mode (F2) freezes the player like a modal so dragging objects does
    // not also move Zuzu or fire interactions.
    const modal = Boolean(this.registry.get('modalActive')) || this.editMode;
    // The key that closes a modal must not also re-trigger the world interaction
    // on the next frame (which would reopen the modal). Consume it.
    const justClosedModal = this._wasModal && !modal;
    this._wasModal = modal;
    // Freeze movement while the discovery list is open (so up/down scroll it
    // instead of walking), but DON'T gate input as modal — J must still close it.
    const movement = (modal || this.discoveryPanel?.visible) ? { x: 0, y: 0 } : this.inputSystem.getMovementVector();
    const speed = 178;
    const length = Math.hypot(movement.x, movement.y) || 1;
    const targetX = (movement.x / length) * speed;
    const targetY = (movement.y / length) * speed;
    const smoothing = movement.x || movement.y ? 0.18 : 0.28;
    this.currentVelocity.x = Phaser.Math.Linear(this.currentVelocity.x, targetX, smoothing);
    this.currentVelocity.y = Phaser.Math.Linear(this.currentVelocity.y, targetY, smoothing);
    this.player.setVelocity(this.currentVelocity.x, this.currentVelocity.y);
    this.updatePlayerAnimation(_time, movement);

    // Exploration-triggered discovery (proximity, not a prompt).
    this.checkExplorationDiscovery();

    let nearest = this.interactions.nearest(this.player);
    // The Salt River expedition is a hidden opportunity until the City Gate is
    // discovered — skip it (no prompt, no interaction) while still hidden.
    if (nearest && nearest.id === 'salt_river_expedition' && !this._saltRiverRevealed) {
      nearest = null;
    }
    if (nearest) {
      this.prompt.setVisible(true);
      this.prompt.setText(`[E] ${nearest.label}`);
      this.prompt.setPosition(nearest.x - 76, nearest.y - 88);
      if (this.lastNearestId !== nearest.id) {
        this.lastNearestId = nearest.id;
        this.prompt.setAlpha(0.15);
        this.tweens.add({ targets: this.prompt, alpha: 1, duration: 140, ease: 'Sine.easeOut' });
      }
      if (!modal && !justClosedModal && this.inputSystem.interactionJustPressed()) {
        if (nearest.action === 'utm') {
          // Phase 1.9.2: prediction gates testing (arc.md). The UTM opens the
          // player-facing predict-before-test flow instead of batch-testing.
          const materials = [...(this.runtime?.materialsLabSystem?.materials?.keys?.() || [])].filter((id) => this.runtime?.inventorySystem?.has(id));
          this.registry.events.emit('prediction:start', materials);
        } else if (nearest.action === 'bridge_plan') {
          // Phase 1.9.3: the player designs the bridge (choose a material per
          // role) and sees it hold or fail, instead of an auto-completed plan.
          this.registry.events.emit('bridgeDesign:start');
        } else if (nearest.action === 'investigate_wash') {
          // Phase 1.9.4: the player runs the washout investigation by hand —
          // choose a hypothesis, see the evidence disprove a wrong guess.
          this.registry.events.emit('investigation:start', 'wash_out_cause');
        } else if (nearest.action === 'ecology_garden') {
          // Phase 2.1: the player observes a site, predicts which plant thrives,
          // sees the outcome, and learns why — observe→predict→outcome→payoff.
          this.registry.events.emit('ecology:start');
        } else if (nearest.action === 'salt_river_expedition') {
          // Phase 2.4: enter the Salt River biome (gated behind the wider map;
          // the scene shows a locked panel until the bridge is repaired).
          this.registry.events.emit('biome:start', 'salt_river');
        } else if (nearest.id === 'neighbor') {
          // Mrs. Ramirez is ONE NPC with two beats. Previously a second
          // `spanish_neighbor` zone was stacked at her exact coords, so
          // nearest() could never reach it ("Thank Mrs. Ramirez" was dead).
          // Now this single zone is progression-aware: the wash intro first
          // (completes talk_neighbor), then the thank-you (spanish_trust, which
          // on close completes spanish_neighbor + adds trust + unlocks Spanish)
          // once the intro is done. The dialogue's own effects do the work, so
          // we route the right one rather than calling handleInteraction twice.
          // Congruence: the thank-you names the repair ("helped us trust the
          // repair"), so it must wait for the crossing to actually hold — not
          // merely for the wash intro. Before the repair she stays in concern.
          const introDone = this.runtime?.questSystem?.isObjectiveComplete('talk_neighbor');
          const bridgeRepaired = Boolean(this.runtime?.constructionSystem?.bridgeReconnected);
          if (!this.registry.get('dialogueActive')) this.registry.events.emit('dialogue:start', introDone && bridgeRepaired ? 'spanish_trust' : 'wash_neighbor');
        } else if (nearest.id === 'arabic_mentor') {
          // Auntie Mariam: a warm welcome before the repair; the "you brought
          // proof" gratitude (which completes arabic_mentor + adds trust) only
          // once the crossing holds — otherwise she praises work not yet done.
          const bridgeRepaired = Boolean(this.runtime?.constructionSystem?.bridgeReconnected);
          if (bridgeRepaired) {
            this.runtime?.handleInteraction('arabic_mentor');
            this.registry.events.emit('quest:changed');
          }
          if (!this.registry.get('dialogueActive')) this.registry.events.emit('dialogue:start', bridgeRepaired ? 'arabic_welcome' : 'arabic_intro');
        } else if (nearest.action) {
          this.runtime?.handleInteraction(nearest.action);
          this.registry.events.emit('quest:changed');
          // Phase 6 — repairing the bridge (player path) plays the Community
          // Crossing cutscene. Debug repairBridge() (e2e) does not route here.
          if (nearest.action === 'repair_bridge' && this.runtime?.constructionSystem?.bridgeReconnected) {
            this.registry.events.emit('crossing:start');
          }
        }
        if (nearest.dialogueId && nearest.id !== 'neighbor' && nearest.id !== 'arabic_mentor' && !this.registry.get('dialogueActive')) {
          // State-aware NPC dialogue: e.g. Mr. Chen stops saying the bridge is
          // closed once it is repaired. Resolve the line at interaction time.
          let dialogueId = nearest.dialogueId;
          if (nearest.id === 'mr_chen' && this.runtime?.constructionSystem?.bridgeReconnected) {
            dialogueId = 'mr_chen_bridge_repaired';
          }
          this.registry.events.emit('dialogue:start', dialogueId);
        }
      }
    } else {
      this.prompt.setVisible(false);
      this.lastNearestId = null;
    }

    this.registry.set('playerPosition', { x: this.player.x, y: this.player.y });
    this.publishTestReadiness();

    if (!modal && this.inputSystem.notebookJustPressed()) {
      this.toggleNotebook();
    }
    if (!modal && this.inputSystem.gpsJustPressed()) {
      this.toggleWorldMapHud(true);
    }
    if (!modal && this.inputSystem.journalJustPressed()) {
      this.toggleDiscoveryPanel();
    }
    this.updateEvidencePanel();
  }

  publishTestReadiness() {
    if (typeof window === 'undefined') return;
    const captureState = () => {
      const camera = this.cameras?.main;
      return {
        ready: true,
        sceneKey: this.scene.key,
        timestamp: Date.now(),
        playerPosition: this.player ? { x: this.player.x, y: this.player.y } : null,
        playerFacing: this.playerFacing || null,
        playerAnimation: this.player?.anims?.currentAnim?.key || null,
        camera: camera ? {
          scrollX: camera.scrollX,
          scrollY: camera.scrollY,
          zoom: camera.zoom,
        } : null,
        world: {
          width: this.worldWidth,
          height: this.worldHeight,
        },
        loadedTextures: this.textures?.getTextureKeys?.() || [],
        characterVisuals: this.characterVisuals || null,
        worldMapHud: {
          visible: Boolean(this.worldMapHud?.visible),
          expanded: Boolean(this.worldMapHudExpanded),
          unlocked: Boolean(this.runtime?.discoveryMapSystem?.widerMapUnlocked),
          state: this.worldMapHudState || null,
        },
      };
    };
    window.__bikebrowserRebuildReady = true;
    window.BIKEBROWSER_READY = true;
    window.BIKEBROWSER_SCENE_READY = captureState();
    window.BIKEBROWSER_TEST_BRIDGE = {
      isReady: () => window.BIKEBROWSER_READY === true,
      getActiveScene: () => this.scene.key,
      getSceneState: captureState,
      getLoadedAssets: () => captureState().loadedTextures,
      captureRuntimeSummary: captureState,
    };
  }

  updatePlayerAnimation(time, movement) {
    const isMoving = Math.abs(movement.x) > 0.01 || Math.abs(movement.y) > 0.01;
    if (isMoving) {
      if (Math.abs(movement.x) > Math.abs(movement.y)) {
        this.playerFacing = movement.x < 0 ? 'left' : 'right';
      } else {
        this.playerFacing = movement.y < 0 ? 'up' : 'down';
      }
    }
    const targetAnim = `zuzu.${isMoving ? 'walk' : 'idle'}.${this.playerFacing || 'down'}`;
    if (this.anims.exists(targetAnim) && this.player.anims?.currentAnim?.key !== targetAnim) {
      this.player.play(targetAnim);
    }
    this.player.setFlipX(false);
    const pulse = isMoving ? Math.sin(time / 72) * 0.035 : Math.sin(time / 420) * 0.012;
    this.player.setScale(this.characterVisuals.playerScale, this.characterVisuals.playerScale + pulse);
    this.playerVisualState = {
      textureKey: this.player.texture.key,
      scale: this.characterVisuals.playerScale,
      animation: this.player.anims?.currentAnim?.key || null,
      facing: this.playerFacing || 'down',
      moving: isMoving,
    };
  }

  toggleNotebook() {
    const nextVisible = !this.notebookPanel.visible;
    this.notebookPanel.setVisible(nextVisible);
    this.runtime?.audioSystem.playInteractionCue(nextVisible ? 'notebook_open' : 'notebook_close');
    if (!nextVisible) return;
    this.refreshNotebook();
    this.runtime?.notebookSystem.markSeen();
  }

  toggleWorldMapHud(userInitiated = false) {
    this.setWorldMapHudExpanded(!this.worldMapHudExpanded, userInitiated);
    this.runtime?.audioSystem.playInteractionCue(this.worldMapHudExpanded ? 'notebook_open' : 'notebook_close');
  }

  setWorldMapHudExpanded(expanded, userInitiated = false) {
    this.worldMapHudExpanded = Boolean(expanded);
    if (userInitiated) this.worldMapHudUserPinned = this.worldMapHudExpanded;
    if (this.worldMapAutoCollapseTimer && !this.worldMapHudExpanded) {
      this.worldMapAutoCollapseTimer.remove(false);
      this.worldMapAutoCollapseTimer = null;
    }
    const layout = this.layout.world_map_hud;
    const w = this.worldMapHudExpanded ? layout.w : (layout.collapsedW || 236);
    const h = this.worldMapHudExpanded ? layout.h : (layout.collapsedH || 58);
    // Anchor the map to the BOTTOM-LEFT of the actual screen so it grows upward
    // out of the corner instead of floating over the play area.
    const margin = layout.screen_margin;
    const marginX = margin.x;
    const marginBottom = this.worldMapHudExpanded ? margin.bottom : margin.collapsedBottom;
    const scale = Math.min(1, (this.scale.width - marginX * 2) / w, (this.scale.height - marginBottom * 2) / h);
    const anchorY = Math.max(marginBottom, this.scale.height - h * scale - marginBottom);
    this.worldMapHud?.setPosition(marginX, anchorY);
    this.worldMapHud?.setScale(scale);
    this.worldMapHitZone?.setSize(w, h);
    this.worldMapHitZone?.setPosition(w / 2, h / 2);
    this.worldMapFrame
      ?.setVisible(this.worldMapHudExpanded)
      .setPosition(layout.w / 2, layout.h / 2)
      .setDisplaySize(layout.w, layout.h);
    this.worldMapToggleHint?.setText(this.worldMapHudExpanded ? 'G close' : 'G open');
  }

  temporarilyOpenWorldMapHud(duration = 4200) {
    if (this.worldMapHudUserPinned) return;
    this.setWorldMapHudExpanded(true, false);
    this.worldMapAutoCollapseTimer?.remove(false);
    this.worldMapAutoCollapseTimer = this.time.delayedCall(duration, () => {
      if (!this.worldMapHudUserPinned) this.setWorldMapHudExpanded(false, false);
    });
  }

  refreshNotebook() {
    const state = this.runtime?.notebookSystem.getState();
    const entries = (state?.entries.filter((entry) => entry.unlocked) || [])
      .sort((a, b) => (a.unlockedIndex ?? 0) - (b.unlockedIndex ?? 0));
    const categoryLine = Object.entries(state?.categories || {})
      .filter(([, counts]) => counts.unlocked > 0)
      .slice(0, 5)
      .map(([category, counts]) => `${category} ${counts.unlocked}`)
      .join('  •  ');
    const recent = entries.slice(-2).map((entry) => {
      const body = entry.body.length > 52 ? `${entry.body.slice(0, 49)}...` : entry.body;
      return `${entry.isNew ? '★' : '•'} ${entry.title}\n   ${body}`;
    }).join('\n\n');
    this.notebookHeader.setText(`Zuzu's Field Notebook  ${entries.length}/${state?.entries.length || 0} clues`);
    this.notebookCategoryText.setText(categoryLine || 'Follow clues: observe, test, compare.');
    this.notebookCardsText.setText(recent || 'No entries yet.\n\nStart with the bike, then follow what the neighborhood shows you.');
  }

  showFeedback(entry) {
    if (!entry?.message) return;
    this.feedbackToast.setText(entry.message);
    this.feedbackToast.setAlpha(0);
    this.tweens.killTweensOf(this.feedbackToast);
    this.tweens.add({
      targets: this.feedbackToast,
      alpha: 1,
      duration: 150,
      ease: 'Sine.easeOut',
      yoyo: true,
      hold: 1600,
    });
    if (this.notebookPanel.visible) this.refreshNotebook();
  }

  _setWashBarrier(blocking) {
    if (blocking) {
      if (this.washCollider) this.washCollider.active = true;
      if (this.washBarrier?.body) this.washBarrier.body.enable = true;
      return;
    }
    // Crossable: remove the collider + barrier outright (the bridge never
    // un-repairs, and removeCollider is the reliable way to drop arcade collision).
    if (this.washCollider) { this.physics.world.removeCollider(this.washCollider); this.washCollider = null; }
    if (this.washBarrier) { this.washBarrier.destroy(); this.washBarrier = null; }
  }

  updateEvidencePanel() {
    const state = this.runtime?.getAct1State();
    if (!state) return;
    // The wash becomes crossable only once the bridge is reconnected.
    this._setWashBarrier(!state.bridge.bridgeReconnected);
    if (this.bridgeSprite) {
      const bridgeDebris = this.layout.bridge_debris;
      this.bridgeSprite.setTexture(state.bridge.bridgeReconnected
        ? ASSET_KEYS.bridgeRepaired
        : this.provenancedTextureOrFallback(ASSET_KEYS.propReplacementBridgeDebris, ASSET_KEYS.bridgeBroken));
      this.bridgeSprite.setDisplaySize(
        state.bridge.bridgeReconnected ? bridgeDebris.repairedW : bridgeDebris.brokenW,
        state.bridge.bridgeReconnected ? bridgeDebris.repairedH : bridgeDebris.brokenH,
      );
    }
    if (this.bridgePayoffGlow) {
      this.bridgePayoffGlow.setAlpha(state.bridge.bridgeReconnected ? 0.28 : 0);
      this.bridgePayoffText?.setVisible(Boolean(state.bridge.bridgeReconnected));
      this.bridgeBeforeAfterTag?.setText(state.bridge.bridgeReconnected ? 'safe crossing' : 'broken wash');
      if (state.bridge.bridgeReconnected && !this.bridgeCelebrationShown) this.createBridgeCelebration();
    }
    this.updateEmbodiedWorldFeedback(state);
    const latestTest = state.bridge.bridgeReconnected ? null : state.materialTests.tested.at(-1);
    if (latestTest) this.updateUtmVisualizer(latestTest);
    else this.resetUtmVisualizer();
    const clue = state.feedback.last?.message || 'Start with the bike, then follow the wash.';
    const bridge = state.bridge.bridgeReconnected ? 'The crossing is safe again.' : state.bridge.plan ? 'The bridge plan is ready.' : 'The bridge needs tested proof.';
    const map = state.discovery.widerMapUnlocked ? 'A wider map clue is open.' : `${state.discovery.discovered.length} places mapped.`;
    this.updateWorldMapHud(state);
    const lines = [
      'Current clue',
      clue,
      map,
    ];
    if (latestTest) lines.splice(2, 0, `${latestTest.displayName}: ${latestTest.strengthBand}`, bridge);
    if (!latestTest && !clue.includes(bridge)) lines.splice(2, 0, bridge);
    this.evidencePanel.setText(lines.join('\n'));
  }

  updateWorldMapHud(state) {
    if (!this.worldMapGraphics || !state?.discovery || !this.player) return;
    const layout = this.layout.world_map_hud;
    const discovered = new Set(state.discovery.discovered || []);
    const currentLocation = this.nearestMapLocationId();
    const activeQuestMarker = state.bridge.bridgeReconnected ? 'wider_gate' : discovered.has('dry_wash') ? 'bridge' : 'dry_wash';
    const locations = this.getWorldMapLocations(state);
    const lockedDestinations = locations.filter((location) => location.locked).map((location) => location.id);
    const unlockedDestinations = locations.filter((location) => !location.locked).map((location) => location.id);
    const knownCount = locations.filter((location) => !location.locked && (discovered.has(location.id) || location.alwaysKnown)).length;
    const routeSummary = this.buildWorldMapRouteSummary(currentLocation, activeQuestMarker, lockedDestinations);
    const nextText = state.discovery.widerMapUnlocked
      ? 'Next: Salt River and Copper Mine routes are on the horizon.'
      : `Quest marker: ${this.locationLabel(activeQuestMarker)}. Wider city still locked.`;

    this.worldMapHudState = {
      visible: Boolean(this.worldMapHud?.visible),
      expanded: this.worldMapHudExpanded,
      currentLocation,
      discovered: [...discovered],
      lockedDestinations,
      unlockedDestinations,
      activeQuestMarker,
      widerMapUnlocked: state.discovery.widerMapUnlocked,
      routeSummary,
    };
    // Phase 2.3 — publish the functional map state EVERY frame (before any
    // collapsed/expanded early-returns below), so Current/Reachable/Locked is
    // always live for the player and for reachability specs.
    this.runtime?.setCurrentLocation(currentLocation);
    this._worldMap = this.runtime?.getWorldMap?.();
    if (this._worldMap) {
      window.__WORLDMAP__ = {
        open: Boolean(this.worldMapHud?.visible && this.worldMapHudExpanded),
        current: this._worldMap.current,
        currentLabel: this._worldMap.currentLabel,
        reachable: this._worldMap.reachable.map((l) => l.id),
        locked: this._worldMap.locked.map((l) => l.id),
        undiscovered: this._worldMap.undiscovered.map((l) => l.id),
        quest: activeQuestMarker,
        questLabel: this.locationLabel(activeQuestMarker),
        routeSummary,
        widerMapUnlocked: this._worldMap.widerMapUnlocked,
        counts: this._worldMap.counts,
      };
    }

    // Only auto-open the map for a genuinely map-worthy event — the wider map
    // unlocking — NOT on every region crossing (that popped the HUD constantly as
    // the player simply walked between areas). Crossing/quest/discovery changes no
    // longer force the map open; the player opens it with G when they want it.
    const signature = state.discovery.widerMapUnlocked ? 'wide' : 'local';
    if (!this.worldMapHudSignature) this.worldMapHudSignature = signature;
    else if (signature !== this.worldMapHudSignature) {
      this.worldMapHudSignature = signature;
      this.temporarilyOpenWorldMapHud();
    }

    const g = this.worldMapGraphics;
    g.clear();
    const mapChildren = [
      this.worldMapVista,
      this.worldMapGpsDevice,
      this.worldMapLegend,
      this.worldMapCurrentBadge,
      this.worldMapQuestBadge,
      ...this.worldMapStatusLabels,
      ...this.worldMapPointLabels,
      ...Object.values(this.worldMapRouteMarkerIcons || {}),
      ...Object.values(this.worldMapLandmarkIcons || {}),
    ].filter(Boolean);
    for (const child of mapChildren) child.setVisible(this.worldMapHudExpanded);

    this.worldMapSubtitle.setText(this.worldMapHudExpanded
      ? routeSummary
      : `You: ${this.shortLocationLabel(currentLocation)} -> ${this.shortLocationLabel(activeQuestMarker)}\n${knownCount}/${locations.length} known | ${lockedDestinations.length} locked`);
    this.worldMapToggleHint?.setText(this.worldMapHudExpanded ? 'G close' : 'G open');

    if (!this.worldMapHudExpanded) {
      const collapsedW = layout.collapsedW || 236;
      const collapsedH = layout.collapsedH || 58;
      g.fillStyle(0x16201d, 0.86).fillRoundedRect(0, 0, collapsedW, collapsedH, layout.radius);
      g.lineStyle(1, 0xd9b36a, 0.74).strokeRoundedRect(0, 0, collapsedW, collapsedH, layout.radius);
      const mini = layout.collapsed_route;
      g.fillStyle(0xf2c46d, 0.95).fillCircle(mini.questX, mini.questBadgeY, mini.nodeR);
      g.lineStyle(1, 0xfff0c7, 0.84).strokeCircle(mini.questX, mini.questBadgeY, mini.questR);
      g.lineStyle(2, 0x8ed6c9, 0.32).lineBetween(mini.lineStartX, mini.lineY, mini.lineEndX, mini.lineY);
      g.fillStyle(0x8ed6c9, 0.72).fillCircle(mini.currentX, mini.lineY, mini.nodeR - 1);
      g.fillStyle(0xf2c46d, 0.9).fillCircle(mini.questX, mini.lineY, mini.nodeR + 1);
      return;
    }

    g.fillStyle(0x16201d, 0.84).fillRoundedRect(0, 0, layout.w, layout.h, layout.radius);
    g.lineStyle(1, 0xd9b36a, 0.74).strokeRoundedRect(0, 0, layout.w, layout.h, layout.radius);
    const viewport = layout.viewport;
    g.fillStyle(0x203029, 0.9).fillRoundedRect(viewport.x, viewport.y, viewport.w, viewport.h, viewport.radius);

    const terrainColors = { desert: 0xd9b36a, city: 0x6f8f88, river: 0x8ed6c9 };
    for (const band of layout.terrain_bands) {
      g.fillStyle(terrainColors[band.color] || 0x445450, 0.16).fillRoundedRect(band.x, band.y, band.w, band.h, band.radius);
    }

    const byId = new Map(locations.map((location) => [location.id, location]));
    for (const [fromId, toId] of layout.routes) {
      const from = byId.get(fromId);
      const to = byId.get(toId);
      if (!from || !to) continue;
      const routeLocked = from.locked || to.locked;
      g.lineStyle(2, routeLocked ? 0x7f8783 : 0x8ed6c9, routeLocked ? 0.22 : 0.34);
      g.lineBetween(from.mapX, from.mapY, to.mapX, to.mapY);
    }
    this.drawWorldMapQuestPath(g, byId, currentLocation, activeQuestMarker);

    for (const item of layout.status_items) {
      const color = item.label === 'you' ? 0xf2c46d : item.label === 'quest' ? 0xfff0c7 : 0x7f8783;
      g.fillStyle(color, item.label === 'locked' ? 0.55 : 0.95).fillCircle(item.dotX, item.dotY, 3);
      if (item.label === 'quest') g.lineStyle(1, 0xfff0c7, 0.8).strokeCircle(item.dotX, item.dotY, 5);
      if (item.label === 'locked') {
        g.lineStyle(1, 0x9aa3a0, 0.65);
        g.lineBetween(item.dotX - 3, item.dotY - 3, item.dotX + 3, item.dotY + 3);
      }
    }

    for (const location of locations) {
      const discoveredLocation = !location.locked && (discovered.has(location.id) || location.alwaysKnown);
      const isCurrent = location.id === currentLocation;
      const isQuest = location.id === activeQuestMarker;
      const color = location.locked ? 0x6f7a77 : isCurrent ? 0xf2c46d : isQuest ? 0xfff0c7 : discoveredLocation ? 0x8ed6c9 : 0x445450;
      const alpha = location.locked ? 0.45 : discoveredLocation || isQuest ? 0.95 : 0.52;
      g.fillStyle(0x16201d, 0.42).fillCircle(location.mapX, location.mapY, isCurrent ? layout.node.currentR + 2 : layout.node.r + 2);
      if (isQuest) g.lineStyle(2, 0xfff0c7, 0.78).strokeCircle(location.mapX, location.mapY, layout.node.questR);
      if (isCurrent) g.lineStyle(2, 0xf2c46d, 0.9).strokeCircle(location.mapX, location.mapY, layout.node.questR + 3);
      const routeIcon = this.worldMapRouteMarkerIcons?.[location.id];
      if (routeIcon) {
        const markerFrame = location.locked
          ? layout.route_marker_sheet.frames.locked
          : isCurrent
            ? layout.route_marker_sheet.frames.current
            : isQuest
              ? layout.route_marker_sheet.frames.quest
              : layout.route_marker_sheet.frames.complete;
        this.setSheetIconFrame(routeIcon, layout.route_marker_sheet, markerFrame);
        routeIcon.setPosition(location.mapX, location.mapY).setAlpha(alpha).setVisible(true);
      } else {
        g.fillStyle(color, alpha).fillCircle(location.mapX, location.mapY, isCurrent ? layout.node.currentR : layout.node.r);
      }
      const landmarkIcon = this.worldMapLandmarkIcons?.[location.id];
      if (landmarkIcon) {
        const landmarkFrame = layout.landmark_sheet.frames[location.id];
        this.setSheetIconFrame(landmarkIcon, layout.landmark_sheet, landmarkFrame);
        landmarkIcon
          .setPosition(location.mapX + layout.landmark_sheet.offsetX, location.mapY + layout.landmark_sheet.offsetY)
          .setAlpha(location.locked ? 0.38 : 0.78)
          .setVisible(true);
      }
      if (isCurrent) {
        this.worldMapCurrentBadge
          ?.setPosition(location.mapX + layout.badges.current.offsetX, location.mapY + layout.badges.current.offsetY)
          .setVisible(true);
      }
      if (isQuest) {
        this.worldMapQuestBadge
          ?.setPosition(location.mapX + layout.badges.quest.offsetX, location.mapY + layout.badges.quest.offsetY)
          .setVisible(true);
      }
    }

    layout.labels.items.forEach((item, index) => {
      const location = byId.get(item.id);
      if (!location) return;
      const isVisible = location.alwaysKnown
        || location.revealedWhenLocked
        || discovered.has(location.id)
        || location.id === activeQuestMarker
        || !location.locked;
      const label = this.worldMapPointLabels[index];
      if (label) {
        label.setText(isVisible ? location.label : '');
        label.setAlpha(location.locked ? 0.58 : 0.9);
      }
      if (!isVisible) return;
      g.fillStyle(0x16201d, location.locked ? 0.5 : 0.66).fillRoundedRect(item.x - 3, item.y - 1, location.label.length * 5.8 + 6, 12, 4);
    });

    // Phase 2.3 — functional map: surface Current / Reachable / Locked from the
    // runtime's single source of truth (no fake destinations, no dead links).
    if (this._worldMap) {
      const reachLabels = this._worldMap.reachable.map((l) => l.label).join(', ');
      const lockLabels = this._worldMap.locked.map((l) => l.label).join(', ');
      this.worldMapLegend.setText(
        `Current: ${this._worldMap.currentLabel}\n` +
        `Reachable: ${reachLabels || 'none'}\n` +
        `Locked: ${lockLabels || 'none'}`
      );
    } else {
      this.worldMapLegend.setText(`You are near: ${this.locationLabel(currentLocation)}\n${nextText}`);
    }
  }

  setSheetIconFrame(icon, sheet, frame) {
    if (frame === undefined) {
      icon.setVisible(false);
      return;
    }
    icon.setCrop(frame * sheet.frameW, 0, sheet.frameW, sheet.frameH);
  }

  drawWorldMapQuestPath(g, byId, currentLocation, activeQuestMarker) {
    const from = byId.get(currentLocation);
    const to = byId.get(activeQuestMarker);
    if (!from || !to || from.id === to.id) return;
    const path = this.layout.world_map_hud.quest_path;
    g.lineStyle(path.glowWidth, 0xfff0c7, 0.16);
    g.lineBetween(from.mapX, from.mapY, to.mapX, to.mapY);
    g.lineStyle(path.lineWidth, 0xfff0c7, 0.82);
    g.lineBetween(from.mapX, from.mapY, to.mapX, to.mapY);
    const angle = Phaser.Math.Angle.Between(from.mapX, from.mapY, to.mapX, to.mapY);
    g.fillStyle(0xfff0c7, 0.9);
    g.fillTriangle(
      to.mapX,
      to.mapY,
      to.mapX - Math.cos(angle - 0.55) * path.arrowR,
      to.mapY - Math.sin(angle - 0.55) * path.arrowR,
      to.mapX - Math.cos(angle + 0.55) * path.arrowR,
      to.mapY - Math.sin(angle + 0.55) * path.arrowR,
    );
  }

  buildWorldMapRouteSummary(currentLocation, activeQuestMarker, lockedDestinations) {
    const current = this.shortLocationLabel(currentLocation);
    const quest = this.shortLocationLabel(activeQuestMarker);
    const locked = lockedDestinations.length ? `${lockedDestinations.length} locked later` : 'wider routes open';
    return `You: ${current} -> Quest: ${quest} -> ${locked}`;
  }

  getWorldMapLocations(state) {
    const byId = new Map(act1Locations.map((location) => [location.id, location]));
    const points = this.layout.world_map_hud.points;
    return Object.entries(points).map(([id, point]) => ({
      id,
      label: point.label || byId.get(id)?.displayName || id,
      mapX: point.x,
      mapY: point.y,
      alwaysKnown: Boolean(point.alwaysKnown),
      revealedWhenLocked: Boolean(point.revealedWhenLocked),
      locked: Boolean(point.lockedByWiderMap && !state.discovery.widerMapUnlocked),
    }));
  }

  nearestMapLocationId() {
    const mappedDestinationIds = new Set(Object.keys(this.layout.world_map_hud.points));
    let nearest = { id: 'street', distance: Infinity };
    for (const location of act1Locations.filter((item) => mappedDestinationIds.has(item.id))) {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, location.x, location.y);
      if (distance < nearest.distance) nearest = { id: location.id, distance };
    }
    return nearest.id;
  }

  locationLabel(id) {
    const match = act1Locations.find((location) => location.id === id);
    if (match) return match.displayName;
    const labels = {
      salt_river: 'Salt River',
      copper_mine: 'Copper Mine',
    };
    return labels[id] || id;
  }

  shortLocationLabel(id) {
    const labels = {
      home: 'Home',
      garage: 'Garage',
      street: 'Street',
      dry_wash: 'Dry Wash',
      bridge: 'Bridge',
      wider_gate: 'City Gate',
      salt_river: 'Salt River',
      copper_mine: 'Copper Mine',
    };
    return labels[id] || this.locationLabel(id);
  }

  createBridgeCelebration() {
    this.bridgeCelebrationShown = true;
    const g = this.add.graphics().setDepth(170);
    g.lineStyle(4, 0xf2c46d, 0.52);
    g.lineBetween(1192, 604, 1320, 604);
    g.lineStyle(3, 0x8ed6c9, 0.48);
    g.lineBetween(1176, 628, 1340, 628);
    for (const [x, y, color] of [[1188, 584, 0xf2c46d], [1226, 574, 0x8ed6c9], [1288, 574, 0xfff0c7], [1334, 590, 0xd08b62]]) {
      g.fillStyle(color, 0.82).fillCircle(x, y, 4);
    }
    this.add.text(1138, 664, 'the neighborhood path changed', {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#fff0c7',
      backgroundColor: 'rgba(32,48,41,0.52)',
      padding: { x: 6, y: 3 },
    }).setDepth(910);
  }
}

function labelStyle() {
  return {
    fontFamily: 'Arial',
    fontSize: '13px',
    color: '#f6e6b4',
  };
}

function npcLabelStyle() {
  return {
    fontFamily: 'Arial',
    fontSize: '13px',
    color: '#ffe8aa',
    backgroundColor: 'rgba(22,32,29,0.28)',
    padding: { x: 3, y: 1 },
  };
}

function tabStyle() {
  return {
    fontFamily: 'Arial',
    fontSize: '11px',
    color: '#4d3727',
    fontStyle: 'bold',
  };
}

