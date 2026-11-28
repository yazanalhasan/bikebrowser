/**
 * "Is anything covering the words?" — measured, not eyeballed. Plan 0.12.
 *
 * The rule the owner set is absolute: no text, readout, card, button or
 * other control may be covered. The hard part is that the usual suspect
 * is the player sprite, which moves, so a screenshot proves nothing about
 * the next step the child takes.
 *
 * So this walks the live Phaser display list and the React HUD and does
 * the geometry:
 *
 *   widget    a visible Text object, or an interactive object (a control)
 *   occluder  anything visible that draws AFTER the widget — characters
 *             included, HUD panels included, other cards included
 *   covered   the fraction of the widget's screen rect under the union of
 *             the occluders above it, sampled on a grid
 *
 * More than 10% covered is a failure.
 *
 * Draw order in Phaser is (depth, then insertion index) within a scene,
 * and scenes themselves stack in their start order, so the comparison is
 * on the triple [sceneIndex, depth, childIndex]. A container paints
 * nothing itself; its children carry its transform, so containers are
 * skipped as occluders but their children are not.
 *
 * Screen geometry follows Camera.preRender: a game object is drawn at
 *
 *   screenX = (worldX - scrollX * scrollFactorX - originX) * zoom
 *             + originX + camera.x
 *
 * which is why `setScrollFactor(0)` is not the same as screen space — the
 * zoom still applies. Getting that wrong was worth hours the first time.
 */

/** Fraction of a widget that may be covered before it counts as hidden. */
export const COVERAGE_LIMIT = 0.10;

/**
 * Run the audit in the page and return the violations.
 *
 * @param {import('playwright/test').Page} page
 * @param {object} [options]
 *   label        — prefix for every message (the state being audited)
 *   ignoreText   — array of strings; widgets whose text matches are skipped
 *   minSize      — ignore widgets smaller than this many px² (default 40)
 * @returns {Promise<string[]>}
 */
export async function auditCoverage(page, options = {}) {
  const { label = 'state', ignoreText = [], minSize = 40 } = options;

  const found = await page.evaluate(({ LIMIT, IGNORE, MIN_SIZE }) => {
    const game = window.__phaserGame;
    if (!game) return [{ message: 'no game' }];

    // ── geometry ────────────────────────────────────────────────────────
    const screenRect = (obj, cam) => {
      if (!obj.getBounds) return null;
      let b;
      try { b = obj.getBounds(); } catch { return null; }
      if (!b || !isFinite(b.x) || !isFinite(b.width) || b.width <= 0 || b.height <= 0) return null;

      const zoom = cam.zoom;
      const ox = cam.width * 0.5;
      const oy = cam.height * 0.5;
      const sfx = obj.scrollFactorX ?? 1;
      const sfy = obj.scrollFactorY ?? 1;

      const toScreenX = (wx) => (wx - cam.scrollX * sfx - ox) * zoom + ox + cam.x;
      const toScreenY = (wy) => (wy - cam.scrollY * sfy - oy) * zoom + oy + cam.y;

      const x1 = toScreenX(b.x);
      const y1 = toScreenY(b.y);
      const x2 = toScreenX(b.x + b.width);
      const y2 = toScreenY(b.y + b.height);
      return { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1) };
    };

    const visible = (obj) => {
      if (!obj.visible || obj.alpha <= 0.05) return false;
      for (let p = obj.parentContainer; p; p = p.parentContainer) {
        if (!p.visible || p.alpha <= 0.05) return false;
      }
      return true;
    };

    // ── collect, in draw order ──────────────────────────────────────────
    const scenes = game.scene.scenes.filter((s) => s.scene.isActive());
    const entries = [];

    const walk = (scene, sceneIndex, list, inherited) => {
      list.forEach((obj, childIndex) => {
        if (!visible(obj)) return;
        const order = [...inherited, obj.depth ?? 0, childIndex];
        if (obj.type === 'Container') {
          walk(scene, sceneIndex, obj.list || [], order);
          return;
        }
        entries.push({ obj, scene, order: [sceneIndex, ...order] });
      });
    };
    scenes.forEach((s, i) => walk(s, i, s.children.list, []));

    const after = (a, b) => {
      // Does `a` draw after `b`?
      const len = Math.max(a.length, b.length);
      for (let i = 0; i < len; i += 1) {
        const av = a[i] ?? -1;
        const bv = b[i] ?? -1;
        if (av !== bv) return av > bv;
      }
      return false;
    };

    /**
     * Who is a character.
     *
     * The plan makes the player, the companion and NPCs occluders, so
     * they must never be mistaken for a widget's own decoration. Their
     * roots are collected from the scenes rather than guessed from
     * texture names.
     */
    const characterRoots = new Set();
    for (const s of scenes) {
      const add = (c) => {
        if (!c) return;
        if (c.container) characterRoots.add(c.container);
        if (c.sprite) characterRoots.add(c.sprite);
        if (c.type) characterRoots.add(c);
      };
      add(s.player);
      const groups = [s._npcs, s._companions, s.npcs];
      for (const grp of groups) {
        if (!grp) continue;
        const list = grp instanceof Map ? [...grp.values()] : (Array.isArray(grp) ? grp : Object.values(grp));
        list.forEach(add);
      }
    }
    const isCharacter = (obj) => {
      for (let o = obj; o; o = o.parentContainer) if (characterRoots.has(o)) return true;
      return false;
    };

    const paints = (obj) => {
      if (obj.type === 'Text' || obj.type === 'BitmapText') return true;
      if (obj.type === 'Image' || obj.type === 'Sprite' || obj.type === 'TileSprite') return true;
      if (obj.type === 'Rectangle' || obj.type === 'Arc' || obj.type === 'Polygon'
          || obj.type === 'Ellipse' || obj.type === 'Triangle' || obj.type === 'Curve') {
        const filled = (obj.isFilled ?? true) && (obj.fillAlpha ?? 1) > 0.15;
        const stroked = (obj.isStroked ?? false) && (obj.strokeAlpha ?? 1) > 0.5;
        return filled || stroked;
      }
      if (obj.type === 'Graphics') return true;
      return false;
    };

    // ── what counts as a widget ─────────────────────────────────────────
    //
    // Text always. A control only if it paints something of its own: an
    // interactable's hit area is an invisible rectangle under a prop's
    // art, and "the clipboard covers the clipboard's hit box" is not a
    // thing a child can see. What they see is the art and the caption,
    // and both are audited in their own right.
    const isWidget = (e) => {
      const t = e.obj.type;
      if (t === 'Text' || t === 'BitmapText') {
        // A lone glyph is a prop, not a word. Half this game's older
        // props are an emoji in a Text object with a sprite drawn over
        // them, and "the dog bowl covers the dog bowl" is not a
        // reading problem. Anything with a letter or a digit in it is a
        // label and is audited: "⬆ Enter" and "⭐ Zuzu's Bike ⭐" stay in.
        const txt = (e.obj.text || '').toString();
        if (!/[a-zA-Z0-9]/.test(txt)) return false;
        return true;
      }
      return Boolean(e.obj.input) && paints(e.obj);
    };

    /**
     * Is this occluder part of the widget's own face?
     *
     * A button is a hit rectangle with a label and a card drawn over it:
     * "Mesquite Wood" sits on top of the control it names, and reporting
     * that as 21% covered is noise that buries the real findings.
     *
     * The test is containment. Decoration lies inside the control it
     * belongs to; something covering it hangs over the edge or is larger.
     * Only for controls, and never for a sprite — Zuzu standing wholly
     * inside a wide panel is exactly the bug this file exists for, and a
     * prop image over a readout (the brass scale, the clipboard) is item
     * 2 and item 4 of the plan.
     */
    const isOwnFace = (widget, occluder, wRect, oRect) => {
      // Text is never excused. Every finding the plan lists for the lab
      // is an image over a label (the brass scale over "SCALE" and the
      // grams, the clipboard over "Density Slate").
      if (widget.obj.type === 'Text' || widget.obj.type === 'BitmapText') return false;
      // A character is an occluder, full stop — otherwise Zuzu standing
      // squarely on a small button would be excused as its own face.
      if (isCharacter(occluder.obj)) return false;

      const ix = Math.max(0, Math.min(wRect.x + wRect.w, oRect.x + oRect.w) - Math.max(wRect.x, oRect.x));
      const iy = Math.max(0, Math.min(wRect.y + wRect.h, oRect.y + oRect.h) - Math.max(wRect.y, oRect.y));
      const overlap = ix * iy;
      const t = occluder.obj.type;

      // A label sitting inside the control it names.
      if ((t === 'Text' || t === 'BitmapText' || t === 'Rectangle' || t === 'Arc')
          && overlap / Math.max(1, oRect.w * oRect.h) >= 0.85) return true;

      // A prop's art sitting on its own control. An interactable is a
      // plate or a pin with a sprite over it: the sprite IS what the
      // child sees and taps, so "the clipboard covers the clipboard" is
      // not a finding, and neither is a map icon on its own pin.
      //
      // Either the art swallows the control whole, or it is centred on
      // it — something genuinely covering a control drifts in from one
      // side, and a character can never qualify (checked above).
      if (widget.obj.input && (t === 'Image' || t === 'Sprite' || t === 'Rectangle' || t === 'Arc')) {
        if (overlap / Math.max(1, wRect.w * wRect.h) >= 0.85) return true;
        const dx = Math.abs((oRect.x + oRect.w / 2) - (wRect.x + wRect.w / 2));
        const dy = Math.abs((oRect.y + oRect.h / 2) - (wRect.y + wRect.h / 2));
        if (dx <= wRect.w * 0.25 && dy <= wRect.h * 0.25) return true;
      }

      return false;
    };

    // A background drawn BEFORE its label is never an occluder at all,
    // and a control's own invisible hit area paints nothing, so neither
    // needs special handling here.

    // ── the React HUD, as occluders over everything on the canvas ───────
    const canvasBox = game.canvas.getBoundingClientRect();
    const hudRects = [];
    const hudRoot = game.canvas.parentElement?.parentElement || document.body;
    const hudCandidates = [...hudRoot.querySelectorAll('[data-hud], .pointer-events-auto, button, [role="status"]')];
    for (const el of hudCandidates) {
      // Leaves only. The icon rail is a column of small buttons with gaps
      // between them; its container box is mostly empty air, and counting
      // that as solid turned a label clipped by one icon into "67%
      // covered".
      if (hudCandidates.some((other) => other !== el && el.contains(other))) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) continue;
      const style = window.getComputedStyle(el);
      if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) <= 0.05) continue;
      // Ignore anything drawn outside the canvas (page chrome).
      if (r.right < canvasBox.left || r.left > canvasBox.right
          || r.bottom < canvasBox.top || r.top > canvasBox.bottom) continue;
      hudRects.push({
        x: r.left - canvasBox.left, y: r.top - canvasBox.top,
        w: r.width, h: r.height,
        name: `HUD ${(el.innerText || el.getAttribute('aria-label') || el.className || 'element').toString().slice(0, 40).replace(/\s+/g, ' ')}`,
      });
    }

    // ── measure ─────────────────────────────────────────────────────────
    const violations = [];
    const SAMPLES = 12; // 12x12 grid over the widget

    for (const w of entries) {
      if (!isWidget(w)) continue;
      const cam = w.scene.cameras.main;
      const rect = screenRect(w.obj, cam);
      if (!rect || rect.w * rect.h < MIN_SIZE) continue;

      const text = (w.obj.text || '').toString().trim();
      if (text && IGNORE.some((s) => text.includes(s))) continue;
      // Off-screen widgets are a different problem (and a different test).
      if (rect.x + rect.w < 0 || rect.y + rect.h < 0
          || rect.x > cam.width || rect.y > cam.height) continue;

      const over = [];
      for (const o of entries) {
        if (o === w) continue;
        if (!paints(o.obj)) continue;
        if (!after(o.order, w.order)) continue;
        // A widget's own children (e.g. a text inside the button it labels)
        // are part of it.
        let isOwn = false;
        for (let p = o.obj.parentContainer; p; p = p.parentContainer) {
          if (p === w.obj) { isOwn = true; break; }
        }
        if (isOwn) continue;
        const r = screenRect(o.obj, o.scene.cameras.main);
        if (!r) continue;
        if (r.x > rect.x + rect.w || r.x + r.w < rect.x
            || r.y > rect.y + rect.h || r.y + r.h < rect.y) continue;
        if (isOwnFace(w, o, rect, r)) continue;
        const oWhat = o.obj.text ? ` "${String(o.obj.text).slice(0, 24)}"`
          : (o.obj.texture?.key ? ` [${o.obj.texture.key}]` : '');
        over.push({ r, name: `${o.obj.type}${oWhat} @${o.order.slice(1).join('.')}` });
      }
      for (const h of hudRects) {
        if (h.x > rect.x + rect.w || h.x + h.w < rect.x
            || h.y > rect.y + rect.h || h.y + h.h < rect.y) continue;
        over.push({ r: h, name: h.name });
      }
      if (!over.length) continue;

      // Union coverage, sampled.
      let hit = 0;
      for (let i = 0; i < SAMPLES; i += 1) {
        for (let j = 0; j < SAMPLES; j += 1) {
          const px = rect.x + (i + 0.5) * rect.w / SAMPLES;
          const py = rect.y + (j + 0.5) * rect.h / SAMPLES;
          if (over.some(({ r }) => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h)) hit += 1;
        }
      }
      const fraction = hit / (SAMPLES * SAMPLES);
      if (fraction <= LIMIT) continue;

      const label0 = text ? `"${text.slice(0, 48).replace(/\n/g, ' ')}"` : `${w.obj.type} control`;
      // The draw-order key is in the message on purpose: "covered by an
      // image" is a puzzle until you can see that the image sits at a
      // higher depth than the thing it is hiding.
      const what = `${label0} @${w.order.slice(1).join('.')}`;
      const by = [...new Set(over.map((o) => o.name))].slice(0, 3).join(', ');
      violations.push({
        scene: w.scene.scene.key,
        message: `${w.scene.scene.key}: ${what} is ${Math.round(fraction * 100)}% covered by ${by}`,
        fraction,
      });
    }

    return violations.sort((a, b) => b.fraction - a.fraction).map((v) => v.message);
  }, { LIMIT: COVERAGE_LIMIT, IGNORE: ignoreText, MIN_SIZE: minSize });

  return found.map((m) => `[${label}] ${m}`);
}

/**
 * Resize the game to a viewport and let the scenes re-fit.
 *
 * The extension's window resize silently fails on a maximized window and
 * `scale.resize()` snaps back, so the canvas parent is sized instead and
 * the scale manager refreshed — the same route the manual passes used.
 *
 * @param {import('playwright/test').Page} page
 * @param {{width: number, height: number}} size
 */
export async function setViewport(page, { width, height }) {
  await page.setViewportSize({ width, height });
  await page.evaluate(({ w, h }) => {
    const game = window.__phaserGame;
    const parent = game.canvas.parentElement;
    parent.style.width = `${w}px`;
    parent.style.height = `${h}px`;
    game.scale.refresh();
  }, { w: width, h: height });
  await page.waitForTimeout(700);
}

/**
 * Close any dialog that is open, the way a child would.
 *
 * A dialog box is a reading surface: it is *meant* to sit over the scene,
 * and auditing a scene with one open reports every widget behind it as
 * 100% covered, which buries the real findings. The states this plan
 * item cares about (idle, mid-test, after-test) are states with no
 * dialog, so the audit closes one first.
 *
 * Close is preferred over Continue — Continue advances a quest step, and
 * the audit must not change the save it is looking at.
 *
 * @param {import('playwright/test').Page} page
 * @returns {Promise<number>} how many were dismissed
 */
export async function dismissDialogs(page) {
  let closed = 0;
  for (let i = 0; i < 6; i += 1) {
    const close = page.getByRole('button', { name: /^(Close|✕|×)$/ }).first();
    if (await close.isVisible().catch(() => false)) {
      await close.click({ timeout: 2_000 }).catch(() => {});
      closed += 1;
      await page.waitForTimeout(400);
      continue;
    }
    break;
  }
  // Anything that has no Close (an auto-advancing caption) is cleared at
  // the source so the next frame is clean.
  await page.evaluate(() => {
    for (const s of window.__phaserGame.scene.scenes) {
      if (s.scene.isActive() && s.registry?.get('dialogEvent')) s.registry.set('dialogEvent', null);
    }
  });
  await page.waitForTimeout(500);
  return closed;
}

/**
 * Put the player at a world position and let the frame settle.
 *
 * @param {import('playwright/test').Page} page
 * @param {string} sceneKey
 * @param {{x: number, y: number}} pos
 */
export async function placePlayer(page, sceneKey, { x, y }) {
  await page.evaluate(({ key, px, py }) => {
    const scene = window.__phaserGame.scene.scenes.find((s) => s.scene.key === key);
    if (!scene?.player) return;
    const sprite = scene.player.sprite || scene.player.container;
    if (sprite) { sprite.x = px; sprite.y = py; }
    if (scene.player.container) { scene.player.container.x = px; scene.player.container.y = py; }
  }, { key: sceneKey, px: x, py: y });
  await page.waitForTimeout(500);
}
