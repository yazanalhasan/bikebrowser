import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';

// Top-down view (Zelda 1 overworld / world map).
// Camera is straight up from the target. The `up` axis is set to
// -Z so "north" on the world reads as "up" on the screen instead of
// the default behavior of looking-down rotating the orientation.
//
// Provide either `target` (static [x,y,z]) or `targetRef` (ref to a
// THREE.Vector3-like). targetRef wins; when present, the camera
// updates every frame and follows the ref.
export default function TopCam({
  targetRef,
  target = [0, 0, 0],
  distance = 14,
  fov = 40,
}) {
  const ref = useRef();

  // Set the up vector once on mount so the lookAt orientation is
  // consistent across frames.
  useEffect(() => {
    if (ref.current) ref.current.up.set(0, 0, -1);
  }, []);

  useFrame(() => {
    if (!ref.current) return;
    const tx = targetRef?.current?.x ?? target[0];
    const ty = targetRef?.current?.y ?? target[1];
    const tz = targetRef?.current?.z ?? target[2];
    ref.current.position.set(tx, ty + distance, tz);
    ref.current.lookAt(tx, ty, tz);
  });

  return <PerspectiveCamera ref={ref} makeDefault fov={fov} />;
}
