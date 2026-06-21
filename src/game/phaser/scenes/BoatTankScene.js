import KnobBenchScene from './KnobBenchScene.js';
import { BuoyancyModel } from '../systems/BuoyancyModel.js';
import { BOAT_SLOTS, BOAT_CATALOG, BOAT_CHALLENGE, boatOptionById } from '../../data/chapter5/buoyancy.js';

// BoatTankScene — Chapter 5's Buoyancy / Hydro Tank, expressed as config over the
// shared KnobBenchScene. Opened with `boat:start`, closed with `boat:done`.

export default class BoatTankScene extends KnobBenchScene {
  constructor() {
    super('BoatTankScene', {
      startEvent: 'boat:start', openedEvent: 'boat:opened', doneEvent: 'boat:done',
      builtEvent: 'boat:built', solvedEvent: 'boat:floated',
      title: 'HYDRO TANK — Float the Boat',
      testLabel: '🌊 LOWER INTO THE TANK',
      buildLabel: '⛵  BUILD THE BOAT',
      successVerdict: 'float',
      theme: { accent: '#7fc6e6', accentHex: 0x7fc6e6, scrim: 0x081018, slotBox: 0x132634, predictOn: 0x1f4a5a },
      model: new BuoyancyModel(),
      slots: BOAT_SLOTS, catalog: BOAT_CATALOG, optionById: boatOptionById,
      challenge: BOAT_CHALLENGE,
      slotLabels: { hull: 'Hull', material: 'Material', cargo: 'Cargo', ballast: 'Ballast' },
      verdictStyle: {
        float:    { color: '#9be79b', label: 'FLOATS LEVEL' },
        sink:     { color: '#ff7a7a', label: 'SINKS' },
        capsize:  { color: '#ffae6a', label: 'CAPSIZES' },
        incomplete: { color: '#c7cdd6', label: 'FINISH THE BOAT' },
      },
      meter: (r) => `Displaces ${r.displacement}  ·  weighs ${r.totalWeight}  ·  reserve ${r.reserve}  ·  righting ${r.stability}`,
    });
  }
}
