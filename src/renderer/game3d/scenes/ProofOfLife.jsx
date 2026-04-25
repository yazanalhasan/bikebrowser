// Visual test bed for the camera presets. Includes a few elements
// at different positions and heights so each camera angle reveals a
// distinctly-different composition: garage stands tall in side view,
// the stone path reads clearly in top-down, the angled view shows
// both. Once real screens land, this scene is deleted.

import { RigidBody, CuboidCollider } from '@react-three/rapier';

const PALETTE = {
  sand: '#f0d18a',
  path: '#b8863a',
  grass: '#4f7a52',
  portalAccent: '#2b5f91',
  garageWall: '#8a6a4a',
  garageRoof: '#5a3a2a',
  zuzu: '#e85c5c',
  marker: '#f0c14a',
  testCube: '#d94a8c',
};

// Ground plane is a fixed RigidBody so dynamic bodies have something
// to land on. The visible mesh is the same flat plane as before; we
// attach a thin cuboid collider with its top face flush at y=0 so
// objects rest at y = halfHeight (height-of-object). Half-height of
// the slab is 0.05 (10cm thick), placed at y = -0.05 so the top sits
// at y = 0 and the visual plane (also at y = 0) reads correctly.
function GroundPlane() {
  return (
    <RigidBody type="fixed" colliders={false}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color={PALETTE.sand} />
      </mesh>
      <CuboidCollider args={[15, 0.05, 15]} position={[0, -0.05, 0]} />
    </RigidBody>
  );
}

function Garage() {
  return (
    <group position={[-5, 0, -3]}>
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 3, 3]} />
        <meshStandardMaterial color={PALETTE.garageWall} />
      </mesh>
      <mesh position={[0, 3.5, 0]} castShadow>
        <coneGeometry args={[2.4, 1.6, 4]} />
        <meshStandardMaterial color={PALETTE.garageRoof} />
      </mesh>
    </group>
  );
}

function StonePath() {
  const stones = [];
  for (let i = 0; i < 8; i++) {
    const z = 4 - i * 1.1;
    const x = -3.5 + i * 0.45;
    stones.push(
      <mesh key={i} position={[x, 0.05, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.5, 16]} />
        <meshStandardMaterial color={PALETTE.path} />
      </mesh>,
    );
  }
  return <>{stones}</>;
}

function Zuzu() {
  return (
    <group position={[2, 0, 2]}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <capsuleGeometry args={[0.3, 0.6, 4, 8]} />
        <meshStandardMaterial color={PALETTE.zuzu} />
      </mesh>
      <mesh position={[0, 1.3, 0]} castShadow>
        <sphereGeometry args={[0.28, 16, 12]} />
        <meshStandardMaterial color="#f4cba0" />
      </mesh>
    </group>
  );
}

function PortalMarker() {
  return (
    <mesh position={[5, 0.5, -2]} castShadow>
      <torusGeometry args={[0.8, 0.18, 12, 24]} />
      <meshStandardMaterial color={PALETTE.portalAccent} emissive={PALETTE.portalAccent} emissiveIntensity={0.4} />
    </mesh>
  );
}

function GrassTuft({ position }) {
  return (
    <mesh position={position} castShadow>
      <icosahedronGeometry args={[0.35, 0]} />
      <meshStandardMaterial color={PALETTE.grass} flatShading />
    </mesh>
  );
}

// "Rapier is alive" smoke test: a 0.5m magenta cube spawned 3m above
// the ground. With default density it should drop and settle on the
// ground plane within ~1s of mount. Downstream agents (bike-physics,
// edge-detector) should remove this once real dynamic bodies exist.
function PhysicsSmokeTestCube() {
  return (
    <RigidBody type="dynamic" position={[0, 3, 0]} colliders="cuboid">
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color={PALETTE.testCube} />
      </mesh>
    </RigidBody>
  );
}

export default function ProofOfLife() {
  return (
    <>
      <GroundPlane />
      <StonePath />
      <Garage />
      <Zuzu />
      <PortalMarker />
      <GrassTuft position={[-2, 0.3, 4]} />
      <GrassTuft position={[4, 0.3, 4]} />
      <GrassTuft position={[-6, 0.3, 1]} />
      <GrassTuft position={[6, 0.3, 0]} />
      <PhysicsSmokeTestCube />
    </>
  );
}
