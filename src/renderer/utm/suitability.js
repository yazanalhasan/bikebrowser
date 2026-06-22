// Rating logic per spec: compare material yield/UTS against the task thresholds.
// Below threshold on either → UNSUITABLE; within 15% above threshold → MARGINAL;
// comfortably above → SUITABLE. The reason string leans on the material's own
// failure-mode / notes text from act1Materials so it stays curriculum-accurate.
export const RATINGS = {
  SUITABLE: { label: 'SUITABLE', color: '#22C55E', icon: 'check' },
  MARGINAL: { label: 'MARGINAL', color: '#EAB308', icon: 'warn' },
  UNSUITABLE: { label: 'UNSUITABLE', color: '#EF4444', icon: 'x' },
};

const MARGIN = 0.15;

export function rateSuitability(material, task) {
  if (!material || !task) return { ...RATINGS.UNSUITABLE, reason: 'No material loaded.' };

  const yOk = material.yieldStrength >= task.minYieldStrength;
  const uOk = material.UTS >= task.minUTS;

  if (!yOk || !uOk) {
    const which = !uOk ? `ultimate strength ${material.UTS} below minimum ${task.minUTS}` : `yield strength ${material.yieldStrength} below minimum ${task.minYieldStrength}`;
    const tail = material.failureMode ? ` ${material.failureMode}` : '';
    return { ...RATINGS.UNSUITABLE, reason: `${cap(which)} for a ${task.name.toLowerCase()}.${tail}` };
  }

  const yMargin = (material.yieldStrength - task.minYieldStrength) / task.minYieldStrength;
  const uMargin = (material.UTS - task.minUTS) / task.minUTS;
  const tight = Math.min(yMargin, uMargin) <= MARGIN;

  if (tight) {
    return { ...RATINGS.MARGINAL, reason: `Meets the ${task.name.toLowerCase()} minimums but with little margin — acceptable with care.` };
  }

  const light = material.weight <= 3 ? ' Low weight is a bonus.' : '';
  const note = task.emphasis === 'tension' ? material.notes?.tension : material.notes?.compression;
  return { ...RATINGS.SUITABLE, reason: `Comfortably exceeds the ${task.name.toLowerCase()} requirements.${light}${note ? ` ${note}` : ''}` };
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
