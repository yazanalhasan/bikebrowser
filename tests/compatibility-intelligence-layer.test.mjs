import assert from 'node:assert/strict';
import { mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { build } from 'esbuild';

async function bundleModule(entryPoint) {
  const outdir = path.join(tmpdir(), `bikebrowser-cil-${Date.now()}-${Math.random().toString(36).slice(2)}`);
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

test('extracts Shimano CUES rear derailleur standards from messy listing text', async () => {
  const { extractProductSpecs } = await bundleModule(
    path.resolve('src/renderer/services/compatibility/extraction/productSpecExtractor.ts')
  );

  const specs = extractProductSpecs({
    title: 'Shimano CUES RD-U4000 9-Speed Long Cage Rear Derailleur',
    description: 'LINKGLIDE compatible. Works with 11-46T cassette range.',
  });

  assert.equal(specs.category, 'rear-derailleur');
  assert.equal(specs.brand, 'Shimano');
  assert.equal(specs.family, 'Shimano CUES');
  assert.equal(specs.pullRatio, 'LINKGLIDE');
  assert.equal(specs.speeds, 9);
  assert.equal(specs.cage, 'long');
  assert.equal(specs.maxCogTeeth, 46);
  assert.ok(specs.extractionConfidence >= 0.75);
});

test('deterministic drivetrain rules reject Hyperglide derailleur for Shimano CUES LINKGLIDE bike', async () => {
  const { evaluateProductCompatibility } = await bundleModule(
    path.resolve('src/renderer/services/compatibility/reasoning/compatibilityEngine.ts')
  );
  const { loadBikeProfile } = await bundleModule(
    path.resolve('src/renderer/services/compatibility/bikeProfiles/profileLoader.ts')
  );

  const result = evaluateProductCompatibility(loadBikeProfile('ozark-trail-m2-ridge-pro'), {
    category: 'rear-derailleur',
    title: 'Shimano Deore M592 9 Speed Rear Derailleur',
    brand: 'Shimano',
    family: 'Shimano Deore',
    pullRatio: 'HYPERGLIDE',
    speeds: 9,
    maxCogTeeth: 36,
    cage: 'long',
    extractionConfidence: 0.9,
  });

  assert.equal(result.status, 'incompatible');
  assert.match(result.reasons.join(' '), /LINKGLIDE|pull ratio/i);
  assert.match(result.reasons.join(' '), /46T|cassette/i);
  assert.ok(result.educationalConcepts.includes('Cable pull ratio'));
});

test('deterministic drivetrain rules accept compatible CUES long-cage derailleur with traceable reasons', async () => {
  const { evaluateProductCompatibility } = await bundleModule(
    path.resolve('src/renderer/services/compatibility/reasoning/compatibilityEngine.ts')
  );
  const { loadBikeProfile } = await bundleModule(
    path.resolve('src/renderer/services/compatibility/bikeProfiles/profileLoader.ts')
  );

  const result = evaluateProductCompatibility(loadBikeProfile('ozark-trail-m2-ridge-pro'), {
    category: 'rear-derailleur',
    title: 'Shimano CUES RD-U4000 9-Speed Long Cage Rear Derailleur',
    brand: 'Shimano',
    family: 'Shimano CUES',
    pullRatio: 'LINKGLIDE',
    speeds: 9,
    maxCogTeeth: 46,
    cage: 'long',
    extractionConfidence: 0.92,
  });

  assert.equal(result.status, 'compatible');
  assert.ok(result.confidence >= 0.85);
  assert.match(result.reasons.join(' '), /9-speed/i);
  assert.match(result.reasons.join(' '), /LINKGLIDE/i);
});

test('compatibility-aware shopping query propagates active bike constraints', async () => {
  const { buildCompatibilityAwareQuery } = await bundleModule(
    path.resolve('src/renderer/services/shopping/CompatibilityAwareSearchService.ts')
  );
  const { loadBikeProfile } = await bundleModule(
    path.resolve('src/renderer/services/compatibility/bikeProfiles/profileLoader.ts')
  );

  const query = buildCompatibilityAwareQuery('rear derailleur', loadBikeProfile('ozark-trail-m2-ridge-pro'));

  assert.match(query, /Shimano CUES/i);
  assert.match(query, /LINKGLIDE/i);
  assert.match(query, /9[- ]speed/i);
  assert.match(query, /11-46T/i);
  assert.match(query, /long cage/i);
});
