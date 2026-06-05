import Phaser from 'phaser';
import { narratePanel } from '../audio/sceneNarration.js';
import { ASSET_KEYS } from '../systems/AssetRegistry.js';

// Phase 6 — Community Crossing (the emotional payoff). The repaired bridge holds,
// and Mr. Chen crosses it to meet Mrs. Ramirez on the far side: a bridge isn't
// just wood and steel — it reconnects people. Plays after the player repairs the
// bridge (player path only). Awards the Leonardo Builder Badge + ZuzuBucks.
const BEATS = [
  { who: '', text: 'The bridge holds. The wash no longer cuts the block in two.', move: false },
  { who: 'Mr. Chen', text: 'Watch — I have not crossed to the far side since the storm.', move: false },
  { who: '', text: 'Mr. Chen steps onto the deck you designed and tested. It holds his weight, steady.', move: true },
  { who: 'Mrs. Ramirez', text: 'Gracias, Zuzu. You reconnected the whole block — and brought my old friend back across.', move: false },
  { who: 'Mr. Chen', text: 'You did not just fix wood and steel. You connected people again. That is what a bridge is for.', move: false },
  { who: '', text: 'Reward: +250 ZuzuBucks  •  Leonardo Builder Badge earned.', move: false, reward: true },
];

export default class CrossingScene extends Phaser.Scene {
  constructor() {
    super('CrossingScene');
  }

  create() {
    this.idx = 0;
    this.panel = this.add.container(480, 200).setScrollFactor(0).setDepth(1500).setVisible(false);
    const bg = this.add.rectangle(0, 0, 620, 360, 0x14110c, 0.98).setOrigin(0.5, 0).setStrokeStyle(4, 0xe2c98a, 1);
    this.backdrop = this.add.image(0, 14, ASSET_KEYS.washCrossingBackdrop).setOrigin(0.5, 0).setDisplaySize(560, 150).setVisible(false);
    this.title = this.add.text(0, 176, 'Mr. Chen’s Crossing', { fontFamily: 'Arial', fontSize: '20px', color: '#ffe9bf', fontStyle: 'bold' }).setOrigin(0.5, 0);

    // Simple figures on the bridge: player (teal), Mr. Chen (brown), Mrs. Ramirez (rose).
    this.deck = this.add.rectangle(0, 150, 480, 8, 0xb98a4a).setOrigin(0.5);
    this.player = this.add.circle(-200, 138, 9, 0x49c6c0);
    this.chen = this.add.circle(-176, 138, 10, 0xb5793f);
    this.ramirez = this.add.circle(196, 138, 10, 0xd58aa6);

    this.speaker = this.add.text(0, 214, '', { fontFamily: 'Arial', fontSize: '14px', color: '#ffd27a', fontStyle: 'bold' }).setOrigin(0.5, 0);
    this.body = this.add.text(0, 238, '', { fontFamily: 'Arial', fontSize: '15px', color: '#f3ead8', wordWrap: { width: 560 }, align: 'center' }).setOrigin(0.5, 0);
    this.hint = this.add.text(0, 326, 'E to continue', { fontFamily: 'Arial', fontSize: '12px', color: '#cbb98f' }).setOrigin(0.5, 0);
    this.panel.add([bg, this.backdrop, this.title, this.deck, this.player, this.chen, this.ramirez, this.speaker, this.body, this.hint]);

    this.registry.events.on('crossing:start', () => this.startFlow());
    this.keyHandler = (event) => this.onKey(event);
    window.addEventListener('keydown', this.keyHandler);
    this.events.once('shutdown', () => window.removeEventListener('keydown', this.keyHandler));
    this._publish();
  }

  startFlow() {
    this.idx = 0;
    this.registry.set('modalActive', true);
    this.backdrop.setVisible(true);
    this.player.setPosition(-200, 138);
    this.chen.setPosition(-176, 138);
    this.panel.setVisible(true);
    this._renderBeat();
  }

  _renderBeat() {
    const beat = BEATS[this.idx];
    this.speaker.setText(beat.who || '');
    this.body.setText(beat.text);
    this.hint.setText(this.idx >= BEATS.length - 1 ? 'E to finish' : 'E to continue');
    if (beat.move) {
      // Mr. Chen (and the player) cross to the far side — the design held.
      this.tweens.add({ targets: this.chen, x: 150, duration: 1100, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: this.player, x: 120, duration: 1100, delay: 120, ease: 'Sine.easeInOut' });
    }
    if (beat.reward) {
      const runtime = this.registry.get('act1Runtime');
      runtime?.awardCrossingReward?.();
    }
    this._publish();
    narratePanel(this, this.panel, { exclude: [this.hint, this.title] });
  }

  onKey(event) {
    if (!this.panel.visible) return;
    const key = (event.key || '').toLowerCase();
    if (event.key === 'Escape') { this._finish(); return; }
    if (key === 'e' || event.code === 'Space') {
      if (this.idx >= BEATS.length - 1) { this._finish(); return; }
      this.idx += 1;
      this._renderBeat();
    }
  }

  _finish() {
    this.panel.setVisible(false);
    this.backdrop.setVisible(false);
    this.registry.set('modalActive', false);
    this.registry.events.emit('crossing:done');
    this.registry.events.emit('quest:changed');
    this._publish();
  }

  _publish() {
    const beat = BEATS[this.idx];
    window.__CROSSING__ = {
      active: this.panel.visible,
      beatIndex: this.idx,
      beatCount: BEATS.length,
      speaker: beat ? beat.who : null,
      done: !this.panel.visible && this.idx >= BEATS.length - 1,
    };
  }
}
