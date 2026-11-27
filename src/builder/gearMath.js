/**
 * Gear ratio and gear inches.
 *
 * gear ratio = chainring teeth / cog teeth
 * gear inches = gear ratio × wheel diameter in inches
 *
 * Diameters are nominal teaching values, not a measured tire. A wider tire
 * is a little taller, so the real number on the bike can differ. When a
 * tooth count or the wheel size is missing, the result is cannot_verify.
 */

export const WHEEL_SIZES = {
  '26': {
    inches: 26,
    label: '26 inch',
    note: 'Nominal 26 inch wheel. A different tire height changes the real gear inches.',
  },
  '27.5': {
    inches: 27.5,
    label: '27.5 inch',
    note: 'Nominal 27.5 inch (650b) wheel.',
  },
  '29': {
    inches: 29,
    label: '29 inch',
    note: 'Nominal 29 inch wheel.',
  },
  '700c': {
    inches: 26.7,
    label: '700c',
    note: '622 mm rim plus a 28 mm tire, about 26.7 inches. A wider tire is a little taller.',
  },
};

function finiteTeeth(values) {
  if (!Array.isArray(values)) return [];
  return values.map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0);
}

/**
 * @param {{ chainrings?: number[], cogs?: number[], wheelSize?: string }} input
 */
export function gearRange(input) {
  const chainrings = finiteTeeth(input?.chainrings);
  const cogs = finiteTeeth(input?.cogs);
  const wheel = input?.wheelSize ? WHEEL_SIZES[input.wheelSize] : null;
  const missing = [];
  if (chainrings.length === 0) missing.push('chainring teeth');
  if (cogs.length === 0) missing.push('cassette cogs');
  if (!wheel) missing.push('wheel size');
  if (missing.length > 0) {
    return {
      status: 'cannot_verify',
      missing,
      messageKid: `Add ${missing.join(' and ')} and we can show the easy gear and the hard gear.`,
      messageAdult: `Gear range needs ${missing.join(', ')}. Nominal wheel diameters are teaching values.`,
    };
  }

  const combos = [];
  for (const ring of chainrings) {
    for (const cog of cogs) {
      const ratio = ring / cog;
      combos.push({
        chainring: ring,
        cog,
        ratio,
        gearInches: ratio * wheel.inches,
      });
    }
  }
  combos.sort((a, b) => a.ratio - b.ratio);
  const low = combos[0];
  const high = combos[combos.length - 1];
  return {
    status: 'ok',
    wheelSize: input.wheelSize,
    wheelInches: wheel.inches,
    wheelNote: wheel.note,
    low,
    high,
    combos,
  };
}

export function formatGear(combo) {
  if (!combo) return '';
  return `${combo.chainring}÷${combo.cog} = ${combo.ratio.toFixed(2)} (${combo.gearInches.toFixed(1)} gear inches)`;
}
