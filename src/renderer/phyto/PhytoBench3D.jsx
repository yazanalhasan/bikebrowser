import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Line, OrbitControls, Text } from '@react-three/drei';

function Label({ text, at, to, color = '#1e293b' }) {
  return (
    <group>
      {to && <Line points={[to, at]} color="#94a3b8" lineWidth={1} dashed dashSize={0.04} gapSize={0.03} />}
      <Billboard position={at}><Text fontSize={0.11} color={color} anchorX="center" anchorY="middle">{text}</Text></Billboard>
    </group>
  );
}

// Test tube rack (6 tubes that fill with assay colour), TLC plate with rising
// spots, and a spectrophotometer. Reads benchRef {fill, tlc, uv}.
export default function PhytoBench3D({ assays = [], benchRef }) {
  const liquids = useRef([]);
  const spots = useRef([]);
  const front = useRef();
  const uvGlow = useRef();
  const tubeX = (i) => -0.9 + i * 0.18;

  useFrame(() => {
    const s = benchRef?.current; if (!s) return;
    const fill = s.fill || 0;
    liquids.current.forEach((m) => { if (!m) return; m.scale.y = Math.max(0.001, fill); m.position.y = 0.55 + (fill * 0.13) / 2 - 0.065; });
    const tlc = s.tlc || 0;
    spots.current.forEach((g, i) => { if (!g) return; const rf = assays[i]?.rf || 0.3; g.position.y = -0.2 + tlc * rf * 0.36; g.visible = assays[i]?.positive; });
    if (front.current) front.current.position.y = -0.2 + tlc * 0.4;
    if (uvGlow.current) uvGlow.current.intensity = s.uv ? 1.4 : 0;
  });

  return (
    <group>
      <ambientLight intensity={0.65} />
      <directionalLight position={[3, 5, 4]} intensity={1.0} castShadow />
      <directionalLight position={[-2, 2, -1]} intensity={0.3} color="#e0f2fe" />
      <pointLight ref={uvGlow} position={[0.2, 1.1, 0.4]} color="#9333EA" intensity={0} distance={2.2} />
      <OrbitControls enableDamping dampingFactor={0.08} target={[0, 0.7, 0]} minDistance={2.6} maxDistance={7} maxPolarAngle={Math.PI / 2.1} />

      {/* bench */}
      <mesh position={[0, 0.45, 0]}><boxGeometry args={[4.2, 0.06, 1.3]} /><meshStandardMaterial color="#f0ede8" /></mesh>
      <mesh position={[0, 0.36, 0]}><boxGeometry args={[4.2, 0.12, 1.3]} /><meshStandardMaterial color="#2d1e0f" /></mesh>

      {/* test tube rack */}
      <group position={[-0.1, 0, 0]}>
        <mesh position={[0, 0.52, 0]}><boxGeometry args={[1.2, 0.08, 0.2]} /><meshStandardMaterial color="#4a3728" /></mesh>
        {assays.slice(0, 6).map((a, i) => (
          <group key={a.id} position={[tubeX(i), 0, 0]}>
            <mesh position={[0, 0.62, 0]}><cylinderGeometry args={[0.035, 0.03, 0.26, 16]} /><meshPhysicalMaterial color="#ffffff" transparent opacity={0.28} roughness={0.05} transmission={0.7} /></mesh>
            <mesh ref={(el) => { liquids.current[i] = el; }} position={[0, 0.55, 0]} scale={[1, 0.001, 1]}><cylinderGeometry args={[0.028, 0.024, 0.13, 12]} /><meshStandardMaterial color={a.color} transparent opacity={0.9} /></mesh>
          </group>
        ))}
      </group>
      <Label text="Colorimetric Rack" at={[-0.1, 1.0, 0.3]} to={[-0.1, 0.7, 0]} />

      {/* TLC plate */}
      <group position={[0.95, 0.75, 0]} rotation={[-0.08, 0, 0]}>
        <mesh><boxGeometry args={[0.34, 0.44, 0.006]} /><meshStandardMaterial color="#f5f5f0" roughness={0.9} /></mesh>
        <mesh position={[0, -0.2, 0.005]}><boxGeometry args={[0.3, 0.004, 0.006]} /><meshStandardMaterial color="#888" /></mesh>
        <mesh ref={front} position={[0, -0.2, 0.006]}><boxGeometry args={[0.3, 0.004, 0.006]} /><meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.4} /></mesh>
        {assays.slice(0, 6).map((a, i) => (
          <mesh key={a.id} ref={(el) => { spots.current[i] = el; }} position={[-0.13 + i * 0.052, -0.2, 0.008]} visible={false}><circleGeometry args={[0.016, 16]} /><meshBasicMaterial color={a.spotColor} /></mesh>
        ))}
      </group>
      <Label text="TLC Plate" at={[0.95, 1.12, 0.3]} to={[0.95, 0.95, 0]} />

      {/* spectrophotometer */}
      <group position={[-1.45, 0.6, 0]}>
        <mesh><boxGeometry args={[0.5, 0.26, 0.4]} /><meshStandardMaterial color="#1c1c1e" /></mesh>
        <mesh position={[0, 0.04, 0.201]}><planeGeometry args={[0.22, 0.12]} /><meshBasicMaterial color="#0a2e0a" /></mesh>
      </group>
      <Label text="Spectrophotometer" at={[-1.45, 1.0, 0.3]} to={[-1.45, 0.75, 0]} />
    </group>
  );
}
