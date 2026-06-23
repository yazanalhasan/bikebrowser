import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Line, OrbitControls, Text } from '@react-three/drei';
import { Color } from 'three';

const blue = new Color('#3a6fff');
const red = new Color('#ff4400');
const white = new Color('#ffffff');
function tempToColor(h) {
  if (h < 0.5) return blue.clone().lerp(red, h * 2);
  return red.clone().lerp(white, Math.min(1, (h - 0.5) * 2));
}

function Label({ text, at, to }) {
  return (
    <group>
      <Line points={[to, at]} color="#64748b" lineWidth={1} dashed dashSize={0.06} gapSize={0.04} />
      <Billboard position={at}><Text fontSize={0.14} color="#1e293b" anchorX="center" anchorY="middle">{text}</Text></Billboard>
    </group>
  );
}

export default function VacuumChamber3D({ material, chamberRef }) {
  const root = useRef();
  const body = useRef();
  const shield = useRef();
  const bubbles = useRef([]);
  const shakeT = useRef(0);

  const bubbleSeed = useMemo(() => Array.from({ length: 10 }, () => ({ x: (Math.random() - 0.5) * 1.0, z: (Math.random() - 0.5) * 1.0, y0: -0.4 + Math.random() * 0.6, sp: 0.3 + Math.random() * 0.4, r: 0.03 + Math.random() * 0.03 })), []);
  const color = material?.color || '#888';
  const outgas = material?.outgassing || 'low';

  useFrame((state, delta) => {
    const s = chamberRef?.current; if (!s) return;
    const heat = s.heatFrac || 0;
    if (body.current) body.current.material.color.copy(tempToColor(heat));
    if (shield.current) {
      shield.current.scale.y = Math.max(0.05, 1 - (s.ablation || 0));
      shield.current.material.emissive.copy(tempToColor(heat));
      shield.current.material.emissiveIntensity = heat * 2.5;
    }
    // bubbles during vacuum outgassing
    const showBubbles = s.phase === 'vacuum' && outgas !== 'low';
    bubbles.current.forEach((b, i) => {
      if (!b) return;
      b.visible = showBubbles;
      if (showBubbles) { const seed = bubbleSeed[i]; b.position.y += seed.sp * delta; if (b.position.y > 1.2) b.position.y = seed.y0; }
    });
    // shake on failure
    if (s.shake && root.current) { shakeT.current += delta; if (shakeT.current < 1.2) { root.current.position.x = Math.sin(shakeT.current * 50) * 0.05 * (1 - shakeT.current / 1.2); } else { root.current.position.x = 0; } }
    else if (root.current) root.current.position.x = 0;
  });

  return (
    <group ref={root}>
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 8, 6]} intensity={1.0} />
      <pointLight position={[0, 0, 4]} intensity={0.5} color="#88aaff" />
      <OrbitControls enableDamping dampingFactor={0.08} target={[0, 0.2, 0]} minDistance={4} maxDistance={14} />

      {/* chamber glass cylinder */}
      <mesh position={[0, 0.4, 0]}><cylinderGeometry args={[1.6, 1.6, 3.4, 32, 1, true]} /><meshStandardMaterial color="#9fb6cf" transparent opacity={0.16} side={2} /></mesh>
      <mesh position={[0, -1.35, 0]}><cylinderGeometry args={[1.7, 1.7, 0.2, 32]} /><meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} /></mesh>
      <mesh position={[0, 2.15, 0]}><cylinderGeometry args={[1.7, 1.7, 0.2, 32]} /><meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} /></mesh>

      {/* capsule: body + nose + heat shield */}
      <mesh ref={body} position={[0, 0.4, 0]}><coneGeometry args={[0.7, 1.1, 24]} /><meshStandardMaterial color={color} metalness={0.3} roughness={0.5} /></mesh>
      <mesh position={[0, -0.35, 0]}><cylinderGeometry args={[0.7, 0.9, 0.5, 24]} /><meshStandardMaterial color={color} metalness={0.3} roughness={0.5} /></mesh>
      <mesh ref={shield} position={[0, -0.62, 0]}><cylinderGeometry args={[0.92, 0.78, 0.18, 24]} /><meshStandardMaterial color={color} emissive={'#220000'} emissiveIntensity={0} metalness={0.2} roughness={0.6} /></mesh>

      {/* outgassing bubbles */}
      {bubbleSeed.map((seed, i) => (
        <mesh key={i} ref={(el) => { bubbles.current[i] = el; }} position={[seed.x, seed.y0, seed.z]} visible={false}><sphereGeometry args={[seed.r, 8, 8]} /><meshBasicMaterial color="#cce0ff" transparent opacity={0.5} /></mesh>
      ))}

      <Label text="Capsule" at={[1.4, 0.9, 0.6]} to={[0.4, 0.4, 0]} />
      <Label text="Heat Shield" at={[1.5, -0.9, 0.6]} to={[0.5, -0.62, 0]} />
      <Label text="Vacuum Chamber" at={[-1.7, 1.6, 0.5]} to={[-1.5, 0.4, 0]} />
    </group>
  );
}
