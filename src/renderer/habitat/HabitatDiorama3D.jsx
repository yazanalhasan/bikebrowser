import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, OrbitControls, Text } from '@react-three/drei';
import { Color } from 'three';

// A planted species/material that grows upright (thrives) or wilts/browns
// (struggles) under the site. Reads dioRef {grow, thrives, decided, t}.
function Planted({ vis, dioRef }) {
  const group = useRef();
  const healthy = useRef(new Color(vis?.color || '#5b7d3a')).current;
  const wilted = useRef(new Color('#b08a3a')).current;
  const mat = useRef();
  useFrame(() => {
    const s = dioRef?.current; const g = group.current; if (!s || !g) return;
    const grow = s.grow || 0;
    const ok = s.thrives;
    g.scale.set(1, ok ? 0.4 + grow * 0.6 : 0.4 + grow * 0.2, 1);
    g.rotation.z = !ok && s.decided ? grow * 0.5 : 0; // droop when struggling
    if (mat.current) mat.current.color.copy(ok ? healthy : healthy.clone().lerp(wilted, s.decided ? grow : 0));
  });
  const form = vis?.form || 'shrub';
  return (
    <group ref={group} position={[0, 0, 0]}>
      {form === 'tree' && (<>
        <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.08, 0.12, 1.0, 8]} /><meshStandardMaterial color="#6b4a2a" /></mesh>
        <mesh position={[0, 1.2, 0]}><sphereGeometry args={[0.55, 16, 14]} /><meshStandardMaterial ref={mat} /></mesh>
      </>)}
      {form === 'shrub' && (<>
        <mesh position={[0, 0.5, 0]}><sphereGeometry args={[0.5, 14, 12]} /><meshStandardMaterial ref={mat} /></mesh>
        <mesh position={[0.3, 0.35, 0.1]}><sphereGeometry args={[0.3, 12, 10]} /><meshStandardMaterial color="#7d8a55" /></mesh>
      </>)}
      {form === 'cactus' && (<>
        <mesh position={[0, 0.8, 0]}><cylinderGeometry args={[0.18, 0.22, 1.6, 12]} /><meshStandardMaterial ref={mat} /></mesh>
        <mesh position={[0.25, 1.0, 0]} rotation={[0, 0, -0.5]}><cylinderGeometry args={[0.08, 0.1, 0.5, 8]} /><meshStandardMaterial color="#3f7d52" /></mesh>
      </>)}
      {form === 'post' && (<>
        <mesh position={[0, 0.8, 0]}><boxGeometry args={[0.22, 1.6, 0.22]} /><meshStandardMaterial ref={mat} metalness={0.5} roughness={0.4} /></mesh>
      </>)}
    </group>
  );
}

const THEME = {
  wash: { ground: '#cdb88c', sky: '#e7eef3', river: null },
  salt_river: { ground: '#d8cdb0', sky: '#dfeaf0', river: '#4A90D9' },
};

export default function HabitatDiorama3D({ theme = 'wash', option, conditions = [], dioRef }) {
  const th = THEME[theme] || THEME.wash;
  return (
    <group>
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 8, 5]} intensity={1.1} castShadow />
      <pointLight position={[3, 4, 2]} intensity={0.3} color="#fde9a0" />
      <OrbitControls enableDamping dampingFactor={0.08} target={[0, 0.8, 0]} minDistance={3} maxDistance={9} maxPolarAngle={Math.PI / 2.05} />

      {/* ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[16, 16]} /><meshStandardMaterial color={th.ground} /></mesh>
      {theme === 'salt_river' && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -3]}><planeGeometry args={[16, 4]} /><meshStandardMaterial color={th.river} transparent opacity={0.75} /></mesh>}
      {theme === 'salt_river' && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 1.5]}><planeGeometry args={[16, 3]} /><meshStandardMaterial color="#eef0e8" transparent opacity={0.5} /></mesh>}

      {/* sun */}
      <mesh position={[3.5, 3.5, -4]}><sphereGeometry args={[0.5, 16, 16]} /><meshBasicMaterial color="#ffe7a0" /></mesh>

      {option && <Planted key={option.id} vis={option.vis} dioRef={dioRef} />}

      <Billboard position={[0, 2.7, 0]}><Text fontSize={0.22} color="#33414f" anchorX="center" maxWidth={5} textAlign="center">{conditions.join('  ·  ')}</Text></Billboard>
    </group>
  );
}
