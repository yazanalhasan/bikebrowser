import Phaser from 'phaser';
import { DialogueSystem } from '../systems/DialogueSystem.js';

// Anime character portrait shown when a character speaks (GPU-generated key art).
// Maps the dialogue speaker label to a preloaded portrait texture; speakers not
// listed (Narrator, signs) simply show no portrait.
const PORTRAIT_BY_SPEAKER = {
  Zuzu: 'portrait_zuzu',
  Dex: 'portrait_dex',
  'Mr. Chen': 'portrait_chen',
  'Mrs. Ramirez': 'portrait_ramirez',
  'Auntie Mariam': 'portrait_mariam',
  'Spanish-speaking NPC': 'portrait_ramirez',
};

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
    this.hint = this.add.text(this._boxW - 132, 92, 'E / click  ·  Esc leaves', {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#6b4a33',
    });
    // Always-visible exit affordance: a mouse-reachable ✕ so the player is never
    // trapped without having to discover the Esc key (kids don't read hints).
    this.closeButton = this.add.text(this._boxW - 28, 8, '✕', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#6b4a33',
      fontStyle: 'bold',
    }).setInteractive({ useHandCursor: true });
    this.closeButton.on('pointerover', () => this.closeButton.setColor('#a83218'));
    this.closeButton.on('pointerout', () => this.closeButton.setColor('#6b4a33'));
    this.closeButton.on('pointerdown', (_p, _x, _y, e) => { e?.stopPropagation?.(); this._leaveDialogue(); });
    // Anime character portrait, framed just left of the box, rising above it.
    // Shown when the speaker has a portrait (GPU-generated key art); hidden for the
    // narrator / signage. Lives in the panel container so it moves + hides with it.
    this.portraitFrame = this.add.rectangle(-86, 120, 156, 218, 0x2a1d10, 0.98)
      .setOrigin(0.5, 1).setStrokeStyle(3, 0x6b4a33, 1).setVisible(false);
    this.portrait = this.add.image(-86, 117, 'portrait_zuzu')
      .setOrigin(0.5, 1).setVisible(false);
    this.portrait.setDisplaySize(148, 210);
    this.panel.add([this.portraitFrame, this.portrait, bg, this.speaker, this.line, this.hint, this.closeButton]);
    this._anchorPanel();
    this.scale.on('resize', () => this._anchorPanel());

    // Player-choice branching UI (own container, anchored above the box).
    this.choices = null;
    this.choiceIndex = 0;
    this.choiceTexts = [];
    this.choiceBox = this.add.container(0, 0).setScrollFactor(0).setDepth(1300).setVisible(false);

    this.registry.events.on('dialogue:start', (id) => {
      this._clearChoices();
      this.showLine(dialogueSystem.start(id));
    });
    this.registry.events.on('dialogue:advance', () => this.advance());

    // Single key handler. Previously this was registered on BOTH the Phaser
    // keyboard AND window, so one physical keypress fired _onKey twice — a single
    // ArrowDown jumped the choice selection by two (to the bottom with 3 choices).
    // One window listener fires once per press and works regardless of canvas focus.
    this.windowKeyHandler = (event) => this._onKey(event);
    window.addEventListener('keydown', this.windowKeyHandler);
    this.events.once('shutdown', () => window.removeEventListener('keydown', this.windowKeyHandler));
    this.input.on('pointerdown', () => { if (!this.choices) this.advance(); });
  }

  _onKey(event) {
    // Universal exit — works mid-line OR at a choice menu, so the player is
    // never trapped (and, since dialogue now freezes movement, never frozen).
    if (event.key === 'Escape') {
      if (this.panel.visible || this.choices) this._leaveDialogue();
      return;
    }
    if (this.choices) {
      const key = event.key?.toLowerCase();
      if (key === 'arrowdown' || key === 's') { this._moveChoice(1); return; }
      if (key === 'arrowup' || key === 'w') { this._moveChoice(-1); return; }
      const num = parseInt(event.key, 10);
      if (Number.isInteger(num) && num >= 1 && num <= this.choices.length) {
        this.chooseDialogue(this.choices[num - 1].id); return;
      }
      if (key === 'e' || event.code === 'Space' || key === 'enter') {
        this.chooseDialogue(this.choices[this.choiceIndex].id);
      }
      return;
    }
    if (event.key?.toLowerCase() === 'e' || event.code === 'Space') this.advance();
  }

  _anchorPanel() {
    if (!this.panel) return;
    const x = Math.round((this.scale.width - this._boxW) / 2);
    const y = Math.round(this.scale.height - this._boxH - 28);
    this.panel.setPosition(Math.max(8, x), Math.max(8, y));
    if (this.choiceBox && this.choiceBox.visible) this._positionChoiceBox();
  }

  showLine(line) {
    if (!line) return;
    this.panel.setVisible(true);
    // Mark a dialogue as active so the world interaction does not re-fire
    // dialogue:start on the next E (which restarted the conversation from line 0).
    this.registry.set('dialogueActive', true);
    this.speaker.setText(line.speaker);
    this.line.setText(line.text);
    this._setPortrait(line.speaker);
    // Narrator: read every NPC line aloud (gated only by the global autoSpeak /
    // reducedAudio settings — M quiets it, R replays). Was previously limited to
    // lines flagged speechEnabled, so most dialogue stayed silent.
    this.registry.get('act1AudioSystem')?.autoSpeakLine(line);
  }

  _setPortrait(speaker) {
    const key = PORTRAIT_BY_SPEAKER[speaker];
    const show = Boolean(key) && this.textures.exists(key);
    if (show) { this.portrait.setTexture(key).setDisplaySize(148, 210); }
    this.portrait.setVisible(show);
    this.portraitFrame.setVisible(show);
  }

  advance() {
    if (!this.panel.visible || this.choices) return;
    const result = this.registry.get('dialogueSystem').advance();
    if (result?.choicesPending) { this.showChoices(result.choices); return; }
    if (result?.closed) {
      this._closeConversation(result.dialogueId, result.completesObjective, result.completes);
      return;
    }
    this.showLine(result);
  }

  // Graceful leave from any state. Clears any choice menu, force-closes the
  // active dialogue (applying its base completions so a quest-critical talk is
  // never abandoned half-done), hides the box, unfreezes the player, and stops
  // speech. Reachable via Esc or the ✕ button. Idempotent and safe to re-fire.
  _leaveDialogue() {
    if (!this.panel.visible && !this.choices) return;
    this._clearChoices();
    const res = this.registry.get('dialogueSystem')?.leave();
    if (res) {
      this._closeConversation(res.dialogueId, res.completesObjective, res.completes);
      return;
    }
    this.panel.setVisible(false);
    this.registry.set('dialogueActive', false);
    this.registry.get('act1AudioSystem')?.stopSpeech();
    this.registry.events.emit('quest:changed');
  }

  _closeConversation(dialogueId, completesObjective, completes = []) {
    this.panel.setVisible(false);
    this.registry.set('dialogueActive', false);
    this.registry.get('act1AudioSystem')?.stopSpeech();
    if (dialogueId) this.registry.get('act1Runtime')?.applyDialogueEffects(dialogueId);
    const questSystem = this.registry.get('questSystem');
    if (completesObjective) questSystem?.completeObjective(completesObjective);
    for (const objectiveId of completes || []) questSystem?.completeObjective(objectiveId);
    this.registry.events.emit('quest:changed');
  }

  // --- player-choice branching -------------------------------------------
  showChoices(choices) {
    this.choices = choices;
    this.choiceIndex = 0;
    this.hint.setText('↑/↓ + E  ·  Esc leaves');
    this.choiceTexts.forEach((t) => t.destroy());
    this.choiceTexts = [];
    this.choiceBox.removeAll(true);
    const rowH = 30;
    const h = choices.length * rowH + 14;
    const bg = this.add.rectangle(0, 0, this._boxW, h, 0xfff0c7, 0.97)
      .setOrigin(0, 0).setStrokeStyle(3, 0x6b4a33, 1);
    this.choiceBox.add(bg);
    choices.forEach((c, i) => {
      const t = this.add.text(30, 9 + i * rowH, `  ${i + 1}. ${c.label}`, {
        fontFamily: 'Arial', fontSize: '16px', color: '#2f261d',
        wordWrap: { width: this._boxW - 60 },
      }).setInteractive({ useHandCursor: true });
      t.on('pointerdown', (_p, _x, _y, e) => { e?.stopPropagation?.(); this.chooseDialogue(c.id); });
      this.choiceBox.add(t);
      this.choiceTexts.push(t);
    });
    this._choiceBoxH = h;
    this._positionChoiceBox();
    this.choiceBox.setVisible(true);
    this._highlightChoice();
  }

  _positionChoiceBox() {
    const x = Math.round((this.scale.width - this._boxW) / 2);
    const y = Math.round(this.scale.height - this._boxH - 28 - (this._choiceBoxH || 0) - 10);
    this.choiceBox.setPosition(Math.max(8, x), Math.max(8, y));
  }

  _moveChoice(d) {
    this.choiceIndex = (this.choiceIndex + d + this.choices.length) % this.choices.length;
    this._highlightChoice();
  }

  _highlightChoice() {
    this.choiceTexts.forEach((t, i) => {
      const sel = i === this.choiceIndex;
      t.setColor(sel ? '#7a2f1a' : '#2f261d');
      t.setText(`${sel ? '▸' : ' '} ${i + 1}. ${this.choices[i].label}`);
    });
  }

  chooseDialogue(choiceId) {
    const res = this.registry.get('dialogueSystem').choose(choiceId);
    this._clearChoices();
    if (!res) return;
    if (res.baseDialogueId) this.registry.get('act1Runtime')?.applyDialogueEffects(res.baseDialogueId);
    const questSystem = this.registry.get('questSystem');
    for (const objectiveId of res.choiceCompletes || []) questSystem?.completeObjective(objectiveId);
    this.registry.events.emit('quest:changed');
    if (res.branched) { this.showLine(res.line); return; }
    this.panel.setVisible(false);
    this.registry.set('dialogueActive', false);
    this.registry.get('act1AudioSystem')?.stopSpeech();
  }

  _clearChoices() {
    this.choices = null;
    this.choiceIndex = 0;
    if (this.choiceTexts) { this.choiceTexts.forEach((t) => t.destroy()); this.choiceTexts = []; }
    if (this.choiceBox) { this.choiceBox.removeAll(true); this.choiceBox.setVisible(false); }
    if (this.hint) this.hint.setText('E / click  ·  Esc leaves');
  }
}
