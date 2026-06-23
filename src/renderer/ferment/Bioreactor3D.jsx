import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Line, OrbitControls, Text } from '@react-three/drei';
import { Color } from 'three';

function Label({ text, at, to }) {
  return (
    <group>
      <Line points={[to, at]} color="#94a3b8" lineWidth={1} dashed dashSize={0.05} gapSize={0.04} />
      <Billboard position={at}><Text fontSize={0.13} color="#1e293b" anchorX="center" anchorY="middle">{text}</Text></Billboard>
    </group>
  );
}

// Glass bioreactor: liquid fills as OD rises, impeller stirs, bubbles when
// aerated. Reads reactorRef {fill (0..1), stir, bubbling, t}.
export default function Bioreactor3D({ organism, substrate, reactorRef }) {
  const liquid = useRef();
  const impeller = useRef();
  const bubbles = useRef([]);
  const glow = useRef();
  const subColor = new Color(substrate?.color || '#f5f0dc');
  const orgColor = new Color(organism?.color || '#d4a017');

  useFrame((_, delta) => {
    const s = reactorRef?.current; if (!s) return;
    const fill = 0.1 + (s.fill || 0) * 1.5;
    if (liquid.current) {
      liquid.current.scale.y = Math.max(0.05, fill / 2.2);
      liquid.current.position.y = -1.0 + (fill) / 2;
      liquid.current.material.color.copy(subColor.clone().lerp(orgColor, s.fill || 0));
    }
    if (glow.current) glow.current.intensity = 0.15 + (s.fill || 0) * 0.5;
    if (impeller.current && s.stir) impeller.current.rotation.y += delta * 3;
    bubbles.current.forEach((b, i) => {
      if (!b) return; b.visible = !!s.bubbling;
      if (s.bubbling) { b.position.y += delta * (0.6 + (i % 3) * 0.2); if (b.position.y > -1.0 + fill) b.position.y = -1.6; }
    });
  });

  return (
    <group>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 3]} intensity={1.2} />
      <pointLight ref={glow} position={[0, 0, 0]} intensity={0.2} color={organism?.color || '#d4a017'} distance={3} />
      <OrbitControls enableDamping dampingFactor={0.08} target={[0, 0, 0]} minDistance={3.5} maxDistance={9} maxPolarAngle={Math.PI / 2.05} />

      {/* bench */}
      <mesh position={[0, -1.75, 0]}><boxGeometry args={[4, 0.15, 2]} /><meshStandardMaterial color="#d6dbe2" /></mesh>

      {/* heating jacket */}
      <mesh position={[0, -0.6, 0]}><cylinderGeometry args={[0.72, 0.72, 1.6, 32]} /><meshPhysicalMaterial color="#add8e6" transparent opacity={0.25} roughness={0.1} transmission={0.5} /></mesh>

      {/* vessel */}
      <mesh position={[0, 0, 0]}><cylinderGeometry args={[0.6, 0.6, 2.2, 40]} /><meshPhysicalMaterial color="#c8e6f5" transparent opacity={0.22} roughness={0.05} transmission={0.85} thickness={0.5} /></mesh>
      {/* liquid */}
      <mesh ref={liquid} position={[0, -0.9, 0]}><cylinderGeometry args={[0.55, 0.55, 2.2, 36]} /><meshStandardMaterial color={substrate?.color || '#f5f0dc'} transparent opacity={0.9} /></mesh>

      {/* impeller */}
      <group ref={impeller} position={[0, -0.5, 0]}>
        <mesh><cylinderGeometry args={[0.03, 0.03, 1.4, 12]} /><meshStandardMaterial color="#bbb" metalness={0.9} roughness={0.2} /></mesh>
        {[0, 1, 2].map((i) => <mesh key={i} rotation={[0, (i * Math.PI) / 3, 0]}><boxGeometry args={[0.5, 0.06, 0.12]} /><meshStandardMaterial color="#ccc" metalness={0.9} roughness={0.2} /></mesh>)}
      </group>

      {/* sparger ring */}
      <mesh position={[0, -1.0, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.25, 0.02, 12, 32]} /><meshStandardMaterial color="#444" metalness={0.7} /></mesh>
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh key={i} ref={(el) => { bubbles.current[i] = el; }} position={[(i % 5 - 2) * 0.12, -1.5, (Math.floor(i / 5) - 0.5) * 0.2]} visible={false}><sphereGeometry args={[0.03, 8, 8]} /><meshStandardMaterial color="#fff" transparent opacity={0.6} /></mesh>
      ))}

      {/* probes */}
      <mesh position={[0.2, 0.9, 0]}><cylinderGeometry args={[0.03, 0.03, 0.9, 12]} /><meshStandardMaterial color="#f5a623" /></mesh>
      <mesh position={[-0.2, 0.9, 0]}><cylinderGeometry args={[0.03, 0.03, 0.9, 12]} /><meshStandardMaterial color="#a8d8ea" /></mesh>

      <Label text="Bioreactor" at={[1.2, 0.4, 0.4]} to={[0.6, 0.2, 0]} />
      <Label text="pH probe" at={[1.0, 1.3, 0.3]} to={[0.2, 1.2, 0]} />
      <Label text="Sparger" at={[-1.1, -1.0, 0.4]} to={[-0.25, -1.0, 0]} />
    </group>
  );
}
