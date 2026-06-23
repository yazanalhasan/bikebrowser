import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Line, OrbitControls, Text } from '@react-three/drei';

function Label({ text, at, to }) {
  return (
    <group>
      <Line points={[to, at]} color="#88a" lineWidth={1} dashed dashSize={0.05} gapSize={0.04} />
      <Billboard position={at}><Text fontSize={0.13} color="#cde" anchorX="center" anchorY="middle">{text}</Text></Billboard>
    </group>
  );
}

// Procedural light microscope. Reads scopeRef {focus, mag, slideLoaded, lampOn}.
export default function Microscope3D({ scopeRef }) {
  const stage = useRef();
  const turret = useRef();
  const coarse = useRef();
  const lamp = useRef();
  const cone = useRef();

  useFrame((_, delta) => {
    const s = scopeRef?.current; if (!s) return;
    if (stage.current) stage.current.position.y = 1.2 + (s.focus || 0) * 0.18;
    if (turret.current) { const idx = [4, 10, 40].indexOf(s.mag || 4); turret.current.rotation.y += (idx * (Math.PI * 2 / 3) - turret.current.rotation.y) * Math.min(1, delta * 6); }
    if (coarse.current && s.focusing) coarse.current.rotation.x += delta * 4;
    const on = s.lampOn ? 1 : 0;
    if (lamp.current) lamp.current.material.emissiveIntensity = 0.4 + on * 1.6;
    if (cone.current) cone.current.material.opacity = on * 0.14;
  });

  const body = '#2c2c2c'; const rubber = '#1a1a1a';
  return (
    <group position={[0, -0.6, 0]} scale={0.8}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} />
      <OrbitControls enablePan={false} enableDamping dampingFactor={0.08} target={[0, 1.4, 0]} minPolarAngle={Math.PI / 6} maxPolarAngle={Math.PI / 2.2} minDistance={3.5} maxDistance={9} />

      {/* base + arm */}
      <mesh position={[0, 0, 0]}><boxGeometry args={[2.0, 0.15, 1.2]} /><meshStandardMaterial color={body} metalness={0.6} roughness={0.4} /></mesh>
      <mesh position={[-0.6, 1.25, 0]}><boxGeometry args={[0.25, 2.5, 0.25]} /><meshStandardMaterial color={body} metalness={0.6} roughness={0.4} /></mesh>

      {/* condenser + illumination */}
      <mesh ref={lamp} position={[0, 0.82, 0]}><cylinderGeometry args={[0.12, 0.12, 0.04, 32]} /><meshStandardMaterial color="#FFFACD" emissive="#FFFACD" emissiveIntensity={0.4} /></mesh>
      <mesh ref={cone} position={[0, 1.05, 0]}><coneGeometry args={[0.25, 0.4, 32, 1, true]} /><meshBasicMaterial color="#ffffff" transparent opacity={0} side={2} /></mesh>

      {/* stage + slide */}
      <group ref={stage} position={[0, 1.2, 0]}>
        <mesh><boxGeometry args={[1.4, 0.08, 1.0]} /><meshStandardMaterial color="#3a3a3a" metalness={0.6} roughness={0.4} /></mesh>
        <mesh position={[0, 0.06, 0.1]}><boxGeometry args={[0.5, 0.01, 0.3]} /><meshStandardMaterial color="#bfe3ff" transparent opacity={0.7} /></mesh>
        <mesh position={[0.35, 0.07, 0.32]}><boxGeometry args={[0.4, 0.04, 0.06]} /><meshStandardMaterial color={body} /></mesh>
        <mesh position={[-0.35, 0.07, 0.32]}><boxGeometry args={[0.4, 0.04, 0.06]} /><meshStandardMaterial color={body} /></mesh>
      </group>

      {/* focus knobs */}
      <mesh ref={coarse} position={[-0.78, 1.3, 0.15]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.18, 0.18, 0.12, 32]} /><meshStandardMaterial color={rubber} roughness={0.9} /></mesh>
      <mesh position={[-0.78, 1.3, -0.15]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.10, 0.10, 0.10, 32]} /><meshStandardMaterial color={rubber} roughness={0.9} /></mesh>

      {/* objective turret */}
      <group ref={turret} position={[0, 1.75, 0]}>
        <mesh><cylinderGeometry args={[0.35, 0.35, 0.08, 32]} /><meshStandardMaterial color={body} metalness={0.6} roughness={0.4} /></mesh>
        {[0, 1, 2].map((i) => { const a = i * (Math.PI * 2 / 3); const len = [0.25, 0.4, 0.6][i]; return (
          <mesh key={i} position={[Math.sin(a) * 0.25, -len / 2 - 0.04, Math.cos(a) * 0.25]}><cylinderGeometry args={[0.06, 0.04, len, 16]} /><meshStandardMaterial color="#888" emissive={i === 0 ? '#4466ff' : '#000'} emissiveIntensity={i === 0 ? 0.3 : 0} /></mesh>
        ); })}
      </group>

      {/* eyepiece */}
      <mesh position={[-0.1, 2.6, 0]} rotation={[0, 0, -Math.PI / 6]}><cylinderGeometry args={[0.09, 0.09, 0.6, 16]} /><meshStandardMaterial color={body} metalness={0.6} roughness={0.4} /></mesh>

      <Label text="Eyepiece" at={[-0.6, 3.0, 0.4]} to={[-0.2, 2.8, 0]} />
      <Label text="Turret" at={[0.9, 1.9, 0.4]} to={[0.35, 1.75, 0]} />
      <Label text="Stage" at={[1.1, 1.25, 0.4]} to={[0.7, 1.2, 0]} />
      <Label text="Focus" at={[-1.5, 1.35, 0.4]} to={[-0.96, 1.3, 0.15]} />
    </group>
  );
}
