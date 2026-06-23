import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Line, OrbitControls, Text } from '@react-three/drei';
import { Vector3 } from 'three';

function Label({ text, at, color = '#cbd5e1' }) {
  return <Billboard position={at}><Text fontSize={0.18} color={color} anchorX="center" anchorY="middle">{text}</Text></Billboard>;
}

// Atom cluster from a substrate definition: spheres + bond cylinders.
function Molecule({ substrate, scale = 1 }) {
  const positions = useMemo(() => {
    const n = substrate?.atomCount || 4; const out = [];
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; out.push(new Vector3(Math.cos(a) * 0.32, Math.sin(a) * 0.32, (i % 2) * 0.08)); }
    return out;
  }, [substrate]);
  if (!substrate) return null;
  return (
    <group scale={scale}>
      {positions.map((p, i) => <mesh key={i} position={p}><sphereGeometry args={[0.12, 16, 16]} /><meshStandardMaterial color={substrate.color} roughness={0.35} /></mesh>)}
      {substrate.bonds.map(([a, b], i) => {
        const pa = positions[a]; const pb = positions[b]; if (!pa || !pb) return null;
        const mid = pa.clone().add(pb).multiplyScalar(0.5); const dir = pb.clone().sub(pa); const len = dir.length();
        const up = new Vector3(0, 1, 0); const quat = []; // orient via lookAt below
        return <BondCyl key={i} mid={mid} len={len} dir={dir} />;
      })}
    </group>
  );
}
function BondCyl({ mid, len, dir }) {
  const ref = useRef();
  useFrame(() => { if (ref.current) { ref.current.position.copy(mid); ref.current.lookAt(mid.clone().add(dir)); ref.current.rotateX(Math.PI / 2); } });
  return <mesh ref={ref}><cylinderGeometry args={[0.03, 0.03, len, 8]} /><meshStandardMaterial color="#cbd5e1" /></mesh>;
}

// Enzyme + docking substrate + cofactor. Reads molRef {dock, reacting, t}.
export default function MolecularBench3D({ enzyme, substrate, cofactor, molRef }) {
  const subGroup = useRef();
  const cofGroup = useRef();
  const enzymeMesh = useRef();
  const enzymePos = new Vector3(0, 0.2, 0);
  const startPos = new Vector3(2.6, 0.6, 0.4);

  useFrame((_, delta) => {
    const s = molRef?.current; if (!s) return;
    const d = s.dock || 0;
    if (subGroup.current) {
      subGroup.current.position.lerpVectors(startPos, enzymePos.clone().add(new Vector3(0.45, 0.05, 0)), d);
      subGroup.current.rotation.y += delta * 1.2;
      subGroup.current.scale.setScalar(s.reacting ? Math.max(0.2, 1 - (s.t - 0.7) * 2) : 1);
    }
    if (cofGroup.current) { cofGroup.current.position.y = 1.3 + Math.sin(s.t * 6) * 0.05; }
    if (enzymeMesh.current && s.reacting) enzymeMesh.current.material.emissiveIntensity = 0.2 + Math.abs(Math.sin(s.t * 10)) * 0.5;
  });

  return (
    <group>
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 4]} intensity={1.0} />
      <pointLight position={[0, 1, 3]} intensity={0.5} color="#a5b4fc" />
      <OrbitControls enableDamping dampingFactor={0.08} target={[0.3, 0.4, 0]} minDistance={3.5} maxDistance={10} />

      {/* enzyme body with active-site cleft */}
      <mesh ref={enzymeMesh} position={enzymePos}><sphereGeometry args={[1.0, 48, 48]} /><meshStandardMaterial color={enzyme?.color || '#6366F1'} emissive={enzyme?.color || '#6366F1'} emissiveIntensity={0.15} roughness={0.5} /></mesh>
      <mesh position={[0.78, 0.3, 0]} scale={[0.6, 0.5, 0.5]}><sphereGeometry args={[0.5, 24, 24]} /><meshStandardMaterial color={enzyme?.activeSite || '#818CF8'} emissive={enzyme?.activeSite || '#818CF8'} emissiveIntensity={0.4} /></mesh>
      <Label text={enzyme?.name || ''} at={[0, 1.5, 0]} color={enzyme?.activeSite} />

      {/* substrate molecule (docks into active site) */}
      <group ref={subGroup} position={startPos}><Molecule substrate={substrate} /></group>
      {substrate && <Label text={substrate.formula} at={[2.6, 1.3, 0.4]} color={substrate.color} />}

      {/* cofactor */}
      <group ref={cofGroup} position={[0, 1.3, 0]}>
        <mesh><icosahedronGeometry args={[0.22, 0]} /><meshStandardMaterial color={cofactor?.color || '#F59E0B'} emissive={cofactor?.color || '#F59E0B'} emissiveIntensity={0.3} /></mesh>
      </group>
      {cofactor && <Label text={cofactor.name} at={[-1.4, 1.4, 0]} color={cofactor.color} />}
    </group>
  );
}
