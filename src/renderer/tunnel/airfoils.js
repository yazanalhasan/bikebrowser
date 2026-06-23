// Airfoil configs. Section geometry is generated from the NACA 4-digit formula
// (no coordinate tables needed); aero params drive the lift/drag curves.
export function naca4(m, p, t, chord = 2, n = 64) {
  const upper = []; const lower = [];
  for (let i = 0; i <= n; i++) {
    const x = i / n;
    const yt = 5 * t * (0.2969 * Math.sqrt(x) - 0.1260 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1015 * x ** 4);
    let yc = 0; let dyc = 0;
    if (m > 0 && p > 0) {
      if (x < p) { yc = (m / (p * p)) * (2 * p * x - x * x); dyc = (2 * m / (p * p)) * (p - x); }
      else { yc = (m / ((1 - p) ** 2)) * ((1 - 2 * p) + 2 * p * x - x * x); dyc = (2 * m / ((1 - p) ** 2)) * (p - x); }
    }
    const th = Math.atan(dyc);
    upper.push([(x - yt * Math.sin(th)) * chord, (yc + yt * Math.cos(th)) * chord]);
    lower.push([(x + yt * Math.sin(th)) * chord, (yc - yt * Math.cos(th)) * chord]);
  }
  return { upper, lower };
}

export const AIRFOILS = [
  { id: 'naca2412', name: 'NACA 2412 (General)', color: '#1A1A2E', m: 0.02, p: 0.4, t: 0.12, aero: { zeroLift: -2, slope: 0.1, stall: 15, cdMin: 0.006, cdInduced: 0.005 } },
  { id: 'naca0012', name: 'NACA 0012 (Symmetric)', color: '#556070', m: 0, p: 0, t: 0.12, aero: { zeroLift: 0, slope: 0.1, stall: 14, cdMin: 0.006, cdInduced: 0.006 } },
  { id: 'naca4415', name: 'NACA 4415 (High-Lift)', color: '#AA6622', m: 0.04, p: 0.4, t: 0.15, aero: { zeroLift: -4, slope: 0.105, stall: 16, cdMin: 0.009, cdInduced: 0.006 } },
];
export const getAirfoilById = (id) => AIRFOILS.find((a) => a.id === id) || AIRFOILS[0];
