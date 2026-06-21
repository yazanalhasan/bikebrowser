import Phaser from 'phaser';
import { narratePanel } from '../audio/sceneNarration.js';
import { ASSET_KEYS } from '../systems/AssetRegistry.js';

// The Community Crossing Sequence — the emotional climax of Act 1. The repaired
// bridge holds; now the game SHOWS why it mattered. The bridge is not the reward;
// the people are. Six scenes: Mateo crosses (Ramirez watches) -> Ramirez relaxes
// -> Mariam carries her seeds across -> Dex acts cool but cares -> Mr. Chen's quiet
// pride (no speech) -> Zuzu's reflection. Reinforces both north stars: Observe ->
// Predict -> Test -> Trust Evidence, and Observe People -> Understand -> Earn Trust
// -> Build Community. Plays after the player repairs the bridge (player path only).
const BEATS = [
  { text: 'The repair holds. The wash no longer cuts the block in two — and the whole neighborhood comes to see.' },
  // Scene 1 — Mateo crosses; Mrs. Ramirez watches.
  { text: 'A small boy with a backpack bigger than he is stops at the edge. His grandmother waits on the far side.', show: ['mateo'] },
  { who: 'Mrs. Ramirez', text: 'Go on, Mateo — it is safe now. Zuzu tested every plank.' },
  { text: 'Mateo runs across the deck you designed and tested: quick, sure-footed, laughing the whole way.', moves: [{ key: 'mateo', toX: 176 }] },
  // Scene 2 — Ramirez relaxes; it was never about wood and steel.
  { who: 'Mrs. Ramirez', text: '...I can breathe again. No more highway road in the dark. Two minutes home now, not twenty.' },
  { who: 'Mrs. Ramirez', text: 'This was never about wood and steel, mija. It was about him. About all of us.' },
  // Scene 3 — Mariam carries her seeds across; the garden can continue.
  { text: 'Auntie Mariam steps onto the bridge with a small tin box held close to her chest — her seeds.', show: ['mariam'], moves: [{ key: 'mariam', toX: 120 }] },
  { who: 'Auntie Mariam', text: 'My garden can grow on both sides now. A little more of home, where the children can see it grow. Shukran, Zuzu.' },
  // Scene 4 — Dex acts cool, but he cares. A visible step in his arc.
  { who: 'Dex', text: 'Pssh. It’s a bridge. Anybody coulda— ...okay. Okay, it held. Every plank. I watched all of them.', show: ['dex'] },
  { text: 'Dex shoves his hands in his pockets, but he can’t quite hide the grin.' },
  { who: 'Dex', text: '...Teach me to do it your way sometime. The boring way that actually works. Brain.' },
  // Scene 5 — Mr. Chen, quiet pride. No speech, no exposition.
  { text: 'Mr. Chen says nothing. He watches the block cross back and forth, then looks at you — the way a teacher looks when there is nothing left to teach.' },
  // Scene 6 — Zuzu's reflection (the memorable line).
  { who: 'Zuzu', text: 'I thought I was fixing a bridge. Maybe I was building a way for people to come back to each other.', notebook: ['zuzu_crossing'] },
  { text: 'Reward: +250 ZuzuBucks  •  Leonardo Builder Badge earned.', reward: true },
];

export default class CrossingScene extends Phaser.Scene {
  constructor() {
    super('CrossingScene');
  }

  create() {
    this.idx = 0;
    this.panel = this.add.container(480, 200).setScrollFactor(0).setDepth(1500).setVisible(false);
    const bg = this.add.rectangle(0, 0, 620, 360, 0x14110c, 0.98).setOrigin(0.5, 0).setStrokeStyle(4, 0xe2c98a, 1);
    // Anime painted backdrop (GPU art) filling the panel; else the old strip.
    const crossKey = this.textures.exists('bg_crossing') ? 'bg_crossing' : ASSET_KEYS.washCrossingBackdrop;
    this.backdrop = this.add.image(0, 2, crossKey).setOrigin(0.5, 0).setDisplaySize(612, 356).setVisible(false);
    // Scrim behind the lower text band so the light dialogue stays readable.
    this.textScrim = this.add.rectangle(0, 200, 612, 158, 0x140f08, 0.66).setOrigin(0.5, 0);
    this.titleScrim = this.add.rectangle(0, 168, 360, 34, 0x140f08, 0.5).setOrigin(0.5, 0);
    this.title = this.add.text(0, 176, 'The Community Crossing', { fontFamily: 'Arial', fontSize: '20px', color: '#ffe9bf', fontStyle: 'bold' }).setOrigin(0.5, 0);

    // Simple figures on the bridge: player/Zuzu (teal), Mr. Chen (brown),
    // Mrs. Ramirez (rose), plus the community — Mateo (gold kid), Mariam
    // (lavender), Dex (teal-green). The latter three appear as their scenes arrive.
    this.deck = this.add.rectangle(0, 150, 480, 8, 0xb98a4a).setOrigin(0.5);
    this.player = this.add.circle(-200, 138, 9, 0x49c6c0);
    this.chen = this.add.circle(-176, 138, 10, 0xb5793f);
    this.ramirez = this.add.circle(196, 138, 10, 0xd58aa6);
    this.mateo = this.add.circle(-214, 141, 7, 0xf2c94c).setVisible(false);
    this.mariam = this.add.circle(-202, 138, 10, 0xbec8ff).setVisible(false);
    this.dex = this.add.circle(-150, 138, 9, 0x4ad0b0).setVisible(false);
    this._figures = { player: this.player, chen: this.chen, ramirez: this.ramirez, mateo: this.mateo, mariam: this.mariam, dex: this.dex };

    this.speaker = this.add.text(0, 214, '', { fontFamily: 'Arial', fontSize: '14px', color: '#ffd27a', fontStyle: 'bold' }).setOrigin(0.5, 0);
    this.body = this.add.text(0, 238, '', { fontFamily: 'Arial', fontSize: '15px', color: '#f3ead8', wordWrap: { width: 560 }, align: 'center' }).setOrigin(0.5, 0);
    this.hint = this.add.text(0, 326, 'E to continue', { fontFamily: 'Arial', fontSize: '12px', color: '#cbb98f' }).setOrigin(0.5, 0);
    this.panel.add([bg, this.backdrop, this.deck, this.player, this.chen, this.ramirez, this.mateo, this.mariam, this.dex, this.titleScrim, this.title, this.textScrim, this.speaker, this.body, this.hint]);

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
    // Reset the cast: Zuzu, Chen, Ramirez stand by; the community arrives per scene.
    this.player.setPosition(-200, 138);
    this.chen.setPosition(-176, 138);
    this.ramirez.setPosition(196, 138);
    this.mateo.setPosition(-214, 141).setVisible(false);
    this.mariam.setPosition(-202, 138).setVisible(false);
    this.dex.setPosition(-150, 138).setVisible(false);
    this.panel.setVisible(true);
    this._renderBeat();
  }

  _renderBeat() {
    const beat = BEATS[this.idx];
    this.speaker.setText(beat.who || '');
    this.body.setText(beat.text);
    this.hint.setText(this.idx >= BEATS.length - 1 ? 'E to finish' : 'E to continue');
    // Reveal figures entering this scene.
    for (const key of beat.show || []) this._figures[key]?.setVisible(true);
    // Move figures across the deck (the design held — the people cross it).
    for (const m of beat.moves || []) {
      const fig = this._figures[m.key];
      if (!fig) continue;
      fig.setVisible(true);
      this.tweens.add({ targets: fig, x: m.toX, duration: 1100, ease: 'Sine.easeInOut' });
    }
    if (beat.notebook) {
      this.registry.get('act1Runtime')?.unlockNotebookEntries?.(beat.notebook);
    }
    if (beat.reward) {
      this.registry.get('act1Runtime')?.awardCrossingReward?.();
    }
    this._publish();
    // Storyteller narration: read the line itself, not the speaker label, the
    // title, or the "E to continue" hint.
    narratePanel(this, this.panel, { exclude: [this.hint, this.title, this.speaker] });
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
