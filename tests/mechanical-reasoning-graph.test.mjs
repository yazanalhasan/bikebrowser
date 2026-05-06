import assert from 'node:assert/strict';
import { mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { build } from 'esbuild';

async function bundleModule(entryPoint) {
  const outdir = path.join(tmpdir(), `bikebrowser-graph-${Date.now()}-${Math.random().toString(36).slice(2)}`);
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

test('builds Ozark Trail profile into connected mechanical graph nodes and edges', async () => {
  const { loadBikeProfile } = await bundleModule(
    path.resolve('src/renderer/services/compatibility/bikeProfiles/profileLoader.ts')
  );
  const { createMechanicalGraph } = await bundleModule(
    path.resolve('src/renderer/services/compatibility/graph/mechanicalGraphEngine.ts')
  );

  const graph = createMechanicalGraph(loadBikeProfile('ozark-trail-m2-ridge-pro'));
  const cassette = graph.nodes.cassette;

  assert.equal(cassette.interfaces.range, '11-46T');
  assert.ok(cassette.dependencies.includes('freehub'));
  assert.ok(cassette.dependents.includes('rear-derailleur'));
  assert.ok(graph.edges.some((edge) => edge.from === 'cassette' && edge.to === 'rear-derailleur'));
});

test('propagates cassette upgrade constraints to derailleur, chain, shifter, b-gap and chain capacity', async () => {
  const { loadBikeProfile } = await bundleModule(
    path.resolve('src/renderer/services/compatibility/bikeProfiles/profileLoader.ts')
  );
  const { createMechanicalGraph, propagateComponentChange } = await bundleModule(
    path.resolve('src/renderer/services/compatibility/graph/mechanicalGraphEngine.ts')
  );

  const graph = createMechanicalGraph(loadBikeProfile('ozark-trail-m2-ridge-pro'));
  const propagation = propagateComponentChange(graph, 'cassette', {
    range: '10-52T',
    maxCogTeeth: 52,
    speeds: 12,
    freehub: 'SRAM XD',
  });

  assert.deepEqual(
    propagation.affectedNodeIds,
    ['freehub', 'rear-derailleur', 'chain', 'shifter', 'b-gap', 'chain-wrap-capacity']
  );
  assert.ok(propagation.issues.some((issue) => issue.nodeId === 'rear-derailleur' && issue.status === 'incompatible'));
  assert.ok(propagation.issues.some((issue) => /chain wrap/i.test(issue.reason)));
  assert.ok(propagation.dependencyPaths.some((pathEntry) => pathEntry.join('>') === 'cassette>rear-derailleur'));
});

test('standards knowledge graph exposes compatibility and conflicts as data', async () => {
  const { getStandardEntity, standardsAreCompatible } = await bundleModule(
    path.resolve('src/renderer/services/compatibility/knowledgeGraph/standardsKnowledgeGraph.ts')
  );

  const linkglide = getStandardEntity('shimano_linkglide');

  assert.equal(linkglide.type, 'drivetrain_standard');
  assert.ok(linkglide.compatible_with.includes('cues_9'));
  assert.equal(standardsAreCompatible('shimano_linkglide', 'cues_9'), true);
  assert.equal(standardsAreCompatible('shimano_linkglide', 'hyperglide_11'), false);
});

test('failure simulation explains mechanical symptoms and causal propagation', async () => {
  const { simulateCompatibilityFailure } = await bundleModule(
    path.resolve('src/renderer/services/compatibility/simulation/failureSimulationEngine.ts')
  );

  const simulation = simulateCompatibilityFailure({
    category: 'rear-derailleur',
    failureType: 'pull-ratio-mismatch',
  });

  assert.ok(simulation.symptoms.includes('ghost shifting'));
  assert.ok(simulation.causalChain.some((step) => /Cable pull/i.test(step)));
  assert.ok(simulation.ridingSymptoms.some((step) => /skips/i.test(step)));
});
