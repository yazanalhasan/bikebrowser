import Phaser from 'phaser';
import { DialogueSystem } from '../systems/DialogueSystem.js';

export default class DialogueScene extends Phaser.Scene {
  constructor() {
    super('DialogueScene');
  }

  create() {
    const dialogueSystem = new DialogueSystem();
    this.registry.set('dialogueSystem', dialogueSystem);

    // A compact, centered dialogue box anchored to the bottom-middle of the
    // screen (was a wide bar pinned near the top-left on tall windows).
    this._boxW = 620;
    this._boxH = 118;
    this.panel = this.add.container(0, 0).setScrollFactor(0).setDepth(1200).setVisible(false);
    const bg = this.add.rectangle(0, 0, this._boxW, this._boxH, 0xfff0c7, 0.96).setOrigin(0, 0);
    bg.setStrokeStyle(3, 0x6b4a33, 1);
    this.speaker = this.add.text(24, 16, '', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#3b2a1e',
      fontStyle: 'bold',
    });
    this.line = this.add.text(24, 46, '', {
      fontFamily: 'Arial',
      fontSize: '17px',
      color: '#2f261d',
      wordWrap: { width: this._boxW - 48 },
    });
    this.hint = this.add.text(this._boxW - 78, 92, 'E / click', {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#6b4a33',
    });
    this.panel.add([bg, this.speaker, this.line, this.hint]);
    this._anchorPanel();
    this.scale.on('resize', () => this._anchorPanel());

    this.registry.events.on('dialogue:start', (id) => {
      const line = dialogueSystem.start(id);
      this.showLine(line);
    });
    this.registry.events.on('dialogue:advance', () => this.advance());

    this.input.keyboard.on('keydown', (event) => {
      if (event.key?.toLowerCase() === 'e' || event.code === 'Space') {
        this.advance();
      }
    });
    this.windowKeyHandler = (event) => {
      if (event.key?.toLowerCase() === 'e' || event.code === 'Space') this.advance();
    };
    window.addEventListener('keydown', this.windowKeyHandler);
    this.events.once('shutdown', () => window.removeEventListener('keydown', this.windowKeyHandler));
    this.input.on('pointerdown', () => this.advance());
  }

  _anchorPanel() {
    if (!this.panel) return;
    const x = Math.round((this.scale.width - this._boxW) / 2);
    const y = Math.round(this.scale.height - this._boxH - 28);
    this.panel.setPosition(Math.max(8, x), Math.max(8, y));
  }

  showLine(line) {
    if (!line) return;
    this.panel.setVisible(true);
    this.speaker.setText(line.speaker);
    this.line.setText(line.text);
    // Narrator: read every NPC line aloud (gated only by the global autoSpeak /
    // reducedAudio settings — M quiets it, R replays). Was previously limited to
    // lines flagged speechEnabled, so most dialogue stayed silent.
    this.registry.get('act1AudioSystem')?.autoSpeakLine(line);
  }

  advance() {
    if (!this.panel.visible) return;
    const result = this.registry.get('dialogueSystem').advance();
    if (result?.closed) {
      this.panel.setVisible(false);
      this.registry.get('act1AudioSystem')?.stopSpeech();
      const runtime = this.registry.get('act1Runtime');
      runtime?.applyDialogueEffects(result.dialogueId);
      if (result.completesObjective) {
        const questSystem = this.registry.get('questSystem');
        questSystem?.completeObjective(result.completesObjective);
      }
      for (const objectiveId of result.completes || []) {
        this.registry.get('questSystem')?.completeObjective(objectiveId);
      }
      this.registry.events.emit('quest:changed');
      return;
    }
    this.showLine(result);
  }
}
