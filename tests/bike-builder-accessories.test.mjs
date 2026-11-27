import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { checkBuild } from '../src/builder/engine.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(readFileSync(join(root, 'data/builder/parts.json'), 'utf8'));
const rules = JSON.parse(readFileSync(join(root, 'data/builder/rules.json'), 'utf8'));
const midDrive = JSON.parse(readFileSync(join(root, 'data/builder/bikes/mid-drive-48.json'), 'utf8'));
const parts = catalog.parts;

function findings(result, ruleId, severity) {
  return result.findings.filter((finding) => finding.ruleId === ruleId && (!severity || finding.severity === severity));
}

function swap(slots) {
  return checkBuild({ ...midDrive, slots: { ...midDrive.slots, ...slots } }, catalog, rules);
}

test('each accessory family has at least ten types', () => {
  const counts = {};
  for (const part of parts) counts[part.category] = (counts[part.category] || 0) + 1;
  for (const category of ['throttle', 'display', 'controller', 'motor', 'pas', 'brake_sensor', 'speed_sensor', 'light']) {
    assert.ok(counts[category] >= 10, `${category} has ${counts[category]}`);
  }
});

test('the mid-drive kit throttle, display, PAS, brake switch, speed sensor, and light agree', () => {
  const result = checkBuild(midDrive, catalog, rules);
  for (const ruleId of [
    'throttle-signal', 'throttle-connector', 'throttle-protocol',
    'display-protocol', 'display-connector',
    'pas-kind', 'pas-magnets', 'pas-connector',
    'brake-sensor-logic', 'brake-sensor-connector',
    'speed-sensor-type', 'speed-sensor-connector',
    'light-voltage', 'light-connector',
  ]) {
    assert.equal(findings(result, ruleId, 'incompatible').length, 0, ruleId);
  }
  assert.equal(result.findings.some((finding) => finding.severity === 'incompatible'), false);
});

test('hall versus potentiometer, and the plug, decide a throttle', () => {
  const pot = swap({ throttle: 'throttle-pot-twist-sm' });
  assert.equal(findings(pot, 'throttle-signal', 'incompatible').length, 1);
  const canPlug = swap({ throttle: 'throttle-hall-thumb-can' });
  assert.equal(findings(canPlug, 'throttle-signal', 'incompatible').length, 0);
  assert.equal(findings(canPlug, 'throttle-connector', 'incompatible').length, 1);
  const bus = swap({ throttle: 'throttle-uart-bus' });
  assert.equal(findings(bus, 'throttle-protocol', 'incompatible').length, 1);
  const sameShape = swap({ throttle: 'throttle-hall-twist-julet' });
  assert.equal(findings(sameShape, 'throttle-signal', 'incompatible').length, 0);
  assert.equal(findings(sameShape, 'throttle-connector', 'incompatible').length, 0);
  assert.equal(findings(sameShape, 'throttle-protocol', 'incompatible').length, 0);
});

test('a KT throttle fits a KT controller and not a Bafang UART controller', () => {
  const onUart = swap({ throttle: 'throttle-hall-thumb-kt' });
  assert.equal(findings(onUart, 'throttle-connector', 'incompatible').length, 1);
  const onKt = swap({
    throttle: 'throttle-hall-thumb-kt',
    controller: 'controller-kt-48',
    display: 'display-kt-lcd8',
    motor: 'motor-hub-kt-48',
    pas: 'pas-12-kt',
    brake_sensor: 'brake-sensor-no-kt',
    speed_sensor: 'speed-kt',
    light: 'light-6v-kt',
  });
  assert.equal(findings(onKt, 'throttle-connector', 'incompatible').length, 0);
  assert.equal(findings(onKt, 'display-protocol', 'incompatible').length, 0);
  assert.equal(findings(onKt, 'motor-controller-protocol', 'incompatible').length, 0);
});

test('a display needs both the protocol and the plug', () => {
  const wrongPlug = swap({ display: 'display-uart-sm' });
  assert.equal(findings(wrongPlug, 'display-protocol', 'incompatible').length, 0);
  assert.equal(findings(wrongPlug, 'display-connector', 'incompatible').length, 1);
  const wrongLanguage = swap({ display: 'display-kt-lcd3' });
  assert.equal(findings(wrongLanguage, 'display-protocol', 'incompatible').length, 1);
});

test('PAS magnet count and a torque sensor are different checks', () => {
  const five = swap({ pas: 'pas-5-julet' });
  assert.equal(findings(five, 'pas-magnets', 'incompatible').length, 1);
  const twelve = swap({ pas: 'pas-12-julet' });
  assert.equal(findings(twelve, 'pas-magnets', 'incompatible').length, 0);
  const torqueOnUart = swap({ pas: 'pas-torque-tongsheng' });
  assert.equal(findings(torqueOnUart, 'pas-kind', 'incompatible').length, 1);
  const torqueOnTongsheng = swap({
    motor: 'motor-tsdz2-48',
    controller: 'controller-tongsheng-48',
    display: 'display-tongsheng',
    throttle: 'throttle-hall-tongsheng',
    pas: 'pas-torque-tongsheng',
    brake_sensor: 'brake-sensor-tongsheng',
    speed_sensor: 'speed-tongsheng',
    light: 'light-6v-tongsheng',
  });
  assert.equal(findings(torqueOnTongsheng, 'pas-kind', 'incompatible').length, 0);
  assert.equal(findings(torqueOnTongsheng, 'pas-magnets', 'incompatible').length, 0);
  assert.equal(findings(torqueOnTongsheng, 'throttle-connector', 'incompatible').length, 0);
});

test('brake cutoff logic and light voltage have to match the controller port', () => {
  const closed = swap({ brake_sensor: 'brake-sensor-nc-julet' });
  assert.equal(findings(closed, 'brake-sensor-logic', 'incompatible').length, 1);
  assert.equal(findings(closed, 'brake-sensor-connector', 'incompatible').length, 0);
  const twelve = swap({ light: 'light-12v-julet' });
  assert.equal(findings(twelve, 'light-voltage', 'incompatible').length, 1);
  assert.equal(findings(twelve, 'light-connector', 'incompatible').length, 0);
  const packLamp = swap({ light: 'light-48v-bullet' });
  assert.equal(findings(packLamp, 'light-voltage', 'incompatible').length, 1);
  const disc = swap({ speed_sensor: 'speed-disc-julet' });
  assert.equal(findings(disc, 'speed-sensor-type', 'incompatible').length, 1);
});

test('a bus throttle fits the controller that asks for UART on the throttle port', () => {
  const result = swap({
    controller: 'controller-uart-bus-throttle',
    throttle: 'throttle-uart-bus',
  });
  assert.equal(findings(result, 'throttle-protocol', 'incompatible').length, 0);
  assert.equal(findings(result, 'throttle-signal', 'incompatible').length, 0);
  const analogOnBusPort = swap({
    controller: 'controller-uart-bus-throttle',
    throttle: 'throttle-hall-thumb-julet',
  });
  assert.equal(findings(analogOnBusPort, 'throttle-protocol', 'incompatible').length, 1);
});

test('a front hub motor covers the front hub and keeps the rear hub', () => {
  const result = checkBuild({
    bikeType: 'conversion-hub',
    wheelSize: '26',
    slots: {
      frame: 'frame-mtb-standard-post-180',
      hub: 'hub-hg-m-6bolt',
      cassette: 'cassette-shimano-hg400-9-11-36',
      chain: 'chain-shimano-hg-9',
      rear_derailleur: 'shimano-rd-m3100-sgs',
      shifter: 'shifter-shimano-alivio-m3100-9',
      crankset: 'crank-1x-32',
      bottom_bracket: 'bb-bsa-shimano-24',
      motor: 'motor-front-hub-36',
      battery: 'battery-36-xt60',
      controller: 'controller-36-uart-xt60',
      display: 'display-uart',
      throttle: 'throttle-hall-thumb-julet',
    },
  }, catalog, rules);
  assert.equal(findings(result, 'front-axle-match', 'incompatible').length, 0);
  assert.equal(findings(result, 'hub-motor-replaces-hub', 'incompatible').length, 0);
  assert.equal(findings(result, 'motor-controller-voltage', 'incompatible').length, 0);
});
