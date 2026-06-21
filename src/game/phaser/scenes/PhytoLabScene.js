import KnobBenchScene from './KnobBenchScene.js';
import { PhytoModel } from '../systems/PhytoModel.js';
import { PHYTO_SLOTS, PHYTO_CATALOG, PHYTO_CHALLENGE, phytoOptionById } from '../../data/chapter3/phytochemistry.js';

// PhytoLabScene — Chapter 3's biology pillar (phytochemistry), config over the
// shared KnobBenchScene. Reachable from the Engine Dyno (the Ch3 hub), mirroring
// how Ch2's Extraction Bench hangs off the Circuit Bench. Opened with
// `phyto:start`, closed with `phyto:done`.

export default class PhytoLabScene extends KnobBenchScene {
  constructor() {
    super('PhytoLabScene', {
      startEvent: 'phyto:start', openedEvent: 'phyto:opened', doneEvent: 'phyto:done',
      builtEvent: 'phyto:built', solvedEvent: 'phyto:extracted',
      title: 'EXTRACTION LAB — Phytochemistry',
      testLabel: '⚗ RUN THE EXTRACTION',
      buildLabel: '🧪  BOTTLE THE SALICIN',
      successVerdict: 'pure',
      theme: { accent: '#bfe3c3', accentHex: 0xbfe3c3, scrim: 0x0a140c, slotBox: 0x18301d, predictOn: 0x244a2c },
      model: new PhytoModel(),
      slots: PHYTO_SLOTS, catalog: PHYTO_CATALOG, optionById: phytoOptionById,
      challenge: PHYTO_CHALLENGE,
      slotLabels: { solvent: 'Solvent', temp: 'Temperature', time: 'Steep time', grind: 'Prep' },
      verdictStyle: {
        pure:          { color: '#9be79b', label: 'PURE SALICIN' },
        wrong_compound: { color: '#ff9a9a', label: 'WRONG COMPOUND' },
        degraded:      { color: '#ffae6a', label: 'DEGRADED' },
        bitter:        { color: '#ffd27a', label: 'BITTER (tannins)' },
        low_yield:     { color: '#cdd6e2', label: 'LOW YIELD' },
        incomplete:    { color: '#c7cdd6', label: 'SET UP THE EXTRACTION' },
      },
      meter: (r) => `Compound: ${r.compound}  ·  yield ${r.yieldPct ?? 0}%  ·  purity ${r.purityPct ?? 0}%`,
    });
  }
}
