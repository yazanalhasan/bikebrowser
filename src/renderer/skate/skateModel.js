// Projectile physics for the skate-park launch trainer. Mirrors the in-game
// SkateScene constants: ramps convert approach SPEED into a launch arc, and a
// hard landing bails. Teaches range = v²·sin(2θ)/g and the 45° optimum.
export const GRAVITY = 900;     // px/s² (matches SkateScene)
export const FAIL_VY = 560;     // land faster than this → bail
export const GAP = { start: 84, end: 132 }; // clean landing ramp zone (px), reachable at the default 300 px/s, 45deg jump

export function launch(speed, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  const vx = speed * Math.cos(rad);
  const vy = speed * Math.sin(rad);
  const tFlight = (2 * vy) / GRAVITY;
  const range = vx * tFlight;
  const apex = (vy * vy) / (2 * GRAVITY);
  const landingVy = vy; // symmetric landing onto same height
  const traj = [];
  const N = 48;
  for (let i = 0; i <= N; i++) {
    const t = (tFlight * i) / N;
    traj.push([Number((vx * t).toFixed(1)), Number(Math.max(0, vy * t - 0.5 * GRAVITY * t * t).toFixed(1))]);
  }
  return { vx, vy, tFlight, range, apex, landingVy, traj };
}

export function skateResult(speed, angleDeg) {
  const k = launch(speed, angleDeg);
  let rating;
  if (k.range < GAP.start) rating = rate('UNSUITABLE', `Cased it — you came up short (${k.range.toFixed(0)} px, gap starts at ${GAP.start}). Not enough range: carry more speed, or angle nearer 45° where range peaks.`);
  else if (k.range > GAP.end) rating = rate('UNSUITABLE', `Overshot the landing ramp (${k.range.toFixed(0)} px past ${GAP.end}). Too much carry — ease off the speed or steepen past 45° to pull the range back in.`);
  else if (k.landingVy > FAIL_VY) rating = rate('MARGINAL', `You reach the ramp but land hard (${k.landingVy.toFixed(0)} px/s > ${FAIL_VY}). A steep, fast launch drops you in fast — flatten the angle to soften the landing.`);
  else rating = rate('SUITABLE', `Stomped it — landed in the ramp zone at a clean ${k.landingVy.toFixed(0)} px/s. Range ${k.range.toFixed(0)} px, apex ${k.apex.toFixed(0)} px. Speed and angle balanced.`);
  return { speed, angleDeg, ...k, rating };
}

function rate(label, reason) {
  const color = label === 'SUITABLE' ? '#22C55E' : label === 'MARGINAL' ? '#EAB308' : '#EF4444';
  return { label, color, icon: label === 'SUITABLE' ? 'check' : label === 'MARGINAL' ? 'warn' : 'x', reason };
}
