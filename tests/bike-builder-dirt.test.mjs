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
const gasKit = JSON.parse(readFileSync(join(root, 'data/builder/bikes/dirt-ktm-sx-125.json'), 'utf8'));

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

function gasSwap(slots) {
  return { ...gasKit, slots: { ...gasKit.slots, ...slots } };
}

test('the SX 125 teaching kit has no dirt-rule failures', () => {
  const result = checkBuild(gasKit, catalog, rules);
  const allowed = new Set(['chain-length-on-bike', 'tire-clearance-not-checked']);
  const unexpected = result.findings.filter((finding) => !allowed.has(finding.ruleId));
  assert.deepEqual(unexpected.map((finding) => `${finding.ruleId}:${finding.severity}`), []);
  assert.equal(result.findings.some((finding) => finding.severity === 'incompatible'), false);
  assert.equal(result.findings.some((finding) => finding.severity === 'warning'), false);
  assert.equal(result.verdict, 'cannot_verify');
});

test('gas dirt mismatches cover engine, years, fuel, and the shared wheel rules', () => {
  const cases = [
    ['dirt-engine-family', { engine: 'engine-honda-crf250f' }, 'incompatible'],
    ['dirt-engine-displacement', { engine: 'engine-honda-crf250f' }, 'incompatible'],
    ['dirt-engine-years', { engine: 'engine-ktm-sx-125-2016' }, 'incompatible'],
    ['dirt-engine-spline', { countershaft_sprocket: 'sprocket-honda-cs' }, 'incompatible'],
    ['dirt-intake-family', { intake: 'intake-ktm-sx-efi', frame: 'frame-honda-crf250f' }, 'incompatible'],
    ['dirt-intake-induction', { intake: 'intake-ktm-sx-efi' }, 'incompatible'],
    ['dirt-intake-years', { intake: 'intake-ktm-sx-2016' }, 'incompatible'],
    ['dirt-exhaust-family', { exhaust: 'exhaust-honda-crf' }, 'incompatible'],
    ['dirt-exhaust-years', { exhaust: 'exhaust-ktm-sx-2016' }, 'incompatible'],
    ['dirt-plastics-family', { plastics: 'plastics-honda-crf' }, 'incompatible'],
    ['dirt-plastics-years', { plastics: 'plastics-ktm-sx-2024' }, 'incompatible'],
    ['dirt-air-filter', { air_filter: 'filter-honda-crf' }, 'incompatible'],
    ['dirt-plug-thread', { spark_plug: 'plug-short-reach', engine: 'engine-honda-crf250f' }, 'incompatible'],
    ['dirt-plug-reach', { spark_plug: 'plug-short-reach' }, 'incompatible'],
    ['dirt-plug-heat', { spark_plug: 'plug-br7' }, 'warning'],
    ['dirt-fuel-stroke', { fuel: 'fuel-gasoline-10w40' }, 'incompatible'],
    ['dirt-premix-ratio', { fuel: 'fuel-premix-40' }, 'incompatible'],
    ['dirt-oil-spec', { engine: 'engine-honda-crf250f', fuel: 'fuel-gasoline-10w50' }, 'incompatible'],
    ['dirt-chain-pitch-front', { chain: 'chain-pitch-420' }, 'incompatible'],
    ['dirt-front-axle-diameter', { front_wheel: 'wheel-surron-front-19' }, 'incompatible'],
    ['dirt-bar-clamp', { handlebar: 'bar-fat-28-6' }, 'incompatible'],
  ];
  for (const [ruleId, slots, severity] of cases) {
    const result = checkBuild(gasSwap(slots), catalog, rules);
    assert.equal(findings(result, ruleId, severity).length, 1, ruleId);
  }

  const premixOnFourStroke = checkBuild(gasSwap({
    engine: 'engine-honda-crf250f',
    fuel: 'fuel-premix-32',
  }), catalog, rules);
  assert.equal(findings(premixOnFourStroke, 'dirt-fuel-stroke', 'incompatible').length, 1);

  const blankPipe = checkBuild(gasSwap({ exhaust: 'exhaust-year-blank' }), catalog, rules);
  assert.equal(findings(blankPipe, 'dirt-exhaust-years', 'cannot_verify').length, 1);
  assert.equal(findings(blankPipe, 'dirt-exhaust-years', 'incompatible').length, 0);

  const blankFrameYear = checkBuild(gasSwap({ frame: 'frame-ktm-sx-125-year-blank' }), catalog, rules);
  assert.equal(findings(blankFrameYear, 'dirt-exhaust-years', 'cannot_verify').length, 1);
  assert.equal(findings(blankFrameYear, 'dirt-plastics-years', 'cannot_verify').length, 1);
  assert.equal(findings(blankFrameYear, 'dirt-engine-years', 'cannot_verify').length, 1);
  assert.equal(findings(blankFrameYear, 'dirt-exhaust-years', 'incompatible').length, 0);
});
