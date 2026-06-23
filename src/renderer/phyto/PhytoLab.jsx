import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import PhytoBench3D from './PhytoBench3D.jsx';
import CurvePanel from '../scenekit/CurvePanel.jsx';
import PredictBar from '../scenekit/PredictBar.jsx';
import ResultCard from '../scenekit/ResultCard.jsx';
import { emitGameEvent } from '../scenekit/gameBridge.js';
import { useLabSounds } from '../scenekit/useLabSounds.js';
import { EXTRACTS, getExtractById } from './phytoData.js';
import { phytoResult } from './phytoModel.js';
import '../utm/utm.css';
import './phyto.css';

const VERDICTS = [
  { id: 'SUITABLE', label: 'Rich profile', color: '#22C55E' },
  { id: 'MARGINAL', label: 'Partial', color: '#EAB308' },
  { id: 'UNSUITABLE', label: 'Sparse', color: '#EF4444' },
];
const ASSAY_MS = 3600;
const TLC_MS = 2400;
const TOTAL = ASSAY_MS + TLC_MS;

export default function PhytoLab() {
  const [extract, setExtract] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [complete, setComplete] = useState(false);
  const [predicted, setPredicted] = useState(null);
  const [revealed, setRevealed] = useState(false);

  const benchRef = useRef({ fill: 0, tlc: 0, uv: false, t: 0 });
  const rafRef = useRef(0);
  const sounds = useLabSounds();
  const result = useMemo(() => (extract ? phytoResult(extract) : null), [extract]);

  const pick = useCallback((e) => {
    cancelAnimationFrame(rafRef.current);
    setExtract(e); setComplete(false); setIsRunning(false); setPredicted(null); setRevealed(false);
    benchRef.current = { fill: 0, tlc: 0, uv: false, t: 0 };
  }, []);

  const run = useCallback(() => {
    if (!extract || isRunning || !predicted) return;
    setComplete(false); setIsRunning(true); setRevealed(false); sounds.hum(TOTAL, 110);
    benchRef.current = { fill: 0, tlc: 0, uv: false, t: 0 };
    const start = performance.now();
    const tick = (now) => {
      const el = now - start;
      benchRef.current.fill = Math.min(1, el / ASSAY_MS);
      benchRef.current.tlc = Math.max(0, Math.min(1, (el - ASSAY_MS) / TLC_MS));
      benchRef.current.uv = el > ASSAY_MS + TLC_MS * 0.6;
      benchRef.current.t = Math.min(1, el / TOTAL);
      if (el < TOTAL) rafRef.current = requestAnimationFrame(tick);
      else {
        benchRef.current.fill = 1; benchRef.current.tlc = 1; benchRef.current.t = 1;
        setIsRunning(false); setComplete(true); setRevealed(true);
        if (result.rating.label === 'UNSUITABLE') sounds.buzz(); else sounds.ping();
        if (result.rating.label === 'SUITABLE') emitGameEvent('phyto:built', { extract: extract.id, compounds: result.identified });
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [extract, isRunning, predicted, result, sounds]);

  const rows = result ? [
    { label: 'Solvent', value: extract.solvent },
    { label: 'Concentration', value: `${extract.conc} mg/mL` },
    { label: 'Positive assays', value: `${result.positives} / 6` },
    { label: 'Classes', value: result.identified.join(', ') || '—' },
  ] : [];
  const maxPeak = result ? Math.max(0.2, ...result.curves.map((c) => c._peak)) : 1;

  return (
    <div className="utm-lab">
      <header className="utm-lab__bar">
        <div className="utm-lab__title">Phytochemistry Lab — Compound ID</div>
        <div className="utm-lab__bar-right">{extract && <span className="ext-phase">{extract.binomial}</span>}</div>
      </header>

      <div className="utm-lab__body">
        <div className="utm-tray" role="list" aria-label="Extracts">
          <div className="utm-tray__title">Plant Extracts</div>
          {EXTRACTS.map((e) => (
            <div key={e.id} role="listitem" className={`utm-chip ${extract?.id === e.id ? 'utm-chip--sel' : ''}`}
              style={{ background: '#1b2330', backgroundImage: `linear-gradient(135deg, ${e.color}66, transparent 60%)` }}
              onClick={() => pick(e)} title={e.binomial}>
              <span className="utm-chip__name">{e.name}</span>
              <span className="utm-chip__sub">{e.solvent}</span>
            </div>
          ))}
        </div>

        <div className="utm-lab__stage">
          <div className="utm-canvas-wrap" style={{ background: '#eef1f6' }}>
            <Canvas shadows camera={{ position: [0, 2.2, 5.2], fov: 45 }} dpr={[1, 2]}>
              <color attach="background" args={['#eef1f6']} />
              {extract && <PhytoBench3D assays={result.assays} benchRef={benchRef} />}
            </Canvas>
            {!extract && <div className="utm-empty-hint">Pick an extract to assay</div>}
          </div>
          <div className="utm-lab__controls">
            <button type="button" className="utm-btn utm-btn--run" onClick={run} disabled={isRunning || !extract || !predicted} title={extract && !predicted ? 'Make a prediction first' : ''}>▶ Run Assays</button>
          </div>
        </div>

        <div className="utm-lab__side">
          {extract && (
            <PredictBar prompt={`Predict: how rich is ${extract.name}'s phytochemical profile?`} options={VERDICTS} predicted={predicted} onPredict={setPredicted} revealed={revealed} actual={complete && result ? result.rating.label : null} disabled={isRunning} />
          )}
          {extract && (
            <CurvePanel
              xAxis={{ label: 'Wavelength', min: 200, max: 700, unit: 'nm' }}
              yAxisLeft={{ label: 'Absorbance', min: 0, max: maxPeak * 1.15, unit: 'A', color: '#7C3AED' }}
              series={result.curves.map((c) => ({ id: c.id, label: c.label, color: c.color, points: c.points, yAxis: 'left' }))}
              progressRef={benchRef} isRunning={isRunning} complete={complete} width={460} height={290}
            />
          )}
          {complete && result && <ResultCard name={extract.name} category="Phytochemical profile" color={extract.color} rows={rows} rating={result.rating} badge={`${result.positives}/6 assays`} />}
        </div>
      </div>
    </div>
  );
}
