import Phaser from 'phaser';
import { loadLayout } from '../utils/loadLayout.js';
import { getCognitiveQuest } from '../data/cognitiveQuests/index.js';
import {
  cancelCognitiveQuest,
  completeCognitiveQuest,
  evaluateAnswer,
  isMensaModeEnabled,
  recordCognitiveAnswer,
  shouldShowHint,
} from '../systems/cognitiveQuestSystem.js';

export default class CognitiveQuestScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CognitiveQuestScene' });
  }

  init(data) {
    this._questId = data?.questId;
    this._returnSceneKey = data?.returnSceneKey;
    this._completionDialog = data?.completionDialog || null;
    this._selectedCorrect = false;
    this._canContinue = false;
  }

  preload() {
    const quest = getCognitiveQuest(this._questId);
    if (quest?.layoutKey && quest?.layoutPath) {
      this.load.json(quest.layoutKey, quest.layoutPath);
    }
  }

  create() {
    this.quest = getCognitiveQuest(this._questId);
    if (!this.quest) {
      this.scene.stop();
      return;
    }

    this.layout = loadLayout(this, this.quest.layoutKey);
    this.state = this.registry.get('gameState') || {};
    this.mensaMode = isMensaModeEnabled(this.state);
    this.optionCards = new Map();

    this._drawFrame();
    this._drawOptions();
    this._drawFeedback();
  }

  _drawFrame() {
    const b = this.layout.backdrop;
    this.add.rectangle(b.x, b.y, b.w, b.h, 0x000000, 0.68).setDepth(200);

    const p = this.layout.panel;
    this.add.rectangle(p.x, p.y, p.w, p.h, 0xf8fafc, 0.98)
      .setStrokeStyle(3, 0x111827)
      .setDepth(201);

    const title = this.layout.title;
    this.add.text(title.x, title.y, this.quest.title, {
      fontSize: '24px',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
      color: '#111827',
      align: 'center',
      wordWrap: { width: title.w },
    }).setOrigin(0.5).setDepth(202);

    const prompt = this.layout.prompt;
    this.add.text(prompt.x, prompt.y, this.quest.prompt, {
      fontSize: '18px',
      fontFamily: 'sans-serif',
      color: '#334155',
      align: 'center',
      wordWrap: { width: prompt.w },
    }).setOrigin(0.5).setDepth(202);

    const close = this.layout.close;
    this.add.circle(close.x, close.y, close.r, 0xe5e7eb)
      .setStrokeStyle(2, 0x64748b)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._cancel())
      .setDepth(202);
    this.add.text(close.x, close.y, 'x', {
      fontSize: '18px',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
      color: '#334155',
    }).setOrigin(0.5).setDepth(203);

    if (this.mensaMode) {
      const badge = this.layout.mensa_badge;
      this.add.rectangle(badge.x, badge.y, badge.w, badge.h, 0x312e81, 0.95)
        .setStrokeStyle(2, 0x818cf8)
        .setDepth(203);
      this.add.text(badge.x, badge.y, 'Mensa Mode', {
        fontSize: '13px',
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
        color: '#ffffff',
      }).setOrigin(0.5).setDepth(204);
    }
  }

  _drawOptions() {
    for (const option of this.quest.options || []) {
      const area = this.layout[option.layoutKey];
      if (!area) continue;

      const card = this.add.container(area.x, area.y).setDepth(204);
      const bg = this.add.rectangle(0, 0, area.w, area.h, 0xffffff, 1)
        .setStrokeStyle(3, 0xcbd5e1);
      const visual = this.add.graphics();
      this._drawOptionVisual(visual, option.visual, area);
      const label = this.add.text(0, area.h / 2 - 36, option.label, {
        fontSize: '15px',
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
        color: '#1f2937',
        align: 'center',
        wordWrap: { width: area.w - 24 },
      }).setOrigin(0.5);

      card.add([bg, visual, label]);
      card.setSize(area.w, area.h);
      card.setInteractive({ useHandCursor: true });
      card.on('pointerover', () => bg.setStrokeStyle(3, 0x2563eb));
      card.on('pointerout', () => bg.setStrokeStyle(3, 0xcbd5e1));
      card.on('pointerdown', () => this._selectOption(option, bg));
      this.optionCards.set(option.id, { card, bg });
    }
  }

  _drawOptionVisual(gfx, visual, area) {
    const centerY = -24;
    gfx.lineStyle(12, 0x111827, 1);
    gfx.strokeCircle(0, centerY, 48);
    gfx.lineStyle(4, 0x94a3b8, 1);
    gfx.strokeCircle(0, centerY, 34);
    gfx.lineStyle(2, 0xcbd5e1, 0.9);
    gfx.lineBetween(-34, centerY, 34, centerY);
    gfx.lineBetween(0, centerY - 34, 0, centerY + 34);

    if (visual === 'puncture') {
      gfx.fillStyle(0xef4444, 1);
      gfx.fillCircle(24, centerY - 28, 8);
      gfx.lineStyle(3, 0x64748b, 1);
      gfx.lineBetween(34, centerY - 46, 24, centerY - 28);
      gfx.lineStyle(2, 0x60a5fa, 0.9);
      gfx.lineBetween(32, centerY - 32, 52, centerY - 42);
      gfx.lineBetween(34, centerY - 24, 56, centerY - 26);
    } else if (visual === 'valve') {
      gfx.fillStyle(0x64748b, 1);
      gfx.fillRect(-6, centerY - 64, 12, 34);
      gfx.fillStyle(0x60a5fa, 0.9);
      gfx.fillCircle(0, centerY - 74, 5);
    } else if (visual === 'wear') {
      gfx.lineStyle(5, 0xf59e0b, 1);
      gfx.lineBetween(-44, centerY + 48, -24, centerY + 32);
      gfx.lineBetween(-10, centerY + 52, 10, centerY + 32);
      gfx.lineBetween(26, centerY + 48, 44, centerY + 32);
    }

    const captionY = area.h / 2 - 70;
    gfx.fillStyle(0xe0f2fe, 0.9);
    gfx.fillRoundedRect(-56, captionY, 112, 18, 6);
  }

  _drawFeedback() {
    const f = this.layout.feedback;
    this.feedbackText = this.add.text(f.x, f.y, '', {
      fontSize: '15px',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
      color: '#475569',
      align: 'center',
      wordWrap: { width: f.w },
    }).setOrigin(0.5).setDepth(205);

    const c = this.layout.continue;
    this.continueButton = this.add.container(c.x, c.y).setDepth(205).setVisible(false);
    const bg = this.add.rectangle(0, 0, c.w, c.h, 0x16a34a, 1)
      .setStrokeStyle(2, 0x166534);
    const label = this.add.text(0, 0, 'Continue', {
      fontSize: '15px',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);
    this.continueButton.add([bg, label]);
    this.continueButton.setSize(c.w, c.h);
    this.continueButton.setInteractive({ useHandCursor: true });
    this.continueButton.on('pointerdown', () => this._complete());
  }

  _selectOption(option, bg) {
    if (this._canContinue) return;

    const correct = evaluateAnswer(this._questId, { optionId: option.id });
    recordCognitiveAnswer(this, this._questId, option.id, correct);

    if (correct) {
      this._selectedCorrect = true;
      this._canContinue = true;
      bg.setFillStyle(0xdcfce7).setStrokeStyle(4, 0x16a34a);
      this.feedbackText.setColor('#166534').setText(this.quest.feedback?.correct || 'Correct.');
      this.continueButton.setVisible(true);
      this.registry.get('audioManager')?.playSfx?.('ui_success');
      this.cameras.main.flash(120, 34, 197, 94, false);
      return;
    }

    bg.setFillStyle(0xfffbeb).setStrokeStyle(4, 0xf59e0b);
    const hint = shouldShowHint(this.state, this.quest) ? ` ${this.quest.feedback?.hint || ''}` : '';
    this.feedbackText
      .setColor('#b45309')
      .setText(`${this.quest.feedback?.incorrect || 'Try again.'}${hint}`);
    this.registry.get('audioManager')?.playSfx?.('ui_error');
    this.tweens.add({ targets: bg, x: '+=7', duration: 45, yoyo: true, repeat: 3 });
  }

  _complete() {
    completeCognitiveQuest(this, {
      questId: this._questId,
      returnSceneKey: this._returnSceneKey,
      correct: this._selectedCorrect,
      completionDialog: this._completionDialog,
    });

    if (this._completionDialog) {
      this.registry.set('dialogEvent', this._completionDialog);
    }
  }

  _cancel() {
    cancelCognitiveQuest(this, { returnSceneKey: this._returnSceneKey });
  }
}
