import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import SkatePark3D from './SkatePark3D.jsx';
import CurvePanel from '../scenekit/CurvePanel.jsx';
import PredictBar from '../scenekit/PredictBar.jsx';
import ResultCard from '../scenekit/ResultCard.jsx';
import { emitGameEvent } from '../scenekit/gameBridge.js';
import { useLabSounds } from '../scenekit/useLabSounds.js';
import { skateResult, launch, GAP } from './skateModel.js';
import '../utm/utm.css';
import './skate.css';

const VERDICTS = [
  { id: 'SUITABLE', label: 'Stomp it', color: '#22C55E' },
  { id: 'MARGINAL', label: 'Land hard', color: '#EAB308' },
  { id: 'UNSUITABLE', label: 'Bail', color: '#EF4444' },
];
const FLIGHT_MS = 2200;

export default function SkateLab() {
  const [speed, setSpeed] = useState(300);
  const [angle, setAngle] = useState(45);
  const [isRunning, setIsRunning] = useState(false);
  const [complete, setComplete] = useState(false);
  const [predicted, setPredicted] = useState(null);
  const [revealed, setRevealed] = useState(false);

  const riderRef = useRef({ t: 0, traj: null, bailing: false });
  const rafRef = useRef(0);
  const sounds = useLabSounds();
  const result = useMemo(() => skateResult(speed, angle), [speed, angle]);

  const reset = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setComplete(false); setIsRunning(false); setRevealed(false);
    riderRef.current = { t: 0, traj: null, bailing: false };
  }, []);
  const setS = useCallback((v) => { reset(); setSpeed(v); }, [reset]);
  const setA = useCallback((v) => { reset(); setAngle(v); }, [reset]);

  const run = useCallback(() => {
    if (isRunning || !predicted) return;
    setComplete(false); setIsRunning(true); setRevealed(false);
    riderRef.current = { t: 0, traj: result.traj, bailing: false };
    sounds.hum(FLIGHT_MS * 0.5, 120);
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / FLIGHT_MS, 1);
      riderRef.current.t = t;
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else {
        riderRef.current.t = 1;
        riderRef.current.bailing = result.rating.label !== 'SUITABLE';
        setIsRunning(false); setComplete(true); setRevealed(true);
        if (result.rating.label === 'SUITABLE') sounds.ping(); else sounds.buzz();
        if (result.rating.label === 'SUITABLE') emitGameEvent('skate:done', { speed, angle, range: Math.round(result.range) });
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [isRunning, predicted, result, speed, angle, sounds]);

  // Trajectory curve + the landing-zone band as annotations.
  const curve = useMemo(() => result.traj.map(([x, y]) => [x, y]), [result]);
  const maxX = useMemo(() => Math.max(GAP.end + 60, ...result.traj.map((p) => p[0])), [result]);
  const maxY = useMemo(() => Math.max(40, ...result.traj.map((p) => p[1])) * 1.2, [result]);

  const rows = [
    { label: 'Launch speed', value: `${speed} px/s` },
    { label: 'Ramp angle', value: `${angle}°` },
    { label: 'Range', value: `${result.range.toFixed(0)} px` },
    { label: 'Apex height', value: `${result.apex.toFixed(0)} px` },
    { label: 'Landing speed', value: `${result.landingVy.toFixed(0)} px/s` },
    { label: 'Land zone', value: `${GAP.start}–${GAP.end} px` },
  ];

  return (
    <div className="utm-lab">
      <header className="utm-lab__bar">
        <div className="utm-lab__title">Skate Park — Launch Trainer</div>
        <div className="utm-lab__bar-right">
          <label className="fb-ctrl">Speed {speed} px/s
            <input type="range" min={150} max={360} step={5} value={speed} disabled={isRunning} onChange={(e) => setS(Number(e.target.value))} />
          </label>
          <label className="fb-ctrl">Angle {angle}°
            <input type="range" min={20} max={65} step={1} value={angle} disabled={isRunning} onChange={(e) => setA(Number(e.target.value))} />
          </label>
        </div>
      </header>

      <div className="utm-lab__body">
        <div className="utm-tray" role="group" aria-label="Physics">
          <div className="utm-tray__title">Physics Goggles</div>
          <div className="sk-fact">Range peaks at <b>45°</b>:<br />R = v²·sin(2θ) / g</div>
          <div className="sk-fact">Apex = v²·sin²θ / 2g</div>
          <div className="sk-fact">Land softer by <b>flattening</b> the angle (less vertical drop speed).</div>
        </div>

        <div className="utm-lab__stage">
          <div className="utm-canvas-wrap" style={{ background: '#bfe0ef' }}>
            <Canvas shadows camera={{ position: [1, 2.4, 8], fov: 42 }} dpr={[1, 2]}>
              <color attach="background" args={['#bfe0ef']} />
              <SkatePark3D gap={GAP} angleDeg={angle} riderRef={riderRef} />
            </Canvas>
          </div>
          <div className="utm-lab__controls">
            <button type="button" className={`utm-btn utm-btn--run ${!predicted ? 'utm-btn--needs-predict' : ''}`} onClick={run} disabled={isRunning || !predicted} title={!predicted ? 'Make a prediction first' : ''}>{!predicted ? '⤴ Predict first to drop' : '▶ Drop In'}</button>
          </div>
        </div>

        <div className="utm-lab__side">
          <PredictBar prompt={`Predict: speed ${speed}, angle ${angle}° — do you land it?`} options={VERDICTS} predicted={predicted} onPredict={setPredicted} revealed={revealed} actual={complete ? result.rating.label : null} disabled={isRunning} />
          <CurvePanel
            xAxis={{ label: 'Distance', min: 0, max: maxX, unit: 'px' }}
            yAxisLeft={{ label: 'Height', min: 0, max: maxY, unit: 'px', color: '#2563EB' }}
            series={[{ id: 'arc', label: 'Flight arc', color: '#2563EB', points: curve, yAxis: 'left' }]}
            annotations={[
              { label: 'land start', x: GAP.start, y: 0, yAxis: 'left', color: '#16A34A' },
              { label: 'land end', x: GAP.end, y: 0, yAxis: 'left', color: '#EF4444' },
            ]}
            progressRef={riderRef} isRunning={isRunning} complete={complete} width={460} height={290}
          />
          {complete && <ResultCard name="BMX Launch" category="Projectile motion" color={result.rating.color} rows={rows} rating={result.rating} badge={`${result.range.toFixed(0)} px`} />}
        </div>
      </div>
    </div>
  );
}
