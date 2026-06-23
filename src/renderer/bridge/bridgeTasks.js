// Structural-role thresholds for the bridge, on the game's relative 0–10 stress
// scale (same scale as UTM material.UTS / yieldStrength). Mirrors the UTM build
// tasks so the suitability logic (utm/suitability.js) can be reused per role.
export const BRIDGE_TASKS = {
  deck: {
    id: 'deck',
    name: 'Deck',
    minYieldStrength: 3,
    minUTS: 4.5,
    emphasis: 'tension',
    blurb: 'Resists bending under the rolling load — needs stiffness and moderate strength.',
  },
  cables: {
    id: 'cables',
    name: 'Cables',
    minYieldStrength: 5,
    minUTS: 7.5,
    emphasis: 'tension',
    blurb: 'Pure tension members — need very high pull strength. Brittle/compression-only materials fail here.',
  },
  towers: {
    id: 'towers',
    name: 'Towers',
    minYieldStrength: 3.5,
    minUTS: 5,
    emphasis: 'compression',
    blurb: 'Carry compressive load from the cables — need compressive strength and stiffness.',
  },
};

export const STRUCTURAL_ROLES = ['deck', 'cables', 'towers'];
export const DEFAULT_ROLE_MATERIALS = { deck: 'steel', cables: 'carbon_fiber', towers: 'iron' };
