import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Line, OrbitControls, Text } from '@react-three/drei';
import { Color } from 'three';

function Label({ text, at, to }) {
  return (
    <group>
      <Line points={[to, at]} color="#64748b" lineWidth={1} dashed dashSize={0.05} gapSize={0.04} />
      <Billboard position={at}><Text fontSize={0.13} color="#1e293b" anchorX="center" anchorY="middle">{text}</Text></Billboard>
    </group>
  );
}

export default function ExtractionBench3D({ plant, solvent, benchRef }) {
  const liquid = useRef();
  const bubbles = useRef([]);
  const pestle = useRef();
  const solColor = new Color(solvent?.color || '#aaccee');
  const plantColor = new Color(plant?.color || '#88aa55');

  useFrame((state, delta) => {
    const s = benchRef?.current; if (!s) return;
    if (liquid.current) liquid.current.material.color.copy(solColor.clone().lerp(plantColor, s.mix || 0));
    if (pestle.current && s.grinding) pestle.current.rotation.y += delta * 3;
    bubbles.current.forEach((b, i) => {
      if (!b) return; b.visible = !!s.bubbling;
      if (s.bubbling) { b.position.y += delta * 0.4; if (b.position.y > 1.5) b.position.y = 0.85 + (i % 3) * 0.05; }
    });
  });

  return (
    <group>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 8, 6]} intensity={1.0} />
      <OrbitControls enableDamping dampingFactor={0.08} target={[0, 0.9, 0]} minDistance={3} maxDistance={10} />

      {/* bench */}
      <mesh position={[0, 0.4, 0]}><boxGeometry args={[5, 0.2, 2.4]} /><meshStandardMaterial color="#d6dbe2" /></mesh>

      {/* mortar with plant */}
      <group position={[-1.6, 0.6, 0]}>
        <mesh><cylinderGeometry args={[0.5, 0.35, 0.4, 24]} /><meshStandardMaterial color="#9aa3ad" metalness={0.2} roughness={0.6} /></mesh>
        <mesh position={[0, 0.12, 0]}><cylinderGeometry args={[0.38, 0.38, 0.12, 24]} /><meshStandardMaterial color={plant?.color || '#88aa55'} roughness={0.8} /></mesh>
        <mesh ref={pestle} position={[0.1, 0.35, 0]} rotation={[0, 0, 0.3]}><cylinderGeometry args={[0.06, 0.09, 0.5, 12]} /><meshStandardMaterial color="#7a838d" /></mesh>
      </group>
      <Label text="Mortar" at={[-1.6, 1.4, 0.6]} to={[-1.6, 0.7, 0]} />

      {/* round-bottom flask */}
      <group position={[1.0, 0.9, 0]}>
        <mesh><sphereGeometry args={[0.55, 24, 20]} /><meshPhysicalMaterial color="#cfe6f5" transparent opacity={0.25} roughness={0.05} /></mesh>
        <mesh position={[0, 0.6, 0]}><cylinderGeometry args={[0.13, 0.13, 0.5, 16]} /><meshPhysicalMaterial color="#cfe6f5" transparent opacity={0.25} roughness={0.05} /></mesh>
        {/* liquid */}
        <mesh ref={liquid} position={[0, -0.1, 0]} scale={[1, 0.7, 1]}><sphereGeometry args={[0.5, 20, 16]} /><meshStandardMaterial color={solvent?.color || '#aaccee'} transparent opacity={0.85} /></mesh>
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={i} ref={(el) => { bubbles.current[i] = el; }} position={[(i % 3 - 1) * 0.15, 0.85, (Math.floor(i / 3) - 1) * 0.15]} visible={false}><sphereGeometry args={[0.03, 8, 8]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.6} /></mesh>
        ))}
      </group>
      <Label text="Extraction Flask" at={[1.0, 2.0, 0.6]} to={[1.0, 1.2, 0]} />

      {/* heat plate */}
      <mesh position={[1.0, 0.55, 0]}><cylinderGeometry args={[0.6, 0.6, 0.1, 24]} /><meshStandardMaterial color="#2a2a2a" emissive="#552200" emissiveIntensity={0.3} /></mesh>
    </group>
  );
}
