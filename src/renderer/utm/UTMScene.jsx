import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Line, OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { clamp, lerp, easeInOutCubic, phase } from './easing.js';

// ─── Educational colour code ────────────────────────────────────────────────
const C_FRAME = '#2C2C2C'; // structural, non-moving
const C_MOVING = '#1E6FDB'; // moving / actuated
const C_INSTRUMENT = '#E8A020'; // measurement
const C_GRIP = '#3A3A3A';
const C_ACTUATOR = '#4A90D9';
const C_LABEL = '#F5F5F5';

// Vertical layout (specimen is clamped between the fixed upper grip bottom and
// the moving lower grip top, and stays coupled to both as the test runs).
const FIXED_TOP = 3.4; // specimen top = upper grip bottom (never moves)
const LOWER_GRIP_REST = 2.24; // lower grip centre at rest
const LOWER_CROSS_REST = 2.05; // lower crosshead centre at rest
const MAX_DROP = 0.3; // total downward travel of the moving crosshead

// Phase boundaries on the normalised timeline t∈[0,1].
const ELASTIC_END = 0.4;
const PLASTIC_END = 0.85;

function flat(color) {
  return <meshStandardMaterial color={color} flatShading metalness={0} roughness={1} />;
}

// Camera-facing annotation: dark pill + light text + L-shaped leader line.
function Annotation({ text, anchor, label }) {
  const leader = useMemo(() => [anchor, [label[0], anchor[1], anchor[2]], label], [anchor, label]);
  return (
    <group>
      <Line points={leader} color={C_INSTRUMENT} lineWidth={1} />
      <Billboard position={label}>
        <mesh>
          <planeGeometry args={[text.length * 0.082 + 0.2, 0.26]} />
          <meshBasicMaterial color="#11151c" transparent opacity={0.72} />
        </mesh>
        <Text fontSize={0.135} color={C_LABEL} anchorX="center" anchorY="middle">
          {text}
        </Text>
      </Billboard>
    </group>
  );
}

export default function UTMScene({ material, onTestComplete, isRunning, progressRef, onPhase, onFx }) {
  const root = useRef();
  const lowerCrosshead = useRef();
  const lowerGrip = useRef();
  const actuator = useRef();
  const specimen = useRef();
  const extLeft = useRef();
  const extRight = useRef();
  const extLine = useRef();
  const upperHalf = useRef();
  const lowerHalf = useRef();
  const matColor = useRef(new THREE.Color(material?.color || '#8899AA'));
  const tl = useRef({ t: 0, running: false, firedCreak: false, fractureClock: 0, done: false });

  // Subdivided specimen geometry so the midpoint can be pinched (necking).
  const baseGeo = useMemo(() => {
    const g = new THREE.BoxGeometry(0.12, 1.0, 0.12, 1, 28, 1);
    g.userData.orig = Float32Array.from(g.attributes.position.array);
    return g;
  }, []);

  useEffect(() => {
    if (isRunning) { tl.current = { t: 0, running: true, firedCreak: false, fractureClock: 0, done: false }; onPhase?.('elastic'); }
    else tl.current.running = false;
  }, [isRunning, onPhase]);

  useEffect(() => { resetSpecimen(); /* new specimen on material change */
  }, [material?.id]);

  function setSpecimenLength(L) {
    // top fixed at FIXED_TOP, geometry stretched to length L, recentre the mesh.
    if (specimen.current) specimen.current.position.y = FIXED_TOP - L / 2;
    const yc = FIXED_TOP - L / 2;
    if (extLeft.current) extLeft.current.position.y = yc;
    if (extRight.current) extRight.current.position.y = yc;
  }

  function resetSpecimen() {
    tl.current = { t: 0, running: false, firedCreak: false, fractureClock: 0, done: false };
    if (progressRef) progressRef.current = { t: 0, phase: 'idle' };
    baseGeo.attributes.position.array.set(baseGeo.userData.orig);
    baseGeo.attributes.position.needsUpdate = true;
    baseGeo.computeVertexNormals();
    if (specimen.current) { specimen.current.visible = true; }
    setSpecimenLength(1.0);
    if (upperHalf.current) upperHalf.current.visible = false;
    if (lowerHalf.current) lowerHalf.current.visible = false;
    if (lowerGrip.current) lowerGrip.current.position.y = LOWER_GRIP_REST;
    if (lowerCrosshead.current) lowerCrosshead.current.position.y = LOWER_CROSS_REST;
    if (actuator.current) actuator.current.scale.y = 1;
    if (root.current) root.current.position.set(0, 0, 0);
  }

  // Pinch the specimen midpoint + apply Poisson contraction, at the given length.
  function deformSpecimen(L, poisson, neck) {
    const pos = baseGeo.attributes.position.array;
    const orig = baseGeo.userData.orig;
    for (let i = 0; i < pos.length; i += 3) {
      const oy = orig[i + 1];
      const yNorm = oy * 2;
      const pinch = neck * Math.exp(-(yNorm * yNorm) / 0.06);
      const radial = poisson * (1 - pinch);
      pos[i] = orig[i] * radial;
      pos[i + 1] = oy * L;
      pos[i + 2] = orig[i + 2] * radial;
    }
    baseGeo.attributes.position.needsUpdate = true;
    baseGeo.computeVertexNormals();
  }

  useFrame((state, delta) => {
    // ease specimen colour toward the loaded material (drag-drop swap)
    if (material?.color && specimen.current) {
      matColor.current.lerp(new THREE.Color(material.color), clamp(delta * 6));
      specimen.current.material.color.copy(matColor.current);
      if (upperHalf.current) upperHalf.current.material.color.copy(matColor.current);
      if (lowerHalf.current) lowerHalf.current.material.color.copy(matColor.current);
    }

    const s = tl.current;

    // decaying fracture shake on the content group + halves flying apart
    if (s.fractureClock > 0) {
      s.fractureClock += delta;
      const e = s.fractureClock;
      if (root.current) {
        if (e < 0.8) {
          root.current.position.x = Math.sin(e * 40) * 0.05 * Math.exp(-e * 8);
          root.current.position.y = Math.cos(e * 37) * 0.03 * Math.exp(-e * 8);
        } else { root.current.position.set(0, 0, 0); s.fractureClock = 0; }
      }
      if (upperHalf.current && lowerHalf.current) {
        const k = easeInOutCubic(clamp(e / 0.3));
        upperHalf.current.position.y = upperHalf.current.userData.base + 0.1 * k;
        lowerHalf.current.position.y = lowerHalf.current.userData.base - 0.1 * k;
      }
    }

    if (!s.running) return;

    const dur = (material?.testDurationMs || 4000) / 1000;
    s.t = clamp(s.t + delta / dur);
    if (progressRef) progressRef.current = { t: s.t, phase: phaseName(s.t) };
    const t = s.t;

    // moving crosshead / grip / actuator
    const drop = t <= ELASTIC_END
      ? lerp(0, MAX_DROP * 0.55, easeInOutCubic(phase(t, 0, ELASTIC_END)))
      : lerp(MAX_DROP * 0.55, MAX_DROP, easeInOutCubic(phase(t, ELASTIC_END, PLASTIC_END)));
    if (lowerCrosshead.current) lowerCrosshead.current.position.y = LOWER_CROSS_REST - drop;
    if (lowerGrip.current) lowerGrip.current.position.y = LOWER_GRIP_REST - drop;
    if (actuator.current) actuator.current.scale.y = 1 + drop * 0.6;

    if (t < PLASTIC_END) {
      const L = 1.0 + drop; // specimen stays clamped between the grips
      const poisson = t <= ELASTIC_END ? lerp(1.0, 0.97, phase(t, 0, ELASTIC_END)) : 0.97;
      const neck = t <= ELASTIC_END ? 0 : lerp(0, 0.45, easeInOutCubic(phase(t, ELASTIC_END, PLASTIC_END)));
      deformSpecimen(L, poisson, neck);
      setSpecimenLength(L);
      if (extLine.current) {
        const yc = FIXED_TOP - L / 2;
        extLine.current.geometry.setFromPoints([new THREE.Vector3(-0.12, yc, 0.06), new THREE.Vector3(0.12, yc, 0.06)]);
      }
      if (t >= 0.6 && !s.firedCreak) { s.firedCreak = true; onPhase?.('necking'); onFx?.('creak'); }
    } else if (!s.done) {
      // ── Phase 3: fracture ──
      s.done = true;
      s.running = false;
      s.fractureClock = 0.0001;
      onPhase?.('fracture');
      const Lf = 1.0 + MAX_DROP;
      const yc = FIXED_TOP - Lf / 2;
      if (specimen.current) specimen.current.visible = false;
      if (upperHalf.current) { upperHalf.current.visible = true; upperHalf.current.userData.base = yc + Lf / 4; upperHalf.current.position.y = upperHalf.current.userData.base; }
      if (lowerHalf.current) { lowerHalf.current.visible = true; lowerHalf.current.userData.base = yc - Lf / 4; lowerHalf.current.position.y = lowerHalf.current.userData.base; }
      onFx?.('fracture');
      if (progressRef) progressRef.current = { t: 1, phase: 'fracture' };
      onTestComplete?.(buildResults(material));
    }
  });

  const specColor = material?.color || '#8899AA';
  const halfH = (1.0 + MAX_DROP) / 2;

  return (
    <group ref={root}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[6, 8, 5]} intensity={1.2} />
      <OrbitControls enableDamping dampingFactor={0.08} autoRotate={false} target={[0, 2.4, 0]} />

      {/* base plate */}
      <mesh position={[0, 0.15, 0]}><boxGeometry args={[2.0, 0.3, 1.0]} />{flat(C_FRAME)}</mesh>

      {/* load frame columns */}
      {[-0.6, 0.6].map((x) => (
        <mesh key={x} position={[x, 2.2, 0]}><boxGeometry args={[0.2, 4.0, 0.2]} />{flat(C_FRAME)}</mesh>
      ))}

      {/* upper crosshead (fixed) */}
      <mesh position={[0, 4.05, 0]}><boxGeometry args={[1.6, 0.25, 0.3]} />{flat(C_FRAME)}</mesh>
      <Annotation text="Upper Crosshead (Fixed)" anchor={[0.4, 4.05, 0.16]} label={[2.05, 4.3, 0]} />

      {/* load cell */}
      <mesh position={[0, 3.8, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.16, 0.16, 0.14, 24]} />{flat(C_INSTRUMENT)}</mesh>
      <Annotation text="Load Cell" anchor={[0.12, 3.8, 0.12]} label={[1.85, 3.65, 0]} />

      {/* upper grip (fixed) */}
      <mesh position={[0, 3.56, 0]}><boxGeometry args={[0.26, 0.32, 0.26]} />{flat(C_GRIP)}</mesh>
      <Annotation text="Upper Grip" anchor={[0.14, 3.56, 0.14]} label={[1.7, 3.25, 0]} />

      {/* specimen (deformable) */}
      <mesh ref={specimen} position={[0, FIXED_TOP - 0.5, 0]} geometry={baseGeo}>
        <meshStandardMaterial color={specColor} flatShading metalness={0} roughness={1} />
      </mesh>
      <Annotation text="Specimen" anchor={[0.07, 2.9, 0.07]} label={[1.5, 2.9, 0]} />

      {/* fracture halves (hidden until fracture) */}
      <mesh ref={upperHalf} visible={false} position={[0, 3.05, 0]}><boxGeometry args={[0.1, halfH, 0.1]} /><meshStandardMaterial color={specColor} flatShading metalness={0} roughness={1} /></mesh>
      <mesh ref={lowerHalf} visible={false} position={[0, 2.45, 0]}><boxGeometry args={[0.1, halfH, 0.1]} /><meshStandardMaterial color={specColor} flatShading metalness={0} roughness={1} /></mesh>

      {/* extensometer tabs + connecting line */}
      <mesh ref={extLeft} position={[-0.12, 2.9, 0]}><boxGeometry args={[0.08, 0.05, 0.05]} />{flat(C_INSTRUMENT)}</mesh>
      <mesh ref={extRight} position={[0.12, 2.9, 0]}><boxGeometry args={[0.08, 0.05, 0.05]} />{flat(C_INSTRUMENT)}</mesh>
      <line ref={extLine}>
        <bufferGeometry />
        <lineBasicMaterial color={C_INSTRUMENT} />
      </line>
      <Annotation text="Extensometer" anchor={[0.16, 2.9, 0.04]} label={[1.65, 2.45, 0]} />

      {/* lower grip (moving) */}
      <mesh ref={lowerGrip} position={[0, LOWER_GRIP_REST, 0]}><boxGeometry args={[0.26, 0.32, 0.26]} />{flat(C_GRIP)}</mesh>
      <Annotation text="Lower Grip" anchor={[-0.14, LOWER_GRIP_REST, 0.14]} label={[-1.75, 2.45, 0]} />

      {/* lower crosshead (moving) */}
      <mesh ref={lowerCrosshead} position={[0, LOWER_CROSS_REST, 0]}><boxGeometry args={[1.6, 0.22, 0.3]} />{flat(C_MOVING)}</mesh>
      <Annotation text="Lower Crosshead (Moving)" anchor={[-0.4, LOWER_CROSS_REST, 0.16]} label={[-2.15, 1.95, 0]} />

      {/* actuator (hydraulic ram to base) */}
      <mesh ref={actuator} position={[0, 1.15, 0]}><cylinderGeometry args={[0.14, 0.14, 1.7, 20]} />{flat(C_ACTUATOR)}</mesh>
      <Annotation text="Actuator" anchor={[0.14, 1.15, 0.1]} label={[-1.7, 0.95, 0]} />
    </group>
  );
}

function phaseName(t) {
  if (t < ELASTIC_END) return 'elastic';
  if (t < PLASTIC_END) return 'necking';
  return 'fracture';
}

// Mechanical-property result object handed back on completion — sourced entirely
// from the (adapted) existing material config.
export function buildResults(material) {
  if (!material) return null;
  return {
    id: material.id,
    name: material.name,
    category: material.category,
    color: material.color,
    yieldStrength: material.yieldStrength,
    UTS: material.UTS,
    youngsModulus: material.youngsModulus,
    elongationAtBreak: material.elongationAtBreak,
    density: material.density,
    fractureStrain: material.fractureStrain,
    description: material.description,
    failureMode: material.failureMode,
    material,
  };
}
