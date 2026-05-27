export class BikeSystem {
  static carryForward = {
    environmentalPrimitives: ['terrain_roughness', 'route_access'],
    progressionPrimitives: ['bike_checked', 'bike_upgraded'],
    actScalingPath: 'Bike readiness becomes the first vehicle capability model before later regional traversal upgrades.',
  };

  constructor() {
    this.checked = false;
    this.upgraded = false;
  }

  checkBike() {
    this.checked = true;
    return { ok: true, checked: true };
  }

  upgradeBike() {
    this.upgraded = true;
    return { ok: true, upgraded: true };
  }

  getState() {
    return { checked: this.checked, upgraded: this.upgraded };
  }

  loadState(state = {}) {
    this.checked = Boolean(state.checked);
    this.upgraded = Boolean(state.upgraded);
  }
}
