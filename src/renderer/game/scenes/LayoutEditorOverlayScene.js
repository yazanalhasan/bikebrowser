/**
 * LayoutEditorOverlayScene — minimal in-game layout editor.
 *
 * F2 toggles edit mode on the active local scene (the one whose class
 * declares a static `layoutEditorConfig = { layoutAssetKey, layoutPath }`).
 * Renders every entry in the scene's layout JSON as a draggable shape:
 *   - rect (w + h)   → outlined blue rectangle (30% fill alpha)
 *   - ellipse (r)    → outlined purple circle radius `r` (30% fill alpha)
 *   - point (x + y)  → small filled orange circle radius 6
 * Click to select, drag to move. Save writes back to disk via the dev-
 * server middleware (POST /api/save-layout). Save-only live preview:
 * underlying scene updates only on Save (which restarts the scene).
 *
 * Scope (v1, hard-locked): no rotation, no shape creation, no resize, no
 * multi-select, no grid snap, no layers, no copy/paste, no undo/redo.
 */

import Phaser from 'phaser';

const COLOR_RECT = 0x4a90e2;
const COLOR_ELLIPSE = 0x9b59b6;
const COLOR_POINT = 0xe67e22;
const COLOR_SELECTED = 0xffffff;

export default class LayoutEditorOverlayScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LayoutEditorOverlayScene', active: true });
  }

  create() {
    this._editing = false;
    this._target = null;          // active local scene
    this._workingCopy = null;     // mutated copy of the full layout JSON
    this._items = [];             // { name, obj, container, shape, label, kind }
    this._selected = null;
    this._saveBtn = null;
    this._saveBtnTimer = null;

    // F2 hotkey at the global input level (not scene-key blocked when other
    // scenes pause input). Use the keyboard plugin from this scene; Phaser
    // delivers F2 as long as the canvas has focus.
    const f2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F2);
    f2.on('down', () => this._toggle());

    // Esc deselects when in edit mode
    const esc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    esc.on('down', () => { if (this._editing) this._select(null); });

    // Background click deselects (only fires when no overlay container caught it)
    this.input.on('pointerdown', (pointer, currentlyOver) => {
      if (!this._editing) return;
      if (!currentlyOver || currentlyOver.length === 0) this._select(null);
    });

    // Scene runs always-active. Hidden until toggled.
    this.cameras.main.setVisible(false);
    this.cameras.main.setBackgroundColor(0x000000);
    this.cameras.main.setAlpha(0);
  }

  // -------- toggle / lifecycle --------

  _toggle() {
    if (this._editing) this._exitEditMode();
    else this._enterEditMode();
  }

  _findActiveLocal() {
    const all = this.scene.manager.getScenes(true);
    console.log(`[pause-storm-debug] iterating manager scenes at _findActiveLocal: count=${all.length}`);
    for (const s of all) {
      if (s === this) continue;
      const cfg = s.constructor?.layoutEditorConfig;
      if (cfg && s.scene.isActive()) return { scene: s, cfg };
    }
    return null;
  }

  _enterEditMode() {
    const found = this._findActiveLocal();
    if (!found) {
      console.warn('[LayoutEditor] No active scene with layoutEditorConfig — F2 ignored.');
      return;
    }
    const data = this.cache.json.get(found.cfg.layoutAssetKey);
    if (!data?.objects) {
      console.warn('[LayoutEditor] Layout JSON not loaded:', found.cfg.layoutAssetKey);
      return;
    }
    this._target = found.scene;
    this._cfg = found.cfg;
    // Deep clone so working copy is independent of cache.
    this._workingCopy = JSON.parse(JSON.stringify(data));
    if (typeof window !== 'undefined') {
      window.__layoutEditorWorkingCopy = window.__layoutEditorWorkingCopy || {};
      window.__layoutEditorWorkingCopy[found.cfg.layoutAssetKey] = this._workingCopy;
    }

    // Match camera to target's camera so coords align.
    this._syncCameraToTarget();

    this._buildOverlays();
    this._buildSaveButton();
    this.cameras.main.setVisible(true);
    this.cameras.main.setAlpha(1);
    this.scene.bringToTop();
    this._editing = true;
    console.log(`[LayoutEditor] Editing ${this._target.scene.key} (${this._items.length} objects).`);
  }

  _exitEditMode() {
    console.log(`[pause-storm-debug] _exitEditMode at ${Date.now()} target=${this._target?.scene?.key}`);
    this._select(null);
    for (const it of this._items) it.container.destroy();
    this._items = [];
    this._destroySaveButton();
    this.cameras.main.setVisible(false);
    this.cameras.main.setAlpha(0);
    this._editing = false;
    if (typeof window !== 'undefined' && window.__layoutEditorWorkingCopy && this._cfg) {
      delete window.__layoutEditorWorkingCopy[this._cfg.layoutAssetKey];
    }
    this._target = null;
    this._workingCopy = null;
  }

  _syncCameraToTarget() {
    const tcam = this._target.cameras?.main;
    const cam = this.cameras.main;
    if (!tcam) return;
    cam.setScroll(tcam.scrollX, tcam.scrollY);
    cam.setZoom(tcam.zoom);
  }

  // -------- overlay shapes --------

  _buildOverlays() {
    const objects = this._workingCopy.objects;
    for (const name of Object.keys(objects)) {
      const obj = objects[name];
      if (typeof obj?.x !== 'number' || typeof obj?.y !== 'number') continue;
      const item = this._makeItem(name, obj);
      if (item) this._items.push(item);
    }
  }

  _makeItem(name, obj) {
    const container = this.add.container(obj.x, obj.y);
    container.setDepth(10000);
    let shape;
    let kind;
    let hitArea;
    if (typeof obj.w === 'number' && typeof obj.h === 'number') {
      kind = 'rect';
      shape = this.add.rectangle(0, 0, obj.w, obj.h, COLOR_RECT, 0.3);
      shape.setStrokeStyle(2, COLOR_RECT, 1);
      hitArea = new Phaser.Geom.Rectangle(-obj.w / 2, -obj.h / 2, obj.w, obj.h);
      container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
    } else if (typeof obj.r === 'number') {
      kind = 'ellipse';
      shape = this.add.circle(0, 0, obj.r, COLOR_ELLIPSE, 0.3);
      shape.setStrokeStyle(2, COLOR_ELLIPSE, 1);
      hitArea = new Phaser.Geom.Circle(0, 0, obj.r);
      container.setInteractive(hitArea, Phaser.Geom.Circle.Contains);
    } else {
      kind = 'point';
      shape = this.add.circle(0, 0, 6, COLOR_POINT, 1);
      shape.setStrokeStyle(1, 0x000000, 1);
      hitArea = new Phaser.Geom.Circle(0, 0, 10);
      container.setInteractive(hitArea, Phaser.Geom.Circle.Contains);
    }
    container.add(shape);

    const labelY = kind === 'point' ? 12 : 0;
    const label = this.add.text(0, labelY, name, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    });
    label.setOrigin(0.5, kind === 'point' ? 0 : 0.5);
    container.add(label);

    // Tag for occlusion audit
    container.occlusionRole = 'safe';
    shape.occlusionRole = 'safe';
    label.occlusionRole = 'safe';

    this.input.setDraggable(container, true);

    const item = { name, obj, container, shape, label, kind };

    container.on('pointerdown', (pointer) => {
      // Stop propagation so clicking a shape doesn't deselect.
      pointer.event?.stopPropagation?.();
      this._select(item);
    });

    container.on('drag', (pointer, dragX, dragY) => {
      const w = this._target?.getWorldSize?.() || this._target?.scale?.gameSize || { width: 800, height: 600 };
      const nx = Phaser.Math.Clamp(dragX, 0, w.width);
      const ny = Phaser.Math.Clamp(dragY, 0, w.height);
      container.x = nx;
      container.y = ny;
      obj.x = nx;
      obj.y = ny;
    });

    return item;
  }

  _select(item) {
    if (this._selected === item) return;
    if (this._selected) this._setHighlight(this._selected, false);
    this._selected = item;
    if (item) this._setHighlight(item, true);
  }

  _setHighlight(item, on) {
    const baseColor = item.kind === 'rect' ? COLOR_RECT
      : item.kind === 'ellipse' ? COLOR_ELLIPSE
      : COLOR_POINT;
    const strokeColor = on ? COLOR_SELECTED : baseColor;
    const strokeWidth = on ? 3 : (item.kind === 'point' ? 1 : 2);
    if (item.shape.setStrokeStyle) {
      item.shape.setStrokeStyle(strokeWidth, strokeColor, 1);
    }
  }

  // -------- save button (DOM) --------

  _buildSaveButton() {
    if (typeof document === 'undefined') return;
    const btn = document.createElement('button');
    btn.textContent = 'Save Layout';
    btn.style.cssText = [
      'position: fixed',
      'top: 8px',
      'right: 8px',
      'z-index: 1000',
      'padding: 6px 12px',
      'background: #2c3e50',
      'color: #fff',
      'border: 1px solid #ecf0f1',
      'border-radius: 4px',
      'font-family: monospace',
      'font-size: 12px',
      'cursor: pointer',
      'pointer-events: auto',
    ].join(';');
    btn.addEventListener('click', () => this._save());
    document.body.appendChild(btn);
    this._saveBtn = btn;
  }

  _destroySaveButton() {
    if (this._saveBtn?.parentNode) this._saveBtn.parentNode.removeChild(this._saveBtn);
    this._saveBtn = null;
    if (this._saveBtnTimer) {
      clearTimeout(this._saveBtnTimer);
      this._saveBtnTimer = null;
    }
  }

  _flashSaveBtn(text, ok) {
    if (!this._saveBtn) return;
    const original = 'Save Layout';
    this._saveBtn.textContent = text;
    this._saveBtn.style.background = ok ? '#27ae60' : '#c0392b';
    if (this._saveBtnTimer) clearTimeout(this._saveBtnTimer);
    this._saveBtnTimer = setTimeout(() => {
      if (!this._saveBtn) return;
      this._saveBtn.textContent = original;
      this._saveBtn.style.background = '#2c3e50';
    }, 2000);
  }

  async _save() {
    if (!this._workingCopy || !this._cfg) return;
    console.log(`[pause-storm-debug] _save entered at ${Date.now()} layoutAssetKey=${this._cfg?.layoutAssetKey} targetKey=${this._target?.scene?.key}`);
    try {
      const res = await fetch('/api/save-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: this._cfg.layoutPath, data: this._workingCopy }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      this._flashSaveBtn('Saved ✓', true);
      // Update Phaser cache so a scene restart sees the saved positions.
      this.cache.json.add(this._cfg.layoutAssetKey, JSON.parse(JSON.stringify(this._workingCopy)));
      // Restart underlying scene so it re-reads the layout from cache.
      const targetKey = this._target?.scene?.key;
      if (targetKey) {
        this._exitEditMode();
        console.log(`[pause-storm-debug] about to restart ${targetKey}`);
        this.scene.manager.getScene(targetKey)?.scene.restart();
        console.log(`[pause-storm-debug] restart returned for ${targetKey}`);
      }
    } catch (err) {
      console.error('[LayoutEditor] Save failed:', err);
      this._flashSaveBtn(`Save failed: ${err.message || err}`, false);
    }
  }
}
