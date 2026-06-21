// Skate Park obstacle catalog (Phase 2 — data only; riding scene is Phase 3).
//
// Data-driven per arc.md §4 (Skate Park System): every obstacle is an object; no
// hardcoded layouts, no hardcoded behavior. `material` reuses act1Materials ids so a
// steel rail and a concrete quarter-pipe behave under the SAME schema the UTM and
// Construction System already speak (the carry-forward contract). `surfaceFriction`
// is the carry-forward EXTENSION the materials schema lacked (grip for riding) — a
// per-obstacle surface field, not a fork of the material data.
//
// Fields (per directive): id, type, displayName, width, height, radius, angle,
// material, surfaceFriction, difficulty, educationalTags, connectionPoints, spriteKey.
// educationalTags map to the arc.md educational ladder (Grade 2 distance/speed →
// Grade 4 systems/trajectories) so reasoning quests can target a concept by tag.

export const SKATEPARK_OBSTACLES = [
  {
    id: 'launch_ramp_s', type: 'ramp', displayName: 'Small Launch Ramp',
    width: 96, height: 34, radius: 0, angle: 25, material: 'pine', surfaceFriction: 0.55,
    difficulty: 1, educationalTags: ['trajectory', 'launch_angle', 'velocity', 'distance'],
    connectionPoints: ['in_low', 'out_air'], spriteKey: 'skate.ramp.launch_s',
  },
  {
    id: 'quarter_pipe', type: 'transition', displayName: 'Quarter Pipe',
    width: 120, height: 80, radius: 80, angle: 90, material: 'concrete', surfaceFriction: 0.70,
    difficulty: 2, educationalTags: ['curvature', 'centripetal', 'momentum', 'angles'],
    connectionPoints: ['in_low', 'out_air', 'out_low'], spriteKey: 'skate.transition.quarter',
  },
  {
    id: 'low_rail', type: 'rail', displayName: 'Low Rail',
    width: 140, height: 10, radius: 0, angle: 0, material: 'steel', surfaceFriction: 0.20,
    difficulty: 2, educationalTags: ['balance', 'center_of_mass', 'friction'],
    connectionPoints: ['in_low', 'out_low'], spriteKey: 'skate.rail.low',
  },
  {
    id: 'grind_box', type: 'rail', displayName: 'Grind Box',
    width: 120, height: 28, radius: 0, angle: 0, material: 'steel', surfaceFriction: 0.25,
    difficulty: 1, educationalTags: ['balance', 'friction', 'edges'],
    connectionPoints: ['in_low', 'out_low', 'on_top'], spriteKey: 'skate.box.grind',
  },
  {
    id: 'manual_pad', type: 'pad', displayName: 'Manual Pad',
    width: 160, height: 18, radius: 0, angle: 0, material: 'concrete', surfaceFriction: 0.60,
    difficulty: 1, educationalTags: ['balance', 'center_of_mass', 'distance'],
    connectionPoints: ['in_low', 'out_low', 'on_top'], spriteKey: 'skate.pad.manual',
  },
  {
    id: 'pump_segment', type: 'pump', displayName: 'Pump Track Segment',
    width: 140, height: 40, radius: 60, angle: 0, material: 'pine', surfaceFriction: 0.50,
    difficulty: 2, educationalTags: ['momentum', 'energy_transfer', 'pumping', 'systems'],
    connectionPoints: ['in_low', 'out_low'], spriteKey: 'skate.pump.segment',
  },
];

export function obstacleById(id) {
  return SKATEPARK_OBSTACLES.find((o) => o.id === id) || null;
}
