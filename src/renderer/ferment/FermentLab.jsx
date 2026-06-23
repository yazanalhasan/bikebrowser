import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import Bioreactor3D from './Bioreactor3D.jsx';
import CurvePanel from '../scenekit/CurvePanel.jsx';
import PredictBar from '../scenekit/PredictBar.jsx';
import ResultCard from '../scenekit/ResultCard.jsx';
import { emitGameEvent } from '../scenekit/gameBridge.js';
import { useLabSounds } from '../scenekit/useLabSounds.js';
import { ORGANISMS, SUBSTRATES, getSubstrateById } from './fermentData.js';
import { fermentResult, SIM_HORIZON } from './fermentModel.js';
import '../utm/utm.css';
import './ferment.css';

const VERDICTS = [
  { id: 'SUITABLE', label: 'Good yield', color: '#22C55E' },
  { id: 'MARGINAL', label: 'Sluggish', color: '#EAB308' },
  { id: 'UNSUITABLE', label: 'Crashes', color: '#EF4444' },
];
const RUN_MS = 5200;

export default function FermentLab() {
  const [org, setOrg] = useState(null);
  const [substrateId, setSubstrateId] = useState(SUBSTRATES[0].id);
  const [tempC, setTempC] = useState(30);
  const [aeration, setAeration] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [complete, setComplete] = useState(false);
  const [predicted, setPredicted] = useState(null);
  const [revealed, setRevealed] = useState(false);

  const reactorRef = useRef({ fill: 0, stir: false, bubbling: false, t: 0 });
  const rafRef = useRef(0);
  const sounds = useLabSounds();
  const substrate = getSubstrateById(substrateId);
  const result = useMemo(() => (org ? fermentResult(org, substrate, tempC, aeration) : null), [org, substrate, tempC, aeration]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const reset = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setComplete(false); setIsRunning(false); setPredicted(null); setRevealed(false);
    reactorRef.current = { fill: 0, stir: false, bubbling: false, t: 0 };
  }, []);

  const pickOrg = useCallback((o) => {
    reset(); setOrg(o); setTempC(o.optimalTempC);
    setAeration(o.aerobe !== 'anaerobe');
  }, [reset]);

  const run = useCallback(() => {
    if (!org || isRunning || !predicted) return;
    setComplete(false); setIsRunning(true); setRevealed(false); sounds.hum(RUN_MS, 80);
    reactorRef.current = { fill: 0, stir: true, bubbling: aeration, t: 0 };
    if (aeration) sounds.bubble();
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / RUN_MS, 1);
      reactorRef.current.t = t;
      reactorRef.current.fill = (result.stationaryFrac) * t; // approach final biomass
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else {
        reactorRef.current.stir = false; reactorRef.current.bubbling = false; reactorRef.current.t = 1;
        reactorRef.current.fill = result.stationaryFrac;
        setIsRunning(false); setComplete(true); setRevealed(true);
        if (result.rating.label === 'UNSUITABLE') sounds.buzz(); else sounds.ping();
        if (result.rating.label === 'SUITABLE') emitGameEvent('ferment:built', { organism: org.id, substrate: substrateId, product: org.product, yield: Math.round(result.product) });
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [org, substrateId, isRunning, predicted, aeration, result, sounds]);

  const compatible = org ? substrate.compatibility.includes(org.id) : true;
  const rows = result ? [
    { label: 'Substrate', value: `${substrate.name} (${substrate.sugar} g/L)` },
    { label: 'Temp / pH opt', value: `${tempC}°C / ${org.optimalPH}` },
    { label: 'Aeration', value: aeration ? 'ON' : 'OFF' },
    { label: 'Final OD600', value: result.finalOD.toFixed(2) },
    { label: org.product, value: `${result.product.toFixed(0)} g/L` },
  ] : [];

  return (
    <div className="utm-lab">
      <header className="utm-lab__bar">
        <div className="utm-lab__title">Fermentation Bench — Bioreactor</div>
        <div className="utm-lab__bar-right">
          <label className="utm-lab__task">Substrate:
            <select value={substrateId} onChange={(e) => { reset(); setSubstrateId(e.target.value); }}>
              {SUBSTRATES.map((s) => <option key={s.id} value={s.id}>{s.name}{org && !s.compatibility.includes(org.id) ? ' ⚠' : ''}</option>)}
            </select>
          </label>
          {org && (
            <>
              <label className="fb-ctrl">Temp {tempC}°C
                <input type="range" min={15} max={42} value={tempC} disabled={isRunning} onChange={(e) => { reset(); setTempC(Number(e.target.value)); }} />
              </label>
              <button type="button" className={`fb-toggle ${aeration ? 'is-on' : ''}`} disabled={isRunning || org.aerobe === 'anaerobe'} onClick={() => { reset(); setAeration((a) => !a); }}>
                Aeration {aeration ? 'ON' : 'OFF'}
              </button>
            </>
          )}
        </div>
      </header>

      <div className="utm-lab__body">
        <div className="utm-tray" role="list" aria-label="Organisms">
          <div className="utm-tray__title">Microbes</div>
          {ORGANISMS.map((o) => (
            <div key={o.id} role="listitem" className={`utm-chip ${org?.id === o.id ? 'utm-chip--sel' : ''}`}
              style={{ background: '#1b2330', backgroundImage: `linear-gradient(135deg, ${o.color}66, transparent 60%)` }}
              onClick={() => pickOrg(o)} title={o.binomial}>
              <span className="utm-chip__name">{o.name}</span>
              <span className="utm-chip__sub">{o.type} · {o.product}</span>
            </div>
          ))}
        </div>

        <div className="utm-lab__stage">
          <div className="utm-canvas-wrap" style={{ background: '#eef1f6' }}>
            <Canvas camera={{ position: [4, 1.5, 6], fov: 45 }} dpr={[1, 2]}>
              <color attach="background" args={['#eef1f6']} />
              {org && <Bioreactor3D organism={org} substrate={substrate} reactorRef={reactorRef} />}
            </Canvas>
            {!org && <div className="utm-empty-hint">Pick a microbe to culture</div>}
            {org && !compatible && <div className="fb-warn">⚠ Poor substrate match — yield halved</div>}
          </div>
          <div className="utm-lab__controls">
            <button type="button" className="utm-btn utm-btn--run" onClick={run} disabled={isRunning || !org || !predicted} title={org && !predicted ? 'Make a prediction first' : ''}>▶ Inoculate &amp; Run</button>
          </div>
        </div>

        <div className="utm-lab__side">
          {org && (
            <PredictBar prompt={`Predict: will ${org.name} ferment ${substrate.name} at ${tempC}°C?`} options={VERDICTS} predicted={predicted} onPredict={setPredicted} revealed={revealed} actual={complete && result ? result.rating.label : null} disabled={isRunning} />
          )}
          {org && (
            <CurvePanel
              xAxis={{ label: 'Time', min: 0, max: SIM_HORIZON, unit: 'h' }}
              yAxisLeft={{ label: 'OD600', min: 0, max: org.maxOD, unit: '', color: '#2563EB' }}
              yAxisRight={{ label: 'pH', min: 2, max: 9, unit: '', color: '#F59E0B' }}
              series={[
                { id: 'od', label: 'OD600', color: '#2563EB', points: result.odPts, yAxis: 'left' },
                { id: 'ph', label: 'pH', color: '#F59E0B', points: result.phPts, yAxis: 'right' },
              ]}
              annotations={complete ? [{ label: `${result.product.toFixed(0)} g/L ${org.product}`, x: SIM_HORIZON * 0.7, y: result.finalOD, yAxis: 'left', color: '#10B981' }] : []}
              progressRef={reactorRef} isRunning={isRunning} complete={complete} width={460} height={290}
            />
          )}
          {complete && result && <ResultCard name={org.name} category={`${org.product} fermentation`} color={org.color} rows={rows} rating={result.rating} badge={`${result.product.toFixed(0)} g/L`} />}
        </div>
      </div>
    </div>
  );
}
