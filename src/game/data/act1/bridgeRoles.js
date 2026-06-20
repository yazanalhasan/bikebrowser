// Phase 2A — role-based material logic for the truss bridge.
//
// Before this, every load-bearing role validated against one overall flag
// (`bridgeSafe`), so "steel everywhere" was trivially optimal and concrete/brick
// were marked universally bad — hiding the real lesson. Now each role cares about
// ONE property a child can name, and the verdict explains WHY:
//   • deck       — must be STIFF so it does not sag       (elasticity)
//   • support    — a column SQUEEZED from above           (compressiveStrength)
//   • brace      — the triangle's diagonal must be STRONG (strength)
//   • cable      — holds the deck up by PULLING           (tensileStrength)
//   • foundation — SQUEEZED into the ground               (compressiveStrength)
//
// The centrepiece inversion: concrete/brick are GREAT foundations (high
// compression) but TERRIBLE cables (weak in tension) — "one number cannot tell
// the whole story." Thresholds are generous so several materials fit each role
// (kid-friendly; never a dead end); the teaching materials (balsa too floppy,
// concrete/brick weak-in-tension) are the clear edges.
//
// Values are the normalized 0..1 fields already on each act1 material
// (elasticity = stiffness/10, tensileStrength, compressiveStrength) plus a
// normalized strength (strength/10). No new physics, no rotation — just which
// measured property matters for which job.

export const ROLE_REQUIREMENTS = {
  deck: {
    prop: 'elasticity', min: 0.40, needs: 'stiffness',
    good: 'stiff enough not to sag', bad: 'too bendy — it would sag under you',
    why: 'A deck must be STIFF so it does not sag when you ride across.',
  },
  support: {
    prop: 'compressiveStrength', min: 0.50, needs: 'compression strength',
    good: 'strong when squeezed', bad: 'crushes under the load',
    why: 'Supports are columns — they carry the load straight DOWN, so they must resist being squeezed.',
  },
  brace: {
    prop: 'strengthNorm', min: 0.50, needs: 'strength',
    good: 'strong enough to hold the triangle', bad: 'too weak to hold the triangle',
    why: 'The diagonal brace turns a wobbly rectangle into a stiff triangle — it has to be strong.',
  },
  cable: {
    prop: 'tensileStrength', min: 0.50, needs: 'tension strength',
    good: 'strong when pulled', bad: 'tears apart when pulled',
    why: 'Cables hold the deck up by PULLING — they need tension strength. Hard things like concrete are weak when pulled.',
  },
  foundation: {
    prop: 'compressiveStrength', min: 0.50, needs: 'compression strength',
    good: 'strong when squeezed', bad: 'cracks under the weight',
    why: 'Foundations are SQUEEZED into the ground — they need compression strength. This is where concrete and brick shine.',
  },
};

// The role-relevant measured value for a material (0..1), or null if unknown.
export function materialRoleValue(material, roleKey) {
  const req = ROLE_REQUIREMENTS[roleKey];
  if (!material || !req) return null;
  if (req.prop === 'strengthNorm') return (material.strength ?? 0) / 10;
  return material[req.prop] ?? 0;
}

// Does this material fit this role? Returns { fits, value, req }.
export function roleFit(material, roleKey) {
  const req = ROLE_REQUIREMENTS[roleKey];
  if (!req) return { fits: true, value: null, req: null };
  const value = materialRoleValue(material, roleKey);
  return { fits: value != null && value >= req.min, value, req };
}
