import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Line, OrbitControls, Text } from '@react-three/drei';
import { CatmullRomCurve3, TubeGeometry, Vector3, Color } from 'three';

const LABEL = '#93C5FD';
const LSIZE = 0.13;

function Label({ text, at, to }) {
  return (
    <group>
      <Line points={[to, at]} color={LABEL} lineWidth={1} />
      <Billboard position={at}>
        <mesh><planeGeometry args={[text.length * 0.075 + 0.16, 0.22]} /><meshBasicMaterial color="#0d1320" transparent opacity={0.72} /></mesh>
        <Text fontSize={LSIZE} color={LABEL} anchorX="center" anchorY="middle">{text}</Text>
      </Billboard>
    </group>
  );
}

// engine + isRunning are props; live rpm is read from dynoRef to avoid per-frame
// React re-renders.
export default function DynoApparatus({ engine, isRunning, dynoRef }) {
  const roller = useRef();
  const rearWheel = useRef();
  const frontWheel = useRef();
  const engineBlock = useRef();
  const loadCell = useRef();
  const tank = useRef();
  const tClock = useRef(0);

  const color = engine?.color || '#C0392B';

  const exhaustL = useMemo(() => new TubeGeometry(new CatmullRomCurve3([
    new Vector3(-0.15, 1.3, -0.12), new Vector3(-0.25, 1.05, -0.18), new Vector3(-0.3, 0.75, -0.22), new Vector3(-0.1, 0.45, -0.24),
  ]), 12, 0.022, 6, false), []);
  const exhaustR = useMemo(() => new TubeGeometry(new CatmullRomCurve3([
    new Vector3(-0.15, 1.3, 0.12), new Vector3(-0.25, 1.05, 0.18), new Vector3(-0.3, 0.75, 0.22), new Vector3(-0.1, 0.45, 0.24),
  ]), 12, 0.022, 6, false), []);

  useFrame((_, delta) => {
    if (tank.current && engine?.color) tank.current.material.color.lerp(new Color(engine.color), Math.min(1, delta * 6));
    const rpm = dynoRef?.current?.rpm || 0;
    const running = Boolean(dynoRef?.current?.running);
    if (loadCell.current) loadCell.current.material.emissiveIntensity = running ? 0.4 : 0.1;
    if (!running && !isRunning) return;
    const omega = (rpm * Math.PI) / 30;
    if (roller.current) roller.current.rotation.x += omega * delta;
    if (rearWheel.current) rearWheel.current.rotation.x += omega * delta;
    if (frontWheel.current) frontWheel.current.rotation.x += omega * 0.8 * delta;
    if (engineBlock.current) { tClock.current += delta; const f = rpm / 1000; engineBlock.current.position.y = 1.35 + Math.sin(tClock.current * f * Math.PI * 2) * 0.004; }
  });

  const frame = (c, m = 0.7, r = 0.4) => <meshStandardMaterial color={c} metalness={m} roughness={r} />;

  return (
    <group>
      <ambientLight intensity={0.45} />
      <directionalLight position={[5, 8, 5]} intensity={1.1} />
      <OrbitControls enableDamping dampingFactor={0.08} autoRotate={false} maxPolarAngle={Math.PI / 2.1} target={[0, 1.4, 0]} />

      {/* ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[12, 8]} />{frame('#cfd6df', 0, 1)}</mesh>

      {/* dyno frame */}
      <mesh position={[0, 0.1, 0]}><boxGeometry args={[3.0, 0.2, 1.8]} />{frame('#2A2A2A')}</mesh>
      <mesh position={[-1.3, 0.55, 0]}><boxGeometry args={[0.15, 0.7, 1.8]} />{frame('#2A2A2A')}</mesh>
      <mesh position={[1.3, 0.55, 0]}><boxGeometry args={[0.15, 0.7, 1.8]} />{frame('#2A2A2A')}</mesh>

      {/* roller drum */}
      <mesh ref={roller} position={[0, 0.55, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.6, 0.6, 1.5, 32]} /><meshStandardMaterial color="#2C2C2C" metalness={0.8} roughness={0.3} emissive="#1E6FDB" emissiveIntensity={isRunning ? 0.12 : 0} /></mesh>
      <Label text="Roller Drum" at={[0, 1.0, 1.2]} to={[0, 0.7, 0.6]} />

      {/* torque arm + load cell (amber instrumentation) */}
      <mesh position={[1.75, 0.8, 0]}><boxGeometry args={[1.0, 0.08, 0.08]} />{frame('#E8A020', 0.5, 0.5)}</mesh>
      <mesh ref={loadCell} position={[2.25, 0.8, 0]}><boxGeometry args={[0.15, 0.2, 0.15]} /><meshStandardMaterial color="#E8A020" emissive="#E8A020" emissiveIntensity={0.1} /></mesh>
      <Label text="Torque Arm" at={[2.05, 1.2, 0.6]} to={[1.75, 0.85, 0]} />
      <Label text="Load Cell" at={[2.8, 0.95, 0.5]} to={[2.25, 0.85, 0]} />

      {/* motorcycle */}
      <mesh position={[0, 1.7, 0]} rotation={[0, 0, 0.12]}><boxGeometry args={[1.4, 0.1, 0.12]} />{frame('#444444', 0.4, 0.5)}</mesh>
      <mesh ref={tank} position={[0.1, 1.95, 0]} scale={[0.55, 0.35, 0.28]}><sphereGeometry args={[1, 16, 12]} /><meshStandardMaterial color={color} metalness={0.6} roughness={0.3} /></mesh>
      <mesh position={[-0.45, 1.85, 0]}><boxGeometry args={[0.5, 0.1, 0.22]} /><meshStandardMaterial color={color} metalness={0.5} roughness={0.4} /></mesh>
      <mesh ref={engineBlock} position={[0.05, 1.35, 0]}><boxGeometry args={[0.45, 0.38, 0.3]} />{frame('#333333', 0.6, 0.4)}</mesh>
      <Label text="Engine" at={[-0.75, 1.05, 0.8]} to={[0.05, 1.35, 0.15]} />
      <mesh position={[0.82, 1.5, -0.1]} rotation={[0, 0, -0.3]}><cylinderGeometry args={[0.025, 0.025, 0.7, 8]} />{frame('#888888', 0.9, 0.2)}</mesh>
      <mesh position={[0.82, 1.5, 0.1]} rotation={[0, 0, -0.3]}><cylinderGeometry args={[0.025, 0.025, 0.7, 8]} />{frame('#888888', 0.9, 0.2)}</mesh>
      <mesh ref={rearWheel} position={[0, 1.7, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.55, 0.55, 0.15, 32]} />{frame('#1A1A1A', 0.4, 0.7)}</mesh>
      <Label text="Drive Wheel" at={[0.75, 2.4, 0.8]} to={[0, 2.0, 0]} />
      <mesh ref={frontWheel} position={[1.05, 1.35, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.42, 0.42, 0.12, 32]} />{frame('#1A1A1A', 0.4, 0.7)}</mesh>

      {/* exhaust */}
      <mesh geometry={exhaustL}><meshStandardMaterial color="#B87333" metalness={0.8} roughness={0.25} /></mesh>
      <mesh geometry={exhaustR}><meshStandardMaterial color="#B87333" metalness={0.8} roughness={0.25} /></mesh>
    </group>
  );
}
