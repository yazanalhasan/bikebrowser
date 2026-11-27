import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { selectRuleInputs } from '../src/compatibility/pairing.js';
import { checkBuild, filterCandidates } from '../src/builder/engine.js';
import { gearRange } from '../src/builder/gearMath.js';
import { isAllowedSourceUrl, presentFinding } from '../src/builder/present.js';
import { canonicalActuation } from '../src/builder/standards.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(root, relativePath), 'utf8'));
}

const catalogFile = readJson('data/builder/parts.json');
const rulesFile = readJson('data/builder/rules.json');
const schemas = readJson('data/builder/category-schemas.json');
const zuzu = readJson('data/builder/bikes/zuzu-bike.json');
const parts = catalogFile.parts;
const rules = rulesFile.rules;

function byId(id) {
  const part = parts.find((item) => item.id === id);
  assert.ok(part, `missing seed part ${id}`);
  return part;
}

function sonBuild(overrides = {}) {
  return {
    bikeType: 'mountain',
    wheelSize: '26',
    slots: {
      hub: 'hub-hg-m-6bolt',
      cassette: 'cassette-vg-sports-9-11-42',
      chain: 'chain-shimano-hg-9',
      rear_derailleur: 'shimano-rd-m3100-sgs',
      shifter: 'shifter-shimano-alivio-m3100-9',
      crankset: 'crank-1x-32',
      hanger_extender: 'extender-vg-sports',
      frame: 'frame-mtb-standard-post-180',
      ...overrides,
    },
  };
}

function findings(result, ruleId, severity) {
  return result.findings.filter((finding) => finding.ruleId === ruleId && (!severity || finding.severity === severity));
}

test('case A: 11-42 with Alivio and a hanger extender is a warning', () => {
  const result = checkBuild(sonBuild(), catalogFile, rulesFile);
  assert.equal(result.verdict, 'warnings');
  assert.equal(result.derived.capacityNeeded, 31);
  assert.equal(result.derived.rdCapacity, 45);
  assert.ok(result.derived.capacityNeeded <= result.derived.rdCapacity);
  const warnings = result.findings.filter((finding) => finding.severity === 'warning');
  assert.equal(warnings.length, 1);
  assert.equal(warnings[0].ruleId, 'rd-max-cog');
  assert.match(warnings[0].fix, /hanger extender/i);
  assert.match(warnings[0].fix, /B-screw/);
  assert.equal(findings(result, 'rd-total-capacity', 'incompatible').length, 0);
});

test('case B: the same build without the extender is incompatible', () => {
  const slots = { ...sonBuild().slots };
  delete slots.hanger_extender;
  const result = checkBuild({ ...sonBuild(), slots }, catalogFile, rulesFile);
  assert.equal(result.verdict, 'incompatible');
  const maxCog = findings(result, 'rd-max-cog', 'incompatible');
  assert.equal(maxCog.length, 1);
  assert.equal(findings(result, 'rd-max-cog', 'warning').length, 0);
});

test('case C: Altus RD-M370 is 8 teeth over and warns with an extender', () => {
  const result = checkBuild(sonBuild({ rear_derailleur: 'shimano-rd-m370-sgs' }), catalogFile, rulesFile);
  assert.equal(result.verdict, 'warnings');
  const warnings = findings(result, 'rd-max-cog', 'warning');
  assert.equal(warnings.length, 1);
  assert.equal(result.derived.maxCogOverBy, 8);
  assert.match(warnings[0].fix, /hanger extender/i);
});

test('case D: unknown rear derailleur never counts as compatible', () => {
  const result = checkBuild(zuzu, catalogFile, rulesFile);
  assert.equal(result.verdict, 'cannot_verify');
  assert.notEqual(result.verdict, 'compatible');
  assert.ok(result.findings.some((finding) => finding.severity === 'cannot_verify' && finding.slots.includes('rear_derailleur')));
  assert.equal(result.findings.some((finding) => finding.severity === 'incompatible'), false);
});

test('a Micro Spline cassette does not fit an HG hub', () => {
  const result = checkBuild(sonBuild({
    cassette: 'cassette-shimano-m6100-10-51',
    chain: 'chain-shimano-hg-12',
    shifter: 'shifter-shimano-slx-m7100-12',
    rear_derailleur: 'shimano-rd-m6100-sgs',
  }), catalogFile, rulesFile);
  assert.equal(findings(result, 'cassette-freehub-driver', 'incompatible').length, 1);
  assert.equal(result.verdict, 'incompatible');
});

test('an XD cassette on an XDR hub warns that it needs a spacer', () => {
  const result = checkBuild(sonBuild({
    hub: 'hub-xdr-centerlock',
    cassette: 'cassette-sram-gx-10-52',
    chain: 'chain-sram-eagle-12',
    shifter: 'shifter-sram-gx-eagle',
    rear_derailleur: 'sram-rd-gx-eagle',
    crankset: 'crank-sram-gx-32',
  }), catalogFile, rulesFile);
  const warning = findings(result, 'cassette-freehub-driver', 'warning');
  assert.equal(warning.length, 1);
  assert.match(warning[0].messageAdult, /1\.85/);
  assert.match(warning[0].fix, /spacer/i);
});

test('an XDR cassette does not fit an XD hub', () => {
  const result = checkBuild(sonBuild({
    hub: 'hub-xd-6bolt',
    cassette: 'cassette-sram-force-xdr-10-36',
    chain: 'chain-sram-flattop-12',
    shifter: 'shifter-sram-force-axs',
    rear_derailleur: 'sram-rd-gx-axs',
  }), catalogFile, rulesFile);
  assert.equal(findings(result, 'cassette-freehub-driver', 'incompatible').length, 1);
});

test('a 12-speed Shimano shifter does not match a SRAM Eagle derailleur', () => {
  const result = checkBuild(sonBuild({
    hub: 'hub-xd-6bolt',
    cassette: 'cassette-sram-gx-10-52',
    chain: 'chain-sram-eagle-12',
    shifter: 'shifter-shimano-slx-m7100-12',
    rear_derailleur: 'sram-rd-gx-eagle',
    crankset: 'crank-sram-gx-32',
  }), catalogFile, rulesFile);
  assert.equal(findings(result, 'actuation-family', 'incompatible').length, 1);
  assert.equal(result.verdict, 'incompatible');
});

test('an AXS controller does not match a Di2 derailleur', () => {
  const result = checkBuild(sonBuild({
    hub: 'hub-hg-l2-centerlock',
    cassette: 'cassette-shimano-r8100-11-30',
    chain: 'chain-shimano-hg-12',
    shifter: 'shifter-sram-gx-axs',
    rear_derailleur: 'shimano-rd-r8150',
    crankset: 'crank-shimano-105-50-34',
    frame: 'frame-road-flat-160',
  }), catalogFile, rulesFile);
  assert.equal(findings(result, 'electronic-ecosystem', 'incompatible').length, 1);
});

test('Eagle Transmission on a non-UDH frame is incompatible', () => {
  const result = checkBuild(sonBuild({
    hub: 'hub-xd-6bolt',
    cassette: 'cassette-sram-transmission-10-52',
    chain: 'chain-sram-ttype-12',
    shifter: 'shifter-sram-transmission',
    rear_derailleur: 'sram-rd-xx-transmission',
    crankset: 'crank-sram-transmission-32',
    frame: 'frame-mtb-standard-post-203',
  }), catalogFile, rulesFile);
  assert.equal(findings(result, 'full-mount-needs-udh', 'incompatible').length, 1);
});

test('Eagle Transmission on a UDH frame does not fail the hanger rule', () => {
  const result = checkBuild(sonBuild({
    hub: 'hub-xd-6bolt',
    cassette: 'cassette-sram-transmission-10-52',
    chain: 'chain-sram-ttype-12',
    shifter: 'shifter-sram-transmission',
    rear_derailleur: 'sram-rd-xx-transmission',
    crankset: 'crank-sram-transmission-32',
    frame: 'frame-mtb-udh-post-203',
  }), catalogFile, rulesFile);
  assert.equal(findings(result, 'full-mount-needs-udh').length, 0);
});

test('2x 50/34 plus 11-34 exceeds a 37T derailleur and fits a 39T derailleur', () => {
  function capacityBuild(capacity) {
    const extra = {
      id: `rd-capacity-${capacity}`,
      category: 'rear_derailleur',
      brand: 'Teaching',
      model: `Capacity ${capacity}`,
      reviewStatus: 'draft',
      specs: {
        speeds: 11,
        actuationFamily: 'shimano-road-11',
        chainType: 'standard',
        mount: 'hanger',
        eEcosystem: null,
        maxCog: 34,
        minLargestCog: null,
        capacity,
        maxFrontDiff: 16,
      },
    };
    const catalog = { parts: [...parts, extra] };
    return checkBuild({
      bikeType: 'road',
      wheelSize: '700c',
      slots: {
        hub: 'hub-hg-m-centerlock',
        cassette: 'cassette-shimano-hg700-11-34',
        chain: 'chain-shimano-hg-11',
        rear_derailleur: extra.id,
        shifter: 'shifter-shimano-105-r7000',
        crankset: 'crank-shimano-105-50-34',
        frame: 'frame-road-flat-160',
      },
    }, catalog, rulesFile);
  }

  const tooSmall = capacityBuild(37);
  assert.equal(tooSmall.derived.capacityNeeded, 39);
  assert.equal(findings(tooSmall, 'rd-total-capacity', 'incompatible').length, 1);
  assert.equal(tooSmall.verdict, 'incompatible');

  const enough = capacityBuild(39);
  assert.equal(findings(enough, 'rd-total-capacity').length, 0);
  assert.notEqual(enough.verdict, 'incompatible');
});

test('a Shimano mineral lever does not match a SRAM DOT caliper', () => {
  const result = checkBuild(sonBuild({
    brake_lever: 'lever-shimano-bl-mt200',
    brake_caliper: 'caliper-sram-code',
    rotor: 'rotor-6bolt-180',
  }), catalogFile, rulesFile);
  assert.equal(findings(result, 'brake-fluid', 'incompatible').length, 1);
  assert.equal(result.verdict, 'incompatible');
});

test('a 203 mm rotor does not fit a frame limited to 180 mm', () => {
  const result = checkBuild(sonBuild({
    rotor: 'rotor-6bolt-203',
    brake_lever: 'lever-shimano-bl-mt200',
    brake_caliper: 'caliper-shimano-br-mt200',
  }), catalogFile, rulesFile);
  assert.equal(findings(result, 'rotor-size', 'incompatible').length, 1);
});

test('a Center Lock rotor on a 6-bolt hub is a warning', () => {
  const result = checkBuild(sonBuild({
    rotor: 'rotor-centerlock-160',
    brake_lever: 'lever-shimano-bl-mt200',
    brake_caliper: 'caliper-shimano-br-mt200',
  }), catalogFile, rulesFile);
  const warning = findings(result, 'rotor-mount', 'warning');
  assert.equal(warning.length, 1);
  assert.match(warning[0].fix, /adapter/i);
});

test('a flat-mount caliper on a post-mount frame is a warning', () => {
  const result = checkBuild(sonBuild({
    brake_lever: 'lever-shimano-st-r7020',
    brake_caliper: 'caliper-shimano-br-flat-105',
    rotor: 'rotor-centerlock-160',
    hub: 'hub-hg-m-centerlock',
  }), catalogFile, rulesFile);
  assert.equal(findings(result, 'caliper-mount', 'warning').length, 1);
});

test('a blank max cog cannot verify and does not pass', () => {
  const result = checkBuild(sonBuild({
    cassette: 'cassette-shimano-hg-10-11-36',
    chain: 'chain-shimano-hg-10',
    shifter: 'shifter-shimano-deore-m4100-10',
    rear_derailleur: 'shimano-rd-m4100-10',
    crankset: 'crank-1x-32',
  }), catalogFile, rulesFile);
  assert.equal(findings(result, 'rd-max-cog', 'cannot_verify').length, 1);
  assert.notEqual(result.verdict, 'compatible');
});

test('Shimano 6-9 rear derailleurs can differ in speed from the shifter', () => {
  const result = checkBuild(sonBuild({ rear_derailleur: 'shimano-rd-classic-8' }), catalogFile, rulesFile);
  assert.equal(findings(result, 'speed-count', 'incompatible').length, 0);
});

test('nine teeth past the published max stays incompatible with an extender', () => {
  const cassette = {
    ...byId('cassette-vg-sports-9-11-42'),
    id: 'cassette-9-11-43',
    specs: { ...byId('cassette-vg-sports-9-11-42').specs, largestCog: 43, cogs: [11, 43] },
  };
  const result = checkBuild(sonBuild({ cassette: cassette.id }), { parts: [...parts, cassette] }, rulesFile);
  assert.equal(result.derived.maxCogOverBy, 7);
  const bigger = {
    ...cassette,
    id: 'cassette-9-11-45',
    specs: { ...cassette.specs, largestCog: 45, cogs: [11, 45] },
  };
  const over = checkBuild(sonBuild({ cassette: bigger.id, rear_derailleur: 'shimano-rd-m370-sgs' }), { parts: [...parts, bigger] }, rulesFile);
  assert.equal(over.derived.maxCogOverBy, 11);
  assert.equal(findings(over, 'rd-max-cog', 'incompatible').length, 1);
});

test('filterCandidates hides derailleurs that fail speed or actuation on Zuzu\'s bike', () => {
  const fits = filterCandidates('rear_derailleur', zuzu, catalogFile, rulesFile);
  const ids = fits.map((part) => part.id);
  assert.ok(ids.includes('shimano-rd-m3100-sgs'));
  assert.ok(ids.includes('shimano-rd-m370-sgs'));
  assert.equal(ids.includes('sram-rd-gx-eagle'), false);
  assert.equal(ids.includes('shimano-rd-m6100-sgs'), false);
  assert.equal(ids.includes('sram-rd-xx-transmission'), false);
  for (const part of fits) {
    assert.equal(canonicalActuation(part.specs.actuationFamily), 'shimano-road-6-9-10');
    assert.ok([6, 7, 8, 9].includes(part.specs.speeds), part.id);
  }
});

test('gear inches use chainring, cog, and nominal wheel diameter', () => {
  const result = gearRange({ chainrings: [32], cogs: [11, 42], wheelSize: '26' });
  assert.equal(result.status, 'ok');
  assert.equal(result.low.cog, 42);
  assert.equal(result.high.cog, 11);
  assert.ok(Math.abs(result.low.gearInches - (32 / 42) * 26) < 0.001);
  assert.ok(Math.abs(result.high.ratio - (32 / 11)) < 0.001);
  const road = gearRange({ chainrings: [50, 34], cogs: [11, 34], wheelSize: '700c' });
  assert.equal(road.low.ratio, 1);
  assert.ok(Math.abs(road.high.gearInches - (50 / 11) * 26.7) < 0.001);
});

test('gear range cannot verify when the chainring or wheel size is missing', () => {
  const missingRing = gearRange({ chainrings: [], cogs: [11, 42], wheelSize: '26' });
  assert.equal(missingRing.status, 'cannot_verify');
  const missingWheel = gearRange({ chainrings: [32], cogs: [42], wheelSize: null });
  assert.equal(missingWheel.status, 'cannot_verify');
  assert.ok(missingWheel.missing.includes('wheel size'));
});

test('kid view of a finding has no URL', () => {
  const result = checkBuild(sonBuild(), catalogFile, rulesFile);
  const warning = result.findings.find((finding) => finding.ruleId === 'rd-max-cog');
  const kid = presentFinding(warning, { grownup: false });
  assert.equal(kid.sourceUrl, null);
  assert.equal(kid.ruleId, null);
  assert.equal(kid.message, warning.messageKid);
  assert.match(kid.fix, /B-screw/);
  const grown = presentFinding(warning, { grownup: true });
  assert.equal(grown.sourceUrl, warning.sourceUrl);
  assert.equal(grown.ruleId, 'rd-max-cog');
});

test('source links allow manufacturer pages and reject shops', () => {
  assert.equal(isAllowedSourceUrl('https://productinfo.shimano.com/en/compatibility/C-731'), true);
  assert.equal(isAllowedSourceUrl('https://www.sram.com/en/learn/understanding-udh-and-full-mount'), true);
  assert.equal(isAllowedSourceUrl('https://www.amazon.com/dp/B09VBNTGCD'), false);
  assert.equal(isAllowedSourceUrl('https://www.ebay.com/itm/1'), false);
  assert.equal(isAllowedSourceUrl('http://productinfo.shimano.com/en/compatibility/C-731'), false);
});

test('every rule has a source, both messages, and a known predicate', () => {
  const ops = new Set([
    'always', 'exists', 'slot_empty', 'slot_filled', 'all_empty', 'eq', 'gt', 'gte', 'lt', 'lte', 'in',
    'and', 'or', 'not', 'same_family', 'same_ecosystem', 'requires_standard', 'capacity_sum_lte',
    'speeds_match', 'chain_types_match', 'brake_frame_match', 'same_fluid', 'rd_max_cog', 'adapter_allowed', 'abs_diff_gt',
  ]);
  const provenances = new Set(['manufacturer_spec', 'industry_standard', 'practitioner_rule']);
  const walk = (predicate) => {
    assert.ok(ops.has(predicate.op), predicate.op);
    for (const child of predicate.args || []) walk(child);
    if (predicate.arg) walk(predicate.arg);
  };
  assert.ok(rules.length >= 10);
  for (const rule of rules) {
    assert.ok(rule.id);
    assert.equal(typeof rule.version, 'number');
    assert.ok(Array.isArray(rule.slots));
    assert.ok(['incompatible', 'warning', 'cannot_verify'].includes(rule.severity));
    assert.match(rule.messageAdult, /\S/);
    assert.match(rule.messageKid, /\S/);
    assert.doesNotMatch(rule.messageKid, /https?:\/\//i);
    assert.match(rule.sourceUrl, /^https:\/\//);
    assert.match(rule.sourceRef, /\S/);
    assert.ok(provenances.has(rule.provenance));
    walk(rule.predicate);
    for (const text of Object.values(rule.messageKidByStatus || {})) {
      assert.doesNotMatch(text, /https?:\/\//i);
    }
    for (const text of [rule.fix, ...Object.values(rule.fixByStatus || {})]) {
      if (text) assert.doesNotMatch(text, /https?:\/\//i);
    }
  }
  const maxCog = rules.find((rule) => rule.id === 'rd-max-cog');
  assert.equal(maxCog.provenance, 'practitioner_rule');
  assert.equal(maxCog.predicate.extenderWindowTeeth, 8);
});

test('seed parts are unique and match their category schema', () => {
  assert.ok(parts.length >= 150, `expected about 150 parts, got ${parts.length}`);
  const ids = new Set();
  for (const part of parts) {
    assert.equal(ids.has(part.id), false, part.id);
    ids.add(part.id);
    for (const key of schemas.partRequired) {
      assert.ok(part[key] !== undefined && part[key] !== '', `${part.id} missing ${key}`);
    }
    assert.ok(schemas.reviewStatus.includes(part.reviewStatus), part.id);
    const specKeys = schemas.categories[part.category];
    assert.ok(specKeys, part.category);
    for (const key of specKeys) {
      assert.ok(Object.prototype.hasOwnProperty.call(part.specs, key), `${part.id} specs.${key}`);
    }
  }
});

test('builder files do not contain shop links or prices', () => {
  const roots = ['data/builder', 'src/builder', 'src/renderer/pages/builder'].map((dir) => join(root, dir));
  const forbidden = [/amazon\.com/i, /ebay\.com/i, /walmart\.com/i, /affiliate/i, /add to cart/i, /\$\d/];
  const files = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (/\.(js|jsx|mjs|json|md|sql)$/.test(name)) files.push(path);
    }
  };
  for (const dir of roots) walk(dir);
  assert.ok(files.length > 5);
  for (const path of files) {
    const text = readFileSync(path, 'utf8');
    for (const pattern of forbidden) {
      assert.equal(pattern.test(text), false, `${path} matched ${pattern}`);
    }
  }
});

test('e-bike voltage rule is paired with the battery, not the motor', () => {
  const items = [
    { category: 'motor', specs: { voltage: 48, power: 750 } },
    { category: 'controller', specs: { voltage: 36, power: 500, maxCurrent: 15 } },
    { category: 'battery', specs: { voltage: 36, maxCurrent: 20 } },
  ];
  const voltage = selectRuleInputs('battery-controller', items);
  const motor = selectRuleInputs('motor-controller', items);
  assert.equal(voltage.a.category, 'battery');
  assert.equal(voltage.b.category, 'controller');
  assert.equal(motor.a.category, 'motor');
  assert.notEqual(voltage.a.specs.voltage, motor.a.specs.voltage);
});

test('a missing catalog id cannot verify', () => {
  const result = checkBuild(sonBuild({ cassette: 'not-a-real-part' }), catalogFile, rulesFile);
  assert.equal(result.verdict, 'cannot_verify');
  assert.ok(result.findings.some((finding) => finding.ruleId === 'slot-missing-cassette'));
});
