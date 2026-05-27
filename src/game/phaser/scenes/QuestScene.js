import { QuestSystem } from '../systems/QuestSystem.js';

export default class QuestScene extends Phaser.Scene {
  constructor() {
    super('QuestScene');
  }

  create() {
    const existing = this.registry.get('questSystem');
    const questSystem = existing || new QuestSystem();
    this.registry.set('questSystem', questSystem);

    this.panel = this.add.container(18, 18).setScrollFactor(0).setDepth(1000);
    const bg = this.add.rectangle(0, 0, 310, 96, 0x16201d, 0.72).setOrigin(0, 0);
    const title = this.add.text(14, 10, '', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffe8aa',
    });
    const body = this.add.text(14, 35, '', {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#f4f1dc',
      lineSpacing: 4,
      wordWrap: { width: 280 },
    });
    this.panel.add([bg, title, body]);
    this.title = title;
    this.body = body;
    this.refresh();

    this.registry.events.on('quest:changed', this.refresh, this);
  }

  refresh() {
    const summary = this.registry.get('questSystem')?.getSummary();
    if (!summary) return;
    this.title.setText(summary.name);
    this.body.setText(summary.objectives.map((objective) => `${objective.complete ? '✓' : '•'} ${objective.label}`).join('\n'));
  }
}
