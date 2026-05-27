import Phaser from 'phaser';

export class InteractionSystem {
  constructor() {
    this.zones = [];
  }

  register(zone) {
    this.zones.push(zone);
  }

  nearest(player, maxDistance = 78) {
    let best = null;
    let bestDistance = Infinity;
    for (const zone of this.zones) {
      const distance = Phaser.Math.Distance.Between(player.x, player.y, zone.x, zone.y);
      if (distance < maxDistance && distance < bestDistance) {
        best = zone;
        bestDistance = distance;
      }
    }
    return best;
  }
}
