import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Line, OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

const WL = 1.8; // waterline y
const LABEL = '#1e293b';
function TankLabel({ at, to, children }) {
  return (
    <group>
      <Line points={[to, at]} color="#64748b" lineWidth={1} dashed dashSize={0.08} gapSize={0.05} />
      <Billboard position={at}><Text fontSize={0.2} color={LABEL} anchorX="center" anchorY="middle">{children}</Text></Billboard>
    </group>
  );
}

function Hull({ hull }) {
  const cat = hull.hull_form === 'catamaran';
  const L = Math.min(hull.length, 5) * 0.7;
  const B = Math.min(hull.beam, 3.2) * 0.55;
  if (cat) {
    return (
      <group>
        {[-B / 2, B / 2].map((z) => (
          <mesh key={z} position={[0, 0, z]}><boxGeometry args={[L, 0.4, B * 0.35]} /><meshStandardMaterial color={hull.color} metalness={0.3} roughness={0.5} /></mesh>
        ))}
        <mesh position={[0, 0.22, 0]}><boxGeometry args={[L * 0.7, 0.06, B]} /><meshStandardMaterial color={hull.color} metalness={0.3} roughness={0.5} /></mesh>
      </group>
    );
  }
  return (
    <group>
      <mesh><boxGeometry args={[L, 0.42, B]} /><meshStandardMaterial color={hull.color} metalness={0.3} roughness={0.55} /></mesh>
      <mesh position={[L / 2 + 0.18, 0, 0]}><coneGeometry args={[B / 2, 0.6, 4]} /><meshStandardMaterial color={hull.color} metalness={0.3} roughness={0.55} /></mesh>
      <mesh position={[0, -0.24, 0]}><boxGeometry args={[L * 0.9, 0.06, 0.06]} /><meshStandardMaterial color="#334155" /></mesh>
    </group>
  );
}

export default function HydroTank({ hull, buoy, boatRef }) {
  const hullGroup = useRef();
  const wake = useRef();
  const root = useRef();
  const shakeT = useRef(0);

  useFrame((state, delta) => {
    const s = boatRef?.current; if (!s || !hullGroup.current) return;
    hullGroup.current.position.x = s.hullX ?? -3.5;
    // ride height: sinks low, capsize tilts
    const baseY = buoy && !buoy.floats ? WL - 0.7 : WL + 0.02;
    hullGroup.current.position.y = baseY;
    hullGroup.current.rotation.z = s.capsizing
      ? Math.min(Math.PI / 2.2, hullGroup.current.rotation.z + delta * 2.0)
      : 0;
    // wake
    if (wake.current) {
      const sp = (s.speed || 0) / (hull.maxTowSpeed || 1);
      wake.current.scale.setScalar(Math.max(0.001, sp * 3));
      wake.current.position.x = (s.hullX ?? -3.5) - 1;
      wake.current.material.opacity = 0.3 * sp;
    }
    // shake on capsize
    if (s.capsizing && root.current) { shakeT.current += delta; if (shakeT.current < 0.6) root.current.position.x = (Math.random() - 0.5) * 0.12; else root.current.position.x = 0; }
  });

  const glass = { color: '#a8d8f0', transparent: true, opacity: 0.22, roughness: 0.05, side: THREE.DoubleSide };

  return (
    <group ref={root}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[8, 10, 6]} intensity={1.2} />
      <pointLight position={[-5, 3, 0]} intensity={0.4} color="#93c5fd" />
      <OrbitControls enablePan={false} minPolarAngle={Math.PI / 6} maxPolarAngle={Math.PI / 2.2} minDistance={6} maxDistance={20} target={[0, 1, 0]} />

      {/* floor */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[12, 4]} /><meshStandardMaterial color="#cbd5e1" /></mesh>
      {/* glass walls */}
      <mesh position={[0, 1.5, -2]}><boxGeometry args={[12, 3, 0.08]} /><meshStandardMaterial {...glass} /></mesh>
      <mesh position={[0, 1.5, 2]}><boxGeometry args={[12, 3, 0.08]} /><meshStandardMaterial {...glass} /></mesh>
      <mesh position={[-6, 1.5, 0]}><boxGeometry args={[0.08, 3, 4]} /><meshStandardMaterial {...glass} /></mesh>
      <mesh position={[6, 1.5, 0]}><boxGeometry args={[0.08, 3, 4]} /><meshStandardMaterial {...glass} /></mesh>
      {/* water */}
      <mesh position={[0, 0.9, 0]}><boxGeometry args={[11.8, 1.8, 3.8]} /><meshStandardMaterial color="#1E6FDB" transparent opacity={0.32} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, WL, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[11.8, 3.8]} /><meshStandardMaterial color="#3a9bd5" transparent opacity={0.6} metalness={0.1} roughness={0.2} side={THREE.DoubleSide} /></mesh>

      {/* hull */}
      <group ref={hullGroup} position={[-3.5, WL, 0]}><Hull hull={hull} /></group>

      {/* wake */}
      <mesh ref={wake} position={[-4.5, WL + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1, 1.2]} /><meshStandardMaterial color="#93c5fd" transparent opacity={0} side={THREE.DoubleSide} /></mesh>

      {/* instrumentation arm + load cell */}
      <mesh position={[5.0, 2.4, 0]}><boxGeometry args={[1.5, 0.08, 0.08]} /><meshStandardMaterial color="#9ca3af" /></mesh>
      <mesh position={[5.6, 2.4, 0]}><boxGeometry args={[0.16, 0.16, 0.16]} /><meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.4} /></mesh>

      <TankLabel at={[-4.5, 2.5, 1.6]} to={[-3.5, WL, 0]}>Waterline</TankLabel>
      <TankLabel at={[5.4, 2.9, 0.8]} to={[5.6, 2.4, 0]}>Load Cell</TankLabel>
      <TankLabel at={[2.4, 0.5, 1.7]} to={[0, 0.9, 0]}>Hydro Tank</TankLabel>
    </group>
  );
}
