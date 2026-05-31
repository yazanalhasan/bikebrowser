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

  currentLine() {
    if (!this.active) return null;
    return {
      id: this.active.id,
      speaker: this.active.speaker,
      text: this.active.lines[this.index] || '',
      voiceId: this.active.voiceId || null,
      language: this.active.languageTag || 'en-US',
      emotion: this.active.emotion || 'neutral',
      pacing: this.active.pacing || 'normal',
      speechEnabled: this.active.speechEnabled !== false,
      isLast: this.index >= this.active.lines.length - 1,
      completesObjective: this.active.completesObjective || null,
      completes: this.active.completes || [],
    };
  }

  advance() {
    if (!this.active) return null;
    if (this.index < this.active.lines.length - 1) {
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
