import KnobBenchScene from './KnobBenchScene.js';
import { EcosystemModel } from '../systems/EcosystemModel.js';
import { ECO_SLOTS, ECO_CATALOG, ECO_CHALLENGE, ecoOptionById } from '../../data/chapter7/systemsBio.js';

// EcosystemScene — Chapter 7's biology capstone (systems biology & life
// engineering), config over the shared KnobBenchScene. Reachable from the Vacuum
// Chamber hub. Opened with `eco:start`, closed with `eco:done`.

export default class EcosystemScene extends KnobBenchScene {
  constructor() {
    super('EcosystemScene', {
      startEvent: 'eco:start', openedEvent: 'eco:opened', doneEvent: 'eco:done',
      builtEvent: 'eco:built', solvedEvent: 'eco:stabilized',
      title: 'LIFE-ENGINEERING — Seed an Ecosystem',
      testLabel: '🌍 RELEASE THE SYSTEM',
      buildLabel: '🌱  ESTABLISH THE ECOSYSTEM',
      successVerdict: 'stable',
      theme: { accent: '#9fd6b0', accentHex: 0x9fd6b0, scrim: 0x081410, slotBox: 0x14301f, predictOn: 0x1f4a30 },
      model: new EcosystemModel(),
      slots: ECO_SLOTS, catalog: ECO_CATALOG, optionById: ecoOptionById,
      challenge: ECO_CHALLENGE,
      slotLabels: { producer: 'Producer', decomposer: 'Decomposer', consumer: 'Consumer', approach: 'Approach' },
      verdictStyle: {
        stable:         { color: '#9be79b', label: 'STABLE — self-sustaining' },
        no_base:        { color: '#ff7a7a', label: 'NO ENERGY BASE' },
        nutrient_lockup: { color: '#ffae6a', label: 'NUTRIENT LOCKUP' },
        algae_bloom:    { color: '#ffd27a', label: 'BLOOM & CRASH' },
        reckless:       { color: '#ff9a9a', label: 'RECKLESS — irreversible' },
        incomplete:     { color: '#c7cdd6', label: 'DESIGN THE ECOSYSTEM' },
      },
      meter: (r) => {
        const ro = r.roles || {};
        return `producer ${ro.producer ? '✓' : '✗'}  decomposer ${ro.decomposer ? '✓' : '✗'}  balance ${ro.balanced ? '✓' : '✗'}  responsible ${ro.responsible ? '✓' : '✗'}`;
      },
    });
  }
}
