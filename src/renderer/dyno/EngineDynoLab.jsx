import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import DynoApparatus from './DynoApparatus.jsx';
import EngineResultCard from './EngineResultCard.jsx';
import EngineTray, { ENGINE_DND } from './EngineTray.jsx';
import CurvePanel from '../scenekit/CurvePanel.jsx';
import { useEngineSounds } from './useEngineSounds.js';
import { ENGINES, getEngineById } from './engines.js';
import { BIKE_MISSIONS, DEFAULT_MISSION, getMissionById } from './bikeMissions.js';
import { buildEngineCurves, computeDynoResult, redlineZone, dynoAnnotations } from './dynoModel.js';
import '../utm/utm.css';
import './dyno.css';

const TEST_MS = 5000;

export default function EngineDynoLab({ onEngineTested } = {}) {
  const [engine, setEngine] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [complete, setComplete] = useState(false);
  const [result, setResult] = useState(null);
  const [missionId, setMissionId] = useState(DEFAULT_MISSION.id);
  const [dragActive, setDragActive] = useState(false);
  const [tip, setTip] = useState(false);

  const dynoRef = useRef({ rpm: 0, t: 0, running: false });
  const rafRef = useRef(0);
  const sounds = useEngineSounds(engine);
  const mission = getMissionById(missionId);
  const curves = useMemo(() => (engine ? buildEngineCurves(engine) : null), [engine]);

  const loadEngine = useCallback((e) => {
    if (!e) return;
    cancelAnimationFrame(rafRef.current);
    setEngine(e); setComplete(false); setResult(null); setIsRunning(false); setTip(false);
    dynoRef.current = { rpm: e.idleRPM, t: 0, running: false };
  }, []);

  const rev = useCallback(() => {
    if (!engine) { setTip(true); setTimeout(() => setTip(false), 2200); return; }
    if (isRunning) return;
    sounds.init(); sounds.startTest(TEST_MS);
    setComplete(false); setResult(null); setIsRunning(true);
    dynoRef.current = { rpm: engine.idleRPM, t: 0, running: true };
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / TEST_MS, 1);
      dynoRef.current.t = t;
      dynoRef.current.rpm = engine.idleRPM + t * (engine.maxRPM - engine.idleRPM);
      if (t < 1) { rafRef.current = requestAnimationFrame(tick); }
      else {
        dynoRef.current.running = false; dynoRef.current.rpm = engine.idleRPM;
        const res = computeDynoResult(engine, curves);
        setIsRunning(false); setResult(res); setComplete(true);
        onEngineTested?.(engine.id);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [engine, isRunning, curves, sounds, onEngineTested]);

  const onDrop = useCallback((ev) => {
    ev.preventDefault(); setDragActive(false);
    const id = ev.dataTransfer.getData(ENGINE_DND) || ev.dataTransfer.getData('text/plain');
    const e = getEngineById(id);
    if (e) loadEngine(e);
  }, [loadEngine]);

  return (
    <div className="utm-lab">
      <header className="utm-lab__bar">
        <div className="utm-lab__title">Engine Dynamometer</div>
        <div className="utm-lab__bar-right">
          <label className="utm-lab__task">Mission:
            <select value={missionId} onChange={(e) => setMissionId(e.target.value)}>
              {BIKE_MISSIONS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>
        </div>
      </header>

      <div className="utm-lab__body">
        <EngineTray engines={ENGINES} selectedId={engine?.id} onSelect={(id) => loadEngine(getEngineById(id))} />

        <div className="utm-lab__stage">
          <div
            className={`utm-canvas-wrap ${dragActive ? 'utm-canvas-wrap--drop' : ''}`}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
          >
            <Canvas camera={{ position: [4.5, 2.8, 6.5], fov: 48 }} dpr={[1, 2]}>
              <color attach="background" args={['#e8edf4']} />
              <DynoApparatus engine={engine} isRunning={isRunning} dynoRef={dynoRef} />
            </Canvas>
            {!engine && !dragActive && <div className="utm-empty-hint">Drag an engine onto the dyno</div>}
            {dragActive && <div className="utm-drop-hint">Release to mount engine</div>}
          </div>

          <div className="utm-lab__controls">
            <button type="button" className="utm-btn utm-btn--run" onClick={rev} disabled={isRunning || !engine}>▶ Rev to Redline</button>
            {tip && <span className="utm-tip">Drop an engine onto the dyno first</span>}
          </div>
        </div>

        <div className="utm-lab__side">
          {engine && curves && (
            <CurvePanel
              xAxis={{ label: 'Engine Speed', min: 0, max: engine.maxRPM, unit: 'RPM' }}
              yAxisLeft={{ label: 'Torque', min: 0, max: Math.ceil(engine.peakTorque * 1.15), unit: 'Nm', color: '#E8A020' }}
              yAxisRight={{ label: 'Power', min: 0, max: Math.ceil(engine.peakPower * 1.15), unit: 'kW', color: '#4ea1ff' }}
              series={[
                { id: 'torque', label: 'Torque', color: '#E8A020', points: curves.torquePoints, yAxis: 'left' },
                { id: 'power', label: 'Power', color: '#4ea1ff', points: curves.powerPoints, yAxis: 'right' },
              ]}
              zones={[redlineZone(engine)]}
              annotations={complete && result ? dynoAnnotations(result) : []}
              progressRef={dynoRef}
              isRunning={isRunning}
              complete={complete}
              width={460}
              height={300}
            />
          )}
          {complete && result && <EngineResultCard result={result} mission={mission} />}
        </div>
      </div>
    </div>
  );
}
