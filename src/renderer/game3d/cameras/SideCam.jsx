import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';

// Side-on view (Mario / Castlevania / BMX track).
// Camera is straight back from the target along +Z. Narrow FOV
// minimizes perspective distortion so the screen reads as flat 2D
// even though it's rendered in 3D.
//
// Provide either `target` (static [x,y,z]) or `targetRef` (ref to a
// THREE.Vector3-like). targetRef wins; when present, the camera
// updates every frame and follows the ref.
export default function SideCam({
  targetRef,
  target = [0, 0, 0],
  distance = 14,
  fov = 28,
}) {
  const ref = useRef();

  useFrame(() => {
    if (!ref.current) return;
    const tx = targetRef?.current?.x ?? target[0];
    const ty = targetRef?.current?.y ?? target[1];
    const tz = targetRef?.current?.z ?? target[2];
    ref.current.position.set(tx, ty, tz + distance);
    ref.current.lookAt(tx, ty, tz);
  });

  return <PerspectiveCamera ref={ref} makeDefault fov={fov} />;
}
