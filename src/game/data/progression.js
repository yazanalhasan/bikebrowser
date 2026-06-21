// progression.js — the canonical game spine (arc.md §3).
//
// This is the SINGLE SOURCE OF TRUTH for the whole game's shape: three acts
// grouped by the medium the vehicle operates in, over a seven-rung vehicle
// ladder. Each chapter adds exactly ONE new engineering domain and ONE new
// biological domain on top of everything before it (both spines are
// cumulative — nothing is discarded between rungs). The vehicle is the literal
// transportation key that gates map reach (§5).
//
// arc.md is the north star; this file is its machine-readable projection. It is
// pure data — primitive-declaring and portable (§8). Scenes/systems read it;
// nothing here imports a scene. Chapter 1 (Bike / Sonoran Desert) is the
// SHIPPED foundation; Chapters 2–7 are SCAFFOLDED — their domain, rig, reach,
// region, and curriculum are canon and navigable, with playable content built
// out one vertical slice at a time (carry-forward discipline, §4).
//
// status: 'shipped'   — fully playable now.
//         'scaffold'  — canonical + navigable + next in line to build.
//         'locked'    — canonical, gated behind earlier chapters.

export const ACTS = [
  {
    id: 'act1',
    num: 1,
    title: 'Act 1 — Ground',
    medium: 'ground',
    chapters: [1, 2, 3, 4],
    setting: 'Begins in the Sonoran Desert and expands overland across connected Earth land regions as the ground vehicle improves.',
  },
  {
    id: 'act2',
    num: 2,
    title: 'Act 2 — Sea & Air',
    medium: 'sea-air',
    chapters: [5, 6],
    setting: 'Unlocks the ocean/coastal and intercontinental regions ground vehicles cannot reach; spacecraft subsystem groundwork begins here.',
  },
  {
    id: 'act3',
    num: 3,
    title: 'Act 3 — Space',
    medium: 'space',
    chapters: [7],
    setting: 'Spacecraft completion plus terraforming and life-engineering on the alien planet.',
  },
];

// The seven-rung ladder. Each entry fuses the mechanical spine (§3 vehicle
// table) and the parallel biological spine (§3 biology table) for the same rung.
export const CHAPTERS = [
  {
    num: 1,
    actId: 'act1',
    status: 'shipped',
    vehicle: 'Bike',
    engineeringDomain: 'Pure mechanics: structure, gears, chain, brakes, torque, friction',
    rig: 'UTM (tension / compression)',
    bioDomain: 'Ecology',
    bioQuestion: 'Why does this organism survive here and fail elsewhere?',
    region: 'Sonoran Desert',
    reach: 'Neighborhood / local desert',
    summary: 'Repair and rebuild the bike. Learn structure, materials and the UTM by reconnecting the wash crossing, then ride the neighborhood and skate park.',
    entry: { type: 'scene', event: null, target: 'NeighborhoodScene' },
  },
  {
    num: 2,
    actId: 'act1',
    status: 'scaffold',
    vehicle: 'E-bike',
    engineeringDomain: 'Electrical: battery, motor, controller, circuits, charging, regen braking, energy storage',
    rig: 'Circuit + battery rig',
    bioDomain: 'Ethnobotany',
    bioQuestion: 'How do humans turn a plant into food, fiber, dye, medicine, fuel?',
    region: 'Extended local desert & first town',
    reach: 'Extended local range',
    summary: 'Electrify the bike. The new Circuit Bench joins the carry-forward toolset; the Extraction Bench opens the biology workbench to human plant-use.',
    entry: { type: 'preview', event: null, target: null },
  },
  {
    num: 3,
    actId: 'act1',
    status: 'locked',
    vehicle: 'Motorcycle',
    engineeringDomain: 'Combustion powertrain: engine, fuel, ignition, transmission, cooling, exhaust',
    rig: 'Engine / thermal dyno',
    bioDomain: 'Phytochemistry',
    bioQuestion: 'What molecules are inside a plant, and why does extraction method change the outcome?',
    region: 'First regional roads',
    reach: 'First regional roads',
    summary: 'Build a combustion powertrain and read its thermal dyno. Phytochemistry explains why the extraction method from Chapter 2 changes the result.',
    entry: { type: 'preview', event: null, target: null },
  },
  {
    num: 4,
    actId: 'act1',
    status: 'locked',
    vehicle: 'Car',
    engineeringDomain: 'Systems integration & scale: chassis, drivetrain, steering geometry, safety/crash, HVAC, load distribution',
    rig: 'Crash / load + systems test',
    bioDomain: 'Cellular Biology',
    bioQuestion: 'What are living systems made of at the cell scale, and why does this soil/tissue support life?',
    region: 'Connected land regions',
    reach: 'Overland cross-country',
    summary: 'Integrate every prior system at scale into a car. The Microscope opens cellular biology — what living systems are made of.',
    entry: { type: 'preview', event: null, target: null },
  },
  {
    num: 5,
    actId: 'act2',
    status: 'locked',
    vehicle: 'Boat',
    engineeringDomain: 'Fluid dynamics & buoyancy: hull, displacement, hydrodynamics, marine propulsion, salt corrosion, ballast/stability',
    rig: 'Buoyancy / hydro tank',
    bioDomain: 'Microbiology',
    bioQuestion: 'Why does fermentation work, and how do microbes change ecosystems?',
    region: 'Ocean & coastal regions',
    reach: 'Ocean & coastal regions',
    summary: 'Cross water. The buoyancy/hydro tank joins the rigs; the Fermentation Bench opens microbiology and how microbes reshape ecosystems.',
    entry: { type: 'preview', event: null, target: null },
  },
  {
    num: 6,
    actId: 'act2',
    status: 'locked',
    vehicle: 'Plane',
    engineeringDomain: 'Aerodynamics & flight: lift/drag/thrust/weight, airfoils, control surfaces, strength-to-weight, fatigue, pressurization',
    rig: 'Wind tunnel',
    bioDomain: 'Molecular Biology',
    bioQuestion: 'What mechanism (DNA / RNA / protein / enzyme) explains this observation?',
    region: 'Intercontinental / isolated highlands',
    reach: 'Intercontinental / isolated highlands',
    summary: 'Fly. The wind tunnel teaches strength-to-weight; molecular biology explains the mechanism behind the remedies of earlier chapters.',
    entry: { type: 'preview', event: null, target: null },
  },
  {
    num: 7,
    actId: 'act3',
    status: 'locked',
    vehicle: 'Spacecraft',
    engineeringDomain: 'Vacuum & extremes: reaction propulsion, re-entry/cryo thermal, life support, redundancy, materials certification',
    rig: 'Vacuum / re-entry chamber',
    bioDomain: 'Systems Biology & Life Engineering',
    bioQuestion: 'What happens to the whole system if I change one part — and should I?',
    region: 'Alien planet',
    reach: 'Leave Earth → alien planet',
    summary: 'Leave Earth. The vacuum/re-entry chamber certifies materials and life support; systems biology drives terraforming and life-engineering.',
    entry: { type: 'preview', event: null, target: null },
  },
];

export function chapter(num) {
  return CHAPTERS.find((c) => c.num === num) || null;
}

export function act(actId) {
  return ACTS.find((a) => a.id === actId) || null;
}

export function chaptersOfAct(actId) {
  return CHAPTERS.filter((c) => c.actId === actId);
}

// A 'strength-to-weight / safety-factor' thread runs through every rung (§3):
// the bike asks "is this beam strong enough?"; the plane and spacecraft ask
// "strong enough AND light enough AND redundant enough?". Exposed so chapter
// UIs and the carry-forward rigs can surface the same through-line.
export const SAFETY_FACTOR_THREAD =
  'Is it strong enough? — and, by the upper rungs, strong enough AND light enough AND redundant enough?';

export default { ACTS, CHAPTERS, chapter, act, chaptersOfAct, SAFETY_FACTOR_THREAD };
