import { Physics } from '@react-three/rapier';

// Thin wrapper around @react-three/rapier's <Physics> root. Centralizes
// world defaults (gravity, etc.) so individual scenes don't all
// re-declare them, and so downstream tweaks (substeps, allowSleep,
// interpolate, collider-defaults) live in exactly one place.
//
// Gravity is the standard real-world value [-9.81 m/s^2 on Y]. Bike
// physics will likely override this per-scene (lower gravity for
// arcade-y feel) but the proof-of-life ground starts realistic.
//
// `debug` is forwarded straight through — usePhysicsDebug() drives it
// from Game3D so a dev shortcut can flip the visualizer on without
// editing source.
export default function PhysicsWorld({
  children,
  gravity = [0, -9.81, 0],
  debug = false,
  ...rest
}) {
  return (
    <Physics gravity={gravity} debug={debug} {...rest}>
      {children}
    </Physics>
  );
}
