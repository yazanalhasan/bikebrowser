/**
 * calipers — fixed-volume coupon prop.
 *
 * Visual: small transparent beaker + label "Coupons: 10 cm³ uniform".
 * On click: emits a Lab-Notes dialog event explaining the volume and
 * the density formula, and writes `volume_known` to state.observations.
 *
 * Pure Phaser. No save imports — caller supplies an `onClick` callback
 * that handles the registry update.
 *
 * @param {Phaser.Scene} scene
 * @param {object} cfg
 * @param {number} cfg.x
 * @param {number} cfg.y
 * @param {() => void} cfg.onClick
 * @returns {{ destroy: () => void }}
 */
export function createCalipers(scene, cfg) {
  const { x, y, onClick } = cfg;

  // Beaker outline (rounded-bottom rectangle approximation).
  const beaker = scene.add.rectangle(x, y, 30, 36, 0xa4d8e0, 0.25)
    .setStrokeStyle(2, 0x60a5fa).setDepth(3)
    .setInteractive({ useHandCursor: true });
  // Liquid line (fills 70% of beaker).
  scene.add.rectangle(x, y + 6, 26, 18, 0x60a5fa, 0.4).setDepth(4);
  // Coupon (centered inside beaker).
  const coupon = scene.add.rectangle(x, y, 14, 10, 0xa4d8e0)
    .setStrokeStyle(1, 0x111114).setDepth(5);

  const label = scene.add.text(x, y + 28, 'Coupons: 10 cm³ uniform', {
    fontSize: '10px', fontFamily: 'sans-serif', color: '#a4a8b3',
  }).setOrigin(0.5).setDepth(4);

  beaker.on('pointerdown', () => onClick());

  return {
    destroy() {
      [beaker, coupon, label].forEach(o => o?.destroy?.());
    },
  };
}
