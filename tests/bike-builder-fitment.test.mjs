import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { checkBuild, filterCandidates } from '../src/builder/engine.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(readFileSync(join(root, 'data/builder/parts.json'), 'utf8'));
const rules = JSON.parse(readFileSync(join(root, 'data/builder/rules.json'), 'utf8'));
const midDrive = JSON.parse(readFileSync(join(root, 'data/builder/bikes/mid-drive-48.json'), 'utf8'));
const hubMotor = JSON.parse(readFileSync(join(root, 'data/builder/bikes/hub-motor-48.json'), 'utf8'));

function findings(result, ruleId, severity) {
  return result.findings.filter((finding) => finding.ruleId === ruleId && (!severity || finding.severity === severity));
}

function withSlots(base, slots) {
  return { ...base, slots: { ...base.slots, ...slots } };
}

test('a 48 V mid-drive kit has no incompatible or warning fitment', () => {
  const result = checkBuild(midDrive, catalog, rules);
  assert.equal(findings(result, 'mid-drive-bb-shell', 'incompatible').length, 0);
  assert.equal(findings(result, 'battery-controller-voltage', 'incompatible').length, 0);
  assert.equal(findings(result, 'motor-controller-voltage', 'incompatible').length, 0);
  assert.equal(findings(result, 'battery-connector', 'incompatible').length, 0);
  assert.equal(findings(result, 'motor-controller-protocol', 'incompatible').length, 0);
  assert.equal(result.findings.some((finding) => finding.severity === 'incompatible'), false);
  assert.equal(result.findings.some((finding) => finding.severity === 'warning'), false);
  assert.equal(result.verdict, 'cannot_verify');
});

test('a 48 V hub-motor kit matches the axle, cassette, voltage, and torque arm', () => {
  const result = checkBuild(hubMotor, catalog, rules);
  assert.equal(result.findings.some((finding) => finding.severity === 'incompatible'), false);
  assert.equal(findings(result, 'torque-arm-for-hub-motor', 'warning').length, 0);
  assert.equal(findings(result, 'rear-axle-match', 'incompatible').length, 0);
  assert.equal(findings(result, 'cassette-freehub-driver', 'incompatible').length, 0);
});

test('a 105 road group matches BB86, 24 mm spindle, and 12x142', () => {
  const result = checkBuild({
    bikeType: 'road',
    wheelSize: '700c',
    slots: {
      frame: 'frame-road-flat-160',
      hub: 'hub-hg-l-centerlock',
      cassette: 'cassette-shimano-r7000-11-28',
      chain: 'chain-shimano-hg-11',
      rear_derailleur: 'shimano-rd-r7000-ss',
      shifter: 'shifter-shimano-105-r7000',
      crankset: 'crank-shimano-105-50-34',
      bottom_bracket: 'bb-bb86-shimano-24',
      front_derailleur: 'fd-shimano-r7000',
      front_hub: 'front-hub-12x100',
      headset: 'headset-integrated-is42',
      seatpost: 'seatpost-27-2',
    },
  }, catalog, rules);
  assert.equal(result.findings.some((finding) => finding.severity === 'incompatible'), false);
  assert.equal(findings(result, 'bottom-bracket-shell').length, 0);
  assert.equal(findings(result, 'bottom-bracket-spindle').length, 0);
  assert.equal(findings(result, 'rear-axle-match').length, 0);
});

test('36 V battery and 36 V motor do not fit a 48 V controller', () => {
  const result = checkBuild(withSlots(midDrive, {
    motor: 'motor-bbs02-36',
    battery: 'battery-36-xt60',
    controller: 'controller-48-uart-xt60',
  }), catalog, rules);
  assert.equal(findings(result, 'battery-controller-voltage', 'incompatible').length, 1);
  assert.equal(findings(result, 'motor-controller-voltage', 'incompatible').length, 1);
});

test('a 52 V pack does not pass on a 48 V-only controller', () => {
  const result = checkBuild(withSlots(midDrive, { battery: 'battery-52-xt60' }), catalog, rules);
  assert.equal(findings(result, 'battery-controller-voltage', 'incompatible').length, 1);
});

test('XT90 and XT60 plugs do not pass', () => {
  const result = checkBuild(withSlots(midDrive, { battery: 'battery-48-xt90' }), catalog, rules);
  assert.equal(findings(result, 'battery-connector', 'incompatible').length, 1);
});

test('UART and CAN do not talk', () => {
  const result = checkBuild(withSlots(midDrive, { controller: 'controller-48-can-xt60', display: 'display-uart' }), catalog, rules);
  assert.equal(findings(result, 'motor-controller-protocol', 'incompatible').length, 1);
  assert.equal(findings(result, 'display-protocol', 'incompatible').length, 1);
});

test('a BSA mid-drive does not fit a PF30 shell or a 100 mm motor on a 73 mm shell', () => {
  const pressfit = checkBuild(withSlots(midDrive, { frame: 'frame-pf30-135' }), catalog, rules);
  assert.equal(findings(pressfit, 'mid-drive-bb-shell', 'incompatible').length, 1);
  const wide = checkBuild(withSlots(midDrive, { motor: 'motor-bbshd-100' }), catalog, rules);
  assert.equal(findings(wide, 'mid-drive-bb-width', 'incompatible').length, 1);
  const fitsWide = checkBuild(withSlots(midDrive, { motor: 'motor-bbshd-100', frame: 'frame-bb100' }), catalog, rules);
  assert.equal(findings(fitsWide, 'mid-drive-bb-width', 'incompatible').length, 0);
  assert.equal(findings(fitsWide, 'mid-drive-bb-shell', 'incompatible').length, 0);
});

test('a mid-drive cannot keep a separate crank or bottom bracket', () => {
  const result = checkBuild(withSlots(midDrive, {
    crankset: 'crank-1x-32',
    bottom_bracket: 'bb-bsa-shimano-24',
  }), catalog, rules);
  assert.equal(findings(result, 'mid-drive-replaces-crank', 'incompatible').length, 1);
  assert.equal(findings(result, 'mid-drive-no-separate-bb', 'incompatible').length, 1);
});

test('a 135 mm hub motor does not fit a Boost frame, and a second hub conflicts', () => {
  const boost = checkBuild(withSlots(hubMotor, { frame: 'frame-mtb-udh-post-203' }), catalog, rules);
  assert.equal(findings(boost, 'rear-axle-match', 'incompatible').length, 1);
  const doubled = checkBuild(withSlots(hubMotor, { hub: 'hub-hg-m-6bolt' }), catalog, rules);
  assert.equal(findings(doubled, 'hub-motor-replaces-hub', 'incompatible').length, 1);
});

test('a hub motor without a torque arm is a warning', () => {
  const slots = { ...hubMotor.slots };
  delete slots.torque_arm;
  const result = checkBuild({ ...hubMotor, slots }, catalog, rules);
  assert.equal(findings(result, 'torque-arm-for-hub-motor', 'warning').length, 1);
  assert.match(findings(result, 'torque-arm-for-hub-motor')[0].messageKid, /torque arm/i);
});

test('a single-sprocket hub motor rejects a cassette and does not require a shifter', () => {
  const result = checkBuild({
    bikeType: 'conversion-hub',
    wheelSize: '26',
    slots: {
      frame: 'frame-mtb-standard-post-180',
      motor: 'motor-hub-single-135',
      chain: 'chain-shimano-hg-9',
      crankset: 'crank-1x-32',
      bottom_bracket: 'bb-bsa-shimano-24',
      battery: 'battery-48-xt60',
      controller: 'controller-48-uart-xt60',
      torque_arm: 'torque-arm-qr-135',
    },
  }, catalog, rules);
  assert.equal(findings(result, 'single-speed-hub-no-cassette').length, 0);
  assert.equal(result.findings.some((finding) => finding.ruleId === 'slot-empty-shifter'), false);
  const withCassette = checkBuild({
    bikeType: 'conversion-hub',
    slots: {
      frame: 'frame-mtb-standard-post-180',
      motor: 'motor-hub-single-135',
      cassette: 'cassette-shimano-hg400-9-11-36',
      chain: 'chain-shimano-hg-9',
    },
  }, catalog, rules);
  assert.equal(findings(withCassette, 'single-speed-hub-no-cassette', 'incompatible').length, 1);
});

test('DUB crank does not pass in a 24 mm bottom bracket', () => {
  const result = checkBuild({
    bikeType: 'mountain',
    slots: {
      frame: 'frame-mtb-udh-post-203',
      crankset: 'crank-sram-gx-32',
      bottom_bracket: 'bb-bsa-shimano-24',
      hub: 'hub-xd-6bolt',
    },
  }, catalog, rules);
  assert.equal(findings(result, 'bottom-bracket-spindle', 'incompatible').length, 1);
});

test('DUB crank, DUB bottom bracket, and BSA boost frame agree', () => {
  const result = checkBuild({
    bikeType: 'mountain',
    wheelSize: '29',
    slots: {
      frame: 'frame-mtb-udh-post-203',
      hub: 'hub-xd-6bolt',
      cassette: 'cassette-sram-gx-10-52',
      chain: 'chain-sram-eagle-12',
      rear_derailleur: 'sram-rd-gx-eagle',
      shifter: 'shifter-sram-gx-eagle',
      crankset: 'crank-sram-gx-32',
      bottom_bracket: 'bb-bsa-dub',
      front_hub: 'front-hub-15x110',
      headset: 'headset-zs44-ec44',
      seatpost: 'seatpost-31-6',
    },
  }, catalog, rules);
  assert.equal(result.findings.some((finding) => finding.severity === 'incompatible'), false);
});

test('seatpost and headset mismatches are caught, and a smaller post is a shim warning', () => {
  const tooBig = checkBuild({
    bikeType: 'road',
    slots: { frame: 'frame-road-flat-160', seatpost: 'seatpost-31-6', headset: 'headset-zs44-ec44' },
  }, catalog, rules);
  assert.equal(findings(tooBig, 'seatpost-too-large', 'incompatible').length, 1);
  assert.equal(findings(tooBig, 'headset-standard', 'incompatible').length, 1);
  const shim = checkBuild({
    bikeType: 'mountain',
    slots: { frame: 'frame-mtb-standard-post-180', seatpost: 'seatpost-27-2' },
  }, catalog, rules);
  assert.equal(findings(shim, 'seatpost-needs-shim', 'warning').length, 1);
  assert.equal(findings(shim, 'seatpost-too-large').length, 0);
});

test('front axle mismatch is incompatible', () => {
  const result = checkBuild({
    bikeType: 'mountain',
    slots: { frame: 'frame-mtb-standard-post-180', front_hub: 'front-hub-15x110' },
  }, catalog, rules);
  assert.equal(findings(result, 'front-axle-match', 'incompatible').length, 1);
});

test('a weak battery current does not pass, and a small controller warns', () => {
  const current = checkBuild(withSlots(midDrive, { controller: 'controller-48-uart-xt90' }), catalog, rules);
  assert.equal(findings(current, 'battery-current-covers-controller', 'incompatible').length, 1);
  const power = checkBuild(withSlots(hubMotor, { motor: 'motor-hub-direct-135', controller: 'controller-tongsheng-48' }), catalog, rules);
  assert.equal(findings(power, 'controller-power-vs-motor', 'warning').length, 1);
  assert.equal(findings(power, 'motor-controller-protocol', 'incompatible').length, 1);
});

test('Boost frames hide quick-release hubs from the fitting list', () => {
  const build = { bikeType: 'mountain', slots: { frame: 'frame-mtb-udh-post-203' } };
  const fits = filterCandidates('hub', build, catalog, rules);
  const ids = fits.map((part) => part.id);
  assert.equal(ids.includes('hub-hg-m-6bolt'), false);
  assert.ok(ids.includes('hub-xd-6bolt'));
  assert.ok(ids.includes('hub-microspline-centerlock'));
});

test('Tongsheng motor only matches the Tongsheng controller', () => {
  const mismatch = checkBuild(withSlots(midDrive, { motor: 'motor-tsdz2-48' }), catalog, rules);
  assert.equal(findings(mismatch, 'motor-controller-protocol', 'incompatible').length, 1);
  const match = checkBuild(withSlots(midDrive, {
    motor: 'motor-tsdz2-48',
    controller: 'controller-tongsheng-48',
    display: 'display-tongsheng',
  }), catalog, rules);
  assert.equal(findings(match, 'motor-controller-protocol', 'incompatible').length, 0);
  assert.equal(findings(match, 'display-protocol', 'incompatible').length, 0);
  assert.equal(findings(match, 'mid-drive-bb-shell', 'incompatible').length, 0);
});
