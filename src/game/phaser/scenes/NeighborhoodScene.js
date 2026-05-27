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
    this.currentVelocity = { x: 0, y: 0 };
    this.lastNearestId = null;

    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.createEnvironment();
    this.createPlayer();
    this.createInteractions();
    this.createFeedbackHud();
    configureNeighborhoodCamera(this, this.player);

    this.helpText = this.add.text(18, 680, 'WASD / arrows move • E or Space interact • N notebook • F3 debug', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#ffe8aa',
      backgroundColor: 'rgba(22,32,29,0.6)',
      padding: { x: 8, y: 5 },
    }).setScrollFactor(0).setDepth(950);

    window.__bikebrowserRebuildReady = true;
  }

  createEnvironment() {
    this.add.rectangle(800, 500, 1600, 1000, 0x33463c);
    this.add.rectangle(800, 325, 1600, 150, 0x3a563f).setAlpha(0.35);

    for (let x = 64; x < this.worldWidth; x += 128) {
      for (let y = 0; y < this.worldHeight; y += 96) {
        this.add.image(x, y + 48, ASSET_KEYS.street).setAlpha(y > 380 && y < 590 ? 1 : 0);
      }
    }

    this.add.rectangle(800, 486, 1600, 126, 0x2b3740);
    this.add.rectangle(800, 400, 1600, 34, 0x51606d);
    this.add.rectangle(800, 574, 1600, 34, 0x51606d);
    for (let x = 80; x < this.worldWidth; x += 120) {
      this.add.rectangle(x, 486, 56, 5, 0xe0c576).setAlpha(0.75);
    }

    this.add.image(265, 300, ASSET_KEYS.house).setScale(1.4);
    this.add.text(214, 374, 'Zuzu home', labelStyle());
    this.add.image(520, 270, ASSET_KEYS.house).setScale(1.1).setTint(0x8f6f5c);
    this.add.image(650, 312, ASSET_KEYS.garage).setScale(1.08);
    this.add.text(596, 372, 'garage/workbench', labelStyle());
    this.add.image(292, 692, ASSET_KEYS.schoolNode).setScale(1.2);
    this.add.image(1125, 650, ASSET_KEYS.desertWash).setScale(2.0, 1.35);
    this.add.image(1255, 642, ASSET_KEYS.bridge).setScale(1.35);

    this.add.text(1065, 720, 'dry wash path', {
      fontFamily: 'Arial',
      fontSize: '15px',
      color: '#f6e6b4',
    }).setAlpha(0.75);

    this.drawDesertDetails();
    this.drawStoryDetails();
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
    this.player = this.physics.add.sprite(420, 500, ASSET_KEYS.zuzu);
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(24, 30).setOffset(8, 20);
    this.registry.set('playerPosition', { x: this.player.x, y: this.player.y });
  }

  createInteractions() {
    this.add.image(462, 432, ASSET_KEYS.bike).setScale(1.05);
    this.add.image(470, 382, ASSET_KEYS.interactionMarker);
    this.add.image(650, 430, ASSET_KEYS.repairStation).setScale(1.1);
    this.add.image(742, 408, ASSET_KEYS.utmRig).setScale(1.08);
    this.add.image(820, 444, ASSET_KEYS.chemistryStation).setScale(1.08);
    this.add.image(920, 438, ASSET_KEYS.workbench).setScale(1.1);
    this.add.image(1030, 760, ASSET_KEYS.ecologyPlant).setScale(1.25);
    this.add.image(1484, 514, ASSET_KEYS.mapGate).setScale(1.2);
    this.add.image(650, 372, ASSET_KEYS.questMarker);

    const npc = this.add.image(324, 438, ASSET_KEYS.npc);
    this.add.text(286, 466, 'Mr. Chen', {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#ffe8aa',
    });
    npc.setData('dialogueId', 'mr_chen_bridge_intro');

    const neighbor = this.add.image(390, 438, ASSET_KEYS.npc).setTint(0xd08b62);
    this.add.text(346, 466, 'Mrs. Ramirez', {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#ffe8aa',
    });
    neighbor.setData('dialogueId', 'wash_neighbor');

    const auntie = this.add.image(520, 438, ASSET_KEYS.npc).setTint(0x7c89c8);
    this.add.text(478, 466, 'Auntie Mariam', {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#ffe8aa',
    });
    auntie.setData('dialogueId', 'arabic_welcome');

    const trader = this.add.image(905, 394, ASSET_KEYS.toolItem).setScale(1.35);
    this.add.text(858, 426, 'materials table', labelStyle());

    const washMarker = this.add.image(1190, 574, ASSET_KEYS.questMarker);
    washMarker.setTint(0x8ed6c9);

    this.interactions.register({
      id: 'mr_chen',
      x: 324,
      y: 438,
      label: 'Talk to Mr. Chen',
      dialogueId: 'mr_chen_bridge_intro',
    });
    this.interactions.register({
      id: 'neighbor',
      x: 390,
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
      x: 390,
      y: 438,
      label: 'Thank Mrs. Ramirez',
      dialogueId: 'spanish_trust',
      action: 'spanish_neighbor',
    });
    this.interactions.register({
      id: 'arabic_mentor',
      x: 520,
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

    this.notebookPanel = this.add.container(910, 18).setScrollFactor(0).setDepth(980).setVisible(false);
    const nbBg = this.add.rectangle(0, 0, 360, 260, 0xfff0c7, 0.96).setOrigin(0, 0);
    nbBg.setStrokeStyle(2, 0x6b4a33, 1);
    this.notebookText = this.add.text(14, 12, '', {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#30251d',
      wordWrap: { width: 330 },
      lineSpacing: 3,
    });
    this.notebookPanel.add([nbBg, this.notebookText]);
  }

  drawInteractionHalos() {
    for (const zone of this.interactions.zones) {
      const halo = this.add.circle(zone.x, zone.y, 34, 0x8ed6c9, 0.06);
      halo.setStrokeStyle(2, 0x8ed6c9, 0.28);
      halo.setData('zoneId', zone.id);
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

    this.evidencePanel = this.add.text(928, 602, '', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#f4f1dc',
      backgroundColor: 'rgba(22,32,29,0.72)',
      padding: { x: 9, y: 7 },
      wordWrap: { width: 320 },
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

    const nearest = this.interactions.nearest(this.player);
    if (nearest) {
      this.prompt.setVisible(true);
      this.prompt.setText(`[E] ${nearest.label}`);
      this.prompt.setPosition(nearest.x - 62, nearest.y - 62);
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

  toggleNotebook() {
    const nextVisible = !this.notebookPanel.visible;
    this.notebookPanel.setVisible(nextVisible);
    if (!nextVisible) return;
    this.refreshNotebook();
    this.runtime?.notebookSystem.markSeen();
  }

  refreshNotebook() {
    const state = this.runtime?.notebookSystem.getState();
    const entries = state?.entries.filter((entry) => entry.unlocked) || [];
    const categoryLine = Object.entries(state?.categories || {})
      .map(([category, counts]) => `${category} ${counts.unlocked}/${counts.total}`)
      .join('  ');
    const recent = entries.slice(-6).map((entry) => `${entry.isNew ? '* ' : ''}${entry.category}: ${entry.title}`).join('\n');
    this.notebookText.setText([
      `Field Notebook  ${entries.length}/${state?.entries.length || 0}`,
      categoryLine,
      '',
      recent || 'No entries yet. Follow evidence: observe, test, compare, decide.',
      '',
      'N closes. New evidence is marked with *.',
    ].join('\n'));
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
    const tested = state.materialTests.tested.slice(-3).map((result) => `${result.displayName}: ${result.strengthBand}`);
    const bridge = state.bridge.bridgeReconnected ? 'Bridge: reconnected' : state.bridge.plan ? 'Bridge: plan ready' : 'Bridge: needs evidence';
    const map = `${state.discovery.discovered.length}/${state.discovery.regions.length} regions mapped`;
    const trust = Object.entries(state.trust.trust).map(([id, value]) => `${id.replace('_', ' ')} ${value}`).join('  ');
    this.evidencePanel.setText([
      'Evidence',
      tested.length ? tested.join('\n') : 'No material tests yet.',
      bridge,
      map,
      `Trust: ${trust}`,
    ].join('\n'));
  }
}

function labelStyle() {
  return {
    fontFamily: 'Arial',
    fontSize: '13px',
    color: '#f6e6b4',
  };
}
