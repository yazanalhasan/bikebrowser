// circuitComponents.js — Chapter 2 (E-bike) electrical parts catalog (arc.md §3/§4).
//
// The electrical carry-forward rig. Chapter 1 taught "is this beam strong
// enough?" with mechanical primitives (strength, stiffness); Chapter 2 teaches
// "is this part rated for this current, and is the voltage enough?" with
// electrical primitives. Same discipline as the Materials Lab: every part
// DECLARES its measurable primitives, and the CircuitModel reads them — no part
// hard-codes a verdict. Parts are portable: later vehicles (motorcycle, car…)
// reuse this same catalog shape for their wiring.
//
// Primitives:
//   volts          — EMF a source provides (battery).
//   capacityAh      — energy store (range), not used in the pass/fail solve yet.
//   resistanceOhm   — series resistance the part adds (wire, controller, motor).
//   maxCurrentA     — current rating; exceed it and the part fails (fries/melts/blows).
//   minVolts        — (motor) volts across it needed to actually spin.
//   ratedWatts      — (motor) nameplate power, for display/teaching.
//
// Each slot offers several options so picking is a real reasoning puzzle, not a
// rubber stamp: too little voltage → the motor won't spin; a controller/wire/fuse
// rated below the operating current → it fails; an oversized fuse → no protection.

export const BATTERIES = [
  { id: 'batt_24v', slot: 'battery', name: '24V battery', volts: 24, capacityAh: 10, resistanceOhm: 0.15, maxCurrentA: 30, note: 'Light, but may not spin a 36V motor.' },
  { id: 'batt_36v', slot: 'battery', name: '36V battery', volts: 36, capacityAh: 10, resistanceOhm: 0.12, maxCurrentA: 30, note: 'Matched to a 36V e-bike motor.' },
  { id: 'batt_48v', slot: 'battery', name: '48V battery', volts: 48, capacityAh: 10, resistanceOhm: 0.10, maxCurrentA: 40, note: 'More volts → more current; can overdrive smaller parts.' },
];

// The e-bike's load. Fixed target for the first build (the player wires power TO it).
export const MOTORS = [
  { id: 'motor_250w', slot: 'motor', name: '250W hub motor', ratedWatts: 250, resistanceOhm: 3.6, minVolts: 30, maxCurrentA: 12, note: 'Needs ~36V to spin; burns past 12A.' },
];

export const CONTROLLERS = [
  { id: 'ctrl_8a', slot: 'controller', name: '8A controller', resistanceOhm: 0.3, maxCurrentA: 8, note: 'Cheap, but fries above 8A.' },
  { id: 'ctrl_15a', slot: 'controller', name: '15A controller', resistanceOhm: 0.25, maxCurrentA: 15, note: 'Headroom for a 250W motor.' },
  { id: 'ctrl_30a', slot: 'controller', name: '30A controller', resistanceOhm: 0.2, maxCurrentA: 30, note: 'Overkill here; heavier and pricier.' },
];

export const WIRES = [
  { id: 'wire_thin', slot: 'wire', name: 'thin wire (22AWG)', resistanceOhm: 0.9, maxCurrentA: 7, note: 'High resistance; melts under load.' },
  { id: 'wire_med', slot: 'wire', name: 'medium wire (18AWG)', resistanceOhm: 0.3, maxCurrentA: 16, note: 'Good balance for this motor.' },
  { id: 'wire_thick', slot: 'wire', name: 'thick wire (12AWG)', resistanceOhm: 0.1, maxCurrentA: 40, note: 'Low loss, but stiff and heavy.' },
];

export const FUSES = [
  { id: 'fuse_none', slot: 'fuse', name: 'no fuse', resistanceOhm: 0, maxCurrentA: Infinity, note: 'No protection — a fault can fry everything.' },
  { id: 'fuse_10a', slot: 'fuse', name: '10A fuse', resistanceOhm: 0.02, maxCurrentA: 10, note: 'Blows first to protect the motor & controller.' },
  { id: 'fuse_20a', slot: 'fuse', name: '20A fuse', resistanceOhm: 0.02, maxCurrentA: 20, note: 'Too high to protect an 8–12A circuit.' },
];

// Series build order: battery → fuse → controller → wire → motor.
export const CIRCUIT_SLOTS = ['battery', 'fuse', 'controller', 'wire', 'motor'];

export const COMPONENT_CATALOG = {
  battery: BATTERIES,
  fuse: FUSES,
  controller: CONTROLLERS,
  wire: WIRES,
  motor: MOTORS,
};

export function componentById(id) {
  for (const list of Object.values(COMPONENT_CATALOG)) {
    const found = list.find((c) => c.id === id);
    if (found) return found;
  }
  return null;
}

export function optionsForSlot(slot) {
  return COMPONENT_CATALOG[slot] || [];
}

export default { BATTERIES, MOTORS, CONTROLLERS, WIRES, FUSES, CIRCUIT_SLOTS, COMPONENT_CATALOG, componentById, optionsForSlot };
