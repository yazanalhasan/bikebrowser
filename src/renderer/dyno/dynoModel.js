// Torque & power curve model + result + mission suitability for the dyno.
// Power is ALWAYS derived from torque (P[kW] = T[Nm] * RPM / 9549) — never drawn
// independently — so the curves cross naturally where d(T*RPM)/dRPM = 0.

const SAMPLES = 200;

export function buildEngineCurves(engine) {
  const torquePoints = [];
  const powerPoints = [];
  const tPeak = (engine.peakTorqueRPM - engine.idleRPM) / (engine.maxRPM - engine.idleRPM);
  const width = engine.curveParams?.torquePeakWidth ?? 0.35;

  for (let i = 0; i <= SAMPLES; i++) {
    const rpm = engine.idleRPM + (i / SAMPLES) * (engine.maxRPM - engine.idleRPM);
    const t = (rpm - engine.idleRPM) / (engine.maxRPM - engine.idleRPM);
    // skewed bell around the torque peak; floor at ~30% of peak (idle torque)
    const torqueNorm = Math.exp(-Math.pow((t - tPeak) / width, 2));
    const torque = engine.peakTorque * (0.3 + 0.7 * torqueNorm);
    torquePoints.push([rpm, torque]);
    powerPoints.push([rpm, (torque * rpm) / 9549]); // kW
  }
  return { torquePoints, powerPoints };
}

// Actual peaks read back from the computed curve (may differ slightly from config).
export function computeDynoResult(engine, curves) {
  const { torquePoints, powerPoints } = curves || buildEngineCurves(engine);
  const peakT = torquePoints.reduce((best, p) => (p[1] > best[1] ? p : best));
  const peakP = powerPoints.reduce((best, p) => (p[1] > best[1] ? p : best));
  return {
    id: engine.id,
    engine,
    name: engine.name,
    category: engine.category,
    color: engine.color,
    peakTorque: Math.round(peakT[1]),
    peakTorqueRPM: Math.round(peakT[0]),
    peakPower: Math.round(peakP[1]),
    peakPowerRPM: Math.round(peakP[0]),
    redlineRPM: engine.redlineRPM,
    bikeWeight: engine.bikeWeight,
    powerToWeight: engine.bikeWeight ? Number(((peakP[1] * 1000) / engine.bikeWeight).toFixed(1)) : null,
    torquePoints,
    powerPoints,
  };
}

export function engineSuitability(engine, mission) {
  if (!engine || !mission) return { label: 'UNSUITABLE', color: '#EF4444', icon: 'x', reason: 'No engine loaded.' };
  const powerOk = engine.peakPower >= mission.minPowerKw;
  const torqueOk = engine.peakTorque >= mission.minTorqueNm;
  const rpmOk = mission.minPeakTorqueRPM ? engine.peakTorqueRPM <= mission.minPeakTorqueRPM : true;

  if (powerOk && torqueOk && rpmOk) {
    const light = engine.bikeWeight && engine.bikeWeight <= 130 ? ' Low weight aids agility.' : '';
    return { label: 'SUITABLE', color: '#22C55E', icon: 'check', reason: `Meets the ${mission.name.toLowerCase()} power, torque and delivery targets.${light}` };
  }
  if ((powerOk || torqueOk) && rpmOk) {
    const lack = !powerOk ? `power ${engine.peakPower}kW below ${mission.minPowerKw}kW` : `torque ${engine.peakTorque}Nm below ${mission.minTorqueNm}Nm`;
    return { label: 'MARGINAL', color: '#EAB308', icon: 'warn', reason: `Workable but ${lack} for ${mission.name.toLowerCase()} — limited margin.` };
  }
  if (!rpmOk) return { label: 'UNSUITABLE', color: '#EF4444', icon: 'x', reason: `Peak torque at ${engine.peakTorqueRPM} RPM is too high/peaky for ${mission.name.toLowerCase()} (wants ≤ ${mission.minPeakTorqueRPM}).` };
  return { label: 'UNSUITABLE', color: '#EF4444', icon: 'x', reason: `Both power (${engine.peakPower}kW) and torque (${engine.peakTorque}Nm) fall short for ${mission.name.toLowerCase()}.` };
}

export function redlineZone(engine) {
  return { xStart: engine.redlineRPM, xEnd: engine.maxRPM, color: 'rgba(239,68,68,0.18)', label: 'Redline' };
}

export function dynoAnnotations(result) {
  return [
    { label: `Peak Torque ${result.peakTorque} Nm`, x: result.peakTorqueRPM, y: result.peakTorque, yAxis: 'left', color: '#E8A020' },
    { label: `Peak Power ${result.peakPower} kW`, x: result.peakPowerRPM, y: result.peakPower, yAxis: 'right', color: '#4ea1ff' },
    { label: `Redline ${result.redlineRPM}`, x: result.redlineRPM, y: result.peakPower * 0.9, yAxis: 'right', color: '#EF4444' },
  ];
}
