import KnobBenchScene from './KnobBenchScene.js';
import { CellModel } from '../systems/CellModel.js';
import { CELL_SLOTS, CELL_CATALOG, CELL_CHALLENGE, cellOptionById } from '../../data/chapter4/cellular.js';

// MicroscopeScene — Chapter 4's biology pillar (cellular biology), config over the
// shared KnobBenchScene. Reachable from the Crash Test hub (mirrors the Engine
// Dyno → Phyto Lab link). Opened with `cell:start`, closed with `cell:done`.

export default class MicroscopeScene extends KnobBenchScene {
  constructor() {
    super('MicroscopeScene', {
      startEvent: 'cell:start', openedEvent: 'cell:opened', doneEvent: 'cell:done',
      builtEvent: 'cell:built', solvedEvent: 'cell:resolved',
      title: 'MICROSCOPE — What Living Tissue Is Made Of',
      testLabel: '🔬 LOOK DOWN THE MICROSCOPE',
      buildLabel: '🔬  RECORD THE CELLS',
      successVerdict: 'resolved',
      theme: { accent: '#a8d8c0', accentHex: 0xa8d8c0, scrim: 0x081410, slotBox: 0x153028, predictOn: 0x224a3a },
      model: new CellModel(),
      slots: CELL_SLOTS, catalog: CELL_CATALOG, optionById: cellOptionById,
      challenge: CELL_CHALLENGE,
      slotLabels: { sample: 'Sample', stain: 'Stain', mag: 'Magnification', prep: 'Prep' },
      verdictStyle: {
        resolved:    { color: '#9be79b', label: 'RESOLVED — cells visible' },
        opaque:      { color: '#ff7a7a', label: 'OPAQUE — no light through' },
        too_coarse:  { color: '#ffae6a', label: 'TOO COARSE — can\'t resolve' },
        no_contrast: { color: '#ffd27a', label: 'NO CONTRAST — colourless blur' },
        incomplete:  { color: '#c7cdd6', label: 'PREPARE THE SLIDE' },
      },
      meter: (r) => r.revealed && r.revealed.length ? `Visible: ${r.revealed.join(', ')}` : 'Nothing resolved yet',
    });
  }
}
