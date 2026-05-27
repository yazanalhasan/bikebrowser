export default class DebugScene extends Phaser.Scene {
  constructor() {
    super('DebugScene');
  }

  create() {
    this.visible = false;
    this.text = this.add.text(18, 126, '', {
      fontFamily: 'Consolas, monospace',
      fontSize: '13px',
      color: '#b6f5db',
      backgroundColor: 'rgba(0,0,0,0.55)',
      padding: { x: 8, y: 6 },
    }).setDepth(1300).setScrollFactor(0).setVisible(false);

    this.input.keyboard.on('keydown-F3', () => {
      this.visible = !this.visible;
      this.text.setVisible(this.visible);
    });
  }

  update() {
    if (!this.visible) return;
    const quest = this.registry.get('questSystem')?.getSummary();
    const player = this.registry.get('playerPosition');
    this.text.setText([
      'DEBUG',
      `scene: NeighborhoodScene`,
      `player: ${player ? `${Math.round(player.x)},${Math.round(player.y)}` : 'unknown'}`,
      `quest: ${quest?.id || 'none'}`,
      'F3 toggles this overlay',
    ].join('\n'));
  }
}
