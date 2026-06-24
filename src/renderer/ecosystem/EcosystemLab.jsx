import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import EcosystemDiorama3D from './EcosystemDiorama3D.jsx';
import CurvePanel from '../scenekit/CurvePanel.jsx';
import PredictBar from '../scenekit/PredictBar.jsx';
import ResultCard from '../scenekit/ResultCard.jsx';
import { emitGameEvent } from '../scenekit/gameBridge.js';
import { useLabSounds } from '../scenekit/useLabSounds.js';
import { SPECIES } from './ecosystemData.js';
import { ecosystemResult, HORIZON } from './ecosystemModel.js';
import '../utm/utm.css';
import './ecosystem.css';

const VERDICTS = [
  { id: 'SUITABLE', label: 'Stable', color: '#22C55E' },
  { id: 'MARGINAL', label: 'Oscillates', color: '#EAB308' },
  { id: 'UNSUITABLE', label: 'Collapses', color: '#EF4444' },
];
const RUN_MS = 6000;
const initFromSpecies = () => Object.fromEntries(SPECIES.map((s) => [s.id, s.initialPop]));

export default function EcosystemLab() {
  const [pops, setPops] = useState(initFromSpecies);
  const [isRunning, setIsRunning] = useState(false);
  const [complete, setComplete] = useState(false);
  const [predicted, setPredicted] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [started, setStarted] = useState(false);

  const ecoRef = useRef({ t: 0, series: null });
  const rafRef = useRef(0);
  const sounds = useLabSounds();
  const result = useMemo(() => ecosystemResult(pops), [pops]);

  const setPop = useCallback((id, v) => {
    cancelAnimationFrame(rafRef.current);
    setPops((p) => ({ ...p, [id]: v })); setComplete(false); setRevealed(false); setStarted(false);
    ecoRef.current = { t: 0, series: null };
  }, []);

  const curves = useMemo(() => SPECIES.map((s) => ({
    id: s.id, label: s.name, color: s.color, yAxis: 'left',
    points: result.series.map((pt) => [pt.year, pt[s.id]]),
  })), [result]);
  const maxY = useMemo(() => Math.max(...result.series.map((p) => p.plants)) * 1.1, [result]);

  const run = useCallback(() => {
    if (isRunning || !predicted) return;
    setComplete(false); setIsRunning(true); setRevealed(false); setStarted(true); sounds.hum(RUN_MS, 60);
    emitGameEvent('eco:started', { initial: pops });
    ecoRef.current = { t: 0, series: result.series };
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / RUN_MS, 1);
      ecoRef.current.t = t;
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else {
        ecoRef.current.t = 1;
        setIsRunning(false); setComplete(true); setRevealed(true);
        if (result.rating.label === 'UNSUITABLE') sounds.buzz(); else sounds.ping();
        if (result.rating.label === 'SUITABLE') emitGameEvent('eco:built', { final: result.last });
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [isRunning, predicted, pops, result, sounds]);

  const rows = [
    ...SPECIES.map((s) => ({ label: s.name, value: `${Math.round(result.last[s.id])}` })),
    { label: 'Max swing', value: `±${Math.round(result.worstDev * 100)}%` },
  ];

  return (
    <div className="utm-lab">
      <header className="utm-lab__bar">
        <div className="utm-lab__title">Ecosystem Engineering — Trophic Balance</div>
        <div className="utm-lab__bar-right"><span className="ext-phase">Lotka–Volterra · {HORIZON} yr horizon</span></div>
      </header>

      <div className="utm-lab__body">
        <div className="utm-tray eco-config" role="group" aria-label="Initial populations">
          <div className="utm-tray__title">Initial Populations</div>
          {SPECIES.map((s) => (
            <div key={s.id} className="eco-row">
              <span className="eco-swatch" style={{ background: s.color }} />
              <span className="eco-name">{s.name}</span>
              <input type="range" min={0} max={s.max} step={s.step} value={pops[s.id]} disabled={isRunning}
                onChange={(e) => setPop(s.id, Number(e.target.value))} />
              <span className="eco-val">{pops[s.id]}</span>
            </div>
          ))}
        </div>

        <div className="utm-lab__stage">
          <div className="utm-canvas-wrap" style={{ background: '#bcd3e8' }}>
            <Canvas shadows camera={{ position: [0, 16, 26], fov: 45 }} dpr={[1, 2]}>
              <color attach="background" args={['#bcd3e8']} />
              <EcosystemDiorama3D ecoRef={ecoRef} />
            </Canvas>
            {!started && <div className="utm-empty-hint">Set populations, predict, then start</div>}
          </div>
          <div className="utm-lab__controls">
            <button type="button" className={`utm-btn utm-btn--run ${!predicted ? 'utm-btn--needs-predict' : ''}`} onClick={run} disabled={isRunning || !predicted} title={!predicted ? 'Make a prediction first' : ''}>{!predicted ? '⤴ Predict first to start' : '▶ Start Simulation'}</button>
          </div>
        </div>

        <div className="utm-lab__side">
          <PredictBar prompt="Predict: will this food web stay in balance?" options={VERDICTS} predicted={predicted} onPredict={setPredicted} revealed={revealed} actual={complete ? result.rating.label : null} disabled={isRunning} />
          <CurvePanel
            xAxis={{ label: 'Year', min: 0, max: HORIZON, unit: 'yr' }}
            yAxisLeft={{ label: 'Population', min: 0, max: maxY, unit: '', color: '#3A7D44' }}
            series={curves}
            progressRef={ecoRef} isRunning={isRunning} complete={complete} width={460} height={290}
          />
          {complete && <ResultCard name="Salt River Ecosystem" category="Systems biology" color="#3A7D44" rows={rows} rating={result.rating} badge={`${result.extinct.length ? result.extinct.length + ' extinct' : 'all persist'}`} />}
        </div>
      </div>
    </div>
  );
}
