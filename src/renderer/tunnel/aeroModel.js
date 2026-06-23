// Thin-airfoil-theory lift/drag with an empirical post-stall drop, per the spec.
const d2r = (d) => (d * Math.PI) / 180;

export function getAeroCoeffs(airfoil, aoa) {
  const { zeroLift, slope, stall, cdMin, cdInduced } = airfoil.aero;
  let CL;
  if (aoa <= stall) {
    CL = slope * (aoa - zeroLift);
  } else {
    const over = aoa - stall;
    const peak = slope * (stall - zeroLift);
    CL = peak * Math.exp(-0.3 * over) * Math.cos(d2r(over * 4));
  }
  let CD = cdMin + cdInduced * CL * CL;
  if (aoa > stall) CD += 0.015 * Math.pow(aoa - stall, 1.5);
  CL = Math.max(-0.6, Math.min(2.2, CL));
  CD = Math.max(0, Math.min(0.6, CD));
  return { CL: Number(CL.toFixed(3)), CD: Number(CD.toFixed(4)), LD: Number((CL / Math.max(CD, 1e-4)).toFixed(1)), stalled: aoa > stall };
}

// Full curves across the AoA range for the panel.
export function buildAeroCurves(airfoil, min = -5, max = 20) {
  const cl = []; const cd = [];
  for (let a = min; a <= max + 1e-6; a += 0.5) {
    const { CL, CD } = getAeroCoeffs(airfoil, a);
    cl.push([a, CL]); cd.push([a, CD]);
  }
  return { cl, cd };
}
