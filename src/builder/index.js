/**
 * Bike Builder public entry.
 *
 * Game hook: a future Zuzu's garage quest can import this module and call
 * checkBuild(build, catalog, rules). There is no React and no DOM here.
 * Phase 1 does not call the engine from the game.
 */
export { checkBuild, classifyCandidates, filterCandidates } from './engine.js';
export { gearRange, formatGear, WHEEL_SIZES } from './gearMath.js';
export {
  ACTUATION_FAMILIES,
  SLOTS,
  categoryForSlot,
  canonicalActuation,
  describeActuation,
} from './standards.js';
export { presentFinding, presentPartSource, isAllowedSourceUrl } from './present.js';
