import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { checkBuild } from '../src/builder/engine.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(readFileSync(join(root, 'data/builder/parts.json'), 'utf8'));
const rules = JSON.parse(readFileSync(join(root, 'data/builder/rules.json'), 'utf8'));
const dirtRules = JSON.parse(readFileSync(join(root, 'data/builder/dirt-rules.json'), 'utf8'));
const kit = JSON.parse(readFileSync(join(root, 'data/builder/bikes/e-dirt-light-bee.json'), 'utf8'));

const ALWAYS = new Set([
  'chain-length-on-bike',
  'tire-clearance-not-checked',
  'brake-cutoff-on-bike',
  'ebike-class-not-checked',
]);

function findings(result, ruleId, severity) {
  return result.findings.filter((finding) => finding.ruleId === ruleId && (!severity || finding.severity === severity));
}

function swap(slots) {
  return { ...kit, slots: { ...kit.slots, ...slots } };
}

test('every dirt rule is checked in with the same text in rules.json', () => {
  const byId = new Map(rules.rules.map((rule) => [rule.id, rule]));
  for (const rule of dirtRules) {
    assert.deepEqual(byId.get(rule.id), rule, rule.id);
  }
});

test('the Light Bee teaching kit has no dirt-rule failures', () => {
  const result = checkBuild(kit, catalog, rules);
  const unexpected = result.findings.filter((finding) => !ALWAYS.has(finding.ruleId));
  assert.deepEqual(unexpected.map((finding) => `${finding.ruleId}:${finding.severity}`), []);
  assert.equal(result.findings.some((finding) => finding.severity === 'incompatible'), false);
  assert.equal(result.findings.some((finding) => finding.severity === 'warning'), false);
  assert.equal(result.verdict, 'cannot_verify');
  for (const rule of dirtRules) {
    assert.equal(findings(result, rule.id).length, 0, rule.id);
  }
});

test('e-dirt mismatches fail one family at a time and blank data does not pass', () => {
  const cases = [
    ['dirt-front-axle-diameter', { front_wheel: 'wheel-stark-front-21' }, 'incompatible'],
    ['dirt-rear-axle-diameter', { rear_wheel: 'wheel-talaria-rear-19' }, 'incompatible'],
    ['dirt-front-hub-width', { front_wheel: 'wheel-stacyc-front-16' }, 'incompatible'],
    ['dirt-rear-hub-width', { rear_wheel: 'wheel-talaria-rear-19' }, 'incompatible'],
    ['dirt-front-rim-size', { front_wheel: 'wheel-stark-front-21' }, 'incompatible'],
    ['dirt-rear-rim-size', { rear_wheel: 'wheel-talaria-rear-19' }, 'incompatible'],
    ['dirt-tire-on-rim', { front_tire: 'tire-stacyc-16' }, 'incompatible'],
    ['dirt-rear-tire-on-rim', { rear_tire: 'tire-stacyc-16' }, 'incompatible'],
    ['dirt-tire-clearance', { rear_tire: 'tire-wide-rear' }, 'incompatible'],
    ['dirt-chain-pitch-front', { chain: 'chain-pitch-520' }, 'incompatible'],
    ['dirt-chain-pitch-rear', { chain: 'chain-pitch-520' }, 'incompatible'],
    ['dirt-rear-sprocket-bolt', { rear_sprocket: 'sprocket-talaria-rear' }, 'incompatible'],
    ['dirt-countershaft-spline', { countershaft_sprocket: 'sprocket-wrong-spline' }, 'incompatible'],
    ['dirt-chainline', { rear_sprocket: 'sprocket-chainline-off' }, 'warning'],
    ['dirt-primary-drive', { primary: 'primary-chain' }, 'incompatible'],
    ['dirt-phase-connector', { controller: 'controller-stark-varg' }, 'incompatible'],
    ['dirt-hall-connector', { controller: 'controller-stark-varg' }, 'incompatible'],
    ['dirt-firmware-family', { motor: 'motor-stark-varg', controller: 'controller-locked-other', battery: 'battery-stark-360', charger: 'charger-surron-60' }, 'incompatible'],
    ['dirt-peak-current', { controller: 'controller-surron-soft' }, 'warning'],
    ['dirt-battery-bay', { battery: 'battery-surron-too-big' }, 'incompatible'],
    ['dirt-charger-voltage', { charger: 'charger-36' }, 'incompatible'],
    ['dirt-charger-connector', { charger: 'charger-36' }, 'incompatible'],
    ['dirt-charger-chemistry', { charger: 'charger-lfp-60' }, 'incompatible'],
    ['dirt-front-rotor-size', { front_rotor: 'rotor-oversize-270' }, 'incompatible'],
    ['dirt-rear-rotor-size', { rear_rotor: 'rotor-oversize-270' }, 'incompatible'],
    ['dirt-front-rotor-mount', { front_rotor: 'dirt-rotor-centerlock-203' }, 'incompatible'],
    ['dirt-rear-rotor-mount', { rear_rotor: 'dirt-rotor-centerlock-203' }, 'incompatible'],
    ['dirt-front-caliper-mount', { front_caliper: 'caliper-mineral-radial', rear_caliper: 'caliper-mineral-radial' }, 'warning'],
    ['dirt-rear-caliper-mount', { front_caliper: 'caliper-mineral-radial', rear_caliper: 'caliper-mineral-radial' }, 'warning'],
    ['dirt-brake-fluid-pair', { front_caliper: 'caliper-mineral-radial' }, 'incompatible'],
    ['dirt-fork-travel', { fork: 'fork-long' }, 'incompatible'],
    ['dirt-fork-axle', { fork: 'fork-axle-17' }, 'incompatible'],
    ['dirt-steerer', { stem: 'stem-other' }, 'incompatible'],
    ['dirt-triple-offset', { fork: 'fork-offset-only' }, 'warning'],
    ['dirt-bar-clamp', { handlebar: 'bar-22-2' }, 'incompatible'],
    ['dirt-shock-eye', { shock: 'shock-wrong-length' }, 'incompatible'],
    ['dirt-shock-stroke', { shock: 'shock-stroke-only' }, 'incompatible'],
    ['dirt-shock-mount', { shock: 'shock-mount-only' }, 'incompatible'],
    ['dirt-footpeg-mount', { footpeg: 'peg-talaria' }, 'incompatible'],
    ['dirt-dcdc-input', { dc_dc: 'dcdc-36-12' }, 'incompatible'],
    ['dirt-dcdc-light', { light: 'light-6v-julet' }, 'incompatible'],
  ];
  for (const [ruleId, slots, severity] of cases) {
    const result = checkBuild(swap(slots), catalog, rules);
    assert.equal(findings(result, ruleId, severity).length, 1, ruleId);
  }

  const blank = checkBuild(swap({ front_wheel: 'wheel-blank-axle' }), catalog, rules);
  assert.equal(findings(blank, 'dirt-front-axle-diameter', 'cannot_verify').length, 1);
  assert.equal(findings(blank, 'dirt-front-axle-diameter', 'incompatible').length, 0);

  const heavy = checkBuild({ ...kit, riderWeightKg: 120 }, catalog, rules);
  assert.equal(findings(heavy, 'dirt-spring-rider-weight', 'warning').length, 1);
  const quiet = checkBuild(kit, catalog, rules);
  assert.equal(findings(quiet, 'dirt-spring-rider-weight').length, 0);

  const kids = checkBuild(swap({
    frame: 'frame-stacyc-16',
    motor: 'motor-kids-too-strong',
    front_wheel: 'wheel-surron-front-19',
  }), catalog, rules);
  assert.equal(findings(kids, 'dirt-power-class', 'warning').length, 1);
  assert.equal(findings(kids, 'dirt-age-wheel', 'warning').length, 1);
});
