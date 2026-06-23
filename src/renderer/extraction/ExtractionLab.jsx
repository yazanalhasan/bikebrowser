import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import ExtractionBench3D from './ExtractionBench3D.jsx';
import CurvePanel from '../scenekit/CurvePanel.jsx';
import PredictBar from '../scenekit/PredictBar.jsx';
import ResultCard from '../scenekit/ResultCard.jsx';
import { emitGameEvent } from '../scenekit/gameBridge.js';
import { useLabSounds } from '../scenekit/useLabSounds.js';
import { PLANTS, SOLVENTS, getSolventById } from './plants.js';
import { extractionResult } from './extractionModel.js';
import '../utm/utm.css';
import './extraction.css';

const VERDICTS = [
  { id: 'SUITABLE', label: 'Rich extract', color: '#22C55E' },
  { id: 'MARGINAL', label: 'Partial', color: '#EAB308' },
  { id: 'UNSUITABLE', label: 'Poor', color: '#EF4444' },
];
// Grind → soak → evaporate → run chromatogram.
const PHASES = [
  { name: 'grind', dur: 1400, grinding: true },
  { name: 'soak', dur: 2000, bubbling: true, mix: 1 },
  { name: 'evaporate', dur: 1600, bubbling: true, mix: 1 },
  { name: 'analyze', dur: 1000, mix: 1 },
];
const TOTAL = PHASES.reduce((s, p) => s + p.dur, 0);

export default function ExtractionLab() {
  const [plant, setPlant] = useState(null);
  const [solventId, setSolventId] = useState(SOLVENTS[1].id);
  const [isRunning, setIsRunning] = useState(false);
  const [complete, setComplete] = useState(false);
  const [predicted, setPredicted] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [phaseLabel, setPhaseLabel] = useState('');

  const benchRef = useRef({ t: 0, mix: 0, grinding: false, bubbling: false });
  const timersRef = useRef([]);
  const sounds = useLabSounds();
  const solvent = getSolventById(solventId);
  const result = useMemo(() => (plant ? extractionResult(plant, solvent) : null), [plant, solvent]);

  const reset = useCallback(() => {
    timersRef.current.forEach(clearTimeout); timersRef.current = [];
    setComplete(false); setIsRunning(false); setPredicted(null); setRevealed(false); setPhaseLabel('');
    benchRef.current = { t: 0, mix: 0, grinding: false, bubbling: false };
  }, []);

  const pickPlant = useCallback((p) => { reset(); setPlant(p); }, [reset]);
  const pickSolvent = useCallback((id) => { reset(); setSolventId(id); }, [reset]);

  const run = useCallback(() => {
    if (!plant || isRunning || !predicted) return;
    timersRef.current.forEach(clearTimeout); timersRef.current = [];
    setComplete(false); setIsRunning(true); setRevealed(false);
    benchRef.current = { t: 0, mix: 0, grinding: false, bubbling: false };
    sounds.hum(TOTAL);
    let elapsed = 0;
    PHASES.forEach((ph) => {
      timersRef.current.push(setTimeout(() => {
        benchRef.current.grinding = !!ph.grinding;
        benchRef.current.bubbling = !!ph.bubbling;
        if (ph.mix) benchRef.current.mix = ph.mix;
        setPhaseLabel(ph.name);
        if (ph.bubbling) sounds.bubble();
      }, elapsed));
      elapsed += ph.dur;
    });
    // progress driver for chromatogram progressive draw
    const start = performance.now();
    const drive = (now) => {
      const t = Math.min((now - start) / TOTAL, 1);
      benchRef.current.t = t;
      if (t < 1 && timersRef.current.length) requestAnimationFrame(drive);
    };
    requestAnimationFrame(drive);
    timersRef.current.push(setTimeout(() => {
      benchRef.current.grinding = false; benchRef.current.bubbling = false; benchRef.current.t = 1;
      setIsRunning(false); setComplete(true); setRevealed(true); setPhaseLabel('done');
      if (result.rating.label === 'UNSUITABLE') sounds.buzz(); else sounds.ping();
      emitGameEvent('extraction:done', { plant: plant.id, solvent: solventId, discovered: result.identified, verdict: result.rating.label });
    }, TOTAL + 50));
  }, [plant, solventId, isRunning, predicted, result, sounds]);

  const rows = result ? [
    { label: 'Yield', value: `${result.yield} g/100g` },
    { label: 'Polarity match', value: result.match },
    { label: 'Target purity', value: `${result.purity}%` },
    { label: 'Target present', value: result.targetPresent ? 'Yes' : 'No' },
    { label: 'Compounds found', value: String(result.identified.length) },
  ] : [];

  const maxI = result ? Math.max(1, ...result.curves.map((c) => c._intensity)) : 1;

  return (
    <div className="utm-lab">
      <header className="utm-lab__bar">
        <div className="utm-lab__title">Extraction Bench — Ethnobotany</div>
        <div className="utm-lab__bar-right">
          <label className="utm-lab__task">Solvent:
            <select value={solventId} onChange={(e) => pickSolvent(e.target.value)}>
              {SOLVENTS.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.polarity})</option>)}
            </select>
          </label>
          {phaseLabel && <span className="ext-phase">{phaseLabel}</span>}
        </div>
      </header>

      <div className="utm-lab__body">
        <div className="utm-tray" role="list" aria-label="Plants">
          <div className="utm-tray__title">Plant Material</div>
          {PLANTS.map((p) => (
            <div key={p.id} role="listitem" className={`utm-chip ${plant?.id === p.id ? 'utm-chip--sel' : ''}`}
              style={{ background: '#1b2330', backgroundImage: `linear-gradient(135deg, ${p.color}66, transparent 60%)` }}
              onClick={() => pickPlant(p)} title={`${p.name} — ${p.polarity}`}>
              <span className="utm-chip__name">{p.name}</span>
              <span className="utm-chip__sub">{p.polarity}</span>
            </div>
          ))}
        </div>

        <div className="utm-lab__stage">
          <div className="utm-canvas-wrap" style={{ background: '#eef1f6' }}>
            <Canvas camera={{ position: [4.5, 3, 6], fov: 45 }} dpr={[1, 2]}>
              <color attach="background" args={['#eef1f6']} />
              {plant && <ExtractionBench3D plant={plant} solvent={solvent} benchRef={benchRef} />}
            </Canvas>
            {!plant && <div className="utm-empty-hint">Pick a plant to extract</div>}
          </div>
          <div className="utm-lab__controls">
            <button type="button" className="utm-btn utm-btn--run" onClick={run} disabled={isRunning || !plant || !predicted} title={plant && !predicted ? 'Make a prediction first' : ''}>▶ Run Extraction</button>
          </div>
        </div>

        <div className="utm-lab__side">
          {plant && (
            <PredictBar prompt={`Predict: will ${solvent.name} extract a rich profile from ${plant.name}?`} options={VERDICTS} predicted={predicted} onPredict={setPredicted} revealed={revealed} actual={complete && result ? result.rating.label : null} disabled={isRunning} />
          )}
          {plant && (
            <CurvePanel
              xAxis={{ label: 'Retention time', min: 0, max: 12, unit: 'min' }}
              yAxisLeft={{ label: 'Detector', min: 0, max: maxI * 1.15, unit: '', color: '#0EA5E9' }}
              series={result.curves.map((c) => ({ id: c.id, label: c.label, color: c.color, points: c.points, yAxis: 'left' }))}
              progressRef={benchRef} isRunning={isRunning} complete={complete} width={460} height={290}
            />
          )}
          {complete && result && <ResultCard name={plant.name} category={`${solvent.name} extract`} color={plant.color} rows={rows} rating={result.rating} badge={`${result.identified.length} compounds`} />}
        </div>
      </div>
    </div>
  );
}
