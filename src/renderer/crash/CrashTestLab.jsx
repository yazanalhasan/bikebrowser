import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import CrashFacility from './CrashFacility.jsx';
import CrashResultCard from './CrashResultCard.jsx';
import CurvePanel from '../scenekit/CurvePanel.jsx';
import MaterialTray from '../utm/MaterialTray.jsx';
import { UTM_MATERIALS, getUtmMaterialById } from '../utm/utmMaterials.js';
import { useCrashSounds } from './useCrashSounds.js';
import { computeLoadResult, computeCrashResult, evaluateLoad, evaluateCrash } from './crashModel.js';
import PredictBar from '../scenekit/PredictBar.jsx';
import { emitGameEvent } from '../scenekit/gameBridge.js';
import '../utm/utm.css';
import './crash.css';

const VERDICTS = [
  { id: 'SUITABLE', label: 'Suitable', color: '#22C55E' },
  { id: 'MARGINAL', label: 'Marginal', color: '#EAB308' },
  { id: 'UNSUITABLE', label: 'Unsuitable', color: '#EF4444' },
];

export default function CrashTestLab({ onTested } = {}) {
  const [material, setMaterial] = useState(null);
  const [mode, setMode] = useState('load');
  const [speed, setSpeed] = useState(50);
  const [isRunning, setIsRunning] = useState(false);
  const [complete, setComplete] = useState(false);
  const [result, setResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [predicted, setPredicted] = useState(null);
  const [revealed, setRevealed] = useState(false);

  const crashRef = useRef({ t: 0, weightY: 0, deflect: 0, carX: -3, crumple: 0 });
  const rafRef = useRef(0);
  const sounds = useCrashSounds();

  const rating = useMemo(() => {
    if (!result) return null;
    return mode === 'load' ? evaluateLoad(result) : evaluateCrash(result);
  }, [result, mode]);

  const reset = useCallback((m = mode) => {
    cancelAnimationFrame(rafRef.current);
    setIsRunning(false); setComplete(false); setResult(null);
    setPredicted(null); setRevealed(false);
    crashRef.current = { t: 0, weightY: 0, deflect: 0, carX: m === 'crash' ? -3 : 0, crumple: 0 };
  }, [mode]);

  const load = useCallback((mat) => { setMaterial(mat); reset(); }, [reset]);

  const run = useCallback(() => {
    if (!material || isRunning) return;
    setComplete(false); setResult(null); setIsRunning(true);
    const start = performance.now();
    if (mode === 'load') {
      const res = computeLoadResult(material);
      const deflW = (res.maxDeflectionMm / 32) * 0.5;
      const DUR = 2600; let groaned = false;
      crashRef.current = { t: 0, weightY: 0, deflect: 0 };
      const tick = (now) => {
        const t = Math.min((now - start) / DUR, 1);
        crashRef.current.t = t;
        crashRef.current.weightY = 1.55 * Math.min(1, t / 0.85);
        crashRef.current.deflect = deflW * Math.min(1, t / 0.85);
        if (t > 0.6 && !groaned) { groaned = true; sounds.groan(); }
        if (t < 1) rafRef.current = requestAnimationFrame(tick);
        else { sounds.impact(0.8); crashRef.current.deflect = deflW * 1.15; setIsRunning(false); setResult(res); setComplete(true); setRevealed(true); onTested?.(material.id, 'load'); if (evaluateLoad(res).label === 'SUITABLE') emitGameEvent('crash:built', { material: material.id, mode: 'load' }); }
      };
      rafRef.current = requestAnimationFrame(tick);
    } else {
      const res = computeCrashResult(material, speed);
      const crumpleMax = Math.min(0.95, Math.max(0.2, res.intrusionMm / 420));
      const APPROACH = 1100; const CRUSH = 600; let banged = false;
      crashRef.current = { t: 0, carX: -3, crumple: 0 };
      const tick = (now) => {
        const e = now - start;
        if (e < APPROACH) { const a = e / APPROACH; crashRef.current.carX = -3 + a * 3.0; crashRef.current.t = a * 0.6; rafRef.current = requestAnimationFrame(tick); }
        else if (e < APPROACH + CRUSH) {
          if (!banged) { banged = true; sounds.impact(Math.min(1, speed / 60)); }
          const c = (e - APPROACH) / CRUSH; crashRef.current.crumple = crumpleMax * c; crashRef.current.carX = 0 + c * 0.1; crashRef.current.t = 0.6 + c * 0.4;
          rafRef.current = requestAnimationFrame(tick);
        } else { setIsRunning(false); setResult(res); setComplete(true); setRevealed(true); onTested?.(material.id, 'crash'); if (evaluateCrash(res).label === 'SUITABLE') emitGameEvent('crash:built', { material: material.id, mode: 'crash' }); }
      };
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [material, isRunning, mode, speed, sounds, onTested]);

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragActive(false);
    const id = e.dataTransfer.getData('application/x-utm-material') || e.dataTransfer.getData('text/plain');
    const m = getUtmMaterialById(id); if (m) load(m);
  }, [load]);

  return (
    <div className="utm-lab">
      <header className="utm-lab__bar">
        <div className="utm-lab__title">Crash &amp; Load Test Facility</div>
        <div className="utm-lab__bar-right">
          <div className="cr-toggle">
            <button type="button" className={mode === 'load' ? 'on' : ''} onClick={() => { setMode('load'); reset('load'); }}>Load Test</button>
            <button type="button" className={mode === 'crash' ? 'on' : ''} onClick={() => { setMode('crash'); reset('crash'); }}>Crash Test</button>
          </div>
        </div>
      </header>

      <div className="utm-lab__body">
        <MaterialTray materials={UTM_MATERIALS} selectedId={material?.id} onSelect={(id) => load(getUtmMaterialById(id))} />

        <div className="utm-lab__stage">
          <div className={`utm-canvas-wrap ${dragActive ? 'utm-canvas-wrap--drop' : ''}`}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setDragActive(true); }}
            onDragLeave={() => setDragActive(false)} onDrop={onDrop} style={{ background: '#e8edf4' }}>
            <Canvas camera={{ position: [5, 3.2, 6.5], fov: 46 }} dpr={[1, 2]}>
              <color attach="background" args={['#e8edf4']} />
              <CrashFacility material={material} mode={mode} crashRef={crashRef} />
            </Canvas>
            {!material && !dragActive && <div className="utm-empty-hint">Drag a material onto the test rig</div>}
          </div>
          <div className="utm-lab__controls">
            {mode === 'crash' && (
              <label className="cr-speed">Impact speed: <b>{speed} km/h</b>
                <input type="range" min="30" max="90" value={speed} disabled={isRunning} onChange={(e) => setSpeed(Number(e.target.value))} />
              </label>
            )}
            <button type="button" className="utm-btn utm-btn--run" onClick={run} disabled={isRunning || !material || !predicted} title={material && !predicted ? 'Make a prediction first' : ''}>
              {mode === 'load' ? '▶ Drop Load' : '▶ Launch Crash'}
            </button>
          </div>
        </div>

        <div className="utm-lab__side">
          {material && (
            <PredictBar
              prompt={mode === 'load' ? 'Predict: will the frame pass the load test?' : 'Predict: will it protect the passenger?'}
              options={VERDICTS}
              predicted={predicted}
              onPredict={setPredicted}
              revealed={revealed}
              actual={result && rating ? rating.label : null}
              disabled={isRunning}
            />
          )}
          {mode === 'load' && material && (
            <CurvePanel
              xAxis={{ label: 'Deflection', min: 0, max: Math.ceil((result?.maxDeflectionMm || 30) * 1.1), unit: 'mm' }}
              yAxisLeft={{ label: 'Force', min: 0, max: Math.ceil((result?.ultimateLoadKN || material.UTS * 10) * 1.15), unit: 'kN', color: '#1E6FDB' }}
              series={result ? [{ id: 'fd', label: 'Force', color: '#1E6FDB', points: result.curve, yAxis: 'left' }] : []}
              annotations={complete && result ? [{ label: `Ultimate ${result.ultimateLoadKN} kN`, x: result.maxDeflectionMm * 0.8, y: result.ultimateLoadKN, yAxis: 'left', color: '#FACC15' }] : []}
              progressRef={crashRef} isRunning={isRunning} complete={complete} width={460} height={300}
            />
          )}
          {complete && result && rating && <CrashResultCard result={result} mode={mode} rating={rating} />}
        </div>
      </div>
    </div>
  );
}
