/**
 * Pure bicycle fitment engine. No React and no DOM.
 *
 * checkBuild never treats missing or unknown data as a pass. A finding is
 * incompatible, warning, or cannot_verify. The overall verdict is the
 * strongest of those: incompatible, then warnings, then cannot_verify,
 * and compatible only when nothing is open.
 *
 * Adapter results follow the native / needs-adapter / incompatible model
 * from isaacrowntree/bike-part-planner (MIT). Copyright (c) 2026 Isaac
 * Rowntree. https://github.com/isaacrowntree/bike-part-planner
 * This file is original BikeBrowser code, not a verbatim copy.
 *
 * Game entry: import { checkBuild } from './index.js'
 */

import { canonicalActuation, categoryForSlot } from './standards.js';

const CORE_SLOTS = ['hub', 'cassette', 'chain', 'rear_derailleur', 'shifter', 'crankset', 'frame'];

const SLOT_UNKNOWN_COPY = {
  rear_derailleur: {
    kid: 'We do not know which rear derailleur is on this bike yet. Ask a grown-up to read the model number stamped on it.',
    adult: 'The rear derailleur is owned but the model was not recorded. Enter that model before any derailleur check can pass.',
  },
  frame: {
    kid: 'We do not know this frame\'s hanger or brake mounts yet. A grown-up can look them up.',
    adult: 'Frame standards are unknown. Hanger type, brake mount, and max rotor stay cannot-verify until they are entered.',
  },
};

const GENERIC_UNKNOWN = {
  kid: 'This part is on the bike, but we do not know the model yet. Ask a grown-up to fill it in. We will not call it a fit.',
  adult: 'This slot is owned-unknown. Missing identity is not a pass.',
};

function partsList(catalog) {
  if (Array.isArray(catalog)) return catalog;
  if (Array.isArray(catalog?.parts)) return catalog.parts;
  return [];
}

function indexParts(catalog) {
  return new Map(partsList(catalog).map((part) => [part.id, part]));
}

function resolveSlot(build, slot, byId) {
  const ref = build?.slots?.[slot];
  if (ref == null || ref === '') return { state: 'empty', slot };
  if (typeof ref === 'object') {
    if (ref.status === 'owned-unknown') return { state: 'unknown', slot, ref };
    if (ref.present === true) return { state: 'present', slot, ref };
    return { state: 'unknown', slot, ref };
  }
  const part = byId.get(ref);
  if (!part) return { state: 'missing-id', slot, id: String(ref) };
  return { state: 'part', slot, part };
}

function readPath(path, ctx) {
  if (typeof path !== 'string' || path === '') return { missing: true, value: undefined };
  const segments = path.split('.');
  let cursor = ctx;
  for (const segment of segments) {
    if (cursor == null || typeof cursor !== 'object' || !(segment in cursor)) {
      return { missing: true, value: undefined };
    }
    cursor = cursor[segment];
  }
  return { missing: false, value: cursor };
}

function resolveOperand(operand, ctx) {
  if (operand && typeof operand === 'object' && typeof operand.path === 'string') {
    return readPath(operand.path, ctx);
  }
  if (typeof operand === 'string' && (operand.startsWith('derived.') || operand.startsWith('slot.'))) {
    return readPath(operand, ctx);
  }
  return { missing: false, value: operand };
}

function asNumber(reading) {
  if (reading.missing || reading.value == null || reading.value === '') return null;
  const number = Number(reading.value);
  return Number.isFinite(number) ? number : null;
}

function finiteSpec(value) {
  if (value == null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function computeDerived(slots) {
  const cassette = slots.cassette?.part;
  const rd = slots.rear_derailleur?.part;
  const crank = slots.crankset?.part;
  const extender = slots.hanger_extender;
  const hangerExtender = extender?.state === 'part' || extender?.state === 'present';

  let ringCount = null;
  let frontDiff = null;
  let chainrings = [];
  if (crank) {
    chainrings = Array.isArray(crank.specs?.chainrings)
      ? crank.specs.chainrings.map(Number).filter((value) => Number.isFinite(value) && value > 0)
      : [];
    ringCount = finiteSpec(crank.specs?.ringCount);
    if (ringCount == null && chainrings.length > 0) ringCount = chainrings.length;
    if (ringCount === 1) frontDiff = 0;
    else if (chainrings.length >= 2) frontDiff = Math.max(...chainrings) - Math.min(...chainrings);
  }

  const largestCog = finiteSpec(cassette?.specs?.largestCog);
  const smallestCog = finiteSpec(cassette?.specs?.smallestCog);
  const maxCog = finiteSpec(rd?.specs?.maxCog);
  const cogRange = largestCog != null && smallestCog != null ? largestCog - smallestCog : null;
  const maxCogOverBy = largestCog != null && maxCog != null ? largestCog - maxCog : null;
  const capacityNeeded = frontDiff == null || cogRange == null ? null : frontDiff + cogRange;

  return {
    ringCount,
    frontDiff,
    chainrings,
    cogRange,
    capacityNeeded,
    maxCogOverBy,
    hangerExtender,
    largestCog,
    smallestCog,
    maxCog,
    rdCapacity: finiteSpec(rd?.specs?.capacity),
    minLargestCog: finiteSpec(rd?.specs?.minLargestCog),
    maxFrontDiff: finiteSpec(rd?.specs?.maxFrontDiff),
  };
}

function evalBool(predicate, ctx) {
  if (!predicate || typeof predicate !== 'object') return 'missing';
  switch (predicate.op) {
    case 'always':
      return true;
    case 'exists': {
      const reading = readPath(predicate.path, ctx);
      if (reading.missing || reading.value == null || reading.value === '') return false;
      return true;
    }
    case 'slot_empty':
      return ctx.slots[predicate.slot]?.state === 'empty';
    case 'slot_filled': {
      const state = ctx.slots[predicate.slot]?.state;
      return state === 'part' || state === 'present';
    }
    case 'all_empty':
      return (predicate.slots || []).every((slot) => ctx.slots[slot]?.state === 'empty');
    case 'eq': {
      const left = resolveOperand(predicate.left, ctx);
      const right = resolveOperand(predicate.right, ctx);
      if (left.missing || right.missing) return 'missing';
      if (left.value == null || right.value == null) return 'missing';
      if (typeof left.value === 'number' || typeof right.value === 'number') {
        return Number(left.value) === Number(right.value);
      }
      return left.value === right.value;
    }
    case 'gt':
    case 'gte':
    case 'lt':
    case 'lte': {
      const left = asNumber(resolveOperand(predicate.left, ctx));
      const right = asNumber(resolveOperand(predicate.right, ctx));
      if (left == null || right == null) return 'missing';
      if (predicate.op === 'gt') return left > right;
      if (predicate.op === 'gte') return left >= right;
      if (predicate.op === 'lt') return left < right;
      return left <= right;
    }
    case 'in': {
      const left = resolveOperand(predicate.left, ctx);
      const right = resolveOperand(predicate.right, ctx);
      if (left.missing || right.missing || left.value == null) return 'missing';
      if (!Array.isArray(right.value)) return 'missing';
      return right.value.includes(left.value);
    }
    case 'and': {
      let missing = false;
      for (const arg of predicate.args || []) {
        const value = evalBool(arg, ctx);
        if (value === false) return false;
        if (value === 'missing') missing = true;
      }
      return missing ? 'missing' : true;
    }
    case 'or': {
      let missing = false;
      for (const arg of predicate.args || []) {
        const value = evalBool(arg, ctx);
        if (value === true) return true;
        if (value === 'missing') missing = true;
      }
      return missing ? 'missing' : false;
    }
    case 'not': {
      const value = evalBool(predicate.arg, ctx);
      if (value === 'missing') return 'missing';
      return !value;
    }
    case 'same_family': {
      const left = resolveOperand(predicate.left, ctx);
      const right = resolveOperand(predicate.right, ctx);
      if (left.missing || right.missing || left.value == null || right.value == null) return 'missing';
      return canonicalActuation(left.value) === canonicalActuation(right.value);
    }
    case 'same_ecosystem': {
      const left = resolveOperand(predicate.left, ctx);
      const right = resolveOperand(predicate.right, ctx);
      if (left.missing || right.missing) return 'missing';
      if (left.value == null && right.value == null) return true;
      if (left.value == null || right.value == null) return false;
      return left.value === right.value;
    }
    case 'requires_standard': {
      const when = resolveOperand(predicate.whenPath, ctx);
      if (when.missing || when.value == null) return 'missing';
      if (when.value !== predicate.whenValue) return true;
      const standard = resolveOperand(predicate.standardPath, ctx);
      if (standard.missing || standard.value == null) return 'missing';
      return standard.value === predicate.standard;
    }
    case 'capacity_sum_lte': {
      const capacity = asNumber(resolveOperand(predicate.capacity, ctx));
      const front = asNumber(resolveOperand(predicate.frontDiff, ctx));
      const cog = asNumber(resolveOperand(predicate.cogRange, ctx));
      if (capacity == null || front == null || cog == null) return 'missing';
      return front + cog <= capacity;
    }
    case 'speeds_match':
      return speedsMatch(predicate, ctx);
    case 'chain_types_match':
      return chainTypesMatch(predicate, ctx);
    case 'brake_frame_match':
      return brakeFrameMatch(predicate, ctx);
    case 'same_fluid':
      return sameFluid(predicate, ctx);
    default:
      return 'missing';
  }
}

function speedsMatch(predicate, ctx) {
  const readings = (predicate.paths || []).map((path) => resolveOperand(path, ctx));
  if (readings.some((reading) => asNumber(reading) == null)) return 'missing';
  const speeds = readings.map((reading) => asNumber(reading));
  const relaxed = new Set();
  for (const exception of predicate.relax || []) {
    const index = predicate.paths.indexOf(exception.path);
    if (index < 0) continue;
    const family = resolveOperand(exception.whenFamily, ctx);
    if (family.missing || family.value == null) continue;
    if (canonicalActuation(family.value) !== exception.family) continue;
    if (!(exception.allowed || []).includes(speeds[index])) continue;
    const others = speeds.filter((_, otherIndex) => otherIndex !== index);
    if (exception.othersMustBeInAllowed && others.some((speed) => !exception.allowed.includes(speed))) continue;
    if (new Set(others).size !== 1) continue;
    relaxed.add(index);
  }
  const strict = speeds.filter((_, index) => !relaxed.has(index));
  return new Set(strict).size <= 1;
}

function chainTypesMatch(predicate, ctx) {
  const readings = (predicate.paths || []).map((path) => resolveOperand(path, ctx));
  if (readings.some((reading) => reading.missing || reading.value == null || reading.value === '')) return 'missing';
  return new Set(readings.map((reading) => reading.value)).size <= 1;
}

function brakeFrameMatch(predicate, ctx) {
  const frame = resolveOperand(predicate.frame, ctx);
  const part = resolveOperand(predicate.part, ctx);
  if (frame.missing || part.missing || frame.value == null || part.value == null) return 'missing';
  if (frame.value === 'both') return true;
  const disc = part.value === 'mechanical-disc' || part.value === 'hydraulic-disc';
  const rim = part.value === 'rim-caliper' || part.value === 'v-brake' || part.value === 'cantilever';
  if (frame.value === 'disc') return disc;
  if (frame.value === 'rim') return rim;
  return 'missing';
}

function sameFluid(predicate, ctx) {
  const leverType = resolveOperand(predicate.leverType, ctx);
  const caliperType = resolveOperand(predicate.caliperType, ctx);
  if (leverType.missing || caliperType.missing || leverType.value == null || caliperType.value == null) return 'missing';
  if (leverType.value !== 'hydraulic-disc' || caliperType.value !== 'hydraulic-disc') return true;
  const left = resolveOperand(predicate.left, ctx);
  const right = resolveOperand(predicate.right, ctx);
  if (left.missing || right.missing || left.value == null || right.value == null) return 'missing';
  return left.value === right.value;
}

function evalSpecial(predicate, ctx) {
  if (predicate.op === 'rd_max_cog') {
    const over = ctx.derived.maxCogOverBy;
    const windowTeeth = Number(predicate.extenderWindowTeeth);
    if (over == null || !Number.isFinite(windowTeeth)) {
      return { status: 'cannot_verify', data: {} };
    }
    if (over <= 0) return { status: 'ok', data: { overBy: over } };
    if (over <= windowTeeth && ctx.derived.hangerExtender) {
      return { status: 'warning', data: { overBy: over } };
    }
    return { status: 'incompatible', data: { overBy: over, extenderPresent: ctx.derived.hangerExtender } };
  }
  if (predicate.op === 'adapter_allowed') {
    return evalAdapter(predicate, ctx);
  }
  return { status: 'cannot_verify', data: {} };
}

function evalAdapter(predicate, ctx) {
  if (predicate.mode === 'freehub') {
    const driverReading = resolveOperand(predicate.driver, ctx);
    const fitsReading = resolveOperand(predicate.fits, ctx);
    if (driverReading.missing || fitsReading.missing || driverReading.value == null) {
      return { status: 'cannot_verify', data: {} };
    }
    if (!Array.isArray(fitsReading.value) || fitsReading.value.length === 0) {
      return { status: 'cannot_verify', data: { driver: driverReading.value } };
    }
    const driver = String(driverReading.value);
    const match = fitsReading.value.find((entry) => entry && entry.driver === driver);
    if (!match) return { status: 'incompatible', data: { driver } };
    if (match.fit === 'native') return { status: 'ok', data: { driver } };
    if (match.fit === 'spacer') {
      return { status: 'warning', data: { driver, spacerMm: match.spacerMm, note: match.note || '' } };
    }
    if (match.fit === 'unknown') return { status: 'cannot_verify', data: { driver } };
    return { status: 'incompatible', data: { driver } };
  }

  const left = resolveOperand(predicate.left, ctx);
  const right = resolveOperand(predicate.right, ctx);
  if (left.missing || right.missing || left.value == null || right.value == null) {
    return { status: 'cannot_verify', data: {} };
  }
  if (left.value === right.value) return { status: 'ok', data: {} };
  return {
    status: 'warning',
    data: { leftMount: left.value, rightMount: right.value },
  };
}

function fill(template, bag) {
  if (!template) return template;
  return String(template).replace(/\{(\w+)\}/g, (_, key) => {
    const value = bag[key];
    if (value == null) return '…';
    return String(value);
  });
}

function messageFor(rule, status, bag) {
  const primary = status === rule.severity;
  const adult = rule.messageAdultByStatus?.[status] || (primary ? rule.messageAdult : null)
    || 'We cannot finish this check because a needed value is missing. Missing data is not a pass.';
  const kid = rule.messageKidByStatus?.[status] || (primary ? rule.messageKid : null)
    || 'A number is missing, so this check stays open. We will not call it a fit yet.';
  const fix = rule.fixByStatus?.[status] || (primary ? rule.fix : undefined);
  return {
    messageAdult: fill(adult, bag),
    messageKid: fill(kid, bag),
    fix: fix ? fill(fix, bag) : undefined,
  };
}

function sourceFor(rule, data) {
  if (data?.driver && rule.sourceUrlByDriver?.[data.driver]) return rule.sourceUrlByDriver[data.driver];
  return rule.sourceUrl;
}

function ruleBlocked(rule, slots) {
  const optional = new Set(rule.optionalSlots || []);
  for (const slot of rule.slots || []) {
    if (optional.has(slot)) continue;
    const state = slots[slot]?.state;
    if (state !== 'part' && state !== 'present') return true;
  }
  return false;
}

function makeFinding(rule, status, slots, bag, data) {
  const text = messageFor(rule, status, { ...bag, ...data });
  const partIds = (rule.slots || []).map((slot) => slots[slot]?.part?.id).filter(Boolean);
  return {
    ruleId: rule.id,
    severity: status,
    slots: [...(rule.slots || [])],
    partIds,
    messageAdult: text.messageAdult,
    messageKid: text.messageKid,
    ...(text.fix ? { fix: text.fix } : {}),
    sourceUrl: sourceFor(rule, data),
    sourceRef: rule.sourceRef,
  };
}

function slotFinding(slot, state, id) {
  if (state === 'unknown') {
    const copy = SLOT_UNKNOWN_COPY[slot] || GENERIC_UNKNOWN;
    return {
      ruleId: `slot-unknown-${slot}`,
      severity: 'cannot_verify',
      slots: [slot],
      partIds: [],
      messageAdult: copy.adult,
      messageKid: copy.kid,
      fix: 'Enter the model so this check can run. Until then it does not pass.',
      sourceUrl: 'https://productinfo.shimano.com/en/compatibility/C-731',
      sourceRef: 'Phase 1 rule: an owned part with no model is cannot_verify.',
    };
  }
  if (state === 'missing-id') {
    return {
      ruleId: `slot-missing-${slot}`,
      severity: 'cannot_verify',
      slots: [slot],
      partIds: id ? [id] : [],
      messageAdult: `Part id "${id}" is not in the catalog. An unknown part does not pass.`,
      messageKid: 'That part is not in our list yet, so we cannot say it fits.',
      sourceUrl: 'https://productinfo.shimano.com/en/compatibility/C-731',
      sourceRef: 'Catalog miss.',
    };
  }
  return {
    ruleId: `slot-empty-${slot}`,
    severity: 'cannot_verify',
    slots: [slot],
    partIds: [],
    messageAdult: `Choose a ${slot.replaceAll('_', ' ')} before this build can pass.`,
    messageKid: `Pick a ${slot.replaceAll('_', ' ')} and we will check it. An empty spot does not count as a fit.`,
    sourceUrl: 'https://productinfo.shimano.com/en/compatibility/C-731',
    sourceRef: 'Phase 1 rule: an empty core slot is cannot_verify.',
  };
}

function verdictOf(findings) {
  if (findings.some((finding) => finding.severity === 'incompatible')) return 'incompatible';
  if (findings.some((finding) => finding.severity === 'warning')) return 'warnings';
  if (findings.some((finding) => finding.severity === 'cannot_verify')) return 'cannot_verify';
  return 'compatible';
}

/**
 * @param {object} build
 * @param {object|object[]} catalog
 * @param {object[]|{rules: object[]}} rules
 */
export function checkBuild(build, catalog, rules) {
  const byId = indexParts(catalog);
  const ruleList = Array.isArray(rules) ? rules : (rules?.rules || []);
  const slotIds = new Set([
    ...CORE_SLOTS,
    ...SLOTS_FROM_RULES(ruleList),
    ...Object.keys(build?.slots || {}),
  ]);
  const slots = {};
  for (const slot of slotIds) {
    if (!slot) continue;
    slots[slot] = resolveSlot(build, slot, byId);
  }
  const derived = computeDerived(slots);
  const ctx = {
    slots,
    derived,
    slot: Object.fromEntries(
      Object.entries(slots).map(([slot, resolved]) => [slot, resolved.part || null])
    ),
  };
  // Paths in rules use slot.<name>.specs, so expose parts at ctx.slot.
  // readPath walks ctx, and "slot.cassette.specs" needs ctx.slot.cassette.
  const findings = [];

  for (const slot of CORE_SLOTS) {
    const resolved = slots[slot];
    if (!resolved || resolved.state === 'part' || resolved.state === 'present') continue;
    findings.push(slotFinding(slot, resolved.state, resolved.id));
  }

  const brakeSlots = ['brake_lever', 'brake_caliper', 'rotor'];
  const anyBrake = brakeSlots.some((slot) => {
    const state = slots[slot]?.state;
    return state === 'part' || state === 'unknown' || state === 'missing-id';
  });
  if (anyBrake) {
    for (const slot of brakeSlots) {
      const resolved = slots[slot];
      if (!resolved || resolved.state === 'part' || resolved.state === 'present') continue;
      findings.push(slotFinding(slot, resolved.state, resolved.id));
    }
  }

  for (const rule of ruleList) {
    if (ruleBlocked(rule, slots)) continue;
    const special = rule.predicate?.op === 'rd_max_cog' || rule.predicate?.op === 'adapter_allowed';
    const result = special ? evalSpecial(rule.predicate, ctx) : null;
    const bool = special ? null : evalBool(rule.predicate, ctx);
    let status = 'ok';
    let data = result?.data || {};
    if (special) status = result.status;
    else if (bool === 'missing') status = 'cannot_verify';
    else if (bool === true) status = rule.severity;
    if (status === 'ok') continue;
    if (status !== 'incompatible' && status !== 'warning' && status !== 'cannot_verify') status = 'cannot_verify';
    findings.push(makeFinding(rule, status, slots, derived, data));
  }

  const summary = {
    incompatible: findings.filter((finding) => finding.severity === 'incompatible').length,
    warnings: findings.filter((finding) => finding.severity === 'warning').length,
    cannot_verify: findings.filter((finding) => finding.severity === 'cannot_verify').length,
  };
  return {
    verdict: verdictOf(findings),
    findings,
    summary,
    derived,
  };
}

function SLOTS_FROM_RULES(ruleList) {
  const names = [];
  for (const rule of ruleList) {
    for (const slot of rule.slots || []) names.push(slot);
    for (const slot of rule.predicate?.slots || []) names.push(slot);
  }
  return names;
}

/**
 * Parts for one slot that do not produce an incompatible finding on that slot.
 * Warnings and cannot_verify stay in the list. A cannot_verify is not a pass,
 * and the picker should say the numbers are still open.
 */
export function filterCandidates(slot, build, catalog, rules) {
  const category = categoryForSlot(slot);
  const parts = partsList(catalog).filter((part) => part.category === category);
  return parts.filter((part) => {
    const next = {
      ...build,
      slots: { ...(build?.slots || {}), [slot]: part.id },
    };
    const result = checkBuild(next, catalog, rules);
    return !result.findings.some((finding) => finding.severity === 'incompatible' && finding.slots.includes(slot));
  });
}
