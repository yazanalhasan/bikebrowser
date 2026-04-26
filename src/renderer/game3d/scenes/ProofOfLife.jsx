// Visual test bed for the camera presets and input layer. Includes a
// player-controllable Zuzu (WASD / arrows) plus decorative scene props
// at varied positions and heights so each camera angle reveals a
// distinctly-different composition: garage stands tall in side view,
// the stone path reads clearly in top-down, the angled view shows both.
// Once real screens land, this scene is deleted.

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
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
  trunk: '#5a3a2a',
  pine: '#386a3a',
  pinePale: '#4d8048',
  millPost: '#d6d6d6',
  millBlade: '#f0d18a',
  bikeFrame: '#e85c5c',
  bikeWheel: '#1c1c1c',
  flagPole: '#bdbdbd',
  flagCloth: '#2b5f91',
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
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color={PALETTE.sand} />
      </mesh>
      <CuboidCollider args={[20, 0.05, 20]} position={[0, -0.05, 0]} />
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

// Player — Zuzu, controlled by WASD/arrows via the inputRef bridge.
// Uses a plain group whose position we mutate in useFrame. We also
// copy the live position into posRef each frame so the active camera
// can follow.
function Player({ inputRef, posRef }) {
  const groupRef = useRef();

  useFrame((_, dt) => {
    if (!groupRef.current) return;
    const i = inputRef?.current;
    if (!i) return;

    // Diagonal magnitude clamp so diagonal movement isn't sqrt(2)x faster.
    const mx = i.moveX || 0;
    const my = i.moveY || 0;
    const mag = Math.hypot(mx, my);
    const norm = mag > 1 ? mag : 1;
    const speed = 5; // m/s

    groupRef.current.position.x += (mx / norm) * speed * dt;
    groupRef.current.position.z += (-my / norm) * speed * dt; // moveY+ = forward = -Z

    // Face direction of travel (yaw only).
    if (mx !== 0 || my !== 0) {
      const yaw = Math.atan2(mx, -my);
      groupRef.current.rotation.y = yaw;
    }

    if (posRef?.current) posRef.current.copy(groupRef.current.position);
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Body */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <capsuleGeometry args={[0.3, 0.6, 4, 8]} />
        <meshStandardMaterial color={PALETTE.zuzu} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.3, 0]} castShadow>
        <sphereGeometry args={[0.28, 16, 12]} />
        <meshStandardMaterial color="#f4cba0" />
      </mesh>
      {/* Tiny "facing" nose so direction is visible — sphere on the
          -Z side of the head, which is "forward" before the group's
          yaw rotation is applied. */}
      <mesh position={[0, 1.3, -0.28]} castShadow>
        <sphereGeometry args={[0.08, 10, 8]} />
        <meshStandardMaterial color="#f0a070" />
      </mesh>
    </group>
  );
}

function PortalMarker() {
  const ref = useRef();
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 1.2;
  });
  return (
    <mesh ref={ref} position={[5, 0.7, -2]} castShadow>
      <torusGeometry args={[0.8, 0.18, 12, 24]} />
      <meshStandardMaterial
        color={PALETTE.portalAccent}
        emissive={PALETTE.portalAccent}
        emissiveIntensity={0.4}
      />
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

function Tree({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.18, 1.0, 6]} />
        <meshStandardMaterial color={PALETTE.trunk} />
      </mesh>
      <mesh position={[0, 1.5, 0]} castShadow>
        <coneGeometry args={[0.7, 1.6, 8]} />
        <meshStandardMaterial color={PALETTE.pine} flatShading />
      </mesh>
      <mesh position={[0, 2.2, 0]} castShadow>
        <coneGeometry args={[0.5, 1.0, 8]} />
        <meshStandardMaterial color={PALETTE.pinePale} flatShading />
      </mesh>
    </group>
  );
}

function Windmill({ position }) {
  const blades = useRef();
  useFrame((_, dt) => {
    if (blades.current) blades.current.rotation.z += dt * 0.9;
  });
  return (
    <group position={position}>
      {/* Tower */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.28, 3.2, 8]} />
        <meshStandardMaterial color={PALETTE.millPost} />
      </mesh>
      {/* Cap */}
      <mesh position={[0, 3.3, 0]} castShadow>
        <sphereGeometry args={[0.32, 12, 8]} />
        <meshStandardMaterial color={PALETTE.garageRoof} />
      </mesh>
      {/* Blades */}
      <group ref={blades} position={[0, 2.95, 0.34]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh
            key={i}
            position={[0, 0, 0]}
            rotation={[0, 0, (i * Math.PI) / 2]}
            castShadow
          >
            <boxGeometry args={[1.6, 0.18, 0.05]} />
            <meshStandardMaterial color={PALETTE.millBlade} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Bike({ position, rotation = [0, Math.PI / 6, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Wheels */}
      <mesh position={[-0.45, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.3, 0.05, 8, 20]} />
        <meshStandardMaterial color={PALETTE.bikeWheel} />
      </mesh>
      <mesh position={[0.45, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.3, 0.05, 8, 20]} />
        <meshStandardMaterial color={PALETTE.bikeWheel} />
      </mesh>
      {/* Top tube */}
      <mesh position={[0, 0.55, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.85, 8]} />
        <meshStandardMaterial color={PALETTE.bikeFrame} />
      </mesh>
      {/* Down tube — slanted */}
      <mesh position={[0.05, 0.4, 0]} rotation={[0, 0, Math.PI / 3]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.7, 8]} />
        <meshStandardMaterial color={PALETTE.bikeFrame} />
      </mesh>
      {/* Seat post */}
      <mesh position={[-0.25, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.4, 8]} />
        <meshStandardMaterial color={PALETTE.bikeFrame} />
      </mesh>
      {/* Saddle */}
      <mesh position={[-0.25, 0.82, 0]} castShadow>
        <boxGeometry args={[0.22, 0.05, 0.1]} />
        <meshStandardMaterial color="#1c1c1c" />
      </mesh>
      {/* Handlebars */}
      <mesh position={[0.45, 0.78, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.35, 8]} />
        <meshStandardMaterial color="#1c1c1c" />
      </mesh>
      <mesh position={[0.45, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.4, 8]} />
        <meshStandardMaterial color={PALETTE.bikeFrame} />
      </mesh>
    </group>
  );
}

function FlagPole({ position }) {
  const cloth = useRef();
  useFrame((s) => {
    // Gentle "flutter" — sway by a small angle on the world Y axis.
    if (cloth.current) {
      cloth.current.rotation.y = Math.sin(s.clock.elapsedTime * 2.5) * 0.18;
    }
  });
  return (
    <group position={position}>
      <mesh position={[0, 1.3, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 2.6, 6]} />
        <meshStandardMaterial color={PALETTE.flagPole} />
      </mesh>
      <group ref={cloth} position={[0, 2.3, 0]}>
        <mesh position={[0.32, 0, 0]} castShadow>
          <boxGeometry args={[0.6, 0.4, 0.02]} />
          <meshStandardMaterial color={PALETTE.flagCloth} />
        </mesh>
      </group>
    </group>
  );
}

// "Rapier is alive" smoke test: a 0.5m magenta cube spawned 3m above
// the ground. With default density it should drop and settle on the
// ground plane within ~1s of mount. Downstream agents (bike-physics,
// edge-detector) should remove this once real dynamic bodies exist.
function PhysicsSmokeTestCube({ position = [0, 3, 0] }) {
  return (
    <RigidBody type="dynamic" position={position} colliders="cuboid">
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color={PALETTE.testCube} />
      </mesh>
    </RigidBody>
  );
}

export default function ProofOfLife({ inputRef, playerPosRef }) {
  return (
    <>
      <GroundPlane />
      <StonePath />
      <Garage />

      {/* Trees scattered around the perimeter */}
      <Tree position={[-9, 0, -8]} scale={1.1} />
      <Tree position={[-7, 0, 6]} scale={0.9} />
      <Tree position={[-3, 0, 9]} />
      <Tree position={[8, 0, 7]} scale={1.2} />
      <Tree position={[10, 0, -4]} />
      <Tree position={[6, 0, -9]} scale={0.95} />

      {/* Animated props so the world feels alive */}
      <Windmill position={[7, 0, 4]} />
      <FlagPole position={[-5, 0, 4]} />

      {/* A bike sitting outside the garage, ready to ride */}
      <Bike position={[-3.2, 0, -1.5]} rotation={[0, Math.PI / 5, 0]} />

      {/* Decoration */}
      <PortalMarker />
      <GrassTuft position={[-2, 0.3, 4]} />
      <GrassTuft position={[4, 0.3, 4]} />
      <GrassTuft position={[-6, 0.3, 1]} />
      <GrassTuft position={[6, 0.3, 0]} />
      <GrassTuft position={[1.5, 0.3, -5]} />
      <GrassTuft position={[-1, 0.3, -7]} />
      <GrassTuft position={[3, 0.3, 6]} />

      {/* Two falling cubes — push each other around for physics fun */}
      <PhysicsSmokeTestCube position={[0.2, 3, 0]} />
      <PhysicsSmokeTestCube position={[-0.2, 4.5, 0.3]} />
      <PhysicsSmokeTestCube position={[0.4, 6, -0.2]} />

      {/* The player — last so it's drawn after the ground/path */}
      <Player inputRef={inputRef} posRef={playerPosRef} />
    </>
  );
}
