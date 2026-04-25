import { useRef, useEffect } from 'react';
import { PerspectiveCamera } from '@react-three/drei';

// Top-down view (Zelda 1 overworld / world map).
// Camera is straight up from the target. The `up` axis is set to
// -Z so "north" on the world reads as "up" on the screen instead of
// the default behavior of looking-down rotating the orientation.
export default function TopCam({
  target = [0, 0, 0],
  distance = 14,
  fov = 40,
}) {
  const ref = useRef();
  const position = [target[0], target[1] + distance, target[2]];

  useEffect(() => {
    if (!ref.current) return;
    ref.current.up.set(0, 0, -1);
    ref.current.lookAt(target[0], target[1], target[2]);
  }, [target]);

  return <PerspectiveCamera ref={ref} makeDefault position={position} fov={fov} />;
}
