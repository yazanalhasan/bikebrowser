/**
 * Bicycle standards for the Bike Builder.
 *
 * Enumerations, aliases, and kid-friendly descriptions. Rules and parts
 * refer to these ids. An alias resolves to one canonical id. Two different
 * canonical ids never count as the same family, even when the pull ratios
 * are close. A wrong "same family" match would tell someone parts fit.
 *
 * Pull-ratio figures are measurements from boothinator/derailleur-analysis
 * (MIT, Copyright (c) 2024 Joshua Booth), used as family labels, not as a
 * reason to mix families. https://github.com/boothinator/derailleur-analysis
 *
 * The adapter model (native / needs-adapter / incompatible / unknown) follows
 * the pattern in isaacrowntree/bike-part-planner (MIT, Copyright (c) 2026
 * Isaac Rowntree). This file is original BikeBrowser code.
 * https://github.com/isaacrowntree/bike-part-planner
 */

/** @typedef {{ id: string, label: string, kid: string, aliases?: string[], pullRatio?: number|null, pullNote?: string, electronic?: boolean }} ActuationFamily */

export const FREEHUBS = {
  'hg-s': {
    label: 'Shimano HG spline S',
    kid: 'The short Shimano freehub used for some 7-speed cassettes.',
    aliases: ['HG-S', 'hg spline s', 'hyperglide-s'],
  },
  'hg-m': {
    label: 'Shimano HG spline M',
    kid: 'The common Shimano freehub for 8, 9, and 10-speed, and for many 11-speed mountain cassettes.',
    aliases: ['HG-M', 'hg', 'hyperglide', 'shimano-hg'],
  },
  'hg-l': {
    label: 'Shimano HG spline L',
    kid: 'The longer Shimano road freehub for 11-speed and 12-speed road cassettes.',
    aliases: ['HG-L', 'hg-11', 'road-11-freehub'],
  },
  'hg-l2': {
    label: 'Shimano HG spline L2',
    kid: 'The Shimano freehub made for 12-speed road cassettes.',
    aliases: ['HG-L2', 'hg-12-road'],
  },
  microspline: {
    label: 'Shimano Micro Spline',
    kid: 'Shimano\'s newer mountain freehub. A regular HG cassette does not slide onto it.',
    aliases: ['micro-spline', 'microspline', 'ms'],
  },
  xd: {
    label: 'SRAM XD',
    kid: 'SRAM\'s mountain driver, used so a cassette can start at a 10-tooth cog.',
    aliases: ['XD', 'sram-xd'],
  },
  xdr: {
    label: 'SRAM XDR',
    kid: 'SRAM\'s longer road driver. An XD cassette can sit on it with a thin spacer. An XDR cassette does not fit on a shorter XD driver.',
    aliases: ['XDR', 'sram-xdr'],
  },
  campagnolo: {
    label: 'Campagnolo',
    kid: 'Campagnolo uses its own splines. A Shimano or SRAM cassette does not fit.',
    aliases: ['campy', 'campagnolo-freehub'],
  },
  n3w: {
    label: 'Campagnolo N3W',
    kid: 'Campagnolo\'s newer freehub. If we are not sure about an adapter, we say we cannot check it yet.',
    aliases: ['N3W', 'campagnolo-n3w'],
  },
  linkglide: {
    label: 'Shimano Linkglide',
    kid: 'Linkglide cassettes use their own body. Shimano\'s HG chart (C-731) does not include them.',
    aliases: ['linkglide', 'cues-freehub'],
  },
};

/** @type {Record<string, ActuationFamily>} */
export const ACTUATION_FAMILIES = {
  'shimano-road-6-9-10': {
    label: 'Shimano classic cable (road 6–10 except Tiagra 4700, and MTB 9-speed)',
    kid: 'The older Shimano click. It covers many 6, 7, 8, and 9-speed bikes, road 10-speed before Tiagra 4700, and 9-speed mountain derailleurs such as Altus and Alivio.',
    aliases: ['shimano-mtb-9', 'shimano-9', 'shimano-road-9', 'shimano-road-10-4600'],
    pullRatio: 1.64,
    pullNote: 'Measured 1.64 on a Shimano Ultegra RD-6500 (9-speed). A Tiagra 4600 10-speed derailleur measured 1.67. Same family, not a mix with newer Shimano mountain or Tiagra 4700.',
  },
  'shimano-tiagra-4700': {
    label: 'Shimano Tiagra 4700',
    kid: 'Tiagra 4700 is 10-speed, but its click is the newer road click. It does not match older 10-speed Shimano.',
    aliases: ['tiagra-4700'],
    pullRatio: null,
    pullNote: 'A Tiagra 4700 shifter measured about 2.65 mm of cable per shift, close to 11-speed road but not treated as the same family.',
  },
  'shimano-road-11': {
    label: 'Shimano road 11-speed cable',
    kid: 'The cable click for Shimano 11-speed road, such as 105 R7000 and Ultegra R8000.',
    aliases: ['shimano-11-road'],
    pullRatio: 1.45,
    pullNote: 'Measured 1.45 on a Shimano 105 RD-5800.',
  },
  'shimano-mtb-10': {
    label: 'Shimano mountain 10-speed (Dyna-Sys)',
    kid: 'The 10-speed mountain click. It is not the same as 9-speed mountain or 11-speed mountain.',
    aliases: ['dyna-sys', 'shimano-dynasys-10'],
    pullRatio: null,
    pullNote: 'A Deore 10-speed shifter (SL-M4100) measured about 3.48 mm of cable per shift. Kept separate from 11-speed mountain so we never call them a match.',
  },
  'shimano-mtb-11': {
    label: 'Shimano mountain 11-speed (Dyna-Sys 11)',
    kid: 'The 11-speed mountain click. A 10-speed mountain shifter is a different click.',
    aliases: ['dyna-sys-11', 'shimano-dynasys-11'],
    pullRatio: 1.1,
    pullNote: 'Measured 1.10 on a Deore RD-M5120 and 1.07 on a Deore RD-M4120 sibling in the same study. 10-speed and 11-speed mountain stay separate families.',
  },
  'shimano-mtb-12': {
    label: 'Shimano mountain 12-speed',
    kid: 'The 12-speed Shimano mountain click. It does not match SRAM Eagle, even though both are 12-speed.',
    aliases: ['shimano-12-mtb', 'hyperglide-plus'],
    pullRatio: 1.07,
    pullNote: 'Measured 1.07 on a Deore RD-M6100.',
  },
  'shimano-linkglide': {
    label: 'Shimano Linkglide / CUES',
    kid: 'CUES and Linkglide are their own family. They do not mix with ordinary Shimano mountain clicks.',
    aliases: ['shimano-cues', 'cues', 'linkglide'],
    pullRatio: 1.06,
    pullNote: 'A CUES 10-speed derailleur (RD-U6020-10) measured 1.06. A CUES 9-speed derailleur measured 1.11. Speed still has to match.',
  },
  'sram-1to1-exact': {
    label: 'SRAM Exact Actuation (older 1:1 mountain)',
    kid: 'Older SRAM mountain shifters and derailleurs. The "1:1" name is SRAM\'s. The measured pull is not exactly 1.',
    aliases: ['sram-exact', 'sram-10'],
    pullRatio: 1.33,
    pullNote: 'Measured 1.33 on a SRAM GX 10-speed RD-GX-T21-A1.',
  },
  'sram-x-actuation-11': {
    label: 'SRAM X-Actuation 11-speed',
    kid: 'SRAM\'s 11-speed cable click, used on Apex 1 and similar derailleurs. It is not Eagle.',
    aliases: ['sram-11', 'x-actuation'],
    pullRatio: 1.22,
    pullNote: 'Measured 1.22 on a SRAM Apex 1 RD-APX-1-A1.',
  },
  'sram-eagle-12': {
    label: 'SRAM Eagle mechanical 12-speed',
    kid: 'Cable Eagle (SX, NX, GX and similar). It does not match a Shimano 12-speed shifter.',
    aliases: ['eagle', 'sram-eagle'],
    pullRatio: 1.08,
    pullNote: 'Measured 1.08 on a SRAM SX Eagle RD-SX-1-B1.',
  },
  'sram-axs': {
    label: 'SRAM AXS',
    kid: 'SRAM\'s wireless electronic shift. It does not talk to Shimano Di2 or Campagnolo EPS.',
    aliases: ['axs'],
    electronic: true,
    pullRatio: null,
  },
  'shimano-di2-12-wireless': {
    label: 'Shimano Di2 12-speed wireless',
    kid: 'Newer Shimano electronic road shift. It is not the older wired Di2, and it is not SRAM AXS.',
    aliases: ['di2-12'],
    electronic: true,
    pullRatio: null,
  },
  'shimano-di2-etube': {
    label: 'Shimano Di2 wired (e-tube)',
    kid: 'Older Shimano electronic shift, with wires. It does not mix with 12-speed wireless Di2 or with SRAM.',
    aliases: ['di2-11', 'etube'],
    electronic: true,
    pullRatio: null,
  },
  'campagnolo-mech-11': {
    label: 'Campagnolo mechanical 11-speed',
    kid: 'Campagnolo\'s 11-speed cable click. It is its own language.',
    aliases: ['campy-11'],
    pullRatio: null,
  },
  'campagnolo-mech-12': {
    label: 'Campagnolo mechanical 12-speed',
    kid: 'Campagnolo\'s 12-speed cable click.',
    aliases: ['campy-12'],
    pullRatio: null,
  },
  'campagnolo-mech-13': {
    label: 'Campagnolo mechanical 13-speed',
    kid: 'Campagnolo\'s 13-speed cable click, such as Ekar.',
    aliases: ['campy-13', 'ekar'],
    pullRatio: 1.28,
    pullNote: 'Measured 1.28 on a Campagnolo Ekar RD21-EK13.',
  },
  'campagnolo-eps': {
    label: 'Campagnolo EPS / wireless electronic',
    kid: 'Campagnolo\'s electronic shift. It does not talk to Di2 or AXS.',
    aliases: ['eps', 'campagnolo-wireless'],
    electronic: true,
    pullRatio: null,
  },
  'microshift-advent': {
    label: 'Microshift Advent',
    kid: 'Microshift Advent is its own click. It does not match Shimano 9-speed.',
    aliases: ['advent'],
    pullRatio: null,
  },
  'microshift-advent-x': {
    label: 'Microshift Advent X',
    kid: 'Microshift Advent X is a 10-speed family of its own.',
    aliases: ['advent-x'],
    pullRatio: 1.05,
    pullNote: 'Measured 1.05 on a Microshift Advent X RD-M6205AM.',
  },
};

export const E_ECOSYSTEMS = {
  'shimano-di2': {
    label: 'Shimano Di2',
    kid: 'Shimano\'s electronic parts. They only talk to other Di2 parts.',
  },
  'sram-axs': {
    label: 'SRAM AXS',
    kid: 'SRAM\'s wireless parts. They only talk to other AXS parts.',
  },
  'campagnolo-eps': {
    label: 'Campagnolo electronic',
    kid: 'Campagnolo\'s electronic parts. They only talk to other Campagnolo electronic parts.',
  },
};

export const HANGERS = {
  standard: {
    label: 'Standard derailleur hanger',
    kid: 'A replaceable hanger on the frame. Most cable derailleurs hook onto this.',
  },
  udh: {
    label: 'Universal Derailleur Hanger (UDH)',
    kid: 'One shared hanger shape. SRAM\'s Full Mount derailleurs need this.',
  },
  'direct-mount': {
    label: 'Direct-mount hanger',
    kid: 'The derailleur bolts toward the frame in a direct-mount pattern. This is not the same as SRAM Full Mount.',
  },
};

export const BRAKE_TYPES = {
  'rim-caliper': {
    label: 'Rim caliper',
    kid: 'Pads squeeze the wheel\'s rim.',
  },
  'v-brake': {
    label: 'V-brake',
    kid: 'Long-arm pads that squeeze the rim. They need a V-brake lever.',
  },
  cantilever: {
    label: 'Cantilever',
    kid: 'An older rim brake with two separate arms.',
  },
  'mechanical-disc': {
    label: 'Mechanical disc',
    kid: 'A disc brake pulled by a cable.',
  },
  'hydraulic-disc': {
    label: 'Hydraulic disc',
    kid: 'A disc brake pushed by fluid in a hose. The lever and the caliper must use the same fluid.',
  },
};

export const CALIPER_MOUNTS = {
  'post-mount': {
    label: 'Post mount',
    kid: 'The caliper bolts to two posts on the frame or fork.',
  },
  'flat-mount': {
    label: 'Flat mount',
    kid: 'A flatter bolt pattern, common on newer road bikes. A mismatch needs an adapter.',
  },
  is: {
    label: 'International Standard (IS)',
    kid: 'An older disc-brake bolt pattern. A mismatch needs an adapter.',
  },
};

export const ROTOR_MOUNTS = {
  '6-bolt': {
    label: '6-bolt',
    kid: 'The rotor bolts to the hub with six bolts.',
  },
  'center-lock': {
    label: 'Center Lock',
    kid: 'The rotor splines onto the hub and locks with a ring. A mismatch needs an adapter.',
  },
};

export const BRAKE_FLUIDS = {
  mineral: {
    label: 'Mineral oil',
    kid: 'The fluid Shimano, Campagnolo, and SRAM Maven brakes use. It must not be mixed with DOT fluid.',
  },
  dot: {
    label: 'DOT fluid',
    kid: 'The fluid most SRAM disc brakes use (not Maven). It must not be mixed with mineral oil.',
  },
};

export const CHAIN_TYPES = {
  standard: {
    label: 'Standard chain',
    kid: 'An ordinary bike chain for the matching number of speeds.',
  },
  flattop: {
    label: 'SRAM Flattop',
    kid: 'A SRAM road chain with flat outer plates. It stays with Flattop drivetrains.',
  },
  't-type': {
    label: 'SRAM T-Type',
    kid: 'The chain for SRAM Eagle Transmission. It stays with Transmission parts.',
  },
  linkglide: {
    label: 'Shimano Linkglide',
    kid: 'The chain for Linkglide and many CUES bikes. It stays with that system.',
  },
  eagle: {
    label: 'SRAM Eagle',
    kid: 'A SRAM Eagle chain. It stays with Eagle cassettes and derailleurs.',
  },
  campagnolo: {
    label: 'Campagnolo',
    kid: 'A Campagnolo chain. It stays with Campagnolo drivetrain parts.',
  },
};

export const SPEEDS = [7, 8, 9, 10, 11, 12, 13];

export const SLOTS = [
  { id: 'frame', category: 'frame', label: 'Frame', kid: 'The frame decides the hanger, the axles, the bottom bracket, and how the brakes bolt on.', phase: 'minimal' },
  { id: 'bottom_bracket', category: 'bottom_bracket', label: 'Bottom bracket', kid: 'The bearings that join the crank to the frame. The shell and the spindle both have to match.' },
  { id: 'motor', category: 'motor', label: 'Motor', kid: 'A mid-drive takes the place of the crank. A hub motor takes the place of the rear wheel hub.' },
  { id: 'battery', category: 'battery', label: 'Battery', kid: 'The battery voltage and plug have to match the controller.' },
  { id: 'controller', category: 'controller', label: 'Controller', kid: 'The controller is the brain between the battery and the motor. Voltage, current, and the plug all have to match.' },
  { id: 'display', category: 'display', label: 'Display', kid: 'The screen on the bar. It has to speak the same language as the controller, and the plug has to match.' },
  { id: 'throttle', category: 'throttle', label: 'Throttle', kid: 'The thumb or twist grip. It has to use the same signal, the same plug, and the same kind of talk as the controller. Pack voltage is not what decides this.' },
  { id: 'pas', category: 'pas', label: 'Pedal sensor', kid: 'The sensor by the pedals. Magnet count and plug have to match what the controller expects.' },
  { id: 'brake_sensor', category: 'brake_sensor', label: 'Brake cutoff', kid: 'The little switch that tells the motor to stop helping when you brake. Open and closed switches are not the same.' },
  { id: 'speed_sensor', category: 'speed_sensor', label: 'Speed sensor', kid: 'The magnet that tells the controller how fast the wheel is turning. The plug has to match.' },
  { id: 'light', category: 'light', label: 'Light', kid: 'A light powered by the controller. The light voltage has to match the controller’s light port.' },
  { id: 'torque_arm', category: 'torque_arm', label: 'Torque arm', kid: 'A hub motor can twist a normal dropout. A torque arm helps hold it.' },
  { id: 'hub', category: 'hub', label: 'Rear hub', kid: 'The hub is the part of the rear wheel the cassette slides onto.' },
  { id: 'front_hub', category: 'front_hub', label: 'Front hub', kid: 'The front hub axle has to match the fork.' },
  { id: 'cassette', category: 'cassette', label: 'Cassette', kid: 'The stack of cogs on the rear wheel.' },
  { id: 'chain', category: 'chain', label: 'Chain', kid: 'The chain has to match the speeds and the special systems.' },
  { id: 'rear_derailleur', category: 'rear_derailleur', label: 'Rear derailleur', kid: 'The rear derailleur moves the chain across the cogs.' },
  { id: 'shifter', category: 'shifter', label: 'Rear shifter', kid: 'The shifter is the click at your hand. It has to speak the same language as the derailleur.' },
  { id: 'crankset', category: 'crankset', label: 'Crankset', kid: 'The chainrings up front. Tooth counts decide the easy and the hard gears.' },
  { id: 'front_derailleur', category: 'front_derailleur', label: 'Front derailleur', kid: 'Only bikes with two chainrings need one of these.' },
  { id: 'brake_lever', category: 'brake_lever', label: 'Brake lever', kid: 'The lever at the bar. It has to match the caliper and the fluid.' },
  { id: 'brake_caliper', category: 'brake_caliper', label: 'Brake caliper', kid: 'The part that squeezes the rotor or the rim.' },
  { id: 'rotor', category: 'rotor', label: 'Brake rotor', kid: 'The disc on the wheel. Its size has to fit the frame.' },
  { id: 'headset', category: 'headset', label: 'Headset', kid: 'The bearings in the head tube. The standard has to match the frame.' },
  { id: 'seatpost', category: 'seatpost', label: 'Seatpost', kid: 'The post diameter has to match the frame. A smaller post can use a shim. A bigger post does not fit.' },
  { id: 'hanger_extender', category: 'hanger_extender', label: 'Hanger extender', kid: 'A small piece that drops the derailleur so a bigger cog can fit. Optional.' },
];

const SLOT_CATEGORY = Object.fromEntries(SLOTS.map((slot) => [slot.id, slot.category]));

export function categoryForSlot(slot) {
  return SLOT_CATEGORY[slot] || null;
}

export function canonicalActuation(id) {
  if (id == null || id === '') return null;
  if (ACTUATION_FAMILIES[id]) return id;
  const key = String(id).trim().toLowerCase();
  if (ACTUATION_FAMILIES[key]) return key;
  for (const [canon, info] of Object.entries(ACTUATION_FAMILIES)) {
    if ((info.aliases || []).some((alias) => alias.toLowerCase() === key)) return canon;
  }
  return key;
}

export function canonicalFreehub(id) {
  if (id == null || id === '') return null;
  const key = String(id).trim().toLowerCase();
  if (FREEHUBS[key]) return key;
  for (const [canon, info] of Object.entries(FREEHUBS)) {
    if ((info.aliases || []).some((alias) => alias.toLowerCase() === key)) return canon;
  }
  return key;
}

export function describeActuation(id) {
  const canon = canonicalActuation(id);
  return ACTUATION_FAMILIES[canon] || null;
}
