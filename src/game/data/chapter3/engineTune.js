// engineTune.js — Chapter 3 (Motorcycle) combustion powertrain (arc.md §3).
//
// The thermal/engine rig. Chapter 1 asked "is it strong enough?"; Chapter 2 added
// "is it rated for the current?"; Chapter 3 adds the heat axis — "does it make
// power AND stay cool AND not knock?". The player tunes an engine on a dyno and
// reads the trade-offs. Data-driven and primitive-declaring: each setting option
// declares numeric effects the EngineModel reads — no tune hard-codes a verdict.
//
// The four knobs interact, which is the lesson: more compression and advanced
// timing make power but invite knock (detonation), richer mixtures run cooler but
// waste fuel, and cooling caps the safe power. There is a "sweet spot", not a
// single right answer per knob.

// Air–fuel ratio: lean (more air) burns hot and risks knock; rich (more fuel)
// runs cool but fouls and wastes fuel; stoichiometric (~14.7:1) is the balance.
export const AFR_OPTIONS = [
  { id: 'lean', name: 'Lean 16:1', powerFactor: 0.92, heat: 22, knock: 14, foul: -8, note: 'Hot and efficient — but detonation-prone.' },
  { id: 'stoich', name: 'Stoich 14.7:1', powerFactor: 1.0, heat: 8, knock: 4, foul: 0, note: 'Balanced — most power per safe degree.' },
  { id: 'rich', name: 'Rich 12:1', powerFactor: 0.86, heat: -10, knock: -6, foul: 12, note: 'Cool but fouls plugs and wastes fuel.' },
];

// Ignition timing: advancing the spark makes power but raises knock; retarding is
// safe but dumps heat into the exhaust and loses power.
export const TIMING_OPTIONS = [
  { id: 'retarded', name: 'Retarded', powerFactor: 0.85, heat: 14, knock: -8, note: 'Safe from knock, but down on power and runs hot in the pipe.' },
  { id: 'optimal', name: 'Optimal (MBT)', powerFactor: 1.0, heat: 4, knock: 6, note: 'Best torque timing — at the edge of knock.' },
  { id: 'advanced', name: 'Advanced', powerFactor: 1.06, heat: 6, knock: 18, note: 'A little more power, a lot more knock risk.' },
];

// Compression ratio: more compression = more power and efficiency, but needs
// higher-octane fuel or it knocks.
export const COMPRESSION_OPTIONS = [
  { id: 'low', name: '8:1 low', powerFactor: 0.88, heat: 4, knock: -10, needsOctane: 87, note: 'Tolerant of cheap fuel; modest power.' },
  { id: 'mid', name: '10:1 mid', powerFactor: 1.0, heat: 8, knock: 2, needsOctane: 89, note: 'Good all-round.' },
  { id: 'high', name: '12:1 high', powerFactor: 1.12, heat: 14, knock: 16, needsOctane: 93, note: 'Strong power — demands premium fuel.' },
];

export const COOLING_OPTIONS = [
  { id: 'air', name: 'Air-cooled', coolingCapacity: 30, note: 'Light & simple; limited heat rejection.' },
  { id: 'liquid', name: 'Liquid-cooled', coolingCapacity: 52, note: 'Heavier, but holds temperature under load.' },
];

export const FUEL_OPTIONS = [
  { id: 'regular', name: 'Regular 87', octane: 87, note: 'Cheap; knocks in a high-compression engine.' },
  { id: 'premium', name: 'Premium 93', octane: 93, note: 'Resists knock; needed for high compression / advance.' },
];

export const ENGINE_SLOTS = ['afr', 'timing', 'compression', 'cooling', 'fuel'];

export const ENGINE_CATALOG = {
  afr: AFR_OPTIONS,
  timing: TIMING_OPTIONS,
  compression: COMPRESSION_OPTIONS,
  cooling: COOLING_OPTIONS,
  fuel: FUEL_OPTIONS,
};

export const ENGINE_CHALLENGE = {
  id: 'moto_first_tune',
  title: 'Tune the motorcycle engine',
  vehicle: 'Motorcycle',
  goal: 'Tune the engine to make strong power on the dyno WITHOUT knocking or overheating. Match the fuel to the compression, and let cooling cap the heat.',
  predictPrompt: 'Before the dyno pull: will it RUN clean, KNOCK (detonate), OVERHEAT, or FOUL (run rich & weak)?',
  predictOptions: ['runs', 'knock', 'overheat', 'foul'],
  idealSelection: { afr: 'stoich', timing: 'optimal', compression: 'high', cooling: 'liquid', fuel: 'premium' },
  teaches: 'Power, heat and knock trade off. The carry-forward thread becomes "strong enough AND cool enough AND won\'t detonate".',
};

export function engineOptionById(slot, id) {
  return (ENGINE_CATALOG[slot] || []).find((o) => o.id === id) || null;
}

export default { AFR_OPTIONS, TIMING_OPTIONS, COMPRESSION_OPTIONS, COOLING_OPTIONS, FUEL_OPTIONS, ENGINE_SLOTS, ENGINE_CATALOG, ENGINE_CHALLENGE, engineOptionById };
