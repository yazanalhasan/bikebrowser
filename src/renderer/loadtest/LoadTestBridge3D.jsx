import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, OrbitControls, Text } from '@react-three/drei';
import { Object3D, Color } from 'three';

const S = 0.018; // world units per model pixel

function hex(intColor) { return `#${(intColor >>> 0).toString(16).padStart(6, '0').slice(-6)}`; }

function Member({ m, bridgeRef }) {
  const ref = useRef();
  const dummy = useRef(new Object3D()).current;
  const x1 = m.x1 * S, y1 = -m.y1 * S, x2 = m.x2 * S, y2 = -m.y2 * S;
  const len = Math.hypot(x2 - x1, y2 - y1) || 0.01;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  useFrame(() => {
    const s = bridgeRef?.current; const mesh = ref.current; if (!mesh) return;
    const sag = (s?.loadT || 0) * (m.deflection || 0) * 0.012 * (m.role === 'deck' ? 1 : 0.3);
    dummy.position.set((x1 + x2) / 2, (y1 + y2) / 2 - sag, 0);
    dummy.rotation.set(0, 0, angle);
    dummy.scale.set(len, 0.09, 0.09);
    dummy.updateMatrix();
    mesh.matrix.copy(dummy.matrix); mesh.matrixAutoUpdate = false;
  });
  return (
    <mesh ref={ref}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hex(m.color)} emissive={hex(m.color)} emissiveIntensity={m.zone === 'failed' ? 0.6 : 0.12} roughness={0.5} />
    </mesh>
  );
}

// 3D truss whose members recolor by stress and the deck sags under load.
export default function LoadTestBridge3D({ members = [], scenarioLabel, bridgeRef }) {
  return (
    <group position={[0, 0.4, 0]}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 8, 6]} intensity={1.0} castShadow />
      <OrbitControls enableDamping dampingFactor={0.08} target={[0, -0.6, 0]} minDistance={4} maxDistance={12} maxPolarAngle={Math.PI / 1.9} />

      {/* abutments + ground */}
      <mesh position={[0, -2.7, 0]}><boxGeometry args={[10, 0.4, 3]} /><meshStandardMaterial color="#9b8b6e" /></mesh>
      <mesh position={[-3.0, -1.6, 0]}><boxGeometry args={[0.6, 1.8, 1.4]} /><meshStandardMaterial color="#7c6f57" /></mesh>
      <mesh position={[3.0, -1.6, 0]}><boxGeometry args={[0.6, 1.8, 1.4]} /><meshStandardMaterial color="#7c6f57" /></mesh>

      {members.map((m) => <Member key={m.id} m={m} bridgeRef={bridgeRef} />)}

      {scenarioLabel && <Billboard position={[0, 1.4, 0]}><Text fontSize={0.34} color="#1e293b" anchorX="center">{scenarioLabel}</Text></Billboard>}
    </group>
  );
}
