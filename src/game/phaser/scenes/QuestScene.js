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
    const bg = this.add.rectangle(0, 0, 342, 86, 0x203029, 0.72).setOrigin(0, 0);
    bg.setStrokeStyle(2, 0xf2c46d, 0.44);
    const paperGlow = this.add.rectangle(8, 8, 326, 70, 0xfff0c7, 0.05).setOrigin(0, 0);
    const trailDot = this.add.circle(22, 25, 7, 0xf2c46d, 0.92);
    const trailLine = this.add.rectangle(34, 25, 44, 2, 0x8ed6c9, 0.58).setOrigin(0, 0.5);
    const title = this.add.text(14, 10, '', {
      fontFamily: 'Arial',
      fontSize: '15px',
      color: '#ffe8aa',
      fontStyle: 'bold',
    });
    const body = this.add.text(14, 34, '', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#f4f1dc',
      lineSpacing: 3,
      wordWrap: { width: 300 },
    });
    this.panel.add([bg, paperGlow, trailDot, trailLine, title, body]);
    this.title = title;
    this.body = body;
    this.refresh();

    this.registry.events.on('quest:changed', this.refresh, this);
  }

  refresh() {
    const summary = this.registry.get('questSystem')?.getSummary();
    if (!summary) return;
    const nextObjective = summary.objectives.find((objective) => !objective.complete);
    this.title.setText('Today\'s trail');
    this.body.setText(nextObjective ? `${summary.name}: ${nextObjective.label}` : `${summary.name}: follow the next clue.`);
  }
}
