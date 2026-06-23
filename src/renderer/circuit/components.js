// E-bike powertrain components (data-driven, like the UTM materials). Resistances
// match the prompt's electricalComponents config; lower load R = heavier demand.
export const BATTERIES = [
  { id: 'b36', name: '36V Battery', slot: 'battery', voltage: 36, R: 0.20, color: '#15803D' },
  { id: 'b48', name: '48V Battery', slot: 'battery', voltage: 48, R: 0.15, color: '#16A34A' },
  { id: 'b52', name: '52V Battery', slot: 'battery', voltage: 52, R: 0.12, color: '#22C55E' },
];
export const CONTROLLERS = [
  { id: 'c15', name: '15A Controller', slot: 'controller', R: 0.05, currentLimit: 15, color: '#2563EB' },
  { id: 'c25', name: '25A Controller', slot: 'controller', R: 0.04, currentLimit: 25, color: '#3B82F6' },
  { id: 'c40', name: '40A Controller', slot: 'controller', R: 0.03, currentLimit: 40, color: '#60A5FA' },
];
export const MOTORS = [
  { id: 'm250', name: '250W Hub Motor', slot: 'motor', winding: 0.8, rated: 250, color: '#9333EA' },
  { id: 'm500', name: '500W Hub Motor', slot: 'motor', winding: 0.45, rated: 500, color: '#A855F7' },
  { id: 'm750', name: '750W Hub Motor', slot: 'motor', winding: 0.22, rated: 750, color: '#C084FC' },
];
// Lower R = heavier road demand = more current. Tuned so swapping components can
// reach all three insight states (well-matched / current-limited / over-driven).
export const LOADS = [
  { id: 'flat', name: 'Flat Road', slot: 'load', R: 8, color: '#64748B' },
  { id: 'rolling', name: 'Rolling Hills', slot: 'load', R: 3, color: '#D97706' },
  { id: 'steep', name: 'Steep Climb', slot: 'load', R: 1.2, color: '#DC2626' },
];

export const SLOT_OPTIONS = { battery: BATTERIES, controller: CONTROLLERS, motor: MOTORS, load: LOADS };
export const DEFAULT_CIRCUIT = { battery: 'b48', controller: 'c25', motor: 'm500', load: 'flat' };
export const findComponent = (slot, id) => SLOT_OPTIONS[slot].find((c) => c.id === id) || SLOT_OPTIONS[slot][0];
