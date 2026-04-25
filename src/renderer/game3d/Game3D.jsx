import { useEffect, useState } from 'react';
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

const SCREEN_TARGET = [0, 0, 0];

export default function Game3D() {
  const [camMode, setCamMode] = useState('angled');
  const physicsDebug = usePhysicsDebug();

  useEffect(() => {
    const onKey = (e) => {
      const next = CAM_MODES[e.key];
      if (next) setCamMode(next);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <InputProvider>
    <div style={{ width: '100%', height: 'calc(100vh - 80px)', minHeight: 500, position: 'relative' }}>
      <Canvas shadows>
        {camMode === 'side' && <SideCam target={SCREEN_TARGET} distance={16} />}
        {camMode === 'angled' && <AngledCam target={SCREEN_TARGET} distance={14} angleDeg={30} />}
        {camMode === 'top' && <TopCam target={SCREEN_TARGET} distance={16} />}
        <Sky sunPosition={[8, 12, 6]} turbidity={4} rayleigh={1.2} />
        <PhysicsWorld debug={physicsDebug}>
          <BaseLighting />
          <ProofOfLife />
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
        camera: <strong>{camMode}</strong> &middot; press 1 side / 2 angled / 3 top &middot; P physics debug{physicsDebug ? ' (on)' : ''} &middot; F1 input debug
      </div>
      {/* InputDebugHUD reads debug toggle state from InputProvider */}
      <InputDebugHUDFromContext />
    </div>
    </InputProvider>
  );
}

// Thin bridge: reads the debug flag from InputProvider so we don't need
// to plumb it through Game3D's own state.  Must be inside InputProvider.
function InputDebugHUDFromContext() {
  const { debug } = useInput();
  return <InputDebugHUD visible={debug} />;
}
