import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';

// Pseudo-3/4 view (Zelda 2 / Faxanadu / classic JRPG).
// Camera is elevated and pulled back, looking down at the target
// at angleDeg from horizontal. Default 30° reads as "angled overhead"
// without flattening into pure top-down.
//
// Two ways to provide the look-at target:
//   - `target`    : static [x,y,z] tuple (default [0,0,0])
//   - `targetRef` : a React ref whose .current is a THREE.Vector3-like
//                   object with x/y/z fields. When provided, the camera
//                   updates each frame via useFrame and follows the ref.
//
// targetRef wins over target when both are provided.
export default function AngledCam({
  targetRef,
  target = [0, 0, 0],
  distance = 14,
  angleDeg = 30,
  fov = 45,
}) {
  const ref = useRef();
  const angleRad = (angleDeg * Math.PI) / 180;
  const dy = distance * Math.sin(angleRad);
  const dz = distance * Math.cos(angleRad);

  useFrame(() => {
    if (!ref.current) return;
    const tx = targetRef?.current?.x ?? target[0];
    const ty = targetRef?.current?.y ?? target[1];
    const tz = targetRef?.current?.z ?? target[2];
    ref.current.position.set(tx, ty + dy, tz + dz);
    ref.current.lookAt(tx, ty, tz);
  });

  return <PerspectiveCamera ref={ref} makeDefault fov={fov} />;
}
