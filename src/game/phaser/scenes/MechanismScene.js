import KnobBenchScene from './KnobBenchScene.js';
import { MechanismModel } from '../systems/MechanismModel.js';
import { MECH_SLOTS, MECH_CATALOG, MECH_CHALLENGE, mechOptionById } from '../../data/chapter6/molecular.js';

// MechanismScene — Chapter 6's biology pillar (molecular biology), config over the
// shared KnobBenchScene. Reachable from the Wind Tunnel hub. Opened with
// `mech:start`, closed with `mech:done`.

export default class MechanismScene extends KnobBenchScene {
  constructor() {
    super('MechanismScene', {
      startEvent: 'mech:start', openedEvent: 'mech:opened', doneEvent: 'mech:done',
      builtEvent: 'mech:built', solvedEvent: 'mech:explained',
      title: 'MECHANISM BENCH — Why Willow Eases Pain',
      testLabel: '🧬 SUBMIT THE MECHANISM',
      buildLabel: '🧬  CONFIRM THE MECHANISM',
      successVerdict: 'mechanism',
      theme: { accent: '#cdb8e8', accentHex: 0xcdb8e8, scrim: 0x0e0a16, slotBox: 0x251d35, predictOn: 0x3d2f57 },
      model: new MechanismModel(),
      slots: MECH_SLOTS, catalog: MECH_CATALOG, optionById: mechOptionById,
      challenge: MECH_CHALLENGE,
      slotLabels: { molecule: 'Active molecule', target: 'Target', effect: 'Action' },
      verdictStyle: {
        mechanism:      { color: '#9be79b', label: 'MECHANISM — explained' },
        wrong_molecule: { color: '#ff7a7a', label: 'WRONG MOLECULE' },
        wrong_target:   { color: '#ffae6a', label: 'WRONG TARGET / LEVEL' },
        wrong_action:   { color: '#ffd27a', label: 'WRONG ACTION' },
        incomplete:     { color: '#c7cdd6', label: 'ASSEMBLE THE MECHANISM' },
      },
      meter: (r) => `Observation: willow tea reduces pain  ·  level: ${r.level || '—'}`,
    });
  }
}
