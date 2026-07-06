import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, ContactShadows, Line, OrbitControls, Text } from '@react-three/drei';

const S = 0.02; // world units per px
const COPING = '#d8e1e8';
const CONCRETE = '#66727d';
const DARK_CONCRETE = '#4c5560';
const PAINT = '#22c55e';
const YELLOW = '#f0c45c';

// Launch ramp, gap, landing ramp, and a BMX rider that flies the predicted arc.
// Reads riderRef {t, traj, bailing}.
export default function SkatePark3D({ gap, angleDeg, riderRef, trajectory = [] }) {
  const rider = useRef();
  const wheelF = useRef();
  const wheelB = useRef();
  const trajectoryPoints = useMemo(() => {
    const traj = trajectory;
    if (!Array.isArray(traj) || !traj.length) return [];
    return traj.filter((_, i) => i % 3 === 0).map(([x, y]) => [-2.4 + x * S, 0.36 + y * S, -0.72]);
  }, [trajectory]);

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
      <hemisphereLight args={['#dff5ff', '#3c4650', 1.0]} />
      <directionalLight
        position={[5, 9, 6]}
        intensity={1.45}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-4}
      />
      <spotLight position={[-4, 5, 3]} angle={0.45} penumbra={0.5} intensity={0.75} castShadow />
      <OrbitControls enableDamping dampingFactor={0.08} target={[1, 0.6, 0]} minDistance={4} maxDistance={14} maxPolarAngle={Math.PI / 2.05} />

      {/* neighborhood skate deck */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.8, -0.04, 0]} receiveShadow>
        <boxGeometry args={[13.2, 5.3, 0.08]} />
        <meshStandardMaterial color={DARK_CONCRETE} roughness={0.92} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.8, 0.02, 0]} receiveShadow>
        <boxGeometry args={[12.35, 3.25, 0.045]} />
        <meshStandardMaterial color={CONCRETE} roughness={0.86} />
      </mesh>
      {[-4, -2, 0, 2, 4].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.055, -1.45]}>
          <planeGeometry args={[0.7, 0.028]} />
          <meshStandardMaterial color={YELLOW} roughness={0.55} />
        </mesh>
      ))}
      {[-1.64, 1.64].map((z) => (
        <mesh key={z} position={[0.8, 0.12, z]} castShadow receiveShadow>
          <boxGeometry args={[12.4, 0.16, 0.12]} />
          <meshStandardMaterial color="#515c66" roughness={0.75} />
        </mesh>
      ))}

      {/* launch ramp (angle reflects chosen launch angle) */}
      <group position={[-2.55, 0.16, 0]}>
        <mesh position={[-0.2, 0.02, 0]} rotation={[0, 0, (angleDeg * Math.PI) / 180]} castShadow>
          <boxGeometry args={[1.35, 0.16, 1.45]} />
          <meshStandardMaterial color="#d2a062" roughness={0.72} />
        </mesh>
        <mesh position={[0.42, 0.55, 0]} rotation={[0, 0, (angleDeg * Math.PI) / 180]} castShadow>
          <boxGeometry args={[0.16, 0.12, 1.55]} />
          <meshStandardMaterial color={COPING} metalness={0.1} roughness={0.32} />
        </mesh>
        {[-0.62, 0.62].map((z) => (
          <mesh key={z} position={[-0.6, -0.16, z]} castShadow>
            <boxGeometry args={[0.1, 0.46, 0.08]} />
            <meshStandardMaterial color="#7b5f3b" roughness={0.75} />
          </mesh>
        ))}
      </group>
      <Billboard position={[-1.78, 1.25, -0.8]}><Text fontSize={0.21} color="#102033">takeoff {angleDeg}deg</Text></Billboard>

      {/* measured flight corridor and safe landing paint */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2.4 + gap.start * S / 2, 0.06, -0.72]} receiveShadow>
        <planeGeometry args={[gap.start * S, 0.18]} />
        <meshStandardMaterial color="#26313b" roughness={0.8} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2.4 + (gap.start + gap.end) / 2 * S, 0.065, -0.72]} receiveShadow>
        <planeGeometry args={[(gap.end - gap.start) * S, 0.52]} />
        <meshStandardMaterial color={PAINT} transparent opacity={0.82} roughness={0.62} />
      </mesh>
      {[gap.start, gap.end].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[-2.4 + x * S, 0.07, -0.72]}>
          <planeGeometry args={[0.035, 0.58]} />
          <meshStandardMaterial color="#f9fafb" roughness={0.5} />
        </mesh>
      ))}
      <Billboard position={[-2.4 + ((gap.start + gap.end) / 2) * S, 0.62, -0.78]}><Text fontSize={0.18} color="#0f3b1f">clean landing zone</Text></Billboard>

      {/* landing bank */}
      <group position={[-2.4 + gap.end * S + 0.18, 0.12, 0]}>
        <mesh position={[0, 0.05, 0]} rotation={[0, 0, -0.32]} castShadow>
          <boxGeometry args={[1.45, 0.16, 1.45]} />
          <meshStandardMaterial color="#9aa6b2" metalness={0.12} roughness={0.55} />
        </mesh>
        <mesh position={[0.55, 0.37, 0]} rotation={[0, 0, -0.32]} castShadow>
          <boxGeometry args={[0.12, 0.12, 1.55]} />
          <meshStandardMaterial color={COPING} metalness={0.1} roughness={0.32} />
        </mesh>
        {[-0.42, 0, 0.42].map((z) => (
          <mesh key={z} position={[-0.18, 0.18, z]} rotation={[0, 0, -0.32]}>
            <boxGeometry args={[1.02, 0.025, 0.035]} />
            <meshStandardMaterial color="#e8eef2" roughness={0.42} />
          </mesh>
        ))}
      </group>

      {/* analyzed trajectory from Executive Brain physics pass */}
      {trajectoryPoints.length > 1 && (
        <Line points={trajectoryPoints} color="#2563eb" lineWidth={2.4} transparent opacity={0.95} />
      )}
      {trajectoryPoints.filter((_, i) => i % 3 === 0).map((p, i) => (
        <mesh key={`${p[0]}-${i}`} position={p}>
          <sphereGeometry args={[0.032, 14, 14]} />
          <meshStandardMaterial color="#2563eb" emissive="#2563eb" emissiveIntensity={0.35} roughness={0.35} />
        </mesh>
      ))}

      {/* BMX rider */}
      <group ref={rider} position={[-2.4, 0.25, 0]}>
        <mesh position={[0, 0.16, 0]} castShadow><boxGeometry args={[0.38, 0.055, 0.08]} /><meshStandardMaterial color="#1f2937" metalness={0.18} roughness={0.45} /></mesh>
        <mesh position={[0.06, 0.36, 0]} castShadow><sphereGeometry args={[0.09, 20, 20]} /><meshStandardMaterial color="#1f9a95" roughness={0.4} /></mesh>
        <mesh position={[0.02, 0.25, 0]} rotation={[0, 0, -0.25]} castShadow><boxGeometry args={[0.08, 0.28, 0.08]} /><meshStandardMaterial color={YELLOW} roughness={0.5} /></mesh>
        <mesh ref={wheelB} position={[-0.15, 0.06, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow><torusGeometry args={[0.09, 0.018, 12, 28]} /><meshStandardMaterial color="#111827" roughness={0.55} /></mesh>
        <mesh ref={wheelF} position={[0.16, 0.06, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow><torusGeometry args={[0.09, 0.018, 12, 28]} /><meshStandardMaterial color="#111827" roughness={0.55} /></mesh>
      </group>
      <ContactShadows position={[0, 0.07, 0]} opacity={0.35} scale={9} blur={2.5} far={3} />
    </group>
  );
}
