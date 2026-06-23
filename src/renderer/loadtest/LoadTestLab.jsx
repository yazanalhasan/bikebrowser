import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import LoadTestBridge3D from './LoadTestBridge3D.jsx';
import CurvePanel from '../scenekit/CurvePanel.jsx';
import PredictBar from '../scenekit/PredictBar.jsx';
import ResultCard from '../scenekit/ResultCard.jsx';
import { emitGameEvent } from '../scenekit/gameBridge.js';
import { useLabSounds } from '../scenekit/useLabSounds.js';
import { StructuralModel, LOAD_SCENARIOS } from '../../game/phaser/systems/StructuralModel.js';
import '../utm/utm.css';
import './loadtest.css';

const MATERIALS = [
  { id: 'balsa', name: 'Balsa' }, { id: 'pine', name: 'Pine' }, { id: 'bamboo', name: 'Bamboo' },
  { id: 'brick', name: 'Brick' }, { id: 'concrete', name: 'Concrete' }, { id: 'iron', name: 'Iron' },
  { id: 'steel', name: 'Steel' }, { id: 'carbon_fiber', name: 'Carbon Fiber' },
];
const SLOTS = [
  { key: 'deck', label: 'Deck', note: 'tension', def: 'bamboo' },
  { key: 'support', label: 'Support', note: 'compression', def: 'steel' },
  { key: 'brace', label: 'Brace', note: 'tension/compression', def: 'carbon_fiber' },
];
const VERDICTS = [
  { id: 'SUITABLE', label: 'Holds all', color: '#22C55E' },
  { id: 'MARGINAL', label: 'Holds light', color: '#EAB308' },
  { id: 'UNSUITABLE', label: 'Fails early', color: '#EF4444' },
];
const PER_LOAD_MS = 900;
const TOTAL = LOAD_SCENARIOS.length * PER_LOAD_MS;

export default function LoadTestLab({ plan: planProp }) {
  const model = useMemo(() => new StructuralModel(), []);
  const [plan, setPlan] = useState(() => planProp || { deck: 'bamboo', support: 'steel', brace: 'carbon_fiber' });
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [complete, setComplete] = useState(false);
  const [predicted, setPredicted] = useState(null);
  const [revealed, setRevealed] = useState(false);

  const bridgeRef = useRef({ loadT: 0, scenarioIdx: 0 });
  const timersRef = useRef([]);
  const isRunningRef = useRef(false); isRunningRef.current = isRunning;
  const sounds = useLabSounds();

  // Solve every scenario up front to derive the verdict + stress curve.
  const solved = useMemo(() => LOAD_SCENARIOS.map((sc) => model.solve(plan, sc.id)), [model, plan]);
  const firstFail = solved.findIndex((r) => r.verdict === 'fail');
  const result = useMemo(() => {
    const holdsAll = firstFail === -1;
    const failsOnlyMonsoon = firstFail === LOAD_SCENARIOS.length - 1;
    let rating;
    if (holdsAll) rating = rate('SUITABLE', `The bridge holds every load through the monsoon flood — peak stress ${(Math.max(...solved.map((r) => r.maxStress)) * 100).toFixed(0)}%. The material choices carry tension and compression where each is needed.`);
    else if (failsOnlyMonsoon) { const f = solved[firstFail].failedMember; rating = rate('MARGINAL', `Holds normal traffic but the ${f?.label} fails (${f?.forceType}) under the monsoon flood. Strengthen that member for the worst case.`); }
    else { const f = solved[firstFail].failedMember; rating = rate('UNSUITABLE', `Fails early — the ${f?.label} gives way (${f?.forceType}) under the ${LOAD_SCENARIOS[firstFail].label}. ${f?.forceType === 'tension' ? 'A brittle material cracks where it is pulled apart; use steel/carbon in tension.' : 'A weak member buckles where it is pushed; use a stiffer material in compression.'}`); }
    return { holdsAll, firstFail, rating };
  }, [solved, firstFail]);

  const curve = useMemo(() => solved.map((r, i) => [i, Number((r.maxStress * 100).toFixed(1))]), [solved]);
  const currentMembers = solved[scenarioIdx]?.members || [];

  const setSlot = useCallback((key, id) => {
    timersRef.current.forEach(clearTimeout); timersRef.current = [];
    setPlan((p) => ({ ...p, [key]: id })); setComplete(false); setRevealed(false); setScenarioIdx(0);
    bridgeRef.current = { loadT: 0, scenarioIdx: 0 };
  }, []);

  const run = useCallback(() => {
    if (isRunning || !predicted) return;
    timersRef.current.forEach(clearTimeout); timersRef.current = [];
    setComplete(false); setIsRunning(true); setRevealed(false); setScenarioIdx(0);
    sounds.hum(TOTAL, 70);
    LOAD_SCENARIOS.forEach((sc, i) => {
      timersRef.current.push(setTimeout(() => {
        setScenarioIdx(i); bridgeRef.current.scenarioIdx = i; bridgeRef.current.loadT = 0;
        const start = performance.now();
        const ramp = (now) => { const t = Math.min((now - start) / (PER_LOAD_MS * 0.8), 1); bridgeRef.current.loadT = t; if (t < 1 && isRunningRef.current) requestAnimationFrame(ramp); };
        requestAnimationFrame(ramp);
        if (solved[i].verdict === 'fail') sounds.buzz();
      }, i * PER_LOAD_MS));
    });
    timersRef.current.push(setTimeout(() => {
      setIsRunning(false); setComplete(true); setRevealed(true);
      if (result.holdsAll) sounds.ping();
      emitGameEvent('loadTest:done', { ok: result.holdsAll, plan });
    }, TOTAL + 80));
  }, [isRunning, predicted, solved, result, plan, sounds]);

  const rows = [
    ...SLOTS.map((s) => ({ label: s.label, value: MATERIALS.find((m) => m.id === plan[s.key])?.name || plan[s.key] })),
    { label: 'Holds through', value: result.holdsAll ? 'monsoon flood' : LOAD_SCENARIOS[Math.max(0, result.firstFail - 1)]?.label || 'nothing' },
    { label: 'Peak stress', value: `${(Math.max(...solved.map((r) => r.maxStress)) * 100).toFixed(0)}%` },
  ];

  return (
    <div className="utm-lab">
      <header className="utm-lab__bar">
        <div className="utm-lab__title">Load Test — Bridge Under Stress</div>
        <div className="utm-lab__bar-right">
          {SLOTS.map((s) => (
            <label key={s.key} className="utm-lab__task">{s.label}:
              <select value={plan[s.key]} onChange={(e) => setSlot(s.key, e.target.value)} disabled={isRunning}>
                {MATERIALS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </label>
          ))}
        </div>
      </header>

      <div className="utm-lab__body">
        <div className="utm-tray" role="list" aria-label="Loads">
          <div className="utm-tray__title">Load Sequence</div>
          {LOAD_SCENARIOS.map((sc, i) => (
            <div key={sc.id} className={`lt-load ${i === scenarioIdx && (isRunning || complete) ? 'is-active' : ''} ${complete && solved[i].verdict === 'fail' ? 'is-fail' : ''}`}>
              <span className="lt-load__n">{i + 1}</span> {sc.label}
              {complete && <span className="lt-load__v">{solved[i].verdict === 'hold' ? '✓' : '✗'}</span>}
            </div>
          ))}
        </div>

        <div className="utm-lab__stage">
          <div className="utm-canvas-wrap" style={{ background: '#dce6f0' }}>
            <Canvas shadows camera={{ position: [0, 0.5, 9], fov: 42 }} dpr={[1, 2]}>
              <color attach="background" args={['#dce6f0']} />
              <LoadTestBridge3D members={currentMembers} scenarioLabel={(isRunning || complete) ? LOAD_SCENARIOS[scenarioIdx].label : 'ready'} bridgeRef={bridgeRef} />
            </Canvas>
          </div>
          <div className="utm-lab__controls">
            <button type="button" className="utm-btn utm-btn--run" onClick={run} disabled={isRunning || !predicted} title={!predicted ? 'Make a prediction first' : ''}>▶ Apply Loads</button>
          </div>
        </div>

        <div className="utm-lab__side">
          <PredictBar prompt="Predict: how far will this bridge hold?" options={VERDICTS} predicted={predicted} onPredict={setPredicted} revealed={revealed} actual={complete ? result.rating.label : null} disabled={isRunning} />
          <CurvePanel
            xAxis={{ label: 'Load', min: 0, max: LOAD_SCENARIOS.length - 1, unit: '' }}
            yAxisLeft={{ label: 'Max stress', min: 0, max: 120, unit: '%', color: '#E45757' }}
            series={[{ id: 'stress', label: 'Peak member stress', color: '#E45757', points: curve, yAxis: 'left' }]}
            annotations={complete ? [{ label: '100% = failure', x: (LOAD_SCENARIOS.length - 1) * 0.5, y: 100, yAxis: 'left', color: '#EF4444' }] : []}
            progressRef={bridgeRef} isRunning={isRunning} complete={complete} width={460} height={290}
          />
          {complete && <ResultCard name="Bridge Design" category="Structural load test" color={result.holdsAll ? '#22C55E' : '#E45757'} rows={rows} rating={result.rating} badge={result.holdsAll ? 'certified' : 'redesign'} />}
        </div>
      </div>
    </div>
  );
}

function rate(label, reason) {
  const color = label === 'SUITABLE' ? '#22C55E' : label === 'MARGINAL' ? '#EAB308' : '#EF4444';
  return { label, color, icon: label === 'SUITABLE' ? 'check' : label === 'MARGINAL' ? 'warn' : 'x', reason };
}
