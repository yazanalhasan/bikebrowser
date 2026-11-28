// The lab rigs must stay readable at every size, in every state.
//
// Review MUSTs 2, 3, 4, 5, 6 and 9, all in the two rigs:
//   2. the readout overflows the screen in portrait and its panel at 1280
//   3. the chart's x-axis label covers the "Engineering takeaway" title
//   4. the Density Slate panel opens underneath the takeaway card
//   5. landscape phone text falls under 12 px
//   6. the takeaway card covers "Structural Steel" at 1280
//   9. the UTM crosshead and specimen sit behind the chart in portrait
//
// Every one of these only appears AFTER a test has been run — the
// takeaway card and the result readout do not exist at spawn. That is
// why the earlier audit passed: it looked at the opening state.
//
// This drives each rig through its whole cycle by touch (pick a sample,
// start the test, watch it run, read the result, open the takeaway, open
// the Density Slate) and measures coverage at every step.
import { expect, test } from 'playwright/test';

import {
  MIN_BODY_CSS_PX, MIN_LABEL_CSS_PX, PAGE_SCALE, WORLD_TO_PAGE,
  bootToScene, dismissDialogs, shot, tapAt,
} from './helpers/touchOnly.js';

const RIGS = [
  { key: 'MaterialLabScene', label: 'Materials Lab' },
  { key: 'ThermalRigScene', label: 'Thermal Rig' },
];

const SIZES = [
  { name: '1280x720', width: 1280, height: 720, phone: false },
  { name: '360x740', width: 360, height: 740, phone: true },
  { name: '375x667', width: 375, height: 667, phone: true },
  { name: '390x844', width: 390, height: 844, phone: true },
  { name: '412x915', width: 412, height: 915, phone: true },
  { name: '844x390-landscape', width: 844, height: 390, phone: true },
];

/** How much of each visible widget another object covers, on screen. */
const MEASURE = `(scene) => {
  const cam = scene.cameras.main;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Page pixels — what a finger and a screenshot see. The camera zooms
  // about its midpoint and the canvas has its own rectangle; leaving
  // either out measures a screen that does not exist.
  const toPage = window.WORLD_TO_PAGE_FN(scene, cam);
  const k = window.PAGE_SCALE_FN(cam);
  const rectOf = (o) => {
    const b = o.getBounds ? o.getBounds() : null;
    if (!b) return null;
    const p = toPage(b.x, b.y, o.scrollFactorX ?? 1, o.scrollFactorY ?? 1);
    return { x: p.x, y: p.y, w: b.width * k.x, h: b.height * k.y };
  };

  const all = [];
  // Every HUD element that is actually on the screen, as a page rect.
  // These are occluders, never widgets: the DOM HUD has its own tests
  // (tests/e2e/phone-readability) and what matters here is what it
  // covers.
  const domRects = [];
  document.querySelectorAll('button, [data-testid], [role="button"]').forEach((el) => {
    // Leaves only. A wrapper div reports the union of everything inside
    // it, so the HUD's top-left group measured as one 190x360 block
    // called "HomeBackLeave" and covered half the bench on paper.
    if (el.querySelector('button, [data-testid], [role="button"]')) return;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    const style = window.getComputedStyle(el);
    if (style.visibility === 'hidden' || style.display === 'none'
      || parseFloat(style.opacity || '1') < 0.1) return;
    if (style.pointerEvents === 'none') return;
    domRects.push({
      type: 'DOM',
      depth: Infinity,                       // the DOM is always on top
      text: (el.getAttribute('aria-label') || el.textContent || 'HUD').trim().slice(0, 32),
      fontPx: null,
      interactive: true,
      texture: null,
      rect: { x: r.x, y: r.y, w: r.width, h: r.height },
    });
  });

  const walk = (list) => {
    for (const o of list) {
      if (o.visible === false || (o.alpha !== undefined && o.alpha < 0.05)) continue;
      if (o.type === 'Container' && o.list) { walk(o.list); continue; }
      const r = rectOf(o);
      if (!r || r.w <= 0 || r.h <= 0) continue;
      // A rectangle with no fill and no stroke is invisible, whatever
      // its alpha says: the walk-in exit trigger is one of those, and
      // it is interactive, so it read as a control the machine art was
      // covering. Its tap size is checked where it belongs, in the
      // rig-escape spec.
      // isFilled/isStroked, not the alphas: a Phaser Shape keeps
      // strokeAlpha at 1 even when it has no stroke at all, so reading
      // the alpha alone says every invisible trigger is painted.
      const painted = o.type !== 'Rectangle'
        || (o.isFilled && (o.fillAlpha ?? 1) > 0.05)
        || (o.isStroked && (o.strokeAlpha ?? 1) > 0.05);
      if (!painted) continue;
      all.push({
        type: o.type,
        depth: o.depth ?? 0,
        text: typeof o.text === 'string' ? o.text : '',
        // CSS pixels, which is what a child's eye gets: the design
        // space is fitted with a camera zoom and the canvas has its own
        // scale. Reporting the style's px judged an 11px label at 0.975
        // zoom as 11 when it renders at 10.7.
        fontPx: o.style?.fontSize
          ? parseFloat(o.style.fontSize) * cam.zoom
            * (window.__phaserGame.canvas.getBoundingClientRect().width
               / window.__phaserGame.canvas.width)
          : null,
        interactive: Boolean(o.input),
        texture: o.texture?.key || null,
        rect: r,
      });
    }
  };
  walk(scene.children.list);
  all.push(...domRects);

  // A widget is something a child must read or press. A control's own
  // background is not a widget: the label sitting on it is, and
  // measuring both reports every button as "covered by itself" with no
  // name attached, which is noise a reader cannot act on.
  const contains = (a, b) => b.x >= a.x - 1 && b.y >= a.y - 1
    && b.x + b.w <= a.x + a.w + 1 && b.y + b.h <= a.y + a.h + 1;
  const texts = all.filter((o) => o.type === 'Text' && /[A-Za-z0-9]/.test(o.text));
  const isWidget = (o) => {
    if (o.type === 'DOM') return false;
    if (o.type === 'Text') return /[A-Za-z0-9]/.test(o.text);
    if (!o.interactive) return false;
    if (o.type !== 'Image' && o.type !== 'Sprite' && o.type !== 'Rectangle') return false;
    // Backs a label → it is that label's panel, not a widget of its own.
    return !texts.some((t) => contains(o.rect, t.rect));
  };

  // A modal is allowed to hide the screen — that is its whole job. When
  // a scrim is up, the audit measures the modal and nothing else;
  // without this every widget behind it reads as 100% covered, which
  // is true and useless.
  const dialogOpen = Boolean(document.querySelector('[data-testid="dialog-box"]'));
  const scrim = all.find((o) => o.depth >= 110 && o.type === 'Rectangle'
    && o.rect.w >= vw * 0.9 && o.rect.h >= vh * 0.9);
  const floor = scrim ? scrim.depth : -Infinity;
  const inPlay = scrim ? all.filter((o) => o.depth > floor) : all;

  const widgets = inPlay.filter(isWidget).map((w) => {
    if (w.text) return w;
    // Name an unlabelled control by the nearest text, so a report says
    // which thing on the screen is broken.
    let best = null;
    let bestD = 1e9;
    for (const t of texts) {
      const dx = (t.rect.x + t.rect.w / 2) - (w.rect.x + w.rect.w / 2);
      const dy = (t.rect.y + t.rect.h / 2) - (w.rect.y + w.rect.h / 2);
      const d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = t; }
    }
    const near = best ? '[control near \"' + best.text.slice(0, 24) + '\"]' : '[control]';
    return { ...w, text: near };
  });
  const overlap = (a, b) => {
    const x = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
    const y = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
    return x * y;
  };

  const out = [];
  for (const w of widgets) {
    const area = w.rect.w * w.rect.h;
    if (area <= 0) continue;
    let covered = 0;
    let by = null;
    for (const o of inPlay) {
      if (o === w) continue;
      if ((o.depth ?? 0) <= (w.depth ?? 0)) continue;   // behind it
      if (o.type === 'Text' && !/[A-Za-z0-9]/.test(o.text)) continue;
      const ov = overlap(w.rect, o.rect);
      // A panel that is this text's own background does not cover it.
      if (ov / area > 0.85 && o.type !== 'Text') continue;
      // Nor does something drawn ON the control, inside its own edges:
      // the slate's board sits inside the slate's frame, a sample card
      // has a colour chip and a tick. What covers a control is
      // something that reaches it from outside.
      if (contains(w.rect, o.rect)) continue;
      if (ov > covered) { covered = ov; by = o.text || o.texture || o.type; }
    }
    const offLeft = Math.max(0, -w.rect.x);
    const offTop = Math.max(0, -w.rect.y);
    const offRight = Math.max(0, (w.rect.x + w.rect.w) - vw);
    const offBottom = Math.max(0, (w.rect.y + w.rect.h) - vh);
    out.push({
      text: w.text.slice(0, 48),
      type: w.type,
      depth: w.depth,
      fontPx: w.fontPx,
      coveredFrac: covered / area,
      coveredBy: by,
      offscreenPx: Math.round(Math.max(offLeft, offTop, offRight, offBottom)),
      rect: w.rect,
    });
  }
  return { vw, vh, dialogOpen, widgets: out };
}`;

async function measure(page, sceneKey) {
  return page.evaluate(([key, src, w2p, pscale]) => {
    /* eslint-disable no-new-func */
    window.WORLD_TO_PAGE_FN = new Function('return (' + w2p + ');')();
    window.PAGE_SCALE_FN = new Function('return (' + pscale + ');')();
    const fn = new Function(`return (${src});`)();
    /* eslint-enable no-new-func */
    const scene = window.__phaserGame.scene.getScenes(true)
      .find((s) => s.scene.key === key);
    return scene ? fn(scene) : null;
  }, [sceneKey, MEASURE, WORLD_TO_PAGE, PAGE_SCALE]);
}

/** Tap a Phaser object chosen by a predicate, by touch, on screen. */
async function tapWidget(page, sceneKey, matcher) {
  const spot = await page.evaluate(([key, src, w2p]) => {
    // eslint-disable-next-line no-new-func
    const pick = new Function(`return (${src});`)();
    const scene = window.__phaserGame.scene.getScenes(true)
      .find((s) => s.scene.key === key);
    if (!scene) return null;
    const cam = scene.cameras.main;
    const hit = [];
    const walk = (list) => {
      for (const o of list) {
        if (o.visible === false) continue;
        if (o.type === 'Container' && o.list) { walk(o.list); continue; }
        hit.push(o);
      }
    };
    walk(scene.children.list);
    const obj = hit.filter((o) => pick(o)).sort((a, b) => (b.depth ?? 0) - (a.depth ?? 0))[0];
    if (!obj) return null;
    const b = obj.getBounds();
    // eslint-disable-next-line no-new-func
    const toPage = new Function('return (' + w2p + ');')()(scene, cam);
    const p = toPage(b.centerX, b.centerY, obj.scrollFactorX ?? 1, obj.scrollFactorY ?? 1);
    return { x: p.x, y: p.y, label: obj.text || obj.texture?.key || obj.type };
  }, [sceneKey, matcher.toString(), WORLD_TO_PAGE]);
  if (!spot) return false;
  if (spot.x < 0 || spot.y < 0) return false;
  if (spot.x > page.viewportSize().width || spot.y > page.viewportSize().height) return false;
  await tapAt(page, spot.x, spot.y);
  await page.waitForTimeout(350);
  return true;
}

/**
 * Tap the nth sample card, by touch, using the rig's own slot list.
 *
 * Matching the card by its text matched the bench's "COPPER" label
 * too — same word, higher depth — so the audit tapped a density
 * station, the selection never changed, and the chart stayed empty.
 */
async function tapSampleCard(page, sceneKey, index) {
  const spot = await page.evaluate(([key, idx, w2p]) => {
    const scene = window.__phaserGame.scene.getScenes(true)
      .find((s) => s.scene.key === key);
    const slot = scene?._slots?.[idx];
    if (!slot) return null;
    const b = slot.bg.getBounds();
    const cam = scene.cameras.main;
    // eslint-disable-next-line no-new-func
    const toPage = new Function('return (' + w2p + ');')()(scene, cam);
    return toPage(b.centerX, b.centerY, slot.bg.scrollFactorX ?? 1,
      slot.bg.scrollFactorY ?? 1);
  }, [sceneKey, index, WORLD_TO_PAGE]);
  if (!spot) return false;
  await tapAt(page, spot.x, spot.y);
  await page.waitForTimeout(350);
  return true;
}

/** Which sample the rig has selected right now. */
async function selectedSample(page, sceneKey) {
  return page.evaluate((key) => {
    const s = window.__phaserGame.scene.getScenes(true)
      .find((x) => x.scene.key === key);
    return s ? (s._activeSampleId ?? null) : null;
  }, sceneKey);
}

/** Is a test running in the rig? */
async function isRunning(page, sceneKey) {
  return page.evaluate((key) => {
    const s = window.__phaserGame.scene.getScenes(true)
      .find((x) => x.scene.key === key);
    return Boolean(s && s._testInProgress);
  }, sceneKey);
}

/** Everything wrong with this frame, as readable lines. */
function faults(snapshot, { phone }) {
  const bad = [];
  // A dialog is an overlay on purpose: while one is up the child is
  // reading it, not the chart behind it. Same reasoning as the modal
  // scrim. The states either side of it are still measured.
  if (snapshot.dialogOpen) return bad;
  for (const w of snapshot.widgets) {
    if (w.coveredFrac > 0.10) {
      bad.push(`"${w.text}" at (${Math.round(w.rect.x)},${Math.round(w.rect.y)} `
        + `${Math.round(w.rect.w)}x${Math.round(w.rect.h)}) is `
        + `${Math.round(w.coveredFrac * 100)}% covered by "${w.coveredBy}"`);
    }
    if (w.offscreenPx > 1) {
      bad.push(`"${w.text}" runs ${w.offscreenPx}px off the screen`);
    }
    if (phone && w.type === 'Text' && w.fontPx) {
      // The same rule the game enforces (systems/phoneReadable.js):
      // three words or more is body text. One rule, stated once, or
      // the audit and the game disagree about what passed.
      const words = w.text.trim().split(/\s+/).filter(Boolean).length;
      const floor = words >= 3 ? MIN_BODY_CSS_PX : MIN_LABEL_CSS_PX;
      if (w.fontPx < floor - 0.01) {
        bad.push(`"${w.text}" renders at ${w.fontPx.toFixed(1)} CSS px `
          + `(floor ${floor}px for ${words >= 3 ? 'body' : 'a label'})`);
      }
    }
  }
  return bad;
}

// A rig is an instrument, not a room (review MUST 9).
//
// Zuzu used to spawn on the bench with the d-pad hidden, and with a
// keyboard he walked over the controls: the review measured him
// covering "Run the test" 100%, START 83%, "Slow replay" 92%. The
// coverage audit below cannot see this on its own — the UI band sits
// above the player's y-sorted depth, so it reads as "not covered"
// while a child looks at a boy standing in front of the machine. So
// this asserts the thing itself.
for (const rig of RIGS) {
  test(`${rig.label} has no player standing in it`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await bootToScene(page, rig.key);

    const before = await page.evaluate((key) => {
      const sc = window.__phaserGame.scene.getScenes(true).find((s) => s.scene.key === key);
      return {
        exists: Boolean(sc.player),
        hidden: Boolean(sc.player?.hidden),
        spriteVisible: Boolean(sc.player?.sprite?.visible),
        containerVisible: Boolean(sc.player?.container?.visible),
        labelVisible: Boolean(sc.player?.label?.visible),
        bodyEnabled: Boolean(sc.player?.sprite?.body?.enable),
        x: sc.player?.sprite?.x, y: sc.player?.sprite?.y,
      };
    }, rig.key);

    expect(before.exists, 'the scene still has a player object').toBe(true);
    expect(before.hidden, 'the player is hidden').toBe(true);
    expect(before.containerVisible, 'no player art is drawn').toBe(false);
    expect(before.labelVisible, 'no "Zuzu" tag on the bench').toBe(false);
    expect(before.bodyEnabled, 'the player has no physics body here').toBe(false);

    // And the keyboard cannot walk him across the instruments. The
    // name tag is re-shown every 120ms by the tag-clearance pass, so
    // this waits long enough for that to have run several times.
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(900);
    await page.keyboard.up('ArrowRight');

    const after = await page.evaluate((key) => {
      const sc = window.__phaserGame.scene.getScenes(true).find((s) => s.scene.key === key);
      return {
        x: sc.player?.sprite?.x, y: sc.player?.sprite?.y,
        labelVisible: Boolean(sc.player?.label?.visible),
      };
    }, rig.key);

    expect(after.x, 'holding right did not move him').toBeCloseTo(before.x, 1);
    expect(after.labelVisible, 'and the tag stayed off').toBe(false);
  });
}

for (const rig of RIGS) {
  for (const vp of SIZES) {
    test(`${rig.label} stays readable through a whole test at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await bootToScene(page, rig.key);

      const problems = [];
      const check = async (nn, state) => {
        const snap = await measure(page, rig.key);
        expect(snap, 'scene measured').not.toBeNull();
        await shot(page, rig.key, vp.name, nn, state);
        const bad = faults(snap, vp);
        if (bad.length) problems.push(`${state}:\n    ${bad.join('\n    ')}`);
      };

      await check(10, 'arrived');

      // Run EVERY sample. The "Engineering takeaway" card is written by
      // _emitCompletionDialog, which only fires once all three have
      // been tested — a spec that runs one test never sees the card at
      // all, and the takeaway is the thing the review found covering
      // "Structural Steel" at 1280 and "Back to Garage" at 375x667.
      //
      // Every tap is CHECKED. A tap that silently misses turns this
      // into photographs of the opening state: the first version
      // measured a zoom-1.2 screen with a zoom-1 transform, hit
      // nothing, and reported the same faults five times over while
      // the chart sat empty.
      const sampleCount = await page.evaluate((key) => {
        const sc = window.__phaserGame.scene.getScenes(true)
          .find((x) => x.scene.key === key);
        return sc?._slots?.length ?? 0;
      }, rig.key);
      expect(sampleCount, 'the rig has samples to test').toBeGreaterThan(0);

      for (let i = 0; i < sampleCount; i += 1) {
        const before = await selectedSample(page, rig.key);
        const picked = await tapSampleCard(page, rig.key, i);
        expect(picked, `sample card ${i} is tappable`).toBe(true);
        const after = await selectedSample(page, rig.key);
        if (i !== 0 || before !== after) {
          expect(after, `tapping card ${i} selected it`).not.toEqual(null);
        }
        await check(11 + i * 3, `sample-${i}-picked`);

        const started = await tapWidget(page, rig.key, (o) => o.type === 'Text'
          && /START TEST|Run the test|START/i.test(o.text || ''));
        expect(started, 'found a start control to tap').toBe(true);
        await page.waitForTimeout(900);
        expect(await isRunning(page, rig.key),
          `the test for sample ${i} is actually running`).toBe(true);
        await check(12 + i * 3, `sample-${i}-running`);

        await page.waitForFunction((key) => {
          const sc = window.__phaserGame.scene.getScenes(true)
            .find((x) => x.scene.key === key);
          return sc && sc._testInProgress === false && sc._lastResult;
        }, rig.key, { timeout: 30_000 });
        await page.waitForTimeout(400);
        await dismissDialogs(page);
        await check(13 + i * 3, `sample-${i}-result`);
      }

      // All samples tested: the conclusion is on screen now.
      await page.waitForTimeout(700);
      const hasTakeaway = await page.evaluate((key) => {
        const sc = window.__phaserGame.scene.getScenes(true)
          .find((x) => x.scene.key === key);
        if (!sc) return false;
        const texts = [];
        const walk = (list) => list.forEach((o) => {
          if (o.type === 'Container' && o.list) walk(o.list);
          else if (typeof o.text === 'string') texts.push(o.text);
        });
        walk(sc.children.list);
        return texts.some((t) => /takeaway/i.test(t));
      }, rig.key);
      await check(30, hasTakeaway ? 'takeaway-shown' : 'all-samples-tested');

      if (hasTakeaway && rig.key === 'MaterialLabScene') {
        // Dismiss it by touch, and get it back by touch: a conclusion a
        // child closes must not need three more tests to re-read.
        const dismissed = await tapWidget(page, rig.key, (o) => o.type === 'Text'
          && /^Got it$/i.test(o.text || ''));
        expect(dismissed, 'the takeaway has a close control').toBe(true);
        await page.waitForTimeout(400);
        await check(31, 'takeaway-dismissed');

        const reopened = await tapWidget(page, rig.key, (o) => o.type === 'Text'
          && /^Takeaway$/i.test(o.text || ''));
        expect(reopened, 'the takeaway can be reopened').toBe(true);
        await page.waitForTimeout(400);
        await check(32, 'takeaway-reopened');
        await tapWidget(page, rig.key, (o) => o.type === 'Text'
          && /^Got it$/i.test(o.text || ''));
        await page.waitForTimeout(300);
      }

      // Slow replay, which redraws the chart over everything.
      const slow = await tapWidget(page, rig.key, (o) => o.type === 'Text'
        && /Slow replay/i.test(o.text || ''));
      if (slow) await check(33, 'slow-replay-on');

      // The Density Slate (Materials Lab only).
      if (rig.key === 'MaterialLabScene') {
        const opened = await tapWidget(page, rig.key, (o) => o.type === 'Text'
          && /^SLATE$|Density Slate/i.test(o.text || ''));
        if (opened) {
          await page.waitForTimeout(500);
          await check(34, 'density-slate-open');
        }
      }

      expect(problems, `${rig.label} @ ${vp.name}\n  ${problems.join('\n  ')}`)
        .toEqual([]);
    });
  }
}
