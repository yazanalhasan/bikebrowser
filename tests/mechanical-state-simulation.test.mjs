import assert from 'node:assert/strict';
import { mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { build } from 'esbuild';

async function bundleModule(entryPoint) {
  const outdir = path.join(tmpdir(), `bikebrowser-state-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  await mkdir(outdir, { recursive: true });
  const outfile = path.join(outdir, 'bundle.mjs');

  await build({
    entryPoints: [entryPoint],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'node',
    jsx: 'automatic',
    logLevel: 'silent',
  });

  const mod = await import(pathToFileURL(outfile).href);
  await rm(outdir, { recursive: true, force: true });
  return mod;
}

test('simulates chainring change as torque, speed, cadence, and chain tension deltas', async () => {
  const { simulateDrivetrainChange } = await bundleModule(
    path.resolve('src/renderer/services/compatibility/simulation/mechanicalStateSimulation.ts')
  );

  const result = simulateDrivetrainChange({
    before: { chainringTeeth: 32, cassetteCogTeeth: 46, wheelSizeIn: 29, crankLengthMm: 170, cadenceRpm: 80, riderTorqueNm: 42 },
    after: { chainringTeeth: 28, cassetteCogTeeth: 46, wheelSizeIn: 29, crankLengthMm: 170, cadenceRpm: 80, riderTorqueNm: 42 },
  });

  assert.equal(result.changeSummary.climbingTorque, 'increases');
  assert.equal(result.changeSummary.topSpeed, 'decreases');
  assert.equal(result.changeSummary.cadenceEfficiency, 'increases');
  assert.equal(result.changeSummary.chainTension, 'decreases');
  assert.ok(result.after.torqueMultiplier > result.before.torqueMultiplier);
  assert.ok(result.after.speedMph < result.before.speedMph);
});

test('builds gear ratio curves across cassette range for visualization', async () => {
  const { buildGearRatioCurve } = await bundleModule(
    path.resolve('src/renderer/services/compatibility/simulation/gearRatioEngine.ts')
  );

  const curve = buildGearRatioCurve({
    chainringTeeth: 32,
    cassetteCogs: [11, 13, 15, 18, 21, 24, 28, 34, 46],
    wheelSizeIn: 29,
    cadenceRpm: 90,
  });

  assert.equal(curve.points.length, 9);
  assert.ok(curve.points[0].speedMph > curve.points[8].speedMph);
  assert.ok(curve.points[8].torqueMultiplier > curve.points[0].torqueMultiplier);
  assert.ok(curve.summary.climbingRatio < 1);
});

test('creates cascading failure propagation tree with secondary wear effects', async () => {
  const { buildFailurePropagationTree } = await bundleModule(
    path.resolve('src/renderer/services/compatibility/simulation/failurePropagationTree.ts')
  );

  const tree = buildFailurePropagationTree('pull-ratio-mismatch');

  assert.equal(tree.rootCause, 'Wrong pull ratio');
  assert.equal(tree.children[0].effect, 'Poor indexing');
  assert.ok(tree.children[0].children[0].children.some((node) => /wear/i.test(node.effect)));
});

test('diagnoses skipping under load using mechanic questions and ranked causes', async () => {
  const { diagnoseRideSymptom } = await bundleModule(
    path.resolve('src/renderer/services/compatibility/diagnostics/interactiveDiagnostics.ts')
  );

  const diagnosis = diagnoseRideSymptom('My bike skips gears under load', {
    when: 'climbing',
    gears: 'largest cogs',
    afterShifting: true,
    underTorque: true,
  });

  assert.ok(diagnosis.questions.some((question) => /which gears/i.test(question.prompt)));
  assert.equal(diagnosis.likelyCauses[0].id, 'chain-or-cassette-wear');
  assert.ok(diagnosis.likelyCauses[0].evidence.some((entry) => /under load/i.test(entry)));
});

test('mechanical memory updates wear and upgrade history for future reasoning', async () => {
  const { createMechanicalMemory, recordWearMeasurement, recordUpgrade } = await bundleModule(
    path.resolve('src/renderer/services/compatibility/memory/mechanicalMemory.ts')
  );

  const memory = createMechanicalMemory('ozark-trail-m2-ridge-pro');
  const withWear = recordWearMeasurement(memory, { chainWear: 0.65, cassetteMileage: 1800, hangerAlignmentAdjusted: true });
  const withUpgrade = recordUpgrade(withWear, { component: 'cassette', from: '11-46T', to: '10-52T' });

  assert.equal(withUpgrade.wearState.chainWear, 0.65);
  assert.equal(withUpgrade.wearState.cassetteMileage, 1800);
  assert.equal(withUpgrade.measurements.hangerAlignmentAdjusted, true);
  assert.equal(withUpgrade.upgradeHistory[0].component, 'cassette');
});
