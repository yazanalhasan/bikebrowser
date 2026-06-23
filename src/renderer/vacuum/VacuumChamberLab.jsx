import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import VacuumChamber3D from './VacuumChamber3D.jsx';
import CurvePanel from '../scenekit/CurvePanel.jsx';
import PredictBar from '../scenekit/PredictBar.jsx';
import ResultCard from '../scenekit/ResultCard.jsx';
import { emitGameEvent } from '../scenekit/gameBridge.js';
import { THERMAL_MATERIALS, getThermalById } from './thermalMaterials.js';
import { SPACE_MISSIONS, DEFAULT_SPACE_MISSION, getSpaceMissionById } from './spaceMissions.js';
import { vacuumIntegrity, reentryResult, buildReentryCurve, peakTemp, spaceSuitability } from './vacuumModel.js';
import { useVacuumSounds } from './useVacuumSounds.js';
import '../utm/utm.css';
import './vacuum.css';

const VERDICTS = [
  { id: 'SUITABLE', label: 'Certified', color: '#22C55E' },
  { id: 'MARGINAL', label: 'Marginal', color: '#EAB308' },
  { id: 'UNSUITABLE', label: 'Fails', color: '#EF4444' },
];
const VAC_MS = 2600; const RE_MS = 5000;

export default function VacuumChamberLab() {
  const [material, setMaterial] = useState(null);
  const [missionId, setMissionId] = useState(DEFAULT_SPACE_MISSION.id);
  const [phase, setPhase] = useState('idle');
  const [running, setRunning] = useState(false);
  const [complete, setComplete] = useState(false);
  const [result, setResult] = useState(null);
  const [predicted, setPredicted] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [readout, setReadout] = useState({ pressure: 760, temp: 20 });

  const chamberRef = useRef({ phase: 'idle', heatFrac: 0, ablation: 0, shake: 0, t: 0 });
  const rafRef = useRef(0);
  const sounds = useVacuumSounds();
  const mission = getSpaceMissionById(missionId);
  const curve = useMemo(() => (material ? buildReentryCurve(material) : []), [material]);
  const rating = useMemo(() => {
    if (!material) return null;
    return spaceSuitability(material, vacuumIntegrity(material), reentryResult(material), mission);
  }, [material, mission]);

  const load = useCallback((m) => {
    cancelAnimationFrame(rafRef.current);
    setMaterial(m); setPhase('idle'); setComplete(false); setRunning(false); setPredicted(null); setRevealed(false);
    setReadout({ pressure: 760, temp: 20 });
    chamberRef.current = { phase: 'idle', heatFrac: 0, ablation: 0, shake: 0, t: 0 };
  }, []);

  const tempAt = useCallback((frac) => {
    if (!curve.length) return 0;
    const idx = Math.min(curve.length - 1, Math.floor(frac * (curve.length - 1)));
    return curve[idx][1];
  }, [curve]);

  const finalize = useCallback((vacuum, reentry) => {
    setRunning(false); setPhase('done'); setComplete(true); setRevealed(true);
    setResult({ vacuum, reentry });
    if (vacuum.verdict !== 'FAIL' && reentry.verdict === 'PASS') emitGameEvent('space:built', { material: material.id });
  }, [material]);

  const run = useCallback(() => {
    if (!material || running) return;
    const vacuum = vacuumIntegrity(material);
    const reentry = reentryResult(material);
    setComplete(false); setRunning(true); setPredicted((p) => p); // keep prediction
    chamberRef.current = { phase: 'vacuum', heatFrac: 0, ablation: 0, shake: 0, t: 0 };
    setPhase('vacuum'); sounds.pump(VAC_MS);
    const startV = performance.now();
    const tickV = (now) => {
      const t = Math.min((now - startV) / VAC_MS, 1);
      const logP = Math.log10(760) + (Math.log10(0.001) - Math.log10(760)) * t;
      setReadout({ pressure: Math.pow(10, logP), temp: 20 });
      if (t < 1) { rafRef.current = requestAnimationFrame(tickV); return; }
      if (vacuum.verdict === 'FAIL') { chamberRef.current.shake = 1; sounds.alarm(); finalize(vacuum, reentry); return; }
      // re-entry phase
      setPhase('reentry'); chamberRef.current.phase = 'reentry'; sounds.roar(RE_MS);
      const startR = performance.now();
      const ablFinal = reentry.ablationLoss / 30;
      const tickR = (now2) => {
        const tr = Math.min((now2 - startR) / RE_MS, 1);
        chamberRef.current.t = tr;
        const temp = tempAt(tr);
        chamberRef.current.heatFrac = Math.min(1.1, temp / Math.max(material.maxServiceTemp, 300));
        chamberRef.current.ablation = ablFinal * tr;
        setReadout({ pressure: 0.001, temp });
        if (tr < 1) { rafRef.current = requestAnimationFrame(tickR); return; }
        if (reentry.verdict === 'FAIL') { chamberRef.current.shake = 1; sounds.alarm(); }
        finalize(vacuum, reentry);
      };
      rafRef.current = requestAnimationFrame(tickR);
    };
    rafRef.current = requestAnimationFrame(tickV);
  }, [material, running, sounds, tempAt, finalize]);

  const rows = material && result ? [
    { label: 'Peak Surface Temp', value: `${result.reentry.peakTemp} °C` },
    { label: 'Ablation Loss', value: `${result.reentry.ablationLoss} mm` },
    { label: 'Vacuum Integrity', value: result.vacuum.verdict },
    { label: 'Max G-Force', value: `${result.reentry.maxG} G` },
    { label: 'Max Service Temp', value: `${material.maxServiceTemp} °C` },
  ] : [];

  return (
    <div className="utm-lab">
      <header className="utm-lab__bar">
        <div className="utm-lab__title">Vacuum &amp; Re-entry Chamber</div>
        <div className="utm-lab__bar-right">
          <span className="vc-readout">{phase === 'reentry' || (complete && result?.vacuum.verdict !== 'FAIL') ? `${Math.round(readout.temp)} °C` : `${readout.pressure < 1 ? readout.pressure.toExponential(1) : Math.round(readout.pressure)} Torr`}</span>
          <label className="utm-lab__task">Mission:
            <select value={missionId} onChange={(e) => setMissionId(e.target.value)}>{SPACE_MISSIONS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
          </label>
        </div>
      </header>

      <div className="utm-lab__body">
        <div className="utm-tray" role="list" aria-label="Materials">
          <div className="utm-tray__title">Heat Shields</div>
          {THERMAL_MATERIALS.map((m) => (
            <div key={m.id} role="listitem" className={`utm-chip ${material?.id === m.id ? 'utm-chip--sel' : ''}`}
              style={{ background: '#1b2330', backgroundImage: `linear-gradient(135deg, ${m.color}66, transparent 60%)` }}
              onClick={() => load(m)} title={m.name}><span className="utm-chip__name">{m.name}</span></div>
          ))}
        </div>

        <div className="utm-lab__stage">
          <div className="utm-canvas-wrap" style={{ background: '#0b0f17' }}>
            <Canvas camera={{ position: [4.5, 1.5, 6] }} dpr={[1, 2]}>
              <color attach="background" args={['#0b0f17']} />
              {material && <VacuumChamber3D material={material} chamberRef={chamberRef} />}
            </Canvas>
            {!material && <div className="utm-empty-hint">Pick a heat-shield material</div>}
            {phase !== 'idle' && !complete && <div className="utm-drop-hint">{phase === 'vacuum' ? 'Pumping down…' : 'Re-entry…'}</div>}
          </div>
          <div className="utm-lab__controls">
            <button type="button" className="utm-btn utm-btn--run" onClick={run} disabled={running || !material || !predicted} title={material && !predicted ? 'Make a prediction first' : ''}>▶ Run Certification</button>
          </div>
        </div>

        <div className="utm-lab__side">
          {material && (
            <PredictBar prompt={`Predict: will ${material.name} survive certification for ${mission.name}?`} options={VERDICTS} predicted={predicted} onPredict={setPredicted} revealed={revealed} actual={complete && rating ? rating.label : null} disabled={running} />
          )}
          {material && (
            <CurvePanel
              xAxis={{ label: 'Time', min: 0, max: 600, unit: 's' }}
              yAxisLeft={{ label: 'Surface Temp', min: 0, max: Math.max(2000, Math.ceil(peakTemp(material) * 1.2)), unit: '°C', color: '#ff6644' }}
              series={[{ id: 'temp', label: 'Temp', color: '#ff6644', points: curve, yAxis: 'left' }]}
              zones={[{ xStart: 0, xEnd: 600, color: 'rgba(0,0,0,0)' }]}
              annotations={complete && result ? [{ label: `Peak ${result.reentry.peakTemp}°C`, x: 120, y: result.reentry.peakTemp, yAxis: 'left', color: '#FACC15' }] : []}
              progressRef={chamberRef} isRunning={phase === 'reentry'} complete={complete} width={460} height={290}
            />
          )}
          {complete && material && rating && <ResultCard name={material.name} category="Heat Shield" color={material.color} rows={rows} rating={rating} badge={mission.name} />}
        </div>
      </div>
    </div>
  );
}
