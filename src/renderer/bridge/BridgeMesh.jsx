import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Line, OrbitControls, Text } from '@react-three/drei';
import { CatmullRomCurve3, TubeGeometry, Vector3, Color, BufferAttribute, SphereGeometry, BackSide, PlaneGeometry } from 'three';
import { deflectionAtX } from './bridgeModel.js';

const SPAN = 10;
const TOWER_HEIGHT = 3;
const DECK_Y = 0;
const DECK_WIDTH = 0.8;
const HANGER_COUNT = 7;
const FLOOR_BEAM_COUNT = 9;
const STRUCT = '#8899AA';
const ANNOT = '#FACC15';

const STRESS = { low: new Color('#2563EB'), med: new Color('#F59E0B'), high: new Color('#EF4444'), near: new Color('#7C3AED') };
function stressColor(s) {
  if (s < 0.33) return STRESS.low.clone().lerp(STRESS.med, s / 0.33);
  if (s < 0.66) return STRESS.med.clone().lerp(STRESS.high, (s - 0.33) / 0.33);
  return STRESS.high.clone().lerp(STRESS.near, Math.min(1, (s - 0.66) / 0.34));
}

const cableY = (t) => TOWER_HEIGHT - TOWER_HEIGHT * 4 * t * (1 - t) + DECK_Y;

function Annotation({ text, at, to }) {
  return (
    <group>
      <Line points={[to, at]} color={ANNOT} lineWidth={1} dashed dashSize={0.08} gapSize={0.05} />
      <Billboard position={at}>
        <mesh><planeGeometry args={[text.length * 0.09 + 0.2, 0.28]} /><meshBasicMaterial color="#0d1320" transparent opacity={0.72} /></mesh>
        <Text fontSize={0.17} color={ANNOT} anchorX="center" anchorY="middle">{text}</Text>
      </Billboard>
    </group>
  );
}

// The Sonoran-wash environment the bridge actually spans. Before this, the
// bridge floated in a flat gray void; grounding it in the desert crossing is
// most of the graphics lift. Sky dome (warm gradient), two sandy banks the
// towers stand on, and the dry-wash channel with a thin ribbon of water
// between them.
function DesertWash() {
  const sky = useMemo(() => {
    const g = new SphereGeometry(70, 32, 20);
    const top = new Color('#6ea9d6');   // high desert blue
    const horizon = new Color('#f3dcae'); // warm dusty haze
    const pos = g.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const t = Math.max(0, Math.min(1, (pos.getY(i) / 70 + 0.15) / 1.0));
      const c = horizon.clone().lerp(top, t);
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new BufferAttribute(colors, 3));
    return g;
  }, []);

  // Banks: the two landmasses the crossing reconnects. Their inner faces frame
  // the open wash; the towers/anchorages sit on them.
  return (
    <group>
      <mesh geometry={sky} renderOrder={-1}><meshBasicMaterial vertexColors side={BackSide} fog={false} /></mesh>
      {/* far desert backdrop so no dark void shows through the wash gap */}
      <mesh position={[0, 3, -12]}><planeGeometry args={[90, 44]} /><meshStandardMaterial color="#e3cfa4" roughness={1} /></mesh>
      {/* the far canyon bank across the wash (behind the deck) */}
      <mesh position={[0, -2.2, -6]}><boxGeometry args={[26, 6, 3]} /><meshStandardMaterial color="#c2925c" roughness={1} /></mesh>
      {/* riverbed under the whole scene */}
      <mesh position={[0, -2.4, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[60, 30]} /><meshStandardMaterial color="#b98a55" roughness={1} /></mesh>
      {/* left + right banks the towers stand on */}
      {[-7.3, 7.3].map((bx) => (
        <group key={bx} position={[bx, 0, 0]}>
          <mesh position={[0, -1.95, 0]} receiveShadow><boxGeometry args={[8, 3.7, 8]} /><meshStandardMaterial color="#c99a63" roughness={1} /></mesh>
          {/* sloped inner face carved by the wash */}
          <mesh position={[bx > 0 ? -4.1 : 4.1, -1.4, 0]} rotation={[0, 0, bx > 0 ? -0.5 : 0.5]}><boxGeometry args={[1.6, 2.6, 8]} /><meshStandardMaterial color="#b98a55" roughness={1} /></mesh>
        </group>
      ))}
      {/* damp channel sand nestled in the gap */}
      <mesh position={[0, -1.42, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[7.2, 5]} /><meshStandardMaterial color="#9c7746" roughness={1} /></mesh>
      {/* a thin ribbon of monsoon water */}
      <mesh position={[0, -1.36, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[6.6, 1.7]} /><meshStandardMaterial color="#5fa8b8" transparent opacity={0.78} metalness={0.35} roughness={0.2} /></mesh>
    </group>
  );
}

function LoadTruck({ groupRef }) {
  return (
    <group ref={groupRef} position={[0, 0.12, 0]}>
      <mesh position={[0.3, 0.18, 0]}><boxGeometry args={[0.35, 0.22, 0.3]} /><meshStandardMaterial color="#E85D04" roughness={0.6} /></mesh>
      <mesh position={[-0.2, 0.12, 0]}><boxGeometry args={[0.7, 0.16, 0.28]} /><meshStandardMaterial color="#F48C06" roughness={0.6} /></mesh>
      {[-0.35, 0.1].map((wx) => [-0.12, 0.12].map((wz) => (
        <mesh key={`${wx}-${wz}`} position={[wx, -0.04, wz]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.06, 0.06, 0.05, 12]} /><meshStandardMaterial color="#1a1a1a" /></mesh>
      )))}
    </group>
  );
}

export default function BridgeMesh({ materials, bridgeRef }) {
  const root = useRef();
  const deck = useRef();
  const deckGeoRef = useRef();
  const deckLeft = useRef();
  const deckRight = useRef();
  const towerL = useRef();
  const towerR = useRef();
  const cableL = useRef();
  const cableR = useRef();
  const truck = useRef();
  const failClock = useRef(0);

  const deckColor = materials.deck.color;
  const cableColor = materials.cables.color;
  const towerColor = materials.towers.color;

  const cableGeo = useMemo(() => {
    const make = (z) => {
      const pts = [];
      for (let i = 0; i <= 32; i++) { const t = i / 32; pts.push(new Vector3((t - 0.5) * SPAN, cableY(t), z)); }
      return new TubeGeometry(new CatmullRomCurve3(pts), 64, 0.02, 6, false);
    };
    return { left: make(-DECK_WIDTH / 2), right: make(DECK_WIDTH / 2) };
  }, []);

  const hangerXs = useMemo(() => Array.from({ length: HANGER_COUNT }, (_, i) => (i + 1) / (HANGER_COUNT + 1)), []);
  const floorXs = useMemo(() => Array.from({ length: FLOOR_BEAM_COUNT }, (_, i) => -SPAN / 2 + ((i + 1) / (FLOOR_BEAM_COUNT + 1)) * SPAN), []);

  // init deck vertex colors
  useEffect(() => {
    const geo = deckGeoRef.current; if (!geo) return;
    geo.userData.orig = Float32Array.from(geo.attributes.position.array);
    const n = geo.attributes.position.count;
    const colors = new Float32Array(n * 3);
    const base = new Color(deckColor);
    for (let i = 0; i < n; i++) { colors[i * 3] = base.r; colors[i * 3 + 1] = base.g; colors[i * 3 + 2] = base.b; }
    geo.setAttribute('color', new BufferAttribute(colors, 3));
  }, [deckColor]);

  function resetDeck() {
    const geo = deckGeoRef.current; if (geo?.userData?.orig) { geo.attributes.position.array.set(geo.userData.orig); geo.attributes.position.needsUpdate = true; geo.computeVertexNormals(); }
    if (deck.current) deck.current.visible = true;
    if (deckLeft.current) deckLeft.current.visible = false;
    if (deckRight.current) deckRight.current.visible = false;
    if (towerL.current) towerL.current.rotation.z = 0;
    if (towerR.current) towerR.current.rotation.z = 0;
    if (cableL.current) cableL.current.visible = true;
    if (cableR.current) cableR.current.visible = true;
    if (root.current) root.current.position.set(0, 0, 0);
    failClock.current = 0;
  }
  useEffect(() => { resetDeck(); /* eslint-disable-next-line */ }, [materials.deck.id, materials.cables.id, materials.towers.id]);

  useFrame((state, delta) => {
    const s = bridgeRef?.current; if (!s) return;
    const { phase, loadPos = 0.5, maxDeflection = 0 } = s;

    // move the truck along the deck
    if (truck.current && (phase === 'loading' || phase === 'pass' || phase === 'marginal')) {
      truck.current.position.x = (loadPos - 0.5) * SPAN;
      truck.current.visible = true;
    } else if (truck.current && phase === 'idle') {
      truck.current.visible = false;
    }

    // deck deflection + stress colour
    const geo = deckGeoRef.current;
    if (geo && geo.userData.orig && phase !== 'fail') {
      const pos = geo.attributes.position.array; const orig = geo.userData.orig;
      const col = geo.attributes.color;
      const intensity = Math.min(1, maxDeflection * 1.6);
      for (let i = 0; i < pos.length; i += 3) {
        const x = orig[i]; const t = (x + SPAN / 2) / SPAN;
        const delta2 = (phase === 'loading' || phase === 'marginal') ? deflectionAtX(t, loadPos, maxDeflection) : 0;
        pos[i + 1] = orig[i + 1] - delta2;
        if (col) { const dist = Math.abs(t - loadPos); const sv = Math.max(0, 1 - dist * 2.4) * intensity; const c = sv > 0.02 ? stressColor(sv) : new Color(deckColor); col.setXYZ(i / 3, c.r, c.g, c.b); }
      }
      geo.attributes.position.needsUpdate = true;
      if (col) col.needsUpdate = true;
      geo.computeVertexNormals();
    }

    // failure choreography
    if (phase === 'fail') {
      failClock.current += delta;
      const e = failClock.current;
      if (e < 0.02) { if (deck.current) deck.current.visible = false; if (deckLeft.current) deckLeft.current.visible = true; if (deckRight.current) deckRight.current.visible = true; }
      const k = Math.min(1, e / 1.2);
      if (deckLeft.current) { deckLeft.current.rotation.z = -0.4 * k; deckLeft.current.position.y = -1.4 * k; }
      if (deckRight.current) { deckRight.current.rotation.z = 0.4 * k; deckRight.current.position.y = -1.4 * k; }
      if (towerL.current) towerL.current.rotation.z = 0.14 * Math.min(1, e / 1.5);
      if (towerR.current) towerR.current.rotation.z = -0.1 * Math.min(1, e / 1.5);
      if (cableL.current && e > 0.4) cableL.current.visible = false;
      if (cableR.current && e > 0.6) cableR.current.visible = false;
      if (root.current) {
        if (e < 0.8) { root.current.position.x = Math.sin(e * 45) * 0.06 * Math.exp(-e * 6); root.current.position.y = Math.cos(e * 40) * 0.04 * Math.exp(-e * 6); }
        else root.current.position.set(0, 0, 0);
      }
    }
  });

  const struct = (c, m = 0.1, r = 0.7) => <meshStandardMaterial color={c} metalness={m} roughness={r} />;

  return (
    <group ref={root}>
      {/* warm late-afternoon desert light (matches arc.md's Sonoran palette) */}
      <hemisphereLight args={['#dfeaf5', '#c79a63', 0.75]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[6, 9, 4]} intensity={1.15} color="#fff2d8" castShadow />
      <directionalLight position={[-8, 4, -6]} intensity={0.35} color="#9fb8d6" />
      <DesertWash />
      <OrbitControls enableDamping dampingFactor={0.08} target={[0, 0.4, 0]} minDistance={6} maxDistance={26} maxPolarAngle={Math.PI / 2 + 0.15} />

      {/* deck (deformable + vertex-coloured) */}
      <mesh ref={deck} position={[0, DECK_Y, 0]}>
        <boxGeometry ref={deckGeoRef} args={[SPAN, 0.1, DECK_WIDTH, 24, 1, 1]} />
        <meshStandardMaterial vertexColors metalness={0.1} roughness={0.7} />
      </mesh>
      <Annotation text="Deck" at={[0, -0.7, 0]} to={[0, -0.05, 0]} />

      {/* split deck halves (failure) */}
      <mesh ref={deckLeft} visible={false} position={[-SPAN / 4, DECK_Y, 0]}><boxGeometry args={[SPAN / 2, 0.1, DECK_WIDTH]} />{struct(deckColor)}</mesh>
      <mesh ref={deckRight} visible={false} position={[SPAN / 4, DECK_Y, 0]}><boxGeometry args={[SPAN / 2, 0.1, DECK_WIDTH]} />{struct(deckColor)}</mesh>

      {/* girders */}
      {[-DECK_WIDTH / 2, DECK_WIDTH / 2].map((z) => (
        <mesh key={z} position={[0, DECK_Y - 0.02, z]}><boxGeometry args={[SPAN, 0.15, 0.08]} />{struct(STRUCT)}</mesh>
      ))}
      {/* floor beams */}
      {floorXs.map((x) => (<mesh key={x} position={[x, DECK_Y - 0.04, 0]}><boxGeometry args={[0.08, 0.12, DECK_WIDTH]} />{struct(STRUCT)}</mesh>))}

      {/* towers */}
      <mesh ref={towerL} position={[-SPAN / 2 + 0.5, TOWER_HEIGHT / 2, 0]}><boxGeometry args={[0.2, TOWER_HEIGHT, 0.2]} />{struct(towerColor, 0.2, 0.6)}</mesh>
      <mesh ref={towerR} position={[SPAN / 2 - 0.5, TOWER_HEIGHT / 2, 0]}><boxGeometry args={[0.2, TOWER_HEIGHT, 0.2]} />{struct(towerColor, 0.2, 0.6)}</mesh>
      <Annotation text="Tower" at={[-SPAN / 2 + 0.5, TOWER_HEIGHT + 0.5, 0]} to={[-SPAN / 2 + 0.5, TOWER_HEIGHT, 0]} />

      {/* main cables */}
      <mesh ref={cableL} geometry={cableGeo.left}>{struct(cableColor, 0.6, 0.3)}</mesh>
      <mesh ref={cableR} geometry={cableGeo.right}>{struct(cableColor, 0.6, 0.3)}</mesh>
      <Annotation text="Main Cable" at={[1.2, TOWER_HEIGHT + 0.3, 0]} to={[1.2, cableY((1.2 + SPAN / 2) / SPAN), 0]} />

      {/* hangers */}
      {[-DECK_WIDTH / 2, DECK_WIDTH / 2].map((z) => hangerXs.map((t) => {
        const len = cableY(t) - DECK_Y; const x = (t - 0.5) * SPAN;
        return (<mesh key={`${z}-${t}`} position={[x, DECK_Y + len / 2, z]}><cylinderGeometry args={[0.012, 0.012, len, 6]} />{struct(STRUCT, 0.3, 0.5)}</mesh>);
      }))}
      <Annotation text="Hanger" at={[2.6, 1.9, 0.6]} to={[2.5, cableY((2.5 + SPAN / 2) / SPAN) / 2, DECK_WIDTH / 2]} />

      {/* anchorages */}
      <mesh position={[-SPAN / 2 - 0.2, -0.1, 0]}><boxGeometry args={[0.4, 0.3, 0.4]} />{struct('#6B6B6B')}</mesh>
      <mesh position={[SPAN / 2 + 0.2, -0.1, 0]}><boxGeometry args={[0.4, 0.3, 0.4]} />{struct('#6B6B6B')}</mesh>
      <Annotation text="Anchorage" at={[-SPAN / 2 - 0.2, -0.7, 0]} to={[-SPAN / 2 - 0.2, 0.05, 0]} />

      <LoadTruck groupRef={truck} />
    </group>
  );
}
