import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import HydroTank from './HydroTank.jsx';
import CurvePanel from '../scenekit/CurvePanel.jsx';
import PredictBar from '../scenekit/PredictBar.jsx';
import ResultCard from '../scenekit/ResultCard.jsx';
import { emitGameEvent } from '../scenekit/gameBridge.js';
import { HULLS, getHullById } from './hulls.js';
import { BOAT_MISSIONS, DEFAULT_BOAT_MISSION, getBoatMissionById } from './boatMissions.js';
import { computeBuoyancy, buildDragCurve, dragMax, computeDrag, boatSuitability } from './boatModel.js';
import { useBoatSounds } from './useBoatSounds.js';
import '../utm/utm.css';
import './boat.css';

const VERDICTS = [
  { id: 'SUITABLE', label: 'Floats well', color: '#22C55E' },
  { id: 'MARGINAL', label: 'Marginal', color: '#EAB308' },
  { id: 'UNSUITABLE', label: 'Fails', color: '#EF4444' },
];
const TOW_MS = 4000;

export default function BoatTankLab() {
  const [hull, setHull] = useState(null);
  const [missionId, setMissionId] = useState(DEFAULT_BOAT_MISSION.id);
  const [isRunning, setIsRunning] = useState(false);
  const [complete, setComplete] = useState(false);
  const [predicted, setPredicted] = useState(null);
  const [revealed, setRevealed] = useState(false);

  const boatRef = useRef({ hullX: -3.5, speed: 0, capsizing: false, t: 0 });
  const rafRef = useRef(0);
  const sounds = useBoatSounds();
  const mission = getBoatMissionById(missionId);
  const buoy = useMemo(() => (hull ? computeBuoyancy(hull) : null), [hull]);
  const rating = useMemo(() => (hull && buoy ? boatSuitability(hull, buoy, mission) : null), [hull, buoy, mission]);
  const curve = useMemo(() => (hull ? buildDragCurve(hull) : []), [hull]);

  const loadHull = useCallback((h) => {
    cancelAnimationFrame(rafRef.current);
    setHull(h); setComplete(false); setIsRunning(false); setPredicted(null); setRevealed(false);
    boatRef.current = { hullX: -3.5, speed: 0, capsizing: false, t: 0 };
  }, []);

  const runTow = useCallback(() => {
    if (!hull || isRunning) return;
    setComplete(false); setIsRunning(true); sounds.startRush(TOW_MS);
    boatRef.current = { hullX: -3.5, speed: 0, capsizing: false, t: 0 };
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / TOW_MS, 1);
      boatRef.current.t = t; boatRef.current.hullX = -3.5 + t * 8; boatRef.current.speed = t * hull.maxTowSpeed;
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else {
        setIsRunning(false); setComplete(true); setRevealed(true);
        if (buoy.stability === 'CAPSIZE' || buoy.stability === 'SINKS') { boatRef.current.capsizing = true; sounds.splash(); }
        if (rating.label === 'SUITABLE') emitGameEvent('boat:built', { hull: hull.id });
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [hull, isRunning, buoy, rating, sounds]);

  const rows = hull && buoy ? [
    { label: 'Draft', value: `${buoy.draft} m` },
    { label: 'Metacentric GM', value: `${buoy.GM} m` },
    { label: 'Stability', value: buoy.stability },
    { label: 'Top Speed', value: `${hull.maxTowSpeed} kn` },
    { label: 'Peak Drag', value: `${Math.round(computeDrag(hull, hull.maxTowSpeed))} N` },
  ] : [];

  return (
    <div className="utm-lab">
      <header className="utm-lab__bar">
        <div className="utm-lab__title">Hydro Tank — Hull Test</div>
        <div className="utm-lab__bar-right">
          <label className="utm-lab__task">Mission:
            <select value={missionId} onChange={(e) => setMissionId(e.target.value)}>
              {BOAT_MISSIONS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>
        </div>
      </header>

      <div className="utm-lab__body">
        <div className="utm-tray" role="list" aria-label="Hulls">
          <div className="utm-tray__title">Hulls</div>
          {HULLS.map((h) => (
            <div key={h.id} role="listitem" className={`utm-chip ${hull?.id === h.id ? 'utm-chip--sel' : ''}`}
              style={{ background: '#1b2330', backgroundImage: `linear-gradient(135deg, ${h.color}55, transparent 60%)` }}
              onClick={() => loadHull(h)} title={h.name}>
              <span className="utm-chip__name">{h.name}</span>
            </div>
          ))}
        </div>

        <div className="utm-lab__stage">
          <div className="utm-canvas-wrap" style={{ background: '#e8edf4' }}>
            <Canvas camera={{ position: [6, 4, 10], fov: 45 }} dpr={[1, 2]}>
              <color attach="background" args={['#e8edf4']} />
              {hull && <HydroTank hull={hull} buoy={buoy} boatRef={boatRef} />}
            </Canvas>
            {!hull && <div className="utm-empty-hint">Pick a hull to test</div>}
          </div>
          <div className="utm-lab__controls">
            <button type="button" className="utm-btn utm-btn--run" onClick={runTow} disabled={isRunning || !hull || !predicted} title={hull && !predicted ? 'Make a prediction first' : ''}>▶ Run Tow Test</button>
          </div>
        </div>

        <div className="utm-lab__side">
          {hull && (
            <PredictBar prompt={`Predict: is ${hull.name} suitable for the ${mission.name}?`} options={VERDICTS} predicted={predicted} onPredict={setPredicted} revealed={revealed} actual={complete && rating ? rating.label : null} disabled={isRunning} />
          )}
          {hull && (
            <CurvePanel
              xAxis={{ label: 'Speed', min: 0, max: hull.maxTowSpeed, unit: 'kn' }}
              yAxisLeft={{ label: 'Drag', min: 0, max: dragMax(hull), unit: 'N', color: '#1E6FDB' }}
              series={[{ id: 'drag', label: 'Drag', color: '#1E6FDB', points: curve, yAxis: 'left' }]}
              annotations={complete ? [{ label: `${Math.round(computeDrag(hull, hull.maxTowSpeed))} N`, x: hull.maxTowSpeed * 0.9, y: computeDrag(hull, hull.maxTowSpeed), yAxis: 'left', color: '#FACC15' }] : []}
              progressRef={boatRef} isRunning={isRunning} complete={complete} width={460} height={290}
            />
          )}
          {complete && hull && rating && <ResultCard name={hull.name} category="Hull" color={hull.color} rows={rows} rating={rating} badge={mission.name} />}
        </div>
      </div>
    </div>
  );
}
