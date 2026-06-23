import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, OrbitControls, Text } from '@react-three/drei';
import { Object3D } from 'three';

const MAX = { plants: 100, herbivores: 40, predators: 20, decomposers: 25 };
const DIVISOR = { plants: 10, herbivores: 5, predators: 5, decomposers: 20 };

function scatter(n, spread) {
  // deterministic pseudo-random so instances don't jump between frames
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = i * 2.399963; // golden angle
    const r = Math.sqrt((i + 0.5) / n) * spread;
    out.push([Math.cos(a) * r, Math.sin(a * 1.7) * r]);
  }
  return out;
}

function Pop({ id, color, geom, y, ecoRef, positions }) {
  const ref = useRef();
  const dummy = useMemo(() => new Object3D(), []);
  useFrame((state) => {
    const s = ecoRef?.current; const mesh = ref.current; if (!s || !mesh || !Array.isArray(s.series) || !s.series.length) return;
    const series = s.series; const idx = Math.min(series.length - 1, Math.max(0, Math.floor((s.t || 0) * (series.length - 1))));
    const row = series[idx]; if (!row) return;
    const pop = row[id] || 0;
    const count = Math.min(MAX[id], Math.floor(pop / DIVISOR[id]));
    mesh.count = count;
    const tt = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const [x, z] = positions[i];
      const wob = id === 'plants' || id === 'decomposers' ? 0 : Math.sin(tt * 0.6 + i) * 0.4;
      dummy.position.set(x + wob, y, z + Math.cos(tt * 0.5 + i) * (id === 'plants' ? 0 : 0.4));
      dummy.rotation.y = id === 'plants' || id === 'decomposers' ? 0 : tt * 0.3 + i;
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[undefined, undefined, MAX[id]]} castShadow>{geom}<meshStandardMaterial color={color} /></instancedMesh>;
}

// 3D diorama whose instanced populations track the simulated time series.
export default function EcosystemDiorama3D({ ecoRef }) {
  const positions = useMemo(() => ({
    plants: scatter(MAX.plants, 16), herbivores: scatter(MAX.herbivores, 13),
    predators: scatter(MAX.predators, 11), decomposers: scatter(MAX.decomposers, 9),
  }), []);

  return (
    <group>
      <ambientLight intensity={0.45} />
      <directionalLight position={[8, 12, 6]} intensity={1.1} castShadow shadow-mapSize={[1024, 1024]} />
      <OrbitControls enableDamping dampingFactor={0.08} target={[0, 0, 0]} minDistance={10} maxDistance={40} maxPolarAngle={Math.PI / 2.1} />

      {/* terrain */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[44, 44]} /><meshStandardMaterial color="#8B7355" /></mesh>
      {/* river */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}><planeGeometry args={[3, 42]} /><meshStandardMaterial color="#4A90D9" transparent opacity={0.7} /></mesh>

      {/* palo verde trees (static scenery) */}
      {scatter(8, 18).map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.75, 0]}><cylinderGeometry args={[0.15, 0.2, 1.5, 8]} /><meshStandardMaterial color="#4A7C59" /></mesh>
          <mesh position={[0, 1.7, 0]}><coneGeometry args={[0.7, 1.0, 6]} /><meshStandardMaterial color="#2D5A3D" /></mesh>
        </group>
      ))}

      <Pop id="plants" color="#3A7D44" y={0.18} ecoRef={ecoRef} positions={positions.plants}
        geom={<sphereGeometry args={[0.32, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />} />
      <Pop id="herbivores" color="#A0845C" y={0.45} ecoRef={ecoRef} positions={positions.herbivores}
        geom={<boxGeometry args={[0.5, 0.5, 0.9]} />} />
      <Pop id="predators" color="#C8860A" y={0.42} ecoRef={ecoRef} positions={positions.predators}
        geom={<boxGeometry args={[0.55, 0.45, 1.0]} />} />
      <Pop id="decomposers" color="#6B4226" y={0.12} ecoRef={ecoRef} positions={positions.decomposers}
        geom={<sphereGeometry args={[0.2, 6, 6]} />} />

      <Billboard position={[0, 6, -18]}><Text fontSize={0.9} color="#1a1a2e">Salt River Riparian Zone</Text></Billboard>
    </group>
  );
}
