import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Line, OrbitControls, Text } from '@react-three/drei';
import { Color } from 'three';

const LABEL = '#FACC15';
function Annotation({ text, at, to }) {
  return (
    <group>
      <Line points={[to, at]} color={LABEL} lineWidth={1} />
      <Billboard position={at}><mesh><planeGeometry args={[text.length * 0.08 + 0.18, 0.24]} /><meshBasicMaterial color="#0d1320" transparent opacity={0.72} /></mesh>
        <Text fontSize={0.14} color={LABEL} anchorX="center" anchorY="middle">{text}</Text></Billboard>
    </group>
  );
}

export default function CrashFacility({ material, mode, crashRef }) {
  const weight = useRef();
  const specimen = useRef();
  const specimenGeo = useRef();
  const car = useRef();
  const crumple = useRef();
  const matColor = useRef(new Color(material?.color || '#8899AA'));

  useEffect(() => {
    const g = specimenGeo.current;
    if (g && !g.userData.orig) g.userData.orig = Float32Array.from(g.attributes.position.array);
  });

  useFrame((_, delta) => {
    const s = crashRef?.current; if (!s) return;
    if (material?.color) {
      matColor.current.lerp(new Color(material.color), Math.min(1, delta * 6));
      if (specimen.current) specimen.current.material.color.copy(matColor.current);
      if (crumple.current) crumple.current.material.color.copy(matColor.current);
    }
    if (mode === 'load') {
      if (weight.current) weight.current.position.y = 2.2 - (s.weightY || 0);
      const g = specimenGeo.current;
      if (g && g.userData.orig) {
        const pos = g.attributes.position.array; const orig = g.userData.orig;
        const d = s.deflect || 0;
        for (let i = 0; i < pos.length; i += 3) {
          const x = orig[i]; const t = (x + 2) / 4; // -2..2 → 0..1
          pos[i + 1] = orig[i + 1] - 4 * t * (1 - t) * d;
        }
        g.attributes.position.needsUpdate = true; g.computeVertexNormals();
      }
    } else {
      if (car.current) car.current.position.x = s.carX ?? -3;
      if (crumple.current) { const c = s.crumple || 0; crumple.current.scale.x = 1 - c * 0.8; crumple.current.position.x = 0.55 - c * 0.22; }
    }
  });

  const mat = (c, m = 0.4, r = 0.6) => <meshStandardMaterial color={c} metalness={m} roughness={r} />;
  const color = material?.color || '#8899AA';

  return (
    <group>
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 8, 5]} intensity={1.15} />
      <OrbitControls enableDamping dampingFactor={0.08} maxPolarAngle={Math.PI / 2.05} target={[0, 0.8, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}><planeGeometry args={[16, 10]} />{mat('#c9d2dd', 0, 1)}</mesh>

      {mode === 'load' ? (
        <group>
          {/* drop tower */}
          <mesh position={[-1.7, 1.1, 0]}><boxGeometry args={[0.18, 3.2, 0.18]} />{mat('#2C2C2C', 0.6, 0.4)}</mesh>
          <mesh position={[1.7, 1.1, 0]}><boxGeometry args={[0.18, 3.2, 0.18]} />{mat('#2C2C2C', 0.6, 0.4)}</mesh>
          <mesh position={[0, 2.6, 0]}><boxGeometry args={[3.6, 0.2, 0.4]} />{mat('#2C2C2C', 0.6, 0.4)}</mesh>
          {/* drop weight */}
          <mesh ref={weight} position={[0, 2.2, 0]}><boxGeometry args={[1.0, 0.5, 0.7]} /><meshStandardMaterial color="#E8A020" metalness={0.6} roughness={0.4} /></mesh>
          <Annotation text="Drop Weight" at={[1.9, 2.3, 0.6]} to={[0.5, 2.1, 0]} />
          {/* supports */}
          <mesh position={[-1.7, 0.0, 0]}><boxGeometry args={[0.4, 0.4, 0.8]} />{mat('#3A3A3A')}</mesh>
          <mesh position={[1.7, 0.0, 0]}><boxGeometry args={[0.4, 0.4, 0.8]} />{mat('#3A3A3A')}</mesh>
          {/* chassis rail specimen */}
          <mesh ref={specimen} position={[0, 0.3, 0]}>
            <boxGeometry ref={specimenGeo} args={[4, 0.3, 0.6, 20, 1, 1]} />
            <meshStandardMaterial color={color} metalness={0.3} roughness={0.6} />
          </mesh>
          <Annotation text="Chassis Rail" at={[-1.0, -0.4, 0.6]} to={[0, 0.2, 0]} />
        </group>
      ) : (
        <group>
          {/* barrier */}
          <mesh position={[2.6, 0.8, 0]}><boxGeometry args={[0.5, 2.4, 3] } />{mat('#3A3A3A', 0.4, 0.7)}</mesh>
          <Annotation text="Barrier" at={[3.2, 1.9, 0.8]} to={[2.6, 1.4, 0]} />
          {/* car */}
          <group ref={car} position={[-3, 0.4, 0]}>
            <mesh position={[-0.4, 0.1, 0]}><boxGeometry args={[1.4, 0.5, 1.0]} />{mat(color, 0.5, 0.4)}</mesh>
            <mesh position={[-0.55, 0.55, 0]}><boxGeometry args={[0.8, 0.45, 0.9]} />{mat(color, 0.5, 0.3)}</mesh>
            {/* crumple zone (front) */}
            <mesh ref={crumple} position={[0.55, 0.1, 0]}><boxGeometry args={[0.7, 0.45, 0.95]} /><meshStandardMaterial color={color} metalness={0.4} roughness={0.5} /></mesh>
            {[-0.7, 0.35].map((wx) => [-0.42, 0.42].map((wz) => (
              <mesh key={`${wx}-${wz}`} position={[wx, -0.2, wz]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.18, 0.18, 0.12, 16]} />{mat('#1a1a1a', 0.2, 0.8)}</mesh>
            )))}
          </group>
          <Annotation text="Crumple Zone" at={[-1.2, 1.3, 0.9]} to={[-2.45, 0.5, 0]} />
        </group>
      )}
    </group>
  );
}
