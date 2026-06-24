import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import BridgeMesh from './BridgeMesh.jsx';
import MaterialAssignmentPanel from './MaterialAssignmentPanel.jsx';
import BridgeResultsPanel from './BridgeResultsPanel.jsx';
import { useBridgeSounds } from './useBridgeSounds.js';
import { getUtmMaterialById } from '../utm/utmMaterials.js';
import { computeBridgeSim, roleSuitabilities, VERDICT_LABEL, VERDICT_COLOR } from './bridgeModel.js';
import { DEFAULT_ROLE_MATERIALS } from './bridgeTasks.js';
import PredictBar from '../scenekit/PredictBar.jsx';
import { callRuntime, emitGameEvent } from '../scenekit/gameBridge.js';
import '../utm/utm.css';
import './bridge.css';

const LOAD_MS = 3200;
const VERDICTS = [
  { id: 'pass', label: 'Holds', color: '#22C55E' },
  { id: 'marginal', label: 'Survives', color: '#EAB308' },
  { id: 'fail', label: 'Fails', color: '#EF4444' },
];

export default function BridgeDesignLab({ onBridgeComplete } = {}) {
  const [materials, setMaterials] = useState(() => ({
    deck: getUtmMaterialById(DEFAULT_ROLE_MATERIALS.deck),
    cables: getUtmMaterialById(DEFAULT_ROLE_MATERIALS.cables),
    towers: getUtmMaterialById(DEFAULT_ROLE_MATERIALS.towers),
  }));
  const [phase, setPhase] = useState('idle');
  const [sim, setSim] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [predicted, setPredicted] = useState(null);
  const [revealed, setRevealed] = useState(false);

  const bridgeRef = useRef({ phase: 'idle', loadPos: 0.5, maxDeflection: 0 });
  const rafRef = useRef(0);
  const sounds = useBridgeSounds();
  const suit = useMemo(() => roleSuitabilities(materials), [materials]);

  const reset = useCallback((next = materials) => {
    cancelAnimationFrame(rafRef.current);
    setPhase('idle'); setSim(null); setShowResults(false);
    setPredicted(null); setRevealed(false);
    bridgeRef.current = { phase: 'idle', loadPos: 0.5, maxDeflection: 0 };
    void next;
  }, [materials]);

  const reassign = useCallback((role, id) => {
    const m = getUtmMaterialById(id);
    setMaterials((prev) => ({ ...prev, [role]: m }));
    reset();
  }, [reset]);

  const finish = useCallback((result) => {
    bridgeRef.current.phase = result.verdict;
    setPhase(result.verdict); setSim(result); setRevealed(true);
    // A bridge that holds (or just survives) repairs the wash crossing in-game.
    // completeBridgePlan only sets the tested plan if every material was proven in
    // the UTM first; when it does, emit loadTest:done so NeighborhoodScene places
    // the span over the wash, opens the wider map, plays the Community Crossing,
    // and completes Chapter 1 (→ unlocks Chapter 2). Without this emit the lab
    // succeeded but nothing happened in the overworld.
    if (result.verdict !== 'fail') {
      const planResult = callRuntime('completeBridgePlan', 'tested_triangle_plan');
      if (planResult && planResult.ok) emitGameEvent('loadTest:done', { ok: true, plan: 'tested_triangle_plan' });
    }
    if (result.verdict === 'fail') {
      sounds.concreteCrack();
      setTimeout(() => sounds.cableSnap(), 420);
      setTimeout(() => setShowResults(true), 1900);
    } else {
      setTimeout(() => setShowResults(true), 700);
    }
    onBridgeComplete?.(result.verdict);
  }, [sounds, onBridgeComplete]);

  const runTest = useCallback(() => {
    if (phase === 'loading') return;
    const result = computeBridgeSim(materials);
    setShowResults(false); setSim(null); setPhase('loading');
    bridgeRef.current = { phase: 'loading', loadPos: 0, maxDeflection: result.maxDeflection };
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / LOAD_MS, 1);
      bridgeRef.current.loadPos = t;
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else finish(result);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [phase, materials, finish]);

  return (
    <div className="utm-lab">
      <header className="utm-lab__bar">
        <div className="utm-lab__title">Bridge Design — Load Test</div>
        {phase !== 'idle' && phase !== 'loading' && (
          <div className="utm-lab__bar-right">
            <span style={{ color: VERDICT_COLOR[phase], fontWeight: 800, fontSize: 14, letterSpacing: '.04em' }}>{VERDICT_LABEL[phase]}</span>
            <button type="button" className="utm-btn utm-btn--ghost" onClick={() => reset()}>↺ Reset</button>
          </div>
        )}
      </header>

      <div className="br-body">
        <div className="utm-canvas-wrap" style={{ background: '#e8edf4' }}>
          <Canvas camera={{ position: [0, 2.6, 15], fov: 40 }} dpr={[1, 2]}>
            <color attach="background" args={['#e8edf4']} />
            <BridgeMesh materials={materials} bridgeRef={bridgeRef} />
          </Canvas>
        </div>

        <div className="br-side">
          <PredictBar
            prompt="Predict: will your bridge hold the load test?"
            options={VERDICTS}
            predicted={predicted}
            onPredict={setPredicted}
            revealed={revealed}
            actual={sim ? sim.verdict : null}
            disabled={phase === 'loading'}
          />
          <MaterialAssignmentPanel materials={materials} suit={suit} onReassign={reassign} onRun={runTest} phase={phase} canRun={Boolean(predicted)} />
        </div>
      </div>

      {showResults && <BridgeResultsPanel sim={sim} materials={materials} onRetry={() => reset()} onClose={() => setShowResults(false)} />}
    </div>
  );
}
