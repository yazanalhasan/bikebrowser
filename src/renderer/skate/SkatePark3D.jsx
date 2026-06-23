import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, OrbitControls, Text } from '@react-three/drei';

const S = 0.02; // world units per px

// Launch ramp, gap, landing ramp, and a BMX rider that flies the predicted arc.
// Reads riderRef {t, traj, bailing}.
export default function SkatePark3D({ gap, angleDeg, riderRef }) {
  const rider = useRef();
  const wheelF = useRef();
  const wheelB = useRef();

  useFrame((_, delta) => {
    const s = riderRef?.current; const g = rider.current; if (!s || !g || !Array.isArray(s.traj) || !s.traj.length) return;
    const traj = s.traj; const t = s.t || 0;
    const idx = Math.min(traj.length - 1, Math.max(0, Math.floor(t * (traj.length - 1))));
    const cur = traj[idx]; if (!cur) return;
    const x = cur[0], y = cur[1];
    g.position.set(-2.4 + x * S, 0.25 + y * S, 0);
    // tilt: align to flight direction
    const nxt = traj[Math.min(traj.length - 1, idx + 1)] || cur;
    g.rotation.z = s.bailing ? g.rotation.z - delta * 6 : Math.atan2((nxt[1] - y), (nxt[0] - x || 0.001));
    const spin = delta * 10;
    if (wheelF.current) wheelF.current.rotation.z -= spin;
    if (wheelB.current) wheelB.current.rotation.z -= spin;
  });

  return (
    <group>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 9, 6]} intensity={1.0} castShadow />
      <OrbitControls enableDamping dampingFactor={0.08} target={[1, 0.6, 0]} minDistance={4} maxDistance={14} maxPolarAngle={Math.PI / 2.05} />

      {/* ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1, 0, 0]} receiveShadow><planeGeometry args={[18, 6]} /><meshStandardMaterial color="#cdb88c" /></mesh>

      {/* launch ramp (angle reflects chosen launch angle) */}
      <mesh position={[-2.6, 0.35, 0]} rotation={[0, 0, (angleDeg * Math.PI) / 180]}><boxGeometry args={[1.1, 0.16, 1.2]} /><meshStandardMaterial color="#b3ac9c" /></mesh>
      <Billboard position={[-2.6, 1.3, 0]}><Text fontSize={0.26} color="#234">{angleDeg}°</Text></Billboard>

      {/* gap (shadowed pit between start and end of the landing zone) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2.4 + (gap.start + gap.end) / 2 * S, 0.01, 0]}><planeGeometry args={[(gap.end - gap.start) * S, 1.4]} /><meshStandardMaterial color="#5a4d34" /></mesh>

      {/* landing ramp zone */}
      <mesh position={[-2.4 + gap.end * S, 0.18, 0]} rotation={[0, 0, -0.4]}><boxGeometry args={[1.0, 0.14, 1.2]} /><meshStandardMaterial color="#9aa6b2" metalness={0.3} /></mesh>
      <Billboard position={[-2.4 + ((gap.start + gap.end) / 2) * S, 1.0, 0]}><Text fontSize={0.2} color="#7c3a1a">land zone</Text></Billboard>

      {/* BMX rider */}
      <group ref={rider} position={[-2.4, 0.25, 0]}>
        <mesh position={[0, 0.16, 0]}><boxGeometry args={[0.34, 0.08, 0.12]} /><meshStandardMaterial color="#1f2937" /></mesh>
        <mesh position={[0, 0.34, 0]}><sphereGeometry args={[0.1, 16, 16]} /><meshStandardMaterial color="#e8a44a" /></mesh>
        <mesh ref={wheelB} position={[-0.13, 0.06, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.08, 0.025, 8, 16]} /><meshStandardMaterial color="#111" /></mesh>
        <mesh ref={wheelF} position={[0.13, 0.06, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.08, 0.025, 8, 16]} /><meshStandardMaterial color="#111" /></mesh>
      </group>
    </group>
  );
}
