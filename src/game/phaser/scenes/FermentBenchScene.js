import KnobBenchScene from './KnobBenchScene.js';
import { FermentModel } from '../systems/FermentModel.js';
import { FERMENT_SLOTS, FERMENT_CATALOG, FERMENT_CHALLENGE, fermentOptionById } from '../../data/chapter5/microbiology.js';

// FermentBenchScene — Chapter 5's biology pillar (microbiology), config over the
// shared KnobBenchScene. Reachable from the Hydro Tank hub. Opened with
// `ferment:start`, closed with `ferment:done`.

export default class FermentBenchScene extends KnobBenchScene {
  constructor() {
    super('FermentBenchScene', {
      startEvent: 'ferment:start', openedEvent: 'ferment:opened', doneEvent: 'ferment:done',
      builtEvent: 'ferment:built', solvedEvent: 'ferment:made',
      title: 'FERMENTATION BENCH — Microbiology',
      testLabel: '🫙 SEAL & WAIT',
      buildLabel: '🍶  BOTTLE THE BREW',
      successVerdict: 'alcohol',
      theme: { accent: '#d8c69a', accentHex: 0xd8c69a, scrim: 0x120f08, slotBox: 0x2a2417, predictOn: 0x4a3f24 },
      model: new FermentModel(),
      slots: FERMENT_SLOTS, catalog: FERMENT_CATALOG, optionById: fermentOptionById,
      challenge: FERMENT_CHALLENGE,
      slotLabels: { substrate: 'Substrate', microbe: 'Microbe', temp: 'Temperature', oxygen: 'Oxygen' },
      verdictStyle: {
        alcohol:        { color: '#9be79b', label: 'ALCOHOL — fermented!' },
        vinegar:        { color: '#ffd27a', label: 'VINEGAR (acetic acid)' },
        sour:           { color: '#ffd27a', label: 'SOUR (lactic acid)' },
        aerobic_growth: { color: '#ffae6a', label: 'AEROBIC GROWTH — no alcohol' },
        dead:           { color: '#ff7a7a', label: 'DEAD CULTURE' },
        no_food:        { color: '#ff9a9a', label: 'NO FOOD' },
        dormant:        { color: '#cdd6e2', label: 'DORMANT' },
        incomplete:     { color: '#c7cdd6', label: 'SET UP THE CULTURE' },
      },
      meter: (r) => r.product ? `Product: ${r.product}  ·  microbe: ${r.microbe}` : `microbe: ${r.microbe || '—'}  ·  no product`,
    });
  }
}
