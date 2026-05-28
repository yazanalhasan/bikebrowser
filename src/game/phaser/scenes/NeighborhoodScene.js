import { ASSET_KEYS } from '../systems/AssetRegistry.js';
import { InputSystem } from '../systems/InputSystem.js';
import { InteractionSystem } from '../systems/InteractionSystem.js';
import { configureNeighborhoodCamera } from '../systems/CameraSystem.js';

export default class NeighborhoodScene extends Phaser.Scene {
  constructor() {
    super('NeighborhoodScene');
  }

  create() {
    this.worldWidth = 1600;
    this.worldHeight = 1000;
    this.inputSystem = new InputSystem(this);
    this.interactions = new InteractionSystem();
    this.runtime = this.registry.get('act1Runtime');
    this.runtime.sceneReady = true;
    this.runtime.audioSystem.transitionMusic('neighborhood');
    this.runtime.audioSystem.setAmbient('neighborhood');
    this.currentVelocity = { x: 0, y: 0 };
    this.lastNearestId = null;
    this.characterVisuals = {
      playerScale: 1.6,
      npcScale: 1.52,
      animatedSheets: [],
      npcIds: [],
    };
    this.visualLanguageState = {
      scope: 'complete_act1',
      palette: 'warm_sonoran_neighborhood',
      authoredBeats: [
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

    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.createEnvironment();
    this.createCharacterAnimations();
    this.createPlayer();
    this.createInteractions();
    this.createFeedbackHud();
    configureNeighborhoodCamera(this, this.player);

    this.helpText = this.add.text(18, 680, 'WASD / arrows move • E or Space explore • N notebook • R replay voice • M quiet', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#ffe8aa',
      backgroundColor: 'rgba(22,32,29,0.6)',
      padding: { x: 8, y: 5 },
    }).setScrollFactor(0).setDepth(950);

    this.input.keyboard.on('keydown-R', () => this.runtime?.audioSystem.replayLast());
    this.input.keyboard.on('keydown-M', () => {
      const current = this.runtime?.audioSystem.getState().settings.reducedAudio;
      this.runtime?.audioSystem.setSettings({ reducedAudio: !current });
      this.showFeedback({ message: !current ? 'Quiet audio mode on.' : 'Full audio cues on.' });
    });

    window.__bikebrowserRebuildReady = true;
  }

  createCharacterAnimations() {
    this.createSheetAnimation('zuzu.walk', ASSET_KEYS.zuzuWalkSheet, 0, 15, 10);
    this.createSheetAnimation('zuzu.idle', ASSET_KEYS.zuzuWalkSheet, 0, 3, 4);
    this.createSheetAnimation('chen.talk', ASSET_KEYS.npcGarageMentorTalkSheet, 0, 15, 6);
    this.createSheetAnimation('chen.repair', ASSET_KEYS.npcGarageMentorRepairSheet, 0, 15, 7);
    this.createSheetAnimation('ramirez.talk', ASSET_KEYS.npcNeighborTalkSheet, 0, 15, 6);
    this.createSheetAnimation('ramirez.cheer', ASSET_KEYS.npcNeighborCheerSheet, 0, 15, 7);
    this.createSheetAnimation('mariam.talk', ASSET_KEYS.npcArabicMentorTalkSheet, 0, 15, 5);
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

  createEnvironment() {
    this.add.rectangle(800, 500, 1600, 1000, 0x2e4a3d);
    this.add.rectangle(800, 306, 1600, 178, 0x5e7249).setAlpha(0.34);
    this.add.rectangle(800, 162, 1600, 110, 0x243b37).setAlpha(0.32);
    this.drawSonoranVista();
    this.drawNeighborhoodColorLanguage();

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

    this.add.image(265, 300, ASSET_KEYS.house).setScale(1.4);
    this.add.text(214, 374, 'Zuzu home', labelStyle());
    this.add.image(520, 270, ASSET_KEYS.house).setScale(1.1).setTint(0x8f6f5c);
    this.drawGarageWarmth();
    this.drawGarageSanctuaryDetails();
    this.add.image(650, 312, ASSET_KEYS.garageWorkbench).setScale(1.0);
    this.add.text(596, 372, 'garage/workbench', labelStyle());
    this.add.image(292, 692, ASSET_KEYS.schoolNode).setScale(1.2);
    this.add.image(1125, 650, ASSET_KEYS.desertWash).setScale(2.0, 1.35);
    this.bridgeSprite = this.add.image(1255, 642, ASSET_KEYS.bridgeBroken).setScale(1.12);
    this.bridgePayoffGlow = this.add.ellipse(1255, 642, 260, 98, 0xf2c46d, 0).setDepth(145);
    this.bridgePayoffText = this.add.text(1168, 582, 'repaired crossing', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#fff0c7',
      backgroundColor: 'rgba(32,48,41,0.62)',
      padding: { x: 7, y: 4 },
    }).setDepth(910).setVisible(false);
    this.drawBridgePull();
    this.drawBridgeStoryStage();

    this.add.text(1065, 720, 'dry wash path', {
      fontFamily: 'Arial',
      fontSize: '15px',
      color: '#f6e6b4',
    }).setAlpha(0.75);

    this.drawDesertDetails();
    this.drawStoryDetails();
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

  drawSonoranVista() {
    const vista = this.add.graphics();
    vista.fillStyle(0xffd17a, 0.18).fillEllipse(264, 152, 420, 118);
    vista.fillStyle(0x6d5a82, 0.42);
    vista.fillTriangle(0, 342, 185, 106, 398, 342);
    vista.fillTriangle(292, 340, 528, 118, 782, 340);
    vista.fillTriangle(1038, 338, 1286, 106, 1600, 338);
    vista.fillStyle(0xd89152, 0.3);
    vista.fillTriangle(52, 334, 185, 106, 264, 334);
    vista.fillTriangle(1100, 334, 1286, 106, 1390, 334);
    vista.fillStyle(0x8bbf65, 0.26).fillRect(0, 318, 1600, 70);
    for (const [x, y, h] of [[138, 362, 68], [226, 348, 84], [1138, 354, 80], [1470, 344, 96]]) {
      vista.fillStyle(0x2f7f5c, 0.88).fillRoundedRect(x, y - h, 10, h, 5);
      vista.fillRoundedRect(x - 18, y - h * 0.46, 18, 8, 4);
      vista.fillRoundedRect(x + 10, y - h * 0.65, 18, 8, 4);
    }
    for (const [x, y] of [[178, 304], [356, 296], [1110, 302], [1328, 292]]) {
      vista.fillStyle(0xd9b28a, 0.78).fillRect(x, y, 84, 48);
      vista.fillStyle(0x9f4029, 0.86).fillTriangle(x - 8, y, x + 42, y - 24, x + 92, y);
      vista.fillStyle(0xffd57a, 0.82).fillRect(x + 18, y + 16, 14, 16);
      vista.fillRect(x + 54, y + 16, 14, 16);
    }
  }

  drawDesertDetails() {
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
    g.lineStyle(2, 0xd9b36a, 0.45);
    for (const [x, y] of [[430, 418], [454, 419], [478, 421], [502, 421], [760, 430], [786, 431], [812, 431]]) {
      g.strokeEllipse(x, y, 18, 7);
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
    this.player = this.physics.add.sprite(305, 506, animated ? ASSET_KEYS.zuzuWalkSheet : ASSET_KEYS.zuzu);
    this.player.setScale(this.characterVisuals.playerScale).setDepth(260);
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(animated ? 22 : 24, animated ? 28 : 30);
    this.player.body.setOffset(animated ? 37 : 8, animated ? 54 : 20);
    if (animated) this.player.play('zuzu.idle');
    this.playerVisualState = {
      textureKey: this.player.texture.key,
      scale: this.player.scaleX,
      animation: this.player.anims?.currentAnim?.key || null,
    };
    this.registry.set('playerPosition', { x: this.player.x, y: this.player.y });
  }

  createInteractions() {
    this.add.image(462, 432, ASSET_KEYS.bike).setScale(1.05);
    this.add.image(470, 382, ASSET_KEYS.interactionMarker);
    this.add.image(650, 430, ASSET_KEYS.repairStation).setScale(1.1);
    this.add.image(742, 408, ASSET_KEYS.utmRig).setScale(1.08);
    this.createUtmVisualizer();
    this.add.image(820, 444, ASSET_KEYS.chemistryStation).setScale(1.08);
    this.createChemistryVisualizer();
    this.add.image(920, 438, ASSET_KEYS.workbench).setScale(1.1);
    this.add.image(1030, 760, ASSET_KEYS.ecologyPlant).setScale(1.25);
    this.createEcologyVisualizer();
    this.add.image(1484, 514, ASSET_KEYS.mapGate).setScale(1.2);
    this.add.image(650, 372, ASSET_KEYS.questMarker);

    this.createAnimatedNpc({
      id: 'mr_chen',
      x: 282,
      y: 438,
      sheetKey: ASSET_KEYS.npcGarageMentorTalkSheet,
      fallbackKey: ASSET_KEYS.npcGarageMentor,
      animationKey: 'chen.talk',
      label: 'Mr. Chen',
      labelX: 250,
      cueColor: 0xf2c46d,
      cueKind: 'wrench',
      dialogueId: 'mr_chen_bridge_intro',
    });
    this.add.text(250, 514, 'Mr. Chen', npcLabelStyle());
    this.drawNpcCue(282, 408, 0xf2c46d, 'wrench');

    this.createAnimatedNpc({
      id: 'neighbor',
      x: 398,
      y: 438,
      sheetKey: ASSET_KEYS.npcNeighborTalkSheet,
      fallbackKey: ASSET_KEYS.npcNeighbor,
      animationKey: 'ramirez.talk',
      label: 'Mrs. Ramirez',
      labelX: 348,
      cueColor: 0xf09d72,
      cueKind: 'heart',
      dialogueId: 'wash_neighbor',
    });
    this.add.text(348, 514, 'Mrs. Ramirez', npcLabelStyle());
    this.drawNpcCue(398, 408, 0xf09d72, 'heart');

    this.createAnimatedNpc({
      id: 'auntie_mariam',
      x: 540,
      y: 438,
      sheetKey: ASSET_KEYS.npcArabicMentorTalkSheet,
      fallbackKey: ASSET_KEYS.npcArabicMentor,
      animationKey: 'mariam.talk',
      label: 'Auntie Mariam',
      labelX: 492,
      cueColor: 0xbec8ff,
      cueKind: 'star',
      dialogueId: 'arabic_welcome',
    });
    this.add.text(492, 514, 'Auntie Mariam', npcLabelStyle());
    this.drawNpcCue(540, 408, 0xbec8ff, 'star');

    const trader = this.add.image(905, 394, ASSET_KEYS.materialSamples).setScale(1.05);
    this.add.text(858, 426, 'materials table', labelStyle());

    const washMarker = this.add.image(1190, 574, ASSET_KEYS.questMarker);
    washMarker.setTint(0x8ed6c9);

    this.interactions.register({
      id: 'mr_chen',
      x: 282,
      y: 438,
      label: 'Talk to Mr. Chen',
      dialogueId: 'mr_chen_bridge_intro',
    });
    this.interactions.register({
      id: 'neighbor',
      x: 398,
      y: 438,
      label: 'Ask Mrs. Ramirez',
      dialogueId: 'wash_neighbor',
    });
    this.interactions.register({
      id: 'bike',
      x: 470,
      y: 432,
      label: 'Inspect the bike',
      dialogueId: 'bike_check_intro',
      action: 'bike_check',
    });
    this.interactions.register({
      id: 'dry_wash',
      x: 1190,
      y: 574,
      label: 'Read bridge sign',
      dialogueId: 'dry_wash_marker',
      action: 'dry_wash',
    });
    this.interactions.register({
      id: 'materials_table',
      x: 905,
      y: 420,
      label: 'Collect candidate materials',
      dialogueId: 'material_trade',
      action: 'collect_materials',
    });
    this.interactions.register({
      id: 'utm',
      x: 742,
      y: 408,
      label: 'Run UTM material tests',
      action: 'utm',
    });
    this.interactions.register({
      id: 'bridge_plan',
      x: 920,
      y: 438,
      label: 'Plan bridge repair',
      action: 'bridge_plan',
    });
    this.interactions.register({
      id: 'bridge_repair',
      x: 1255,
      y: 642,
      label: 'Reconnect the crossing',
      action: 'repair_bridge',
    });
    this.interactions.register({
      id: 'ecology_patch',
      x: 1030,
      y: 760,
      label: 'Observe desert helpers',
      dialogueId: 'ecology_helper',
      action: 'ecology_patch',
    });
    this.interactions.register({
      id: 'chemistry_station',
      x: 820,
      y: 444,
      label: 'Mix, dry, test',
      action: 'chemistry_station',
    });
    this.interactions.register({
      id: 'spanish_neighbor',
      x: 398,
      y: 438,
      label: 'Thank Mrs. Ramirez',
      dialogueId: 'spanish_trust',
      action: 'spanish_neighbor',
    });
    this.interactions.register({
      id: 'arabic_mentor',
      x: 540,
      y: 438,
      label: 'Check in with Auntie Mariam',
      dialogueId: 'arabic_welcome',
      action: 'arabic_mentor',
    });
    this.interactions.register({
      id: 'wider_gate',
      x: 1484,
      y: 514,
      label: 'Open wider map clue',
      dialogueId: 'wider_gate_clue',
      action: 'wider_gate',
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
    this.tweens.add({
      targets: npc,
      y: y - 3,
      scaleY: this.characterVisuals.npcScale * 1.035,
      duration: 820 + Phaser.Math.Between(0, 180),
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
    this.characterVisuals.npcIds.push(id);
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
    this.utmViz = this.add.container(708, 352).setDepth(150);
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
      this.add.rectangle(684, 390, 24, 5, 0x8ed6c9, 0.5).setDepth(151),
      this.add.rectangle(714, 390, 24, 5, 0xf2c46d, 0.5).setDepth(151),
      this.add.rectangle(744, 390, 24, 5, 0xd08b62, 0.5).setDepth(151),
    ];
    this.add.text(674, 398, 'compare bend', {
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
    this.chemistryViz = this.add.container(820, 406).setDepth(148);
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
    this.ecologyViz = this.add.container(1030, 760).setDepth(130);
    this.ecologyShade = this.add.ellipse(-18, -8, 92, 30, 0x17221f, 0.2);
    this.ecologyWater = this.add.rectangle(18, 26, 54, 4, 0x8ed6c9, 0.48);
    this.ecologyEthic = this.add.text(-58, 34, 'observe first', {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#ffe8aa',
    }).setAlpha(0.72);
    this.ecologyViz.add([this.ecologyShade, this.ecologyWater, this.ecologyEthic]);
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
      this.ecologyWater.setScale(ecologyCount >= 2 ? 1.25 : 1);
    }
  }

  drawNpcCue(x, y, color, kind) {
    const g = this.add.graphics();
    g.fillStyle(color, 0.95).fillCircle(x, y, 5);
    g.lineStyle(2, color, 0.9);
    if (kind === 'wrench') {
      g.lineBetween(x - 8, y + 6, x + 7, y - 7);
      g.strokeCircle(x + 8, y - 8, 3);
    } else if (kind === 'heart') {
      g.lineBetween(x - 7, y, x, y + 7);
      g.lineBetween(x + 7, y, x, y + 7);
    } else {
      g.lineBetween(x, y - 9, x, y + 9);
      g.lineBetween(x - 9, y, x + 9, y);
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
  }

  update(_time, delta) {
    const movement = this.inputSystem.getMovementVector();
    const speed = 178;
    const length = Math.hypot(movement.x, movement.y) || 1;
    const targetX = (movement.x / length) * speed;
    const targetY = (movement.y / length) * speed;
    const smoothing = movement.x || movement.y ? 0.18 : 0.28;
    this.currentVelocity.x = Phaser.Math.Linear(this.currentVelocity.x, targetX, smoothing);
    this.currentVelocity.y = Phaser.Math.Linear(this.currentVelocity.y, targetY, smoothing);
    this.player.setVelocity(this.currentVelocity.x, this.currentVelocity.y);
    this.player.setFlipX(this.currentVelocity.x < -4);
    this.updatePlayerAnimation(_time, movement);

    const nearest = this.interactions.nearest(this.player);
    if (nearest) {
      this.prompt.setVisible(true);
      this.prompt.setText(`[E] ${nearest.label}`);
      this.prompt.setPosition(nearest.x - 76, nearest.y - 88);
      if (this.lastNearestId !== nearest.id) {
        this.lastNearestId = nearest.id;
        this.prompt.setAlpha(0.15);
        this.tweens.add({ targets: this.prompt, alpha: 1, duration: 140, ease: 'Sine.easeOut' });
      }
      if (this.inputSystem.interactionJustPressed()) {
        if (nearest.action) {
          this.runtime?.handleInteraction(nearest.action);
          this.registry.events.emit('quest:changed');
        }
        if (nearest.dialogueId) this.registry.events.emit('dialogue:start', nearest.dialogueId);
      }
    } else {
      this.prompt.setVisible(false);
      this.lastNearestId = null;
    }

    this.registry.set('playerPosition', { x: this.player.x, y: this.player.y });

    if (this.inputSystem.notebookJustPressed()) {
      this.toggleNotebook();
    }
    this.updateEvidencePanel();
  }

  updatePlayerAnimation(time, movement) {
    const isMoving = Math.abs(movement.x) > 0.01 || Math.abs(movement.y) > 0.01;
    const targetAnim = isMoving ? 'zuzu.walk' : 'zuzu.idle';
    if (this.anims.exists(targetAnim) && this.player.anims?.currentAnim?.key !== targetAnim) {
      this.player.play(targetAnim);
    }
    const pulse = isMoving ? Math.sin(time / 72) * 0.035 : Math.sin(time / 420) * 0.012;
    this.player.setScale(this.characterVisuals.playerScale, this.characterVisuals.playerScale + pulse);
    this.playerVisualState = {
      textureKey: this.player.texture.key,
      scale: this.characterVisuals.playerScale,
      animation: this.player.anims?.currentAnim?.key || null,
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

  refreshNotebook() {
    const state = this.runtime?.notebookSystem.getState();
    const entries = state?.entries.filter((entry) => entry.unlocked) || [];
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

  updateEvidencePanel() {
    const state = this.runtime?.getAct1State();
    if (!state) return;
    if (this.bridgeSprite) {
      this.bridgeSprite.setTexture(state.bridge.bridgeReconnected ? ASSET_KEYS.bridgeRepaired : ASSET_KEYS.bridgeBroken);
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
    const lines = [
      'Current clue',
      clue,
      map,
    ];
    if (latestTest) lines.splice(2, 0, `${latestTest.displayName}: ${latestTest.strengthBand}`, bridge);
    if (!latestTest && !clue.includes(bridge)) lines.splice(2, 0, bridge);
    this.evidencePanel.setText(lines.join('\n'));
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
