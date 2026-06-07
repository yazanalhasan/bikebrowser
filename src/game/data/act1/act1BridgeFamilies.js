// act1BridgeFamilies.js — bridge "families" the player chooses BEFORE building.
// Each family teaches a different engineering concept and (eventually) drives a
// distinct assembly layout. Phase 1 ships two playable families:
//   • davinci — self-supporting interlocking-beam arch (NEW mode; highest priority)
//   • truss   — the deck/support/brace/cable/foundation role assembly (existing)
// The other four are declared (so the selector teaches what's coming) but marked
// status:'soon' until their role-variant layouts land.
//
// The structural solver (StructuralModel / ConstructionSystem) stays authoritative
// and material-driven; families only change the player-facing construction layout
// and the `bridgeType` tag carried through to the plan.

export const BRIDGE_FAMILIES = [
  {
    key: 'davinci',
    name: "Da Vinci Self-Supporting Bridge",
    concept: 'Compression · load transfer · geometry — interlocking beams, no nails.',
    status: 'ready',
    mode: 'interlock',
  },
  {
    key: 'truss',
    name: 'Truss Bridge',
    concept: 'Tension · compression · triangles resist, rectangles deform.',
    status: 'ready',
    mode: 'roles',
  },
  {
    key: 'beam',
    name: 'Beam Bridge',
    concept: 'Bending · spans · the simplest deck on two supports.',
    status: 'soon',
    mode: 'roles',
  },
  {
    key: 'arch',
    name: 'Arch Bridge',
    concept: 'Compression carried into the banks along a curve.',
    status: 'soon',
    mode: 'roles',
  },
  {
    key: 'suspension',
    name: 'Suspension Bridge',
    concept: 'Tension cables · tower loads · anchors hold the deck.',
    status: 'soon',
    mode: 'roles',
  },
  {
    key: 'cantilever',
    name: 'Cantilever Bridge',
    concept: 'Balanced arms reach out from each side to meet.',
    status: 'soon',
    mode: 'roles',
  },
];

// Da Vinci reciprocal arch — 7 short beams seated bottom-up. Each slot lists the
// slots that must already hold it up (`supportedBy`); placing a beam whose
// supports are missing is a "floating" member that collapses on test. Geometry is
// owned by the UI; once every beam is seated the chosen wood is load-tested by the
// existing solver (a balsa arch is geometrically sound but still fails under load —
// geometry AND material both matter). Coords are panel/game space (1280x720).
export const DAVINCI_SLOTS = [
  { id: 'base_left', x: 500, y: 407, angle: -45, supportedBy: [], label: 'springer' },
  { id: 'base_right', x: 780, y: 407, angle: 45, supportedBy: [], label: 'springer' },
  { id: 'lower_left', x: 548, y: 350, angle: -30, supportedBy: [0], label: 'course' },
  { id: 'lower_right', x: 732, y: 350, angle: 30, supportedBy: [1], label: 'course' },
  { id: 'mid_left', x: 596, y: 315, angle: -15, supportedBy: [2], label: 'course' },
  { id: 'mid_right', x: 684, y: 315, angle: 15, supportedBy: [3], label: 'course' },
  { id: 'keystone', x: 640, y: 305, angle: 0, supportedBy: [4, 5], label: 'keystone' },
];

// The Da Vinci arch is built from wood. UTM-tested woods the player may use.
export const DAVINCI_WOODS = ['balsa', 'pine', 'bamboo'];

export function getBridgeFamily(key) {
  return BRIDGE_FAMILIES.find((f) => f.key === key) || null;
}
