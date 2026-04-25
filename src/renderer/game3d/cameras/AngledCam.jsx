import { useRef, useEffect } from 'react';
import { PerspectiveCamera } from '@react-three/drei';

// Pseudo-3/4 view (Zelda 2 / Faxanadu / classic JRPG).
// Camera is elevated and pulled back, looking down at the target
// at angleDeg from horizontal. Default 30° reads as "angled overhead"
// without flattening into pure top-down.
export default function AngledCam({
  target = [0, 0, 0],
  distance = 14,
  angleDeg = 30,
  fov = 45,
}) {
  const ref = useRef();
  const angleRad = (angleDeg * Math.PI) / 180;
  const dy = distance * Math.sin(angleRad);
  const dz = distance * Math.cos(angleRad);
  const position = [target[0], target[1] + dy, target[2] + dz];

  useEffect(() => {
    if (ref.current) ref.current.lookAt(target[0], target[1], target[2]);
  }, [target]);

  return <PerspectiveCamera ref={ref} makeDefault position={position} fov={fov} />;
}
