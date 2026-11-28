/**
 * labModal — a card that owns the screen until the child dismisses it.
 *
 * Written for the "Engineering takeaway" (review MUSTs 3 and 6). That
 * card was placed by world coordinates and chased around the bench
 * from one collision to the next: at (320,170) it covered "Structural
 * Steel" by 40%, moved under the chart it covered the coupons station
 * by 81%, and at 375x667 it covered the way out completely. An 800x600
 * bench that already holds a selector column, a chart, a readout, a
 * machine and an instrument row has no 350x58 hole in it, and looking
 * for one is the wrong shape of fix.
 *
 * A conclusion is not furniture. It arrives, the child reads it, it
 * goes away — and a thing that owns the screen cannot cover anything,
 * at any size, in any orientation.
 *
 * Screen-fixed: positions come from the camera's worldView, so this is
 * correct whatever the zoom or the scroll.
 */

import {
  MODAL_BG_DEPTH, MODAL_CONTROL_DEPTH, MODAL_TEXT_DEPTH, SCRIM_DEPTH,
} from '../labelLayout.js';
import { MIN_TAP_PX } from '../phoneReadable.js';

/**
 * @param {Phaser.Scene} scene
 * @param {object} cfg
 * @param {string} cfg.title
 * @param {string[]} cfg.lines
 * @param {() => void} [cfg.onClose]
 * @param {string} [cfg.closeLabel]
 * @returns {{ destroy: () => void, isOpen: () => boolean }}
 */
export function showLabModal(scene, cfg) {
  const { title, lines, onClose, closeLabel = 'Got it' } = cfg;
  const cam = scene.cameras.main;
  const view = cam.worldView;
  const zoom = Math.max(cam.zoom, 0.01);

  // Sized from the camera, not from a design canvas: at 844x390 the
  // bench is scaled to 0.49 and a card measured in world units came
  // out at 5 CSS px of text.
  const cardW = Math.min(360, view.width - 24);
  const pad = 14;

  const heading = scene.add.text(0, 0, title, {
    fontSize: `${Math.max(13, Math.round(14 / zoom))}px`,
    fontFamily: 'sans-serif',
    color: '#fbbf24',
    fontStyle: 'bold',
  }).setOrigin(0.5, 0).setDepth(MODAL_TEXT_DEPTH);

  const body = scene.add.text(0, 0, lines.join('\n'), {
    fontSize: `${Math.max(12, Math.round(13 / zoom))}px`,
    fontFamily: 'sans-serif',
    color: '#f8fafc',
    align: 'center',
    lineSpacing: 4,
    wordWrap: { width: cardW - pad * 2 },
  }).setOrigin(0.5, 0).setDepth(MODAL_TEXT_DEPTH);

  const btnH = Math.max(32, MIN_TAP_PX / zoom);
  const btnW = Math.max(96, MIN_TAP_PX * 2 / zoom);
  const cardH = pad * 2 + heading.height + 8 + body.height + 12 + btnH;
  const cx = view.centerX;
  const cy = view.centerY;
  const top = cy - cardH / 2;

  const scrim = scene.add.rectangle(
    view.centerX, view.centerY, view.width, view.height, 0x05070c, 0.7,
  ).setDepth(SCRIM_DEPTH).setInteractive();

  const bg = scene.add.rectangle(cx, cy, cardW, cardH, 0x111827, 0.98)
    .setStrokeStyle(2, 0xfbbf24).setDepth(MODAL_BG_DEPTH).setInteractive();

  heading.setPosition(cx, top + pad);
  body.setPosition(cx, top + pad + heading.height + 8);

  const btnY = top + cardH - pad - btnH / 2;
  const btn = scene.add.rectangle(cx, btnY, btnW, btnH, 0x2563eb)
    .setStrokeStyle(2, 0x1d4ed8).setDepth(MODAL_CONTROL_DEPTH)
    .setInteractive({ useHandCursor: true });
  const btnLbl = scene.add.text(cx, btnY, closeLabel, {
    fontSize: `${Math.max(12, Math.round(13 / zoom))}px`,
    fontFamily: 'sans-serif',
    color: '#ffffff',
    fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(MODAL_CONTROL_DEPTH + 1);

  const objs = [scrim, bg, heading, body, btn, btnLbl];
  let open = true;

  const close = () => {
    if (!open) return;
    open = false;
    objs.forEach((o) => o?.destroy?.());
    onClose?.();
  };

  btn.on('pointerdown', close);
  scrim.on('pointerdown', close);

  return { destroy: close, isOpen: () => open };
}
