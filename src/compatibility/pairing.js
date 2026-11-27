/**
 * Pair e-bike compatibility rules with the parts they actually compare.
 *
 * The previous engine called every rule as check(battery, controller) OR
 * check(motor, controller). A voltage rule could then see the motor, and a
 * motor-power rule could see the battery. Each rule now names its pair.
 */

export function selectRuleInputs(pair, items) {
  const list = Array.isArray(items) ? items : [];
  const find = (category) => list.find((item) => item && item.category === category);
  if (pair === 'motor-controller') {
    return { a: find('motor'), b: find('controller'), pair };
  }
  if (pair === 'battery-controller') {
    return { a: find('battery'), b: find('controller'), pair };
  }
  return { a: undefined, b: undefined, pair: pair || 'unknown' };
}
