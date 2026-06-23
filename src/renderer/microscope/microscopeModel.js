// A structure resolves when magnification is high enough AND (if it needs a
// stain) the correct stain has been applied.
export function resolveSlide(slide, stain, mag) {
  const stained = stain && stain !== 'none' && slide.goodStains.includes(stain);
  const resolved = slide.structures.filter((st) => mag >= st.minMag && (!st.needsStain || stained));
  return { stained, resolved, total: slide.structures.length };
}

export function microscopeResult(slide, stain, mag) {
  const { stained, resolved, total } = resolveSlide(slide, stain, mag);
  const ids = resolved.map((r) => r.id);
  const missing = slide.structures.filter((st) => !ids.includes(st.id));
  let rating;
  if (resolved.length === total) rating = rate('SUITABLE', `Fully resolved: all ${total} structures of ${slide.name} are visible at ${mag}×${stained ? ` with ${stainLabel(stain)}` : ''}. A textbook view.`);
  else if (resolved.length >= Math.ceil(total / 2)) rating = rate('MARGINAL', `Partly resolved: ${resolved.length}/${total} visible. Missing ${missing.map((m) => m.label).join(', ')} — ${missing.some((m) => m.needsStain && !stained) ? 'apply the correct stain' : 'increase magnification'}.`);
  else rating = rate('UNSUITABLE', `Poorly resolved: only ${resolved.length}/${total} visible. ${mag < 40 ? 'Magnification too low' : 'Wrong/absent stain'} — fine structures stay invisible.`);
  return { slide, stain, mag, stained, resolved, missing, count: resolved.length, total, rating };
}

function stainLabel(stain) { return stain; }
function rate(label, reason) {
  const color = label === 'SUITABLE' ? '#22C55E' : label === 'MARGINAL' ? '#EAB308' : '#EF4444';
  return { label, color, icon: label === 'SUITABLE' ? 'check' : label === 'MARGINAL' ? 'warn' : 'x', reason };
}
