import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import AngledCam from './cameras/AngledCam';
import SideCam from './cameras/SideCam';
import TopCam from './cameras/TopCam';
import BaseLighting from './lighting/BaseLighting';
import ProofOfLife from './scenes/ProofOfLife';
import PhysicsWorld from './physics/PhysicsWorld';
import usePhysicsDebug from './physics/usePhysicsDebug';
import InputProvider from './input/InputProvider';
import InputDebugHUD from './input/InputDebugHUD';
import useInput from './input/useInput';

const CAM_MODES = {
  '1': 'side',
  '2': 'angled',
  '3': 'top',
};

export default function Game3D() {
  return (
    <InputProvider>
      <Game3DInner />
    </InputProvider>
  );
}

// Mirror the useInput() state into a ref so the rest of the tree doesn't
// re-render on every input frame. Renders nothing.
function InputRefBridge({ inputRef }) {
  const i = useInput();
  inputRef.current = i;
  return null;
}

// Reads only the debug flag so it re-renders rarely.
function InputDebugHUDBridge() {
  const { debug } = useInput();
  return <InputDebugHUD visible={debug} />;
}

function Game3DInner() {
  const [camMode, setCamMode] = useState('angled');
  const physicsDebug = usePhysicsDebug();

  // Live input state in a ref — written by InputRefBridge, read by Player.
  const inputRef = useRef({
    moveX: 0,
    moveY: 0,
    action: false,
    cancel: false,
    debug: false,
    source: 'keyboard',
  });

  // Live player position — written by Player every frame, read by cameras.
  const playerPosRef = useRef(new THREE.Vector3(0, 0.6, 0));

  useEffect(() => {
    const onKey = (e) => {
      const next = CAM_MODES[e.key];
      if (next) setCamMode(next);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 80px)', minHeight: 500, position: 'relative' }}>
      <InputRefBridge inputRef={inputRef} />
      <Canvas shadows>
        {camMode === 'side' && <SideCam targetRef={playerPosRef} distance={16} />}
        {camMode === 'angled' && <AngledCam targetRef={playerPosRef} distance={14} angleDeg={30} />}
        {camMode === 'top' && <TopCam targetRef={playerPosRef} distance={16} />}
        <Sky sunPosition={[8, 12, 6]} turbidity={4} rayleigh={1.2} />
        <PhysicsWorld debug={physicsDebug}>
          <BaseLighting />
          <ProofOfLife inputRef={inputRef} playerPosRef={playerPosRef} />
        </PhysicsWorld>
      </Canvas>
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          padding: '6px 10px',
          background: 'rgba(0,0,0,0.55)',
          color: '#fff',
          fontFamily: 'monospace',
          fontSize: 12,
          borderRadius: 4,
          pointerEvents: 'none',
        }}
      >
        WASD / arrows to move &middot; camera: <strong>{camMode}</strong> &middot; 1 side / 2 angled / 3 top &middot; P physics debug{physicsDebug ? ' (on)' : ''} &middot; F1 input debug
      </div>
      <InputDebugHUDBridge />
    </div>
  );
}
