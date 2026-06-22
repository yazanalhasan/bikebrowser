// Small easing/interp helpers — used in place of @react-spring for the
// useFrame-driven test timeline (dependency-free, identical smoothness).
export const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
// Map a global t (0..1) into a phase-local 0..1 over [start,end].
export const phase = (t, start, end) => clamp((t - start) / (end - start));
