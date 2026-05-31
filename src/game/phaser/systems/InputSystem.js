import Phaser from 'phaser';

export class InputSystem {
  constructor(scene) {
    this.scene = scene;
    this.keys = scene.input.keyboard.addKeys({
      up: 'W',
      down: 'S',
      left: 'A',
      right: 'D',
      up2: 'UP',
      down2: 'DOWN',
      left2: 'LEFT',
      right2: 'RIGHT',
      interact: 'E',
      interact2: 'SPACE',
      notebook: 'N',
      gps: 'G',
      debug: 'F3',
    });
    this.pointerTarget = null;
  }

  getMovementVector() {
    const x = Number(this.keys.right.isDown || this.keys.right2.isDown) - Number(this.keys.left.isDown || this.keys.left2.isDown);
    const y = Number(this.keys.down.isDown || this.keys.down2.isDown) - Number(this.keys.up.isDown || this.keys.up2.isDown);
    return { x, y };
  }

  interactionJustPressed() {
    return Phaser.Input.Keyboard.JustDown(this.keys.interact) || Phaser.Input.Keyboard.JustDown(this.keys.interact2);
  }

  debugJustPressed() {
    return Phaser.Input.Keyboard.JustDown(this.keys.debug);
  }

  notebookJustPressed() {
    return Phaser.Input.Keyboard.JustDown(this.keys.notebook);
  }

  gpsJustPressed() {
    return Phaser.Input.Keyboard.JustDown(this.keys.gps);
  }
}
