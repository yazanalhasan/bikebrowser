import { useRef, useEffect } from 'react';
import { PerspectiveCamera } from '@react-three/drei';

// Side-on view (Mario / Castlevania / BMX track).
// Camera is straight back from the target along +Z. Narrow FOV
// minimizes perspective distortion so the screen reads as flat 2D
// even though it's rendered in 3D.
export default function SideCam({
  target = [0, 0, 0],
  distance = 14,
  fov = 28,
}) {
  const ref = useRef();
  const position = [target[0], target[1], target[2] + distance];

  useEffect(() => {
    if (ref.current) ref.current.lookAt(target[0], target[1], target[2]);
  }, [target]);

  return <PerspectiveCamera ref={ref} makeDefault position={position} fov={fov} />;
}
