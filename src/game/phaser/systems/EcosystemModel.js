import { ECO_SLOTS, ECO_CATALOG, ecoOptionById } from '../../data/chapter7/systemsBio.js';

// EcosystemModel — Chapter 7's systems-biology carry-forward rig (the capstone).
// It simulates whether a seeded closed loop sustains itself, checking the roles in
// the order a system fails without them (energy base → nutrient recycling →
// population balance) and then the ethical gate the whole game builds toward: even
// a stable design is not "done" if it was released irreversibly. Verdict reads
// only from the option data.
//
// Verdict priority: no_base > nutrient_lockup > algae_bloom > reckless > stable.

export class EcosystemModel {
  resolve(selection = {}) {
    return ECO_SLOTS.map((slot) => ({ slot, id: selection[slot] || null, opt: ecoOptionById(slot, selection[slot]) }));
  }

  solve(selection = {}) {
    const parts = this.resolve(selection);
    const missing = parts.filter((p) => !p.opt).map((p) => p.slot);
    if (missing.length) {
      return { ok: false, verdict: 'incomplete', reason: `design the ecosystem (missing: ${missing.join(', ')})`, missing };
    }
    const by = Object.fromEntries(parts.map((p) => [p.slot, p.opt]));

    let verdict; let reason;
    if (!by.producer.producer) {
      verdict = 'no_base';
      reason = 'No energy base: with no producer, nothing captures light into food and oxygen — the system never starts.';
    } else if (!by.decomposer.decomposer) {
      verdict = 'nutrient_lockup';
      reason = 'Nutrient lockup: without decomposers, dead matter never recycles into nutrients — the loop starves and crashes.';
    } else if (!by.consumer.balanced) {
      verdict = 'algae_bloom';
      reason = 'Algae bloom & crash: with no consumer, the producer overgrows, exhausts its resources, and collapses. Balance needs a grazer.';
    } else if (!by.approach.responsible) {
      verdict = 'reckless';
      reason = 'It works — but you released it irreversibly across a whole world with no way to undo it. The last engineering question is not "can I?" but "should I?". Do it monitored and reversible.';
    } else {
      verdict = 'stable';
      reason = 'Stable, self-sustaining loop: producer → consumer → decomposer → nutrients → producer, balanced, and engineered responsibly — monitored, with a way to undo it.';
    }

    return {
      ok: verdict === 'stable',
      verdict,
      reason,
      roles: { producer: by.producer.producer, decomposer: by.decomposer.decomposer, balanced: by.consumer.balanced, responsible: by.approach.responsible },
      members: parts,
      missing: [],
    };
  }

  catalog() { return ECO_CATALOG; }
}

export default EcosystemModel;
