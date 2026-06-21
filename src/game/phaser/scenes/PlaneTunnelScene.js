import KnobBenchScene from './KnobBenchScene.js';
import { AeroModel } from '../systems/AeroModel.js';
import { PLANE_SLOTS, PLANE_CATALOG, PLANE_CHALLENGE, planeOptionById } from '../../data/chapter6/aerodynamics.js';

// PlaneTunnelScene — Chapter 6's Wind Tunnel, config over the shared
// KnobBenchScene. Opened with `plane:start`, closed with `plane:done`.

export default class PlaneTunnelScene extends KnobBenchScene {
  constructor() {
    super('PlaneTunnelScene', {
      startEvent: 'plane:start', openedEvent: 'plane:opened', doneEvent: 'plane:done',
      builtEvent: 'plane:built', solvedEvent: 'plane:flew',
      title: 'WIND TUNNEL — Make the Plane Fly',
      testLabel: '🌬 RUN THE WIND TUNNEL',
      buildLabel: '✈  BUILD THE PLANE',
      successVerdict: 'fly',
      theme: { accent: '#c9d6e8', accentHex: 0xc9d6e8, scrim: 0x0c1118, slotBox: 0x1d2530, predictOn: 0x35455c },
      model: new AeroModel(),
      slots: PLANE_SLOTS, catalog: PLANE_CATALOG, optionById: planeOptionById,
      challenge: PLANE_CHALLENGE,
      slotLabels: { airfoil: 'Airfoil', angle: 'Angle of attack', structure: 'Structure', engine: 'Engine' },
      verdictStyle: {
        fly:         { color: '#9be79b', label: 'FLIES — balanced' },
        structural:  { color: '#ff7a7a', label: 'STRUCTURAL FAILURE' },
        stall:       { color: '#ffae6a', label: 'STALL' },
        too_heavy:   { color: '#ffd27a', label: 'TOO HEAVY' },
        underpowered: { color: '#ffd27a', label: 'UNDERPOWERED' },
        incomplete:  { color: '#c7cdd6', label: 'FINISH THE AIRCRAFT' },
      },
      meter: (r) => `Lift ${r.lift} vs weight ${r.weight}  ·  thrust ${r.thrust} vs drag ${r.drag}  ·  wing load ${r.wingLoad}`,
    });
  }
}
