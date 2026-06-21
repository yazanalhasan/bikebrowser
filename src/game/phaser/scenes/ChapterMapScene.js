import Phaser from 'phaser';
import { ChapterProgressionSystem } from '../systems/ChapterProgressionSystem.js';
import { SAFETY_FACTOR_THREAD } from '../../data/progression.js';

// ChapterMapScene — the Vehicle Ladder. A modal overlay (same pattern as
// Prediction/Bridge/Crossing/Skate) that makes the WHOLE game shape navigable:
// three acts grouped by medium, over the seven-rung vehicle ladder (arc.md §3).
// Opened with `chapters:start`, closed with Esc/click → `chapters:done`.
//
// Chapter 1 (Bike / Sonoran Desert) is the shipped, playable foundation —
// selecting it returns you to the neighborhood. Chapters 2–7 are canonical,
// navigable PREVIEWS: their vehicle, engineering rig, biological domain, region
// and reach are all canon and readable here, with playable content built out one
// vertical slice at a time. This is the carry-forward spine made visible.

const ACT_TINT = { act1: 0x6b5e3a, act2: 0x2f5d6b, act3: 0x3a2f5d };
const STATUS_STYLE = {
  complete: { label: '✓ COMPLETE', color: '#9be79b', card: 0x24402a },
  playable: { label: '▶ PLAY', color: '#ffe7a8', card: 0x3a3420 },
  preview: { label: 'IN DEVELOPMENT', color: '#cfe0ff', card: 0x232a3a },
  locked: { label: '🔒 LOCKED', color: '#9aa0a8', card: 0x24262b },
};

export default class ChapterMapScene extends Phaser.Scene {
  constructor() { super('ChapterMapScene'); }

  create() {
    this.open = false;
    this.root = this.add.container(0, 0).setDepth(2000).setScrollFactor(0).setVisible(false);

    this.scrim = this.add.rectangle(640, 360, 1280, 720, 0x0b0f14, 0.93).setScrollFactor(0);
    this.titleText = this.add.text(640, 30, 'THE VEHICLE LADDER', {
      fontFamily: 'Georgia, serif', fontSize: '30px', color: '#f3e7c8', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setScrollFactor(0);
    this.subText = this.add.text(640, 70, 'Seven chapters · three acts · each rung adds one engineering domain and one biological domain on top of all before it', {
      fontFamily: 'Arial', fontSize: '13px', color: '#b9c2cf', align: 'center', wordWrap: { width: 1100 },
    }).setOrigin(0.5, 0).setScrollFactor(0);
    this.threadText = this.add.text(640, 700, `Through-line: ${SAFETY_FACTOR_THREAD}`, {
      fontFamily: 'Georgia, serif', fontSize: '12px', color: '#8fa0b3', fontStyle: 'italic', align: 'center', wordWrap: { width: 1100 },
    }).setOrigin(0.5, 1).setScrollFactor(0);
    this.hint = this.add.text(1262, 18, 'Esc to leave', {
      fontFamily: 'Arial', fontSize: '13px', color: '#9aa0a8',
    }).setOrigin(1, 0).setScrollFactor(0);

    this.root.add([this.scrim, this.titleText, this.subText, this.threadText, this.hint]);
    this.cardLayer = this.add.container(0, 0).setScrollFactor(0);
    this.root.add(this.cardLayer);

    this.registry.events.on('chapters:start', () => this.show());
    this.input.keyboard.on('keydown-ESC', () => { if (this.open) this.hide(); });
    this.scrim.setInteractive().on('pointerdown', () => { /* swallow background clicks */ });
  }

  progression() {
    const saved = this.registry.get('progression') || {};
    return new ChapterProgressionSystem(saved);
  }

  show() {
    if (this.open) return;
    this.open = true;
    this.scene.bringToTop();
    this.render();
    this.root.setVisible(true);
    this.registry.events.emit('chapters:opened');
  }

  hide() {
    if (!this.open) return;
    this.open = false;
    this.root.setVisible(false);
    this.registry.events.emit('chapters:done');
  }

  render() {
    this.cardLayer.removeAll(true);
    const prog = this.progression();
    const spine = prog.spine();

    // Three act columns across the width.
    const colW = 400;
    const gap = 14;
    const totalW = colW * 3 + gap * 2;
    const startX = 640 - totalW / 2;
    const topY = 110;

    spine.forEach((act, ai) => {
      const x = startX + ai * (colW + gap);
      const header = this.add.rectangle(x + colW / 2, topY, colW, 40, ACT_TINT[act.id] || 0x444, 1)
        .setStrokeStyle(1, 0xffffff, 0.25).setScrollFactor(0);
      const htext = this.add.text(x + colW / 2, topY, `${act.title}`, {
        fontFamily: 'Georgia, serif', fontSize: '17px', color: '#fff', fontStyle: 'bold',
      }).setOrigin(0.5).setScrollFactor(0);
      const setting = this.add.text(x + 10, topY + 26, act.setting, {
        fontFamily: 'Arial', fontSize: '11px', color: '#c7cdd6', wordWrap: { width: colW - 20 },
      }).setOrigin(0, 0).setScrollFactor(0);
      this.cardLayer.add([header, htext, setting]);

      let cy = topY + 78;
      act.chapters.forEach((ch) => {
        cy += this.buildCard(x, cy, colW, ch);
      });
    });
  }

  // Returns the height consumed so the next card stacks below.
  buildCard(x, y, w, ch) {
    const st = STATUS_STYLE[ch.runtimeStatus] || STATUS_STYLE.locked;
    const h = 118;
    const card = this.add.rectangle(x + w / 2, y + h / 2, w, h, st.card, 1)
      .setStrokeStyle(1, 0xffffff, ch.runtimeStatus === 'locked' ? 0.08 : 0.22).setScrollFactor(0);
    const title = this.add.text(x + 12, y + 10, `Ch ${ch.num} · ${ch.vehicle}`, {
      fontFamily: 'Georgia, serif', fontSize: '17px', color: '#fff', fontStyle: 'bold',
    }).setScrollFactor(0);
    const badge = this.add.text(x + w - 12, y + 12, st.label, {
      fontFamily: 'Arial', fontSize: '11px', color: st.color, fontStyle: 'bold',
    }).setOrigin(1, 0).setScrollFactor(0);
    const eng = this.add.text(x + 12, y + 38, `⚙ ${ch.rig}  ·  ${ch.reach}`, {
      fontFamily: 'Arial', fontSize: '11px', color: '#e7d9b0', wordWrap: { width: w - 24 },
    }).setScrollFactor(0);
    const bio = this.add.text(x + 12, y + 58, `🌱 ${ch.bioDomain} — ${ch.bioQuestion}`, {
      fontFamily: 'Arial', fontSize: '11px', color: '#bfe3c3', wordWrap: { width: w - 24 },
    }).setScrollFactor(0);

    const els = [card, title, badge, eng, bio];
    this.cardLayer.add(els);

    // Chapter 1 (playable/complete) is enterable — selecting it returns to the
    // neighborhood. Previews are read-only here.
    if (ch.runtimeStatus === 'playable' || ch.runtimeStatus === 'complete') {
      card.setInteractive({ useHandCursor: true })
        .on('pointerover', () => card.setStrokeStyle(2, 0xffe7a8, 0.9))
        .on('pointerout', () => card.setStrokeStyle(1, 0xffffff, 0.22))
        .on('pointerdown', () => this.enterChapter(ch));
    }
    return h + 10;
  }

  enterChapter(ch) {
    if (ch.entry && ch.entry.type === 'scene') {
      this.hide();
      this.registry.events.emit('chapter:enter', { num: ch.num });
    }
  }
}
