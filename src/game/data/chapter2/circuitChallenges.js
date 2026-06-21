// circuitChallenges.js — Chapter 2 (E-bike) build goals + the reasoning loop.
//
// Each challenge is an Observe→Predict→Test→Build→Verify→Payoff→Reflect loop
// (the quest design contract) expressed in electrical terms. The player wires a
// series circuit to power the e-bike's hub motor, predicting whether it will
// SPIN, STALL, or FRY before testing it on the Circuit Bench.

export const CIRCUIT_CHALLENGES = [
  {
    id: 'ebike_first_power',
    title: 'Power the e-bike motor',
    vehicle: 'E-bike',
    motorId: 'motor_250w',
    // What the player is solving for, in plain language (shown as the brief).
    goal: 'Wire the 250W hub motor so it SPINS — enough volts to turn it, and every part rated for the current that flows. No part may fry, and a fuse must protect it.',
    // The canonical good answer (used for coaching + the "best build" payoff,
    // never auto-filled — the player must reason to it).
    idealSelection: { battery: 'batt_36v', fuse: 'fuse_10a', controller: 'ctrl_15a', wire: 'wire_med', motor: 'motor_250w' },
    // Predict prompt — the player commits a hypothesis before testing.
    predictPrompt: 'Before you test it: will this circuit SPIN the motor, STALL (too little push), or FRY a part (too much current)?',
    predictOptions: ['spin', 'stall', 'fry'],
    // The lesson the build is designed to make visible.
    teaches: 'Voltage drives current; resistance limits it; every part has a current rating. Strength-to-weight became "rated-for-the-current": is it enough, and is it safe?',
    reflect: 'You sized a circuit the same way you sized a beam — by reading each part\'s limits and checking the load against them.',
  },
];

export function challengeById(id) {
  return CIRCUIT_CHALLENGES.find((c) => c.id === id) || CIRCUIT_CHALLENGES[0];
}

export default { CIRCUIT_CHALLENGES, challengeById };
