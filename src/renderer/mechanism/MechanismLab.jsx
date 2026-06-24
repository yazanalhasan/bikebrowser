import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import MolecularBench3D from './MolecularBench3D.jsx';
import CurvePanel from '../scenekit/CurvePanel.jsx';
import PredictBar from '../scenekit/PredictBar.jsx';
import ResultCard from '../scenekit/ResultCard.jsx';
import { emitGameEvent } from '../scenekit/gameBridge.js';
import { useLabSounds } from '../scenekit/useLabSounds.js';
import { ENZYMES, SUBSTRATES, COFACTORS, getSubstrateById } from './mechanismData.js';
import { mechanismResult } from './mechanismModel.js';
import '../utm/utm.css';
import './mechanism.css';

const VERDICTS = [
  { id: 'SUITABLE', label: 'Catalyses', color: '#22C55E' },
  { id: 'MARGINAL', label: 'Binds only', color: '#EAB308' },
  { id: 'UNSUITABLE', label: 'No reaction', color: '#EF4444' },
];
const RUN_MS = 4200;

export default function MechanismLab() {
  const [enzyme, setEnzyme] = useState(null);
  const [substrateId, setSubstrateId] = useState(SUBSTRATES[0].id);
  const [cofactorId, setCofactorId] = useState(COFACTORS[0].id);
  const [isRunning, setIsRunning] = useState(false);
  const [complete, setComplete] = useState(false);
  const [predicted, setPredicted] = useState(null);
  const [revealed, setRevealed] = useState(false);

  const molRef = useRef({ dock: 0, reacting: false, t: 0 });
  const rafRef = useRef(0);
  const sounds = useLabSounds();
  const substrate = getSubstrateById(substrateId);
  const cofactor = COFACTORS.find((c) => c.id === cofactorId);
  const result = useMemo(() => (enzyme ? mechanismResult(enzyme, substrateId, cofactorId) : null), [enzyme, substrateId, cofactorId]);

  const reset = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setComplete(false); setIsRunning(false); setPredicted(null); setRevealed(false);
    molRef.current = { dock: 0, reacting: false, t: 0 };
  }, []);

  const pickEnzyme = useCallback((e) => { reset(); setEnzyme(e); }, [reset]);

  const run = useCallback(() => {
    if (!enzyme || isRunning || !predicted) return;
    setComplete(false); setIsRunning(true); setRevealed(false); sounds.hum(RUN_MS, 70);
    molRef.current = { dock: 0, reacting: false, t: 0 };
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / RUN_MS, 1);
      molRef.current.t = t;
      molRef.current.dock = Math.min(1, t / 0.6);
      molRef.current.reacting = result.correct && t > 0.6;
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else {
        molRef.current.t = 1; molRef.current.reacting = false;
        setIsRunning(false); setComplete(true); setRevealed(true);
        if (result.rating.label === 'UNSUITABLE') sounds.buzz(); else if (result.rating.label === 'SUITABLE') sounds.ping();
        if (result.rating.label === 'SUITABLE') emitGameEvent('mech:built', { enzyme: enzyme.id, product: enzyme.product });
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [enzyme, substrateId, cofactorId, isRunning, predicted, result, sounds]);

  const rows = result ? [
    { label: 'Substrate fit', value: result.subOk ? '✓ matches active site' : '✗ wrong shape' },
    { label: 'Cofactor', value: result.cofOk ? `✓ ${cofactor.name}` : `✗ ${cofactor.name}` },
    { label: 'Reaction', value: enzyme.reaction },
    { label: 'Km', value: `${enzyme.Km} mM` },
    { label: 'Vmax', value: `${enzyme.Vmax} µmol/min` },
    { label: 'Product', value: result.correct ? enzyme.product : '—' },
  ] : [];

  return (
    <div className="utm-lab">
      <header className="utm-lab__bar">
        <div className="utm-lab__title">Molecular Mechanism Bench — Enzyme Kinetics</div>
        <div className="utm-lab__bar-right">
          {enzyme && (
            <>
              <label className="utm-lab__task">Substrate:
                <select value={substrateId} onChange={(e) => { reset(); setSubstrateId(e.target.value); }}>
                  {SUBSTRATES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
              <label className="utm-lab__task">Cofactor:
                <select value={cofactorId} onChange={(e) => { reset(); setCofactorId(e.target.value); }}>
                  {COFACTORS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
            </>
          )}
        </div>
      </header>

      <div className="utm-lab__body">
        <div className="utm-tray" role="list" aria-label="Enzymes">
          <div className="utm-tray__title">Enzymes</div>
          {ENZYMES.map((e) => (
            <div key={e.id} role="listitem" className={`utm-chip ${enzyme?.id === e.id ? 'utm-chip--sel' : ''}`}
              style={{ background: '#1b2330', backgroundImage: `linear-gradient(135deg, ${e.color}88, transparent 60%)` }}
              onClick={() => pickEnzyme(e)} title={e.summary}>
              <span className="utm-chip__name">{e.name}</span>
              <span className="utm-chip__sub">{e.reaction}</span>
            </div>
          ))}
        </div>

        <div className="utm-lab__stage">
          <div className="utm-canvas-wrap" style={{ background: '#0b1020' }}>
            <Canvas camera={{ position: [3.5, 1.6, 6], fov: 45 }} dpr={[1, 2]}>
              <color attach="background" args={['#0b1020']} />
              {enzyme && <MolecularBench3D enzyme={enzyme} substrate={substrate} cofactor={cofactor} molRef={molRef} />}
            </Canvas>
            {!enzyme && <div className="utm-empty-hint">Pick an enzyme to assemble a pathway</div>}
          </div>
          <div className="utm-lab__controls">
            <button type="button" className={`utm-btn utm-btn--run ${enzyme && !predicted ? 'utm-btn--needs-predict' : ''}`} onClick={run} disabled={isRunning || !enzyme || !predicted} title={enzyme && !predicted ? 'Make a prediction first' : ''}>{!enzyme ? '▶ Pick an enzyme' : !predicted ? '⤴ Predict first to run' : '▶ Run Reaction'}</button>
          </div>
        </div>

        <div className="utm-lab__side">
          {enzyme && (
            <PredictBar prompt={`Predict: does ${enzyme.name} + ${substrate.name} + ${cofactor.name} catalyse?`} options={VERDICTS} predicted={predicted} onPredict={setPredicted} revealed={revealed} actual={complete && result ? result.rating.label : null} disabled={isRunning} />
          )}
          {enzyme && (
            <CurvePanel
              xAxis={{ label: '[Substrate]', min: 0, max: result.sMax, unit: 'mM' }}
              yAxisLeft={{ label: 'Velocity v', min: 0, max: enzyme.Vmax * 1.1, unit: 'µmol/min', color: '#818CF8' }}
              series={[{ id: 'v', label: 'v = Vmax·[S]/(Km+[S])', color: '#818CF8', points: result.pts, yAxis: 'left' }]}
              annotations={complete && result.correct ? [
                { label: `Vmax ${enzyme.Vmax}`, x: result.sMax * 0.85, y: enzyme.Vmax, yAxis: 'left', color: '#22C55E' },
                { label: `Km ${enzyme.Km}`, x: enzyme.Km, y: enzyme.Vmax / 2, yAxis: 'left', color: '#F59E0B' },
              ] : []}
              progressRef={molRef} isRunning={isRunning} complete={complete} width={460} height={290}
            />
          )}
          {complete && result && <ResultCard name={enzyme.name} category="Enzyme mechanism" color={enzyme.color} rows={rows} rating={result.rating} badge={enzyme.reaction} />}
        </div>
      </div>
    </div>
  );
}
