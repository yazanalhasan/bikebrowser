import { dialogue } from '../data/dialogue.js';

export class DialogueSystem {
  constructor() {
    this.dialogue = new Map(dialogue.map((entry) => [entry.id, entry]));
    this.active = null;
    this.index = 0;
  }

  start(id) {
    const entry = this.dialogue.get(id);
    if (!entry) return null;
    this.active = entry;
    this.index = 0;
    return this.currentLine();
  }

  // Effective lines: an NPC's self-introduction (if any) is spoken first, once,
  // before their actual lines — so characters introduce themselves.
  _lines() {
    if (!this.active) return [];
    return this.active.intro ? [this.active.intro, ...this.active.lines] : this.active.lines;
  }

  currentLine() {
    if (!this.active) return null;
    const lines = this._lines();
    return {
      id: this.active.id,
      speaker: this.active.speaker,
      text: lines[this.index] || '',
      voiceId: this.active.voiceId || null,
      language: this.active.languageTag || 'en-US',
      emotion: this.active.emotion || 'neutral',
      pacing: this.active.pacing || 'normal',
      speechEnabled: this.active.speechEnabled !== false,
      isLast: this.index >= lines.length - 1,
      completesObjective: this.active.completesObjective || null,
      completes: this.active.completes || [],
    };
  }

  advance() {
    if (!this.active) return null;
    if (this.index < this._lines().length - 1) {
      this.index += 1;
      return this.currentLine();
    }
    const completed = this.active.completesObjective || null;
    const completedMany = this.active.completes || [];
    const dialogueId = this.active.id;
    this.active = null;
    this.index = 0;
    return { closed: true, dialogueId, completesObjective: completed, completes: completedMany };
  }
}
