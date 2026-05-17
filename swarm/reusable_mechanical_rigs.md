# Reusable Mechanical Rigs

## Purpose

This document classifies external rigging ideas for BikeBrowser's embodied mechanics lane. The goal is not to adopt a simulator wholesale. The goal is to find small, readable rig patterns that help players see force transfer, linkage movement, compression, tension, friction, and verification.

## Classification Key

- Directly reusable: can guide BikeBrowser implementation with little translation.
- Partially reusable: useful pattern, but should be reduced or adapted.
- Useful reference: good vocabulary or inspiration, not a direct implementation plan.
- Too complex: likely to pull the project toward simulation software.
- Wrong emotional fit: technically interesting but cold, industrial, or too abstract.
- Racing-oriented: prioritizes performance vehicle behavior over learning.
- Educationally useful: helps players understand a physical system.

## Findings

### Godot Skeleton2D and Bone2D Cutout Rigs

Classification: directly reusable, educationally useful.

Godot's 2D skeleton model uses a `Skeleton2D` parent and `Bone2D` hierarchy. That matches BikeBrowser's immediate needs: visible lever rotation, caliper arms, and cable endpoints can be represented as a small hierarchy of named parts. The educational value is high because the rig can expose part names and cause/effect without requiring physical simulation.

Recommended reuse:

- Use node/bone hierarchies for small articulated assemblies.
- Drive poses from a normalized mechanism state such as `brake_pull = 0.0..1.0`.
- Prefer authored/rest poses plus simple interpolation over runtime IK for phase 1.

Risk:

- Real-time IK and complex skeleton modification stacks can become performance and authoring traps.

Source: [Godot Skeleton2D documentation](https://docs.godotengine.org/cs/stable/classes/class_skeleton2d.html)

### Godot AnimationPlayer and AnimationTree

Classification: partially reusable, educationally useful.

Godot's `AnimationPlayer` can animate almost any node property, while `AnimationTree` blends animations from an `AnimationPlayer`. For BikeBrowser, the safer pattern is not a large animation graph. It is a few named animations or property tracks whose playback position is driven by a readable mechanical state.

Recommended reuse:

- Author `brake_idle`, `brake_pull`, `wheel_spin`, and `wheel_stop` as small property animations.
- Scrub or blend them from mechanical state values.
- Use animation tracks for visible motion, not hidden gameplay truth.

Risk:

- Large state-machine animation graphs can make a simple mechanical lesson hard to inspect.

Source: [Godot AnimationTree documentation](https://docs.godotengine.org/en/4.6/tutorials/animation/animation_tree.html)

### Blender Armatures, Drivers, and Constraints

Classification: partially reusable, useful reference, educationally useful.

Blender armatures and drivers are excellent for authoring visual rigs. Bike chain examples commonly use drivers so sprocket rotation controls chain movement. That is the right principle: one state value should visibly move connected parts. The exported runtime should be simpler than the Blender authoring rig.

Recommended reuse:

- Use Blender for asset authoring when a mechanism needs believable arcs or part parenting.
- Bake simple GLB animations or export separated mechanical parts.
- Preserve semantic names: `front_brake_lever`, `front_cable`, `front_caliper_left`, `front_caliper_right`, `front_wheel`.

Risk:

- Do not import a dense production rig with hidden driver logic and expect Godot gameplay code to understand it.

Sources: [Blender armatures overview](https://docs.blender.org/manual/en/2.90/animation/armatures/index.html), [Blender drivers](https://docs.blender.org/manual/en/3.0/animation/drivers/index.html), [Blender constraints](https://docs.blender.org/manual/en/4.1/animation/constraints/index.html)

### Blender Bike Chain Driver Rigs

Classification: useful reference, partially reusable, educationally useful.

Community bike-chain rig examples focus on keeping chain links synchronized with sprocket rotation. The directly useful idea is not the exact Blender setup. It is the coupling rule: crank angle advances chain phase, chain phase advances rear sprocket, and rear sprocket advances wheel rotation.

Recommended reuse:

- Render the chain as a looped texture, repeated sprites, or a small set of animated chain segments.
- Exaggerate chain tension and slack states for readability.
- Couple crank, chain, sprocket, and wheel through simple ratios.

Risk:

- Individual physical chain-link simulation is overkill for BikeBrowser's current educational loop.

Sources: [Blender Artists bike chain rig discussion](https://blenderartists.org/t/how-to-rig-a-bicycle-chain/581016), [Blender Stack Exchange chain animation question](https://blender.stackexchange.com/questions/188349/how-to-animate-a-bike-chain-with-a-low-poly-chainring)

### URDF Links and Joints

Classification: useful reference, too complex as runtime, educationally useful as vocabulary.

URDF describes robot models as links connected by joints. That mental model maps cleanly to levers, calipers, wheels, steering, rudders, flaps, and docking mechanisms. But importing or implementing URDF would pull BikeBrowser toward robotics middleware and simulation complexity.

Recommended reuse:

- Borrow the vocabulary: `links`, `joints`, `axes`, `limits`, `mimic`, and `transmission`.
- Keep BikeBrowser's runtime model data-native and tiny.
- Treat URDF as a reference shape for future import/export only.

Risk:

- Full URDF integration brings robotics assumptions, tooling complexity, coordinate rigor, and physics expectations that do not match the warm educational target.

Sources: [ROS urdf package documentation](https://docs.ros.org/en/rolling/p/urdf/), [Articulated Robotics URDF tutorial](https://beta.articulatedrobotics.xyz/tutorials/ready-for-ros/urdf/)

### Godot PhysicalBone and Ragdoll Systems

Classification: too complex for phase 1, useful reference.

Godot can generate physical bones and simulate ragdoll-style skeletons. That is inappropriate for the first brake prototype. The brake lesson needs deterministic, legible motion: lever moves, cable tightens, caliper closes, wheel stops. Physical bones would add instability without improving the lesson.

Recommended reuse:

- Avoid for brake and chain prototypes.
- Reconsider only for later soft suspension or crash-free toy demonstrations, and only with strict readability tests.

Source: [Godot ragdoll system documentation](https://docs.godotengine.org/en/stable/tutorials/physics/ragdoll_system.html)

### Articulated Vehicle and Racing Rigs

Classification: racing-oriented, partially reusable, wrong emotional fit when copied directly.

Vehicle rigs for racing games tend to prioritize steering feel, suspension response, tire grip, and camera dynamics. BikeBrowser can borrow visible steering and suspension concepts, but should not inherit racing-tuning priorities.

Recommended reuse:

- Reuse visible steering angles, wheel rotation, suspension compression, and brake contact.
- Ignore racing telemetry, slip curves, lap-time tuning, and high-speed handling systems.

Risk:

- Racing vocabulary shifts the emotional center from care, repair, and understanding toward performance.

### Lightweight Mechanical Rigs

Classification: directly reusable, educationally useful.

The strongest reusable direction is a small authored rig structure:

```text
MechanismRig
  parts: visible named nodes
  controls: player-facing inputs
  channels: normalized state values
  couplings: readable cause/effect mappings
  verification: visible proof that the mechanism works
```

The rig should not ask "is this physically exact?" first. It should ask "can a player see what changed at gameplay scale?"

## Recommended Adoption

For BikeBrowser, adopt the following stack:

1. A URDF-inspired but custom data model for naming parts, joints, limits, and couplings.
2. Godot node hierarchies and small animations for visible mechanism response.
3. Blender-authored visual assets when the mechanism needs polished part arcs.
4. Scripted state simulation with normalized values, not physics simulation.
5. Verification moments that prove the mechanism works through motion.

Do not adopt:

- Full URDF runtime.
- Per-link chain physics.
- Large vehicle dynamics frameworks.
- Ragdoll or physical-bone brake rigs.
- Racing suspension and tire models.

