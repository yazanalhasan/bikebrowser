import React, { useMemo } from 'react';
import { Billboard, Line, OrbitControls, Text } from '@react-three/drei';
import { Shape, ExtrudeGeometry } from 'three';
import { naca4 } from './airfoils.js';

const LABEL = '#FACC15';
function Annotation({ text, at, to }) {
  return (
    <group>
      <Line points={[to, at]} color={LABEL} lineWidth={1} />
      <Billboard position={at}><mesh><planeGeometry args={[text.length * 0.075 + 0.16, 0.22]} /><meshBasicMaterial color="#0d1320" transparent opacity={0.72} /></mesh>
        <Text fontSize={0.13} color={LABEL} anchorX="center" anchorY="middle">{text}</Text></Billboard>
    </group>
  );
}

function buildStreamlines(aoaDeg, stalled, overStall) {
  const aoaRad = (aoaDeg * Math.PI) / 180;
  const turn = Math.tan(aoaRad);
  const ys = [];
  for (let i = 0; i < 6; i++) { const f = (i + 1) / 7; ys.push(0.22 + f * 1.25); ys.push(-(0.22 + f * 1.25)); }
  return ys.map((y0) => {
    const upper = y0 > 0;
    const pts = [];
    for (let x = -3.6; x <= 4.6; x += 0.16) {
      let y = y0;
      const prox = Math.exp(-(x * x) / 1.6);
      const disp = (0.5 / (Math.abs(y0) + 0.4)) * prox;
      y += upper ? disp : -disp;
      if (x < 0) y += turn * 0.5 * Math.exp(-(x * x) / 3);
      else y -= turn * 0.7 * Math.min(1, x / 2) * Math.exp(-((x - 1) * (x - 1)) / 6);
      if (stalled && upper && x > 0) {
        const namp = 0.13 * Math.min(1, overStall / 6) * Math.min(1, x / 2);
        y += namp * Math.sin(x * 7 + y0 * 5) + namp * 0.5 * Math.sin(x * 13 + y0 * 3);
      }
      pts.push([x, y, 0]);
    }
    return { pts, upper };
  });
}

export default function WindTunnel({ airfoil, aoa }) {
  const aoaRad = (aoa * Math.PI) / 180;
  const stalled = aoa > airfoil.aero.stall;
  const overStall = aoa - airfoil.aero.stall;

  const geo = useMemo(() => {
    const { upper, lower } = naca4(airfoil.m, airfoil.p, airfoil.t, 2, 60);
    const s = new Shape();
    s.moveTo(upper[0][0], upper[0][1]);
    upper.forEach(([x, y]) => s.lineTo(x, y));
    for (let i = lower.length - 1; i >= 0; i--) s.lineTo(lower[i][0], lower[i][1]);
    const g = new ExtrudeGeometry(s, { depth: 1.2, bevelEnabled: false });
    g.translate(-0.5, 0, -0.6); // quarter-chord (0.25*chord) to origin
    return g;
  }, [airfoil]);

  const streamlines = useMemo(() => buildStreamlines(aoa, stalled, overStall), [aoa, stalled, overStall]);

  return (
    <group>
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 8, 6]} intensity={1.1} />
      <OrbitControls enableDamping dampingFactor={0.08} target={[0, 0, 0]} />

      {/* tunnel walls (semi-transparent navy) */}
      <mesh position={[0.5, 1.7, 0]}><boxGeometry args={[7, 0.1, 2.4]} /><meshStandardMaterial color="#1A1A2E" transparent opacity={0.5} /></mesh>
      <mesh position={[0.5, -1.7, 0]}><boxGeometry args={[7, 0.1, 2.4]} /><meshStandardMaterial color="#1A1A2E" transparent opacity={0.5} /></mesh>
      <mesh position={[0.5, 0, -1.2]}><boxGeometry args={[7, 3.5, 0.1]} /><meshStandardMaterial color="#10101e" transparent opacity={0.35} /></mesh>
      {/* inlet contraction */}
      <mesh position={[-4, 1.0, 0]} rotation={[0, 0, 0.35]}><boxGeometry args={[1.6, 0.1, 2.4]} /><meshStandardMaterial color="#1A1A2E" transparent opacity={0.5} /></mesh>
      <mesh position={[-4, -1.0, 0]} rotation={[0, 0, -0.35]}><boxGeometry args={[1.6, 0.1, 2.4]} /><meshStandardMaterial color="#1A1A2E" transparent opacity={0.5} /></mesh>
      {/* outlet diffuser */}
      <mesh position={[4.6, 1.1, 0]} rotation={[0, 0, -0.3]}><boxGeometry args={[1.6, 0.1, 2.4]} /><meshStandardMaterial color="#1A1A2E" transparent opacity={0.5} /></mesh>
      <mesh position={[4.6, -1.1, 0]} rotation={[0, 0, 0.3]}><boxGeometry args={[1.6, 0.1, 2.4]} /><meshStandardMaterial color="#1A1A2E" transparent opacity={0.5} /></mesh>

      {/* streamlines */}
      {streamlines.map((s, i) => (
        <Line key={i} points={s.pts} color={s.upper ? (stalled ? '#EF6F6F' : '#7FB2FF') : '#5C8FE0'} lineWidth={1.4} transparent opacity={0.9} />
      ))}

      {/* airfoil (rotates about quarter-chord by AoA) */}
      <mesh geometry={geo} rotation={[0, 0, -aoaRad]}>
        <meshStandardMaterial color={airfoil.color} metalness={0.3} roughness={0.5} />
      </mesh>

      {/* mounting strut (amber instrumentation) */}
      <mesh position={[0, -0.9, 0]}><cylinderGeometry args={[0.05, 0.05, 1.6, 12]} /><meshStandardMaterial color="#E8A020" metalness={0.5} roughness={0.4} /></mesh>

      <Annotation text="Airfoil" at={[0, 1.0, 0.7]} to={[0, 0.1, 0]} />
      <Annotation text="Test Section" at={[0, 2.1, 0]} to={[0, 1.6, 0]} />
      <Annotation text={stalled ? 'Stalled wake' : 'Smooth flow'} at={[3.0, 1.3, 0.5]} to={[2.2, 0.5, 0]} />
    </group>
  );
}
