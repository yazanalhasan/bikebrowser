import KnobBenchScene from './KnobBenchScene.js';
import { VacuumModel } from '../systems/VacuumModel.js';
import { SPACE_SLOTS, SPACE_CATALOG, SPACE_CHALLENGE, spaceOptionById } from '../../data/chapter7/vacuumReentry.js';

// VacuumChamberScene — Chapter 7's Vacuum / Re-entry Chamber, config over the
// shared KnobBenchScene. The finale rig. Opened with `space:start`, closed with
// `space:done`.

export default class VacuumChamberScene extends KnobBenchScene {
  constructor() {
    super('VacuumChamberScene', {
      startEvent: 'space:start', openedEvent: 'space:opened', doneEvent: 'space:done',
      builtEvent: 'space:built', solvedEvent: 'space:certified',
      title: 'VACUUM / RE-ENTRY CHAMBER — Certify the Spacecraft',
      testLabel: '🚀 RUN CERTIFICATION',
      buildLabel: '🛰  BUILD & LAUNCH',
      successVerdict: 'certified',
      theme: { accent: '#b9a8e8', accentHex: 0xb9a8e8, scrim: 0x0a0814, slotBox: 0x221d33, predictOn: 0x3a2f5d },
      model: new VacuumModel(),
      slots: SPACE_SLOTS, catalog: SPACE_CATALOG, optionById: spaceOptionById,
      challenge: SPACE_CHALLENGE,
      slotLabels: { propulsion: 'Propulsion', shield: 'Heat shield', life: 'Life support', redundancy: 'Redundancy' },
      verdictStyle: {
        certified:   { color: '#9be79b', label: 'CERTIFIED — cleared to launch' },
        vacuum_fail: { color: '#ff7a7a', label: 'VACUUM FAILURE' },
        burn_up:     { color: '#ffae6a', label: 'BURNS UP ON RE-ENTRY' },
        life_fail:   { color: '#ff9a9a', label: 'LIFE SUPPORT FAILS' },
        single_point: { color: '#ffd27a', label: 'SINGLE POINT OF FAILURE' },
        incomplete:  { color: '#c7cdd6', label: 'COMPLETE THE SPACECRAFT' },
      },
      meter: (r) => `vacuum ${r.vacuumCapable ? 'ok' : 'NO'}  ·  shield ${r.shieldProtection}/${r.reentryHeat}  ·  life ${r.lifeCapacity}  ·  fault-tolerance ${r.failTolerance}`,
    });
  }

  // The Vacuum Chamber is the Chapter-7 hub: link to the biology capstone (the
  // systems-biology Life-Engineering bench).
  render() {
    super.render();
    if (!this.open) return;
    const btn = this.add.rectangle(1124, 64, 240, 30, 0x14301f, 1)
      .setStrokeStyle(1, 0x9fd6b0, 0.5).setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => { this.hide(); this.registry.events.emit('eco:start'); });
    const txt = this.add.text(1124, 64, '🌍 Life-Engineering →', {
      fontFamily: 'Arial', fontSize: '12px', color: '#9fd6b0', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0);
    this.controlLayer.add([btn, txt]);
  }
}
