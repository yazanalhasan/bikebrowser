import Phaser from 'phaser';
import { narrateText } from '../audio/sceneNarration.js';
import { ASSET_KEYS, MATERIAL_PART_FRAME } from '../systems/AssetRegistry.js';
import { act1Materials, BRIDGE_FAMILIES, DAVINCI_SLOTS, DAVINCI_WOODS } from '../../data/act1/index.js';

// HANDS-ON bridge construction. The player first chooses a BRIDGE FAMILY, then
// physically assembles it:
//   • Truss  — seat a tested material into each role (deck/support/brace/cable/
//              foundation) on a glowing snap template. (the original assembly)
//   • Da Vinci — a self-supporting interlocking-beam arch: seat short wooden
//              beams bottom-up so each is held by the ones beneath it; no nails.
//              Wrong angle / a beam left floating → it is not self-supporting and
//              collapses. Correct geometry → the chosen wood is load-tested.
// Both feed the SAME structural engine via runtime.designBridge(selection); the
// UI owns geometry + family, the solver stays authoritative on materials.
//
// PRESERVED CONTRACT (Playwright + sibling systems depend on it):
//   • window.__BRIDGE_DESIGN__ { active, phase, role, candidateId, candidateIndex,
//       candidates, selection, outcome, bridgeType, ... } — extended, never broken.
//   • 'bridgeDesign:start' opens the scene; Escape always exits.
//   • runtime.designBridge(selection) is the only solver entry point.
//   • 'loadTest:start' fires with the selection after a holding design.
//   • selection stays { bridgeType, deck, support, brace, cable, foundation }.

const ZONES = [
  { key: 'deck', label: 'DECK', hint: 'the roadway you ride across', x: 640, y: 274, w: 300, h: 26, ideal: 0, tip: 'lay it flat' },
  { key: 'support', label: 'SUPPORT', hint: 'the legs that carry the load down', x: 640, y: 402, w: 56, h: 96, ideal: 90, tip: 'stand it vertical' },
  { key: 'brace', label: 'BRACE', hint: 'the triangle that stiffens the span', x: 640, y: 338, w: 150, h: 60, ideal: 45, tip: 'angle it diagonal' },
  { key: 'cable', label: 'CABLE', hint: 'lines that pull the deck up — tension', x: 640, y: 204, w: 330, h: 30, ideal: 135, tip: 'string it taut' },
  { key: 'foundation', label: 'FOUNDATION', hint: 'anchors pressed into the ground — compression', x: 640, y: 474, w: 220, h: 30, ideal: 0, tip: 'seat it on bedrock' },
];
const ZONE_BY_KEY = Object.fromEntries(ZONES.map((z) => [z.key, z]));

const MATERIAL_COLORS = {
  balsa: 0xe8d6a8, pine: 0xd9b06a, bamboo: 0x9ec46a, brick: 0xb0573a,
  concrete: 0x9a9a92, iron: 0x73808f, steel: 0xaeb8c6, carbon_fiber: 0x3b414c,
};
const ROT_STEP = 45; // truss: R cycles 0 → 45 → 90 → 135
const DV_ROT_STEP = 15; // da vinci: finer rotation for interlock
const DV_ANGLE_TOL = 12; // degrees within ideal to count as "interlocked"

export default class BridgeDesignScene extends Phaser.Scene {
  constructor() {
    super('BridgeDesignScene');
  }

  create() {
    this.phase = 'idle'; // idle | blocked | family | choose | ready | dv_wood | dv_build | dv_ready | result
    this.bridgeType = 'truss';
    this.familyIdx = 0;
    // truss state
    this.candidates = [];
    this.heldIdx = 0;
    this.heldRot = 0;
    this.selection = {};
    this.placed = {};
    this.trayPieces = [];
    this.dragging = null;
    this.success = false;
    // da vinci state
    this.dvWoods = [];
    this.dvWoodIdx = 0;
    this.dvWood = null;
    this.dvSlots = DAVINCI_SLOTS.map(() => ({ mat: null, rot: 0, piece: null }));
    this.dvActive = 0;
    this.dvHeldRot = 0;
    this.dvBeam = null;
    this.familyRows = [];

    this.matById = new Map(act1Materials.map((m) => [m.id, m]));

    // --- static chrome (one container we show/hide) -------------------------
    this.chrome = this.add.container(0, 0).setScrollFactor(0).setDepth(1400).setVisible(false);
    const leoKey = this.textures.exists(ASSET_KEYS.leonardoNotebookArt) ? ASSET_KEYS.leonardoNotebookArt : ASSET_KEYS.leonardoNotebookBackdrop;
    const bg = this.add.image(640, 300, leoKey).setOrigin(0.5).setDisplaySize(960, 600).setAlpha(0.97);
    const wash = this.add.image(640, 360, ASSET_KEYS.washCrossingBackdrop).setOrigin(0.5).setDisplaySize(620, 150).setAlpha(0.28);
    this.title = this.add.text(640, 54, '', { fontFamily: 'Georgia, serif', fontSize: '24px', color: '#3a2a18', fontStyle: 'bold' }).setOrigin(0.5);
    this.subtitle = this.add.text(640, 86, '', { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#5a3d22', align: 'center', wordWrap: { width: 820 } }).setOrigin(0.5);
    this.ghostGfx = this.add.graphics();      // truss zones
    this.activeGfx = this.add.graphics();     // truss active zone
    this.dvGfx = this.add.graphics();         // da vinci ghost arch + slot states
    this.dvActiveGfx = this.add.graphics();   // da vinci active slot
    this.zoneLabels = ZONES.map((z) => this.add.text(z.x, z.y, z.label, { fontFamily: 'Georgia, serif', fontSize: '11px', color: '#7a5a32' }).setOrigin(0.5).setAlpha(0.7));
    this.verdict = this.add.text(640, 548, '', { fontFamily: 'Georgia, serif', fontSize: '17px', color: '#3a2a18', fontStyle: 'bold', align: 'center', wordWrap: { width: 760 } }).setOrigin(0.5);
    this.trayLabel = this.add.text(640, 588, '', { fontFamily: 'Georgia, serif', fontSize: '12px', color: '#6f5430' }).setOrigin(0.5);
    this.hint = this.add.text(640, 700, '', { fontFamily: 'Georgia, serif', fontSize: '12px', color: '#6f5430' }).setOrigin(0.5);

    this.meterDefs = [
      { key: 'strength', label: 'Strength', good: true },
      { key: 'weight', label: 'Weight', good: false },
      { key: 'stability', label: 'Stable', good: true },
      { key: 'flood', label: 'Flood', good: true },
      { key: 'cost', label: 'Cost', good: false },
    ];
    this.meterGfx = this.add.graphics();
    this.meterLabels = this.meterDefs.map((d, i) => this.add.text(70, 214 + i * 30, d.label, { fontFamily: 'Georgia, serif', fontSize: '11px', color: '#6f5430' }).setOrigin(0, 0));

    this.testBtn = this.add.container(640, 624).setVisible(false);
    this.testBtnBg = this.add.rectangle(0, 0, 220, 46, 0x6f9a4a, 1).setStrokeStyle(3, 0x3f5e28, 1);
    this.testBtnTxt = this.add.text(0, 0, '⚒  TEST BRIDGE', { fontFamily: 'Georgia, serif', fontSize: '18px', color: '#fdfbe9', fontStyle: 'bold' }).setOrigin(0.5);
    this.testBtn.add([this.testBtnBg, this.testBtnTxt]);
    this.testBtnBg.setInteractive({ useHandCursor: true }).on('pointerup', () => { if (this.phase === 'ready' || this.phase === 'dv_ready') this._testBridge(); });

    this.chrome.add([bg, wash, this.title, this.subtitle, this.ghostGfx, this.activeGfx, this.dvGfx, this.dvActiveGfx,
      ...this.zoneLabels, this.meterGfx, ...this.meterLabels, this.verdict, this.trayLabel, this.hint, this.testBtn]);

    this._drawGhost();

    this.input.on('dragstart', (_p, obj) => this._onDragStart(obj));
    this.input.on('drag', (_p, obj, dx, dy) => { obj.setPosition(dx, dy); this._publish(); });
    this.input.on('dragend', (_p, obj) => this._onDragEnd(obj));

    this.registry.events.on('bridgeDesign:start', () => this.startFlow());
    this.keyHandler = (event) => this.onKey(event);
    window.addEventListener('keydown', this.keyHandler);
    this.events.once('shutdown', () => window.removeEventListener('keydown', this.keyHandler));
    this._publish();
  }

  _cue(name) {
    // Web-Audio interaction cue (Phaser audio is disabled; this uses Act1AudioSystem).
    this.registry.get('act1Runtime')?.audioSystem?.playInteractionCue?.(name);
  }

  // ========================================================================
  startFlow() {
    const runtime = this.registry.get('act1Runtime');
    const tested = runtime?.materialsLabSystem?.getState().tested || [];
    this.registry.set('modalActive', true);
    this._setVisible(true);
    if (!tested.length) { this._showBlocked(); return; }
    this.candidates = tested.map((t) => ({ id: t.materialId, name: t.displayName, safe: Boolean(t.bridgeSafe), band: t.strengthBand }));
    this.dvWoods = this.candidates.filter((c) => DAVINCI_WOODS.includes(c.id));
    this.familyIdx = 0;
    this._showFamily();
  }

  _hideAllModeGfx() {
    this.ghostGfx.setVisible(false); this.activeGfx.clear();
    this.dvGfx.setVisible(false).clear(); this.dvActiveGfx.clear();
    this.zoneLabels.forEach((l) => l.setVisible(false));
    this.meterGfx.clear(); this.meterLabels.forEach((l) => l.setVisible(false));
    this.testBtn.setVisible(false);
  }

  // ===== Bridge family selection ==========================================
  _showFamily() {
    this.phase = 'family';
    this._clearDynamic();
    this._hideAllModeGfx();
    this.title.setText('Choose a bridge to build');
    this.subtitle.setText('Each kind teaches a different way to carry a load across the gap.');
    this.verdict.setText('');
    this.trayLabel.setText('');
    this.hint.setText('▲ ▼ choose    E build    Esc leave');
    this._renderFamily();
    this._publish();
    narrateText(this, 'Choose a bridge to build.');
  }

  _renderFamily() {
    this.familyRows.forEach((r) => r.destroy());
    this.familyRows = [];
    const y0 = 150;
    BRIDGE_FAMILIES.forEach((fam, i) => {
      const y = y0 + i * 66;
      const selected = i === this.familyIdx;
      const ready = fam.status === 'ready';
      const row = this.add.container(640, y).setScrollFactor(0).setDepth(1430);
      const box = this.add.rectangle(0, 0, 600, 58, 0xe7d6ac, selected ? 0.92 : 0.5)
        .setStrokeStyle(selected ? 4 : 2, selected ? 0xe0a93a : 0x8a6a3c, selected ? 1 : 0.6);
      const name = this.add.text(-280, -14, fam.name, { fontFamily: 'Georgia, serif', fontSize: '18px', color: ready ? '#3a2a18' : '#8a7a5a', fontStyle: 'bold' }).setOrigin(0, 0);
      const concept = this.add.text(-280, 10, fam.concept, { fontFamily: 'Georgia, serif', fontSize: '12px', color: ready ? '#5a3d22' : '#9a8a6a' }).setOrigin(0, 0);
      const badge = this.add.text(280, 0, ready ? 'BUILD ▶' : 'soon', { fontFamily: 'Georgia, serif', fontSize: ready ? '15px' : '12px', color: ready ? '#2f6b2a' : '#9a8a6a', fontStyle: ready ? 'bold' : 'italic' }).setOrigin(1, 0.5);
      row.add([box, name, concept, badge]);
      box.setInteractive({ useHandCursor: true })
        .on('pointerover', () => { this.familyIdx = i; this._renderFamily(); this._publish(); })
        .on('pointerup', () => { this.familyIdx = i; this._selectFamily(); });
      this.chrome.add(row);
      this.familyRows.push(row);
    });
  }

  _selectFamily() {
    const fam = BRIDGE_FAMILIES[this.familyIdx];
    if (!fam) return;
    if (fam.status !== 'ready') {
      this._cue('bridge_error');
      this.subtitle.setText(`${fam.name} is coming soon — try the Da Vinci or Truss bridge for now.`);
      this._publish();
      return;
    }
    this._cue('bridge_lock');
    this.bridgeType = fam.key;
    this.familyRows.forEach((r) => r.destroy());
    this.familyRows = [];
    if (fam.key === 'davinci') { this._showDvWood(); } else { this._resetAssembly(); this._showChoose(); }
  }

  _showBlocked() {
    this.phase = 'blocked';
    this._clearDynamic();
    this._hideAllModeGfx();
    this.title.setText('Plan the bridge repair');
    this.subtitle.setText('You need tested materials before you can build.');
    this.verdict.setText('Test materials at the UTM first, then come back to assemble the bridge.').setColor('#8a5a1a');
    this.trayLabel.setText('');
    this.hint.setText('E or Esc to head back');
    this._publish();
    narrateText(this, 'Test materials at the UTM first, then come back to assemble the bridge.');
  }

  // ========================================================================
  // TRUSS assembly (deck/support/brace/cable/foundation)
  // ========================================================================
  _resetAssembly() {
    this.selection = {};
    Object.values(this.placed).forEach((p) => p.destroy());
    this.placed = {};
    this.heldIdx = 0;
    this.heldRot = 0;
    this.success = false;
    this.verdict.setText('');
    this.testBtn.setVisible(false);
    this._buildTray();
  }

  _showChoose() {
    this.phase = 'choose';
    this.ghostGfx.setVisible(true); this.zoneLabels.forEach((l) => l.setVisible(true));
    this.meterLabels.forEach((l) => l.setVisible(true));
    this.testBtn.setVisible(false);
    this.verdict.setText('');
    this.title.setText('Assemble the truss bridge');
    this.trayLabel.setText('Tested parts — drag onto a glowing slot, or ◀ ▶ then E');
    this.hint.setText('◀ ▶ pick   R rotate   E place   ⌫ remove   Esc leave');
    this._refreshSubtitle();
    this._highlightHeld();
    this._drawMeters();
    this._updateActive();
    this._publish();
  }

  _activeZone() {
    return ZONES.find((z) => !this.selection[z.key]) || null;
  }

  _refreshSubtitle() {
    const z = this._activeZone();
    if (z) {
      const held = this.candidates[this.heldIdx];
      this.subtitle.setText(`Next slot: ${z.label} — ${z.hint}.   Holding: ${held ? held.name : '—'}`);
    } else {
      this.subtitle.setText('Every slot is filled. Press TEST BRIDGE when you are ready.');
    }
  }

  _drawGhost() {
    const g = this.ghostGfx;
    g.clear();
    g.fillStyle(0x6b4a2a, 0.12).fillRect(420, 300, 440, 210);
    ZONES.forEach((z) => {
      g.lineStyle(2, 0x8a6a3c, 0.55);
      g.fillStyle(0xe7d6ac, 0.18);
      g.fillRoundedRect(z.x - z.w / 2, z.y - z.h / 2, z.w, z.h, 6);
      g.strokeRoundedRect(z.x - z.w / 2, z.y - z.h / 2, z.w, z.h, 6);
    });
    g.lineStyle(2, 0x8a6a3c, 0.3);
    g.strokeRect(560, 360, 12, 150); g.strokeRect(708, 360, 12, 150);
  }

  _updateActive() {
    const z = this._activeZone();
    this.activeGfx.clear();
    if (!z || this.phase !== 'choose') return;
    this.activeGfx.lineStyle(3, 0xe0a93a, 0.95);
    this.activeGfx.strokeRoundedRect(z.x - z.w / 2 - 4, z.y - z.h / 2 - 4, z.w + 8, z.h + 8, 8);
  }

  _buildTray() {
    this.trayPieces.forEach((p) => p.destroy());
    this.trayPieces = [];
    const n = this.candidates.length;
    const span = Math.min(1100, n * 150);
    const x0 = 640 - span / 2 + span / (2 * n);
    this.candidates.forEach((c, i) => {
      const x = n > 1 ? x0 + (span / n) * i : 640;
      const piece = this._makePiece(c.id, c, 96, 34, false);
      piece.setPosition(x, 636);
      piece.setData('matIdx', i);
      piece.setData('home', { x, y: 636 });
      piece.setSize(96, 34).setInteractive({ useHandCursor: true });
      this.input.setDraggable(piece);
      this.chrome.add(piece);
      this.trayPieces.push(piece);
    });
    this._highlightHeld();
  }

  _makePiece(matId, cand, w, h, placed) {
    const color = MATERIAL_COLORS[matId] ?? 0xb98a4a;
    const c = this.add.container(0, 0).setScrollFactor(0).setDepth(placed ? 1420 : 1440);
    let base;
    if (this.textures.exists(ASSET_KEYS.materialParts) && MATERIAL_PART_FRAME[matId] != null) {
      base = this.add.sprite(0, 0, ASSET_KEYS.materialParts, MATERIAL_PART_FRAME[matId]).setDisplaySize(w, h);
    } else {
      base = this.add.rectangle(0, 0, w, h, color, 1).setStrokeStyle(3, 0x3a2a18, 0.85);
      base.setData('color', color);
    }
    const dark = matId === 'carbon_fiber' || matId === 'iron';
    const name = this.add.text(0, -1, cand.name || matId, { fontFamily: 'Georgia, serif', fontSize: '12px', color: dark ? '#f4eccf' : '#2a1d10', fontStyle: 'bold', stroke: dark ? '#1a1d24' : '#f0e6c8', strokeThickness: 3 }).setOrigin(0.5);
    const verdict = this.add.text(0, h / 2 + 1, cand.safe ? '✓ held' : '✗ snapped', { fontFamily: 'Georgia, serif', fontSize: '9px', color: cand.safe ? '#2f6b2a' : '#9a2f1a' }).setOrigin(0.5, 0);
    const ring = this.add.rectangle(0, 0, w + 8, h + 8, 0x000000, 0).setStrokeStyle(3, 0xe0a93a, 0).setName('ring');
    const warn = this.add.text(w / 2 - 2, -h / 2 - 2, cand.safe ? '' : '⚠', { fontSize: '13px', color: '#c4471f' }).setOrigin(1, 1);
    c.add([base, ring, name, verdict, warn]);
    c.setData('matId', matId);
    c.setData('safe', cand.safe);
    c.setData('base', base);
    return c;
  }

  _paintPiece(piece, mode) {
    const base = piece?.getData?.('base');
    if (!base) return;
    const COLORS = { hold: 0x86c06a, fail: 0xff6b6b, reject: 0xc4471f, warn: 0xe0a93a };
    if (base.type === 'Sprite') {
      if (mode === 'normal') base.clearTint(); else base.setTint(COLORS[mode]);
    } else if (base.setFillStyle) {
      base.setFillStyle(mode === 'normal' ? (base.getData('color') ?? 0xb98a4a) : COLORS[mode]);
    }
  }

  _highlightHeld() {
    this.trayPieces.forEach((p, i) => {
      const ring = p.getByName('ring');
      if (ring) ring.setStrokeStyle(3, 0xe0a93a, i === this.heldIdx ? 0.95 : 0);
      p.setScale(i === this.heldIdx ? 1.08 : 1);
      p.setAngle(i === this.heldIdx ? this.heldRot : 0);
    });
  }

  _place(zoneKey, matIdx) {
    const zone = ZONE_BY_KEY[zoneKey];
    const cand = this.candidates[matIdx];
    if (!zone || !cand) return;
    this.selection[zone.key] = cand.id;
    if (this.placed[zone.key]) this.placed[zone.key].destroy();
    const piece = this._makePiece(cand.id, cand, Math.max(40, zone.w - 8), Math.max(20, zone.h - 4), true);
    piece.setPosition(zone.x, zone.y).setAngle(this.heldRot);
    this.chrome.add(piece);
    this.placed[zone.key] = piece;
    const snug = ((this.heldRot % 180) === (zone.ideal % 180));
    this._snapFlash(zone, cand.safe, snug);
    this._cue(cand.safe ? 'bridge_snap' : 'bridge_error');
    this.tweens.add({ targets: piece, scale: { from: 1.25, to: 1 }, duration: 200, ease: 'Back.easeOut' });
    narrateText(this, `${cand.name} into the ${zone.label}.` + (cand.safe ? '' : ' But it failed the load test.'));
    const next = this._activeZone();
    if (!next) { this._showReady(); } else { this._showChoose(); }
  }

  _removeActiveTruss() {
    // remove the most-recently-relevant placed piece: the last filled zone
    const filled = ZONES.filter((z) => this.selection[z.key]);
    const zone = filled[filled.length - 1];
    if (!zone) return;
    this.placed[zone.key]?.destroy();
    delete this.placed[zone.key];
    delete this.selection[zone.key];
    this._cue('bridge_error');
    this._showChoose();
  }

  _snapFlash(zone, safe, snug) {
    const col = !safe ? 0xc4471f : snug ? 0x6f9a4a : 0xe0a93a;
    const flash = this.add.rectangle(zone.x, zone.y, zone.w + 14, zone.h + 14, col, 0.45).setScrollFactor(0).setDepth(1480);
    this.chrome.add(flash);
    this.tweens.add({ targets: flash, alpha: 0, scaleX: 1.3, scaleY: 1.3, duration: 320, onComplete: () => flash.destroy() });
    if (safe && !snug) {
      this.subtitle.setText(`Tilted — press R to ${zone.tip} for a snug fit. (It still counts.)`);
    } else if (!safe) {
      this.subtitle.setText('⚠ That material snapped at the UTM — it will likely fail the load test.');
    }
  }

  _showReady() {
    this.phase = 'ready';
    this.activeGfx.clear();
    this._armTestButton();
    this.title.setText('Bridge assembled');
    this.subtitle.setText('Every slot is filled. Press TEST BRIDGE to load it.');
    this.hint.setText('E / Enter or click TEST BRIDGE   ◀ ▶ swap a part   ⌫ remove   Esc leave');
    this._drawMeters();
    this._publish();
    narrateText(this, 'Bridge assembled. Press Test Bridge to load it.');
  }

  _armTestButton() {
    this.tweens.killTweensOf(this.testBtn);
    this.testBtn.setVisible(true).setScale(1);
    this.tweens.add({ targets: this.testBtn, scale: 1.06, duration: 520, yoyo: true, repeat: -1 });
  }

  _cycleHeld(dir) {
    if (!this.candidates.length) return;
    this.heldIdx = (this.heldIdx + dir + this.candidates.length) % this.candidates.length;
    this._highlightHeld();
    this._refreshSubtitle();
    if (this.phase !== 'choose') this._showChoose();
    this._publish();
    const c = this.candidates[this.heldIdx];
    narrateText(this, `${c.name}. ${c.safe ? 'held the load' : 'snapped under load'}.`);
  }

  _rotateHeld() {
    this.heldRot = (this.heldRot + ROT_STEP) % 180;
    this._highlightHeld();
    const z = this._activeZone();
    if (z) this.subtitle.setText(`Holding ${this.candidates[this.heldIdx]?.name} at ${this.heldRot}°. ${z.label} likes ${z.ideal}° — ${z.tip}.`);
    this._publish();
  }

  // ========================================================================
  // DA VINCI self-supporting interlocking arch
  // ========================================================================
  _showDvWood() {
    this.phase = 'dv_wood';
    this._clearDynamic();
    this._hideAllModeGfx();
    this.dvSlots = DAVINCI_SLOTS.map(() => ({ mat: null, rot: 0, piece: null }));
    this.success = false;
    this.dvWoodIdx = 0;
    this.verdict.setText('');
    this.title.setText('Da Vinci bridge — choose your beam wood');
    this.trayLabel.setText('');
    this.hint.setText('◀ ▶ pick wood    E confirm    Esc leave');
    if (!this.dvWoods.length) {
      this.subtitle.setText('The arch is built from wood — test balsa, pine, or bamboo at the UTM first.');
      this._publish();
      return;
    }
    this._renderDvWood();
    this._publish();
    narrateText(this, 'Choose your beam wood. The arch interlocks with no nails.');
  }

  _renderDvWood() {
    this._clearDynamic();
    this.subtitle.setText('Interlocking beams, no nails — the geometry holds it up. Pick a tested wood.');
    const n = this.dvWoods.length;
    const span = Math.min(700, n * 160);
    const x0 = 640 - span / 2 + span / (2 * n);
    this.dvWoods.forEach((c, i) => {
      const x = n > 1 ? x0 + (span / n) * i : 640;
      const piece = this._makePiece(c.id, c, 110, 36, false);
      piece.setPosition(x, 320);
      piece.setData('woodIdx', i);
      piece.setData('home', { x, y: 320 });
      const ring = piece.getByName('ring');
      if (ring) ring.setStrokeStyle(3, 0xe0a93a, i === this.dvWoodIdx ? 0.95 : 0);
      piece.setScale(i === this.dvWoodIdx ? 1.1 : 1);
      piece.setSize(110, 36).setInteractive({ useHandCursor: true })
        .on('pointerover', () => { this.dvWoodIdx = i; this._renderDvWood(); })
        .on('pointerup', () => { this.dvWoodIdx = i; this._confirmDvWood(); });
      this.chrome.add(piece);
      this.trayPieces.push(piece);
    });
  }

  _confirmDvWood() {
    this.dvWood = this.dvWoods[this.dvWoodIdx]?.id;
    if (!this.dvWood) return;
    this._cue('bridge_lock');
    this._showDvBuild();
  }

  _showDvBuild() {
    this.phase = 'dv_build';
    this._clearDynamic();
    this._hideAllModeGfx();
    this.dvGfx.setVisible(true);
    this.title.setText('Build the self-supporting arch');
    this.trayLabel.setText('Drag a beam onto a slot, or ◀ ▶ choose a slot then E');
    this.hint.setText('◀ ▶ slot   R rotate   E place   ⌫ remove   Esc leave');
    this.dvActive = this._dvNextOpen();
    this.dvHeldRot = DAVINCI_SLOTS[this.dvActive]?.angle ?? 0;
    this._buildDvBeam();
    this._redrawDv();
    this._refreshDvSubtitle();
    this._publish();
  }

  _buildDvBeam() {
    this.dvBeam?.destroy();
    const wood = this.dvWoods[this.dvWoodIdx] || { id: this.dvWood, name: this.dvWood, safe: true };
    const beam = this._makeBeam(this.dvWood, wood, 76, 16);
    beam.setPosition(640, 636).setAngle(0);
    beam.setData('home', { x: 640, y: 636 });
    beam.setData('isDvBeam', true);
    beam.setSize(86, 30).setInteractive({ useHandCursor: true });
    this.input.setDraggable(beam);
    this.chrome.add(beam);
    this.dvBeam = beam;
  }

  _makeBeam(matId, cand, w, h) {
    const color = MATERIAL_COLORS[matId] ?? 0xcaa46a;
    const c = this.add.container(0, 0).setScrollFactor(0).setDepth(1440);
    let base;
    if (this.textures.exists(ASSET_KEYS.materialParts) && MATERIAL_PART_FRAME[matId] != null) {
      base = this.add.sprite(0, 0, ASSET_KEYS.materialParts, MATERIAL_PART_FRAME[matId]).setDisplaySize(w, h);
    } else {
      base = this.add.rectangle(0, 0, w, h, color, 1).setStrokeStyle(2, 0x3a2a18, 0.85);
      base.setData('color', color);
    }
    c.add([base]);
    c.setData('base', base);
    c.setData('matId', matId);
    return c;
  }

  _dvNextOpen() {
    for (let i = 0; i < DAVINCI_SLOTS.length; i += 1) if (!this.dvSlots[i].mat) return i;
    return 0;
  }

  _angleOk(held, ideal) {
    let d = Math.abs(((held - ideal) % 360 + 360) % 360);
    d = Math.min(d, 360 - d);
    return d <= DV_ANGLE_TOL;
  }

  // 'green' seated & interlocked | 'yellow' wrong angle | 'red' floating | null empty
  _dvSlotState(idx) {
    const cell = this.dvSlots[idx];
    if (!cell.mat) return null;
    const slot = DAVINCI_SLOTS[idx];
    const supported = slot.supportedBy.every((s) => this.dvSlots[s].mat);
    if (!supported) return 'red';
    return this._angleOk(cell.rot, slot.angle) ? 'green' : 'yellow';
  }

  _dvAllSeated() { return this.dvSlots.every((c) => c.mat); }
  _dvValidGeometry() { return this.dvSlots.every((_, i) => this._dvSlotState(i) === 'green'); }

  _placeBeam(idx) {
    if (idx == null || idx < 0) return;
    const slot = DAVINCI_SLOTS[idx];
    const cell = this.dvSlots[idx];
    cell.mat = this.dvWood;
    cell.rot = this.dvHeldRot;
    cell.piece?.destroy();
    const wood = this.dvWoods[this.dvWoodIdx] || { id: this.dvWood };
    const piece = this._makeBeam(this.dvWood, wood, 76, 16);
    piece.setPosition(slot.x, slot.y).setAngle(cell.rot).setDepth(1420);
    this.chrome.add(piece);
    cell.piece = piece;
    this.tweens.add({ targets: piece, scale: { from: 1.3, to: 1 }, duration: 180, ease: 'Back.easeOut' });
    const state = this._dvSlotState(idx);
    this._cue(state === 'green' ? 'bridge_snap' : 'bridge_error');
    if (this._dvAllSeated()) {
      this._showDvReady();
    } else {
      this.dvActive = this._dvNextOpen();
      this.dvHeldRot = DAVINCI_SLOTS[this.dvActive].angle;
      this._redrawDv();
      this._refreshDvSubtitle();
      this._publish();
    }
  }

  _removeBeam(idx) {
    const cell = this.dvSlots[idx];
    if (!cell?.mat) return;
    cell.piece?.destroy();
    cell.mat = null; cell.piece = null;
    this._cue('bridge_error');
    if (this.phase === 'dv_ready') { this.phase = 'dv_build'; this._buildDvBeam(); }
    this.dvActive = idx;
    this.dvHeldRot = DAVINCI_SLOTS[idx].angle;
    this._redrawDv();
    this._refreshDvSubtitle();
    this._publish();
  }

  _showDvReady() {
    this.phase = 'dv_ready';
    this.dvBeam?.setVisible(false);
    this._armTestButton();
    this.title.setText('Arch assembled');
    const valid = this._dvValidGeometry();
    this.subtitle.setText(valid
      ? 'Every beam interlocks. Press TEST BRIDGE to roll a load across.'
      : '⚠ Some beams are not interlocked (wrong angle). Test it and see — or ⌫ to fix.');
    this.hint.setText('E / Enter or click TEST BRIDGE    ◀ ▶ + ⌫ to adjust    Esc leave');
    this._redrawDv();
    this._publish();
    narrateText(this, 'Arch assembled. Press Test Bridge.');
  }

  _refreshDvSubtitle() {
    const slot = DAVINCI_SLOTS[this.dvActive];
    const placedCount = this.dvSlots.filter((c) => c.mat).length;
    this.subtitle.setText(`Slot: ${slot.label} (${placedCount}/${DAVINCI_SLOTS.length}). Seat each beam so the ones beneath hold it up — no nails.`);
  }

  _dvCycleActive(dir) {
    const n = DAVINCI_SLOTS.length;
    this.dvActive = (this.dvActive + dir + n) % n;
    this.dvHeldRot = this.dvSlots[this.dvActive].mat ? this.dvSlots[this.dvActive].rot : DAVINCI_SLOTS[this.dvActive].angle;
    this._redrawDv();
    this._refreshDvSubtitle();
    this._publish();
  }

  _dvRotate() {
    this.dvHeldRot = (this.dvHeldRot + DV_ROT_STEP) % 360;
    const slot = DAVINCI_SLOTS[this.dvActive];
    this.subtitle.setText(`Beam at ${this.dvHeldRot}° — this slot interlocks near ${((slot.angle % 360) + 360) % 360}°.`);
    this._redrawDv();
    this._publish();
  }

  _strokeBeamOutline(g, x, y, len, thick, angDeg, color, alpha, width) {
    const a = Phaser.Math.DegToRad(angDeg);
    const dx = Math.cos(a); const dy = Math.sin(a);
    const px = -dy; const py = dx;
    const hl = len / 2; const ht = thick / 2;
    const pts = [
      new Phaser.Math.Vector2(x + dx * hl + px * ht, y + dy * hl + py * ht),
      new Phaser.Math.Vector2(x + dx * hl - px * ht, y + dy * hl - py * ht),
      new Phaser.Math.Vector2(x - dx * hl - px * ht, y - dy * hl - py * ht),
      new Phaser.Math.Vector2(x - dx * hl + px * ht, y - dy * hl + py * ht),
    ];
    g.lineStyle(width, color, alpha);
    g.strokePoints(pts, true, true);
  }

  _redrawDv() {
    const g = this.dvGfx;
    g.clear();
    // banks / abutments + gap
    g.fillStyle(0x6b4a2a, 0.14).fillRect(470, 415, 340, 120);
    g.fillStyle(0xb08a52, 0.5).fillRect(430, 415, 70, 70);
    g.fillStyle(0xb08a52, 0.5).fillRect(780, 415, 70, 70);
    // empty-slot ghosts (faint) + support links
    DAVINCI_SLOTS.forEach((slot, i) => {
      slot.supportedBy.forEach((s) => {
        g.lineStyle(1, 0x8a6a3c, 0.3);
        g.lineBetween(slot.x, slot.y, DAVINCI_SLOTS[s].x, DAVINCI_SLOTS[s].y);
      });
      if (!this.dvSlots[i].mat) {
        this._strokeBeamOutline(g, slot.x, slot.y, 76, 16, slot.angle, 0x8a6a3c, 0.5, 2);
      } else {
        const state = this._dvSlotState(i);
        const col = state === 'green' ? 0x4e8a3a : state === 'yellow' ? 0xc59a2a : 0xc4471f;
        this._strokeBeamOutline(g, slot.x, slot.y, 80, 20, this.dvSlots[i].rot, col, 0.95, 3);
      }
    });
    // active slot
    this.dvActiveGfx.clear();
    if (this.phase === 'dv_build') {
      const s = DAVINCI_SLOTS[this.dvActive];
      this._strokeBeamOutline(this.dvActiveGfx, s.x, s.y, 92, 28, this.dvHeldRot, 0xe0a93a, 0.95, 3);
    }
  }

  // ========================================================================
  // mouse drag (truss tray parts + da vinci beam)
  // ========================================================================
  _onDragStart(obj) {
    if (obj.getData('isDvBeam')) {
      if (this.phase !== 'dv_build') return;
      this.dragging = obj; obj.setDepth(1490).setScale(1.12).setAngle(this.dvHeldRot);
      return;
    }
    if (this.phase !== 'choose') return;
    this.dragging = obj;
    this.heldIdx = obj.getData('matIdx');
    obj.setDepth(1490).setScale(1.12).setAngle(this.heldRot);
    this._refreshSubtitle();
    this._highlightHeld();
  }

  _onDragEnd(obj) {
    if (obj.getData('isDvBeam')) {
      this.dragging = null;
      let best = -1; let bestD = 1e9;
      DAVINCI_SLOTS.forEach((s, i) => { const d = Math.hypot(obj.x - s.x, obj.y - s.y); if (d < bestD) { bestD = d; best = i; } });
      if (best >= 0 && bestD <= 48) { this.dvActive = best; this.dvHeldRot = obj.angle; this._placeBeam(best); }
      this._homePiece(obj);
      return;
    }
    if (this.dragging !== obj) { this._homePiece(obj); return; }
    this.dragging = null;
    const zone = ZONES.find((z) => Math.abs(obj.x - z.x) <= z.w / 2 + 26 && Math.abs(obj.y - z.y) <= z.h / 2 + 30);
    if (zone) { this._place(zone.key, obj.getData('matIdx')); this._homePiece(obj); } else { this._rejectFeedback(obj); }
  }

  _homePiece(obj) {
    const home = obj.getData('home');
    if (!home) return;
    obj.setDepth(obj.getData('isDvBeam') ? 1440 : 1440);
    this.tweens.add({ targets: obj, x: home.x, y: home.y, scale: 1, angle: 0, duration: 160, ease: 'Quad.easeOut' });
  }

  _rejectFeedback(obj) {
    const home = obj.getData('home');
    this._paintPiece(obj, 'reject');
    this.time.delayedCall(220, () => this._paintPiece(obj, 'normal'));
    this._cue('bridge_error');
    this.tweens.add({ targets: obj, x: { from: obj.x, to: obj.x + 10 }, duration: 60, yoyo: true, repeat: 2,
      onComplete: () => this.tweens.add({ targets: obj, x: home.x, y: home.y, scale: 1, angle: 0, duration: 180, ease: 'Back.easeOut' }) });
    narrateText(this, 'That part needs to go on a glowing slot.');
  }

  // ========================================================================
  // keyboard
  // ========================================================================
  onKey(event) {
    if (!this.chrome.visible) return;
    const key = (event.key || '').toLowerCase();
    if (event.key === 'Escape') { this._finish(); return; }
    const remove = (event.key === 'Backspace' || event.key === 'Delete' || key === 'x');

    if (this.phase === 'blocked') {
      if (key === 'e' || event.code === 'Space') this._finish();
    } else if (this.phase === 'family') {
      if (event.key === 'ArrowUp' || key === 'w') { this.familyIdx = (this.familyIdx - 1 + BRIDGE_FAMILIES.length) % BRIDGE_FAMILIES.length; this._renderFamily(); this._publish(); }
      else if (event.key === 'ArrowDown' || key === 's') { this.familyIdx = (this.familyIdx + 1) % BRIDGE_FAMILIES.length; this._renderFamily(); this._publish(); }
      else if (key === 'e' || event.key === 'Enter' || event.code === 'Space') { this._selectFamily(); }
    } else if (this.phase === 'choose') {
      if (event.key === 'ArrowLeft' || key === 'a') { this._cycleHeld(-1); }
      else if (event.key === 'ArrowRight' || key === 'd') { this._cycleHeld(1); }
      else if (key === 'r') { this._rotateHeld(); }
      else if (remove) { this._removeActiveTruss(); }
      else if (key === 'e' || event.code === 'Space') { const z = this._activeZone(); if (z) this._place(z.key, this.heldIdx); }
    } else if (this.phase === 'ready') {
      if (event.key === 'ArrowLeft' || key === 'a') { this.phase = 'choose'; this._cycleHeld(-1); }
      else if (event.key === 'ArrowRight' || key === 'd') { this.phase = 'choose'; this._cycleHeld(1); }
      else if (remove) { this._removeActiveTruss(); }
      else if (key === 'e' || event.key === 'Enter' || event.code === 'Space') { this._testBridge(); }
    } else if (this.phase === 'dv_wood') {
      if (event.key === 'ArrowLeft' || key === 'a') { this.dvWoodIdx = (this.dvWoodIdx - 1 + this.dvWoods.length) % this.dvWoods.length; this._renderDvWood(); this._publish(); }
      else if (event.key === 'ArrowRight' || key === 'd') { this.dvWoodIdx = (this.dvWoodIdx + 1) % this.dvWoods.length; this._renderDvWood(); this._publish(); }
      else if ((key === 'e' || event.key === 'Enter' || event.code === 'Space') && this.dvWoods.length) { this._confirmDvWood(); }
    } else if (this.phase === 'dv_build') {
      if (event.key === 'ArrowLeft' || key === 'a') { this._dvCycleActive(-1); }
      else if (event.key === 'ArrowRight' || key === 'd') { this._dvCycleActive(1); }
      else if (key === 'r') { this._dvRotate(); }
      else if (remove) { this._removeBeam(this.dvActive); }
      else if (key === 'e' || event.code === 'Space') { this._placeBeam(this.dvActive); }
    } else if (this.phase === 'dv_ready') {
      if (remove) { this._removeBeam(this.dvActive); }
      else if (key === 'e' || event.key === 'Enter' || event.code === 'Space') { this._testBridge(); }
    } else if (this.phase === 'result') {
      if (key === 'e' || event.code === 'Space') this._afterResult();
    }
  }

  // ========================================================================
  // build / result — solver stays authoritative on materials
  // ========================================================================
  _testBridge() {
    if (this.bridgeType === 'davinci') { this._testDavinci(); return; }
    const runtime = this.registry.get('act1Runtime');
    const result = runtime.designBridge({ bridgeType: 'truss', ...this.selection });
    this._enterResult();
    this.trayPieces.forEach((p) => p.setVisible(false));
    if (result.ok) {
      Object.values(this.placed).forEach((p) => this._paintPiece(p, 'hold'));
      this.tweens.add({ targets: Object.values(this.placed), y: '-=6', duration: 160, yoyo: true });
      this._holdVerdict('✅ The bridge holds! Every part carried the load.');
    } else {
      const weak = (result.evaluated || []).find((e) => !e.bridgeSafe);
      const part = weak && this.placed[weak.role];
      if (part) { this._paintPiece(part, 'fail'); this.tweens.add({ targets: part, angle: (part.angle || 0) + 16, y: part.y + 14, duration: 380, ease: 'Bounce.easeOut' }); }
      this._failVerdict(`💥 The ${weak?.role || 'bridge'} failed — ${result.explanation || 'weak material under load.'}`);
    }
    this._publish({ outcome: result.ok ? 'safe' : (result.outcome || 'unsafe'), built: true });
    narrateText(this, this.verdict.text);
  }

  _testDavinci() {
    const runtime = this.registry.get('act1Runtime');
    // geometry gate (UI-owned): a beam at the wrong angle / left floating is not
    // self-supporting → it collapses, no solver call. This teaches the geometry.
    if (!this._dvValidGeometry()) {
      this._enterResult();
      const bad = this.dvSlots.findIndex((_, i) => this._dvSlotState(i) !== 'green');
      const badPiece = this.dvSlots[bad]?.piece;
      this.dvSlots.forEach((c) => { if (c.piece) this.tweens.add({ targets: c.piece, y: c.piece.y + Phaser.Math.Between(40, 120), angle: c.piece.angle + Phaser.Math.Between(-60, 60), alpha: 0.2, duration: 600, ease: 'Quad.easeIn' }); });
      if (badPiece) this._paintPiece(badPiece, 'fail');
      this._cue('bridge_error');
      this._failVerdict('💥 It was not self-supporting — a beam was not interlocked. Each beam must rest on the ones beneath it.');
      this._publish({ outcome: 'collapse', built: true });
      narrateText(this, this.verdict.text);
      return;
    }
    // geometry sound → the chosen wood now faces the real load test.
    const selection = { bridgeType: 'davinci', deck: this.dvWood, support: this.dvWood, brace: this.dvWood };
    this.selection = selection;
    const result = runtime.designBridge(selection);
    this._enterResult();
    this.dvBeam?.setVisible(false);
    if (result.ok) {
      this.dvSlots.forEach((c) => this._paintPiece(c.piece, 'hold'));
      this.tweens.add({ targets: this.dvSlots.map((c) => c.piece).filter(Boolean), y: '-=5', duration: 160, yoyo: true });
      this._holdVerdict('✅ The arch holds! It carries its own weight into the banks — and the load.');
    } else {
      this.dvSlots.forEach((c) => { this._paintPiece(c.piece, 'fail'); if (c.piece) this.tweens.add({ targets: c.piece, y: c.piece.y + Phaser.Math.Between(20, 70), angle: c.piece.angle + Phaser.Math.Between(-30, 30), duration: 520, ease: 'Bounce.easeOut' }); });
      const woodName = this.dvWoods[this.dvWoodIdx]?.name || this.dvWood;
      this._failVerdict(`💥 Sound shape — but ${woodName} crushed under load. The geometry was right; the wood was too weak.`);
    }
    this._publish({ outcome: result.ok ? 'safe' : (result.outcome || 'unsafe'), built: true });
    narrateText(this, this.verdict.text);
  }

  _enterResult() {
    this.phase = 'result';
    this.tweens.killTweensOf(this.testBtn);
    this.testBtn.setVisible(false);
    this.meterGfx.clear(); this.meterLabels.forEach((l) => l.setVisible(false));
    this.activeGfx.clear(); this.dvActiveGfx.clear();
    this.title.setText('Load test');
  }

  _holdVerdict(text) { this.verdict.setText(text).setColor('#2f6b2a'); this.hint.setText('E to finish →'); this.success = true; this._cue('bridge_lock'); }
  _failVerdict(text) { this.verdict.setText(text).setColor('#9a2f1a'); this.hint.setText('E to rebuild →'); this.success = false; }

  _afterResult() {
    if (this.success) { this._finish(); return; }
    if (this.bridgeType === 'davinci') { this._showDvWood(); return; }
    this.trayPieces.forEach((p) => p.setVisible(true));
    this._resetAssembly();
    this._showChoose();
  }

  _finish() {
    this.phase = 'idle';
    this._setVisible(false);
    this.registry.set('modalActive', false);
    this.registry.events.emit('quest:changed');
    this.registry.events.emit('bridgeDesign:done');
    if (this.success) this.registry.events.emit('loadTest:start', { ...this.selection });
    this._publish();
  }

  // ===== meters (truss) ===================================================
  _meterValues() {
    const FLOOD = { balsa: 2, pine: 3, bamboo: 4, brick: 7, concrete: 9, iron: 6, steel: 8, carbon_fiber: 8 };
    const COST = { balsa: 2, pine: 3, bamboo: 3, brick: 4, concrete: 5, iron: 6, steel: 8, carbon_fiber: 10 };
    const mats = Object.values(this.selection).filter((v) => typeof v === 'string').map((id) => this.matById.get(id)).filter(Boolean);
    if (!mats.length) return { strength: 0, weight: 0, stability: 0, flood: 0, cost: 0 };
    const avg = (f) => mats.reduce((s, m) => s + f(m), 0) / mats.length;
    return {
      strength: Math.min(...mats.map((m) => m.strength || 0)) / 10,
      weight: avg((m) => m.weight || 0) / 10,
      stability: avg((m) => m.stiffness || 0) / 10,
      flood: avg((m) => FLOOD[m.id] ?? 5) / 10,
      cost: avg((m) => COST[m.id] ?? 5) / 10,
    };
  }

  _drawMeters() {
    const v = this._meterValues();
    const g = this.meterGfx;
    g.clear();
    this.meterDefs.forEach((d, i) => {
      const x = 70; const y = 228 + i * 30; const w = 90; const h = 7;
      const val = Math.max(0, Math.min(1, v[d.key] || 0));
      const score = d.good ? val : 1 - val;
      const color = score > 0.6 ? 0x4e8a3a : score > 0.34 ? 0xb0892a : 0x9a4a2a;
      g.fillStyle(0xcdb079, 0.55).fillRoundedRect(x, y, w, h, 3);
      g.fillStyle(color, 0.95).fillRoundedRect(x, y, Math.max(2, w * val), h, 3);
      g.lineStyle(1, 0x8a6a3c, 0.45).strokeRoundedRect(x, y, w, h, 3);
    });
  }

  // ===== visibility + publish =============================================
  _clearDynamic() {
    this.trayPieces.forEach((p) => p.destroy());
    this.trayPieces = [];
    Object.values(this.placed).forEach((p) => p.destroy());
    this.placed = {};
    this.familyRows.forEach((r) => r.destroy());
    this.familyRows = [];
    this.dvBeam?.destroy(); this.dvBeam = null;
    this.dvSlots.forEach((c) => { c.piece?.destroy(); c.piece = null; });
  }

  _setVisible(v) {
    this.chrome.setVisible(v);
    if (!v) this._clearDynamic();
  }

  _publish(extra = {}) {
    if (typeof window === 'undefined') return;
    const active = this._activeZone();
    window.__BRIDGE_DESIGN__ = {
      active: this.chrome.visible,
      phase: this.phase,
      bridgeType: this.bridgeType,
      role: active ? active.key : null,
      candidateId: this.phase === 'choose' && this.candidates[this.heldIdx] ? this.candidates[this.heldIdx].id : null,
      candidateIndex: this.heldIdx,
      candidates: this.candidates.map((c) => c.id),
      heldRotation: this.heldRot,
      selection: { ...this.selection },
      // family selector
      families: BRIDGE_FAMILIES.map((f) => ({ key: f.key, status: f.status })),
      familyIndex: this.familyIdx,
      selectedFamily: this.bridgeType,
      // truss zones (mouse e2e; game-space coords; canvas 1280x720 FIT)
      zones: ZONES.map((z) => ({ key: z.key, x: z.x, y: z.y, w: z.w, h: z.h, filled: Boolean(this.selection[z.key]) })),
      tray: this.trayPieces.map((p) => ({ id: p.getData('matId'), x: p.getData('home')?.x ?? p.x, y: p.getData('home')?.y ?? p.y })),
      // da vinci
      dvWood: this.dvWood,
      dvWoodId: this.dvWoods[this.dvWoodIdx]?.id ?? null,
      dvWoods: this.dvWoods.map((c) => c.id),
      dvActive: this.dvActive,
      dvSlots: DAVINCI_SLOTS.map((s, i) => ({ id: s.id, filled: Boolean(this.dvSlots[i].mat), state: this._dvSlotState(i) })),
      dvAllSeated: this._dvAllSeated(),
      dvValid: this._dvValidGeometry(),
      canvas: { width: 1280, height: 720 },
      ...extra,
    };
  }
}
